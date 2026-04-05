import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useEffect } from "react";
import NotificationList from "./NotificationList";

const NotificationBell = () => {
    const { unreadCount, fetchNotifications, fetchUnreadCount } = useNotificationStore();

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            fetchNotifications();
        }
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                    <Bell className="size-5 text-white" />
                    {unreadCount > 0 && (
                        <Badge 
                            className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <NotificationList />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;
