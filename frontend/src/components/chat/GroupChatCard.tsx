import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { cn } from "@/lib/utils";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { getMessagePreview } from "@/lib/messageUtils";

const GroupChatCard = ({convo}: {convo: Conversation}) => {
    const {user} = useAuthStore();
    const{activeConversationId, setActiveConversation, messages, fetchMessages} = useChatStore();

    if(!user){
        return null;
    }

    const unreadCount = convo.unreadCounts[user._id];
    const name = convo.group?.name ?? "";
    const lastMessage = getMessagePreview(convo.lastMessage);

    const handleSelectConversation = async (id: string) => {
        setActiveConversation(id);
        if(!messages[id]){
            await fetchMessages();
        }
        // Đánh dấu đã đọc khi click vào conversation
        await useChatStore.getState().markAsSeen();
    }


    return <ChatCard 
        convoId={convo._id}
        name={name ?? ""}
        timestamp={convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
        isActive={activeConversationId === convo._id}
        onSelect={handleSelectConversation}
        unreadCount={unreadCount}
        leftSection={
            <>
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>}
            <GroupChatAvatar participants={convo.participants} type="chat"/>
            </>
        }
        subtitle={
            <p className={cn("text-sm truncate", unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
                {lastMessage || `${convo.participants.length} thành viên`}
            </p>
        }
    />;
};

export default GroupChatCard;