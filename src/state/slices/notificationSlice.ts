import type { StateCreator } from 'zustand';
import { supabaseNotificationService, type Notification } from '../../services/supabase.notifications.service';
import { supabase } from '../../services/supabase.service';

export type NotificationSlice = {
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  notificationsChannel: any | null;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  clearNotificationsData: () => void;
};

export const createNotificationSlice: StateCreator<
  NotificationSlice,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  notificationsChannel: null,

  fetchNotifications: async () => {
    try {
      set({ notificationsLoading: true });
      const notifications = await supabaseNotificationService.getNotifications();
      set({ notifications, notificationsLoading: false });
    } catch (error) {
      if (__DEV__) console.error('Error fetching notifications:', error);
      set({ notificationsLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await supabaseNotificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error) {
      if (__DEV__) console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    const { success } = await supabaseNotificationService.markAsRead(notificationId);
    if (success) {
      // Update local state
      const notifications = get().notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      );
      set({ notifications });

      // Refresh unread count
      get().fetchUnreadCount();
    }
  },

  markAllAsRead: async () => {
    const { success } = await supabaseNotificationService.markAllAsRead();
    if (success) {
      // Update local state
      const notifications = get().notifications.map(n => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString()
      }));
      set({ notifications, unreadCount: 0 });
    }
  },

  subscribeToNotifications: () => {
    const channel = supabaseNotificationService.subscribeToNotifications((payload) => {
      // Add new notification to the list
      const newNotification = payload.new as Notification;
      const notifications = [newNotification, ...get().notifications];
      set({ notifications, unreadCount: get().unreadCount + 1 });
    });
    set({ notificationsChannel: channel });
  },

  unsubscribeFromNotifications: () => {
    const channel = get().notificationsChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ notificationsChannel: null });
    }
  },

  clearNotificationsData: () => {
    if (__DEV__) console.log('🧹 Clearing all notifications data');
    // Unsubscribe from any active channels first
    const channel = get().notificationsChannel;
    if (channel) {
      supabase.removeChannel(channel);
    }
    set({
      notifications: [],
      unreadCount: 0,
      notificationsLoading: false,
      notificationsChannel: null
    });
  },
});
