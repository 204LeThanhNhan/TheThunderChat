import {create} from 'zustand'; // store trạng thái 
import {toast} from 'sonner'; // hiển thị thông báo
import { authService } from '@/services/authService';
import type { AuthState } from '@/types/store';
import {persist} from 'zustand/middleware';
import { useChatStore } from './useChatStore';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,
            loading: false, //theo dõi trạng thái khi dùng API
        
        
            setAccessToken: (accessToken) => {
                set({accessToken});
            },

            setUser: (user) => {
                set({user});
            },
        
            clearState: () => {
                set({accessToken: null, user: null , loading : false});
                useChatStore.getState().reset();
                localStorage.clear(); //tránh trường hợp dữ liệu user trước bị dùng lại khi app lỗi, văng + người khác đăng nhập cùng 1 máy tính
                sessionStorage.clear();
            },
        
            signUp:  async (username, password, email, firstName, lastName) => {
                try {
                    set({ loading : true });
        
                    // gọi API
                    await authService.signUp(username, password, email, firstName, lastName);
        
                    toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập");
                } catch (error: any) {
                    console.error(error);
                    const message = error?.response?.data?.message || error?.message || "Đăng ký không thành công";
                    toast.error(message);
                }finally{
                    set({ loading : false });
                }
            }, 
        
            signIn: async (username, password) => {
                try {
                    get().clearState();
                    set({loading: true});

                    const{accessToken}  = await authService.signIn(username, password); 
                    get().setAccessToken(accessToken);
        
                    await get().fetchMe();
                    useChatStore.getState().fetchConversations();
                    toast.success("Đăng nhập thành công! Chào mừng trở lại Thunder Chat");
                } catch (error: any) {
                    console.error(error);
                    const message = error?.response?.data?.message || error?.message || "Đăng nhập không thành công";
                    toast.error(message);
                }finally{
                    set({loading: false});
                }
            },
        
            signOut: async () => {
                try {
                    get().clearState(); 
                    await authService.signOut();
                    toast.success("Đăng xuất thành công!");
                } catch (error) {
                    console.log(error);
                    toast.error(`Có lỗi xảy ra khi đăng xuất, vui lòng thử lại`);
                    
                }
            },
        
            fetchMe: async () => {
                try {
                    set({loading: true});
                    const user = await authService.fetchMe();
                    set({user});
                } catch (error) {
                    console.error(error);
                    set({user: null, accessToken: null});
                    toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!")
                } finally{
                    set({loading: false});
                }
            },
        
            refresh: async () => {
                set({loading: true});
                const { user, fetchMe, setAccessToken } = get();
                try {
                    const accessToken = await authService.refresh();
        
                    setAccessToken(accessToken);
                    if(!user){
                        await fetchMe();
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
                    get().clearState();
                } finally{
                    set({loading: false});
                }
            }
        }),{
            name: "auth-storage",
            partialize: (state) => ({user: state.user})
        }
    )
);