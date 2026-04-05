import express from 'express';
import User from '../models/User.js';
import { io } from '../socket/index.js';

const router = express.Router();

// Get user status
router.get('/:userId?', async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id;

        const user = await User.findById(userId).select('status displayName avatarUrl');
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // Check if status expired
        if (user.status.expiresAt && new Date() > user.status.expiresAt) {
            user.status.isActive = false;
            user.status.text = '';
            user.status.emoji = '';
            user.status.expiresAt = null;
            await user.save();
        }

        return res.status(200).json({ status: user.status });
    } catch (error) {
        console.error(`Lỗi khi lấy status: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Set user status
router.post('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const { text, emoji, duration } = req.body; // duration in hours

        const user = await User.findById(userId);

        let expiresAt = null;
        if (duration && duration > 0) {
            expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
        }

        user.status = {
            text: text || '',
            emoji: emoji || '',
            expiresAt,
            isActive: true
        };

        await user.save();

        // Emit socket event to friends
        io.emit('user-status-updated', {
            userId,
            status: user.status
        });

        return res.status(200).json({ 
            message: "Đã cập nhật trạng thái",
            status: user.status 
        });
    } catch (error) {
        console.error(`Lỗi khi set status: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Clear user status
router.delete('/', async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        user.status = {
            text: '',
            emoji: '',
            expiresAt: null,
            isActive: false
        };

        await user.save();

        // Emit socket event
        io.emit('user-status-updated', {
            userId,
            status: user.status
        });

        return res.status(200).json({ message: "Đã xóa trạng thái" });
    } catch (error) {
        console.error(`Lỗi khi xóa status: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
