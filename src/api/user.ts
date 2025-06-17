import axios from './axiosConfig';

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  enabled: boolean;
}

export interface UserRegistrationRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

export const userApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await axios.get('/api/users');
    return response.data;
  },

  registerUser: async (userData: UserRegistrationRequest): Promise<User> => {
    const response = await axios.post('/api/users', userData);
    return response.data;
  },

  updateUserStatus: async (userId: number, enabled: boolean): Promise<void> => {
    await axios.patch(`/api/users/${userId}/status`, { enabled });
  },

  changeUserPassword: async (userId: number, newPassword: string): Promise<void> => {
    await axios.patch(`/api/users/${userId}/password`, { newPassword });
  },

  deleteUser: async (userId: number): Promise<void> => {
    await axios.delete(`/api/users/${userId}`);
  }
}; 