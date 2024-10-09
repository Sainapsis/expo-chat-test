import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/types';

type CurrentUserStore = {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  clearCurrentUser: () => void;
};

export const useCurrentUserStore = create<CurrentUserStore>()(
  persist(
    (set) => ({
      currentUser: { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
      setCurrentUser: (user) => set({ currentUser: user }),
      clearCurrentUser: () => set({ currentUser: { id: '1', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' } }),
    }),
    {
      name: 'current-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);