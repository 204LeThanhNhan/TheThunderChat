import { Sun, Moon, MessageSquare, Plus, Trash2 } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/useThemeStore";
import { useQuickMessages } from "@/hooks/useQuickMessages";
import { useState } from "react";
import { toast } from "sonner";

const PreferencesForm = () => {
    const { isDark, toggleTheme } = useThemeStore();
    const { quickMessages, saveQuickMessage, deleteQuickMessage, loading } = useQuickMessages();
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const handleAddOrUpdateQuickMessage = async () => {
        if (!newKey.trim() || !newValue.trim()) {
            toast.error("Vui lòng nhập đầy đủ key và nội dung");
            return;
        }

        try {
            await saveQuickMessage(newKey, newValue);
            toast.success(editingKey ? "Đã cập nhật tin nhắn nhanh" : "Đã lưu tin nhắn nhanh");
            setNewKey("");
            setNewValue("");
            setEditingKey(null);
        } catch (error) {
            toast.error("Không thể lưu tin nhắn nhanh");
        }
    };

    const handleEditQuickMessage = (key: string, value: string) => {
        setNewKey(key);
        setNewValue(value);
        setEditingKey(key);
    };

    const handleCancelEdit = () => {
        setNewKey("");
        setNewValue("");
        setEditingKey(null);
    };

    const handleDeleteQuickMessage = async (key: string) => {
        try {
            await deleteQuickMessage(key);
            toast.success("Đã xóa tin nhắn nhanh");
        } catch (error) {
            toast.error("Không thể xóa tin nhắn nhanh");
        }
    };

    const quickMessagesArray = Object.entries(quickMessages);

    return (
        <div className="space-y-4">
            <Card className="glass-strong border-border/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="h-5 w-5 text-primary" />
                        Giao diện
                    </CardTitle>
                    <CardDescription>Cá nhân hoá giao diện ứng dụng</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label
                                htmlFor="theme-toggle"
                                className="text-base font-medium"
                            >
                                Chế độ tối
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Chuyển đổi giữa giao diện sáng và tối
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            <Switch
                                id="theme-toggle"
                                checked={isDark}
                                onCheckedChange={toggleTheme}
                                className="data-[state=checked]:bg-primary-glow"
                            />
                            <Moon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-strong border-border/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Tin nhắn nhanh
                    </CardTitle>
                    <CardDescription>
                        Tạo các tin nhắn nhanh để sử dụng với lệnh / trong chat
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 max-w-4xl">
                    {/* Add/Edit quick message */}
                    <div className="space-y-2 p-4 bg-muted/30 rounded-lg max-w-full">
                        <Label className="text-sm font-medium">
                            {editingKey ? `Chỉnh sửa: /${editingKey}` : "Thêm tin nhắn nhanh mới"}
                        </Label>
                        <div className="space-y-2 max-w-full">
                            <Input
                                placeholder="Key (vd: hello)"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                disabled={!!editingKey}
                                className="w-full"
                            />
                            <Textarea
                                placeholder="Nội dung tin nhắn"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="min-h-[80px] max-h-[200px] w-full resize-none"
                                maxLength={500}
                            />
                            <div className="text-xs text-muted-foreground text-right">
                                {newValue.length}/500 ký tự
                            </div>
                            <div className="flex gap-2 justify-end">
                                {editingKey ? (
                                    <>
                                        <Button
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                            variant="outline"
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={handleAddOrUpdateQuickMessage}
                                            disabled={loading}
                                        >
                                            Cập nhật
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={handleAddOrUpdateQuickMessage}
                                        disabled={loading}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm
                                    </Button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {editingKey 
                                ? "Chỉnh sửa nội dung tin nhắn nhanh" 
                                : `Sử dụng: Gõ /${newKey || "key"} trong chat để chèn tin nhắn`
                            }
                        </p>
                    </div>

                    {/* List of quick messages */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Danh sách tin nhắn nhanh ({quickMessagesArray.length})
                        </Label>
                        {quickMessagesArray.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {quickMessagesArray.map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => handleEditQuickMessage(key, value)}
                                    >
                                        <div className="flex-1 min-w-0 break-words">
                                            <div className="text-sm font-medium text-primary mb-1">
                                                /{key}
                                            </div>
                                            <div className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                                                {value}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuickMessage(key);
                                            }}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                Chưa có tin nhắn nhanh nào. Thêm tin nhắn đầu tiên ở trên!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PreferencesForm;