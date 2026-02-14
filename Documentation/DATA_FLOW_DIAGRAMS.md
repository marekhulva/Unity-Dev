# Data Flow Diagrams

## Visual Data Flows for Key User Journeys

### 1. User Onboarding Flow
```mermaid
graph TD
    A[User Opens App] --> B{Authenticated?}
    B -->|No| C[Show Auth Screen]
    B -->|Yes| D[Check Profile Exists]
    C --> E[User Signs Up]
    E --> F[Supabase Auth Creates User]
    F --> G[Trigger Creates Empty Profile]
    G --> H[Redirect to Profile Setup]
    H --> I[User Enters Username/Name]
    I --> J[Save to Profiles Table]
    J --> K[Navigate to Main App]
    D -->|No Profile| H
    D -->|Has Profile| K
```

### 2. Daily Action Completion Flow
```mermaid
graph LR
    A[User Taps Checkbox] --> B[dailySlice.toggleAction]
    B --> C[Optimistic UI Update]
    B --> D[backendService.completeAction]
    D --> E[supabaseService.completeAction]
    E --> F{Already Completed?}
    F -->|No| G[INSERT action_completions]
    F -->|Yes| H[Skip Insert]
    G --> I[UPDATE actions table]
    H --> I
    I --> J[Return Success]
    J --> K[Update Local State]
    K --> L[Trigger Consistency Recalc]
    L --> M[Update UI Components]
```

### 3. Consistency Calculation Data Flow
```mermaid
graph TB
    A[Component Needs Stats] --> B[Call getGoalCompletionStats]
    B --> C[For Each Goal]
    C --> D[Get Goal Creation Date]
    D --> E[Calculate Days Active]
    E --> F[Count Linked Actions]
    F --> G[Expected = Actions × Days]
    G --> H[Query action_completions]
    H --> I[Count Completed]
    I --> J[Calculate Percentage]
    J --> K[Add to Results Map]
    K --> C
    K --> L[Return All Stats]
    L --> M[Update UI Display]
```

### 4. Circle Leaderboard Flow
```mermaid
graph TD
    A[User Opens Circle Tab] --> B[Check circleId in Store]
    B --> C{Has Circle?}
    C -->|No| D[Show Join Prompt]
    C -->|Yes| E[loadCircleData]
    E --> F[Fetch Circle Info]
    E --> G[Fetch Circle Members]
    G --> H[For Each Member]
    H --> I[getOverallCompletionStats]
    I --> J[Query action_completions]
    J --> K[Calculate Consistency %]
    K --> L[Calculate Trend]
    L --> M[Add to Member Stats]
    M --> H
    M --> N[Sort by Consistency]
    N --> O[Render Leaderboard]
```

### 5. Social Post Creation Flow
```mermaid
graph LR
    A[User Creates Post] --> B[Add Media?]
    B -->|Yes| C[Upload to Storage]
    B -->|No| D[Prepare Post Data]
    C --> D
    D --> E[Set Privacy Level]
    E --> F{Privacy Type}
    F -->|Public| G[Set circle_id = null]
    F -->|Circle| H[Set circle_id]
    F -->|Private| I[Set private flag]
    G --> J[INSERT into posts]
    H --> J
    I --> J
    J --> K[Real-time Broadcast]
    K --> L[Update Followers' Feeds]
```

### 6. Daily Review Submission Flow
```mermaid
graph TD
    A[User Completes Day] --> B[Show Review Modal]
    B --> C[Step 1: Biggest Win]
    C --> D[Auto-save Draft]
    C --> E[Step 2: Challenge]
    E --> F[Auto-save Draft]
    E --> G[Step 3: Lesson]
    G --> H[Auto-save Draft]
    G --> I[Step 4: Energy/Mood]
    I --> J[Final Save]
    J --> K[INSERT/UPDATE daily_reviews]
    K --> L[Close Modal]
    L --> M[Update Progress Stats]
```

## State Management Flow

### 7. Zustand State Update Cycle
```mermaid
graph TD
    A[User Action] --> B[Call Store Method]
    B --> C[Update Local State]
    C --> D[Trigger API Call]
    D --> E{Success?}
    E -->|Yes| F[Confirm State]
    E -->|No| G[Revert State]
    G --> H[Show Error]
    F --> I[Notify Subscribers]
    I --> J[Re-render Components]
```

### 8. Authentication State Flow
```mermaid
graph TD
    A[App Starts] --> B[Check AsyncStorage]
    B --> C{Has Token?}
    C -->|No| D[Show Auth Screen]
    C -->|Yes| E[Validate with Supabase]
    E --> F{Valid?}
    F -->|No| D
    F -->|Yes| G[Set User in Store]
    G --> H[Load User Data]
    H --> I[Fetch Profile]
    H --> J[Fetch Goals]
    H --> K[Fetch Actions]
    I --> L[Ready State]
    J --> L
    K --> L
```

## Database Transaction Flows

