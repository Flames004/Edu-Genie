import apiClient from './client';
import { 
  Document, 
  DocumentUploadResponse, 
  AnalysisResponse,
  DocumentAnalysisRequest 
} from '@/types';

export const documentsApi = {
  // Upload a document
  upload: async (file: File): Promise<DocumentUploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);
    
    const response = await apiClient.post('/study/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all user documents
  getDocuments: async (): Promise<{ success: boolean; documents: Document[] }> => {
    const response = await apiClient.get('/study/documents');
    return response.data;
  },

  // Get specific document
  getDocument: async (id: string): Promise<{ success: boolean; document: Document }> => {
    const response = await apiClient.get(`/study/documents/${id}`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/study/documents/${id}`);
    return response.data;
  },

  // Generate analysis
  analyze: async (id: string, request: DocumentAnalysisRequest): Promise<AnalysisResponse> => {
    const response = await apiClient.post(`/study/analyze/${id}`, request);
    return response.data;
  },

  // Generate quiz
  generateQuiz: async (id: string, customPrompt?: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post(`/study/quiz/${id}`, { customPrompt });
    return response.data;
  },

  // Generate flashcards
  generateFlashcards: async (id: string, customPrompt?: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post(`/study/flashcards/${id}`, { customPrompt });
    return response.data;
  },

  // Generate summary
  generateSummary: async (id: string, customPrompt?: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post(`/study/summary/${id}`, { customPrompt });
    return response.data;
  },

  // Generate questions
  generateQuestions: async (id: string, customPrompt?: string): Promise<AnalysisResponse> => {
    const response = await apiClient.post(`/study/questions/${id}`, { customPrompt });
    return response.data;
  },

  // Get recent documents
  getRecent: async (): Promise<{ success: boolean; documents: Document[] }> => {
    const response = await apiClient.get('/study/recent');
    return response.data;
  },
};
