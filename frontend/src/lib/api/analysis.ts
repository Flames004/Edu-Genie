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

Question 3: What is the largest planet in our solar system?
a) Earth
b) Mars
c) Jupiter
d) Saturn
**Correct Answer: c**
Explanation: Jupiter is the largest planet in our solar system by both mass and volume.
`;
  
  console.log('Testing enhanced quiz parsing with sample data...');
  const questions = parseQuizQuestions(sampleQuiz);
  console.log('Parsed questions:', questions);
  
  // Validation check
  questions.forEach((q, i) => {
    console.log(`Question ${i + 1} validation:`, {
      hasQuestion: q.question.length > 0,
      hasOptions: q.options.length === 4,
      validCorrectAnswer: q.correctAnswer >= 0 && q.correctAnswer < q.options.length,
      correctOption: q.options[q.correctAnswer]
    });
  });
  
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
  
  // First, normalize the text and split into potential question blocks
  const normalizedText = quizText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  // Split by "Question X:" pattern - this is the most reliable delimiter
  const questionBlocks = normalizedText.split(/(?:^|\n)\s*Question\s+(\d+)\s*:/i);
  
  console.log('Question blocks found:', Math.floor(questionBlocks.length / 2));
  
  // Process question blocks (skip first empty element)
  for (let i = 1; i < questionBlocks.length; i += 2) {
    const questionNumber = questionBlocks[i];
    const questionContent = questionBlocks[i + 1];
    
    if (!questionContent) continue;
    
    console.log(`\n--- Processing Question ${questionNumber} ---`);
    console.log('Raw content:', questionContent);
    
    try {
      const result = parseIndividualQuestion(questionContent.trim(), parseInt(questionNumber));
      if (result) {
        questions.push(result);
        console.log(`✅ Successfully parsed Question ${questionNumber}`);
      } else {
        console.log(`❌ Failed to parse Question ${questionNumber}`);
      }
    } catch (error) {
      console.error(`Error parsing Question ${questionNumber}:`, error);
    }
  }
  
  // If no "Question X:" pattern found, try fallback method
  if (questions.length === 0) {
    console.log('No "Question X:" pattern found, trying fallback parsing...');
    return parseQuizQuestionsLegacy(quizText);
  }
  
  console.log(`=== PARSING COMPLETE: ${questions.length} questions parsed ===`);
  return questions;
};

// Parse individual question content
function parseIndividualQuestion(content: string, questionNumber: number): QuizQuestion | null {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 6) { // Minimum: question + 4 options + answer
    console.log(`Question ${questionNumber}: Not enough lines (${lines.length})`);
    return null;
  }
  
  // Find where options start (first line starting with a), b), etc.)
  let optionsStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^[a-dA-D][\)\.]/.test(lines[i])) {
      optionsStartIndex = i;
      break;
    }
  }
  
  if (optionsStartIndex === -1) {
    console.log(`Question ${questionNumber}: No options found`);
    return null;
  }
  
  // Extract question text (everything before options)
  const questionText = lines
    .slice(0, optionsStartIndex)
    .join(' ')
    .trim();
  
  if (!questionText) {
    console.log(`Question ${questionNumber}: Empty question text`);
    return null;
  }
  
  // Extract exactly 4 options (a, b, c, d)
  const options: string[] = [];
  const expectedOptions = ['a', 'b', 'c', 'd'];
  
  for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
    const line = lines[i];
    const optionMatch = line.match(/^([a-dA-D])[\)\.]?\s*(.+)$/);
    
    if (optionMatch) {
      const optionLetter = optionMatch[1].toLowerCase();
      const optionText = optionMatch[2].trim();
      
      // Ensure options are in order (a, b, c, d)
      if (optionLetter === expectedOptions[options.length] && optionText.length > 0) {
        options.push(optionText);
        console.log(`Option ${optionLetter}: ${optionText}`);
      } else if (expectedOptions.includes(optionLetter)) {
        console.log(`Warning: Option ${optionLetter} out of order or duplicate`);
        break; // Stop parsing if options are out of order
      }
    } else if (options.length > 0) {
      // If we've started collecting options and hit a non-option line, stop
      break;
    }
  }
  
  if (options.length !== 4) {
    console.log(`Question ${questionNumber}: Expected 4 options, found ${options.length}`);
    return null;
  }
  
  // Find correct answer in the remaining content after options
  const remainingContent = lines.slice(optionsStartIndex + 4).join(' ').toLowerCase();
  let correctAnswer = 0;
  
  // Look for correct answer patterns
  const answerPatterns = [
    /\*\*\s*(?:correct\s*answer|answer)\s*[:\-]?\s*([a-d])\s*\*\*/,
    /(?:correct\s*answer|answer)\s*[:\-]?\s*([a-d])/,
    /(?:the\s+)?(?:correct\s+)?answer\s+is\s+([a-d])/,
    /answer\s*:\s*([a-d])/
  ];
  
  for (const pattern of answerPatterns) {
    const match = remainingContent.match(pattern);
    if (match) {
      const answerLetter = match[1];
      correctAnswer = answerLetter.charCodeAt(0) - 'a'.charCodeAt(0);
      console.log(`Found correct answer: ${answerLetter} (index ${correctAnswer})`);
      break;
    }
  }
  
  // Validate correct answer
  if (correctAnswer < 0 || correctAnswer >= options.length) {
    console.log(`Question ${questionNumber}: Invalid correct answer ${correctAnswer}, defaulting to 0`);
    correctAnswer = 0;
  }
  
  // Extract explanation
  const explanationMatch = remainingContent.match(/(?:explanation|rationale)[:\-]?\s*(.+?)(?:\n|$)/i);
  const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;
  
  return {
    question: questionText,
    options,
    correctAnswer,
    explanation
  };
}

// Legacy parsing method as fallback
function parseQuizQuestionsLegacy(quizText: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Try splitting by numbered patterns
  let questionBlocks = quizText.split(/(?:\n|^)\s*(\d+)[\.\)]/);
  
  if (questionBlocks.length <= 1) {
    // Try splitting by double newlines
    questionBlocks = quizText.split(/\n\s*\n/);
  }
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = questionBlocks[i].trim();
    if (!block || block.length < 20) continue; // Skip very short blocks
    
    try {
      const result = parseIndividualQuestion(block, i);
      if (result) {
        questions.push(result);
      }
    } catch (error) {
      console.warn('Error in legacy parsing:', error);
    }
  }
  
  return questions;
}

// Parse flashcards from analysis result
export const parseFlashcards = (flashcardText: string): FlashCard[] => {
  const flashcards: FlashCard[] = [];
  
  try {
    // First, try parsing the new structured format from backend
    // Format: Card X:\nFront: question\nBack: answer
    const structuredCardRegex = /Card\s+\d+:\s*\n\s*Front:\s*([^\n]+)\s*\n\s*Back:\s*((?:[^\n]+(?:\n(?!Card\s+\d+:)[^\n]*)*)?)/gi;
    
    let match;
    while ((match = structuredCardRegex.exec(flashcardText)) !== null) {
      const front = match[1]?.trim();
      const back = match[2]?.trim();
      
      if (front && back) {
        flashcards.push({
          front: front,
          back: back
        });
      }
    }
    
    // If structured parsing succeeded, return the results
    if (flashcards.length > 0) {
      console.log(`Successfully parsed ${flashcards.length} flashcards using structured format`);
      return flashcards;
    }
    
    // Fallback to legacy parsing for backward compatibility
    console.log('Structured parsing found no cards, trying legacy parsing...');
    
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
        console.warn('Error parsing flashcard block:', error);
      }
    }
    
  } catch (error) {
    console.error('Error in flashcard parsing:', error);
  }
  
  console.log(`Final flashcard count: ${flashcards.length}`);
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
