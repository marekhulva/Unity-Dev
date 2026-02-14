// Circle Selector Configuration
// Change the implementation type here to switch between different UI patterns

export const CIRCLE_SELECTOR_CONFIG = {
  // Main implementation switch - change this to switch UI patterns
  implementation: 'DROPDOWN' as 'TAB_BAR' | 'DROPDOWN' | 'ICONS',

  // Tab Bar specific settings (Icon-only with tooltips - Solution B)
  tabBar: {
    showMemberCount: false, // Show member count in tabs
    maxVisibleTabs: 'auto' as 'auto' | number, // 'auto' or specific number
    showScrollIndicator: true, // Show arrow when scrollable
    scrollAnimated: true, // Smooth scroll animations
    iconSize: 44, // Size of circular icon tabs
    scaleOnActive: 1.1, // Scale factor for active tab
    showTooltipOnActive: true, // Show name tooltip on active tab
    tooltipMaxWidth: 100, // Maximum width for tooltip
  },

  // Dropdown specific settings (for future use)
  dropdown: {
    showMemberCount: true,
    defaultExpanded: false,
    showEmoji: true,
    maxHeight: 400,
  },

  // Icons only settings (for future use)
  icons: {
    showTooltipOnActive: true,
    maxIcons: 6,
    iconSize: 44,
  },

  // Common settings
  common: {
    showAllCirclesOption: true, // Show "All Circles" as first option
    allowJoinFromSelector: true, // Show "+ Join" option
    persistSelection: true, // Remember last selection
    hapticFeedback: true, // Enable haptic feedback on selection
  },
};