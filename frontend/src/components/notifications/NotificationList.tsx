import { useNotificationStore } from "@/stores/useNotificationStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCheck, Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationList = () => {
    const { notifications, loading, markAllAsRead, unreadCount } = useNotificationStore();

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-20" />
                </div>
                <Separator />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-2">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-h-96">
            <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="font-semibold">Thông báo</h3>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                    >
                        <CheckCheck className="size-3 mr-1" />
                        Đánh dấu tất cả
                    </Button>
                )}
            </div>
            
            <Separator />

            <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Bell className="size-12 mx-auto mb-2 opacity-50" />
                        <p>Không có thông báo nào</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {notifications.map((notification) => (
                            <NotificationItem 
                                key={notification._id} 
                                notification={notification} 
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

export default NotificationList;
