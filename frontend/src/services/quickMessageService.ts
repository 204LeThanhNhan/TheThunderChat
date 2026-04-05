import api from "@/lib/axios";

export const quickMessageService = {
    async getAll() {
        const res = await api.get('/quick-messages');
        return res.data.quickMessages;
    },

    async save(key: string, value: string) {
        const res = await api.post('/quick-messages', { key, value });
        return res.data.quickMessages;
    },

    async delete(key: string) {
        const res = await api.delete(`/quick-messages/${key}`);
        return res.data;
    },

    async search(prefix: string) {
        const res = await api.get(`/quick-messages/search/${prefix}`);
        return res.data.suggestions;
    }
};
