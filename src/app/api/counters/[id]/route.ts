import { NextRequest, NextResponse } from 'next/server';
import { updateCounter, deleteCounter, getCounter } from '@/lib/counters';
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
  const { name, value, dailyGoal, dailyCount, history, currentUser } = body;

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

    // Use Supabase updateCounter for persistence (name, value, dailyGoal)
  const updateFields: Record<string, string | number> = { name: name.trim(), value };
  if (typeof dailyGoal === 'number') updateFields.dailyGoal = dailyGoal;

    // Handle dailyCount adjustment
    if (typeof dailyCount === 'number') {
      updateFields.dailyCount = dailyCount;

      // If dailyCount is provided, recalculate today's history to match
      const currentCounter = await getCounter(id);
      if (currentCounter?.history) {
        const today = getTodayStringUTC(); // Use UTC-based date
        const adjustedHistory = { ...currentCounter.history };

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
    console.error('Error updating counter:', error);
    return NextResponse.json(
      { error: 'Failed to update counter' },
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
    if (!deleted) {
      return NextResponse.json(
        { error: 'Counter not found' },
        { status: 404 }
      );
    }
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
    console.error('Error deleting counter:', error);
    return NextResponse.json(
      { error: 'Failed to delete counter' },
      { status: 500 }
    );
  }
}
