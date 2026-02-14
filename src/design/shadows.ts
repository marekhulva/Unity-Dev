import { Platform } from 'react-native';

export const shadows = {
  glow: {
    ...Platform.select({
      ios: { shadowColor: '#FFFFFF', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
      android: {},
    }),
    elevation: 0,
  },
  elevate: {
    ...Platform.select({
      ios: { shadowColor: '#FFFFFF', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: {},
    }),
    elevation: 3,
  },
};