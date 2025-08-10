import express from 'express';
import { analyzeText, analyzeFile, uploadMiddleware } from '../controllers/studyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/text', protect, analyzeText);
router.post('/upload', protect, uploadMiddleware, analyzeFile);

export default router;
