import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";


const ChatWindowBody = () => {
    const {activeConversationId, conversations, messages: allMessages, fetchMessages} = useChatStore();

    const[lastMessageStatus, setLastMessageStatus] = useState<"delivered" | "seen">("delivered");
    

    const messages = allMessages[activeConversationId!]?.items ?? [];
    const reversedMessages = [...messages].reverse();
    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    const selectedConvo = conversations.find((c) => c._id == activeConversationId);
    const key = `chat-scroll-${activeConversationId}`;

    //tạo tham chiếu đến thẻ div phía cuối trang render
    //hiệu ứng cuộn tự động cho chat body
    const messageEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lastMessage = selectedConvo?.lastMessage;
        if(!lastMessage){
            return;
        }
        const seenBy = selectedConvo?.seenBy ?? [];
        setLastMessageStatus(seenBy.length > 0 ? "seen" : "delivered");
    }, [selectedConvo]);

    //hành động cuộn
    useLayoutEffect(()=>{
        if(!messageEndRef.current){
            return;
        }

        messageEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [activeConversationId])

    const fetchMoreMessages = async () => {
        if(!activeConversationId){
            return;
        }

        try {
            await fetchMessages(activeConversationId);
        } catch (error) {
            console.error(`Lỗi xảy ra khi fetch thêm tin nhắn: ${error}`);
        }
    }

    const handleScrollSave = () => {
        const container = containerRef.current;
        if(!container || !activeConversationId){
            return;
        }

        
        sessionStorage.setItem(
            key,
            JSON.stringify({
                scrollTop: container.scrollTop,
                scrollHeight: container.scrollHeight,
            })
        );
    };

    useLayoutEffect(() => {
        const container = containerRef.current;
        if(!container){
            return;
        }

        const item = sessionStorage.getItem(key);
        if(item){
            const {scrollTop} = JSON.parse(item);
            requestAnimationFrame(() => {
                container.scrollTop = scrollTop;
            });
        }
    }, [messages.length]);

    if(!selectedConvo){
        return <ChatWelcomeScreen/>;
    }

    if(!messages.length){
        return(
            <div className="flex h-full items-center justify-center text-muted-foreground">
                Chưa có tin nhắn nào trong cuộc trò chuyện này
            </div>
        );
    }

    return (
        <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
            <div id="scollableDiv" ref={containerRef} onScroll={handleScrollSave} className="flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar">
                <div ref={messageEndRef}>{/* đây là thẻ div cuối trang để tham chiếu. Làm chức năng cuộn tự động */}</div>
                <InfiniteScroll 
                    dataLength={messages.length}
                    next={fetchMoreMessages} 
                    hasMore={hasMore}
                    scrollableTarget="scollableDiv"
                    loader={<p>Đang tải ...</p>}
                    inverse={true}
                    style={{
                        display:"flex",
                        flexDirection: "column-reverse",
                        overflow: "visible"
                    }}
                >
                    {reversedMessages.map((message, index) => (
                        <MessageItem 
                        key={message._id ?? index}
                        message={message}
                        index={index}
                        messages={reversedMessages}
                        selectedConvo={selectedConvo}
                        lastMessageStatus={lastMessageStatus} 
                        />
                    ))}
                </InfiniteScroll>
                

                
            </div>
        </div>
    );
} 

export default ChatWindowBody;