### 9. Action Creation with Goal Link
```mermaid
graph LR
    A[Create Action Form] --> B[Select Goal]
    B --> C[Set Frequency]
    C --> D[Set Time]
    D --> E[Submit]
    E --> F[Validate Data]
    F --> G[INSERT into actions]
    G --> H{Daily Repeat?}
    H -->|Yes| I[Create for 30 days]
    H -->|No| J[Single Entry]
    I --> K[Batch INSERT]
    J --> L[Update Goal Stats]
    K --> L
```

### 10. Consistency Recovery Flow
```mermaid
graph TD
    A[Detect 0% Consistency] --> B[Check Permissions]
    B --> C{Has Access?}
    C -->|No| D[Run Migration]
    D --> E[Fix RLS Policies]
    E --> F[Grant Permissions]
    F --> G[Retry Query]
    C -->|Yes| G
    G --> H[Query action_completions]
    H --> I[Recalculate Stats]
    I --> J[Update Display]
```

## Real-time Data Flows

### 11. Real-time Circle Updates
```mermaid
graph LR
    A[Member Completes Action] --> B[Update Database]
    B --> C[Trigger Broadcast]
    C --> D[Supabase Realtime]
    D --> E[Notify Subscribers]
    E --> F[Other Members' Apps]
    F --> G[Update Leaderboard]
    G --> H[Animate Changes]
```

### 12. Push Notification Flow (Future)
```mermaid
graph TD
    A[Scheduled Time] --> B[Check Pending Actions]
    B --> C{Has Actions?}
    C -->|Yes| D[Generate Notification]
    C -->|No| E[Skip]
    D --> F[Send via Expo Push]
    F --> G[User Receives]
    G --> H[Tap Notification]
    H --> I[Open Daily Screen]
    I --> J[Show Today's Actions]
```

## Error Handling Flows

### 13. API Error Recovery
```mermaid
graph TD
    A[API Call] --> B{Success?}
    B -->|No| C{Retry Count < 3?}
    C -->|Yes| D[Wait 1s]
    D --> E[Retry Call]
    E --> B
    C -->|No| F{Network Error?}
    F -->|Yes| G[Queue for Offline]
    F -->|No| H[Show Error Message]
    G --> I[Store in AsyncStorage]
    I --> J[Retry on Reconnect]
    B -->|Yes| K[Process Response]
```

### 14. Data Sync Flow
```mermaid
graph TD
    A[App Becomes Active] --> B[Check Last Sync]
    B --> C{> 5 min ago?}
    C -->|Yes| D[Fetch Updates]
    C -->|No| E[Skip Sync]
    D --> F[Get Latest Actions]
    D --> G[Get Latest Posts]
    D --> H[Get Circle Updates]
    F --> I[Merge with Local]
    G --> I
    H --> I
    I --> J[Update UI]
```

## Performance Optimization Flows

### 15. Lazy Loading Pattern
```mermaid
graph LR
    A[Screen Mount] --> B[Load Essential Data]
    B --> C[Render UI]
    C --> D[User Scrolls]
    D --> E{Near Bottom?}
    E -->|Yes| F[Load Next Page]
    E -->|No| G[Wait]
    F --> H[Append to List]
    H --> I[Update UI]
    I --> D
```

### 16. Cache Strategy Flow
```mermaid
graph TD
    A[Request Data] --> B{In Cache?}
    B -->|Yes| C{Fresh?}
    C -->|Yes| D[Return Cached]
    C -->|No| E[Fetch Fresh]
    B -->|No| E
    E --> F[Update Cache]
    F --> G[Return Data]
    D --> G
```

## Key Data Flow Principles

### 1. Optimistic Updates
- Update UI immediately
- Sync with backend async
- Revert on failure

### 2. Single Source of Truth
- Database is authoritative
- Local state for performance
- Sync regularly

### 3. Fail Gracefully
- Queue offline actions
- Show cached data
- Retry with backoff

### 4. Security First
- RLS on all tables
- Validate on backend
- Never trust client

### 5. Performance Patterns
- Lazy load lists
- Debounce searches
- Cache frequently used
- Batch operations

## Quick Reference: Data Flow Entry Points

| User Action | Entry Point | Data Flow |
|------------|-------------|-----------|
| Check action | `dailySlice.toggleAction()` | Flow #2 |
| View progress | `getGoalCompletionStats()` | Flow #3 |
| Join circle | `joinCircle()` | Flow #4 |
| Create post | `createPost()` | Flow #5 |
| Complete review | `saveDailyReview()` | Flow #6 |
| Open app | `checkAuth()` | Flow #8 |
| Create goal | `createGoal()` | Flow #9 |

## Tools for Visualization

To render these diagrams:
1. **Mermaid Live Editor**: https://mermaid.live
2. **VS Code Extension**: Mermaid Preview
3. **GitHub**: Renders mermaid blocks automatically

---

Last Updated: September 23, 2025
Next: See DATA_ARCHITECTURE.md for detailed schema