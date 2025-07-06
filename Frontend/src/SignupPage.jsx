import React, { useState } from 'react';
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from 'react-router-dom';
import './SignupPage.css';
import { MdPersonOutline, MdEmail, MdLockOutline, MdVisibility, MdVisibilityOff } from 'react-icons/md';

const SignupPage = () => {
  const navigate = useNavigate();
  const MAX_AYATS = 6236;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    dailyAyats: '3', // Default: 3 ayats
    preferredLanguage: 'english',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const dailyAyatsNum = parseInt(formData.dailyAyats, 10);
    if (isNaN(dailyAyatsNum) || dailyAyatsNum < 1 || dailyAyatsNum > MAX_AYATS) {
      setError(`Daily ayats must be between 1 and ${MAX_AYATS}`);
      setLoading(false);
      return;
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: formData.email,
        username: formData.username,
        dailyAyats: dailyAyatsNum,
        preferredLanguage: formData.preferredLanguage,
        timezone: formData.timezone,
        createdAt: new Date().toISOString(),
        // Initialize progress tracking for reading mode
        currentStreak: 0,
        totalVersesCompleted: 0,
        currentSurah: 1,
        currentVerse: 1,
        lastCompletedDate: null,
        // Initialize progress tracking for memorization mode
        memorizationCurrentSurah: 1,
        memorizationCurrentVerse: 1,
        totalVersesMemorized: 0,
        memorizationLastCompletedDate: null
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      console.log("Signup successful!", user);
      localStorage.setItem('quranQuestMode', 'read');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Join Our Community</h1>
          <p>Start your journey of daily Quran learning</p>
        </div>

        <form onSubmit={handleSignup} className="signup-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Account Information */}
          <div className="form-section">
            <h3>Account Information</h3>
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <MdPersonOutline size={20} />
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <MdEmail size={20} />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon-left">
                  <MdLockOutline size={20} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <MdLockOutline size={20} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Learning Goals */}
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
                  max={MAX_AYATS}
                  className="form-input"
                  required
                />
                <span className="goal-unit">
                  ayats per day
                </span>
              </div>
            </div>
          </div>

          {/* Preferences */}
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
            type="submit"
            disabled={loading}
            className={`signup-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
 