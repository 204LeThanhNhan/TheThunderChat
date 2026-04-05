import express from 'express';
import Notification from '../schemas/Notification.js';

const router = express.Router();

// Get all noti
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, skip = 0 } = req.query;

        const notifications = await Notification.find({ userId })
            .populate('relatedUser', 'displayName avatarUrl')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error(`Lỗi khi lấy notifications: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Mark noti as read
router.patch('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification không tồn tại" });
        }

        return res.status(200).json({ message: "Đã đánh dấu đã đọc", notification });
    } catch (error) {
        console.error(`Lỗi khi mark as read: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Mark all noti as read
router.patch('/read-all', async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        return res.status(200).json({ message: "Đã đánh dấu tất cả đã đọc" });
    } catch (error) {
        console.error(`Lỗi khi mark all as read: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Delete noti
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification không tồn tại" });
        }

        return res.status(200).json({ message: "Đã xóa notification" });
    } catch (error) {
        console.error(`Lỗi khi xóa notification: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Get unread noti count
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ userId, isRead: false });
        return res.status(200).json({ count });
    } catch (error) {
        console.error(`Lỗi khi lấy unread count: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
