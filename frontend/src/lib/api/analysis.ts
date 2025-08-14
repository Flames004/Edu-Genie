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

// Test function to verify quiz parsing (for debugging)
export const testQuizParsing = () => {
  const sampleQuiz = `
Question 1: What is the capital of France?
a) London
b) Berlin
c) Paris
d) Madrid
**Correct Answer: c**
Explanation: Paris is the capital and largest city of France.

Question 2: Which programming language is known for web development?
a) Python
b) JavaScript
c) C++
d) Java
**Correct Answer: b**
Explanation: JavaScript is primarily used for web development and runs in browsers.
`;
  
  console.log('Testing quiz parsing with sample data...');
  const questions = parseQuizQuestions(sampleQuiz);
  console.log('Parsed questions:', questions);
  return questions;
};

// Debug function to inspect quiz parsing
export const debugQuizParsing = (quizText: string) => {
  console.log('=== QUIZ TEXT DEBUG ===');
  console.log('Raw quiz text:', quizText);
  console.log('======================');
  
  const questionBlocks = quizText.split(/(?:\n|^)\s*(?:Question\s+\d+:|\d+\.|\d+\))/i);
  console.log('Question blocks found:', questionBlocks.length - 1);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    console.log(`\n--- Block ${i} ---`);
    console.log('Raw block:', block);
    
    // Test question extraction
    const questionMatch = block.match(/^([^a-d\)A-D\)]+?)(?=\n\s*[a-dA-D][\)\.])/i);
    console.log('Question match:', questionMatch ? questionMatch[1].trim() : 'NOT FOUND');
    
    // Test option extraction
    const optionPattern = /(?:^|\n)\s*([a-dA-D])[\)\.]?\s*([^\n]+)/g;
    const optionMatches = [...block.matchAll(optionPattern)];
    console.log('Options found:', optionMatches.map(match => `${match[1]}: ${match[2].trim()}`));
    
    // Test correct answer extraction
    const correctAnswerMatch = block.match(/(?:correct\s*answer|answer)\s*[:\-]?\s*([a-dA-D])/i);
    console.log('Correct answer match:', correctAnswerMatch ? correctAnswerMatch[1] : 'NOT FOUND');
  }
  
  console.log('======================');
};

