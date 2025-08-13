import { apiClient } from './client';

export interface AnalysisType {
  type: string;
  name: string;
  description: string;
}

export interface AnalysisRequest {
  type: string;
  text?: string;
  documentId?: string;
}

export interface AnalysisResult {
  type: string;
  result: string;
  wordCount: number;
  textLength: number;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface FlashCard {
  front: string;
  back: string;
  category?: string;
}

// Get available analysis types
export const getAnalysisTypes = async (): Promise<AnalysisType[]> => {
  const response = await apiClient.get('/study/types');
  return response.data.analysisTypes || [];
};

// Analyze text content
export const analyzeText = async (data: AnalysisRequest): Promise<AnalysisResult> => {
  const requestBody = {
    text: data.text,
    task: data.type // Backend expects 'task' not 'type'
  };
  const response = await apiClient.post('/study/text', requestBody);
  
  // Map backend response to frontend format
  return {
    type: data.type,
    result: response.data.analysis.result, // Extract the result field from analysis object
    wordCount: response.data.textInfo?.wordCount || 0,
    textLength: response.data.textInfo?.length || 0,
    timestamp: new Date().toISOString()
  };
};

// Analyze file
export const analyzeFile = async (file: File, type: string): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task', type); // Backend expects 'task' not 'type'
  
  const response = await apiClient.post('/study/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  // Map backend response to frontend format
  return {
    type: type,
    result: response.data.analysis.result, // Extract the result field from analysis object
    wordCount: Math.floor(response.data.fileInfo?.textLength / 5) || 0, // Estimate word count
    textLength: response.data.fileInfo?.textLength || 0,
    timestamp: new Date().toISOString()
  };
};

// Re-analyze existing document
export const reAnalyzeDocument = async (documentId: string, type: string): Promise<AnalysisResult> => {
  const response = await apiClient.post(`/study/documents/${documentId}/analyze`, { 
    task: type // Backend expects 'task' not 'type'
  });
  
  // Map backend response to frontend format
  return {
    type: type,
    result: response.data.analysis.result, // Extract the result field from analysis object
    wordCount: Math.floor(response.data.analysis.textLength / 5) || 0, // Estimate word count
    textLength: response.data.analysis.textLength || 0,
    timestamp: response.data.analysis.timestamp || new Date().toISOString()
  };
};

// Parse quiz questions from analysis result
export const parseQuizQuestions = (quizText: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  
  // Split by question numbers or patterns
  const questionBlocks = quizText.split(/\n\s*(?:\d+\.|\d+\)|\*\*\d+\.|\*\*Question \d+)/i);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    if (!block) continue;
    
    try {
      // Extract question text (before options)
      const questionMatch = block.match(/^([^a-d\)A-D\)].*?)(?=\n\s*[a-dA-D][\)\.]|\n\s*\w+[\)\.])/i);
      if (!questionMatch) continue;
      
      const questionText = questionMatch[1].trim();
      
      // Extract options
      const optionMatches = [...block.matchAll(/\n\s*[a-dA-D][\)\.]?\s*([^\n]+)/g)];
      const options = optionMatches.map(match => match[1].trim());
      
      if (options.length < 2) continue;
      
      // Try to find correct answer
      let correctAnswer = 0;
      const correctAnswerMatch = block.match(/(?:correct|answer|answer:)\s*[:\-]?\s*([a-dA-D])/i);
      if (correctAnswerMatch) {
        const answerLetter = correctAnswerMatch[1].toLowerCase();
        correctAnswer = answerLetter.charCodeAt(0) - 'a'.charCodeAt(0);
      }
      
      // Extract explanation if present
      const explanationMatch = block.match(/(?:explanation|rationale|reason)[:\-]?\s*([^\n]*(?:\n(?![a-dA-D][\)\.])[^\n]*)*)/i);
      const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;
      
      questions.push({
        question: questionText,
        options,
        correctAnswer: Math.max(0, Math.min(correctAnswer, options.length - 1)),
        explanation
      });
    } catch (error) {
      console.warn('Error parsing quiz question:', error);
    }
  }
  
  return questions;
};

// Parse flashcards from analysis result
export const parseFlashcards = (flashcardText: string): FlashCard[] => {
  const flashcards: FlashCard[] = [];
  
  // Split by card numbers or patterns
  const cardBlocks = flashcardText.split(/\n\s*(?:\d+\.|\*\*Card \d+|\*\*\d+\.)/i);
  
  for (let i = 1; i < cardBlocks.length; i++) {
    const block = cardBlocks[i].trim();
    if (!block) continue;
    
    try {
      // Look for front/back patterns
      const frontBackMatch = block.match(/(?:front|question|term)[:\-]?\s*([^\n]*(?:\n(?!(?:back|answer|definition))[^\n]*)*)\s*(?:back|answer|definition)[:\-]?\s*([^\n]*(?:\n.*)*)/i);
      
      if (frontBackMatch) {
        flashcards.push({
          front: frontBackMatch[1].trim(),
          back: frontBackMatch[2].trim()
        });
      } else {
        // Try to split by newlines and take first line as front, rest as back
        const lines = block.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
          flashcards.push({
            front: lines[0].trim(),
            back: lines.slice(1).join(' ').trim()
          });
        }
      }
    } catch (error) {
      console.warn('Error parsing flashcard:', error);
    }
  }
  
  return flashcards;
};
