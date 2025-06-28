import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
      
      // Get user's progress and goals from Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProgress(userData);
        setUserGoals(userData);
        
        // Check if user already completed today's lesson
        const today = new Date().toDateString();
        const lastCompletedDate = userData.lastCompletedDate ? new Date(userData.lastCompletedDate).toDateString() : null;
        setAlreadyCompletedToday(today === lastCompletedDate);
        
        // Fetch daily lesson based on user's goals
        await fetchDailyLesson(userData);
      } else {
        // Default values for new users
        setUserProgress({
          currentSurah: 1,
          currentVerse: 1,
          currentStreak: 0,
          totalVersesCompleted: 0
        });
        setUserGoals({
          dailyGoal: 3, // Default: 3 ayats
          goalType: 'ayats' // Default: ayats
        });
        await fetchDailyLesson({
          currentSurah: 1,
          currentVerse: 1,
          dailyGoal: 3,
          goalType: 'ayats'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyLesson = async (userData) => {
    try {
      const { currentSurah, currentVerse, dailyGoal, goalType } = userData;
      const verses = [];
      
      if (goalType === 'pages') {
        // For pages, fetch approximately 15 verses (typical page length)
        const versesPerPage = 15;
        for (let i = 0; i < versesPerPage; i++) {
          const verseNumber = currentVerse + i;
          try {
            const response = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${verseNumber}.json`);
            const data = await response.json();
            verses.push(data);
          } catch (error) {
            // If verse doesn't exist, move to next surah
            break;
          }
        }
      } else {
        // For ayats, fetch the specified number of verses
        for (let i = 0; i < dailyGoal; i++) {
          const verseNumber = currentVerse + i;
          try {
            const response = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${verseNumber}.json`);
            const data = await response.json();
            verses.push(data);
          } catch (error) {
            // If verse doesn't exist, move to next surah
            break;
          }
        }
      }
      
      setCurrentVerses(verses);
    } catch (error) {
      console.error('Error fetching daily lesson:', error);
      // Fallback verse data
      setCurrentVerses([{
        surahNo: 1,
        ayahNo: 1,
        arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      }]);
    }
  };

  const handleComplete = async () => {
    if (!user || !currentVerses.length || alreadyCompletedToday) return;

    try {
      setCompleting(true);
      
      const userDocRef = doc(db, "users", user.uid);
      const lastVerse = currentVerses[currentVerses.length - 1];
      
      // Calculate next position
      const nextVerse = lastVerse.ayahNo + 1;
      const nextSurah = lastVerse.surahNo;
      
      // Update user progress
      await updateDoc(userDocRef, {
        currentStreak: increment(1),
        lastCompletedDate: new Date().toISOString(),
        totalVersesCompleted: increment(currentVerses.length),
        currentVerse: nextVerse,
        currentSurah: nextSurah
      });

      // Update local state
      setAlreadyCompletedToday(true);
      setUserProgress(prev => ({
        ...prev,
        currentStreak: (prev?.currentStreak || 0) + 1,
        lastCompletedDate: new Date().toISOString(),
        totalVersesCompleted: (prev?.totalVersesCompleted || 0) + currentVerses.length,
        currentVerse: nextVerse,
        currentSurah: nextSurah
      }));

      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-lesson-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your daily lesson...</p>
        </div>
      </div>
    );
  }

  const goalText = userGoals?.goalType === 'pages' ? 'page' : `${userGoals?.dailyGoal || 3} ayats`;

  return (
    <div className="daily-lesson-container">
      <div className="lesson-header">
        <h1>Daily Lesson</h1>
        <p>Today's Goal: {goalText}</p>
        {alreadyCompletedToday && (
          <div className="completion-notice">
            <p>✅ You've already completed today's lesson!</p>
          </div>
        )}
      </div>

      <div className="verses-container">
        {currentVerses.map((verse, index) => (
          <div key={`${verse.surahNo}-${verse.ayahNo}`} className="verse-container">
            <div className="verse-header">
              <h3>Surah {verse.surahNo}, Verse {verse.ayahNo}</h3>
              {userGoals?.goalType === 'ayats' && (
                <span className="verse-number">({index + 1} of {userGoals?.dailyGoal})</span>
              )}
            </div>
            
            <div className="arabic-verse">
              <h2>{verse.arabic1}</h2>
            </div>
            
            <div className="translation-container">
              <div className="translation-section">
                <h3>English Translation</h3>
                <p>{verse.english}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lesson-actions">
        <button 
          onClick={handleComplete}
          disabled={completing || alreadyCompletedToday}
          className={`complete-button ${completing ? 'loading' : ''} ${alreadyCompletedToday ? 'completed' : ''}`}
        >
          {completing ? (
            <div className="spinner"></div>
          ) : alreadyCompletedToday ? (
            'Already Completed Today'
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
    </div>
  );
};

export default DailyLesson; 