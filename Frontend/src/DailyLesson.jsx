import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { useNavigate, useLocation } from 'react-router-dom';
import ShareButton from './ShareButton';
import AudioPlayer from './AudioPlayer';
import './DailyLesson.css';
import AudioSettings from './AudioSettings';

const MAX_AYATS = 6236;

const DailyLesson = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentMode = location.state?.mode || localStorage.getItem('quranQuestMode') || 'read';
  
  const [currentVerses, setCurrentVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [versesLoading, setVersesLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [memorizationProgress, setMemorizationProgress] = useState({});
  const [error, setError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  const [showStreakResetNotification, setShowStreakResetNotification] = useState(false);
  const [streakResetMessage, setStreakResetMessage] = useState('');
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const celebrationModalRef = useRef(null);

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

  // Update completion status when mode or user progress changes
  useEffect(() => {
    if (userProgress) {
      const modeCompletedToday = checkIfModeCompletedToday(userProgress);
      setAlreadyCompletedToday(modeCompletedToday);
    }
  }, [currentMode, userProgress]);

  useEffect(() => {
    if (showCelebration) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showCelebration]);

  // Function to check and reset streak based on missed days
  const checkAndResetStreak = (userData) => {
    if (!userData?.lastCompletedDate) return userData;

    const lastCompleted = new Date(userData.lastCompletedDate);
    const today = new Date();
    const daysSinceLastCompletion = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

    // If completed today, no change needed
    if (daysSinceLastCompletion === 0) return userData;

    // If missed more than 1 day
    if (daysSinceLastCompletion > 1) {
      // Reset streak to 0
      return {
        ...userData,
        currentStreak: 0
      };
    }

    // If missed exactly 1 day
    if (daysSinceLastCompletion === 1) {
      // Check if user has 14+ day streak for 1-day pass
      if (userData.currentStreak >= 14) {
        // Keep the streak as is (1-day pass)
        return userData;
      } else {
        // Reset streak to 0
        return {
          ...userData,
          currentStreak: 0
        };
      }
    }

    return userData;
  };

  // Helper function for testing streak scenarios (remove in production)
  const simulateStreakScenario = (daysAgo, currentStreak) => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() - daysAgo);
    
    return {
      currentStreak: currentStreak,
      lastCompletedDate: testDate.toISOString(),
      dailyAyats: 3,
      learningMode: 'read'
    };
  };

  const checkIfModeCompletedToday = (userData) => {
    if (!userData) return false;
    
    const today = new Date().toDateString();
    
    if (currentMode === 'read' && userData.lastCompletedDate) {
      const lastCompleted = new Date(userData.lastCompletedDate);
      return lastCompleted.toDateString() === today;
    } else if (currentMode === 'memorize' && userData.memorizationLastCompletedDate) {
      const lastCompleted = new Date(userData.memorizationLastCompletedDate);
      return lastCompleted.toDateString() === today;
    }
    
    return false;
  };

  const fetchUserData = async (currentUser) => {
    try {
      setLoading(true);
      setUser(currentUser);
      console.log('Fetching user data for:', currentUser.uid);
      
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      
      if (userDoc.exists()) {
        let userData = userDoc.data();
        console.log('Raw user data from Firestore:', userData);
        
        const originalStreak = userData.currentStreak;
        
        // Check and potentially reset streak
        userData = checkAndResetStreak(userData);
        
        // If streak was reset, update the database and show notification
        if (userData.currentStreak === 0 && originalStreak > 0) {
          await updateDoc(doc(db, "users", currentUser.uid), {
            currentStreak: 0
          });
          
          // Show streak reset notification
          setStreakResetMessage(`Your ${originalStreak}-day streak has been reset to 0 due to missed days. Keep going to build a new streak!`);
          setShowStreakResetNotification(true);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => {
            setShowStreakResetNotification(false);
          }, 5000);
        }
        
        console.log('Processed user data:', userData);
        setUserProgress(userData);
        
        // Set user goals based on current mode, not stored learning mode
        const goals = {
          dailyAyats: userData.dailyAyats || 3,
          learningMode: currentMode // Use current mode instead of stored learning mode
        };
        console.log('Setting user goals:', goals);
        setUserGoals(goals);
        
        // Check if user already completed today's lesson for this specific mode
        const modeCompletedToday = checkIfModeCompletedToday(userData);
        setAlreadyCompletedToday(modeCompletedToday);
        
        // Fetch daily lesson after user data is loaded
        console.log('Calling fetchDailyLesson with userData:', userData);
        await fetchDailyLesson(userData);
      } else {
        console.error('User document not found');
        // Create default user data for new users
        const defaultUserData = {
          currentSurah: 1,
          currentVerse: 1,
          memorizationCurrentSurah: 1,
          memorizationCurrentVerse: 1,
          dailyAyats: 3,
          currentStreak: 0,
          totalVersesCompleted: 0,
          totalVersesMemorized: 0
        };
        console.log('Creating default user data:', defaultUserData);
        setUserProgress(defaultUserData);
        setUserGoals({
          dailyAyats: 3,
          learningMode: currentMode
        });
        setAlreadyCompletedToday(false);
        await fetchDailyLesson(defaultUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const getModeTheme = () => {
    return currentMode === 'read' ? 'read-theme' : 'memorize-theme';
  };

  const getModeTitle = () => {
    return currentMode === 'read' ? 'Daily Reading Lesson' : 'Daily Memorization Lesson';
  };

  const getModeDescription = () => {
    return currentMode === 'read' 
      ? 'Read and understand today\'s verses' 
      : 'Memorize today\'s verses through repetition';
  };

  const getModeIcon = () => {
    return currentMode === 'read' ? '📖' : '🧠';
  };

  const fetchDailyLesson = async (userData) => {
    try {
      setVersesLoading(true);
      console.log('Fetching daily lesson for mode:', currentMode);
      
      // Use different progress tracking based on mode
      let currentSurah, currentVerse;
      
      if (currentMode === 'read') {
        currentSurah = userData.currentSurah || 1;
        currentVerse = userData.currentVerse || 1;
      } else {
        // Memorization mode uses separate tracking
        currentSurah = userData.memorizationCurrentSurah || 1;
        currentVerse = userData.memorizationCurrentVerse || 1;
      }
      
      const dailyAyats = currentMode === 'memorize'
        ? userData.dailyMemorizationAyats || 3
        : userData.dailyAyats || 3;
      
      console.log(`Fetching ${dailyAyats} verses starting from Surah ${currentSurah}, Verse ${currentVerse}`);
      
      // Generate all the verse URLs we need to fetch
      const verseUrls = [];
      let currentSurahForFetching = currentSurah;
      let currentVerseForFetching = currentVerse;
      
      for (let i = 0; i < dailyAyats; i++) {
        const apiUrl = `https://quranapi.pages.dev/api/${currentSurahForFetching}/${currentVerseForFetching}.json`;
        verseUrls.push({
          url: apiUrl,
          surahNo: currentSurahForFetching,
          ayahNo: currentVerseForFetching
        });
        
        // Move to next verse
        currentVerseForFetching++;
      }
      
      // Fetch all verses in parallel for better performance
      console.log('Fetching verses in parallel:', verseUrls.map(v => `${v.surahNo}:${v.ayahNo}`));
      
      const fetchPromises = verseUrls.map(async (verseInfo) => {
        try {
          const response = await fetch(verseInfo.url);
          if (response.ok) {
            const verseData = await response.json();
            return {
              ...verseData,
              surahNo: verseInfo.surahNo,
              ayahNo: verseInfo.ayahNo
            };
          } else {
            // If verse doesn't exist, try next surah
            const nextSurah = verseInfo.surahNo + 1;
            const nextVerseResponse = await fetch(`https://quranapi.pages.dev/api/${nextSurah}/1.json`);
            
            if (nextVerseResponse.ok) {
              const nextVerseData = await nextVerseResponse.json();
              return {
                ...nextVerseData,
                surahNo: nextSurah,
                ayahNo: 1
              };
            } else {
              console.log(`Verse ${verseInfo.surahNo}:${verseInfo.ayahNo} and fallback not found`);
              return null;
            }
          }
        } catch (error) {
          console.error(`Error fetching verse ${verseInfo.surahNo}:${verseInfo.ayahNo}:`, error);
          return null;
        }
      });
      
      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);
      
      // Filter out null results and create the final verses array
      const verses = results.filter(verse => verse !== null);
      
      console.log('Final verses array:', verses);
      
      if (verses.length === 0) {
        console.log('No verses fetched, using fallback data');
        setCurrentVerses([{
          surahNo: 1,
          ayahNo: 1,
          arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
        }]);
      } else {
        setCurrentVerses(verses);
      }
      
      // Initialize memorization progress for each verse if in memorization mode
      if (currentMode === 'memorize') {
        const initialProgress = {};
        verses.forEach((verse) => {
          const verseKey = `${verse.surahNo}-${verse.ayahNo}`;
          initialProgress[verseKey] = 0;
        });
        setMemorizationProgress(initialProgress);
      }
      
    } catch (error) {
      console.error('Error fetching daily lesson:', error);
      setError('Failed to load today\'s lesson');
      
      // Fallback verse data
      setCurrentVerses([{
        surahNo: 1,
        ayahNo: 1,
        arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      }]);
    } finally {
      setVersesLoading(false);
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
    if (currentMode !== 'memorize') return true;
    
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

  const handleComplete = async (event) => {
    if (!user || !currentVerses.length || !canMarkComplete()) return;

    // Capture button position
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + scrollTop
      });
    }

    try {
      setCompleting(true);
      console.log('Starting completion process for mode:', currentMode);
      
      const userDocRef = doc(db, "users", user.uid);
      
      // Check if this specific mode was already completed today
      const today = new Date().toDateString();
      let lastCompletedDate;
      
      if (currentMode === 'read') {
        lastCompletedDate = userProgress?.lastCompletedDate ? new Date(userProgress.lastCompletedDate).toDateString() : null;
      } else {
        lastCompletedDate = userProgress?.memorizationLastCompletedDate ? new Date(userProgress.memorizationLastCompletedDate).toDateString() : null;
      }
      
      const alreadyCompletedThisModeToday = today === lastCompletedDate;
      console.log('Already completed this mode today:', alreadyCompletedThisModeToday);
      console.log('Today:', today);
      console.log('Last completed date:', lastCompletedDate);
      
      // Prevent completion if this mode was already completed today
      if (alreadyCompletedThisModeToday) {
        console.log(`${currentMode} mode already completed today`);
        setError(`${currentMode} lesson already completed today. Come back tomorrow for a new lesson!`);
        setCompleting(false);
        return;
      }
      
      // Calculate new streak and totals
      let newStreak = userProgress?.currentStreak || 0;
      let newTotalVerses = userProgress?.totalVersesCompleted || 0;
      let newTotalMemorized = userProgress?.totalVersesMemorized || 0;
      
      console.log('Current streak before update:', newStreak);
      
      // Check if ANY mode was completed today (for streak calculation)
      const anyModeCompletedToday = (userProgress?.lastCompletedDate && new Date(userProgress.lastCompletedDate).toDateString() === today) ||
                                   (userProgress?.memorizationLastCompletedDate && new Date(userProgress.memorizationLastCompletedDate).toDateString() === today);
      
      console.log('Any mode completed today:', anyModeCompletedToday);
      
      // Only update streak if no mode was completed today
      if (!anyModeCompletedToday) {
        newStreak += 1;
        console.log('Streak incremented to:', newStreak);
      } else {
        console.log('Streak not incremented - another mode was completed today');
      }
      
      // Update appropriate totals based on mode
      if (currentMode === 'read') {
        newTotalVerses += currentVerses.length;
        console.log('Updated total verses:', newTotalVerses);
      } else {
        newTotalMemorized += currentVerses.length;
        console.log('Updated total memorized:', newTotalMemorized);
      }
      
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
      
      // Update user progress based on mode
      const updateData = {};
      
      if (currentMode === 'read') {
        updateData.totalVersesCompleted = increment(currentVerses.length);
        updateData.currentSurah = nextSurah;
        updateData.currentVerse = nextVerse;
        if (!anyModeCompletedToday) {
          updateData.currentStreak = increment(1);
          updateData.lastCompletedDate = new Date().toISOString();
          updateData.longestStreak = Math.max(newStreak, userProgress?.longestStreak || 0);
        } else {
          // Still update the completion date even if streak wasn't incremented
          updateData.lastCompletedDate = new Date().toISOString();
        }
      } else {
        updateData.totalVersesMemorized = increment(currentVerses.length);
        updateData.memorizationCurrentSurah = nextSurah;
        updateData.memorizationCurrentVerse = nextVerse;
        if (!anyModeCompletedToday) {
          updateData.currentStreak = increment(1);
          updateData.memorizationLastCompletedDate = new Date().toISOString();
          updateData.longestStreak = Math.max(newStreak, userProgress?.longestStreak || 0);
        } else {
          // Still update the completion date even if streak wasn't incremented
          updateData.memorizationLastCompletedDate = new Date().toISOString();
        }
      }
      
      console.log('Update data to be sent:', updateData);
      
      await updateDoc(userDocRef, updateData);
      console.log('Database update completed successfully');

      // Update local state
      setAlreadyCompletedToday(true);
      setUserProgress(prev => ({
        ...prev,
        currentStreak: newStreak,
        totalVersesCompleted: newTotalVerses,
        totalVersesMemorized: newTotalMemorized,
        longestStreak: Math.max(newStreak, prev?.longestStreak || 0),
        ...(currentMode === 'read' ? {
          lastCompletedDate: new Date().toISOString(),
          currentSurah: nextSurah,
          currentVerse: nextVerse
        } : {
          memorizationLastCompletedDate: new Date().toISOString(),
          memorizationCurrentSurah: nextSurah,
          memorizationCurrentVerse: nextVerse
        })
      }));

      // Clear any previous errors
      setError('');

      // Prepare celebration data
      const achievement = getAchievementBadge(newStreak);
      const message = getMotivationalMessage(newStreak);
      
      const celebrationDataObj = {
        streak: newStreak,
        versesCompleted: currentVerses.length,
        achievement,
        message,
        totalVerses: currentMode === 'read' ? newTotalVerses : newTotalMemorized,
        modeCompleted: currentMode
      };
      
      console.log('Celebration data prepared:', celebrationDataObj);
      setCelebrationData(celebrationDataObj);

      // Show celebration modal
      console.log('Setting showCelebration to true');
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
    <div className={`daily-lesson-container ${getModeTheme()}`}>
      {/* Streak Reset Notification */}
      {showStreakResetNotification && (
        <div className="streak-reset-notification">
          <div className="notification-content">
            <span className="notification-icon">⚠️</span>
            <p>{streakResetMessage}</p>
            <button 
              className="notification-close"
              onClick={() => setShowStreakResetNotification(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

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
        <div className="mode-indicator">
          <span className="mode-icon">{getModeIcon()}</span>
          <h1>{getModeTitle()}</h1>
        </div>
        <p>{getModeDescription()}</p>
        {currentMode === 'memorize' && (
          <p className="learning-mode-notice">🧠 Memorization Mode - Complete each verse 3 times</p>
        )}
        {alreadyCompletedToday && (
          <div className="completion-notice">
            <p>✅ You've already completed today's {currentMode} lesson! Preview the next lesson:</p>
          </div>
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      <div className="verses-container">
        {versesLoading ? (
          <div className="loading-verses">
            {[...Array(userGoals?.dailyAyats || 3)].map((_, index) => (
              <div key={index} className="verse-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-number"></div>
                </div>
                <div className="skeleton-arabic"></div>
                <div className="skeleton-translation"></div>
                <div className="skeleton-audio"></div>
                <div className="skeleton-actions"></div>
              </div>
            ))}
          </div>
        ) : currentVerses.length === 0 ? (
          <div className="no-verses">
            <p>No verses available. Please try refreshing the page.</p>
          </div>
        ) : (
          currentVerses.map((verse, index) => {
            const verseKey = `${verse.surahNo}-${verse.ayahNo}`;
            const memorizationCount = memorizationProgress[verseKey] || 0;
            const isMemorized = currentMode === 'memorize' ? memorizationCount >= 3 : true;
            
            return (
              <div 
                key={verseKey} 
                className={`verse-container ${isMemorized ? 'memorized' : ''}`}
              >
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

                {currentMode === 'memorize' && (
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
          })
        )}
      </div>

      <div className="lesson-actions">
        <button 
          onClick={handleComplete}
          disabled={completing || alreadyCompletedToday || !canMarkComplete() || versesLoading}
          className={`complete-button ${completing ? 'loading' : ''} ${alreadyCompletedToday ? 'completed' : ''} ${!canMarkComplete() ? 'disabled' : ''} ${versesLoading ? 'disabled' : ''}`}
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
          ) : versesLoading ? (
            'Loading...'
          ) : alreadyCompletedToday ? (
            'Already Completed Today'
          ) : !canMarkComplete() ? (
            currentMode === 'memorize' ? 'Complete All Verses First' : 'Mark as Complete'
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
          <div 
            className="celebration-modal"
            ref={celebrationModalRef}
            style={{
              position: 'fixed',
              top: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1001
            }}
          >
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