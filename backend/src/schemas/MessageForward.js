import mongoose from 'mongoose';

const messageForwardSchema = new mongoose.Schema({
    originalMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true,
        index: true
    },
    forwardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    forwardedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    newMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    forwardedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index để query: Tin nhắn nào được forward nhiều nhất
messageForwardSchema.index({ originalMessageId: 1, forwardedAt: -1 });
messageForwardSchema.index({ forwardedBy: 1, forwardedAt: -1 });

const MessageForward = mongoose.model('MessageForward', messageForwardSchema);
export default MessageForward;
