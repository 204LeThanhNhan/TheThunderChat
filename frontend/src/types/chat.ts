//mô tả cấu trúc Conversation mà backend trả về

export interface UserStatus {
  text: string;
  emoji: string;
  expiresAt: string | null;
  isActive: boolean;
}

export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
  status?: UserStatus;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  attachments?: Attachment[];
  recalled?: boolean;
  recalledAt?: string | null;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: SeenUser[];
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  attachments?: Attachment[];
  recalled?: boolean;
  recalledAt?: string | null;
  pinned?: boolean;
  pinnedBy?: string | null;
  pinnedAt?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  reactions?: Record<string, { userId: string; displayName: string; avatarUrl?: string }[]>;
}
