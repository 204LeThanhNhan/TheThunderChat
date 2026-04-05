export interface Notification {
  _id: string;
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message' | 'mention' | 'message_reaction';
  content: string;
  isRead: boolean;
  relatedId?: string;
  relatedUser?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  _id: string;
  messageId: string;
  userId: string;
  emoji: '👍' | '❤️' | '😂' | '😮' | '😢' | '😡';
  createdAt: string;
}

export interface ReactionGroup {
  [emoji: string]: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }[];
}
