import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImageViewerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl: string;
    fileName?: string;
}

const ImageViewerDialog = ({ open, onOpenChange, imageUrl, fileName }: ImageViewerDialogProps) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[80vw] max-h-[80vh] p-0 overflow-hidden">
                <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/95">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="size-6" />
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-16 z-10 text-white hover:bg-white/20"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Download className="size-5" />
                        )}
                    </Button>

                    <img
                        src={imageUrl}
                        alt={fileName || "Image"}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageViewerDialog;
