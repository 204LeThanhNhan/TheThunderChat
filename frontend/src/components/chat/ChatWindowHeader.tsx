import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "@radix-ui/react-separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { MoreVertical, Info } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState } from "react";
import UserInfoDialog from "./UserInfoDialog";


const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
    const { conversations, activeConversationId } = useChatStore();
    const { user } = useAuthStore();
    const {onlineUsers} = useSocketStore();
    const [userInfoOpen, setUserInfoOpen] = useState(false);
    let otherUser;

    chat = chat ?? conversations.find((c) => c._id === activeConversationId);
    if (!chat) {
        return (
            <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
                <SidebarTrigger className="-ml-1 text-foreground" />
            </header>
        );
    }

    if (chat.type === "direct") {
        const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
        otherUser = otherUsers.length > 0 ? otherUsers[0] : null;
        if (!user || !otherUser) {
            return null;
        }
    }

    return (
        <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
            <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1 text-foreground" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

                <div className="p-2 w-full flex items-center gap-3">
                    <div className="relative">
                        {
                            chat.type === "direct" ?
                                (
                                    <>
                                        <UserAvatar
                                            type={"sidebar"}
                                            name={otherUser?.displayName || "Thunder User"}
                                            avatarUrl={otherUser?.avatarUrl || undefined}
                                            status={otherUser?.status}
                                        />
                                        <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
                                    </>
                                )
                                :
                                (
                                    <>
                                        <GroupChatAvatar
                                            participants={chat.participants}
                                            type="sidebar"
                                        />
                                    </>
                                )
                        }
                    </div>
                    
                    <div className="flex-1">
                        <h2 className="font-semibold text-foreground">
                            {
                                chat.type === "direct" ? otherUser?.displayName : chat.group?.name
                            }
                        </h2>
                        {chat.type === "direct" && (
                            <p className="text-xs text-muted-foreground">
                                {onlineUsers.includes(otherUser?._id ?? "") ? "Đang hoạt động" : "Không hoạt động"}
                            </p>
                        )}
                    </div>

                    {/* Menu button */}
                    {chat.type === "direct" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="size-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setUserInfoOpen(true)}>
                                    <Info className="size-4 mr-2" />
                                    Xem thông tin
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* User Info Dialog */}
            {chat.type === "direct" && (
                <UserInfoDialog
                    open={userInfoOpen}
                    onOpenChange={setUserInfoOpen}
                    user={otherUser || null}
                />
            )}
        </header>
    );
}

export default ChatWindowHeader;