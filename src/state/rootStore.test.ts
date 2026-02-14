import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createDailySlice, DailySlice } from './slices/dailySlice';
import { createGoalsSlice, GoalsSlice } from './slices/goalsSlice';
// import { createSocialSlice, SocialSlice } from './slices/socialSlice'; // REMOVED
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createChallengeSlice, ChallengeSlice } from './slices/challengeSlice';
import { createDailyReviewSlice, DailyReviewSlice } from './slices/dailyReviewSlice';
import { createCirclesSlice, CirclesSlice } from './slices/circlesSlice';
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice';

type RootState = AuthSlice & DailySlice & GoalsSlice & UiSlice & ChallengeSlice & DailyReviewSlice & CirclesSlice & NotificationSlice;
export const useStore = create<RootState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUiSlice(...a),
  ...createGoalsSlice(...a),
  ...createDailySlice(...a),
  // ...createSocialSlice(...a), // REMOVED
  ...createChallengeSlice(...a),
  ...createDailyReviewSlice(...a),
  ...createCirclesSlice(...a),
  ...createNotificationSlice(...a),
}));
