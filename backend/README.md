# EduGenie Backend

AI-powered learning companion backend built with Node.js, Express, MongoDB, and Gemini AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Gemini API key

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/EduGenie.git
cd EduGenie/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your actual values

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── config/          # Database configuration
├── controllers/     # Route handlers and business logic
├── middleware/      # Authentication and other middleware
├── models/          # MongoDB schemas
├── routes/          # API route definitions
├── utils/           # Utility functions
├── uploads/         # File upload storage
├── docs/            # Documentation
├── server.js        # Application entry point
└── package.json     # Dependencies and scripts
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## 📚 API Documentation

See [API Documentation](./docs/API_Documentation.md) for detailed endpoint information.

## 🛠️ Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

## 🔐 Features

- **User Authentication** - JWT-based auth with HTTP-only cookies
- **File Upload & Processing** - Support for PDF, DOC, DOCX, TXT files
- **AI Analysis** - Multiple analysis types (summary, explanation, quiz, keywords)
- **Document Management** - Store, retrieve, and manage uploaded documents
- **Text Chunking** - Intelligent handling of large documents
- **Error Handling** - Comprehensive error responses and validation

## 🤖 AI Integration

Uses Google's Gemini API for natural language processing with support for:
- Text summarization
- Concept explanation
- Quiz generation
- Keyword extraction

## 📄 File Support

- **PDF Files** - Text extraction using pdf-parse
- **Word Documents** - .docx and .doc support via mammoth
- **Text Files** - Direct text processing
- **File Size Limit** - 10MB maximum upload size

## 🔒 Security Features

- JWT authentication with HTTP-only cookies
- Input validation and sanitization
- File type and size restrictions
- User document isolation
- CORS configuration

## 🏗️ Architecture

- **Express.js** - Web framework
- **MongoDB** - Document database with Mongoose ODM
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation
- **node-fetch** - HTTP client for Gemini API

## 🚀 Deployment

Ready for deployment on platforms like:
- Render
- Heroku
- Railway
- DigitalOcean
- AWS EC2

## 📝 License

MIT License - see LICENSE file for details.
