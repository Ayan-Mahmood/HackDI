import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import ShareButton from './ShareButton';
import AudioPlayer from './AudioPlayer';
import './DailyLesson.css';

const DailyLesson = () => {
  const navigate = useNavigate();
  const [currentVerses, setCurrentVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [memorizationProgress, setMemorizationProgress] = useState({});
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchUserData(currentUser);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (currentUser) => {
    try {
      setLoading(true);
      setError('');
      
      // Set the user state
      setUser(currentUser);
      
      // Get user's progress and goals from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        setUserProgress(userData);
        setUserGoals(userData);
        
        // Check if user already completed today's lesson
        const today = new Date().toDateString();
        const lastCompletedDate = userData.lastCompletedDate ? new Date(userData.lastCompletedDate).toDateString() : null;
        setAlreadyCompletedToday(today === lastCompletedDate);
        
        console.log('Date comparison:', {
          today,
          lastCompletedDate,
          alreadyCompletedToday: today === lastCompletedDate
        });
        
        // Fetch daily lesson based on user's goals
        await fetchDailyLesson(userData);
      } else {
        // Default values for new users
        const defaultData = {
          currentSurah: 1,
          currentVerse: 1,
          currentStreak: 0,
          totalVersesCompleted: 0,
          dailyAyats: 3,
          learningMode: 'read'
        };
        console.log('New user, using default data:', defaultData);
        setUserProgress(defaultData);
        setUserGoals(defaultData);
        await fetchDailyLesson(defaultData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLesson = async (userData) => {
    try {
      const verses = [];
      let currentSurah = userData.currentSurah || 1;
      let currentVerse = userData.currentVerse || 1;
      const dailyAyats = userData.dailyAyats || 3;
      
      // Check if this is a new day (user hasn't completed today's lesson yet)
      const today = new Date().toDateString();
      const lastCompletedDate = userData.lastCompletedDate ? new Date(userData.lastCompletedDate).toDateString() : null;
      const isNewDay = today !== lastCompletedDate;
      
      console.log('Debug info:', {
        today,
        lastCompletedDate,
        isNewDay,
        currentSurah,
        currentVerse,
        dailyAyats
      });
      
      // If it's a new day and user has completed lessons before, advance to next position
      if (isNewDay && userData.lastCompletedDate) {
        // Calculate next position based on last completed lesson
        const lastCompletedSurah = userData.currentSurah || 1;
        const lastCompletedVerse = userData.currentVerse || 1;
        
        // Start from the next verse after the last completed one
        currentSurah = lastCompletedSurah;
        currentVerse = lastCompletedVerse;
        
        // Try to fetch the next verse
        try {
          const testResponse = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${currentVerse}.json`);
          if (!testResponse.ok) {
            // Next verse doesn't exist, move to next surah
            currentSurah++;
            currentVerse = 1;
          }
        } catch (error) {
          // Error means verse doesn't exist, move to next surah
          currentSurah++;
          currentVerse = 1;
        }
        
        console.log(`New day detected. Starting from: Surah ${currentSurah}, Verse ${currentVerse}`);
      } else {
        // Same day or new user - use the stored position
        console.log(`Same day or new user. Using stored position: Surah ${currentSurah}, Verse ${currentVerse}`);
      }
      
      // Fetch verses based on user's daily goal
      for (let i = 0; i < dailyAyats; i++) {
        try {
          const response = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${currentVerse}.json`);
          
          if (response.ok) {
            const data = await response.json();
            verses.push({
              surahNo: currentSurah,
              ayahNo: currentVerse,
              arabic1: data.arabic1 || data.arabic || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              english: data.english || "In the name of Allah, the Entirely Merciful, the Especially Merciful."
            });
            currentVerse++;
          } else {
            // Move to next surah if verse doesn't exist
            currentSurah++;
            currentVerse = 1;
            const nextResponse = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${currentVerse}.json`);
            if (nextResponse.ok) {
              const data = await nextResponse.json();
              verses.push({
                surahNo: currentSurah,
                ayahNo: currentVerse,
                arabic1: data.arabic1 || data.arabic || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                english: data.english || "In the name of Allah, the Entirely Merciful, the Especially Merciful."
              });
              currentVerse++;
            }
          }
        } catch (error) {
          console.error(`Error fetching verse ${currentSurah}:${currentVerse}:`, error);
          // Add fallback verse
          verses.push({
            surahNo: currentSurah,
            ayahNo: currentVerse,
            arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
          });
          currentVerse++;
        }
      }
      
      if (verses.length === 0) {
        setError('No verses found. Please check your progress settings.');
        return;
      }
      
      setCurrentVerses(verses);
      
      // Initialize memorization progress for each verse
      const initialProgress = {};
      verses.forEach((verse) => {
        const verseKey = `${verse.surahNo}-${verse.ayahNo}`;
        initialProgress[verseKey] = 0;
      });
      setMemorizationProgress(initialProgress);
      
    } catch (error) {
      console.error('Error fetching daily lesson:', error);
      setError('Failed to load today\'s lesson. Please try again.');
      
      // Fallback verse data
      setCurrentVerses([{
        surahNo: 1,
        ayahNo: 1,
        arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      }]);
    }
  };

  const handleMemorizationClick = (verseKey) => {
    if (userGoals?.learningMode !== 'memorize') return;
    
    setMemorizationProgress(prev => ({
      ...prev,
      [verseKey]: Math.min(prev[verseKey] + 1, 3)
    }));
  };

  const canMarkComplete = () => {
    if (userGoals?.learningMode !== 'memorize') return true;
    
    // Check if all verses have been clicked 3 times
    return Object.values(memorizationProgress).every(count => count >= 3);
  };

  const getMotivationalMessage = (streak) => {
    if (streak === 1) return "Amazing start! Your journey begins today! 🌟";
    if (streak <= 3) return "You're building a beautiful habit! Keep going! 💪";
    if (streak <= 7) return "A week of consistency! You're unstoppable! 🔥";
    if (streak <= 30) return "A month of dedication! You're inspiring! 🌙";
    if (streak <= 100) return "100 days! You're a true seeker of knowledge! 📚";
    return "You're a Quran learning champion! Mashallah! 🏆";
  };

  const getAchievementBadge = (streak) => {
    if (streak === 1) return "🥇 First Step";
    if (streak === 7) return "🔥 Week Warrior";
    if (streak === 30) return "🌙 Monthly Master";
    if (streak === 100) return "📚 Century Scholar";
    if (streak === 365) return "🏆 Year Champion";
    return null;
  };

  const handleComplete = async () => {
    if (!user || !currentVerses.length || alreadyCompletedToday || !canMarkComplete()) return;

    try {
      setCompleting(true);
      
      const userDocRef = doc(db, "users", user.uid);
      
      // Calculate new streak and total verses
      const newStreak = (userProgress?.currentStreak || 0) + 1;
      const newTotalVerses = (userProgress?.totalVersesCompleted || 0) + currentVerses.length;
      
      // Calculate next position for the next lesson
      const lastVerse = currentVerses[currentVerses.length - 1];
      let nextVerse = lastVerse.ayahNo + 1;
      let nextSurah = lastVerse.surahNo;
      
      // Check if we need to move to next surah
      try {
        const testResponse = await fetch(`https://quranapi.pages.dev/api/${nextSurah}/${nextVerse}.json`);
        if (!testResponse.ok) {
          // Next verse doesn't exist, move to next surah
          nextSurah++;
          nextVerse = 1;
        }
      } catch (error) {
        // Error means verse doesn't exist, move to next surah
        nextSurah++;
        nextVerse = 1;
      }
      
      console.log(`Updating position after completion: Surah ${nextSurah}, Verse ${nextVerse}`);
      
      // Update user progress including the new position
      await updateDoc(userDocRef, {
        currentStreak: increment(1),
        lastCompletedDate: new Date().toISOString(),
        totalVersesCompleted: increment(currentVerses.length),
        longestStreak: Math.max(newStreak, userProgress?.longestStreak || 0),
        currentSurah: nextSurah,
        currentVerse: nextVerse
      });

      // Update local state
      setAlreadyCompletedToday(true);
      setUserProgress(prev => ({
        ...prev,
        currentStreak: newStreak,
        lastCompletedDate: new Date().toISOString(),
        totalVersesCompleted: newTotalVerses,
        longestStreak: Math.max(newStreak, prev?.longestStreak || 0),
        currentSurah: nextSurah,
        currentVerse: nextVerse
      }));

      // Prepare celebration data
      const achievement = getAchievementBadge(newStreak);
      const message = getMotivationalMessage(newStreak);
      
      setCelebrationData({
        streak: newStreak,
        versesCompleted: currentVerses.length,
        achievement,
        message,
        totalVerses: newTotalVerses
      });

      // Show celebration modal
      setShowCelebration(true);
      
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    navigate('/dashboard');
  };

  // Prepare ayah data for sharing
  const getAyahDataForSharing = (verse) => {
    if (!verse) return null;
    
    return {
      surahNumber: verse.surahNo,
      surahName: `Surah ${verse.surahNo}`,
      verseNumber: verse.ayahNo,
      arabicText: verse.arabic1,
      translation: verse.english,
      source: 'Quran Quest - Daily Lesson'
    };
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #39836e 0%, #24664a 100%)',
        color: 'white'
      }}>
        <p style={{ 
          fontSize: '1.2rem', 
          margin: '0 0 20px 0',
          color: 'white',
          animation: 'none',
          transform: 'none'
        }}>
          Loading database...
        </p>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const goalText = `${userGoals?.dailyAyats || 3} ayats per day`;

  return (
    <div className="daily-lesson-container">
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

      <div className="lesson-header">
        <h1>Daily Lesson</h1>
        <p>Today's Goal: {goalText}</p>
        {userGoals?.learningMode === 'memorize' && (
          <p className="learning-mode-notice">🧠 Memorization Mode - Complete each verse 3 times</p>
        )}
        {alreadyCompletedToday && (
          <div className="completion-notice">
            <p>✅ You've already completed today's lesson! Preview the next lesson:</p>
          </div>
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      <div className="verses-container">
        {currentVerses.map((verse, index) => {
          const verseKey = `${verse.surahNo}-${verse.ayahNo}`;
          const memorizationCount = memorizationProgress[verseKey] || 0;
          const isMemorized = userGoals?.learningMode === 'memorize' ? memorizationCount >= 3 : true;
          
          return (
            <div key={verseKey} className={`verse-container ${isMemorized ? 'memorized' : ''}`}>
              <div className="verse-header">
                <h3>Surah {verse.surahNo}, Verse {verse.ayahNo}</h3>
                <span className="verse-number">({index + 1} of {userGoals?.dailyAyats})</span>
              </div>
              
              <div className="arabic-verse">
                <h2>{verse.arabic1}</h2>
              </div>
              
              <div className="translation-container">
                <div className="translation-section">
                  <p>{verse.english}</p>
                </div>
              </div>

              <AudioPlayer 
                surahNumber={verse.surahNo}
                verseNumber={verse.ayahNo}
                className="verse-audio"
              />

              <div className="verse-actions">
                <ShareButton 
                  ayahData={getAyahDataForSharing(verse)}
                  className="small"
                >
                  Share this Ayah
                </ShareButton>
              </div>

              {userGoals?.learningMode === 'memorize' && (
                <div className="memorization-section">
                  <div className="memorization-progress">
                    <span className="progress-text">
                      Memorization Progress: {memorizationCount}/3
                    </span>
                    <div className="progress-dots">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`progress-dot ${memorizationCount >= step ? 'completed' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMemorizationClick(verseKey)}
                    disabled={memorizationCount >= 3}
                    className={`memorization-button ${memorizationCount >= 3 ? 'completed' : ''}`}
                  >
                    {memorizationCount >= 3 ? '✓ Memorized' : 'Click when done'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="lesson-actions">
        <button 
          onClick={handleComplete}
          disabled={completing || alreadyCompletedToday || !canMarkComplete()}
          className={`complete-button ${completing ? 'loading' : ''} ${alreadyCompletedToday ? 'completed' : ''} ${!canMarkComplete() ? 'disabled' : ''}`}
        >
          {completing ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          ) : alreadyCompletedToday ? (
            'Already Completed Today'
          ) : !canMarkComplete() ? (
            userGoals?.learningMode === 'memorize' ? 'Complete All Verses First' : 'Mark as Complete'
          ) : (
            'Mark as Complete'
          )}
        </button>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="back-button"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Celebration Modal */}
      {showCelebration && celebrationData && (
        <div className="celebration-overlay">
          <div className="celebration-modal">
            {/* Confetti Animation */}
            <div className="confetti-container">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 3}s`
                  }}
                />
              ))}
            </div>

            {/* Main Content */}
            <div className="celebration-content">
              <div className="celebration-icon">🎉</div>
              
              <h1 className="celebration-title">Lesson Complete!</h1>
              
              <div className="streak-display">
                <div className="streak-number">{celebrationData.streak}</div>
                <div className="streak-label">Day Streak</div>
              </div>

              <p className="celebration-message">{celebrationData.message}</p>

              {celebrationData.achievement && (
                <div className="achievement-badge">
                  <span className="badge-icon">🏆</span>
                  <span className="badge-text">{celebrationData.achievement}</span>
                </div>
              )}

              <div className="stats-summary">
                <div className="stat-item">
                  <span className="stat-value">+{celebrationData.versesCompleted}</span>
                  <span className="stat-label">Verses Today</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{celebrationData.totalVerses}</span>
                  <span className="stat-label">Total Verses</span>
                </div>
              </div>

              <button 
                onClick={handleCelebrationClose}
                className="celebration-button"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLesson; 