
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Moon, Sun, ToggleLeft } from "lucide-react"
import { Switch } from "../ui/switch"
import CreateNewChat from "../chat/CreateNewChat"
import NewGroupChatModal from "../chat/NewGroupChatModal"
import GroupChatList from "../chat/GroupChatList"
import AddFriendModal from "../chat/AddFriendModal"
import DirectMessageList from "../chat/DirectMessageList"
import { useThemeStore } from "@/stores/useThemeStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { useChatStore } from "@/stores/useChatStore"
import ConversationSkeleton from "../skeleton/ConversationSkeleton"
import NotificationBell from "../notifications/NotificationBell"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {isDark, toggleTheme} = useThemeStore();
  const {user} = useAuthStore();
  const {convoLoading} = useChatStore();
  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="bg-gradient-primary">
              <a href="#">
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Thunder Chat</h1>
                  <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Sun className="size-4 text-white/80"/>
                    <Switch
                     checked = {isDark}
                     onCheckedChange={toggleTheme}
                     className="data-[state=checked]:bg-background/80"
                    
                    />
                    <Moon className="size-4 text-white/80"/>
                  </div>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>




      {/* Content */}
      <SidebarContent  className="beautiful-scrollbar">
        {/* new chat */}
          <SidebarGroup>
            <SidebarGroupContent>
              <CreateNewChat/>
            </SidebarGroupContent>
          </SidebarGroup>

        {/* group chat */}
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="uppercase">
                Chat Nhóm
              </SidebarGroupLabel>

              <SidebarGroupAction title="Tạo Nhóm" asChild className="cursor-pointer">
                <NewGroupChatModal/>
              </SidebarGroupAction>
            </div>
            <SidebarGroupContent>
              {convoLoading ? <ConversationSkeleton/> : <GroupChatList/>}
            </SidebarGroupContent>
          </SidebarGroup>

        {/* direct chat */}
        <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="uppercase">
                Bạn bè
              </SidebarGroupLabel>

              <SidebarGroupAction title="Kết bạn mới" className="cursor-pointer">
                <AddFriendModal/>
              </SidebarGroupAction>
            </div>
            <SidebarGroupContent>
              {convoLoading ? <ConversationSkeleton/> : <DirectMessageList/>}
            </SidebarGroupContent>
          </SidebarGroup>
      </SidebarContent>
      
      {/* footer */}
      <SidebarFooter>
        { user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
