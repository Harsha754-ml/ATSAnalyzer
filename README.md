# ATS Resume Comparator System

A full-stack web application that helps students improve their resumes by comparing them against ATS-friendly templates.

---

## Table of Contents

* About
* Features
* Tech Stack
* Getting Started
* Project Structure
* API Endpoints
* Environment Variables
* Testing
* Contributing
* License

---

## About

The **ATS Resume Comparator System** helps users analyze resumes against ideal ATS templates.

It provides:

* Match percentage
* Missing skills
* Missing sections
* Improvement suggestions

---

## Features

* Admin mode for uploading ATS templates
* Student mode for resume analysis
* Keyword detection (40+ skills)
* Section detection (education, skills, etc.)
* Smart suggestions based on gaps
* Modern UI with dark/light mode
* Supports PDF, TXT, DOC, DOCX

---

## Tech Stack

### Frontend

* React 19
* Vite
* TypeScript
* Tailwind CSS
* Three.js
* Motion

### Backend

* Express.js
* JSON file storage
* JWT authentication
* bcryptjs
* Multer
* pdf-parse

---

## Getting Started

### Prerequisites

* Node.js (v18+)
* npm or pnpm

---

### Installation

```bash
git clone https://github.com/Harsha754-ml/ATSAnalyzer.git
cd ATSAnalyzer
npm install
```

Install backend:

```bash
cd backend
npm install
cd ..
```

---

### Run the Project

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
npm run dev
```

---

## Project Structure

```
ATSAnalyzer/
├── src/
├── backend/
├── public/
├── dist/
├── package.json
```

---

## API Endpoints

### Auth

* POST /api/auth/signup
* POST /api/auth/login
* GET /api/auth/me

### Resume

* POST /api/resume/upload
* GET /api/resume/analyze
* GET /api/resume/history

---

## Environment Variables

Create `.env`:

```
PORT=5001
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key
```

---

## Testing

```bash
cd backend
npm test
```

---

## Contributing

1. Fork repo
2. Create branch
3. Commit changes
4. Push
5. Open PR

---

## License

MIT License
