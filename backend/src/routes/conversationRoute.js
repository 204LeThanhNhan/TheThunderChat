import express from 'express';
import Conversation from "../schemas/Conversation.js";
import Message from "../schemas/Mesage.js";
import MessageReaction from "../schemas/MessageReaction.js";
import { checkFriendship } from '../middlewares/friendMiddleware.js';
import { io } from "../socket/index.js";

const router = express.Router();

router.post("/", checkFriendship, async (req, res) => {
    try {
        const {type, name, memberIds} = req.body;
        const userId = req.user._id;

        if(!type || (type === "group" && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0){
            return res.status(400).json({message : "Tên nhóm và danh sách thành viên là bắt buộc!"});
        }

        let conversation;

        if(type === "direct"){
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({
                type : "direct",
                "participants.userId" : {$all : [userId, participantId]}
            });

            if(!conversation){
                conversation = new Conversation({
                    type: "direct",
                    participants: [{userId}, {userId : participantId}],
                    lastMessageAt: new Date()
                });

                await conversation.save();
            }
        }

        if(type === "group"){
            conversation = new Conversation({
                type: "group",
                participants: [{userId}, ...memberIds.map((id) => ({userId: id}))],
                group: {name, createdBy: userId},
                lastMessageAt: new Date()
            });

            await conversation.save();
        }

        if(!conversation){
            return res.status(400).json({message: "conversation type không hợp lệ!"});
        }

        await conversation.populate([
            {path: "participants.userId", select: "displayName avatarUrl"},
            {path: "seenBy", select: "displayName avatarUrl"},
            {path: "lastMessage.senderId", select: "displayName avatarUrl"}
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt
        }));

        const formatted = {...conversation.toObject(), participants};

        if(type === 'group'){
            memberIds.forEach((userId) => {
                io.to(userId).emit("new-group", formatted);
            });
        }

        return res.status(201).json({conversation: formatted});

    } catch (error) {
        console.error(`Lỗi khi tạo conversation ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.get("/", async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            'participants.userId': userId
        }).sort({lastMessageAt: -1, updatedAt: -1})
        .populate({
            path: 'participants.userId',
            select: 'displayName avatarUrl status'
        })
        .populate({
            path: 'lastMessage.senderId',
            select: 'displayName avatarUrl'
        })
        .populate({
            path: 'seenBy',
            select: 'displayName avatarUrl'
        });

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
                status: p.userId?.status || null
            }));

            return {
                ...convo.toObject(),
                unreadCounts: convo.unreadCounts || {},
                participants
            };

        });

        return res.status(200).json({conversations: formatted});
    } catch (error) {
        console.error(`Lỗi khi lấy conversation ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }

});

router.get("/:conversationId/messages", async (req, res) => {
    try {
        const {conversationId} = req.params;
        const {limit = 50, cursor} = req.query;

        const query = {conversationId};

        if(cursor){
            query.createdAt = {$lt: new Date(cursor)};
        }

        let messages = await Message.find(query).sort({createdAt: -1}).limit(Number(limit) + 1);

        let nextCursor = null;
        if(messages.length > Number(limit)){
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop();
        }
        messages = messages.reverse();

        // Fetch reactions for all messages
        const messageIds = messages.map(m => m._id);
        const reactions = await MessageReaction.find({ messageId: { $in: messageIds } })
            .populate('userId', 'displayName avatarUrl');

        // Group reactions by messageId and emoji
        const reactionsByMessage = {};
        reactions.forEach(reaction => {
            const msgId = reaction.messageId.toString();
            if (!reactionsByMessage[msgId]) {
                reactionsByMessage[msgId] = {};
            }
            if (!reactionsByMessage[msgId][reaction.emoji]) {
                reactionsByMessage[msgId][reaction.emoji] = [];
            }
            reactionsByMessage[msgId][reaction.emoji].push({
                userId: reaction.userId._id,
                displayName: reaction.userId.displayName,
                avatarUrl: reaction.userId.avatarUrl
            });
        });

        // Add reactions to messages
        const messagesWithReactions = messages.map(msg => ({
            ...msg.toObject(),
            reactions: reactionsByMessage[msg._id.toString()] || {}
        }));

        return res.status(200).json({messages: messagesWithReactions, nextCursor});
    } catch (error) {
        console.error(`Lỗi khi lấy tin nhắn trong cuộc trò chuyện ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.patch("/:conversationId/seen", async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại!" });
        }

        const last = conversation.lastMessage;
        if (!last) {
            return res.status(200).json({ message: "Không có tin nhắn để mark as seen!" });
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender không cần mark as seen!" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            }, {
            new: true,
            }
        );

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                createdAt: updated?.lastMessage.createdAt,
                attachments: updated?.lastMessage.attachments || [],
                recalled: updated?.lastMessage.recalled || false,
                recalledAt: updated?.lastMessage.recalledAt || null,
                sender: {
                    _id: updated?.lastMessage.senderId,
                },
            },
        });

        return res.status(200).json({
            message: "Marked as seen",
            seenBy: updated?.seenBy || [],
            myUnreadCount: updated?.lastMessage.seenBy || 0
        });
    } catch (error) {
        console.error(`Lỗi khi gửi mark as seen ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;

