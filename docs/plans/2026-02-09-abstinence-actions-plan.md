# Abstinence Actions - Implementation Plan

## Context

**The Problem**: Currently all actions are treated identically — "Meditate 10 min" and "No Social Media" both use the same completion flow and UI. But they're fundamentally different:

- **Active actions** (Meditate, Workout, Read): You DO something → show privacy modal, share completion
- **Abstinence actions** (No Social Media, No Alcohol, No Sugar): You DON'T do something → needs yes/no confirmation first, then optional sharing

**The Goal**: Implement a new abstinence-specific check-off flow that:
1. Asks "Did you stay on track today?" (yes/no)
2. Allows optional comment + photo
3. Shows group/privacy selection
4. Posts with one button

**The approved design**: `/home/marek/Unity-vision/abstinence-modal-v8.html`

---

## Phase 1: Exploration (Current)

Need to understand:
1. Where actions are created (add abstinence toggle)
2. How ActionItem component routes to modals
3. Database schema for actions table
4. How Living Progress Cards vs individual posts work
5. Current social feed post rendering

Will launch exploration agent to map these areas.

---

## Implementation Overview (High Level)

### Database Changes
- Add `is_abstinence` BOOLEAN column to `actions` table
- Make `time` field optional for abstinence actions

### UI Changes
- Action creation: Add "Active / Abstinence" toggle
- Daily screen: Separate abstinence actions (no timeline)
- Action completion: Route to AbstinenceModal for abstinence actions

### New Component
- Create `AbstinenceModal.tsx` based on v8 HTML design
- Yes/No buttons → comment + photo → group selection → Post

### Social Feed
- Abstinence posts show in feed (already supported by TextPostCard)
- Living Progress Cards can include abstinence actions

---

**Next Step**: Launch exploration agent to map current implementation before detailed planning.
