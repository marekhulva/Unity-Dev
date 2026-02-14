# Issue #13 Fix: Add Edit/Delete Functionality for Actions

**Date**: 2026-02-10
**Priority**: 2
**Status**: COMPLETED

## Problem
Users who create wrong actions are stuck with them forever. No edit or delete UI exists. This creates a poor user experience when mistakes are made during action creation.

## Solution
Added long-press gesture to reveal edit/delete menu for user-created actions on the Daily screen.

## Implementation Details

### Files Modified
1. `/home/marek/Unity-vision/src/features/daily/DailyScreenOption2.tsx`
   - Added edit/delete functionality with long-press gesture
   - Added protection to prevent editing/deleting challenge activities
   - Added action menu modal UI

### Key Features

#### 1. Long-Press to Edit/Delete
- Users can long-press any action card to reveal edit/delete options
- Menu appears as a centered modal with blur overlay
- Luxury black/gold theme matching app design

#### 2. Challenge Activity Protection
- Challenge activities are identified by `isFromChallenge` flag
- Long-pressing a challenge activity shows informative alert:
  ```
  "Challenge Activity"
  "Challenge activities cannot be edited or deleted.
   They are managed by your active challenges."
  ```
- Only user-created regular actions can be edited/deleted

#### 3. Edit Functionality
- Opens native Alert.prompt to edit action title
- Pre-fills with current title
- Updates action via `updateAction()` from dailySlice
- Provides haptic feedback on save

#### 4. Delete Functionality
- Shows confirmation dialog before deletion
- Clear warning: "This action cannot be undone"
- Deletes via `deleteAction()` from dailySlice
- Refreshes action list after deletion
- Provides strong error haptic feedback

### Code Changes

#### State Management
```typescript
const [showActionMenu, setShowActionMenu] = useState(false);
const [actionToEdit, setActionToEdit] = useState<any>(null);
```

#### Handler Functions
```typescript
// Handles long-press on action cards
const handleActionLongPress = (action: any) => {
  if (action.isFromChallenge) {
    // Show protection alert
    return;
  }
  setActionToEdit(action);
  setShowActionMenu(true);
  HapticManager.interaction.longPress();
};

// Edit action title
const handleEditAction = () => {
  // Shows Alert.prompt with current title
  // Calls updateAction() on save
};

// Delete action with confirmation
const handleDeleteAction = () => {
  // Shows confirmation alert
  // Calls deleteAction() then refreshes
};
```

#### UI Updates
```typescript
// Added to both abstinence and timed action Pressables:
<Pressable
  onPress={() => handleTaskToggle(action)}
  onLongPress={() => handleActionLongPress(action)}
>
  {/* action card content */}
</Pressable>
```

#### Action Menu Modal
```typescript
{showActionMenu && actionToEdit && (
  <Pressable style={styles.actionMenuOverlay} onPress={closeMenu}>
    <BlurView intensity={20} tint="dark">
      <View style={styles.actionMenu}>
        <Pressable onPress={handleEditAction}>
          <Edit3 icon />
          <Text>Edit Action</Text>
        </Pressable>
        <Pressable onPress={handleDeleteAction}>
          <Trash2 icon color="#ef4444" />
          <Text color="#ef4444">Delete Action</Text>
        </Pressable>
      </View>
    </BlurView>
  </Pressable>
)}
```

### Styling
- `actionMenuOverlay`: Full-screen overlay with blur
- `actionMenu`: Centered dark card with gold accents
- `menuItem`: Row layout with icon + text
- `menuDivider`: Subtle separator between items
- Destructive delete option in red (#ef4444)

### Icons Used
- `Edit3` from lucide-react-native (edit action)
- `Trash2` from lucide-react-native (delete action)

## User Experience Flow

### Happy Path - Edit Action
1. User long-presses action card
2. Menu appears with Edit/Delete options
3. User taps "Edit Action"
4. Native prompt shows with current title
5. User edits title and taps "Save"
6. Action updates immediately
7. Menu closes, success haptic plays

### Happy Path - Delete Action
1. User long-presses action card
2. Menu appears with Edit/Delete options
3. User taps "Delete Action"
4. Confirmation alert appears
5. User confirms deletion
6. Action deleted from database
7. Action list refreshes
8. Strong error haptic plays (indicates destructive action)

### Protection Path - Challenge Activity
1. User long-presses challenge activity
2. Info alert appears explaining protection
3. Menu does NOT appear
4. User understands challenge activities can't be modified

## Database Integration

### Update Action
- Uses `updateAction(id, updates)` from dailySlice
- Currently only updates title
- Backend: `backendService.updateAction()`

### Delete Action
- Uses `deleteAction(id)` from dailySlice
- Permanently removes from database
- Backend: `backendService.deleteAction()`
- Calls `fetchDailyActions()` to refresh list

## Future Enhancements

### Potential Improvements
1. **Full Edit Modal** - Replace Alert.prompt with custom modal
   - Edit title, time, frequency, scheduled days
   - Time picker for easier time selection
   - Frequency selector (daily, 3x/week, weekly, etc.)
   - Visual preview of changes

2. **Edit Challenge Completion** - Allow editing completion notes
   - Keep completion status (can't undo completion)
   - Allow adding/editing photos and comments
   - Maintains social accountability while allowing improvements

3. **Batch Operations** - Select multiple actions
   - Bulk delete for clearing out old actions
   - Bulk time adjustment
   - Bulk goal reassignment

4. **Undo Delete** - Soft delete with recovery
   - Keep deleted actions for 30 days
   - "Restore" option in settings
   - Permanent delete after grace period

## Testing Checklist

- [x] Long-press on regular action shows menu
- [x] Long-press on challenge activity shows protection alert
- [x] Edit action updates title successfully
- [x] Delete action removes from list
- [x] Confirmation required before delete
- [x] Menu closes on background tap
- [x] Haptic feedback works correctly
- [x] UI follows luxury theme
- [x] Works on both abstinence and timed actions
- [x] No duplicate actions after edit
- [x] Error handling for failed delete/update

## Known Limitations

1. **Title-Only Edit** - Current implementation only edits title
   - Time, frequency, and other fields require separate implementation
   - Alert.prompt only supports single text input
   - Full edit modal needed for complete editing

2. **No Undo** - Deletion is permanent
   - Users must confirm, but can't reverse
   - Soft delete could be added later

3. **No Bulk Operations** - One action at a time
   - Could be slow for users with many actions
   - Multi-select UI could improve this

## Impact

### User Benefits
- ✅ Can fix typos in action titles
- ✅ Can remove unwanted actions
- ✅ Better control over daily routine
- ✅ No more stuck with mistakes

### System Benefits
- ✅ Cleaner user action lists
- ✅ Reduced database clutter
- ✅ Better user satisfaction
- ✅ Maintains challenge integrity (no accidental deletions)

## Related Issues
- Issue #1: Streaks disabled (not affected by this fix)
- Issue #11: Weekly progress updates (not affected)

## Rollback Instructions
If this feature causes issues, revert:
1. Remove long-press handlers from Pressables
2. Remove handleActionLongPress, handleEditAction, handleDeleteAction
3. Remove showActionMenu and actionToEdit state
4. Remove action menu modal UI
5. Remove menu styles from StyleSheet

The app will function as before with no edit/delete capability.
