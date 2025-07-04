#!/bin/bash

# Quran Quest Setup Script
echo "🚀 Setting up Quran Quest..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed."

# Check if Node.js is installed (for development)
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. You'll need it for frontend development."
fi

# Check if Python is installed (for development)
if ! command -v python3 &> /dev/null; then
    print_warning "Python 3 is not installed. You'll need it for backend development."
fi

# Create .env files if they don't exist
print_status "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
# Database
DATABASE_URL=sqlite:///./quran_quest.db

# Security
SECRET_KEY=your-secret-key-change-in-production
DEBUG=true

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
QURAN_API_BASE_URL=https://quranapi.pages.dev/api
EOF
    print_status "Created backend/.env"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8000/api/v1
EOF
    print_status "Created frontend/.env"
fi

# Function to setup development environment
setup_dev() {
    print_status "Setting up development environment..."
    
    # Backend setup
    if [ -d "backend" ]; then
        print_status "Setting up backend..."
        cd backend
        
        # Create virtual environment
        if [ ! -d "venv" ]; then
            python3 -m venv venv
            print_status "Created Python virtual environment"
        fi
        
        # Activate virtual environment and install dependencies
        source venv/bin/activate
        pip install -r requirements.txt
        print_status "Installed backend dependencies"
        
        cd ..
    fi
    
    # Frontend setup
    if [ -d "frontend" ]; then
        print_status "Setting up frontend..."
        cd frontend
        npm install
        print_status "Installed frontend dependencies"
        cd ..
    fi
}

# Function to setup production environment
setup_prod() {
    print_status "Setting up production environment with Docker..."
    
    # Build and start services
    docker-compose up -d --build
    
    print_status "Services are starting up..."
    print_status "Backend API will be available at: http://localhost:8000"
    print_status "Frontend will be available at: http://localhost:3000"
    print_status "API Documentation: http://localhost:8000/docs"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "✅ All services are running successfully!"
    else
        print_error "❌ Some services failed to start. Check logs with: docker-compose logs"
    fi
}

# Main setup logic
echo ""
echo "Choose setup type:"
echo "1) Development setup (local Python/Node.js)"
echo "2) Production setup (Docker)"
echo "3) Both"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        setup_dev
        ;;
    2)
        setup_prod
        ;;
    3)
        setup_dev
        setup_prod
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
print_status "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. For development:"
echo "   - Backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   - Frontend: cd frontend && npm start"
echo ""
echo "2. For production:"
echo "   - Start: docker-compose up -d"
echo "   - Stop: docker-compose down"
echo "   - Logs: docker-compose logs -f"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
print_status "Happy coding! 📚✨" 