import { createNewMessageNotification } from './notificationHelper.js';
import User from '../models/User.js';

export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt,
            attachments: message.attachments || []
        }
    });

    // Mark lastMessage as modified để Mongoose lưu vào DB
    conversation.markModified('lastMessage');

    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
};

export const emitNewMessage = async (io, conversation, message) => {
    //emit tin nhắn mới vào room(conversation) tương ứng
    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    });

    // Create notifications for recipients (not sender)
    try {
        const sender = await User.findById(message.senderId).select('displayName');
        const recipients = conversation.participants.filter(
            p => p.userId.toString() !== message.senderId.toString()
        );

        for (const recipient of recipients) {
            await createNewMessageNotification(
                recipient.userId,
                message.senderId,
                sender.displayName,
                conversation._id
            );
        }
    } catch (error) {
        console.error('Error creating message notifications:', error);
    }
};