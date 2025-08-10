# EduGenie Backend Deployment Guide

## 📋 Prerequisites

- **Node.js 18+** (Latest LTS recommended)
- **MongoDB 6.0+** (Local installation or cloud service)
- **Google Gemini API Key** (From Google AI Studio)
- **Git** (For version control)

---

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd EduGenie/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Environment Configuration
Create `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/edugenie

# Authentication
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random

# AI Service
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# CORS
FRONTEND_ORIGIN=http://localhost:3000
```

### 3. Start Development Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## 🔧 Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PORT` | Server port | No | 5000 | `5000` |
| `NODE_ENV` | Environment mode | No | development | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | **Yes** | - | `mongodb://localhost:27017/edugenie` |
| `JWT_SECRET` | Secret key for JWT tokens | **Yes** | - | `super-secret-key-2024` |
| `GEMINI_API_KEY` | Google Gemini API key | **Yes** | - | `AIzaSy...` |
| `FRONTEND_ORIGIN` | Frontend URL for CORS | No | http://localhost:3000 | `https://yourdomain.com` |

---

## 🗄️ Database Setup

### Local MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database (auto-created on first connection)
```

### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Get connection string
4. Add to `MONGODB_URI` in `.env`

### Database Structure
The application automatically creates collections:
- `users` - User accounts and authentication
- `documents` - Uploaded files and analysis results

---

## 🤖 Google Gemini API Setup

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create new project or select existing
3. Generate API key
4. Add key to `GEMINI_API_KEY` in `.env`

**API Limits:**
- Free tier: 15 requests per minute
- Paid tier: Higher limits available

---

## 🏭 Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start ecosystem.config.js

# Setup auto-restart on system boot
pm2 startup
pm2 save
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'edugenie-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### Using Docker
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t edugenie-backend .
docker run -p 5000:5000 --env-file .env edugenie-backend
```

### Using Traditional Hosting
```bash
# On your server
git clone <repository-url>
cd EduGenie/backend
npm install --production
cp .env.example .env
# Configure .env file
npm start
```

---

## 🔒 Security Configuration

### Production Security Checklist
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set proper `FRONTEND_ORIGIN` for CORS
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Set up rate limiting (if needed)
- [ ] Regular security updates

### Recommended JWT_SECRET Generation
```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Health Monitoring

### Health Check Endpoints
```bash
# Basic health check
curl http://localhost:5000/api/auth/test

# Database connectivity
curl http://localhost:5000/api/study/types

# AI service check
curl -X POST http://localhost:5000/api/study/test/text \
  -H "Content-Type: application/json" \
  -d '{"text":"test","task":"summary"}'
```

### Logging
Application logs are output to console. In production, consider:
- Log aggregation (ELK stack, Fluentd)
- Error monitoring (Sentry, Rollbar)
- Performance monitoring (New Relic, DataDog)

---

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Check connection string
echo $MONGODB_URI
```

**Gemini API Errors**
```bash
# Verify API key
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

**Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**File Upload Issues**
```bash
# Check uploads directory permissions
ls -la uploads/
chmod 755 uploads/
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific modules
DEBUG=app:* npm run dev
```

---

## 📊 Performance Optimization

### Production Optimizations
- Enable gzip compression
- Configure proper caching headers
- Use CDN for static files
- Implement database indexing
- Enable connection pooling
- Set up load balancing (if needed)

### Scaling Considerations
- Horizontal scaling with load balancer
- Database replication and sharding
- File storage on cloud services (AWS S3, etc.)
- Caching layer (Redis, Memcached)
- Microservices architecture for large scale

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create backup
mongodump --uri="$MONGODB_URI" --out=backup/

# Restore backup
mongorestore --uri="$MONGODB_URI" backup/
```

### File Backup
```bash
# Backup uploaded files (if persistent storage needed)
tar -czf uploads-backup.tar.gz uploads/
```

---

## 📈 Monitoring & Analytics

### Key Metrics to Monitor
- Response times
- Error rates
- Database performance
- API usage patterns
- File upload success rates
- AI service response times

### Log Analysis
```bash
# Monitor application logs
tail -f /var/log/edugenie/app.log

# Error log analysis
grep -i error /var/log/edugenie/app.log
```
