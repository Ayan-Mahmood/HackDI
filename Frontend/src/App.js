import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Dashboard from './Dashboard';
import UserProfile from './UserProfile';
import DailyLesson from './DailyLesson';
import QuranViewer from './QuranViewer';
import Friends from './Friends';
import Community from './Community';
import QuranicLearning from './QuranicLearning';
import QuranRoadmap from './QuranRoadmap';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/daily-lesson" element={<DailyLesson />} />
          <Route path="/quran-viewer" element={<QuranViewer />} />
          <Route path="/quranic-learning" element={<QuranicLearning />} />
          <Route path="/roadmap" element={<QuranRoadmap />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/community" element={<Community />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Add more routes here as you build your app */}
        </Routes>
      </div>
    </Router>
  );
}

export default App; 