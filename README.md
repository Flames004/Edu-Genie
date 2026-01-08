# EduGenie - AI-Powered Learning Companion

**Transform your documents into interactive learning experiences with the power of AI**

## ✨ Overview

* EduGenie is a modern, full-stack web application that revolutionizes the way students and professionals interact with educational content. Upload any document (PDF, DOCX, TXT) and let our AI-powered system generate summaries, quizzes, flashcards, and Q&A sessions to enhance your learning experience.
* EduGenie’s RAG feature allows **context-aware chatting with your documents** by chunking files, storing them as vector embeddings, and retrieving the most relevant sections to generate accurate, content-grounded AI responses.

### 🎯 Key Features

- **📄 Smart Document Analysis** - Upload and process multiple document formats
- **🤖 AI-Powered Insights** - Generate summaries, quizzes, and study materials
- **📊 Interactive Learning** - Flashcards, Q&A sessions, and progress tracking
- **🔐 Secure Authentication** - JWT-based user management with protected routes
- **🌗 Light/Dark Mode** - Seamless theme toggle across all pages and components
- **📱 Responsive Design** - Beautiful UI that works on all devices
- **⚡ Real-time Processing** - Fast document analysis with progress tracking
- 🧠 Semantic Search (RAG) - Chat with your documents using advanced vector embeddings and a dedicated Python microservice.

---

## 🏗️ Architecture

### Frontend (Next.js 15)
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── documents/      # Document management
│   │   ├── analysis/       # Analysis, quiz, flashcard, summary components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utilities & API clients
│   ├── store/              # Zustand state management
│   └── types/              # TypeScript definitions
```

### Backend (Node.js + Express)
```
backend/
├── controllers/            # Route handlers & business logic
├── models/                # MongoDB schemas
├── routes/                # API route definitions
├── middleware/            # Authentication & validation
├── utils/                 # Helper functions
└── config/                # Database configuration
```
### AI Service (Python + FastAPI) 
```
Handles vector embedding, semantic search, and LLM interaction.

ai_service/
├── main.py                 # FastAPI entry point & endpoints
├── requirements.txt        # Python dependencies
└── .env                    # AI-specific configuration
```
---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Animations**: Framer Motion
- **Theme**: next-themes (light/dark mode toggle)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT with httpOnly cookies
- **AI Integration**: Google Gemini 2.5 Flash
- **File Processing**: Multer, pdf-parse, mammoth
- **Security**: bcryptjs, CORS, helmet

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Git Hooks**: Husky (planned)
- **Deployment**: Vercel (frontend), Railway (backend)

### AI Microservice

- **Runtime**: Python 3.9+
- **Framework**: FastAPI
- **AI Orchestration**: LangChain
- **LLM**: Google Gemini 1.5 Flash / Gemini Pro
- **Vector Database**: MongoDB Atlas Vector Search

---

## 🚀 Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Python 3.9 or higher
- MongoDB Atlas account (with Vector Search enabled)
- Google Gemini API key

### 1. Clone the Repository
```bash
git clone https://github.com/Flames004/Edu-Genie.git
cd Edu-Genie
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration:
# - MONGO_URI=your_mongodb_connection_string
# - JWT_SECRET=your_jwt_secret
# - GEMINI_API_KEY=your_gemini_api_key
# - FRONTEND_ORIGIN=http://localhost:3000

# Start the backend server
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api" > .env.local

# Start the development server
npm run dev
```
### 4. AI Service Setup
```bash
cd ai_service
# Create virtual environment
python -m venv venv
# Activate it (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)

pip install -r requirements.txt

# Create .env file
# Required vars: GEMINI_API_KEY, MONGO_URI

uvicorn main:app --reload --port 8000
```
### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

---

## 📚 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register    # Create new user account
POST /api/auth/login       # Authenticate user
POST /api/auth/logout      # End user session
GET  /api/auth/profile     # Get current user info
```

### Document Management
```http
POST   /api/study/upload           # Upload document
GET    /api/study/documents        # Get user documents
GET    /api/study/documents/:id    # Get specific document
DELETE /api/study/documents/:id    # Delete document
```

### AI Analysis
```http
POST /api/study/analyze/:id     # Generate custom analysis
POST /api/study/summary/:id     # Generate summary
POST /api/study/quiz/:id        # Generate quiz
POST /api/study/flashcards/:id  # Generate flashcards
POST /api/study/questions/:id   # Generate Q&A
```
### RAG & AI Analysis (Powered by Python Service)
```http
POST /ingest         # Chunk & Embed document (Internal)
POST /chat           # Context-aware chat with document (Internal)
POST /api/study/analyze/:id     # Generate custom analysis
POST /api/study/quiz/:id        # Generate quiz
```

## 🎨 Screenshots

<div align="center">

### Landing Page
![Landing Page](/assets/welcome.png)

### Authentication
![Authentication](/assets/register.png)
![Authentication](/assets/login.png)

### Dashboard
![Dashboard](/assets/dashboard.png)

### Dark Mode
![Dark Mode](/assets/dark_mode.png)

### Chat UI
![Chat UI](/assets/ai_feature_photo_3.png).
</div>

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for type safety
- Follow the existing code style
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed
