import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../ui/tabs";
import {useFriendStore} from "@/stores/useFriendStore";
import SentRequests from "./SentRequests";
import ReceiveRequests from "./ReceiveRequests";

interface FriendRequestDialogProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}
const FriendRequestDialog = ({open, setOpen}: FriendRequestDialogProps) => {
    const [tab, setTab] = useState("received");
    const {getAllFriendRequests} = useFriendStore();

    useEffect(() => {
        const loadRequest = async () => {
            try {
                await getAllFriendRequests();
            } catch (error) {
                console.error(`Có lỗi xảy ra khi loadRequest: ${error}`);
            }
        }

        loadRequest();
    }, [])//dependencies = rỗng, chỉ chạy 1 lần khi mở dialog
    return(
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Lời mời kết bạn</DialogTitle>
                </DialogHeader>
                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className="w-full"
                >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="received">
                        Đã nhận
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        Đã gửi
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="received">
                    {/* Nội dung tab đã nhận */}
                    <ReceiveRequests 
                        
                    />
                </TabsContent>
                <TabsContent value="sent">
                    {/* Nội dung tab đã nhận */}
                    <SentRequests />
                </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export default FriendRequestDialog;