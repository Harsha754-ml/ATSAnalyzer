<div align="center">
  <img width="1200" height="475" alt="ATS Resume Comparator Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # ATS Resume Comparator System

  <a href="https://github.com/harshasalva/resume-comparator/stargazers">
    <img src="https://img.shields.io/github/stars/harshasalva/resume-comparator?style=flat&color=FFD700" alt="stars" />
  </a>
  <a href="https://github.com/harshasalva/resume-comparator/issues">
    <img src="https://img.shields.io/github/issues/harshasalva/resume-comparator" alt="issues" />
  </a>
  <a href="https://github.com/harshasalva/resume-comparator/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/harshasalva/resume-comparator" alt="license" />
  </a>
  <img src="https://img.shields.io/github/languages/code-size/harshasalva/resume-comparator" alt="code-size" />
</div>

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## About

The **ATS Resume Comparator System** is a full-stack web application that helps students improve their resumes by comparing them against ATS-friendly templates. Admins upload an ideal resume template (containing the ideal structure and required keywords), and students can upload their resumes to receive:

- **Match Percentage** - How closely their resume aligns with the template
- **Missing Skills** - Key skills/keywords they're lacking
- **Missing Sections** - Important sections not present in their resume
- **Improvement Suggestions** - Actionable tips to boost ATS compatibility

---

## Features

- **Admin Mode** - Upload ATS-friendly resume templates with required keywords and sections
- **Student Mode** - Upload resumes for comparison and analysis
- **Comprehensive Analysis** - Scores resumes based on contact info, education, experience, skills, projects, and certifications
- **Keyword Detection** - Identifies 40+ technical skills and recommends missing ones
- **Section Detection** - Automatically detects resume sections (Contact, Summary, Skills, Experience, Projects, Education, Certifications)
- **Smart Suggestions** - Context-aware improvement tips based on resume gaps
- **Modern UI** - Beautiful 3D animated background with dark/light theme support
- **File Support** - Accepts PDF, TXT, DOC, and DOCX files

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Tailwind CSS 4 | Styling |
| Three.js | 3D Background |
| Motion | Animations |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | API Server |
| Multer | File Uploads |
| CORS | Cross-Origin Support |

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **pnpm**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshasalva/resume-comparator.git
   cd resume-comparator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (if needed)
   ```

### Running the Project

1. **Start the backend server** (Terminal 1)
   ```bash
   npm run dev:backend
   # Backend runs on http://localhost:5001
   ```

2. **Start the frontend** (Terminal 2)
   ```bash
   npm run dev
   # Frontend runs on http://localhost:3000
   ```

---

## Project Structure

```
resume-comparator/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── AnalysisView.tsx
│   │   ├── AnimationLayer.tsx
│   │   ├── Scene3D.tsx
│   │   └── ThreeBackground.tsx
│   ├── context/           # React context
│   │   └── ThemeContext.tsx
│   ├── lib/               # Utilities
│   │   └── utils.ts
│   ├── services/          # API services
│   │   └── geminiService.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── backend/               # Backend source
│   ├── server.js          # Express server
│   └── utils/             # Backend utilities
├── public/                # Static assets
├── dist/                  # Build output
├── package.json           # Dependencies
├── vite.config.ts         # Vite config
├── tsconfig.json          # TypeScript config
└── tailwind.config.js     # Tailwind config
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/admin/template` | Upload ATS template |
| `GET` | `/admin/template` | Get current template |
| `POST` | `/compare-resume` | Compare resume to template |
| `POST` | `/analyze-resume` | Analyze a single resume |

### Request Format

**File Upload:**
```
POST /analyze-resume
Content-Type: multipart/form-data
Body: { resume: <file> }
```

**Raw Text:**
```
POST /analyze-resume
Content-Type: application/json
Body: { text: "Resume content..." }
```

### Response Example

```json
{
  "score": 85,
  "skills": ["javascript", "react", "node.js"],
  "missingSkills": ["typescript", "docker"],
  "name": "John Doe",
  "contact": "john@example.com",
  "projects": ["Portfolio Website"],
  "suggestions": [
    { "category": "Skills", "message": "Add TypeScript", "impact": "high" }
  ]
}
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5001
GEMINI_API_KEY=your_api_key_here
```

> Note: The backend works without API keys using local keyword analysis. Gemini integration is optional for advanced features.

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with React + Express + Tailwind + Three.js</sub>
</div>