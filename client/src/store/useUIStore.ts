import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface UIStore {
  toasts: Toast[];
  isConnected: boolean;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setConnected: (connected: boolean) => void;
}

let toastId = 0;

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  isConnected: false,
  addToast: (message, type) => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { id, message, type, timestamp: Date.now() }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setConnected: (isConnected) => set({ isConnected }),
}));
