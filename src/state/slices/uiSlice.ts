import { StateCreator } from 'zustand';

export type Visibility = 'circle'|'following';
export type ShareDraft = {
  type: 'checkin'|'status'|'photo'|'audio';
  visibility: Visibility;
  // check-in specific
  actionTitle?: string; 
  goal?: string; 
  streak?: number; 
  goalColor?: string;
  // content
  text?: string;
  photoUri?: string;
  audioUri?: string;
  promptSeed?: string;
};

export type UiSlice = {
  feedView: Visibility;
  setFeedView: (v:Visibility)=>void;

  // Daily review modal visibility
  isDailyReviewOpen: boolean;
  openDailyReview: () => void;
  closeDailyReview: () => void;
  
  // Onboarding modal visibility
  isOnboardingOpen: boolean;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  
  // NEW: share composer
  shareOpen: boolean;
  shareDraft?: ShareDraft;
  openShare: (draft: ShareDraft)=>void;
  closeShare: ()=>void;
};

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  feedView: 'circle',
  setFeedView: (v)=>set({ feedView:v }),

  isDailyReviewOpen: false,
  openDailyReview: () => {
    if (__DEV__) console.log('🔵 [UI SLICE] openDailyReview called');
    set({ isDailyReviewOpen: true });
  },
  closeDailyReview: () => {
    if (__DEV__) console.log('🔵 [UI SLICE] closeDailyReview called');
    set({ isDailyReviewOpen: false });
  },
  
  isOnboardingOpen: false,
  openOnboarding: () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => set({ isOnboardingOpen: false }),
  
  shareOpen: false,
  shareDraft: undefined,
  openShare: (draft)=>set({ shareOpen: true, shareDraft: draft }),
  closeShare: ()=>set({ shareOpen: false, shareDraft: undefined }),
});