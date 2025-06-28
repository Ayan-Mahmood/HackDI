import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from 'react-router-dom';
import './QuranViewer.css';

const QuranViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentVerse, setCurrentVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [surahNumber, setSurahNumber] = useState(1);
  const [verseNumber, setVerseNumber] = useState(1);
  const [surahInfo, setSurahInfo] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get surah and verse from location state or URL params
        const params = new URLSearchParams(location.search);
        const surah = parseInt(params.get('surah')) || location.state?.surah || 1;
        const verse = parseInt(params.get('verse')) || location.state?.verse || 1;
        
        setSurahNumber(surah);
        setVerseNumber(verse);
        fetchSurahInfo(surah);
        fetchVerse(surah, verse);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  const fetchSurahInfo = async (surah) => {
    try {
      // Fetch surah information to get total verses
      const response = await fetch(`https://quranapi.pages.dev/api/${surah}.json`);
      const data = await response.json();
      setSurahInfo(data);
    } catch (error) {
      console.error('Error fetching surah info:', error);
      // Fallback surah info
      setSurahInfo({
        surahNo: surah,
        totalAyah: 7, // Default fallback
        surahName: "Unknown"
      });
    }
  };

  const fetchVerse = async (surah, verse) => {
    try {
      setLoading(true);
      
      // Fetch verse from Quran API using correct endpoint format
      const response = await fetch(`https://quranapi.pages.dev/api/${surah}/${verse}.json`);
      const data = await response.json();
      
      setCurrentVerse(data);
    } catch (error) {
      console.error('Error fetching verse:', error);
      // Fallback verse data
      setCurrentVerse({
        surahNo: surah,
        ayahNo: verse,
        arabic1: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        english: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextVerse = () => {
    if (!surahInfo || verseNumber >= surahInfo.totalAyah) return;
    
    const nextVerse = verseNumber + 1;
    setVerseNumber(nextVerse);
    fetchVerse(surahNumber, nextVerse);
  };

  const handlePreviousVerse = () => {
    if (verseNumber <= 1) return;
    
    const prevVerse = verseNumber - 1;
    setVerseNumber(prevVerse);
    fetchVerse(surahNumber, prevVerse);
  };

  const handleNextSurah = () => {
    const nextSurah = surahNumber + 1;
    if (nextSurah > 114) return;
    
    setSurahNumber(nextSurah);
    setVerseNumber(1);
    fetchSurahInfo(nextSurah);
    fetchVerse(nextSurah, 1);
  };

  const handlePreviousSurah = () => {
    if (surahNumber <= 1) return;
    
    const prevSurah = surahNumber - 1;
    setSurahNumber(prevSurah);
    setVerseNumber(1);
    fetchSurahInfo(prevSurah);
    fetchVerse(prevSurah, 1);
  };

  if (loading) {
    return (
      <div className="quran-viewer-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading verse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quran-viewer-container">
      <div className="viewer-header">
        <h1>Surah {currentVerse?.surahNo}, Verse {currentVerse?.ayahNo}</h1>
        <p>Quran Viewer</p>
      </div>

      <div className="verse-container">
        <div className="arabic-verse">
          <h2>{currentVerse?.arabic1}</h2>
        </div>
        
        <div className="translation-container">
          <div className="translation-section">
            <h3>English Translation</h3>
            <p>{currentVerse?.english}</p>
          </div>
        </div>
      </div>

      <div className="navigation-controls">
        <div className="control-group">
          <button 
            onClick={handlePreviousSurah}
            disabled={surahNumber <= 1}
            className="nav-button"
          >
            ← Previous Surah
          </button>
          
          <button 
            onClick={handleNextSurah}
            disabled={surahNumber >= 114}
            className="nav-button"
          >
            Next Surah →
          </button>
        </div>
        
        <div className="control-group">
          <button 
            onClick={handlePreviousVerse}
            disabled={verseNumber <= 1}
            className="nav-button"
          >
            ← Previous Verse
          </button>
          
          <button 
            onClick={handleNextVerse}
            disabled={!surahInfo || verseNumber >= surahInfo.totalAyah}
            className="nav-button"
          >
            Next Verse →
          </button>
        </div>
      </div>

      <div className="viewer-actions">
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

export default QuranViewer; 