import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createDailySlice, DailySlice } from './slices/dailySlice';
import { createGoalsSlice, GoalsSlice } from './slices/goalsSlice';
import { createSocialSlice, SocialSlice } from './slices/socialSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';
import { createChallengeSlice, ChallengeSlice } from './slices/challengeSlice';
import { createDailyReviewSlice, DailyReviewSlice } from './slices/dailyReviewSlice';
import { createCirclesSlice, CirclesSlice } from './slices/circlesSlice';
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice';
import { createPersist, PersistencePatterns, createMigration } from './persistence';

type RootState = AuthSlice & DailySlice & GoalsSlice & SocialSlice & UiSlice & ChallengeSlice & DailyReviewSlice & CirclesSlice & NotificationSlice;
export const useStore = create<RootState>()(
  createPersist(
    {
      name: 'unity-store',
      version: 2,
      whitelist: [
        // Auth data
        'token', 'user', 'isAuthenticated',
        // Goals data
        'goals',
        // Daily actions data
        'actions', 'completedActions',
        // Social feeds
        'circleFeed', 'followFeed', 'posts', 'unifiedFeed',
        // Challenges
        'globalChallenges', 'circleChallenges', 'activeChallenges',
        // UI preferences
        'feedView',
        // Circles
        'circles', 'activeCircleId'
      ],
      migrate: createMigration({
        2: (state) => ({
          ...state,
          goals: state.goals?.map((goal: any) => ({
            ...goal,
            consistency: goal.consistency || 0,
            status: goal.status || 'On Track',
          })) || [],
        }),
      }),
    },
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUiSlice(...a),
      ...createGoalsSlice(...a),
      ...createDailySlice(...a),
      ...createSocialSlice(...a),
      ...createChallengeSlice(...a),
      ...createDailyReviewSlice(...a),
      ...createCirclesSlice(...a),
      ...createNotificationSlice(...a),
    })
  )
);