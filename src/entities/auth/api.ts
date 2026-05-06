import { http } from '../../shared/api/http';
import { AppUser, SessionPayload } from '../../shared/types/auth';

export const authApi = {
  async login(payload: { username: string; password: string }) {
    const { data } = await http.post<SessionPayload>('/auth/login', payload);
    return data;
  },
  async register(payload: { username: string; password: string; role?: 'student' | 'guest'; roleKey?: string; phoneNumber?: string }) {
    const { data } = await http.post<SessionPayload>('/auth/register', payload);
    return data;
  },
  async refresh(refreshToken: string) {
    const { data } = await http.post<SessionPayload>('/auth/refresh', { refreshToken });
    return data;
  },
  async logout(refreshToken: string) {
    const { data } = await http.post<{ message: string }>('/auth/logout', { refreshToken });
    return data;
  },
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await http.post<{ message: string }>('/auth/change-password', payload);
    return data;
  },
  async me() {
    const { data } = await http.get<AppUser>('/auth/me');
    return data;
  },
  async mePost() {
    const { data } = await http.post<AppUser>('/auth/me');
    return data;
  },
};
