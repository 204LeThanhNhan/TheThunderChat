import {friendService} from "../services/friendService";
import type { FriendState } from "@/types/store";
import {create} from "zustand";

export const useFriendStore = create <FriendState>((set, get) => ({
    friends: [],
    loading: false,
    receivedList: [],
    sentList: [],
    searchByUsername: async (username) => {
        try {
            set({loading: true});
            const user = await friendService.searchByUserName(username);
            return user;
        } catch (error) {
            console.error(`Có lỗi xảy ra khi tìm kiếm user: ${error}`);
            return null;
        } finally {
            set({loading: false});
        }
    },

    addFriend: async (to, message) => {
        try {
            set({loading: true});
            const resultMessage = await friendService.sendFriendRequest(to, message);
            return resultMessage;
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi addFriend: ${error}`);
            return "Có lỗi xảy ra khi gửi kết bạn. Hãy thử lại!";
        } finally {
            set({loading: false});
        }
    },

    getAllFriendRequests: async () => {
        try {
            set({loading: true});
            const result = await friendService.getAllFriendRequest();
            if(!result){
                return;
            }

            const {receive, sent} = result;
            set({receivedList: receive, sentList: sent});
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi getAllFriendRequests: ${error}`);
        } finally{
            set({loading: false});
        }
    },

    acceptRequest: async(requestId) => {
        try {
            set({loading: true});
            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId),
            }));
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi acceptRequest: ${error}`);
        } finally{
            set({loading: false});
        }
    },

    declineRequest: async(requestId) => {
        try {
            set({loading: true});
            await friendService.declineRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId),
            }));
        } catch (error) {
            console.error(`Có lỗi xảy ra khi gửi declineRequest: ${error}`);
        } finally{
            set({loading: false});
        }
    },

    getFriends: async () => {
        try {
            set({loading: true});
            const friends = await friendService.getFriendList();
            set({friends: friends});
        } catch (error) {
            console.error(`Có lỗi xảy ra khi getFriends: ${error}`);
            set({friends: []});
        }finally{
            set({loading: false});
        }
    },

    // Socket methods
    addReceivedRequest: (request) => {
        set((state) => ({
            receivedList: [request, ...state.receivedList]
        }));
    },

    removeSentRequest: (requestId) => {
        set((state) => ({
            sentList: state.sentList.filter(r => r._id !== requestId)
        }));
    },

    removeReceivedRequest: (requestId) => {
        set((state) => ({
            receivedList: state.receivedList.filter(r => r._id !== requestId)
        }));
    },

    addFriendToList: (friend) => {
        set((state) => ({
            friends: [friend, ...state.friends]
        }));
    },
}))

