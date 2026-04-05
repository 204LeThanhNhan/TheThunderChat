import express from 'express';
import User from '../schemas/User.js';

const router = express.Router();

// Get all quick messages
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('quickMessages');

        const quickMessages = user.quickMessages ? Object.fromEntries(user.quickMessages) : {};

        return res.status(200).json({ quickMessages });
    } catch (error) {
        console.error(`Lỗi khi lấy quick messages: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Add/Update quick message
router.post('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const { key, value } = req.body;

        if (!key || !value) {
            return res.status(400).json({ message: "Thiếu key hoặc value" });
        }

        // Validate key format (chỉ chữ, số, gạch dưới)
        if (!/^[a-zA-Z0-9_]+$/.test(key)) {
            return res.status(400).json({ message: "Key chỉ được chứa chữ, số và gạch dưới" });
        }

        const user = await User.findById(userId);
        if (!user.quickMessages) {
            user.quickMessages = new Map();
        }

        user.quickMessages.set(key, value);
        await user.save();

        return res.status(200).json({ 
            message: "Đã lưu tin nhắn nhanh",
            quickMessages: Object.fromEntries(user.quickMessages)
        });
    } catch (error) {
        console.error(`Lỗi khi lưu quick message: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Delete quick message
router.delete('/:key', async (req, res) => {
    try {
        const userId = req.user._id;
        const { key } = req.params;

        const user = await User.findById(userId);
        if (user.quickMessages) {
            user.quickMessages.delete(key);
            await user.save();
        }

        return res.status(200).json({ message: "Đã xóa tin nhắn nhanh" });
    } catch (error) {
        console.error(`Lỗi khi xóa quick message: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Search quick messages by key prefix
router.get('/search/:prefix', async (req, res) => {
    try {
        const userId = req.user._id;
        const { prefix } = req.params;

        const user = await User.findById(userId).select('quickMessages');
        
        if (!user.quickMessages) {
            return res.status(200).json({ suggestions: [] });
        }

        const suggestions = [];
        for (const [key, value] of user.quickMessages.entries()) {
            if (key.startsWith(prefix)) {
                suggestions.push({ key, value });
            }
        }

        return res.status(200).json({ suggestions });
    } catch (error) {
        console.error(`Lỗi khi search quick messages: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
