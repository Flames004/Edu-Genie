# EduGenie Backend - Project Structure

## Overview
This document outlines the complete structure of the EduGenie backend API.

## Directory Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controllers/
│   ├── authController.js     # Authentication logic (register, login, logout)
│   └── studyController.js    # Study & document management with AI analysis
├── docs/                     # Documentation files
│   ├── API_DOCUMENTATION.md  # Complete API endpoint documentation
│   ├── DEPLOYMENT.md         # Deployment and setup guide
│   └── PROJECT_STRUCTURE.md  # This file
├── middleware/
│   └── authMiddleware.js     # JWT authentication middleware
├── models/
│   ├── Document.js           # Document schema (files, analysis results)
│   └── User.js               # User schema (authentication, profile)
├── routes/
│   ├── authRoutes.js         # Authentication endpoints
│   └── studyRoutes.js        # Study and document endpoints
├── uploads/                  # Temporary file storage (auto-cleanup)
│   └── .gitkeep              # Keeps directory in version control
├── utils/
│   ├── chunkText.js          # Text chunking for AI processing
│   └── parseFile.js          # File parsing (PDF, DOC, TXT)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies and scripts
├── README.md                 # Project overview and setup
└── server.js                 # Main application entry point
```

## Key Components

### Authentication System
- JWT-based authentication with HTTP-only cookies
- Secure password hashing with bcrypt
- User registration, login, logout, and profile management

### Document Processing
- Multi-format file support (PDF, DOC, DOCX, TXT)
- Automatic text extraction and cleanup
- File size limits and validation

### AI Integration
- Google Gemini AI for document analysis
- Intelligent text chunking for large documents
- Multiple analysis types per document

### Data Models
- **User**: Authentication and profile data
- **Document**: File metadata, extracted text, and AI analyses

### API Architecture
- RESTful API design
- Comprehensive error handling
- Input validation and sanitization
- CORS configuration for frontend integration

## Development Workflow

1. **Setup**: Install dependencies with `npm install`
2. **Configuration**: Set up environment variables in `.env`
3. **Development**: Run `npm run dev` for auto-reload
4. **Production**: Run `npm start` for production mode

## Security Features

- Environment-based configuration
- Secure file upload handling
- Authentication middleware protection
- Input validation and sanitization
- CORS policy configuration

## File Management

- Temporary file storage in `uploads/`
- Automatic cleanup after processing
- .gitignore rules prevent committing user files
- File size and type validation
