# AI-Powered Job Application Tracker

Comprehensive job application tracking system with Chrome extension for one-click job tracking from any job posting site.

## Features

- 🚀 **Chrome Extension** - One-click job tracking from major job sites (LinkedIn, Indeed, Glassdoor)
- 📊 **Analytics Dashboard** - Interactive charts and application insights
- 🔥 **Streak Tracking** - Gamified daily application goals and streaks
- 🤖 **AI-Powered Analysis** - Job description parsing and skill matching
- 📈 **Pipeline Management** - Track applications through interview stages
- 🎯 **Goal Setting** - Daily and weekly application targets
- 🏢 **Company Management** - Automated company data enrichment
- 📱 **Mobile PWA** - Full mobile experience with offline support

## Tech Stack

### Backend
- FastAPI with Python 3.9+
- PostgreSQL with SQLAlchemy ORM
- OpenAI GPT-4 for job analysis and insights
- JWT Authentication
- Async processing for AI tasks

### Frontend
- React 18+ with TypeScript
- Tailwind CSS for UI design  
- Chart.js for analytics visualizations
- React Query for state management
- Progressive Web App (PWA)

### Chrome Extension
- Manifest V3
- Content scripts for job site integration
- Background service worker
- Real-time sync with web application

### Infrastructure
- Docker containerization
- PostgreSQL database
- Environment-based configuration

## Project Structure

```
job-tracker/
├── backend/           # FastAPI application
├── frontend/          # React TypeScript PWA
├── extension/         # Chrome extension
├── docs/             # Documentation
├── docker-compose.yml # Development environment
└── README.md         # This file
```

## Quick Start

1. **Clone and Setup**
   ```bash
   cd job-tracker-project
   cp .env.example .env  # Configure your environment variables
   ```

2. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend && pip install -r requirements.txt
   
   # Frontend
   cd frontend && npm install
   ```

4. **Run Applications**
   ```bash
   # Backend (Terminal 1)
   cd backend && uvicorn main:app --reload
   
   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```

5. **Load Chrome Extension**
   ```bash
   # Open Chrome and go to chrome://extensions/
   # Enable Developer mode
   # Click "Load unpacked" and select the extension/ folder
   ```

## Environment Variables

Create a `.env` file with:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/job_tracker

# Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI for job analysis
OPENAI_API_KEY=your-openai-api-key

# Security
RATE_LIMIT_PER_MINUTE=100

# Extension settings
EXTENSION_SECRET=your-extension-secret-key
```

## Development

- Backend API: http://localhost:8000
- Frontend App: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Chrome Extension: Load unpacked from extension/ folder

## License

MIT License - see LICENSE file for details.