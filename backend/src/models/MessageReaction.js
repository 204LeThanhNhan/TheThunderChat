import mongoose from 'mongoose';

const messageReactionSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String,
        enum: ['👍', '❤️', '😂', '😮', '😢', '😡'],
        required: true
    }
}, {
    timestamps: true
});

messageReactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });

const MessageReaction = mongoose.model('MessageReaction', messageReactionSchema);
export default MessageReaction;
