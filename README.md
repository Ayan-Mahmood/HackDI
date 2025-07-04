# Quran Quest - Refactored

A modern, modular Quran learning application with FastAPI backend and React frontend.

## 🏗️ Architecture

- **Backend**: FastAPI with SQLAlchemy ORM
- **Frontend**: React 18 with TypeScript
- **Database**: PostgreSQL (with SQLite for development)
- **Authentication**: JWT tokens
- **Real-time**: WebSocket connections
- **Deployment**: Docker support

## 📁 Project Structure

```
quran-quest/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configurations
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── tests/              # Frontend tests
└── docker/                 # Docker configuration
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Features

### Backend Features
- ✅ JWT Authentication
- ✅ User management
- ✅ Quran data management
- ✅ Progress tracking
- ✅ Social features (friends, community)
- ✅ Real-time notifications
- ✅ API rate limiting
- ✅ Comprehensive testing

### Frontend Features
- ✅ TypeScript support
- ✅ Modular component architecture
- ✅ Custom hooks for data management
- ✅ Responsive design
- ✅ Offline support (PWA)
- ✅ Accessibility features
- ✅ Comprehensive testing

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

## 📝 License

This project is part of the HackDI application.
