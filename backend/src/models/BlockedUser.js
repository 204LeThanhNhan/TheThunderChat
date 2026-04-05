import mongoose from 'mongoose';

const blockedUserSchema = new mongoose.Schema({
    blockerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    blockedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String,
        enum: ['spam', 'harassment', 'inappropriate', 'other'],
        default: 'other'
    },
    note: {
        type: String,
        maxlength: 500
    },
    blockedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique: A không thể block B nhiều lần
blockedUserSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

// Index để check nhanh: A có block B không? B có block A không?
blockedUserSchema.index({ blockerId: 1, blockedId: 1 });

const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
export default BlockedUser;
