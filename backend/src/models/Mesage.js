import mongoose, { mongo } from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        require: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    content: {
        type: String,
        trim: true
    },
    // Thông tin file đính kèm
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'video', 'file'],
        },
        url: String,
        publicId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String
    }],
    recalled: {
        type: Boolean,
        default: false
    },
    recalledAt: {
        type: Date,
        default: null
    },
    pinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    pinnedAt: {
        type: Date,
        default: null
    },
    isForwarded: {
        type: Boolean,
        default: false
    },
    forwardedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    }
},
{
    timestamps: true
}
);

//index: database tạo ra bảng tra cứu nhanh
//trong mongodb : 1-> tăng dần , -1 -> giảm dần
//kết quả: các message nằm chung conversation sẽ dc sắp chung với nhau, thời gian từ mới tới cũ
messageSchema.index({conversationId: 1, createdAt: -1});

const Message = mongoose.model("Message", messageSchema);
export default Message;