// Parse quiz questions from analysis result
export const parseQuizQuestions = (quizText: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  
  console.log('=== PARSING QUIZ TEXT ===');
  console.log('Raw text:', quizText);
  
  // Try multiple splitting patterns
  let questionBlocks: string[] = [];
  
  // Pattern 1: "Question 1:" or "1."
  questionBlocks = quizText.split(/(?:\n|^)\s*(?:Question\s+\d+\s*:|\d+\s*\.)/i);
  
  // If no matches, try simpler pattern
  if (questionBlocks.length <= 1) {
    questionBlocks = quizText.split(/(?:\n|^)\s*\d+[\.\)]/);
  }
  
  // If still no matches, try even simpler
  if (questionBlocks.length <= 1) {
    questionBlocks = quizText.split(/\n\s*\n/); // Split by double newlines
  }
  
  console.log('Question blocks found:', questionBlocks.length - 1);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    if (!block) continue;
    
    console.log(`\n--- Processing Block ${i} ---`);
    console.log('Block content:', block);
    
    try {
      // More flexible question extraction
      let questionText = '';
      const options: string[] = [];
      let correctAnswer = 0;
      let explanation = '';
      
      // Split block into lines for easier processing
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      console.log('All lines in block:', lines);
      
      // Find question text (usually the first non-empty line)
      let questionEnd = -1;
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        // If line starts with a), b), c) etc, then previous lines are the question
        if (/^[a-dA-D][\)\.]/.test(line)) {
          questionEnd = j;
          break;
        }
      }
      
      if (questionEnd > 0) {
        questionText = lines.slice(0, questionEnd).join(' ').trim();
      } else if (questionEnd === 0) {
        // Edge case: question might be very short or missing
        questionText = 'Question text not found';
      } else {
        // No options found, take first line as question
        questionText = lines[0] || 'Unknown question';
      }
      
      console.log('Extracted question:', questionText);
      
      // Extract options - be more specific to avoid picking up answer lines
      for (const line of lines) {
        // Skip lines that contain answer information or explanations
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('correct') || 
            lowerLine.includes('answer') || 
            lowerLine.includes('explanation') ||
            lowerLine.includes('rationale') ||
            lowerLine.startsWith('**') ||
            lowerLine.startsWith('question')) {
          console.log('Skipping line (contains answer/explanation):', line);
          continue;
        }
        
        // Match option pattern: starts with a), b), c), or d)
        const optionMatch = line.match(/^([a-dA-D])[\)\.]?\s*(.+)$/);
        if (optionMatch) {
          const optionLetter = optionMatch[1].toLowerCase();
          const optionText = optionMatch[2].trim();
          
          // Only accept options a, b, c, d (not e, f, etc.)
          if (optionLetter >= 'a' && optionLetter <= 'd' && optionText.length > 0) {
            options.push(optionText);
            console.log(`Valid option ${optionMatch[1]}: ${optionText}`);
          } else {
            console.log('Rejected option (invalid letter or empty):', line);
          }
        }
      }
      
      if (options.length < 2) {
        console.warn('Not enough options found, skipping question');
        continue;
      }
      
      // Find correct answer with multiple patterns
      const fullBlock = block.toLowerCase();
      let correctAnswerLetter = '';
      
      // Pattern 1: "**correct answer: a**" or "correct answer: a"
      let match = fullBlock.match(/\*\*\s*(?:correct\s*answer|answer)\s*[:\-]?\s*([a-d])\s*\*\*|(?:correct\s*answer|answer)\s*[:\-]?\s*([a-d])/);
      if (match) {
        correctAnswerLetter = match[1] || match[2];
      }
      
      // Pattern 2: "the correct answer is a"
      if (!correctAnswerLetter) {
        match = fullBlock.match(/(?:the\s+)?(?:correct\s+)?answer\s+is\s+([a-d])/);
        if (match) {
          correctAnswerLetter = match[1];
        }
      }
      
      // Pattern 3: Look for any standalone letter after "correct" or "answer"
      if (!correctAnswerLetter) {
        match = fullBlock.match(/(?:correct|answer)[\s\S]*?([a-d])(?:\s|$|\)|\.)/);
        if (match) {
          correctAnswerLetter = match[1];
        }
      }
      
      if (correctAnswerLetter) {
        correctAnswer = correctAnswerLetter.charCodeAt(0) - 'a'.charCodeAt(0);
        console.log(`Found correct answer: ${correctAnswerLetter} (index ${correctAnswer})`);
      } else {
        console.warn('No correct answer found, defaulting to 0');
        correctAnswer = 0;
      }
      
      // Validate correct answer index
      if (correctAnswer < 0 || correctAnswer >= options.length) {
        console.warn(`Invalid correct answer index ${correctAnswer}, defaulting to 0`);
        correctAnswer = 0;
      }
      
      // Extract explanation
      const explanationMatch = block.match(/(?:explanation|rationale|reason)[:\-]?\s*([^\n]*(?:\n(?![a-dA-D][\)\.]|Question|Correct Answer)[^\n]*)*)/i);
      explanation = explanationMatch ? explanationMatch[1].trim() : '';
      
      console.log('Final parsed question:', {
        question: questionText,
        optionsCount: options.length,
        correctAnswer,
        correctOption: options[correctAnswer],
        hasExplanation: !!explanation
      });
      
      questions.push({
        question: questionText,
        options,
        correctAnswer,
        explanation: explanation || undefined
      });
      
    } catch (error) {
      console.error('Error parsing quiz question:', error);
    }
  }
  
  console.log(`=== PARSING COMPLETE: ${questions.length} questions parsed ===`);
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

// Quiz result types
export interface QuizScore {
  correct: number;
  total: number;
  percentage: number;
}

export interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

export interface QuizResultData {
  documentId: string;
  score: QuizScore;
  timeSpent: number; // in seconds
  answers: QuizAnswer[];
}

export interface QuizResultStats {
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  bestScore: number;
}

export interface QuizResult {
  _id: string;
  documentId: {
    _id: string;
    originalName: string;
    fileName: string;
  };
  score: QuizScore;
  timeSpent: number;
  completedAt: string;
}

// Save quiz result
export const saveQuizResult = async (quizData: QuizResultData): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/study/quiz-results', quizData);
  return response.data;
};

// Get quiz results and stats
export const getQuizResults = async (): Promise<{ quizResults: QuizResult[]; stats: QuizResultStats }> => {
  const response = await apiClient.get('/study/quiz-results');
  return response.data;
};
