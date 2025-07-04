# Quran Quest - Development Guide

## 🏗️ Architecture Overview

Quran Quest has been completely refactored with a modern, scalable architecture:

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Auto-generated with Swagger/OpenAPI
- **Testing**: pytest with comprehensive test coverage
- **Code Quality**: Black, isort, flake8, mypy

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand for global state
- **Data Fetching**: React Query for server state
- **Styling**: Tailwind CSS with custom components
- **Forms**: React Hook Form with validation
- **Icons**: Lucide React
- **Build Tool**: Create React App

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for production)
- PostgreSQL (optional, SQLite for development)

### Automated Setup
```bash
# Run the setup script
./setup.sh
```

### Manual Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start
```

## 📁 Project Structure

```
quran-quest/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   └── v1/
│   │   │       ├── api.py     # Main router
│   │   │       └── endpoints/ # Route handlers
│   │   ├── core/              # Core configurations
│   │   │   ├── config.py      # Settings
│   │   │   ├── database.py    # DB connection
│   │   │   ├── security.py    # Auth utilities
│   │   │   └── dependencies.py # DI functions
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utilities
│   ├── tests/                 # Test files
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend container
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── quran/        # Quran-related components
│   │   │   ├── social/       # Social features
│   │   │   └── layout/       # Layout components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── stores/           # State management
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   ├── package.json          # Node dependencies
│   └── Dockerfile           # Frontend container
├── docker-compose.yml        # Full stack orchestration
└── setup.sh                 # Automated setup script
```

## 🔧 Development Workflow

### Backend Development

#### Code Style
```bash
# Format code
black app/
isort app/

# Lint code
flake8 app/
mypy app/
```

#### Testing
```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

#### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Frontend Development

#### Code Style
```bash
# Format code
npm run lint:fix

# Type checking
npm run type-check
```

#### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    daily_ayats INTEGER DEFAULT 3,
    learning_mode VARCHAR DEFAULT 'read',
    preferred_language VARCHAR DEFAULT 'english',
    current_surah INTEGER DEFAULT 1,
    current_verse INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_verses_completed INTEGER DEFAULT 0,
    last_completed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Social Tables
```sql
-- Friendships
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_id INTEGER REFERENCES users(id),
    status VARCHAR DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME
);

-- Threads
CREATE TABLE threads (
    id INTEGER PRIMARY KEY,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    thread_type VARCHAR DEFAULT 'discussion',
    ayah_surah INTEGER,
    ayah_verse INTEGER,
    ayah_arabic TEXT,
    ayah_translation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- Comments
CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    thread_id INTEGER REFERENCES threads(id),
    parent_id INTEGER REFERENCES comments(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- Likes
CREATE TABLE likes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    thread_id INTEGER REFERENCES threads(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `GET /api/v1/users/me/progress` - Get user progress
- `GET /api/v1/users/search/{username}` - Search users

### Quran
- `GET /api/v1/quran/surahs` - Get all surahs
- `GET /api/v1/quran/surahs/{number}` - Get surah info
- `GET /api/v1/quran/verses/{surah}/{verse}` - Get specific verse
- `GET /api/v1/quran/daily-lesson` - Get daily lesson
- `POST /api/v1/quran/complete-lesson` - Complete lesson
- `GET /api/v1/quran/roadmap` - Get Quran roadmap

### Social
- `POST /api/v1/social/friends/request` - Send friend request
- `PUT /api/v1/social/friends/{id}/accept` - Accept friend request
- `GET /api/v1/social/friends` - Get friends list
- `POST /api/v1/social/threads` - Create thread
- `GET /api/v1/social/threads` - Get threads
- `GET /api/v1/social/leaderboard` - Get leaderboard

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API endpoints
- **Database Tests**: Test database operations
- **Authentication Tests**: Test JWT and security

### Frontend Testing
- **Component Tests**: Test React components
- **Hook Tests**: Test custom hooks
- **Integration Tests**: Test user workflows
- **E2E Tests**: Test complete user journeys

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Considerations
- Use environment variables for sensitive data
- Set up proper SSL/TLS certificates
- Configure database backups
- Set up monitoring and logging
- Use a production-grade database (PostgreSQL)
- Configure rate limiting
- Set up CI/CD pipelines

## 🔒 Security Best Practices

### Backend Security
- JWT tokens with proper expiration
- Password hashing with bcrypt
- Input validation with Pydantic
- CORS configuration
- Rate limiting
- SQL injection prevention with ORM
- Environment variable management

### Frontend Security
- HTTPS in production
- Secure token storage
- Input sanitization
- XSS prevention
- CSRF protection
- Content Security Policy

## 📊 Performance Optimization

### Backend Optimization
- Database query optimization
- Caching with Redis
- Connection pooling
- Async/await for I/O operations
- Pagination for large datasets

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization
- React Query caching
- Memoization

## 🐛 Debugging

### Backend Debugging
```bash
# Enable debug mode
export DEBUG=true

# View detailed logs
uvicorn app.main:app --reload --log-level debug

# Use FastAPI debugger
# Add breakpoint() in your code
```

### Frontend Debugging
```bash
# Enable React DevTools
# Install browser extension

# Use React Query DevTools
# Add ReactQueryDevtools to your app

# Debug with console
console.log('Debug info');
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is part of the HackDI application. 