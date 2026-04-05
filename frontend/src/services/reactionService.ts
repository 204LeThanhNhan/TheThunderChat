import api from "@/lib/axios";

export const reactionService = {
    async toggleReaction(messageId: string, emoji: string) {
        const res = await api.post(`/reactions/${messageId}/react`, { emoji });
        return res.data;
    },

    async getReactions(messageId: string) {
        const res = await api.get(`/reactions/${messageId}/reactions`);
        return res.data.reactions;
    }
};
