import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const ReactionPicker = ({ onSelect }: ReactionPickerProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7">
                    <Smile className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1">
                    {EMOJIS.map((emoji) => (
                        <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="size-9 text-xl hover:scale-125 transition-transform"
                            onClick={() => onSelect(emoji)}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ReactionPicker;
