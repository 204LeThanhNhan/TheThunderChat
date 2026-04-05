import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import {cn} from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { getMessagePreview } from "@/lib/messageUtils";
import { blockService } from "@/services/blockService";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DirectMessageCard = ( {convo}: {convo: Conversation}) => {
    const {user} = useAuthStore();
    const{activeConversationId, setActiveConversation, messages, fetchMessages} = useChatStore();
    const {onlineUsers} = useSocketStore();
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [userToBlock, setUserToBlock] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);

    if(!user){
        return null;
    }
    
    const otherUser = convo.participants.find((p) => p._id !== user._id);
    if(!otherUser){
        return null;
    }

    const unreadCount = convo.unreadCounts[user._id];
    const lastMessage = getMessagePreview(convo.lastMessage);

    // Check block status
    useEffect(() => {
        const checkBlock = async () => {
            try {
                const status = await blockService.checkBlocked(otherUser._id);
                setIsBlocked(status.isBlocked);
            } catch (error) {
                console.error('Lỗi khi check block:', error);
            }
        };

        checkBlock();

        // Listen for block status changes
        const handleBlockStatusChange = () => {
            checkBlock();
        };

        window.addEventListener('block-status-changed', handleBlockStatusChange);
        
        return () => {
            window.removeEventListener('block-status-changed', handleBlockStatusChange);
        };
    }, [otherUser._id]);

    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id);
        if(!messages[id]){
            await fetchMessages();
        }
        // Đánh dấu đã đọc khi click vào conversation
        await useChatStore.getState().markAsSeen();
    }

    const handleBlockUser = (userId: string) => {
        setUserToBlock(userId);
        setShowBlockDialog(true);
    };

    const confirmBlock = async () => {
        if (!userToBlock) return;
        
        try {
            await blockService.blockUser(userToBlock);
            toast.success(`Đã chặn ${otherUser.displayName}`);
            setShowBlockDialog(false);
            setUserToBlock(null);
            // Trigger block status change event
            window.dispatchEvent(new CustomEvent('block-status-changed'));
        } catch (error) {
            console.error('Lỗi khi chặn người dùng:', error);
            toast.error('Không thể chặn người dùng');
        }
    };

    return (
        <>
            <ChatCard 
                convoId={convo._id}
                name={otherUser.displayName ?? ""}
                timestamp={convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
                isActive={activeConversationId === convo._id}
                onSelect={handleSelectConversation}
                unreadCount={unreadCount}
                conversationType="direct"
                otherUserId={otherUser._id}
                onBlockUser={handleBlockUser}
                leftSection={
                    <>
                        <UserAvatar 
                            type="sidebar"
                            name={otherUser.displayName ?? ""}
                            avatarUrl={otherUser.avatarUrl ?? undefined}
                            status={otherUser.status}
                            />
                            {/* xử lý StatusBadge sau khi có Socket.io */}
                            <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
                        {
                            unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>
                        }
                    </>
                }
                subtitle={
                    <p className={cn("text-sm truncate", unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                        {isBlocked ? "🚫 Đã chặn" : lastMessage}
                    </p>
                }
            />

            <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chặn {otherUser.displayName}?</DialogTitle>
                        <DialogDescription>
                            Sau khi chặn, cả hai bên sẽ không thể gửi tin nhắn cho nhau. 
                            Bạn có thể bỏ chặn bất cứ lúc nào trong cài đặt.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={confirmBlock}>
                            Chặn
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DirectMessageCard;