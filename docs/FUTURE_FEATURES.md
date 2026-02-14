# Future Features & Design Decisions

## Multi-Goal Action Linking
**Current State:** Each action can be linked to only ONE goal via `goalId` field.

**Future Consideration:** Should actions be linkable to multiple goals?

### Use Cases
1. **"Morning Meditation" action** could contribute to:
   - Goal: "Reduce Stress" 
   - Goal: "Build Morning Routine"
   - Goal: "Improve Mental Health"

2. **"30 min gym session"** could contribute to:
   - Goal: "Lose 10 lbs"
   - Goal: "Build Strength"
   - Goal: "Improve Energy"

### Design Dilemma
**Option A: Keep 1-to-1 (Current)**
- Pros: Simple, clear accountability, no double-counting
- Cons: Users need duplicate actions for overlapping goals

**Option B: Allow Many-to-Many**
- Pros: More flexible, reflects real life (one action, multiple benefits)
- Cons: Complex consistency calculations, potential gaming of metrics

### Implementation Considerations if Going Many-to-Many
1. **Database Changes:**
   - Remove `goalId` from Action table
   - Create `ActionGoals` junction table
   ```prisma
   model ActionGoals {
     actionId String
     goalId   String
     action   Action @relation(...)
     goal     Goal @relation(...)
     @@id([actionId, goalId])
   }
   ```

2. **Consistency Calculation:**
   - How to handle? Count once per goal? Weight differently?
   - Risk of inflating consistency metrics

3. **UI/UX Changes:**
   - Multi-select when creating actions
   - Show badge count on actions with multiple goals
   - Visual indicator in Daily view

### Recommendation
Stay with 1-to-1 for v1. Gather user feedback. If users frequently request linking actions to multiple goals, implement in v2 with careful consideration of metric integrity.

---

## Other Future Features to Consider

### 1. Historical Consistency Tracking
- Store daily completion snapshots
- Show consistency trends over time
- Weekly/monthly/yearly views

### 2. Goal Templates
- Pre-built goal + actions combinations
- Community-shared templates
- AI-suggested actions based on goal type

### 3. Team/Accountability Partners
- Share specific goals with partners
- Partner can see your consistency
- Mutual accountability features

### 4. Smart Reminders
- Time-based notifications
- Location-based triggers
- Adaptive timing based on completion patterns

### 5. Streak Recovery
- "Freeze" days for vacation/sick days
- Partial credit system
- Streak insurance (1-2 recoveries per month)

### 6. Advanced Analytics
- Correlation between goals
- Best time of day for completion
- Predictive "at risk" warnings

### 7. Integrations
- Calendar sync (block time for actions)
- Fitness trackers (auto-complete exercise actions)
- Habit tracking apps
- Spotify/Apple Music (for focus sessions)

---

## Technical Debt to Address

### 1. Data Persistence
- Currently actions reset daily
- Need to store historical completions
- Separate "Action" (template) from "ActionCompletion" (instance)

### 2. Timezone Handling
- Currently assumes user's local timezone
- Need proper timezone support for travelers

### 3. Offline Support
- Queue actions for sync when online
- Conflict resolution strategy

### 4. Performance
- Pagination for large action lists
- Optimize consistency calculations (cache/memoize)
- Background sync for heavy operations