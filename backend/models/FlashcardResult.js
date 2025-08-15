import mongoose from 'mongoose';

const FlashcardResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  timeSpent: { type: Number, required: true }, // in seconds
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model('FlashcardResult', FlashcardResultSchema);
