import { http } from '../../shared/api/http';
import { AppUser, SessionPayload } from '../../shared/types/auth';

export const authApi = {
  async login(payload: { username: string; password: string }) {
    const { data } = await http.post<SessionPayload>('/auth/login', payload);
    return data;
  },
  async me() {
    const { data } = await http.get<AppUser>('/auth/me');
    return data;
  },
};
