# Workflow Comparison: Linking vs No Linking

## Workflow A: WITHOUT Linking (WORKS)
1. User selects activities in JoinChallengeModal
2. Clicks "Join Challenge" → `handleJoin()` called
3. ActivityLinkingModal opens → User clicks "Skip Linking"
4. `handleLinkingSkip()` → calls `handleLinkingComplete({})`
5. TimeSetupModal opens with ALL activities
6. User sets times for ALL activities
7. `handleTimeSetupComplete()` receives times for ALL activities
8. Challenge joined, activities saved with times
9. Modal closes, refreshes happen
10. Activities appear on Daily with times ✅

## Workflow B: WITH Linking (BROKEN)
1. User selects activities in JoinChallengeModal
2. Clicks "Join Challenge" → `handleJoin()` called
3. ActivityLinkingModal opens → User links some/all activities
4. `handleLinkingComplete(links)` called with mappings
5. TimeSetupModal opens but...
   - If ALL linked: `needsTimeSetup = false`
   - useEffect fires, calls `onComplete({})` with empty times
6. `handleTimeSetupComplete({})` receives EMPTY times object
7. Challenge joined but NO TIMES saved for linked activities
8. Modal gets stuck (because of async timing issues)
9. Activities appear on Daily WITHOUT times ❌

## The Problem
When activities are linked, we're not preserving their existing times OR setting new times. The TimeSetupModal skips too early and returns empty times.

## Key Code Issues

### Issue 1: TimeSetupModal.tsx (line 132-138)
```typescript
React.useEffect(() => {
  if (visible && !needsTimeSetup) {
    // This fires immediately, doesn't wait for proper flow
    setTimeout(() => onComplete({}), 100);
  }
}, [visible, needsTimeSetup]); // Missing onComplete dependency
```

### Issue 2: JoinChallengeModal.tsx (line 134-194)
```typescript
const handleTimeSetupComplete = async (times: Record<string, string>) => {
  // When times is empty {}, nothing gets saved
  // But linked activities should still have times!
}
```

### Issue 3: Missing linked activity times
Linked activities should use their existing action times, but we're not fetching or passing those through.

## Solution Needed
1. For linked activities, fetch their existing times from the regular actions
2. Pass those times through even when skipping TimeSetupModal
3. Fix the useEffect to not fire prematurely
4. Ensure modal closes properly after all operations