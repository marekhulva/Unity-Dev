/**
 * Instagram-style visibility mapping utilities
 */

import { Visibility } from '../state/slices/socialSlice';

/**
 * Maps old visibility values to new Instagram-style model
 */
export const mapLegacyVisibility = (oldVisibility: string): Visibility => {
  switch (oldVisibility) {
    case 'circle':
      return 'circle';  // Keep as is
    case 'follow':
      return 'followers';  // 'follow' becomes 'followers'
    default:
      return 'followers';  // Default to followers
  }
};

/**
 * Get visibility label for UI display
 */
export const getVisibilityLabel = (visibility: Visibility): string => {
  switch (visibility) {
    case 'private':
      return 'Only Me';
    case 'circle':
      return 'Close Friends';  // Instagram terminology
    case 'followers':
      return 'Following';  // Changed to "Following" since we only have Following functionality, not Followers
    default:
      return 'Following';
  }
};

/**
 * Get visibility icon/emoji
 */
export const getVisibilityIcon = (visibility: Visibility): string => {
  switch (visibility) {
    case 'private':
      return '🔒';
    case 'circle':
      return '⭐';  // Star for close friends like Instagram
    case 'followers':
      return '👥';
    default:
      return '👥';
  }
};

/**
 * Check if user can see post based on visibility and relationship
 * Note: 'followers' visibility means "people who follow the poster can see it"
 * but since we only have Following functionality (not Followers tracking),
 * this effectively means "public to all users you follow" in the Following feed
 */
export const canUserSeePost = (
  postVisibility: Visibility,
  isOwner: boolean,
  isInCircle: boolean,
  isFollower: boolean  // This would be "does this user follow the poster" if we had follower tracking
): boolean => {
  // Owner can always see their own posts
  if (isOwner) return true;
  
  switch (postVisibility) {
    case 'private':
      return false;  // Only owner can see
    case 'circle':
      return isInCircle;  // Only circle members
    case 'followers':
      return isInCircle || isFollower;  // In practice: visible in Following feed to people you follow
    default:
      return false;
  }
};