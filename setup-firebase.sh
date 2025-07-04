#!/bin/bash

echo "🚀 Setting up Quran Quest with Firebase..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Navigate to Frontend directory
cd Frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Please create a .env file in the Frontend directory with your Firebase configuration:"
    echo ""
    echo "REACT_APP_FIREBASE_API_KEY=your_api_key_here"
    echo "REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com"
    echo "REACT_APP_FIREBASE_PROJECT_ID=your_project_id"
    echo "REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com"
    echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id"
    echo "REACT_APP_FIREBASE_APP_ID=your_app_id"
    echo ""
    echo "📖 See Frontend/FIREBASE_SETUP.md for detailed setup instructions"
    echo ""
    read -p "Press Enter to continue without .env file (you'll need to create it later)..."
else
    echo "✅ .env file found"
fi

# Install Firebase CLI globally if not already installed
if ! command -v firebase &> /dev/null; then
    echo "🔥 Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI is already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Firebase project at https://console.firebase.google.com/"
echo "2. Follow the instructions in Frontend/FIREBASE_SETUP.md"
echo "3. Create a .env file with your Firebase configuration"
echo "4. Run 'npm start' in the Frontend directory to start development"
echo ""
echo "🚀 To start development:"
echo "cd Frontend && npm start" 