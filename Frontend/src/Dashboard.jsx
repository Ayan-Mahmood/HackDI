import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config.js';
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome to Quran Quest</h1>
          <p>Your daily Quran learning journey starts here</p>
        </div>
        <div className="header-actions">
          <Link to="/profile" className="profile-button">
            Profile
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome back, {user?.username}!</h2>
          <p>This is your learning dashboard. More features coming soon!</p>
        </div>

        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>Daily Lessons</h3>
            <p>Access today's Quran pages and ayāt</p>
            <button className="feature-button" disabled>
              Coming Soon
            </button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3>Track Progress</h3>
            <p>Monitor your daily streaks and goals</p>
            <Link to="/profile" className="feature-button">
              View Profile
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Community</h3>
            <p>Connect with other learners</p>
            <button className="feature-button" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
