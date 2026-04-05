import { Shield, Bell, Circle } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useState } from "react";
import StatusPickerDialog from "./StatusPickerDialog";

const PrivacySettings = () => {
    const [loading, setLoading] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);

    const handleRequestResetPassword = async () => {
        try {
            setLoading(true);
            await api.post('/auth/request-reset-password');
            toast.success("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư!");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Có lỗi xảy ra";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationSettings = async () => {
        if (!('Notification' in window)) {
            toast.error("Trình duyệt của bạn không hỗ trợ thông báo");
            return;
        }

        if (Notification.permission === 'granted') {
            toast.info("Thông báo đã được bật. Bạn có thể tắt trong cài đặt trình duyệt.");
            return;
        }

        if (Notification.permission === 'denied') {
            toast.error("Bạn đã từ chối quyền thông báo. Vui lòng bật lại trong cài đặt trình duyệt.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            
            if (permission === 'granted') {
                new Notification('Thông báo đã được bật!', {
                    body: 'Bạn sẽ nhận được thông báo khi có tin nhắn mới',
                    icon: '/logo.svg'
                });
                toast.success("Đã bật thông báo thành công!");
            } else {
                toast.error("Bạn đã từ chối quyền thông báo");
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toast.error("Có lỗi xảy ra khi xin quyền thông báo");
        }
    };

    const getNotificationButtonText = () => {
        if (notificationPermission === 'granted') return 'Thông báo đã bật';
        if (notificationPermission === 'denied') return 'Thông báo bị chặn';
        return 'Bật thông báo';
    };

    return (
    <Card className="glass-strong border-border/30">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Quyền riêng tư & Bảo mật
            </CardTitle>
            <CardDescription>
                Quản lý cài đặt quyền riêng tư và bảo mật của bạn
            </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
            <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-warning"
                onClick={handleRequestResetPassword}
                disabled={loading}
            >
                <Shield className="h-4 w-4 mr-2" />
                {loading ? "Đang gửi email..." : "Đổi mật khẩu"}
            </Button>

            <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-info"
                onClick={handleNotificationSettings}
            >
                <Bell className="h-4 w-4 mr-2" />
                {getNotificationButtonText()}
            </Button>

            <Button
                variant="outline"
                className="w-full justify-start glass-light border-border/30 hover:text-success"
                onClick={() => setStatusDialogOpen(true)}
            >
                <Circle className="h-4 w-4 mr-2 fill-white stroke-black stroke-2" />
                Đặt trạng thái
            </Button>
        </CardContent>
        
        <StatusPickerDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
        />
    </Card>
)};

export default PrivacySettings;