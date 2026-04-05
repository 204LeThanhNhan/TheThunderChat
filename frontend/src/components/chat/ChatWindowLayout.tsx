import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import ChatWindowSkeleton from "./ChatWindowSkeleton";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import PinnedMessageBanner from "./PinnedMessageBanner";
import { useEffect, useState } from "react";
import { blockService } from "@/services/blockService";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import { toast } from "sonner";


const ChatWindowLayout = () => {
    const {activeConversationId, conversations, messageLoading: loading, messages, markAsSeen} = useChatStore();
    const {user} = useAuthStore();
    const [blockStatus, setBlockStatus] = useState<{iBlockThem: boolean, theyBlockMe: boolean} | null>(null);
    const [checkingBlock, setCheckingBlock] = useState(false);

    const selectedConvo = conversations.find((c) => c._id === activeConversationId) ?? null;
    
    // Get other user in direct conversation
    const otherUser = selectedConvo?.type === 'direct' 
        ? selectedConvo.participants.find((p) => p._id !== user?._id)
        : null;

    // Check block status when conversation changes
    useEffect(() => {
        if (!selectedConvo || selectedConvo.type !== 'direct' || !otherUser) {
            setBlockStatus(null);
            return;
        }

        const checkBlock = async () => {
            try {
                setCheckingBlock(true);
                const status = await blockService.checkBlocked(otherUser._id);
                setBlockStatus(status);
            } catch (error) {
                console.error('Lỗi khi check block:', error);
            } finally {
                setCheckingBlock(false);
            }
        };

        checkBlock();

        // Listen for block status changes from socket events
        const handleBlockStatusChange = () => {
            checkBlock();
        };

        window.addEventListener('block-status-changed', handleBlockStatusChange);
        
        return () => {
            window.removeEventListener('block-status-changed', handleBlockStatusChange);
        };
    }, [selectedConvo, otherUser]);

    useEffect(() => {
        if(!selectedConvo){
            return;
        }

        const markSeen = async () => {
            try {
                await markAsSeen();
            } catch (error) {
                console.error(`Lỗi xảy ra khi mark as seen: ${error}`);
            }
        }

        markSeen();
    }, [markAsSeen, selectedConvo]);

    const handleUnblock = async () => {
        if (!otherUser) return;
        
        try {
            await blockService.unblockUser(otherUser._id);
            toast.success(`Đã bỏ chặn ${otherUser.displayName}`);
            setBlockStatus({iBlockThem: false, theyBlockMe: false});
            // Dispatch event để DirectMessageCard cập nhật
            window.dispatchEvent(new CustomEvent('block-status-changed'));
        } catch (error) {
            console.error('Lỗi khi bỏ chặn:', error);
            toast.error('Không thể bỏ chặn người dùng');
        }
    };

    if(!selectedConvo){
        return <ChatWelcomeScreen />;
    }

    if(loading){
        return <ChatWindowSkeleton />;
    }

    const isBlocked = blockStatus?.iBlockThem || blockStatus?.theyBlockMe;

    return (
        <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md">
        {/* Header */}
        <ChatWindowHeader chat={selectedConvo}/>

        {/* Pinned Message Banner */}
        <PinnedMessageBanner 
            conversationId={selectedConvo._id}
            onMessageClick={(messageId) => {
                // Scroll to message
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    messageElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // Highlight effect
                    messageElement.classList.add('bg-primary/10');
                    setTimeout(() => {
                        messageElement.classList.remove('bg-primary/10');
                    }, 2000);
                }
            }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-primary-foreground">
            <ChatWindowBody />
        </div>

        {/* Footer - Show block notification or message input */}
        {isBlocked ? (
            <div className="border-t bg-muted/30 p-6">
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
                    <div className="rounded-full bg-muted p-3">
                        <ShieldOff className="size-6 text-muted-foreground" />
                    </div>
                    
                    {blockStatus?.iBlockThem ? (
                        <>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">
                                    Bạn đã chặn {otherUser?.displayName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Bạn không thể gửi tin nhắn cho người này. Bỏ chặn để tiếp tục trò chuyện.
                                </p>
                            </div>
                            <Button 
                                onClick={handleUnblock}
                                variant="outline"
                                className="mt-2"
                            >
                                Bỏ chặn
                            </Button>
                        </>
                    ) : (
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">
                                Bạn không thể nhắn tin cho người này
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Người dùng này đã hạn chế khả năng nhắn tin với bạn.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <MessageInput selectedConvo={selectedConvo}/>
        )}

        
        </SidebarInset>
    )
};

export default ChatWindowLayout;