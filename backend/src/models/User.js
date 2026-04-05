import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: {
        type: String //link de hien thi hinh
    },
    avatarId: {
        type: String //luu could public_id de xoa hinh khi can
    },
    bio: {
        type: String,
        maxlength: 500 // toi da dai 500 ky tu
    },
    phone: {
        type: String,
        sparse: true //cho phep null, nhung khong duoc trung
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordTokenExp: {
        type: Date
    },
    // Quick Messages (Tin nhắn nhanh)
    quickMessages: {
        type: Map,
        of: String,
        default: new Map()
        // Example: { "hello": "Xin chào! Tôi có thể giúp gì cho bạn?", "bye": "Tạm biệt! Hẹn gặp lại!" }
    },
    // User Status
    status: {
        text: {
            type: String,
            maxlength: 100,
            default: ''
        },
        emoji: {
            type: String,
            default: ''
        },
        expiresAt: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: false
        }
    }
},{ 
    timestamps: true//createdAt, updatedAt
}
);

const User = mongoose.model("User", userSchema); // tạo model User
export default User; // xuất model User