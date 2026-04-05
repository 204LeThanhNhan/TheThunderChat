
import {create} from "zustand";
import {io, type Socket} from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useNotificationStore } from "./useNotificationStore";
import { useFriendStore } from "./useFriendStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    onlineUsers: [],
    connectSocket: () => {
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        //tránh tạo nhiều socket trùng nhau
        if(existingSocket){
            return;
        }

        const socket: Socket = io(baseURL, {
            auth: {token: accessToken},
            transports: ["websocket"],
        });

        set({socket});

        socket.on("connect", () => {console.log(`Đã kết nối với Socket!`)});
        //lắng nghe emit online users từ backend
        socket.on("online-users", (userIds) => {
            set({onlineUsers: userIds});
        });

        //lắng nghe emit new mesage từ backend
        socket.on("new-message", ({message, conversation, unreadCounts}) => {
            useChatStore.getState().addMessage(message);
            
            const senderId = conversation.lastMessage.senderId;
            const senderIdValue = typeof senderId === 'object' ? senderId._id : senderId;
            
            const lastMessage = {
                _id: conversation.lastMessage._id,
                content: conversation.lastMessage.content,
                createdAt: conversation.lastMessage.createdAt,
                attachments: conversation.lastMessage.attachments || [],
                recalled: conversation.lastMessage.recalled || false,
                recalledAt: conversation.lastMessage.recalledAt || null,
                sender: {
                    _id: senderIdValue,
                    displayName: typeof senderId === 'object' ? senderId.displayName : "",
                    avatarUrl: typeof senderId === 'object' ? senderId.avatarUrl : null
                }
            };

            // Chỉ update các field cần thiết, không ghi đè participants
            const updatedConversation = {
                _id: conversation._id,
                lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCounts
            }

            if(useChatStore.getState().activeConversationId === message.conversationId){
                useChatStore.getState().markAsSeen();
            } else {
                // Browser notification cho tin nhắn mới khi không đang xem conversation đó
                if ('Notification' in window && Notification.permission === 'granted') {
                    const senderName = typeof senderId === 'object' ? senderId.displayName : "Người dùng";
                    const messageContent = message.content || "Đã gửi file đính kèm";
                    
                    new Notification(`${senderName}`, {
                        body: messageContent,
                        icon: typeof senderId === 'object' ? senderId.avatarUrl : '/logo.svg',
                        badge: '/logo.svg',
                        tag: conversation._id // Prevent duplicate notifications
                    });
                }
            }

            useChatStore.getState().updateConversation(updatedConversation);
        });

        //lắng nghe emit read-mesage từ backend
        socket.on("read-message", ({conversation, lastMessage}) => {
            const updated = {
                _id: conversation._id,
                lastMessage,
                lastMessageAt: conversation.lastMessageAt,
                unreadCounts: conversation.unreadCounts,
                seenBy: conversation.seenBy,
            };
            useChatStore.getState().updateConversation(updated);
        });

        //lắng nghe new-group (có user mời vào phòng)
        socket.on('new-group', (conversation) => {
            useChatStore.getState().addConvo(conversation);
            socket.emit("join-conversation", conversation._id);
        });

        //lắng nghe new-conversation (direct message mới)
        socket.on('new-conversation', (conversation) => {
            useChatStore.getState().addConvo(conversation);
            socket.emit("join-conversation", conversation._id);
        });

        // Lắng nghe message recalled
        socket.on('message-recalled', ({messageId, conversationId, recalledAt}) => {
            const {messages, activeConversationId} = useChatStore.getState();
            
            // Update message trong state
            if (messages[conversationId]) {
                const updatedItems = messages[conversationId].items.map(msg => 
                    msg._id === messageId 
                        ? { ...msg, recalled: true, recalledAt } 
                        : msg
                );
                
                useChatStore.setState((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: {
                            ...state.messages[conversationId],
                            items: updatedItems
                        }
                    }
                }));
            }
        });

        // Lắng nghe message pinned
        socket.on('message-pinned', ({messageId, conversationId, pinned, pinnedBy, pinnedAt}) => {
            const {messages} = useChatStore.getState();
            
            // Update message trong state
            if (messages[conversationId]) {
                const updatedItems = messages[conversationId].items.map(msg => 
                    msg._id === messageId 
                        ? { ...msg, pinned, pinnedBy, pinnedAt } 
                        : msg
                );
                
                useChatStore.setState((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: {
                            ...state.messages[conversationId],
                            items: updatedItems
                        }
                    }
                }));
            }
        });

        // Lắng nghe conversation updated (khi lastMessage bị recall)
        socket.on('conversation-updated', ({conversationId, lastMessage}) => {
            useChatStore.getState().updateConversation({
                _id: conversationId,
                lastMessage
            });
        });

        // Lắng nghe new notification
        socket.on('new-notification', ({notification}) => {
            useNotificationStore.getState().addNotification(notification);
            
            // Browser notification nếu được phép
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.content, {
                    icon: notification.relatedUser?.avatarUrl || '/logo.svg',
                    badge: '/logo.svg'
                });
            }
        });

        // Lắng nghe reaction events
        socket.on('reaction-added', (data) => {
            const {messageId, userId, emoji, conversationId, user} = data;
            console.log('🎯 reaction-added received:', { messageId, userId, emoji, user });
            
            const {messages} = useChatStore.getState();
            if (messages[conversationId]) {
                const updatedItems = messages[conversationId].items.map(msg => {
                    if (msg._id === messageId) {
                        const reactions = msg.reactions || {};
                        if (!reactions[emoji]) {
                            reactions[emoji] = [];
                        }
                        // Add user to reaction if not already there
                        if (!reactions[emoji].some(u => u.userId === userId)) {
                            reactions[emoji].push({ 
                                userId, 
                                displayName: user?.displayName || 'Unknown', 
                                avatarUrl: user?.avatarUrl || null 
                            });
                        }
                        return { ...msg, reactions: {...reactions} };
                    }
                    return msg;
                });
                
                useChatStore.setState((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: {
                            ...state.messages[conversationId],
                            items: updatedItems
                        }
                    }
                }));
            }
        });

        socket.on('reaction-removed', ({messageId, userId, conversationId}) => {
            const {messages} = useChatStore.getState();
            if (messages[conversationId]) {
                const updatedItems = messages[conversationId].items.map(msg => {
                    if (msg._id === messageId) {
                        const reactions = msg.reactions || {};
                        // Remove user from all emojis
                        Object.keys(reactions).forEach(emoji => {
                            reactions[emoji] = reactions[emoji].filter(u => u.userId !== userId);
                            if (reactions[emoji].length === 0) {
                                delete reactions[emoji];
                            }
                        });
                        return { ...msg, reactions: {...reactions} };
                    }
                    return msg;
                });
                
                useChatStore.setState((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: {
                            ...state.messages[conversationId],
                            items: updatedItems
                        }
                    }
                }));
            }
        });

        socket.on('reaction-updated', (data) => {
            const {messageId, userId, emoji, conversationId, user} = data;
            console.log('🔄 reaction-updated received:', { messageId, userId, emoji, user });
            
            const {messages} = useChatStore.getState();
            if (messages[conversationId]) {
                const updatedItems = messages[conversationId].items.map(msg => {
                    if (msg._id === messageId) {
                        const reactions = msg.reactions || {};
                        // Remove user from all emojis first
                        Object.keys(reactions).forEach(e => {
                            reactions[e] = reactions[e].filter(u => u.userId !== userId);
                            if (reactions[e].length === 0) {
                                delete reactions[e];
                            }
                        });
                        // Add to new emoji
                        if (!reactions[emoji]) {
                            reactions[emoji] = [];
                        }
                        reactions[emoji].push({ 
                            userId, 
                            displayName: user?.displayName || 'Unknown', 
                            avatarUrl: user?.avatarUrl || null 
                        });
                        return { ...msg, reactions: {...reactions} };
                    }
                    return msg;
                });
                
                useChatStore.setState((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: {
                            ...state.messages[conversationId],
                            items: updatedItems
                        }
                    }
                }));
            }
        });

        // Lắng nghe friend request events
        socket.on('new-friend-request', ({request}) => {
            useFriendStore.getState().addReceivedRequest(request);
        });

        socket.on('friend-request-accepted', ({requestId, newFriend}) => {
            useFriendStore.getState().removeSentRequest(requestId);
            useFriendStore.getState().addFriendToList(newFriend);
        });

        socket.on('friend-request-accepted-self', ({requestId, newFriend}) => {
            useFriendStore.getState().removeReceivedRequest(requestId);
            useFriendStore.getState().addFriendToList(newFriend);
        });

        socket.on('friend-request-declined', ({requestId}) => {
            useFriendStore.getState().removeSentRequest(requestId);
        });

        socket.on('friend-request-declined-self', ({requestId}) => {
            useFriendStore.getState().removeReceivedRequest(requestId);
        });

        // Lắng nghe block events
        socket.on('user-blocked', ({blockerId}) => {
            console.log('🚫 You have been blocked by:', blockerId);
            // Trigger re-check block status
            window.dispatchEvent(new CustomEvent('block-status-changed'));
        });

        socket.on('user-unblocked', ({blockerId}) => {
            console.log('✅ You have been unblocked by:', blockerId);
            // Trigger re-check block status
            window.dispatchEvent(new CustomEvent('block-status-changed'));
        });

        // Lắng nghe user status updates
        socket.on('user-status-updated', ({userId, status}) => {
            // Update conversations new status
            const {conversations} = useChatStore.getState();
            const updatedConversations = conversations.map(convo => {
                if (convo.type === 'direct') {
                    const updatedParticipants = convo.participants.map(p => 
                        p._id === userId ? { ...p, status } : p
                    );
                    return { ...convo, participants: updatedParticipants };
                }
                return convo;
            });
            useChatStore.setState({ conversations: updatedConversations });
        });
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if(socket){
            socket.disconnect();
            set({socket: null});
        }
    },
}))