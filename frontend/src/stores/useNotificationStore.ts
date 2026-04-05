import { create } from 'zustand';
import type { Notification } from '@/types/notification';
import { notificationService } from '@/services/notificationService';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
    fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        try {
            set({ loading: true });
            const data = await notificationService.getNotifications();
            set({ 
                notifications: data.notifications,
                unreadCount: data.unreadCount,
                loading: false 
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            set({ loading: false });
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);
            set((state) => ({
                notifications: state.notifications.map(n => 
                    n._id === notificationId ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationService.markAllAsRead();
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    },

    deleteNotification: async (notificationId: string) => {
        try {
            await notificationService.deleteNotification(notificationId);
            const notification = get().notifications.find(n => n._id === notificationId);
            set((state) => ({
                notifications: state.notifications.filter(n => n._id !== notificationId),
                unreadCount: notification && !notification.isRead 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount
            }));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    },

    addNotification: (notification: Notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }));
    },

    fetchUnreadCount: async () => {
        try {
            const count = await notificationService.getUnreadCount();
            set({ unreadCount: count });
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }
}));
