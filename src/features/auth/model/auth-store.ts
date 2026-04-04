import { create } from 'zustand';
import { authApi } from '../../../entities/auth/api';
import { AppError, AppUser } from '../../../shared/types/auth';
import { clearStoredToken, getStoredToken, setStoredToken } from '../../../shared/api/token-storage';

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous';
  user: AppUser | null;
  token: string | null;
  error: AppError | null;
  login: (payload: { username: string; password: string }) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: getStoredToken() ? 'loading' : 'anonymous',
  user: null,
  token: getStoredToken(),
  error: null,
  async login(payload) {
    set({ status: 'loading', error: null });
    try {
      const session = await authApi.login(payload);
      setStoredToken(session.token);
      set({ status: 'authenticated', user: session.user, token: session.token, error: null });
    } catch (error) {
      clearStoredToken();
      set({ status: 'anonymous', user: null, token: null, error: error as AppError });
      throw error;
    }
  },
  async bootstrap() {
    if (!get().token) {
      set({ status: 'anonymous', user: null });
      return;
    }

    set({ status: 'loading' });

    try {
      const user = await authApi.me();
      set({ status: 'authenticated', user, error: null });
    } catch {
      clearStoredToken();
      set({ status: 'anonymous', user: null, token: null });
    }
  },
  logout() {
    clearStoredToken();
    set({ status: 'anonymous', user: null, token: null, error: null });
  },
  clearError() {
    set({ error: null });
  },
}));
