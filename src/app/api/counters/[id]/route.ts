import { NextRequest, NextResponse } from 'next/server';
import { updateCounter, deleteCounter, getCounter, addCounter } from '@/lib/counters';
import { broadcastUpdate } from '../../sync/broadcast';
import { getTodayString, getTodayWeekdayUTC } from '@/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, value, dailyGoal, dailyCount, currentUser, counter_text } = body;
    const normalizedUser = currentUser ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1).toLowerCase() : undefined;

    const isTextOnlyUpdate =
      counter_text !== undefined &&
      name === undefined &&
      value === undefined &&
      dailyGoal === undefined &&
      dailyCount === undefined;

    if (isTextOnlyUpdate) {
      const existingCounter = await getCounter(id);
      if (!existingCounter) {
        return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
      }
      const updatedCounter = await updateCounter(id, { counter_text: counter_text ?? null });
      if (!updatedCounter) {
        return NextResponse.json({ error: 'Counter not found' }, { status: 404 });
      }
      broadcastUpdate({
        type: 'counter_updated',
        counter: updatedCounter,
        timestamp: Date.now(),
        user: currentUser || null
      });
      return NextResponse.json({ counter: updatedCounter, timestamp: Date.now() });
    }

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
        lastUpdated: Date.now(),
        counter_text: counter_text ?? null
      });

      console.log(`Created new counter ${id} with name: ${newCounter.name}`);
      counterToUpdate = newCounter;
    }

    if (!counterToUpdate) {
      return NextResponse.json({ error: 'Failed to create counter' }, { status: 500 });
    }

    const updateFields: Record<string, string | number | null> = { name: name.trim(), value };
    if (typeof dailyGoal === 'number') updateFields.dailyGoal = dailyGoal;
    if (typeof dailyCount === 'number') updateFields.dailyCount = dailyCount;
    if (counter_text !== undefined) updateFields.counter_text = counter_text ?? null;

    // Handle dailyCount adjustment
    if (typeof dailyCount === 'number') {
      // If dailyCount is provided, recalculate today's history to match
      if (counterToUpdate?.history) {
        const today = getTodayString();
        const dayName = getTodayWeekdayUTC();
        const adjustedHistory = { ...counterToUpdate.history };
        const currentUsers = { ...(counterToUpdate.users || {}) };

        if (adjustedHistory[today]) {
          // If this is a reset (dailyCount === 0), clear today's history
          if (dailyCount === 0) {
            console.log('🔄 Resetting history for today:', today);
            adjustedHistory[today] = {
              users: {},
              total: 0,
              day: dayName
            };
            Object.keys(currentUsers).forEach(userKey => {
              delete currentUsers[userKey];
            });
          } else {
            const existingEntry = adjustedHistory[today];
            const previousTotal = typeof existingEntry.total === 'number' ? existingEntry.total : 0;

            const normalizedExistingUsers = existingEntry.users
              ? Object.entries(existingEntry.users).reduce<Record<string, number>>((acc, [userKey, count]) => {
                  const numericCount = typeof count === 'number' ? count : Number(count);
                  acc[userKey] = Number.isFinite(numericCount) ? numericCount : 0;
                  return acc;
                }, {})
              : {};

            if (normalizedUser) {
              const delta = dailyCount - previousTotal;
              if (delta > 0) {
                normalizedExistingUsers[normalizedUser] = (normalizedExistingUsers[normalizedUser] ?? 0) + delta;
              }
            }

            adjustedHistory[today] = {
              ...existingEntry,
              day: dayName,
              total: dailyCount,
              users: normalizedExistingUsers
            };

            let todayUsers = adjustedHistory[today].users || {};
            const userKeys = Object.keys(todayUsers);
            const userTotal = Object.values(todayUsers).reduce((sum, count) => sum + (count as number), 0);
            if (userTotal !== dailyCount) {
              if (userKeys.length > 0 && userTotal > 0) {
                const scaleFactor = dailyCount / userTotal;
                let scaledTotal = 0;
                todayUsers = userKeys.reduce<Record<string, number>>((acc, userKey, index) => {
                  const scaledValue = Math.max(0, Math.round((todayUsers[userKey] as number) * scaleFactor));
                  acc[userKey] = scaledValue;
                  scaledTotal += scaledValue;
                  // Adjust for rounding error on last user
                  if (index === userKeys.length - 1) {
                    const diff = dailyCount - scaledTotal;
                    if (diff !== 0) {
                      acc[userKey] = Math.max(0, acc[userKey] + diff);
                      scaledTotal += diff;
                    }
                  }
                  return acc;
                }, {});
              } else if (normalizedUser) {
                todayUsers = { [normalizedUser]: dailyCount };
              } else {
                todayUsers = {};
              }
              adjustedHistory[today].users = todayUsers;
            }

            adjustedHistory[today].users = Object.entries(adjustedHistory[today].users || {}).reduce<Record<string, number>>((acc, [userKey, count]) => {
              const numericCount = typeof count === 'number' ? count : Number(count);
              if (numericCount > 0) {
                acc[userKey] = numericCount;
              }
              return acc;
            }, {});

            adjustedHistory[today].total = dailyCount;
          }
        } else {
          // Create today's history entry if it doesn't exist
          adjustedHistory[today] = {
            users: normalizedUser && dailyCount > 0 ? { [normalizedUser]: dailyCount } : {},
            total: dailyCount,
            day: dayName
          };
        }

        // Update with the adjusted history
        const usersForToday = adjustedHistory[today]?.users ? { ...adjustedHistory[today].users } : {};
        const updatedCounter = await updateCounter(id, { ...updateFields, history: adjustedHistory, users: usersForToday });
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
