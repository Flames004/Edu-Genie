import express from 'express';
import { 
  analyzeText, 
  analyzeFile, 
  uploadMiddleware, 
  getAnalysisTypes,
  getUserDocuments,
  getDocument,
  reAnalyzeDocument,
  deleteDocument,
  saveQuizResult,
  getQuizResults,
  saveFlashcardResult,
  getFlashcardStats
} from '../controllers/studyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/types', getAnalysisTypes);

// Protected routes (require authentication)
router.post('/text', protect, analyzeText);
router.post('/upload', protect, uploadMiddleware.single('file'), analyzeFile);

// Document management routes
router.get('/documents', protect, getUserDocuments);
router.get('/documents/:id', protect, getDocument);
router.post('/documents/:id/analyze', protect, reAnalyzeDocument);
router.delete('/documents/:id', protect, deleteDocument);

// Quiz result routes
router.post('/quiz-results', protect, saveQuizResult);
router.get('/quiz-results', protect, getQuizResults);

// Flashcard study time routes
router.post('/flashcard-results', protect, saveFlashcardResult);
router.get('/flashcard-results', protect, getFlashcardStats);

// Test routes (temporary - remove in production)
router.post('/test/text', analyzeText);
router.post('/test/upload', uploadMiddleware.single('file'), analyzeFile);

export default router;
