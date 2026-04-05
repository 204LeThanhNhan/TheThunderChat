import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { FileText, Download, Loader2, FileSpreadsheet, FileImage, FileVideo, FileArchive, FileCode, Pin } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import ImageViewerDialog from "./ImageViewerDialog";
import VideoViewerDialog from "./VideoViewerDialog";
import MessageActions from "./MessageActions";
import { useChatStore } from "@/stores/useChatStore";
import MessageReactions from "./MessageReactions";
import ReactionPicker from "./ReactionPicker";



interface MessageItemProps {
    message: Message,
    index: number,
    messages: Message[],
    selectedConvo: Conversation,
    lastMessageStatus: "delivered" | "seen";
}

const MessageItem = ({ message, index, messages, selectedConvo, lastMessageStatus }: MessageItemProps) => {
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [videoViewerOpen, setVideoViewerOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; fileName: string; mimeType?: string } | null>(null);
    const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
    const { toggleReaction } = useChatStore();

    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
    //kiểm tra phân nhóm - hiển thị avatar + thời gian gửi
    //index = 0 (tin nhắn đầu tiên thì phân nhóm)
    //người gửi tin nhắn hiện tại khác với người gửi tin nhắn trước -> phân nhóm
    //2 tin nhắn cách nhau 5 phút -> phân nhóm
    const isShowTime = index === 0 || new Date(message.createdAt).getTime() - new Date(prev?.createdAt || 0).getTime() > 300000;


    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    

    const participant = selectedConvo.participants.find((p: Participant) => p._id?.toString() === message.senderId?.toString());
    
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (fileName: string, mimeType: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        
        // Document files
        if (['pdf'].includes(ext || '')) {
            return <FileText className="size-8 text-red-500" />;
        }
        if (['doc', 'docx'].includes(ext || '')) {
            return <FileText className="size-8 text-blue-500" />;
        }
        
        // Spreadsheet files
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
            return <FileSpreadsheet className="size-8 text-green-600" />;
        }
        
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
            return <FileArchive className="size-8 text-yellow-600" />;
        }
        
        // Code files
        if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext || '')) {
            return <FileCode className="size-8 text-purple-500" />;
        }
        
        // Image files
        if (mimeType.startsWith('image/')) {
            return <FileImage className="size-8 text-pink-500" />;
        }
        
        // Video files
        if (mimeType.startsWith('video/')) {
            return <FileVideo className="size-8 text-indigo-500" />;
        }
        
        // Default
        return <FileText className="size-8 text-gray-500" />;
    };

    const getFileExtension = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toUpperCase();
        return ext || 'FILE';
    };

    const handleImageClick = (url: string, fileName: string) => {
        setSelectedMedia({ url, fileName });
        setImageViewerOpen(true);
    };

    const handleVideoClick = (url: string, fileName: string, mimeType: string) => {
        setSelectedMedia({ url, fileName, mimeType });
        setVideoViewerOpen(true);
    };

    const handleFileDownload = async (url: string, fileName: string, fileId: string) => {
        try {
            setDownloadingFileId(fileId);
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloadingFileId(null);
        }
    };

    return (
        <>
            {
                isShowTime && (
                    <div className="flex justify-center w-full my-2">
                        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
                            {formatMessageTime(new Date(message.createdAt))}
                        </span>
                    </div>
                )
            }


            {/* canh phải nếu là tin nhắn của chính mình, ngược lại canh trái */}
            <div 
                data-message-id={message._id}
                className={cn("flex gap-2 mesage-bounce mt-2 scroll-mt-20 transition-colors duration-500 rounded-lg w-full overflow-hidden", message.isOwn ? "justify-end" : "justify-start")}
            >
                {/* avatar */}
                {
                    !message.isOwn && (
                        <div className="w-8">
                            {
                                isGroupBreak && (
                                    <UserAvatar type="chat" name={participant?.displayName ?? "Thunder User"} avatarUrl={participant?.avatarUrl ?? undefined} />
                                )
                            }
                        </div>
                    )}
                {/* nội dung tin nhắn */}
                <div className={cn("max-w-[40%] min-w-0 space-y-1 flex flex-col group", message.isOwn ? "items-end" : "items-start")}>
                    {/* Pinned badge */}
                    {message.pinned && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Pin className="size-3" />
                            <span>Đã ghim</span>
                        </div>
                    )}

                    {/* Recalled message */}
                    {message.recalled ? (
                        <Card className={cn("p-3 italic opacity-60", message.isOwn ? "chat-bubble-sent" : "chat-bubble-received")}>
                            <p className="text-sm">Tin nhắn đã được thu hồi</p>
                        </Card>
                    ) : (
                        <>
                            {/* Message content with actions */}
                            <div className="flex items-start gap-2 w-full">
                                {!message.isOwn && (
                                    <MessageActions 
                                        message={message}
                                        isOwn={message.isOwn || false}
                                        onRecall={() => {}}
                                        onPin={() => {}}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    {message.content && (
                                        <Card className={cn("p-3 max-w-full overflow-hidden", message.isOwn ? "chat-bubble-sent" : "chat-bubble-received")}>
                                            <p className="text-sm leading-relaxed break-all whitespace-pre-wrap">{message.content}</p>
                                        </Card>
                                    )}

                                    {/* Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2 w-full">
                            {message.attachments.map((attachment, idx) => (
                                <div key={idx} className="w-full">
                                    {attachment.type === 'image' && (
                                        <div 
                                            onClick={() => handleImageClick(attachment.url, attachment.fileName)}
                                            className="cursor-pointer"
                                        >
                                            <img 
                                                src={attachment.url} 
                                                alt={attachment.fileName}
                                                className="rounded-lg max-w-full h-auto hover:opacity-90 transition-opacity"
                                                style={{ maxHeight: '300px' }}
                                            />
                                        </div>
                                    )}
                                    {attachment.type === 'video' && (
                                        <div 
                                            onClick={() => handleVideoClick(attachment.url, attachment.fileName, attachment.mimeType)}
                                            className="cursor-pointer relative rounded-lg overflow-hidden"
                                            style={{ maxHeight: '300px' }}
                                        >
                                            <video 
                                                className="rounded-lg max-w-full"
                                                style={{ maxHeight: '300px' }}
                                            >
                                                <source src={attachment.url} type={attachment.mimeType} />
                                            </video>
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                                                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-black border-b-8 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {attachment.type === 'file' && (
                                        <div 
                                            className={cn(
                                                "p-3 flex items-center gap-3 w-full rounded-xl border cursor-pointer hover:shadow-md transition-shadow",
                                                message.isOwn ? "bg-gradient-chat text-white" : "bg-card text-card-foreground"
                                            )}
                                            onClick={() => handleFileDownload(attachment.url, attachment.fileName, attachment.publicId)}
                                        >
                                            {/* Icon container */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                                                    {getFileIcon(attachment.fileName, attachment.mimeType)}
                                                </div>
                                                {/* Extension badge */}
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1 rounded">
                                                    {getFileExtension(attachment.fileName)}
                                                </div>
                                            </div>
                                            
                                            {/* File info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate leading-tight mb-1">
                                                    {attachment.fileName}
                                                </p>
                                                <p className="text-xs opacity-70">
                                                    {formatFileSize(attachment.fileSize)}
                                                </p>
                                            </div>
                                            
                                            {/* Download button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 flex-shrink-0 hover:bg-primary/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileDownload(attachment.url, attachment.fileName, attachment.publicId);
                                                }}
                                                disabled={downloadingFileId === attachment.publicId}
                                            >
                                                {downloadingFileId === attachment.publicId ? (
                                                    <Loader2 className="size-5 animate-spin" />
                                                ) : (
                                                    <Download className="size-5" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                                </div>
                            </div>
                            
                            {/* Message Actions */}
                            {message.isOwn && !message.recalled && (
                                <MessageActions 
                                    message={message}
                                    isOwn={message.isOwn || false}
                                    onRecall={() => {}}
                                    onPin={() => {}}
                                />
                            )}
                        </>
                    )}
                    
                    {/* Reactions và Reaction Picker - dưới tin nhắn */}
                    {!message.recalled && (
                        <div className={cn(
                            "flex items-center gap-2 mt-1",
                            message.isOwn ? "flex-row-reverse" : "flex-row"
                        )}>
                            {/* Reaction Picker - hiện khi hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ReactionPicker 
                                    onSelect={(emoji) => toggleReaction(message._id, emoji)}
                                />
                            </div>
                            
                            {/* Reactions badges */}
                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                                <MessageReactions 
                                    reactions={message.reactions}
                                    onReactionClick={(emoji) => toggleReaction(message._id, emoji)}
                                />
                            )}
                        </div>
                    )}
                    
                    {/* delivered or seen */}
                    {
                        message.isOwn && message._id === selectedConvo.lastMessage?._id && !message.recalled && (
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5 h-4 border-0", lastMessageStatus === "seen" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground ")}>
                                {lastMessageStatus}
                            </Badge>
                        )
                    }
                </div>
            </div>

            {/* Image Viewer Dialog */}
            {selectedMedia && (
                <>
                    <ImageViewerDialog
                        open={imageViewerOpen}
                        onOpenChange={setImageViewerOpen}
                        imageUrl={selectedMedia.url}
                        fileName={selectedMedia.fileName}
                    />
                    <VideoViewerDialog
                        open={videoViewerOpen}
                        onOpenChange={setVideoViewerOpen}
                        videoUrl={selectedMedia.url}
                        fileName={selectedMedia.fileName}
                        mimeType={selectedMedia.mimeType}
                    />
                </>
            )}

        </>


    );
}

export default MessageItem;