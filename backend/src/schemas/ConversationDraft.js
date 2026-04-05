import mongoose from 'mongoose';

const conversationDraftSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'file']
        },
        url: String,
        fileName: String,
        fileSize: Number,
        mimeType: String
    }],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, {
    timestamps: true
});

// Unique: Mỗi user chỉ có 1 draft cho 1 conversation
conversationDraftSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

const ConversationDraft = mongoose.model('ConversationDraft', conversationDraftSchema);
export default ConversationDraft;
