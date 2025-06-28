# HackDI Frontend - React Login Page

A modern, responsive login page built with React and Firebase authentication.

## Features

- 🎨 Beautiful, modern UI design with green color scheme
- 📱 Fully responsive design
- 🔐 Firebase authentication integration
- ⚡ Loading states and error handling
- 🌙 Dark mode support
- ♿ Accessibility features
- 🔒 Password visibility toggle
- 📝 Form validation
- 👤 User profile management
- 🎯 Goal setting and tracking

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Firebase project with Authentication enabled

## Installation

1. Navigate to the Frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Firebase configuration
   # See Firebase Setup section below
   ```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication with Email/Password sign-in method
4. Set up Firestore Database (if you plan to store user data)
5. Add a web app to your Firebase project
6. Copy the configuration values from your web app
7. Update the `.env` file with your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Running the Application

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. The application will automatically redirect to the login page

## Project Structure

```
Frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── App.js              # Main application component
│   ├── App.css             # Main application styles
│   ├── index.js            # Application entry point
│   ├── index.css           # Global styles
│   ├── LoginPage.jsx       # Login page component
│   ├── LoginPage.css       # Login page styles
│   ├── SignupPage.jsx      # Signup page component
│   ├── SignupPage.css      # Signup page styles
│   ├── UserProfile.jsx     # User profile component
│   ├── UserProfile.css     # User profile styles
│   ├── Dashboard.jsx       # Dashboard component
│   ├── Dashboard.css       # Dashboard styles
│   └── firebase-config.js  # Firebase configuration
├── .env                    # Environment variables (not in git)
├── .env.example           # Example environment file
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Environment Variables

The application uses environment variables for Firebase configuration. Create a `.env` file in the Frontend directory with the following variables:

- `REACT_APP_FIREBASE_API_KEY`: Your Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID`: Your Firebase app ID
- `REACT_APP_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Customization

### Styling
- Modify CSS files in the `src/` directory to customize the appearance
- The design uses CSS custom properties for easy theming
- Dark mode is automatically supported

### Functionality
- Edit React components in the `src/` directory to modify behavior
- Update routing in `src/App.js` for navigation changes
- Modify Firebase configuration in `src/firebase-config.js`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Browser Support

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Notes

- Firebase API keys are safe to expose in client-side code
- The `.env` file is excluded from version control
- Use Firebase Security Rules to protect your data
- Enable appropriate authentication methods in Firebase Console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the HackDI application. 