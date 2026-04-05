import api from "@/lib/axios";

export const notificationService = {
    async getNotifications(limit = 20, skip = 0) {
        const res = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
        return res.data;
    },

    async markAsRead(notificationId: string) {
        const res = await api.patch(`/notifications/${notificationId}/read`);
        return res.data;
    },

    async markAllAsRead() {
        const res = await api.patch('/notifications/read-all');
        return res.data;
    },

    async deleteNotification(notificationId: string) {
        const res = await api.delete(`/notifications/${notificationId}`);
        return res.data;
    },

    async getUnreadCount() {
        const res = await api.get('/notifications/unread-count');
        return res.data.count;
    }
};
