# Offline Functionality Test Guide

## Test Scenarios

### Scenario 1: Increment then go offline
1. Open the app in browser
2. Increment Counter 1 to value 5
3. Open DevTools → Network tab → Check "Offline"
4. Increment Counter 1 again
5. **Expected**: Counter should show 6 locally, with offline indicator
6. Uncheck "Offline" to restore connection
7. **Expected**: Counter should sync and show correct value on server

### Scenario 2: Offline changes with timestamp conflicts
1. Start with Counter 1 at value 0
2. Go offline (Network tab → Offline)
3. Increment Counter 1 to value 3 (local)
4. In another browser/tab, increment Counter 1 to value 2 (server)
5. Come back online in first browser
6. **Expected**: Counter should show value 3 (local changes win due to newer timestamp)

### Scenario 3: Multiple offline changes
1. Go offline
2. Increment Counter 1: 0 → 1
3. Decrement Counter 1: 1 → 0
4. Increment Counter 1: 0 → 1
5. Come back online
6. **Expected**: Counter should show value 1 (final local state)

### Scenario 4: Server changes while offline
1. Go offline
2. Increment Counter 1 locally to value 2
3. In another browser, increment Counter 1 to value 5
4. Come back online in first browser
5. **Expected**: Counter should show value 2 (local changes preserved)

## How the Sync Works

### Timestamp-based Conflict Resolution
- Each counter has a `lastUpdated` timestamp
- Local changes are stored with timestamps
- When syncing, the system compares timestamps:
  - If local change is newer than server sync time → use local value
  - If server change is newer → use server value

### Data Flow
1. **Online**: Changes sent directly to server, cached locally
2. **Offline**: Changes stored locally with timestamps
3. **Reconnection**: 
   - Fetch latest server data
   - Merge with local changes based on timestamps
   - Update UI with merged result
   - Clear synced pending changes

### Storage Structure
- **Local Storage**: Counter data and pending changes
- **Server**: Counter data with timestamps
- **Sync Logic**: Timestamp comparison for conflict resolution

## Debug Information

### View Local Data
1. Open DevTools → Application tab
2. Local Storage → localhost:3000
3. Check `offline_counters` and `pending_changes`

### View Server Data
1. Open DevTools → Network tab
2. Make a request to `/api/counters`
3. Check response for timestamps

### Monitor Sync Process
1. Open DevTools → Console
2. Watch for sync-related log messages
3. Check pending changes count in UI
