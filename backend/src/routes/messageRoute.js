import  express  from "express";
import Conversation from '../schemas/Conversation.js';
import Message from '../schemas/Mesage.js';
import ConversationDraft from '../schemas/ConversationDraft.js';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../utils/messageHelper.js'
import { io } from "../socket/index.js";
import { checkFriendship, checkGroupMembership } from "../middlewares/friendMiddleware.js";
import { checkBlocked } from "../middlewares/blockMiddleware.js";
import { upload, uploadFileFromBuffer } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Helper function để xác định loại file
const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'file';
};

// Helper function để xác định resource type cho Cloudinary
const getResourceType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw'; // cho file thường (pdf, docx, etc)
};

router.post('/direct', checkFriendship, checkBlocked, async (req, res) => {
    try {
        const { recipientId /* người nhận*/, content, conversationId } = req.body;
        const senderId = req.user._id;
        let conversation;
        let isNewConversation = false;

        if (!content) {
            return res.status(400).json({ message: "Thiếu nội dung tin nhắn" });
        }
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
            isNewConversation = true;
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId: senderId,
            content: content,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // Delete draft after sending message
        await ConversationDraft.findOneAndDelete({ 
            userId: senderId, 
            conversationId: conversation._id 
        });

        // Nếu là conversation mới, emit event để recipient nhận được conversation
        if (isNewConversation) {
            await conversation.populate([
                { path: 'participants.userId', select: 'displayName avatarUrl' },
                { path: 'lastMessage.senderId', select: 'displayName avatarUrl' }
            ]);

            const formattedConversation = {
                ...conversation.toObject(),
                participants: conversation.participants.map(p => ({
                    _id: p.userId._id,
                    displayName: p.userId.displayName,
                    avatarUrl: p.userId.avatarUrl,
                    joinedAt: p.joinedAt
                }))
            };

            // Emit to recipient
            io.to(recipientId.toString()).emit('new-conversation', formattedConversation);
        }

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error(`Lỗi khi gửi tin nhắn trực tiếp ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

router.post('/group', checkGroupMembership, async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;

        if (!content) {
            return res.status(400).json({ message: "Vui lòng nhập nội dung tin nhắn trước khi gửi!" });
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // Delete draft after sending message
        await ConversationDraft.findOneAndDelete({ 
            userId: senderId, 
            conversationId 
        });

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error(`Lỗi khi gửi tin nhắn nhóm ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Upload file cho tin nhắn trực tiếp
router.post('/direct/upload', upload.array('files', 5), checkBlocked, async (req, res) => {
    try {
        const { recipientId, conversationId } = req.body;
        const senderId = req.user._id;
        const files = req.files;
        let isNewConversation = false;

        console.log('Upload request:', { recipientId, conversationId, filesCount: files?.length });

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "Không có file nào được tải lên" });
        }

        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
            }
            
            // Kiểm tra user có phải là thành viên không
            const isMember = conversation.participants.some(
                (p) => p.userId.toString() === senderId.toString()
            );
            if (!isMember) {
                return res.status(403).json({ message: "Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này" });
            }
        } else {
            // Tạo conversation mới - cần check friendship
            if (!recipientId) {
                return res.status(400).json({ message: "Thiếu recipientId" });
            }

            // Check friendship
            const [userA, userB] = senderId.toString() < recipientId.toString() 
                ? [senderId, recipientId] 
                : [recipientId, senderId];
            
            const Friend = (await import('../models/Friend.js')).default;
            const isFriend = await Friend.findOne({ userA, userB });
            if (!isFriend) {
                return res.status(400).json({ message: "Bạn không thể gửi tin nhắn khi chưa kết bạn với người này" });
            }

            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
            isNewConversation = true;
        }

        // Upload từng file lên Cloudinary
        const attachments = [];
        for (const file of files) {
            const fileType = getFileType(file.mimetype);
            const resourceType = getResourceType(file.mimetype);
            
            const result = await uploadFileFromBuffer(file.buffer, resourceType, {
                resource_type: resourceType
            });

            attachments.push({
                type: fileType,
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }

        // Tạo message với attachments
        const message = await Message.create({
            conversationId: conversation._id,
            senderId: senderId,
            content: req.body.content || '',
            attachments: attachments
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // Delete draft after sending message
        await ConversationDraft.findOneAndDelete({ 
            userId: senderId, 
            conversationId: conversation._id 
        });

        // Nếu là conversation mới, emit event để recipient nhận được conversation
        if (isNewConversation) {
            await conversation.populate([
                { path: 'participants.userId', select: 'displayName avatarUrl' },
                { path: 'lastMessage.senderId', select: 'displayName avatarUrl' }
            ]);

            const formattedConversation = {
                ...conversation.toObject(),
                participants: conversation.participants.map(p => ({
                    _id: p.userId._id,
                    displayName: p.userId.displayName,
                    avatarUrl: p.userId.avatarUrl,
                    joinedAt: p.joinedAt
                }))
            };

            // Emit to recipient
            io.to(recipientId.toString()).emit('new-conversation', formattedConversation);
        }

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error(`Lỗi khi upload file tin nhắn trực tiếp: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Upload file cho tin nhắn nhóm
router.post('/group/upload', upload.array('files', 5), checkGroupMembership, async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: "Không có file nào được tải lên" });
        }

        // Upload từng file lên Cloudinary
        const attachments = [];
        for (const file of files) {
            const fileType = getFileType(file.mimetype);
            const resourceType = getResourceType(file.mimetype);
            
            const result = await uploadFileFromBuffer(file.buffer, resourceType, {
                resource_type: resourceType
            });

            attachments.push({
                type: fileType,
                url: result.secure_url,
                publicId: result.public_id,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            });
        }

        // Tạo message với attachments
        const message = await Message.create({
            conversationId,
            senderId,
            content: content || '',
            attachments: attachments
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // Delete draft after sending message
        await ConversationDraft.findOneAndDelete({ 
            userId: senderId, 
            conversationId 
        });

        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error(`Lỗi khi upload file tin nhắn nhóm: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;

// Recall message
router.patch('/:messageId/recall', async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Tin nhắn không tồn tại" });
        }

        // Chỉ người gửi mới có thể thu hồi
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
        }

        // Không thể thu hồi tin nhắn đã thu hồi
        if (message.recalled) {
            return res.status(400).json({ message: "Tin nhắn đã được thu hồi" });
        }

        message.recalled = true;
        message.recalledAt = new Date();
        await message.save();

        // Update lastMessage trong conversation nếu đây là lastMessage
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation && conversation.lastMessage && conversation.lastMessage._id.toString() === messageId.toString()) {
            conversation.lastMessage.recalled = true;
            conversation.lastMessage.recalledAt = message.recalledAt;
            conversation.markModified('lastMessage');
            await conversation.save();

            // Emit update conversation
            io.to(message.conversationId.toString()).emit("conversation-updated", {
                conversationId: conversation._id,
                lastMessage: conversation.lastMessage
            });
        }

        // Emit socket event
        io.to(message.conversationId.toString()).emit("message-recalled", {
            messageId: message._id,
            conversationId: message.conversationId,
            recalledAt: message.recalledAt
        });

        return res.status(200).json({ message: "Thu hồi tin nhắn thành công", data: message });
    } catch (error) {
        console.error(`Lỗi khi thu hồi tin nhắn: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Pin message
router.patch('/:messageId/pin', async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Tin nhắn không tồn tại" });
        }

        // Kiểm tra user có trong conversation không
        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
        }

        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "Bạn không có quyền ghim tin nhắn trong cuộc trò chuyện này" });
        }

        // Toggle pin
        message.pinned = !message.pinned;
        message.pinnedBy = message.pinned ? userId : null;
        message.pinnedAt = message.pinned ? new Date() : null;
        await message.save();

        // Emit socket event
        io.to(message.conversationId.toString()).emit("message-pinned", {
            messageId: message._id,
            conversationId: message.conversationId,
            pinned: message.pinned,
            pinnedBy: message.pinnedBy,
            pinnedAt: message.pinnedAt
        });

        return res.status(200).json({ 
            message: message.pinned ? "Ghim tin nhắn thành công" : "Bỏ ghim tin nhắn thành công", 
            data: message 
        });
    } catch (error) {
        console.error(`Lỗi khi ghim tin nhắn: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Get pinned messages
router.get('/conversation/:conversationId/pinned', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Kiểm tra user có trong conversation không
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
        }

        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: "Bạn không có quyền xem tin nhắn trong cuộc trò chuyện này" });
        }

        const pinnedMessages = await Message.find({
            conversationId,
            pinned: true
        }).sort({ pinnedAt: -1 });

        return res.status(200).json({ pinnedMessages });
    } catch (error) {
        console.error(`Lỗi khi lấy tin nhắn đã ghim: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});
