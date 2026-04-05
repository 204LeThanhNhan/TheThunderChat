import Notification from '../models/Notification.js';
import { io } from '../socket/index.js';

// Create notification helper
export const createNotification = async ({
    userId,
    type,
    content,
    relatedId = null,
    relatedUser = null
}) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            content,
            relatedId,
            relatedUser
        });

        // Populate relatedUser for socket emit
        await notification.populate('relatedUser', 'displayName avatarUrl');

        // Emit real-time notification
        io.to(userId.toString()).emit('new-notification', {
            notification
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create friend request notification
export const createFriendRequestNotification = async (recipientId, senderId, senderName) => {
    return createNotification({
        userId: recipientId,
        type: 'friend_request',
        content: `${senderName} đã gửi lời mời kết bạn`,
        relatedUser: senderId
    });
};

// Create friend accepted notification
export const createFriendAcceptedNotification = async (recipientId, accepterId, accepterName) => {
    return createNotification({
        userId: recipientId,
        type: 'friend_accepted',
        content: `${accepterName} đã chấp nhận lời mời kết bạn`,
        relatedUser: accepterId
    });
};

// Create new message notification
export const createNewMessageNotification = async (recipientId, senderId, senderName, conversationId) => {
    return createNotification({
        userId: recipientId,
        type: 'new_message',
        content: `${senderName} đã gửi tin nhắn mới`,
        relatedId: conversationId,
        relatedUser: senderId
    });
};

// Create message reaction notification
export const createReactionNotification = async (messageOwnerId, reactorId, reactorName, emoji) => {
    return createNotification({
        userId: messageOwnerId,
        type: 'message_reaction',
        content: `${reactorName} đã thả ${emoji} vào tin nhắn của bạn`,
        relatedUser: reactorId
    });
};
