# Dashboard Loading Bug Fix

## Problem
After page refresh, the dashboard showed infinite loading spinners ("...") in stat cards instead of displaying session counts and scores.

## Root Causes Identified

1. **AuthContext blocking forever**:
   - `onAuthStateChange` handler called `fetchAndSetRole()` without timeout
   - Supabase profile fetch could hang indefinitely
   - `authLoading` stayed `true`, blocking dashboard from loading data

2. **Duplicate INITIAL_SESSION processing**:
   - Both `initAuth()` and `onAuthStateChange` processed the same session
   - Double processing could cause race conditions

3. **No timeout in dashboard data fetching**:
   - `fetchUserStats()` had no timeout wrapper around Supabase query
   - If database was slow, loading state never cleared

## Solutions Implemented

### 1. AuthContext Timeouts (`src/contexts/AuthContext.tsx`)

```typescript
// initAuth - 2.5 second timeout
await Promise.race([
  fetchAndSetRole(session.user, 'INITIAL_SESSION'),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2500))
]);

// onAuthStateChange - 4 second timeout + skip INITIAL_SESSION duplication
if (event === 'INITIAL_SESSION') {
  if (mounted) setLoading(false);
  return; // Skip, already handled by initAuth
}

await Promise.race([
  fetchAndSetRole(currentUser, event),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Auth state timeout')), 4000))
]);
```

### 2. Dashboard Stats Timeout (`src/pages/CandidateDashboard.tsx`)

```typescript
// 8 second timeout on Supabase query
const fetchPromise = supabase
  .from('interview_sessions')
  .select('id, interview_type, status, difficulty_level, score, created_at')
  .eq('candidate_id', user.id)
  .order('created_at', { ascending: false });

const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Stats fetch timeout')), 8000)
);

const { data: sessions, error } = await Promise.race([fetchPromise, timeoutPromise]);
```

### 3. Failsafe Timer Reduced

```typescript
// Changed from 10 seconds to 6 seconds
setTimeout(() => {
  if (loading && mounted.current) {
    console.warn('CandidateDashboard: Loading timed out, forcing display with cached data');
    setLoading(false);
  }
}, 6000);
```

### 4. Cached Data Fallback

- Dashboard now uses `localStorage` to cache stats
- On timeout, shows cached data with a toast notification
- Users see their previous stats immediately on page load

## Timeline of Loading States

### Before Fix:
```
Page Load → authLoading: true (stuck) → Dashboard loading: true (stuck forever) → "..." shown
```

### After Fix:
```
Page Load → authLoading: true → timeout at 2.5s → authLoading: false
         → Dashboard loading: true → timeout at 8s → loading: false → Show cached/fetched data
         → Failsafe at 6s ensures loading clears even if promises hang
```

## User Experience Improvements

✅ **Maximum wait time**: 6 seconds (down from infinite)
✅ **Cached data display**: Instant stat cards on page load
✅ **Clear feedback**: Toast messages when data loading times out
✅ **No blocking**: Navigation and other features work even during timeout
✅ **Graceful degradation**: Shows last known data instead of spinner

## Testing Instructions

1. **Normal Operation**: Refresh dashboard - should load within 2-3 seconds
2. **Slow Network**: Throttle network in DevTools - should show cached data + timeout toast
3. **Database Unavailable**: Stop Supabase - should show cached data after 6 seconds
4. **Fresh Load**: Clear localStorage and refresh - should load or timeout gracefully

## Performance Metrics

- **Auth initialization**: Max 2.5s
- **Dashboard stats fetch**: Max 8s  
- **Failsafe trigger**: 6s
- **Total worst case**: 6 seconds to show UI (previously: infinite)

## Files Modified

1. `src/contexts/AuthContext.tsx` - Auth loading timeouts
2. `src/pages/CandidateDashboard.tsx` - Stats fetching timeout + failsafe
