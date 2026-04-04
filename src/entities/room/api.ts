import { http } from '../../shared/api/http';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'lab' | 'office' | 'meeting';
  isAvailable?: boolean;
  description?: string;
}

export const roomsApi = {
  async getAll() {
    const { data } = await http.get<Room[]>('/rooms');
    return data;
  },
};
