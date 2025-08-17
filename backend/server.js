import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import studyRoutes from './routes/studyRoutes.js';

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",       // local dev frontend
  process.env.FRONTEND_ORIGIN   // your deployed vercel link
];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/study', studyRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
