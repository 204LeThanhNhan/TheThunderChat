import type { Message, LastMessage } from "@/types/chat";

export const getMessagePreview = (message: Message | LastMessage | null | undefined): string => {
    if (!message) return "";
    
    // Nếu tin nhắn đã được thu hồi
    if (message.recalled) {
        return "Tin nhắn đã được thu hồi";
    }
    
    // Nếu có attachments
    if (message.attachments && message.attachments.length > 0) {
        const attachmentLabels = message.attachments.map(att => {
            if (att.type === 'image') return '[Hình ảnh]';
            if (att.type === 'video') return '[Video]';
            return '[File]';
        });
        
        const preview = attachmentLabels.join(' ');
        
        // Nếu có cả text content
        if (message.content && message.content.trim()) {
            return `${preview} ${message.content}`;
        }
        
        return preview;
    }
    
    // Chỉ có text
    return message.content || "";
};
