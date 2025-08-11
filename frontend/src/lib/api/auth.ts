import apiClient from './client';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials 
} from '@/types';

export const authApi = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};
