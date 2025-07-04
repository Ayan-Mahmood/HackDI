# Firebase Setup Guide

This guide will help you set up Firebase for your Quran Quest application.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "quran-quest")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication
5. Click "Save"

## 3. Set up Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a location for your database
5. Click "Done"

## 4. Get Your Firebase Configuration

1. In your Firebase project, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "Quran Quest Web")
6. Click "Register app"
7. Copy the configuration object

## 5. Create Environment Variables

Create a `.env` file in the `Frontend` directory with the following variables:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Replace the values with your actual Firebase configuration.

## 6. Set up Firestore Security Rules

In your Firestore Database, go to the "Rules" tab and add these basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read threads and comments
    match /threads/{threadId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /comments/{commentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Users can manage their own friendships
    match /friendships/{friendshipId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
    }
  }
}
```

## 7. Install Dependencies

Run the following command in the `Frontend` directory:

```bash
npm install
```

## 8. Start the Development Server

```bash
npm start
```

## 9. Deploy to Firebase Hosting

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init hosting
   ```

4. Build your app:
   ```bash
   npm run build
   ```

5. Deploy:
   ```bash
   firebase deploy
   ```

## Firestore Collections Structure

Your Firestore database will have the following collections:

### users
- `uid` (document ID): User's Firebase Auth UID
- `email`: User's email address
- `displayName`: User's display name
- `photoURL`: User's profile photo URL
- `createdAt`: Account creation timestamp
- `lastLoginAt`: Last login timestamp
- `preferences`: User preferences object
- `stats`: User statistics object

### threads
- `id` (document ID): Auto-generated
- `authorId`: Author's user ID
- `authorName`: Author's display name
- `authorPhoto`: Author's photo URL
- `content`: Thread content
- `surahId`: Related surah ID (optional)
- `ayahNumber`: Related ayah number (optional)
- `likes`: Number of likes
- `comments`: Number of comments
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `tags`: Array of tags

### comments
- `id` (document ID): Auto-generated
- `threadId`: Parent thread ID
- `authorId`: Author's user ID
- `authorName`: Author's display name
- `authorPhoto`: Author's photo URL
- `content`: Comment content
- `createdAt`: Creation timestamp
- `likes`: Number of likes

### friendships
- `id` (document ID): Auto-generated
- `userId`: User's ID
- `friendId`: Friend's ID
- `status`: 'pending', 'accepted', or 'blocked'
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Free Tier Limits

Firebase's free tier includes:
- **Authentication**: 10,000 users/month
- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Hosting**: 10GB storage, 360MB/day transfer

This should be more than sufficient for 1,000 users/month! 