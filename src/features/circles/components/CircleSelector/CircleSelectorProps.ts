import { Circle } from '../../../../state/slices/circlesSlice';

// Shared props interface for all CircleSelector implementations
export interface CircleSelectorProps {
  // Data
  circles: Circle[];
  activeCircleId: string | null; // null = "All Circles"

  // Callbacks
  onCircleSelect: (circleId: string | null) => void;
  onJoinCircle: () => void;

  // UI State
  loading?: boolean;
  error?: string | null;

  // Optional customization
  style?: any;
  testID?: string;
}

// Props for individual circle item
export interface CircleItemProps {
  circle: Circle;
  isActive: boolean;
  onPress: () => void;
  showMemberCount?: boolean;
}

// Props for "All Circles" option
export interface AllCirclesProps {
  isActive: boolean;
  onPress: () => void;
  circleCount: number;
}