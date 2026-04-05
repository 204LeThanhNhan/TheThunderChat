export interface ConversationDraft {
  _id: string;
  userId: string;
  conversationId: string;
  content: string;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuickMessage {
  key: string;
  value: string;
}

export interface UserStatus {
  text: string;
  emoji: string;
  expiresAt: Date | null;
  isActive: boolean;
}

export interface BlockedUser {
  _id: string;
  blockerId: string;
  blockedId: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
    username: string;
  };
  reason: string;
  note?: string;
  blockedAt: string;
}
