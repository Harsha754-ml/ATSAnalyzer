# Smart Resume Analyzer — Backend API

## Tech Stack
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs password hashing
- multer file uploads
- pdf-parse text extraction

## Folder Structure
```
backend/
├── controllers/
│   ├── auth.controller.js
│   ├── resume.controller.js
│   └── portfolio.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── upload.middleware.js
├── models/
│   ├── User.model.js
│   ├── Resume.model.js
│   └── Portfolio.model.js
├── routes/
│   ├── auth.routes.js
│   ├── resume.routes.js
│   └── portfolio.routes.js
├── utils/
│   ├── resumeAnalyzer.js
│   └── jwt.js
├── tests/
│   └── api.test.js
├── uploads/           (auto-created)
├── .env
├── server.js
└── package.json
```

## Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/resume_analyzer
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE_MB=5
```

### 3. Start MongoDB
Make sure MongoDB is running locally, or use MongoDB Atlas (paste connection string in MONGO_URI).

### 4. Run the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

### 5. Run tests
```bash
npm test
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/update-profile` | ✅ | Update name/avatar |

### Resume
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/resume/upload` | ✅ | Upload PDF/TXT resume |
| GET | `/api/resume/analyze` | ✅ | Get latest resume analysis |
| GET | `/api/resume/history` | ✅ | Get all uploaded resumes |
| DELETE | `/api/resume/:id` | ✅ | Delete a resume |

### Portfolio
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/portfolio/me` | ✅ | Get your portfolio |
| GET | `/api/portfolio/:userId` | ✅ | Get portfolio by user ID |
| GET | `/api/portfolio/slug/:slug` | ❌ | Get public portfolio by slug |
| PUT | `/api/portfolio/update` | ✅ | Update portfolio fields |
| DELETE | `/api/portfolio` | ✅ | Delete portfolio |

---

## Sample Requests

### Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "resume=@/path/to/resume.pdf"
```

### Get Analysis
```bash
curl http://localhost:5000/api/resume/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Portfolio
```bash
curl http://localhost:5000/api/portfolio/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Portfolio
```bash
curl -X PUT http://localhost:5000/api/portfolio/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Full Stack Dev","skills":["React","Node.js"],"isPublic":true}'
```
