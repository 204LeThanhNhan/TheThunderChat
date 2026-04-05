

import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";
import type { Socket } from 'socket.io-client';

export interface AuthState{
    accessToken: string | null;
    user: User | null;
    loading: boolean;

    setAccessToken: (accessToken: string) => void;

    setUser: (user: User) => void;

    clearState:() => void;

    signUp: (username: string, password: string, email: string, firstName: string, lastName: string) => Promise<void>;

    signIn: (username: string, password: string) => Promise<void>;

    signOut: () => Promise<void>;

    fetchMe: () => Promise<void>;

    refresh: () => Promise<void>;

    
}

export interface ThemeState{
    isDark: boolean;

    toggleTheme: () => void;

    setTheme: (dark: boolean) => void;
}

export interface ChatState{
    conversations: Conversation[];
    //danh sach tin nhan
    //record map các Mesage thuộc về Conversation key:ConversationId, value: mảng các object Mesage
    messages: Record<string, {
        items: Message[],
        hasMore: boolean, //flag để xem còn tin nhắn cũ nữa không
        nextCursor?: string | null,
    }>,
    activeConversationId: string | null; //user click vào 1 khung chat, biến được cập nhật
    convoLoading: boolean; //dùng thông báo load thành công hay thất bại (conversation)
    messageLoading: boolean;
    loading: boolean;
    reset: () => void;
    setActiveConversation: (id: string | null) => void; //giúp component lấy id conversation user đang ở trong đó
    fetchConversations: () => Promise<void>; 
    fetchMessages: (conversationId?: string) => Promise<void>;
    sendDirectMessage: (recipientId: string, content: string, imgUrl?: string) => Promise<void>;
    sendDirectMessageWithFiles: (recipientId: string, content: string, files: File[]) => Promise<void>;
    sendGroupMessage: (conversationId: string, content: string, imgUrl?: string) => Promise<void>;
    sendGroupMessageWithFiles: (conversationId: string, content: string, files: File[]) => Promise<void>;

    //add message
    addMessage: (message: Message) => Promise<void>;
    //update conversation
    updateConversation: (conversation: unknown) => void;
    markAsSeen: () => Promise<void>;
    addConvo: (convo: Conversation) => void;
    createConversation: (type: "direct" | "group", name: string, memberIds: string[]) => Promise<void>;
    toggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[];
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export interface FriendState {
    loading: boolean;
    sentList: FriendRequest[];
    receivedList: FriendRequest[];
    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    friends: Friend[];
    getFriends: () => Promise<void>;
    addReceivedRequest: (request: FriendRequest) => void;
    removeSentRequest: (requestId: string) => void;
    removeReceivedRequest: (requestId: string) => void;
    addFriendToList: (friend: Friend) => void;
}

export interface UserState{
    updateAvatarUrl: (formData: FormData) => Promise<void>;
}


