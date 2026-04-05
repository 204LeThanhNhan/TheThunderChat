import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X, FileText, FileSpreadsheet, FileArchive, FileCode, FileVideo, FileImage } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import { useDraftAutoSave } from "@/hooks/useDraftAutoSave";
import { useQuickMessages } from "@/hooks/useQuickMessages";



const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
    const { user } = useAuthStore();
    const [value, setValue] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [showQuickMenu, setShowQuickMenu] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {sendDirectMessage, sendGroupMessage, sendDirectMessageWithFiles, sendGroupMessageWithFiles, conversations, activeConversationId} = useChatStore(); 
    
    // Draft auto-save
    const { saveDraft, loadDraft, clearDraft } = useDraftAutoSave(activeConversationId);
    
    // Quick messages
    const { quickMessages, saveQuickMessage, deleteQuickMessage } = useQuickMessages();
    
    // Lấy conversation mới nhất từ store thay vì dùng prop
    const currentConvo = conversations.find(c => c._id === activeConversationId) ?? selectedConvo;
    
    // Load draft khi mở conversation
    useEffect(() => {
        const loadSavedDraft = async () => {
            const draft = await loadDraft();
            if (draft) {
                setValue(draft);
            }
        };
        loadSavedDraft();
    }, [activeConversationId]);
    
    // Auto-save draft khi value thay đổi
    useEffect(() => {
        saveDraft(value);
    }, [value, saveDraft]);
    
    // Handle quick message menu with search
    useEffect(() => {
        if (value.startsWith('/')) {
            setShowQuickMenu(true);
            setSelectedIndex(0);
        } else {
            setShowQuickMenu(false);
            setIsCreatingNew(false);
            setSelectedIndex(0);
        }
    }, [value]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > 5) {
            toast.error("Chỉ được chọn tối đa 5 file");
            return;
        }
        
        // Tạo preview URL cho hình ảnh
        const newPreviewUrls: string[] = [];
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                newPreviewUrls.push(URL.createObjectURL(file));
            } else {
                newPreviewUrls.push('');
            }
        });
        
        setSelectedFiles([...selectedFiles, ...files]);
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    };

    const removeFile = (index: number) => {
        // Revoke URL để tránh memory leak
        if (previewUrls[index]) {
            URL.revokeObjectURL(previewUrls[index]);
        }
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };

    const getFileIcon = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (file.type.startsWith('image/')) {
            return <FileImage className="size-8 text-pink-500" />;
        }
        if (file.type.startsWith('video/')) {
            return <FileVideo className="size-8 text-indigo-500" />;
        }
        if (['pdf'].includes(ext || '')) {
            return <FileText className="size-8 text-red-500" />;
        }
        if (['doc', 'docx'].includes(ext || '')) {
            return <FileText className="size-8 text-blue-500" />;
        }
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
            return <FileSpreadsheet className="size-8 text-green-600" />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
            return <FileArchive className="size-8 text-yellow-600" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext || '')) {
            return <FileCode className="size-8 text-purple-500" />;
        }
        
        return <FileText className="size-8 text-gray-500" />;
    };

    const getFileExtension = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toUpperCase();
        return ext || 'FILE';
    };

    const sendMessage = async() => {
        if(!value.trim() && selectedFiles.length === 0){
            return;
        }
        const currValue = value;
        const currFiles = selectedFiles;
        setValue("");
        setSelectedFiles([]);
        
        // Clear draft after sending
        await clearDraft();
        
        // Cleanup preview URLs
        previewUrls.forEach(url => {
            if (url) URL.revokeObjectURL(url);
        });
        setPreviewUrls([]);
        
        try {
            if(currentConvo.type === "direct"){
                const participants = currentConvo.participants;
                // Handle cả 2 cấu trúc: _id hoặc userId
                const otherUser = participants.find((p) => {
                    const oderId = p._id ?? (p as unknown as {userId: string}).userId;
                    return oderId !== user?._id;
                });
                const otherUserId = otherUser?._id ?? (otherUser as unknown as {userId: string})?.userId;
                
                if(!otherUserId){
                    console.error("otherUserId is undefined!");
                    toast.error("Không tìm thấy người nhận!");
                    return;
                }
                
                if (currFiles.length > 0) {
                    await sendDirectMessageWithFiles(otherUserId, currValue, currFiles);
                } else {
                    await sendDirectMessage(otherUserId, currValue);
                }
            } else{
                if (currFiles.length > 0) {
                    await sendGroupMessageWithFiles(currentConvo._id, currValue, currFiles);
                } else {
                    await sendGroupMessage(currentConvo._id, currValue);
                }
            }
        } catch (error) {
            console.error(`Lỗi xảy ra khi gửi tin nhắn: ${error}`);
            toast.error(`Lỗi xảy ra khi gửi tin nhắn, hãy thử gửi lại!`);
        }
    }

    // Filter quick messages based on search
    const searchQuery = value.startsWith('/') ? value.slice(1).toLowerCase() : '';
    const filteredQuickMessages = Object.entries(quickMessages).filter(([key]) => 
        key.toLowerCase().includes(searchQuery)
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showQuickMenu && !isCreatingNew) {
            if (e.key === "Tab") {
                e.preventDefault();
                if (filteredQuickMessages.length > 0) {
                    setSelectedIndex((prev) => (prev + 1) % filteredQuickMessages.length);
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredQuickMessages.length > 0) {
                    const [key, msg] = filteredQuickMessages[selectedIndex];
                    console.log('Selected:', { key, msg, selectedIndex, total: filteredQuickMessages.length });
                    setValue(msg);
                    setShowQuickMenu(false);
                    // Focus back to input
                    setTimeout(() => inputRef.current?.focus(), 0);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                setValue("");
                setShowQuickMenu(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    const handleSelectQuickMessage = (msg: string) => {
        setValue(msg);
        setShowQuickMenu(false);
        // Focus back to input
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleCreateQuickMessage = async () => {
        if (!newKey.trim() || !newValue.trim()) {
            toast.error("Vui lòng nhập đầy đủ key và nội dung");
            return;
        }

        try {
            await saveQuickMessage(newKey, newValue);
            toast.success("Đã lưu tin nhắn nhanh");
            setIsCreatingNew(false);
            setNewKey("");
            setNewValue("");
            setValue("");
            setShowQuickMenu(false);
        } catch (error) {
            toast.error("Không thể lưu tin nhắn nhanh");
        }
    };

    if (!user) return null;
    return (
        <div className="flex flex-col gap-2 p-3 bg-background relative">
            {/* Quick message hint */}
            {!showQuickMenu && (
                <div className="flex items-center justify-left pl-10">
                    <p className="text-xs text-muted-foreground/70 italic">
                        💡 Nhấn <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted border border-border rounded">
                            /
                        </kbd> để soạn tin nhắn nhanh
                    </p>
                </div>
            )}

            {/* Preview selected files */}
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                                // Preview hình ảnh
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-border">
                                    <img 
                                        src={previewUrls[index]} 
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-0 right-0 size-6 bg-black/50 hover:bg-black/70 text-white rounded-full m-1"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                // Preview file/video với icon
                                <div className="relative flex flex-col items-center gap-1 p-2 bg-muted rounded-lg border-2 border-border w-20 h-20">
                                    <div className="relative">
                                        {getFileIcon(file)}
                                        {/* Extension badge */}
                                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded">
                                            {getFileExtension(file.name)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] truncate max-w-full text-center">{file.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 size-5 bg-destructive hover:bg-destructive/90 text-white rounded-full"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Quick message menu */}
            {showQuickMenu && (
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover/95 backdrop-blur-md border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto z-50">
                    {isCreatingNew ? (
                        <div className="p-3 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold">Tạo tin nhắn nhanh mới</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => setIsCreatingNew(false)}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            <Input
                                placeholder="Key (vd: hello)"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Input
                                placeholder="Nội dung tin nhắn"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={handleCreateQuickMessage}
                            >
                                Lưu
                            </Button>
                        </div>
                    ) : (
                        <>
                            {searchQuery && (
                                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md mb-2">
                                    🔍 Tìm kiếm: <span className="font-medium">/{searchQuery}</span>
                                </div>
                            )}
                            {filteredQuickMessages.length > 0 ? (
                                <>
                                    {filteredQuickMessages.map(([key, msg], index) => (
                                        <button
                                            key={key}
                                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between group ${
                                                index === selectedIndex ? 'bg-primary/20' : 'hover:bg-muted'
                                            }`}
                                            onClick={() => handleSelectQuickMessage(msg)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">/{key}</div>
                                                <div className="text-xs text-muted-foreground truncate">{msg}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteQuickMessage(key);
                                                    toast.success("Đã xóa");
                                                }}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </button>
                                    ))}
                                    <div className="text-xs text-muted-foreground mt-2 px-3 py-1 bg-muted/50 rounded">
                                        💡 Tab để chọn • Enter để sử dụng • Esc để đóng
                                    </div>
                                </>
                            ) : (
                                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    {searchQuery 
                                        ? `Không tìm thấy tin nhắn nhanh với "/${searchQuery}"`
                                        : "Chưa có tin nhắn nhanh nào"
                                    }
                                </div>
                            )}
                            <button
                                className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors border-t mt-1 pt-2"
                                onClick={() => setIsCreatingNew(true)}
                            >
                                <div className="text-sm font-medium text-primary flex items-center gap-2">
                                    <span className="text-lg">+</span> Tạo tin nhắn nhanh mới
                                </div>
                            </button>
                        </>
                    )}
                </div>
            )}
            
            <div className="flex items-center gap-2 min-h-[56px] relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-primary/10 transition-smooth"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="size-4" />
                </Button>
                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        onKeyDown={handleKeyDown}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Soạn tin nhắn của bạn ở đây..."
                        className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none">

                    </Input>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="size-8 hover:bg-primary/10 transition-smooth">
                            <div><EmojiPicker onChange={(emoji: string) => setValue(`${value}${emoji}`)} /></div>
                        </Button>
                    </div>

                </div>
                <Button 
                    className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105" 
                    disabled={!value.trim() && selectedFiles.length === 0}
                    onClick={sendMessage}
                    >
                    <Send className="size-4 text-white" />
                </Button>
            </div>
        </div>
    );
}

export default MessageInput;
