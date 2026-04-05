import express from 'express';
import User from "../models/User.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import {upload} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({user});
    } catch (error) {
        console.error(`Lỗi khi gọi authMe ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.get("/test", async (req, res) => {
    return res.sendStatus(204);
});

router.get("/search", async (req, res) => {
    try {
        const {username} = req.query;

        if(!username || username.trim() === ""){
            return res.status(400).json({message: "Bạn cần phải nhập username"});
        }

        const user = await User.findOne({username}).select(" _id username displayName avatarUrl");
        return res.status(200).json({user});

    } catch (error) {
        console.error(`Lỗi khi gọi searchUserByUsername ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post("/uploadAvatar", upload.single("file"), async(req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if(!file){
            return res.status(400).json({message: "Không tìm thấy dữ liệu file!"});
        }

        const result = await uploadImageFromBuffer(file.buffer);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if(!updatedUser || !updatedUser.avatarUrl){
            return res.status(400).json({message: "AvatarUrl trả về null"});
        }

        return res.status(200).json({avatarUrl: updatedUser.avatarUrl});
    } catch (error) {
        console.error(`Lỗi khi gọi upload Avatar: ${error}`);
        return res.status(500).json({message: "Có lỗi xảy ra khi upload Avatar"});
    }
});

router.put("/profile", async (req, res) => {
    try {
        const userId = req.user._id;
        const { displayName, bio, phone } = req.body;

        if (!displayName || displayName.trim() === "") {
            return res.status(400).json({ message: "Tên hiển thị không được để trống" });
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({ message: "Giới thiệu không được vượt quá 500 ký tự" });
        }

        // Validate phone nếu có
        if (phone && phone.trim() !== "") {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phone.trim())) {
                return res.status(400).json({ message: "Số điện thoại không hợp lệ (10-11 chữ số)" });
            }
        }

        const updateData = {
            displayName: displayName.trim(),
            bio: bio ? bio.trim() : ""
        };

        // Chỉ update phone nếu có giá trị
        if (phone !== undefined) {
            updateData.phone = phone.trim() || null;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("-hashedPassword");

        if (!updatedUser) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        return res.status(200).json({ 
            message: "Cập nhật thông tin thành công",
            user: updatedUser 
        });
    } catch (error) {
        console.error(`Lỗi khi cập nhật profile: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;
