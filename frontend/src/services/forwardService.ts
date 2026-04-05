import api from "@/lib/axios";

export const forwardService = {
    async forwardMessage(messageId: string, conversationIds: string[]) {
        const res = await api.post('/forwards', {
            messageId,
            conversationIds
        });
        return res.data;
    },

    async getForwardCount(messageId: string) {
        const res = await api.get(`/forwards/${messageId}/count`);
        return res.data.count;
    },

    async getForwardHistory(messageId: string) {
        const res = await api.get(`/forwards/${messageId}/history`);
        return res.data.forwards;
    }
};
