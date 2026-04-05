import { Heart } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";

type EditableField = {
    key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
    label: string;
    type?: string;
    editable?: boolean;
};

const PERSONAL_FIELDS: EditableField[] = [
    { key: "displayName", label: "Tên hiển thị", editable: true },
    { key: "username", label: "Tên người dùng", editable: false },
    { key: "email", label: "Email", type: "email", editable: false },
    { key: "phone", label: "Số điện thoại", editable: false },
];

type Props = {
    userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
    const [displayName, setDisplayName] = useState(userInfo?.displayName || "");
    const [bio, setBio] = useState(userInfo?.bio || "");
    const [loading, setLoading] = useState(false);
    const { setUser } = useAuthStore();

    if (!userInfo) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!displayName.trim()) {
            toast.error("Tên hiển thị không được để trống");
            return;
        }

        if (bio.length > 500) {
            toast.error("Giới thiệu không được vượt quá 500 ký tự");
            return;
        }

        try {
            setLoading(true);
            const response = await api.put('/users/profile', {
                displayName: displayName.trim(),
                bio: bio.trim()
            });

            setUser(response.data.user);
            toast.success("Cập nhật thông tin thành công!");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Có lỗi xảy ra";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass-strong border-border/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="size-5 text-primary" />
                    Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                    Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {PERSONAL_FIELDS.map(({ key, label, type, editable }) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="font-medium">{label}</Label>
                            <Input
                                id={key}
                                type={type ?? "text"}
                                value={key === "displayName" ? displayName : userInfo[key] ?? ""}
                                onChange={(e) => {
                                    if (key === "displayName") {
                                        setDisplayName(e.target.value);
                                    }
                                }}
                                disabled={!editable}
                                className="glass-light border-border/30 w-full"
                            />
                        </div>
                    ))}

                    <div className="space-y-2">
                        <Label htmlFor="bio" className="font-medium">
                            Giới thiệu ({bio.length}/500)
                        </Label>
                        <Textarea
                            id="bio"
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={500}
                            placeholder="Viết vài dòng về bản thân..."
                            className="glass-light border-border/30 resize-none w-full"
                        />
                    </div>

                    <Button 
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
                    >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default PersonalInfoForm;