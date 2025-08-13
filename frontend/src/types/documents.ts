// Shared document interfaces for the frontend

export interface DocumentAnalysis {
  _id: string;
  type: string;
  createdAt: string;
  result: {
    title?: string;
    content?: string;
    summary?: string;
    questions?: Array<{
      question: string;
      options?: string[];
      correctAnswer?: string;
    }>;
    flashcards?: Array<{
      front: string;
      back: string;
    }>;
  };
}

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  textLength: number;
  estimatedPages: number;
  extractedText?: string;
  analyses?: DocumentAnalysis[];
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  document?: Document;
}

export interface AnalysisResponse {
  success: boolean;
  message: string;
  analysis?: DocumentAnalysis;
}

export interface DocumentAnalysisRequest {
  type: 'summary' | 'quiz' | 'flashcards' | 'questions';
  customPrompt?: string;
}
