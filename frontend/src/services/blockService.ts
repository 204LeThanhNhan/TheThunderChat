import api from "@/lib/axios";

export const blockService = {
    async blockUser(userId: string, reason?: string, note?: string) {
        const res = await api.post('/blocks', {
            userId,
            reason,
            note
        });
        return res.data;
    },

    async unblockUser(userId: string) {
        const res = await api.delete(`/blocks/${userId}`);
        return res.data;
    },

    async getBlockedUsers() {
        const res = await api.get('/blocks');
        return res.data.blocks;
    },

    async checkBlocked(userId: string) {
        const res = await api.get(`/blocks/check/${userId}`);
        return res.data;
    }
};
