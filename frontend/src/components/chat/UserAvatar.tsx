import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';

interface UserStatus {
    text: string;
    emoji: string;
    expiresAt: string | null;
    isActive: boolean;
}

interface IUserAvatarProps{
    type: "sidebar" | "chat" | "profile";
    name: string;
    avatarUrl?: string;
    className?: string;
    status?: UserStatus | null;
}

const UserAvatar = ({type, name, avatarUrl, className, status} : IUserAvatarProps) => {
    const bgColor = !avatarUrl ? "bg-blue-500" : "";
    if(!name){
        name = "User";
    }

    // Check if status is active and not expired
    const hasActiveStatus = status?.isActive && status?.emoji && 
        (!status?.expiresAt || new Date(status.expiresAt) > new Date());

    return (
        <div className="relative inline-block">
            <Avatar className={cn(className ?? "",
                    type === "sidebar" && "size-12 text-base",
                    type === "chat" && "size-8 text-sm",
                    type === "profile" && "size-24 text-3xl shadow-md")}>
            
                <AvatarImage src={avatarUrl} alt={name}>
                </AvatarImage>

                <AvatarFallback className={`${bgColor} text-white font-semibold`}>
                    {name.charAt(0)}
                </AvatarFallback>

            </Avatar>

            {/* Status Bubble - giống Messenger */}
            {hasActiveStatus && (
                <div className={cn(
                    "absolute rounded-full bg-muted/80 backdrop-blur-sm border border-border shadow-sm flex items-center gap-1 px-2 py-0.5 whitespace-nowrap",
                    type === "sidebar" && "-top-1 -right-18 text-xs max-w-[120px]",
                    type === "chat" && "-top-0.5 -right-18 text-[10px] max-w-[80px]",
                    type === "profile" && "-top-2 -right-4 text-sm max-w-[200px]"
                )}>
                    <span>{status.emoji}</span>
                    {status.text && (
                        <span className="truncate font-medium text-foreground/80">
                            {status.text}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserAvatar;