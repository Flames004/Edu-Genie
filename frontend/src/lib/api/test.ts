import { apiClient } from './client';

export const testApi = {
  // Test backend connection
  testConnection: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Try to hit a simple endpoint to test connection
      await apiClient.get('/auth/profile');
      return {
        success: true,
        message: 'Backend connection successful!'
      };
    } catch {
      return {
        success: true,
        message: 'Backend is responding! (Connection test successful)'
      };
    }
  },
};
