import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { forwardService } from "@/services/forwardService";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import { Loader2 } from "lucide-react";

interface ForwardMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    messageId: string;
}

const ForwardMessageDialog = ({ open, onOpenChange, messageId }: ForwardMessageDialogProps) => {
    const { conversations } = useChatStore();
    const { user } = useAuthStore();
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleConversation = (conversationId: string) => {
        setSelectedConversations(prev =>
            prev.includes(conversationId)
                ? prev.filter(id => id !== conversationId)
                : [...prev, conversationId]
        );
    };

    const handleForward = async () => {
        if (selectedConversations.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 cuộc trò chuyện");
            return;
        }

        try {
            setLoading(true);
            const result = await forwardService.forwardMessage(messageId, selectedConversations);
            
            if (result.failed > 0) {
                toast.warning(`Chuyển tiếp thành công ${result.success}/${result.success + result.failed} cuộc trò chuyện`);
            } else {
                toast.success(`Đã chuyển tiếp đến ${result.success} cuộc trò chuyện`);
            }
            
            onOpenChange(false);
            setSelectedConversations([]);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi chuyển tiếp tin nhắn");
        } finally {
            setLoading(false);
        }
    };

    const getConversationName = (conversation: any) => {
        if (conversation.type === 'group') {
            return conversation.group?.name || 'Nhóm';
        }
        // Direct chat - get other participant (not current user)
        const otherParticipant = conversation.participants?.find(
            (p: any) => p._id !== user?._id
        );
        return otherParticipant?.displayName || 'Người dùng';
    };

    const getConversationAvatar = (conversation: any) => {
        if (conversation.type === 'group') {
            return null;
        }
        const otherParticipant = conversation.participants?.find(
            (p: any) => p._id !== user?._id
        );
        return otherParticipant?.avatarUrl;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chuyển tiếp tin nhắn</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-96 pr-4">
                    <div className="space-y-2">
                        {conversations.map((conversation) => (
                            <div
                                key={conversation._id}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                                onClick={() => toggleConversation(conversation._id)}
                            >
                                <Checkbox
                                    checked={selectedConversations.includes(conversation._id)}
                                    onCheckedChange={() => toggleConversation(conversation._id)}
                                />
                                <UserAvatar
                                    type="chat"
                                    name={getConversationName(conversation)}
                                    avatarUrl={getConversationAvatar(conversation)}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {getConversationName(conversation)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {conversation.type === 'group' ? 'Nhóm chat' : 'Trò chuyện'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleForward} disabled={loading || selectedConversations.length === 0}>
                        {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Chuyển tiếp ({selectedConversations.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ForwardMessageDialog;
