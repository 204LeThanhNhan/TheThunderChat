import express from "express";
import bcrypt from 'bcrypt';
import User from '../schemas/User.js';
import jwt from 'jsonwebtoken';
import Session from '../schemas/Session.js';
import crypto from 'crypto';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../utils/emailService.js';
import passport from 'passport';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày

router.post("/signup", async (req, res) => {
    //lấy dữ liệu user gửi server qua body
    try {
        const {username, password, email, firstName, lastName} = req.body;
        if(!username || !password || !email || !firstName || !lastName){
            // lỗi 400: không thể hiểu hoặc xử lý
            return res.status(400).json({message: "Vui lòng nhập đủ username, password, email, firstname, lastname"});
        }

        //kiểm tra username có tồn tại hay chưa
        const duplicate = await User.findOne({username});
        if(duplicate){
            //lỗi 409: lỗi xung đột tài nguyên trên server
            return res.status(409).json({message: "Username này đã tồn tại!"});
        }

        // chưa có -> mã hóa pass
        const hashedPassword = await bcrypt.hash(password, 10); // thực hiện hash 10 lần

        // tạo user mới
        const newUser = await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`
        });

        console.log(`User mới được tạo: ${newUser._id}, username: ${newUser.username}, email: ${newUser.email}`);

        // gửi email chào mừng
        await sendWelcomeEmail(email, newUser.displayName);

        //return
        return res.sendStatus(204); // mã 204 là thông báo resquest thành công, không trả về dữ liệu
    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng ký tài khoản: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post("/signin", async (req, res) => {
    try {
        // lấy username, pass tuwf body request
        const {username, password} = req.body;

        if(!username || !password){
            // khong the xu ly
            return res.status(400).json({message: "Vui lòng nhập đầy đủ username và password!"});   
        }

        //tìm kiếm user
        const user = await User.findOne({username});
        if(!user){
            //unauthorize
            return res.status(401).json({message: "Username hoặc Password không chính xác!"});
        }

        //check password có đúng không?
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect){
            return res.status(401).json({message: "Username hoặc Password không chính xác!"});
        }

        //đăng nhập thành công -> tạo access token (JWT)
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});

        //tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date((Date.now() + REFRESH_TOKEN_TTL))
        });

        //lưu refreshToken trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, //tránh truy cập = javascript
            secure: true, // chỉ gửi qua https
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        });

        // return access token trong res
        //return res.status(200).json({message: `User ${user.displayName} vừa đăng nhập thành công!`}, accessToken);
        return res.status(200).json({
            message: `User ${user.displayName} vừa đăng nhập thành công!`,
            accessToken: accessToken
        });
    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng nhập: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post("/signout", async (req, res) => {
    try {
        //Lấy refresh token từ cookie
        const token = req.cookies.refreshToken;

        if(token){
            //xóa refresh token trong session
            await Session.deleteOne({refreshToken: token});
            //xóa  cookie
            res.clearCookie("refreshToken");
        }
        
        return res.sendStatus(204);
    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng xuất: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
});

router.post("/refresh", async (req, res) => {
    try {
        //lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;
        if(!token){
            return res.status(401).json({message: "Lỗi token không tồn tại!"});
        }

        //so sánh với refresh token có trong db
        const session = await Session.findOne({refreshToken: token});
        if(!session){
            return res.status(403).json({message: "Token không hợp lệ hoặc đã hết hạn"});
        }

        //kiểm tra refresh token có hết hạn
        if(session.expiresAt < new Date()){
            return res.status(403).json({message: "Token đã hết hạn"});
        }

        //return access token mới
        const accessToken = jwt.sign({userId: session.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        return res.status(200).json({accessToken});
    } catch (error) {
        console.error(`Lỗi khi gọi refreshToken: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/signin` }),
    async (req, res) => {
        try {
            const user = req.user;

            //tạo access token
            const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});

            //tạo refresh token
            const refreshToken = crypto.randomBytes(64).toString('hex');

            //tạo session
            await Session.create({
                userId: user._id,
                refreshToken,
                expiresAt: new Date((Date.now() + REFRESH_TOKEN_TTL))
            });

            //lưu refreshToken trong cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: REFRESH_TOKEN_TTL,
            });

            // Redirect về frontend với access token
            res.redirect(`${process.env.CLIENT_URL}?token=${accessToken}`);
        } catch (error) {
            console.error(`Lỗi khi xử lý Google callback: ${error}`);
            res.redirect(`${process.env.CLIENT_URL}/signin?error=auth_failed`);
        }
    }
);


// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Không tiết lộ email có tồn tại hay không (bảo mật)
            return res.status(200).json({ message: "Nếu email tồn tại, bạn sẽ nhận được email đặt lại mật khẩu" });
        }

        // Tạo reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        
        // Cập nhật trực tiếp vào DB
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                resetPasswordToken: resetToken,
                resetPasswordTokenExp: resetPasswordTokenExp
            },
            { new: true }
        );

        console.log(`Token đã lưu - user: ${updatedUser.username}, token: ${updatedUser.resetPasswordToken}, exp: ${updatedUser.resetPasswordTokenExp}`);

        // Gửi email
        await sendResetPasswordEmail(updatedUser.email, updatedUser.displayName, resetToken);

        return res.status(200).json({ message: "Nếu email tồn tại, bạn sẽ nhận được email đặt lại mật khẩu" });
    } catch (error) {
        console.error(`Lỗi khi forgot password: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Reset password cần JWT
router.post('/request-reset-password', protectedRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Tạo reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordTokenExp = new Date(Date.now() + 10 * 60 * 1000); // 10p
        
        // Cập nhật trực tiếp vào DB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                resetPasswordToken: resetToken,
                resetPasswordTokenExp: resetPasswordTokenExp
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User không tồn tại" });
        }

        console.log(`Token đã lưu - user: ${updatedUser.username}, token: ${updatedUser.resetPasswordToken}, exp: ${updatedUser.resetPasswordTokenExp}`);

        // Verify lại từ DB
        const verifyUser = await User.findById(userId).select('username resetPasswordToken resetPasswordTokenExp');
        console.log(`Verify từ DB - user: ${verifyUser.username}, token: ${verifyUser.resetPasswordToken}, exp: ${verifyUser.resetPasswordTokenExp}`);

        // Gửi email
        await sendResetPasswordEmail(updatedUser.email, updatedUser.displayName, resetToken);

        return res.status(200).json({ message: "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư" });
    } catch (error) {
        console.error(`Lỗi khi yêu cầu reset password: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

// Reset password với token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        console.log(`Reset password request - token: ${token}, password length: ${password?.length}`);

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExp: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }

        console.log(`User tìm thấy: ${user.username}, email: ${user.email}`);

        // Cập nhật mật khẩu mới
        const newHashedPassword = await bcrypt.hash(password, 10);
        user.hashedPassword = newHashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordTokenExp = null;
        await user.save();

        console.log(`Mật khẩu đã được cập nhật cho user: ${user.username}`);

        // Xóa tất cả sessions của user (logout khỏi tất cả thiết bị)
        await Session.deleteMany({ userId: user._id });

        return res.status(200).json({ message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại" });
    } catch (error) {
        console.error(`Lỗi khi reset password: ${error}`);
        return res.status(500).json({ message: "Lỗi hệ thống!" });
    }
});

export default router;