import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});



export const sendWelcomeEmail = async (email, displayName) => {
    try {
        const mailOptions = {
            from: `"Thunder Chat ⚡" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⚡ Chào mừng bạn đến với Thunder Chat!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #fffbf0; font-family: 'Segoe UI', Arial, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbf0; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(255, 136, 0, 0.1); overflow: hidden;">
                                    
                                    <!-- Header với gradient vàng cam -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #ff8800 0%, #ffaa00 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                                                ⚡ Thunder Chat
                                            </h1>
                                        </td>
                                    </tr>
                                    
                                    <!-- Nội dung chính -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff8800; font-size: 24px; margin: 0 0 20px 0;">
                                                Xin chào ${displayName}! 👋
                                            </h2>
                                            
                                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Chào mừng bạn đến với <strong style="color: #ff8800;">Thunder Chat</strong> - nền tảng nhắn tin nhanh như chớp! ⚡
                                            </p>
                                            
                                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Tài khoản của bạn đã được tạo thành công. Giờ đây bạn có thể:
                                            </p>
                                            
                                            <!-- Danh sách tính năng -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                                                <tr>
                                                    <td style="padding: 12px; background-color: #fff9e6; border-radius: 8px; margin-bottom: 10px;">
                                                        <span style="font-size: 20px; margin-right: 10px;">💬</span>
                                                        <span style="color: #333; font-size: 15px;">Nhắn tin trực tiếp với bạn bè</span>
                                                    </td>
                                                </tr>
                                                <tr><td style="height: 10px;"></td></tr>
                                                <tr>
                                                    <td style="padding: 12px; background-color: #fff9e6; border-radius: 8px;">
                                                        <span style="font-size: 20px; margin-right: 10px;">👥</span>
                                                        <span style="color: #333; font-size: 15px;">Tạo nhóm chat với nhiều người</span>
                                                    </td>
                                                </tr>
                                                <tr><td style="height: 10px;"></td></tr>
                                                <tr>
                                                    <td style="padding: 12px; background-color: #fff9e6; border-radius: 8px;">
                                                        <span style="font-size: 20px; margin-right: 10px;">🖼️</span>
                                                        <span style="color: #333; font-size: 15px;">Chia sẻ hình ảnh và emoji</span>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                                                Cảm ơn bạn đã tham gia cộng đồng Thunder Chat! 🎉
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #fff9e6; padding: 20px 30px; text-align: center; border-top: 2px solid #ffaa00;">
                                            <p style="color: #666; font-size: 13px; margin: 0; line-height: 1.5;">
                                                Email này được gửi tự động từ Thunder Chat<br>
                                                Vui lòng không trả lời email này
                                            </p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email chào mừng đã được gửi đến ${email}`);
    } catch (error) {
        console.error(`Lỗi khi gửi email chào mừng: ${error}`);
    }
};


export const sendResetPasswordEmail = async (email, displayName, resetToken) => {
    try {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: `"Thunder Chat ⚡" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Đặt lại mật khẩu Thunder Chat',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #fffbf0; font-family: 'Segoe UI', Arial, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbf0; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(255, 136, 0, 0.1); overflow: hidden;">
                                    
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #ff8800 0%, #ffaa00 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                                                ⚡ Thunder Chat
                                            </h1>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #ff8800; font-size: 24px; margin: 0 0 20px 0;">
                                                Xin chào ${displayName}! 🔐
                                            </h2>
                                            
                                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Thunder Chat của mình.
                                            </p>
                                            
                                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                                Nhấn vào nút bên dưới để đặt lại mật khẩu. Link này sẽ hết hạn sau <strong>10 phút</strong>.
                                            </p>
                                            
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding: 20px 0;">
                                                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #ff8800 0%, #ffaa00 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 136, 0, 0.3);">
                                                            Đặt lại mật khẩu
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="background-color: #fff9e6; padding: 20px 30px; text-align: center; border-top: 2px solid #ffaa00;">
                                            <p style="color: #666; font-size: 13px; margin: 0; line-height: 1.5;">
                                                Email này được gửi tự động từ Thunder Chat<br>
                                                Vui lòng không trả lời email này
                                            </p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email đặt lại mật khẩu đã được gửi đến ${email}`);
    } catch (error) {
        console.error(`Lỗi khi gửi email đặt lại mật khẩu: ${error}`);
    }
};
