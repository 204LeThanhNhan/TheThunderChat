import api from "@/lib/axios";

export const statusService = {
    async getStatus(userId?: string) {
        const url = userId ? `/status/${userId}` : '/status';
        const res = await api.get(url);
        return res.data.status;
    },

    async setStatus(text: string, emoji: string, duration?: number) {
        const res = await api.post('/status', {
            text,
            emoji,
            duration
        });
        return res.data.status;
    },

    async clearStatus() {
        const res = await api.delete('/status');
        return res.data;
    }
};
