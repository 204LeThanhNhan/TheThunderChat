import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../schemas/User.js';
import crypto from 'crypto';

export const configureGoogleAuth = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    const displayName = profile.displayName;
                    const avatarUrl = profile.photos[0]?.value;

                    // Tìm user theo email
                    let user = await User.findOne({ email });

                    if (!user) {
                        // Tạo user mới nếu chưa có
                        const username = email.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');
                        const randomPassword = crypto.randomBytes(32).toString('hex');

                        user = await User.create({
                            username,
                            hashedPassword: randomPassword,
                            email,
                            displayName,
                            avatarUrl
                        });

                        console.log(`User mới từ Google: ${user._id}, email: ${user.email}`);
                    } else {
                        console.log(`User đã tồn tại: ${user._id}, email: ${user.email}`);
                    }

                    return done(null, user);
                } catch (error) {
                    console.error(`Lỗi khi xác thực Google: ${error}`);
                    return done(error, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};
