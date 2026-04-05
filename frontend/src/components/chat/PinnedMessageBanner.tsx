import { Pin, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { chatService } from "@/services/chatService";
import type { Message } from "@/types/chat";
import { useSocketStore } from "@/stores/useSocketStore";

interface PinnedMessageBannerProps {
    conversationId: string;
    onMessageClick?: (messageId: string) => void;
}

const PinnedMessageBanner = ({ conversationId, onMessageClick }: PinnedMessageBannerProps) => {
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const socket = useSocketStore(state => state.socket);

    useEffect(() => {
        fetchPinnedMessages();
    }, [conversationId]);

    useEffect(() => {
        if (!socket) return;

        const handleMessagePinned = ({ conversationId: eventConvoId }: { conversationId: string }) => {
            if (eventConvoId === conversationId) {
                fetchPinnedMessages();
            }
        };

        socket.on('message-pinned', handleMessagePinned);

        return () => {
            socket.off('message-pinned', handleMessagePinned);
        };
    }, [socket, conversationId]);

    const fetchPinnedMessages = async () => {
        try {
            setLoading(true);
            const messages = await chatService.getPinnedMessages(conversationId);
            setPinnedMessages(messages);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Error fetching pinned messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnpin = async () => {
        try {
            const currentMessage = pinnedMessages[currentIndex];
            await chatService.pinMessage(currentMessage._id);
            // Refresh pinned messages
            await fetchPinnedMessages();
        } catch (error) {
            console.error('Error unpinning message:', error);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
    };

    const getMessagePreview = (message: Message) => {
        if (message.recalled) {
            return "Tin nhắn đã được thu hồi";
        }
        
        if (message.attachments && message.attachments.length > 0) {
            const labels = message.attachments.map(att => {
                if (att.type === 'image') return '[Hình ảnh]';
                if (att.type === 'video') return '[Video]';
                return '[File]';
            });
            const preview = labels.join(' ');
            if (message.content) {
                return `${preview} ${message.content}`;
            }
            return preview;
        }
        return message.content || "";
    };

    if (loading || pinnedMessages.length === 0) {
        return null;
    }

    const currentMessage = pinnedMessages[currentIndex];

    return (
        <div className="bg-primary/10 border-b border-border px-4 py-2 flex items-center gap-3">
            <Pin className="size-4 text-primary flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">Tin nhắn đã ghim</span>
                    {pinnedMessages.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                            {currentIndex + 1}/{pinnedMessages.length}
                        </span>
                    )}
                </div>
                <p 
                    className="text-sm truncate cursor-pointer hover:underline"
                    onClick={() => onMessageClick?.(currentMessage._id)}
                >
                    {getMessagePreview(currentMessage)}
                </p>
            </div>

            {pinnedMessages.length > 1 && (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={handlePrev}
                    >
                        <ChevronUp className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={handleNext}
                    >
                        <ChevronDown className="size-4" />
                    </Button>
                </div>
            )}

            <Button
                variant="ghost"
                size="icon"
                className="size-6 flex-shrink-0"
                onClick={handleUnpin}
            >
                <X className="size-4" />
            </Button>
        </div>
    );
};

export default PinnedMessageBanner;
