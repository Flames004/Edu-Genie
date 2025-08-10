# EduGenie Backend API Documentation

## Base URL
`http://localhost:5000`

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

### 2. Login User
**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Logout User
**POST** `/api/auth/logout`
(No body required)

### 4. Get User Profile
**GET** `/api/auth/profile`
(Requires authentication)

---

## Study Analysis Endpoints

### 5. Get Analysis Types
**GET** `/api/study/types`
(Public route - returns available analysis types and supported file formats)

### 6. Analyze Text
**POST** `/api/study/text` (Requires authentication)
```json
{
  "text": "Your text content here...",
  "task": "summary"
}
```
**Valid task types:** `summary`, `explanation`, `quiz`, `keywords`

### 7. Upload and Analyze File
**POST** `/api/study/upload` (Requires authentication)
- **Content-Type:** `multipart/form-data`
- **file:** [PDF/DOC/DOCX/TXT file]
- **task:** `summary` | `explanation` | `quiz` | `keywords`

---

## Document Management Endpoints

### 8. Get User Documents
**GET** `/api/study/documents?page=1&limit=10` (Requires authentication)
(Returns paginated list of user's uploaded documents)

### 9. Get Specific Document
**GET** `/api/study/documents/:documentId` (Requires authentication)
(Returns full document details including all analyses)

### 10. Re-analyze Document
**POST** `/api/study/documents/:documentId/analyze` (Requires authentication)
```json
{
  "task": "quiz"
}
```

### 11. Delete Document
**DELETE** `/api/study/documents/:documentId` (Requires authentication)
(Deletes document and associated file)

---

## Test Endpoints (No Authentication Required)

### 12. Test Text Analysis
**POST** `/api/study/test/text`
```json
{
  "text": "Your text content here...",
  "task": "summary"
}
```

### 13. Test File Upload
**POST** `/api/study/test/upload`
- **Content-Type:** `multipart/form-data`
- **file:** [PDF/DOC/DOCX/TXT file]
- **task:** `summary` | `explanation` | `quiz` | `keywords`

---

## Features Implemented

✅ **User Authentication & Authorization**
- JWT-based authentication with HTTP-only cookies
- Secure password hashing with bcrypt
- User registration, login, logout, and profile endpoints

✅ **Text Analysis**
- Direct text input with task selection
- Text length validation (max 5000 characters)
- AI-powered analysis using Gemini API

✅ **File Upload & Analysis**
- Support for PDF, DOC, DOCX, and TXT files
- File size limit (10MB)
- Automatic text extraction from documents
- File validation and error handling

✅ **AI Task Types**
- **Summary:** Concise overview of main points
- **Explanation:** Simple, easy-to-understand explanations
- **Quiz:** Multiple choice questions with answers
- **Keywords:** Important terms organized by relevance

✅ **Document Management**
- Store uploaded files and metadata in MongoDB
- Track all analyses performed on each document
- Pagination for document lists
- Re-analyze documents with different tasks
- Delete documents and cleanup files

✅ **Text Chunking & Large Document Support**
- Automatic chunking for large documents (>4000 chars)
- Intelligent chunk combination for coherent results
- Handles API limits gracefully

✅ **Storage & Limits**
- File size limit: 10MB for uploads
- Text length limit: 5000 characters for direct input
- Automatic file cleanup on errors
- Secure file storage in uploads directory

✅ **Error Handling & Validation**
- Comprehensive input validation
- Proper error messages and status codes
- File cleanup on processing failures
- API rate limiting considerations

---

## Testing the API

1. **Start with registration/login** to get authentication
2. **Test text analysis** with `/api/study/test/text` 
3. **Test file upload** with `/api/study/test/upload`
4. **Use authenticated endpoints** after login
5. **Test document management** features

## Environment Variables Required
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
```

The backend is now fully implemented according to the project plan and ready for frontend integration!
