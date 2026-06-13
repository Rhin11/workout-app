import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  setToken: (token: string, userId: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  setToken: (token, userId) => set({ token, userId }),
  clearAuth: () => set({ token: null, userId: null }),
}));
