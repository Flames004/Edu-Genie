// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// Document types
export interface Document {
  _id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  textContent: string;
  textLength: number;
  estimatedPages: number;
  userId: string;
  analyses: Analysis[];
}

export interface Analysis {
  _id: string;
  type: 'summary' | 'quiz' | 'flashcards' | 'questions' | 'analysis';
  content: string;
  createdAt: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  document?: Document;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  analysis?: Analysis;
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// Form types
export interface DocumentAnalysisRequest {
  type: Analysis['type'];
  customPrompt?: string;
}

// Dashboard types
export interface DashboardStats {
  totalDocuments: number;
  totalAnalyses: number;
  recentDocuments: Document[];
}
