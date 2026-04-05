import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";
import { useNotificationStore } from "@/stores/useNotificationStore";
import UserAvatar from "@/components/chat/UserAvatar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useChatStore } from "@/stores/useChatStore";
import { useNavigate } from "react-router";
import { useDialogStore } from "@/stores/useDialogStore";

interface NotificationItemProps {
    notification: Notification;
}

const NotificationItem = ({ notification }: NotificationItemProps) => {
    const { markAsRead, deleteNotification } = useNotificationStore();
    const { setActiveConversation } = useChatStore();
    const { setFriendRequestOpen } = useDialogStore();
    const navigate = useNavigate();

    const handleClick = async () => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        if (notification.type === 'new_message' && notification.relatedId) {
            setActiveConversation(notification.relatedId);
            navigate('/');
        } else if (notification.type === 'friend_request') {
            setFriendRequestOpen(true);
            navigate('/');
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(notification._id);
    };

    const getNotificationIcon = () => {
        switch (notification.type) {
            case 'friend_request':
                return '👥';
            case 'friend_accepted':
                return '✅';
            case 'new_message':
                return '💬';
            case 'message_reaction':
                return '❤️';
            default:
                return '🔔';
        }
    };

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors group",
                !notification.isRead && "bg-primary/5 border-l-2 border-l-primary cursor-pointer hover:bg-muted/50",
                notification.isRead && "opacity-60"
            )}
            onClick={!notification.isRead ? handleClick : undefined}
        >
            <div className="relative flex-shrink-0">
                {notification.relatedUser ? (
                    <UserAvatar
                        type="chat"
                        name={notification.relatedUser.displayName}
                        avatarUrl={notification.relatedUser.avatarUrl}
                        className="size-10"
                    />
                ) : (
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {getNotificationIcon()}
                    </div>
                )}
                {!notification.isRead && (
                    <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm leading-relaxed",
                    !notification.isRead && "font-medium"
                )}>
                    {notification.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: vi
                    })}
                </p>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={handleDelete}
            >
                <X className="size-4" />
            </Button>
        </div>
    );
};

export default NotificationItem;
