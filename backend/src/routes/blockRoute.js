import express from 'express';
import BlockedUser from '../schemas/BlockedUser.js';
import User from '../schemas/User.js';
import { io } from '../socket/index.js';

const router = express.Router();

// Block a user
router.post('/', async (req, res) => {
    try {
        const { userId, reason, note } = req.body;
        const blockerId = req.user._id;

        if (!userId) {
            return res.status(400).json({ message: "Thiếu userId" });
        }

        if (blockerId.toString() === userId) {
            return res.status(400).json({ message: "Không thể chặn chính mình" });
        }

        // Check if user exists
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        // Check if already blocked
        const existingBlock = await BlockedUser.findOne({ blockerId, blockedId: userId });
        if (existingBlock) {
            return res.status(400).json({ message: "Đã chặn người dùng này rồi" });
        }

        const block = await BlockedUser.create({
            blockerId,
            blockedId: userId,
            reason,
            note
        });

        // Emit socket event to blocked user (optional - để họ biết)
        io.to(userId.toString()).emit('user-blocked', { blockerId });

        return res.status(201).json({ message: "Đã chặn người dùng", block });
    } catch (error) {
        console.error(`Lỗi khi chặn người dùng: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Unblock a user
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const blockerId = req.user._id;

        const block = await BlockedUser.findOneAndDelete({ blockerId, blockedId: userId });

        if (!block) {
            return res.status(404).json({ message: "Không tìm thấy block record" });
        }

        // Emit socket event
        io.to(userId.toString()).emit('user-unblocked', { blockerId });

        return res.status(200).json({ message: "Đã bỏ chặn người dùng" });
    } catch (error) {
        console.error(`Lỗi khi bỏ chặn người dùng: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Get blocked users list
router.get('/', async (req, res) => {
    try {
        const blockerId = req.user._id;

        const blocks = await BlockedUser.find({ blockerId })
            .populate('blockedId', 'displayName avatarUrl username')
            .sort({ blockedAt: -1 });

        return res.status(200).json({ blocks });
    } catch (error) {
        console.error(`Lỗi khi lấy danh sách chặn: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Check if blocked (2-way check)
router.get('/check/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const [iBlockThem, theyBlockMe] = await Promise.all([
            BlockedUser.exists({ blockerId: currentUserId, blockedId: userId }),
            BlockedUser.exists({ blockerId: userId, blockedId: currentUserId })
        ]);

        return res.status(200).json({ 
            iBlockThem: !!iBlockThem,
            theyBlockMe: !!theyBlockMe,
            isBlocked: !!(iBlockThem || theyBlockMe)
        });
    } catch (error) {
        console.error(`Lỗi khi check block: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
