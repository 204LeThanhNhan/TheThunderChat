import { create } from 'zustand';

interface DialogState {
    friendRequestOpen: boolean;
    setFriendRequestOpen: (open: boolean) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
    friendRequestOpen: false,
    setFriendRequestOpen: (open: boolean) => set({ friendRequestOpen: open }),
}));
