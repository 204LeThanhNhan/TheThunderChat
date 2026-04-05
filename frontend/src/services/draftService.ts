import api from "@/lib/axios";

export const draftService = {
    async getDraft(conversationId: string) {
        const res = await api.get(`/drafts/${conversationId}`);
        return res.data.draft;
    },

    async saveDraft(conversationId: string, content: string, attachments?: any[], replyTo?: string) {
        const res = await api.post(`/drafts/${conversationId}`, {
            content,
            attachments,
            replyTo
        });
        return res.data.draft;
    },

    async deleteDraft(conversationId: string) {
        const res = await api.delete(`/drafts/${conversationId}`);
        return res.data;
    }
};
