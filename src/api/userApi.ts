import apiClient from './axiosConfig';
import { UserResponseDto } from '../types/User';

export interface UserRegistrationRequest {
  fullName: string;
  username: string;
  password: string;
  roles: string[];
}

export interface UserResponse {
  id: number;
  fullName: string;
  username: string;
  roles: string[];
  active: boolean;
}

export const userApi = {
  registerUser: async (request: UserRegistrationRequest): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/auth/register', request);
    return response.data;
  },

  getAllUsers: async (): Promise<UserResponseDto[]> => {
    const response = await apiClient.get('/auth/users');
    return response.data;
  },

  updateUserStatus: async (id: number, active: boolean): Promise<UserResponseDto> => {
    const response = await apiClient.put(`/auth/users/${id}/status`, { active });
    return response.data;
  },

  changeUserPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/auth/users/${id}/password`, { newPassword });
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/auth/users/${id}`);
  },
}; 