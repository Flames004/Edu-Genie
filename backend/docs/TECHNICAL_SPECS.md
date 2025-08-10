# EduGenie Backend - Technical Specifications

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   External      │
│   (React/Next)  │◄──►│   (Node.js)      │◄──►│   Services      │
│                 │    │                  │    │                 │
│ • User Interface│    │ • REST API       │    │ • MongoDB       │
│ • File Upload   │    │ • Authentication │    │ • Google Gemini │
│ • Results View  │    │ • File Processing│    │ • File System   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **AI Service**: Google Gemini 1.5-flash
- **File Processing**: Multer, pdf-parse, mammoth
- **Security**: bcryptjs, cookie-parser, CORS

---

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,           // User's full name
  email: String,          // Unique email address
  password: String,       // Bcrypt hashed password
  createdAt: Date,        // Account creation timestamp
  updatedAt: Date         // Last profile update
}
```

### Document Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Reference to User
  filename: String,       // Original filename
  originalName: String,   // User-provided filename
  fileSize: Number,       // File size in bytes
  mimeType: String,       // File MIME type
  extractedText: String,  // Parsed text content
  analyses: [{            // Array of AI analyses
    task: String,         // Type: summary|explanation|quiz|keywords
    result: String,       // AI-generated result
    createdAt: Date       // Analysis timestamp
  }],
  uploadDate: Date,       // File upload timestamp
  updatedAt: Date         // Last modification
}
```

---

## 🔧 API Architecture

### Request/Response Flow
```
Client Request → Middleware → Route Handler → Controller → Model → Database
                    ↓              ↓             ↓          ↓         ↓
                 Auth Check    Validation    Business    Schema   MongoDB
                    ↓              ↓         Logic        ↓         ↓
Client Response ← JSON Format ← Response ← Processing ← Query ← Collection
```

### Middleware Stack
1. **CORS**: Cross-origin resource sharing
2. **Body Parser**: JSON and form-data parsing
3. **Cookie Parser**: JWT token extraction
4. **Authentication**: Token verification (protected routes)
5. **File Upload**: Multer configuration (upload routes)
6. **Error Handling**: Global error processing

### Controller Logic
- **authController.js**: User management and authentication
- **studyController.js**: Document processing and AI analysis

---

## 🤖 AI Integration

### Google Gemini Configuration
```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### Text Processing Pipeline
1. **Input Validation**: Check text length and format
2. **Text Chunking**: Split large content (>4000 chars)
3. **AI Processing**: Send to Gemini API with task-specific prompts
4. **Result Aggregation**: Combine responses from multiple chunks
5. **Response Formatting**: Clean and structure AI output

### Analysis Types & Prompts
```javascript
const prompts = {
  summary: "Provide a concise summary of the following text...",
  explanation: "Explain the following text in simple terms...",
  quiz: "Create multiple choice questions based on...",
  keywords: "Extract and organize important keywords from..."
};
```

---

## 📁 File Processing

### Supported Formats
| Format | Parser | Features |
|--------|--------|----------|
| PDF | pdf-parse | Text extraction, metadata |
| DOC/DOCX | mammoth | Rich text, formatting preservation |
| TXT | fs.readFileSync | Direct text reading |

### Processing Workflow
```
File Upload → Validation → Temporary Storage → Text Extraction → AI Analysis → Cleanup
     ↓            ↓              ↓                ↓              ↓          ↓
  Multer    Size/Type Check   uploads/       parseFile()    Gemini API   fs.unlink()
```

### File Security
- Size limits: 10MB maximum
- Type validation: Whitelist approach
- Temporary storage: Auto-cleanup after processing
- Path sanitization: Prevent directory traversal

---

## 🔐 Security Implementation

### Authentication Flow
```
Registration → Password Hash → JWT Generation → HTTP-only Cookie
      ↓              ↓              ↓                    ↓
  bcrypt.hash()  Database Save  jsonwebtoken.sign()  res.cookie()

Login → Password Verify → JWT Generation → HTTP-only Cookie
  ↓           ↓              ↓                    ↓
User Input  bcrypt.compare() jsonwebtoken.sign()  res.cookie()
```

### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: HTTP-only cookies, secure flags
- **Input Validation**: Mongoose schemas, manual checks
- **CORS Policy**: Frontend origin whitelist
- **Rate Limiting**: Per-endpoint request limits
- **File Validation**: Type and size restrictions

---

## 📈 Performance Optimizations

### Database Optimization
```javascript
// Indexes for faster queries
userSchema.index({ email: 1 });
documentSchema.index({ userId: 1, uploadDate: -1 });
```

### Memory Management
- Stream processing for large files
- Automatic file cleanup after processing
- Efficient text chunking algorithm
- Connection pooling for MongoDB

### API Optimization
- Pagination for large datasets
- Selective field returns
- Compression for responses
- Efficient query patterns

---

## 🔍 Error Handling

### Error Categories
1. **Validation Errors**: Input format/type issues
2. **Authentication Errors**: Token/permission issues
3. **File Processing Errors**: Upload/parsing failures
4. **AI Service Errors**: Gemini API issues
5. **Database Errors**: Connection/query problems

### Error Response Format
```javascript
{
  success: false,
  error: "Human-readable error message",
  details: "Technical details for debugging",
  code: "ERROR_CODE",
  timestamp: "2025-01-01T00:00:00.000Z"
}
```

---

## 🧪 Testing Strategy

### Test Coverage Areas
- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: API endpoints and database
- **Security Tests**: Authentication and authorization
- **File Processing Tests**: Various file formats
- **AI Integration Tests**: Gemini API responses

### Test Endpoints
- `/api/study/test/text`: Text analysis without auth
- `/api/study/test/upload`: File upload without auth
- `/api/auth/test`: Service health check

---

## 📊 Monitoring & Logging

### Key Metrics
- Request/response times
- Error rates by endpoint
- File upload success rates
- AI service response times
- Database query performance
- Memory and CPU usage

### Log Categories
```javascript
// Request logging
app.use(morgan('combined'));

// Error logging
console.error('Error:', error.message, error.stack);

// Performance logging
console.time('ai-analysis');
// ... AI processing
console.timeEnd('ai-analysis');
```

---

## 🚀 Deployment Considerations

### Environment Configurations
- **Development**: Auto-reload, detailed logging
- **Staging**: Production-like, testing features
- **Production**: Optimized, security hardened

### Scaling Strategies
1. **Horizontal Scaling**: Multiple server instances
2. **Database Scaling**: Read replicas, sharding
3. **Caching Layer**: Redis for session/results
4. **CDN Integration**: Static file delivery
5. **Load Balancing**: Request distribution

### Production Checklist
- [ ] Environment variables secured
- [ ] Database connections optimized
- [ ] HTTPS/SSL configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Backup procedures
- [ ] Error tracking
- [ ] Performance monitoring
