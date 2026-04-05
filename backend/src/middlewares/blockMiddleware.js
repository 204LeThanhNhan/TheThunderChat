import BlockedUser from '../models/BlockedUser.js';

// Middleware to check if users have blocked each other
export const checkBlocked = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { recipientId, to } = req.body;
        const targetUserId = recipientId || to;

        if (!targetUserId) {
            return next(); // Không có target user, skip check
        }

        // Check 2 chiều: A block B hoặc B block A
        const [iBlockThem, theyBlockMe] = await Promise.all([
            BlockedUser.exists({ blockerId: userId, blockedId: targetUserId }),
            BlockedUser.exists({ blockerId: targetUserId, blockedId: userId })
        ]);

        if (iBlockThem) {
            return res.status(403).json({ 
                message: "Bạn đã chặn người dùng này. Vui lòng bỏ chặn để tiếp tục." 
            });
        }

        if (theyBlockMe) {
            return res.status(403).json({ 
                message: "Bạn không thể thực hiện hành động này." 
            });
        }

        next();
    } catch (error) {
        console.error(`Lỗi khi check block: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
};
