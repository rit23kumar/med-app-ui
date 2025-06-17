import axios from 'axios';
import apiClient from './axiosConfig';

const API_URL = 'http://localhost:8080/api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  id: number;
  code?: string;
  message?: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('Attempting login for user:', username);
      const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
        username,
        password,
      });
      console.log('Login response:', response.data);
      
      if (response.data.code === 'USER_DISABLED') {
        throw new Error(response.data.message || 'This account has been disabled. Please contact your administrator.');
      }
      
      if (!response.data.token) {
        console.error('Login response missing token:', response.data);
        throw new Error('Invalid response from server: Missing token');
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Login error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        if (error.response?.data?.code === 'USER_DISABLED') {
          throw new Error(error.response.data.message || 'This account has been disabled. Please contact your administrator.');
        }
        
        if (error.response?.status === 401) {
          throw new Error('Invalid username or password');
        } else if (!error.response) {
          throw new Error('Unable to connect to the server. Please check if the backend is running.');
        }
      }
      throw error;
    }
  },

  getCurrentUser: async (): Promise<LoginResponse> => {
    try {
      const response = await apiClient.get<LoginResponse>('/auth/current-user');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('Session expired');
      }
      throw error;
    }
  }
}; 