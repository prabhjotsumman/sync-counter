import { NextRequest, NextResponse } from 'next/server';
import { updateCounter, deleteCounter, getCounter, addCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../sync/broadcast';

/**
 * Gets today's date in UTC using YYYY-MM-DD format
 * @returns Today's date string in YYYY-MM-DD format (UTC)
 */
const getTodayStringUTC = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
  const { name, value, dailyGoal, dailyCount, currentUser } = body;

    console.log('🔧 Server edit request:', {
      id,
      name,
      value,
      dailyGoal,
      dailyCount,
      currentUser,
      resetRequested: dailyCount === 0
    });

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Counter name is required' },
        { status: 400 }
      );
    }

    // Check if counter exists, create if it doesn't
    const currentCounter = await getCounter(id);
    let counterToUpdate = currentCounter;

    if (!currentCounter) {
      console.log(`Counter ${id} not found, creating new counter`);

      // Create a new counter with the provided data
      const newCounter = await addCounter({
        id,
        name: name.trim(),
        value: value || 0,
        dailyGoal: dailyGoal || 0,
        dailyCount: dailyCount || 0,
        users: {},
        history: {},
        lastUpdated: Date.now()
      });

      console.log(`Created new counter ${id} with name: ${newCounter.name}`);
      counterToUpdate = newCounter;
    }

    if (!counterToUpdate) {
      return NextResponse.json({ error: 'Failed to create counter' }, { status: 500 });
    }

    const updateFields: Record<string, string | number> = { name: name.trim(), value };
    if (typeof dailyGoal === 'number') updateFields.dailyGoal = dailyGoal;

    // Handle dailyCount adjustment
    if (typeof dailyCount === 'number') {
      updateFields.dailyCount = dailyCount;

      // If dailyCount is provided, recalculate today's history to match
      if (counterToUpdate?.history) {
        const today = getTodayStringUTC(); // Use UTC-based date
        const adjustedHistory = { ...counterToUpdate.history };

        if (adjustedHistory[today]) {
          // If this is a reset (dailyCount === 0), clear today's history
          if (dailyCount === 0) {
            console.log('🔄 Resetting history for today:', today);
            adjustedHistory[today] = {
              users: {},
              total: 0,
              day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
            };
          } else {
            // Update today's history to match the new dailyCount
            adjustedHistory[today] = {
              ...adjustedHistory[today],
              total: dailyCount,
              // Keep existing user contributions but ensure total matches dailyCount
              users: adjustedHistory[today].users || {},
            };

            // Ensure the total matches the sum of user contributions
            const userTotal = Object.values(adjustedHistory[today].users).reduce((sum, count) => sum + (count as number), 0);
            if (userTotal !== dailyCount) {
              // If user contributions don't match dailyCount, scale them proportionally
              const userKeys = Object.keys(adjustedHistory[today].users);
              if (userKeys.length > 0 && userTotal > 0) {
                const scaleFactor = dailyCount / userTotal;
                userKeys.forEach(userKey => {
                  adjustedHistory[today].users[userKey] = Math.round((adjustedHistory[today].users[userKey] as number) * scaleFactor);
                });
                // Recalculate total after scaling
                adjustedHistory[today].total = Object.values(adjustedHistory[today].users).reduce((sum, count) => sum + (count as number), 0);
              } else {
                // If no user contributions or they're 0, set total to match dailyCount
                adjustedHistory[today].total = dailyCount;
              }
            }
          }
        } else {
          // Create today's history entry if it doesn't exist
          adjustedHistory[today] = {
            users: {},
            total: dailyCount,
            day: new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
          };
        }

        // Update with the adjusted history
        const updatedCounter = await updateCounter(id, { ...updateFields, history: adjustedHistory });
        if (!updatedCounter) {
          return NextResponse.json(
            { error: 'Counter not found' },
            { status: 404 }
          );
        }
        // Broadcast and return
        broadcastUpdate({
          type: 'counter_updated',
          counter: updatedCounter,
          timestamp: Date.now(),
          user: currentUser || null
        });
        return NextResponse.json({
          counter: updatedCounter,
          timestamp: Date.now()
        });
      }
    }

    const updatedCounter = await updateCounter(id, updateFields);
    if (!updatedCounter) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }
    // Optionally update local DB if running locally (handled in updateCounter)
    const response = {
      counter: updatedCounter,
      timestamp: Date.now()
    };
    broadcastUpdate({
      type: 'counter_updated',
      counter: updatedCounter,
      timestamp: Date.now(),
      user: currentUser || null
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ PUT /api/counters/[id] - Error updating counter:', error);

    // Check if it's a table not found error
    if (error instanceof Error && error.message?.includes('relation "counters" does not exist')) {
      return NextResponse.json(
        {
          error: 'Database table not found. Please run the database setup SQL in your Supabase dashboard.',
          details: 'Go to Supabase SQL Editor and run the SQL from database-setup.sql'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update counter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // const body = await request.json().catch(() => ({})); // removed unused
    // Use Supabase deleteCounter for persistence
    const deleted = await deleteCounter(id);
    // Even if the counter doesn't exist, deletion is considered successful
    const response = {
      counter: { id },
      timestamp: Date.now()
    };
    broadcastUpdate({
      type: 'counter_deleted',
      counter: { id },
      timestamp: Date.now()
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ DELETE /api/counters/[id] - Error deleting counter:', error);

    // Check if it's a table not found error
    if (error instanceof Error && error.message?.includes('relation "counters" does not exist')) {
      return NextResponse.json(
        {
          error: 'Database table not found. Please run the database setup SQL in your Supabase dashboard.',
          details: 'Go to Supabase SQL Editor and run the SQL from database-setup.sql'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete counter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
