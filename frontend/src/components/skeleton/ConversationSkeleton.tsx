import { Card } from "../ui/card";

const ConversationSkeleton = () => {
    return (
        <>
            {Array.from({ length: 3 }).map((_, index) => (
                <Card
                    key={index}
                    className="border-none p-3 glass animate-pulse"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 bg-muted rounded" />
                            <div className="h-3 w-3/4 bg-muted rounded" />
                        </div>
                    </div>
                </Card>
            ))}
        </>
    );
};

export default ConversationSkeleton;