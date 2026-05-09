# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ATS Resume Comparator is a full-stack application that compares student resumes against ATS-friendly templates. Admins upload ideal templates, students upload resumes, and the system analyzes match percentage, missing keywords, and missing sections.

## Commands

### Frontend (root directory)
```bash
npm run dev      # Start Vite dev server on port 3000
npm run build   # Build for production
npm run lint    # TypeScript type checking
```

### Backend (`backend/` directory)
```bash
cd backend && node server.js       # Start backend on port 5001
```
- No test script defined in backend `package.json` — tests would need to be added

## Architecture

### Frontend (React 19 + Vite + TypeScript)
- `src/App.tsx` — main app component
- `src/components/` — UI components including 3D background (Three.js)
- `src/services/geminiService.ts` — API client for backend communication
- `src/context/ThemeContext.tsx` — dark/light theme state

### Backend (Express.js + JSON file storage)
The backend **does not use MongoDB** despite what some docs say — it uses a lightweight JSON file database.

**Key files:**
- `backend/server.js` — Express server with all routes, middleware, and the deterministic ATS engine. This is the main backend file.
- `backend/utils/jsonDb.js` — JSON file-based collection class (replaces MongoDB)
- `backend/utils/jwt.js` — JWT token generation/verification
- `backend/data/` — JSON storage files: `users.json`, `resumes.json`, `portfolios.json`

**ATS Engine (embedded in server.js):**
The deterministic ATS engine processes templates and compares resumes using:
1. `processTemplate()` — extracts keywords and sections with config
2. `compareResume()` — fuzzy keyword matching with Levenshtein distance
3. `validateSections()` — checks required sections
4. `analyzeText()` — standalone single-resume analysis
5. `fallbackResponse()` — graceful fallback when extraction fails

**Data flow:**
1. Institution uploads ATS template → stored in `backend/data/templates`
2. Student uploads resume → compared against their institution's template
3. Deterministic engine returns metrics, missing keywords, section issues, and annotations

### API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | No | Register institution |
| `/auth/login` | POST | No | Login, returns JWT |
| `/auth/me` | GET | Yes | Get current user |
| `/institutions` | GET | No | List all institutions |
| `/institutions/template` | GET/POST/DELETE | Yes | Manage institution's ATS template |
| `/compare-resume` | POST | No | Compare resume against institution's template |
| `/analyze-resume` | POST | No | Single resume analysis (no template needed) |

## Key Patterns

### JSON DB Usage
Collections are accessed via `db.users`, `db.resumes`, `db.portfolios` with a MongoDB-like API:
```javascript
const user = db.users.findOne({ email });
const newDoc = db.users.create(data);
db.users.findByIdAndUpdate(id, updates);
```

### ATS Config System
Templates support configurable strictness via `templateConfig`:
```javascript
{
  use_keywords: true,
  use_sections: true,
  use_formatting: true,
  enabled_sections: ['skills', 'projects', 'education', 'experience', 'summary'],
  strictness: 'low' | 'medium' | 'high'
}
```

### Fallback Behavior
`server.js` uses a global error handler that always returns a valid `fallbackResponse()` instead of throwing errors, ensuring the API never crashes.

## Environment Variables
```env
PORT=5001                    # Backend port
JWT_SECRET=...              # JWT signing secret
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE_MB=5
```
