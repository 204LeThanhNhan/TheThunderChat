import {Card} from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatCardProps{
    convoId: string;
    name: string;
    timestamp?: Date;
    isActive: boolean;
    onSelect: (id: string) => void;
    unreadCount?: number;
    leftSection: React.ReactNode; //hiển thị avatar
    subtitle: React.ReactNode; //hiển thị tin nhắn cuối
    conversationType?: "direct" | "group";
    otherUserId?: string;
    onBlockUser?: (userId: string) => void;
}

const ChatCard = ({
    convoId,name,timestamp,isActive,onSelect,unreadCount,leftSection,subtitle,
    conversationType,otherUserId,onBlockUser
}: ChatCardProps) => {
    
    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <Card key={convoId} className={cn("border-none p-3 cursor-pointer transition-smooth glass hover: bg-muted/30 group",
        isActive && "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground")}
        onClick={() => onSelect(convoId)}>

        <div className="flex items-center gap-3">
            <div className="relative">{leftSection}</div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className={cn("font-semibold text-sm truncate", unreadCount && unreadCount > 0 && "text-foreground")}>
                        {name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {timestamp ? formatOnlineTime(timestamp) : ""}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>
                    
                    {conversationType === "direct" && otherUserId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="size-4 text-muted-foreground hover:text-foreground"/>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={handleMenuClick}>
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onBlockUser?.(otherUserId)}
                                >
                                    Chặn người dùng
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
        
        </Card>
    );
};

export default ChatCard;