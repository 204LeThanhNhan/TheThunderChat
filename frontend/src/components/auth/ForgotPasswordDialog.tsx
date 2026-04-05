import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const ForgotPasswordDialog = () => {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Vui lòng nhập email");
            return;
        }

        try {
            setLoading(true);
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            await axios.post(`${apiUrl}/auth/forgot-password`, { email });
            toast.success("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư!");
            setOpen(false);
            setEmail("");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Có lỗi xảy ra";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button 
                    type="button"
                    className="text-sm text-primary hover:underline underline-offset-4"
                    onClick={(e) => e.preventDefault()}
                >
                    Quên mật khẩu?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Quên mật khẩu</DialogTitle>
                    <DialogDescription>
                        Nhập email của bạn để nhận link đặt lại mật khẩu
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="forgot-email">Email</Label>
                        <Input
                            id="forgot-email"
                            name="forgot-email"
                            type="email"
                            placeholder="thunder@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? "Đang gửi..." : "Gửi email"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ForgotPasswordDialog;
