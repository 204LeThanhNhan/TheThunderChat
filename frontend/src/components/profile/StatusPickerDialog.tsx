import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusService } from "@/services/statusService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

interface StatusPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ['📚', '💼', '🎮', '😴', '🍕', '🎵', '🏃', '✈️', '🔥', '💪'];
const DURATIONS = [
    { label: '1 giờ', value: 1 },
    { label: '2 giờ', value: 2 },
    { label: '8 giờ', value: 8 },
    { label: '12 giờ', value: 12 },
    { label: '24 giờ', value: 24 },
    { label: 'Cho đến khi tắt', value: 0 }
];

const StatusPickerDialog = ({ open, onOpenChange }: StatusPickerDialogProps) => {
    const { user } = useAuthStore();
    const [text, setText] = useState('');
    const [emoji, setEmoji] = useState('📚');
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);

    // Load current status when dialog opens
    useEffect(() => {
        if (open && user) {
            loadCurrentStatus();
        }
    }, [open, user]);

    const loadCurrentStatus = async () => {
        try {
            const status = await statusService.getStatus();
            
            if (status && status.isActive) {
                setText(status.text || '');
                setEmoji(status.emoji || '📚');
                
                // Calculate remaining duration
                if (status.expiresAt) {
                    const now = new Date();
                    const expiresAt = new Date(status.expiresAt);
                    const remainingHours = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
                    
                    // Find closest duration
                    const closestDuration = DURATIONS.find(d => d.value >= remainingHours && d.value !== 0);
                    setDuration(closestDuration?.value || 0);
                } else {
                    setDuration(0);
                }
            } else {
                // Reset to defaults if no active status
                setText('');
                setEmoji('📚');
                setDuration(0);
            }
        } catch (error) {
            console.error('Error loading status:', error);
        }
    };

    const handleSave = async () => {
        if (!text.trim()) {
            toast.error("Vui lòng nhập trạng thái");
            return;
        }

        try {
            setLoading(true);
            await statusService.setStatus(text, emoji, duration || undefined);
            toast.success("Đã cập nhật trạng thái");
            onOpenChange(false);
            setText('');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi cập nhật trạng thái");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            setLoading(true);
            await statusService.clearStatus();
            toast.success("Đã xóa trạng thái");
            setText('');
            setEmoji('📚');
            setDuration(0);
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi khi xóa trạng thái");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Đặt trạng thái</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Emoji</Label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {EMOJIS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => setEmoji(e)}
                                    className={`text-2xl p-2 rounded-lg hover:bg-muted transition-colors ${
                                        emoji === e ? 'bg-primary/20 ring-2 ring-primary' : ''
                                    }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="status-text">Trạng thái</Label>
                        <Input
                            id="status-text"
                            placeholder="VD: Đang học, Bận, Đi ngủ..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={100}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label>Thời gian</Label>
                        <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DURATIONS.map((d) => (
                                    <SelectItem key={d.value} value={d.value.toString()}>
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="flex-row gap-2">
                    <Button variant="outline" onClick={handleClear} disabled={loading}>
                        Xóa trạng thái
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Lưu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default StatusPickerDialog;
