import { create } from 'zustand';
import { authApi } from '../../../entities/auth/api';
import { AppUser, Role } from '../../../shared/types/auth';

interface AuthState {
  user: AppUser | null;
  role: Role | null;
  bootstrapped: boolean;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (payload: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

function persistSession(payload: any) {
  const token = payload?.token || payload?.accessToken;
  const refreshToken = payload?.refreshToken;

  if (token) {
    localStorage.setItem('token', token);
  }

  if (refreshToken) {
    sessionStorage.setItem('refreshToken', refreshToken);
  }
}

function clearSession() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  bootstrapped: false,
  isLoading: false,
  error: null,

  bootstrap: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, role: null, bootstrapped: true });
      return;
    }

    try {
      const user = await authApi.me();
      set({ user, role: user.role, bootstrapped: true, error: null });
    } catch {
      clearSession();
      set({ user: null, role: null, bootstrapped: true });
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const session = await authApi.login(payload);
      persistSession(session);
      set({
        user: session.user,
        role: session.user.role,
        isLoading: false,
        bootstrapped: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Local logout still wins if the backend session is already invalid.
      }
    }
    clearSession();
    set({ user: null, role: null, bootstrapped: true });
  },
}));
