import express from 'express';
import ConversationDraft from '../models/ConversationDraft.js';

const router = express.Router();


router.get('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const draft = await ConversationDraft.findOne({ userId, conversationId });

        return res.status(200).json({ draft });
    } catch (error) {
        console.error(`Lỗi khi lấy draft: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Save/Update draft
router.post('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const { content, attachments, replyTo } = req.body;

        // Nếu content rỗng và không có attachments, xóa draft
        if (!content && (!attachments || attachments.length === 0)) {
            await ConversationDraft.findOneAndDelete({ userId, conversationId });
            return res.status(200).json({ message: "Draft đã xóa" });
        }

        const draft = await ConversationDraft.findOneAndUpdate(
            { userId, conversationId },
            { content, attachments, replyTo },
            { upsert: true, new: true }
        );

        return res.status(200).json({ draft });
    } catch (error) {
        console.error(`Lỗi khi lưu draft: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Delete draft
router.delete('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await ConversationDraft.findOneAndDelete({ userId, conversationId });

        return res.status(200).json({ message: "Draft đã xóa" });
    } catch (error) {
        console.error(`Lỗi khi xóa draft: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
