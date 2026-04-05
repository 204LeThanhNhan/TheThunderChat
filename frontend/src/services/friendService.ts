import api from "@/lib/axios";

export const friendService = {
    async searchByUserName (username: string) {
        const res = await api.get(`/users/search?username=${username}`);
        return res.data.user;
    },

    async sendFriendRequest (to: string, message?: string){
        const res = await api.post("/friends/requests", {to, message});
        return res.data.message;
    },

    async getAllFriendRequest (){
        try {
            const res = await api.get("/friends/requests");
            const {sent, receive} = res.data;
            return {sent, receive};
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi getAllFriendRequest: ${error}`);
        }
    },

    async acceptRequest (requestId: string){
        try {
            const res = await api.post(`/friends/requests/${requestId}/accept`);
            return res.data.requestAcceptedBy;
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi acceptRequest: ${error}`);
        }  
    },

    async declineRequest (requestId: string){
        try {
            await api.post(`/friends/requests/${requestId}/decline`);
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi declineRequest: ${error}`);
        }
    },
    
    async getFriendList(){
        const res = await api.get("/friends");
        return res.data.friends;
    }
}