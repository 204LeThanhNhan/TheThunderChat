import { MoreVertical, RotateCcw, Pin, PinOff, Forward } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Message } from "@/types/chat";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { useState } from "react";
import ForwardMessageDialog from "./ForwardMessageDialog";

interface MessageActionsProps {
    message: Message;
    isOwn: boolean;
    onRecall: () => void;
    onPin: () => void;
}

const MessageActions = ({ message, isOwn, onRecall, onPin }: MessageActionsProps) => {
    const [loading, setLoading] = useState(false);
    const [forwardDialogOpen, setForwardDialogOpen] = useState(false);

    const handleRecall = async () => {
        try {
            setLoading(true);
            await chatService.recallMessage(message._id);
            onRecall();
            toast.success("Thu hồi tin nhắn thành công");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi thu hồi tin nhắn");
        } finally {
            setLoading(false);
        }
    };

    const handlePin = async () => {
        try {
            setLoading(true);
            await chatService.pinMessage(message._id);
            onPin();
            toast.success(message.pinned ? "Bỏ ghim tin nhắn thành công" : "Ghim tin nhắn thành công");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi ghim tin nhắn");
        } finally {
            setLoading(false);
        }
    };

    if (message.recalled) return null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={loading}
                    >
                        <MoreVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    <DropdownMenuItem onClick={() => setForwardDialogOpen(true)}>
                        <Forward className="size-4 mr-2" />
                        Chuyển tiếp
                    </DropdownMenuItem>
                    {isOwn && !message.recalled && (
                        <DropdownMenuItem onClick={handleRecall}>
                            <RotateCcw className="size-4 mr-2" />
                            Thu hồi
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handlePin}>
                        {message.pinned ? (
                            <>
                                <PinOff className="size-4 mr-2" />
                                Bỏ ghim
                            </>
                        ) : (
                            <>
                                <Pin className="size-4 mr-2" />
                                Ghim
                            </>
                        )}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <ForwardMessageDialog
                open={forwardDialogOpen}
                onOpenChange={setForwardDialogOpen}
                messageId={message._id}
            />
        </>
    );
};

export default MessageActions;
