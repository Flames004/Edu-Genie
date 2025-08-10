# EduGenie Backend API Documentation

## Base URL
`http://localhost:5000` (Development)  
`https://your-domain.com` (Production)

## Overview
EduGenie Backend provides AI-powered document analysis and study management capabilities. The API supports user authentication, file processing, and intelligent content analysis using Google's Gemini AI.

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "User registered successfully"
}
```

### 2. Login User
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "Login successful"
}
```

### 3. Logout User
**POST** `/api/auth/logout`

**Headers:** `Cookie: token=jwt_token`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 4. Get User Profile
**GET** `/api/auth/profile`

**Headers:** `Cookie: token=jwt_token`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### 5. Test Authentication
**GET** `/api/auth/test`

**Response:**
```json
{
  "success": true,
  "message": "Auth routes working!"
}
```

---

## Study Analysis Endpoints

### 6. Get Analysis Types
**GET** `/api/study/types`

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisTypes": [
      {
        "type": "summary",
        "description": "Generate concise summaries of content"
      },
      {
        "type": "explanation",
        "description": "Provide detailed explanations in simple terms"
      },
      {
        "type": "quiz",
        "description": "Create multiple choice questions with answers"
      },
      {
        "type": "keywords",
        "description": "Extract and organize important keywords"
      }
    ],
    "supportedFormats": ["PDF", "DOC", "DOCX", "TXT"],
    "limits": {
      "textLength": 5000,
      "fileSize": "10MB"
    }
  }
}
```

### 7. Analyze Text
**POST** `/api/study/text`

**Headers:** `Cookie: token=jwt_token`

**Request Body:**
```json
{
  "text": "Your text content here...",
  "task": "summary"
}
```

**Valid task types:** `summary`, `explanation`, `quiz`, `keywords`

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "AI-generated analysis result...",
    "task": "summary",
    "textLength": 150
  }
}
```

### 8. Upload and Analyze File
**POST** `/api/study/upload`

**Headers:** 
- `Cookie: token=jwt_token`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: [PDF/DOC/DOCX/TXT file]
- `task`: `summary` | `explanation` | `quiz` | `keywords`

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "document_id",
      "filename": "document.pdf",
      "extractedText": "Extracted text content...",
      "analyses": [
        {
          "task": "summary",
          "result": "AI-generated summary...",
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    }
  },
  "message": "File uploaded and analyzed successfully"
}
```

---

## Document Management Endpoints

### 9. Get User Documents
**GET** `/api/study/documents?page=1&limit=10`

**Headers:** `Cookie: token=jwt_token`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "_id": "document_id",
        "filename": "document.pdf",
        "fileSize": 1024000,
        "uploadDate": "2025-01-01T00:00:00.000Z",
        "analysesCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalDocuments": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 10. Get Specific Document
**GET** `/api/study/documents/:documentId`

**Headers:** `Cookie: token=jwt_token`

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "document_id",
      "filename": "document.pdf",
      "fileSize": 1024000,
      "extractedText": "Full extracted text...",
      "analyses": [
        {
          "task": "summary",
          "result": "Summary result...",
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ],
      "uploadDate": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### 11. Re-analyze Document
**POST** `/api/study/documents/:documentId/analyze`

**Headers:** `Cookie: token=jwt_token`

**Request Body:**
```json
{
  "task": "quiz"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "task": "quiz",
      "result": "Generated quiz questions...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "message": "Document re-analyzed successfully"
}
```

### 12. Delete Document
**DELETE** `/api/study/documents/:documentId`

**Headers:** `Cookie: token=jwt_token`

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Test Endpoints (Public Access)

### 13. Test Text Analysis
**POST** `/api/study/test/text`

**Request Body:**
```json
{
  "text": "Sample text for testing...",
  "task": "summary"
}
```

**Response:** Same format as authenticated text analysis

### 14. Test File Upload
**POST** `/api/study/test/upload`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: [PDF/DOC/DOCX/TXT file]
- `task`: Analysis type

**Response:** Same format as authenticated file upload

---

## Testing Examples

### Using curl:
```bash
# Test text analysis
curl -X POST http://localhost:5000/api/study/test/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines.",
    "task": "summary"
  }'

# Test file upload
curl -X POST http://localhost:5000/api/study/test/upload \
  -F "file=@document.pdf" \
  -F "task=summary"

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Using Postman:
1. Import the endpoints with proper headers
2. For authenticated routes, ensure cookies are enabled
3. Test file uploads using form-data
4. Check response status codes and format

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (access denied) |
| 404 | Not Found (resource doesn't exist) |
| 413 | Payload Too Large (file size exceeded) |
| 429 | Too Many Requests (rate limiting) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Text Analysis**: 30 requests per minute per user
- **File Upload**: 10 requests per minute per user
- **Authentication**: 5 attempts per minute per IP

---

## File Support

| Format | Extension | Max Size | Notes |
|--------|-----------|----------|-------|
| PDF | .pdf | 10MB | Text extraction supported |
| Word | .doc, .docx | 10MB | Full document parsing |
| Text | .txt | 10MB | Direct text content |

---

## Environment Configuration

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edugenie
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
```

---

## Features Summary

✅ **Complete Authentication System**
- JWT-based authentication with HTTP-only cookies
- Secure password hashing with bcrypt
- User registration, login, logout, and profile management
- Session management and security

✅ **Advanced Text & Document Analysis**
- Direct text input analysis (up to 5000 characters)
- Multi-format file support (PDF, DOC, DOCX, TXT)
- AI-powered analysis using Google Gemini API
- Intelligent text chunking for large documents

✅ **Four AI Analysis Types**
- **Summary**: Concise overview of main points
- **Explanation**: Detailed, easy-to-understand explanations  
- **Quiz**: Interactive multiple choice questions with answers
- **Keywords**: Important terms organized by relevance

✅ **Comprehensive Document Management**
- Upload and store documents with metadata
- Track all analyses performed on each document
- Pagination for large document collections
- Re-analyze documents with different AI tasks
- Secure document deletion with file cleanup

✅ **Production-Ready Features**
- File size validation and limits (10MB max)
- Comprehensive error handling and validation
- Rate limiting and security measures
- CORS configuration for frontend integration
- Automatic file cleanup and optimization

✅ **Developer-Friendly API**
- RESTful API design with consistent responses
- Public test endpoints for development
- Detailed error messages and status codes
- Comprehensive documentation with examples
- Easy integration with frontend applications

The backend is fully implemented, tested, and ready for production deployment!
