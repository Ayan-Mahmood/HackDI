import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AudioSettings from './AudioSettings';
import './UserProfile.css';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    dailyAyats: '3',
    learningMode: 'read',
    preferredLanguage: 'english'
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser.uid);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add keyboard shortcut for reset
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        handleResetAccount();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Log testing info to console
    console.log('🧪 Testing Mode: Account reset available via Ctrl+Shift+R or testing button');
    
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          username: data.username || '',
          dailyAyats: data.dailyAyats?.toString() || '3',
          learningMode: data.learningMode || 'read',
          preferredLanguage: data.preferredLanguage || 'english'
        });
      }
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: formData.username,
        dailyAyats: parseInt(formData.dailyAyats),
        learningMode: formData.learningMode,
        preferredLanguage: formData.preferredLanguage,
        lastUpdated: new Date().toISOString()
      });

      setSuccess('Profile updated successfully!');
      await loadUserData(user.uid); // Reload data
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetAccount = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }
    
    if (!resetConfirm) {
      setResetConfirm(true);
      setSuccess('Click "Reset Account" again to confirm');
      setTimeout(() => setResetConfirm(false), 5000);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      console.log('Resetting account for user:', user.uid);

      // Reset user progress to initial state
      const resetData = {
        currentStreak: 0,
        totalVersesCompleted: 0,
        currentSurah: 1,
        currentVerse: 1,
        lastCompletedDate: null,
        longestStreak: 0,
        // Keep user preferences
        username: userData?.username || '',
        email: userData?.email || user.email,
        dailyAyats: userData?.dailyAyats || 3,
        learningMode: userData?.learningMode || 'read',
        preferredLanguage: userData?.preferredLanguage || 'english',
        timezone: userData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: userData?.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      console.log('Reset data:', resetData);

      await setDoc(doc(db, "users", user.uid), resetData);
      
      setSuccess('Account reset successfully! All progress has been cleared.');
      await loadUserData(user.uid);
      setResetConfirm(false);
    } catch (err) {
      setError('Failed to reset account: ' + err.message);
      console.error('Error resetting account:', err);
      setResetConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error-message">
          Please log in to view your profile
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="back-nav-button"
        title="Back to Dashboard"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="profile-layout">
        {/* Main Content - Statistics */}
        <div className="main-content">
          <div className="profile-header">
            <h1>Your Progress</h1>
            <p>Track your Quran learning journey</p>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          {/* Statistics Content */}
          <div className="stats-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-content">
                  <h3>Current Streak</h3>
                  <p className="stat-value">{userData?.currentStreak || 0} days</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <h3>Longest Streak</h3>
                  <p className="stat-value">{userData?.longestStreak || 0} days</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📖</div>
                <div className="stat-content">
                  <h3>Total Verses Completed</h3>
                  <p className="stat-value">{userData?.totalVersesCompleted || 0}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Daily Goal</h3>
                  <p className="stat-value">
                    {userData?.dailyAyats || 3} ayats per day
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🧠</div>
                <div className="stat-content">
                  <h3>Learning Mode</h3>
                  <p className="stat-value">
                    {userData?.learningMode === 'memorize' ? 'Memorization' : 'Reading'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>Last Activity</h3>
                  <p className="stat-value">
                    {userData?.lastCompletedDate ? new Date(userData.lastCompletedDate).toLocaleDateString() : 'No activity yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Account Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Username</label>
                  <p>{userData?.username || 'Not set'}</p>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <p>{userData?.email || user.email}</p>
                </div>
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Timezone</label>
                  <p>{userData?.timezone || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Profile Settings */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Profile Settings</h2>
            <p>Customize your learning experience</p>
          </div>

          <div className="form-section">
            <h3>Account Information</h3>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="form-input"
                />
                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  value={userData?.email || user.email}
                  disabled
                  className="form-input disabled"
                />
                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <small className="form-help">Email cannot be changed</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Learning Goals</h3>
            
            <div className="form-group">
              <label htmlFor="dailyAyats">Daily Ayats</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  id="dailyAyats"
                  name="dailyAyats"
                  value={formData.dailyAyats}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="form-input"
                />
                <span className="goal-unit">ayats per day</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="learningMode">Learning Mode</label>
              <div className="radio-group">
                <label className="radio-container">
                  <input
                    type="radio"
                    name="learningMode"
                    value="read"
                    checked={formData.learningMode === 'read'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-checkmark"></span>
                  Read & Understand
                </label>
                <label className="radio-container">
                  <input
                    type="radio"
                    name="learningMode"
                    value="memorize"
                    checked={formData.learningMode === 'memorize'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-checkmark"></span>
                  Memorize
                </label>
              </div>
              <small className="form-help">
                {formData.learningMode === 'memorize' 
                  ? 'You\'ll need to complete each verse 3 times before marking as complete'
                  : 'You can mark verses as complete after reading them once'
                }
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>Preferences</h3>
            
            <div className="form-group">
              <label htmlFor="preferredLanguage">Preferred Language</label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
                <option value="urdu">Urdu</option>
                <option value="indonesian">Indonesian</option>
                <option value="malay">Malay</option>
              </select>
            </div>

            <div className="form-group">
              <label>Audio Settings</label>
              <button
                onClick={() => setShowAudioSettings(true)}
                className="audio-settings-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                Configure Audio Settings
              </button>
              <small className="form-help">
                Choose your preferred Quran reciter for audio playback
              </small>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`save-button ${saving ? 'loading' : ''}`}
          >
            {saving ? (
              <div className="spinner"></div>
            ) : (
              'Save Changes'
            )}
          </button>

          {/* Testing Section */}
          <div className="form-section testing-section">
            <h3>🧪 Testing Tools</h3>
            <p className="testing-description">
              Reset your progress for testing purposes
            </p>
            <button
              onClick={handleResetAccount}
              disabled={saving}
              className={`reset-button ${resetConfirm ? 'confirm' : ''} ${saving ? 'loading' : ''}`}
            >
              {saving ? (
                <div className="spinner"></div>
              ) : resetConfirm ? (
                '⚠️ Click Again to Confirm Reset'
              ) : (
                '🔄 Reset Account Progress'
              )}
            </button>
            <small className="testing-help">
              This will reset all progress but keep your preferences. 
              You can also use Ctrl+Shift+R keyboard shortcut.
            </small>
          </div>
        </div>
      </div>

      {showAudioSettings && (
        <AudioSettings onClose={() => setShowAudioSettings(false)} />
      )}
    </div>
  );
};

export default UserProfile;
