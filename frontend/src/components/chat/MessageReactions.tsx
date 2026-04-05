import { cn } from "@/lib/utils";
import type { ReactionGroup } from "@/types/notification";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/useAuthStore";

interface MessageReactionsProps {
    reactions: ReactionGroup;
    onReactionClick: (emoji: string) => void;
}

const MessageReactions = ({ reactions, onReactionClick }: MessageReactionsProps) => {
    const { user } = useAuthStore();

    if (!reactions || Object.keys(reactions).length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => {
                const hasReacted = users.some(u => u.userId === user?._id);
                const names = users.map(u => u.displayName).join(', ');
                
                // Chỉ hiện tooltip nếu có người khác react hoặc có nhiều hơn 1 người
                const shouldShowTooltip = users.length > 1 || !hasReacted;

                const reactionButton = (
                    <button
                        onClick={() => onReactionClick(emoji)}
                        className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                            "border transition-all hover:scale-110",
                            hasReacted 
                                ? "bg-primary/20 border-primary" 
                                : "bg-muted border-border hover:bg-muted/80"
                        )}
                    >
                        <span>{emoji}</span>
                        <span className="font-medium">{users.length}</span>
                    </button>
                );

                if (!shouldShowTooltip) {
                    return <div key={emoji}>{reactionButton}</div>;
                }

                return (
                    <TooltipProvider key={emoji}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {reactionButton}
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">{names}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );
};

export default MessageReactions;
