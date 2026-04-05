import express from 'express';
import MessageReaction from '../models/MessageReaction.js';
import Message from '../models/Mesage.js';
import { io } from '../socket/index.js';
import { createReactionNotification } from '../utils/notificationHelper.js';
import User from '../models/User.js';

const router = express.Router();

// Toggle reaction
router.post('/:messageId/react', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        // Validate emoji
        const validEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
        if (!validEmojis.includes(emoji)) {
            return res.status(400).json({ message: "Emoji không hợp lệ" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Tin nhắn không tồn tại" });
        }

        const existingReaction = await MessageReaction.findOne({ messageId, userId });

        // Get user info first (dùng chung cho tất cả cases)
        const user = await User.findById(userId).select('displayName avatarUrl');

        if (existingReaction) {
            if (existingReaction.emoji === emoji) {
                // Same emoji -> remove reaction
                await MessageReaction.deleteOne({ _id: existingReaction._id });
                
                // Emit socket event
                io.to(message.conversationId.toString()).emit('reaction-removed', {
                    messageId,
                    userId,
                    conversationId: message.conversationId
                });

                return res.status(200).json({ message: "Đã xóa reaction" });
            } else {
                // Different emoji -> update
                existingReaction.emoji = emoji;
                await existingReaction.save();

                // Emit socket event with user info
                io.to(message.conversationId.toString()).emit('reaction-updated', {
                    messageId,
                    userId,
                    emoji,
                    conversationId: message.conversationId,
                    user: {
                        displayName: user?.displayName || 'Unknown',
                        avatarUrl: user?.avatarUrl || null
                    }
                });

                return res.status(200).json({ message: "Đã cập nhật reaction", reaction: existingReaction });
            }
        } else {
            // Tạo mới reaction
            const newReaction = await MessageReaction.create({
                messageId,
                userId,
                emoji
            });

            // Thả cảm xúc tin nhắn người khác -> thông báo cho sender
            if (message.senderId.toString() !== userId.toString()) {
                await createReactionNotification(
                    message.senderId,
                    userId,
                    user?.displayName || 'Unknown',
                    emoji
                );
            }

            // Emit socket with user info
            io.to(message.conversationId.toString()).emit('reaction-added', {
                messageId,
                userId,
                emoji,
                conversationId: message.conversationId,
                user: {
                    displayName: user?.displayName || 'Unknown',
                    avatarUrl: user?.avatarUrl || null
                }
            });

            return res.status(201).json({ message: "Đã thêm reaction", reaction: newReaction });
        }
    } catch (error) {
        console.error(`Lỗi khi react tin nhắn: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});


router.get('/:messageId/reactions', async (req, res) => {
    try {
        const { messageId } = req.params;

        const reactions = await MessageReaction.find({ messageId })
            .populate('userId', 'displayName avatarUrl')
            .sort({ createdAt: -1 });

        // Group by emoji
        const grouped = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = [];
            }
            acc[reaction.emoji].push({
                userId: reaction.userId._id,
                displayName: reaction.userId.displayName,
                avatarUrl: reaction.userId.avatarUrl
            });
            return acc;
        }, {});

        return res.status(200).json({ reactions: grouped });
    } catch (error) {
        console.error(`Lỗi khi lấy reactions: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
