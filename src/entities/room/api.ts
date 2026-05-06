import { http } from '../../shared/api/http';
import { ListQueryParams, PaginatedList } from '../../shared/types/api';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'lab' | 'office' | 'meeting';
  isAvailable?: boolean;
  description?: string;
}

export interface RoomFormValues {
  name: string;
  capacity: number;
  type: 'classroom' | 'lab' | 'office' | 'meeting';
  isAvailable: boolean;
  description?: string;
}

export interface RoomsListParams extends ListQueryParams {
  type?: Room['type'];
  isAvailable?: boolean;
}

export const roomsApi = {
  async getAll(params?: RoomsListParams) {
    const { data } = await http.get<Room[]>('/rooms', { params });
    return data;
  },
  async getAllPage(params?: RoomsListParams): Promise<PaginatedList<Room>> {
    const response = await http.get<Room[]>('/rooms', { params });
    return { items: response.data, pagination: response.apiMeta?.pagination };
  },
  async getOne(id: string) {
    const { data } = await http.get<Room>(`/rooms/${id}`);
    return data;
  },
  async create(payload: RoomFormValues) {
    const { data } = await http.post<Room>('/rooms', payload);
    return data;
  },
  async update(id: string, payload: Partial<RoomFormValues>) {
    const { data } = await http.patch<Room>(`/rooms/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await http.delete(`/rooms/${id}`);
  },
};
