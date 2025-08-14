import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  documentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document', 
    required: true 
  },
  score: {
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true }
  },
  timeSpent: { 
    type: Number, // seconds
    required: true 
  },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number, required: true },
    correctAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true }
  }],
  completedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Index for efficient queries
quizResultSchema.index({ userId: 1, completedAt: -1 });
quizResultSchema.index({ documentId: 1 });

export default mongoose.model('QuizResult', quizResultSchema);
