import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Participant } from "@/types/chat";
import { useSocketStore } from "@/stores/useSocketStore";

interface UserInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: Participant | null;
}

const UserInfoDialog = ({ open, onOpenChange, user }: UserInfoDialogProps) => {
    const { onlineUsers } = useSocketStore();
    
    if (!user) return null;

    const isOnline = onlineUsers.includes(user._id);
    const bio = "Người dùng này chưa có mô tả bản thân";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-y-auto p-0 max-h-[95vh] w-[90vw] max-w-[1400px] bg-transparent border-0 shadow-2xl">
                <div className="bg-gradient-glass h-full">
                    <div className="w-full mx-auto p-6">
                        {/* Header */}
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-bold text-foreground">
                                Thông tin người dùng
                            </DialogTitle>
                        </DialogHeader>

                        {/* Profile Card */}
                        <Card className="overflow-hidden p-0 h-52 bg-gradient-to-r from-indigo-500 to-pink-500">
                            <CardContent className="mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                                <div className="relative inline-block">
                                    <UserAvatar 
                                        type="profile" 
                                        name={user.displayName || "Thunder User"} 
                                        avatarUrl={user.avatarUrl || undefined}
                                        className="ring-4 ring-white shadow-lg"
                                    />
                                </div>

                                {/* User info */}
                                <div className="text-center sm:text-left flex-1">
                                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                                        {user.displayName}
                                    </h1>

                                    <p className="text-white/70 text-sm mt-2 max-w-lg line-clamp-2">
                                        {bio}
                                    </p>
                                </div>

                                {/* Online/Offline badge */}
                                <Badge className={cn(
                                    "flex items-center gap-1 capitalize", 
                                    isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                )}>
                                    <div className={cn(
                                        "size-2 rounded-full", 
                                        isOnline ? "bg-green-500" : "bg-slate-500"
                                    )} />
                                    {isOnline ? "online" : "offline"}
                                </Badge>
                            </CardContent>
                        </Card>

                        {/* Info Card */}
                        <Card className="mt-6 glass-light">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Thông tin cá nhân</h3>
                                <div className="space-y-4">
                                    {/* Username */}
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Tên hiển thị
                                        </label>
                                        <p className="mt-1 text-foreground">{user.displayName}</p>
                                    </div>

                                    {/* User ID */}
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            User ID
                                        </label>
                                        <p className="mt-1 text-foreground text-sm break-all">{user._id}</p>
                                    </div>

                                    {/* Joined Date */}
                                    {user.joinedAt && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Tham gia lúc
                                            </label>
                                            <p className="mt-1 text-foreground">
                                                {new Date(user.joinedAt).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserInfoDialog;
