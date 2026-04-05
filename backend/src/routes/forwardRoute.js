import express from 'express';
import MessageForward from '../models/MessageForward.js';
import Message from '../models/Mesage.js';
import Conversation from '../models/Conversation.js';
import BlockedUser from '../models/BlockedUser.js';
import { io } from '../socket/index.js';
import { updateConversationAfterCreateMessage, emitNewMessage } from '../utils/messageHelper.js';

const router = express.Router();

// Forward message to one or multiple conversations
router.post('/', async (req, res) => {
    try {
        const { messageId, conversationIds } = req.body;
        const userId = req.user._id;

        if (!messageId || !conversationIds || conversationIds.length === 0) {
            return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
        }

        // Get original message
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ message: "Tin nhắn không tồn tại" });
        }

        // Check if message is recalled
        if (originalMessage.recalled) {
            return res.status(400).json({ message: "Không thể chuyển tiếp tin nhắn đã thu hồi" });
        }

        // Check if user has access to original message (is member of original conversation)
        const originalConversation = await Conversation.findById(originalMessage.conversationId);
        if (!originalConversation) {
            return res.status(404).json({ message: "Cuộc trò chuyện gốc không tồn tại" });
        }

        const hasAccess = originalConversation.participants.some(
            p => p.userId.toString() === userId.toString()
        );
        if (!hasAccess) {
            return res.status(403).json({ message: "Bạn không có quyền chuyển tiếp tin nhắn này" });
        }

        const forwardedMessages = [];
        const failedConversations = [];

        for (const conversationId of conversationIds) {
            try {
                // Check if user is member of target conversation
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) {
                    failedConversations.push({ conversationId, reason: "Không tìm thấy" });
                    continue;
                }

                const isMember = conversation.participants.some(
                    p => p.userId.toString() === userId.toString()
                );
                if (!isMember) {
                    failedConversations.push({ conversationId, reason: "Không phải thành viên" });
                    continue;
                }

                // Check block for direct conversations
                if (conversation.type === 'direct') {
                    const otherParticipant = conversation.participants.find(
                        p => p.userId.toString() !== userId.toString()
                    );

                    if (otherParticipant) {
                        const [iBlockThem, theyBlockMe] = await Promise.all([
                            BlockedUser.exists({ blockerId: userId, blockedId: otherParticipant.userId }),
                            BlockedUser.exists({ blockerId: otherParticipant.userId, blockedId: userId })
                        ]);

                        if (iBlockThem || theyBlockMe) {
                            failedConversations.push({ conversationId, reason: "Đã chặn" });
                            continue;
                        }
                    }
                }

                // Create new message (forwarded)
                const newMessage = await Message.create({
                    conversationId,
                    senderId: userId,
                    content: originalMessage.content,
                    attachments: originalMessage.attachments,
                    isForwarded: true,
                    forwardedFrom: messageId
                });

                // Save forward record
                await MessageForward.create({
                    originalMessageId: messageId,
                    forwardedBy: userId,
                    forwardedTo: conversationId,
                    newMessageId: newMessage._id
                });

                // Update conversation
                updateConversationAfterCreateMessage(conversation, newMessage, userId);
                await conversation.save();

                // Emit socket event
                emitNewMessage(io, conversation, newMessage);

                forwardedMessages.push(newMessage);
            } catch (error) {
                console.error(`Lỗi khi forward đến ${conversationId}:`, error);
                failedConversations.push({ conversationId, reason: "Lỗi hệ thống" });
            }
        }

        return res.status(201).json({ 
            message: "Chuyển tiếp thành công",
            success: forwardedMessages.length,
            failed: failedConversations.length,
            failedDetails: failedConversations
        });
    } catch (error) {
        console.error(`Lỗi khi forward tin nhắn: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Get forward count for a message
router.get('/:messageId/count', async (req, res) => {
    try {
        const { messageId } = req.params;

        const count = await MessageForward.countDocuments({ originalMessageId: messageId });

        return res.status(200).json({ count });
    } catch (error) {
        console.error(`Lỗi khi lấy forward count: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Get forward history
router.get('/:messageId/history', async (req, res) => {
    try {
        const { messageId } = req.params;

        const forwards = await MessageForward.find({ originalMessageId: messageId })
            .populate('forwardedBy', 'displayName avatarUrl')
            .populate('forwardedTo', 'type')
            .sort({ forwardedAt: -1 })
            .limit(50);

        return res.status(200).json({ forwards });
    } catch (error) {
        console.error(`Lỗi khi lấy forward history: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
