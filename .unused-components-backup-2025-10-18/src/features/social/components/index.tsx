export { PostCardBase } from './PostCardBase';
export { PostCardBaseV2 } from './PostCardBaseV2';
export { PostCardBaseV3 } from './PostCardBaseV3';
export { CheckinCard } from './CheckinCard';
export { StatusCard } from './StatusCard';
export { PhotoCard } from './PhotoCard';
export { AudioCard } from './AudioCard';

import React from 'react';
import { Post } from '../../../../state/slices/socialSlice';
import { CheckinCard } from './CheckinCard';
import { StatusCard } from './StatusCard';
import { PhotoCard } from './PhotoCard';
import { AudioCard } from './AudioCard';
import { CheckinCardV2 } from './CheckinCardV2';
import { CheckinCardV3 } from './CheckinCardV3';
import { useSocialV1, useSocialV2 } from '../../../../utils/featureFlags';

interface PostCardProps {
  post: Post;
  onReact: (emoji: string) => void;
}

// Main PostCard component that renders the appropriate variant
export const PostCard: React.FC<PostCardProps> = ({ post, onReact }) => {
  const v1Enabled = useSocialV1();
  const v2Enabled = useSocialV2();
  
  // Use V3 components when V2 feature flag is enabled
  if (v2Enabled && post.type === 'checkin') {
    return <CheckinCardV3 post={post} onReact={onReact} />;
  }
  
  // Use V2 components when V1 flag is enabled
  if (v1Enabled && post.type === 'checkin') {
    return <CheckinCardV2 post={post} onReact={onReact} />;
  }
  
  // Legacy card rendering
  switch (post.type) {
    case 'checkin':
      return <CheckinCard post={post} onReact={onReact} />;
    case 'status':
      return <StatusCard post={post} onReact={onReact} />;
    case 'photo':
      return <PhotoCard post={post} onReact={onReact} />;
    case 'audio':
      return <AudioCard post={post} onReact={onReact} />;
    default:
      return <StatusCard post={post} onReact={onReact} />;
  }
};