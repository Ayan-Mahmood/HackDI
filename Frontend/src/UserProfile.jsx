import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import './UserProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    username: '',
    dailyGoal: '1',
    goalType: 'pages',
    preferredLanguage: 'english'
  });

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

  const loadUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          username: data.username || '',
          dailyGoal: data.dailyGoal?.toString() || '1',
          goalType: data.goalType || 'pages',
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
        dailyGoal: parseInt(formData.dailyGoal),
        goalType: formData.goalType,
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
      <div className="profile-card">
        <div className="profile-header">
          <h1>User Profile</h1>
          <p>Manage your account settings and learning goals</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
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

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
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
                <label htmlFor="goalType">Goal Type</label>
                <div className="radio-group">
                  <label className="radio-container">
                    <input
                      type="radio"
                      name="goalType"
                      value="pages"
                      checked={formData.goalType === 'pages'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-checkmark"></span>
                    Read Pages
                  </label>
                  <label className="radio-container">
                    <input
                      type="radio"
                      name="goalType"
                      value="ayats"
                      checked={formData.goalType === 'ayats'}
                      onChange={handleInputChange}
                    />
                    <span className="radio-checkmark"></span>
                    Read Ayats
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dailyGoal">Daily Goal</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="dailyGoal"
                    name="dailyGoal"
                    value={formData.dailyGoal}
                    onChange={handleInputChange}
                    min="1"
                    max={formData.goalType === 'pages' ? '10' : '50'}
                    className="form-input"
                  />
                  <span className="goal-unit">
                    {formData.goalType === 'pages' ? 'pages' : 'ayats'} per day
                  </span>
                </div>
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
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="tab-content">
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
                  <h3>Current Goal</h3>
                  <p className="stat-value">
                    {userData?.dailyGoal || 1} {userData?.goalType === 'pages' ? 'page' : 'ayats'} per day
                  </p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Account Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="info-item">
                  <label>Last Activity</label>
                  <p>{userData?.lastCompletedDate ? new Date(userData.lastCompletedDate).toLocaleDateString() : 'No activity yet'}</p>
                </div>
                <div className="info-item">
                  <label>Timezone</label>
                  <p>{userData?.timezone || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
