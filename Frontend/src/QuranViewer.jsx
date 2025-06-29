import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config.js';
import { useNavigate, useLocation } from 'react-router-dom';
import ShareButton from './ShareButton';
import AudioPlayer from './AudioPlayer';
import './QuranViewer.css';

const QuranViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentVerse, setCurrentVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surahNumber, setSurahNumber] = useState(1);
  const [verseNumber, setVerseNumber] = useState(1);
  const [surahInfo, setSurahInfo] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
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

  // Prepare ayah data for sharing
  const getAyahDataForSharing = () => {
    if (!currentVerse || !surahInfo) return null;
    
    return {
      surahNumber: currentVerse.surahNo,
      surahName: surahInfo.surahName || `Surah ${currentVerse.surahNo}`,
      verseNumber: currentVerse.ayahNo,
      arabicText: currentVerse.arabic1,
      translation: currentVerse.english,
      source: 'Quran Quest'
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

  return (
    <div className="quran-viewer-container">
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
            <p>{currentVerse?.english}</p>
          </div>
        </div>

        <AudioPlayer 
          surahNumber={currentVerse?.surahNo}
          verseNumber={currentVerse?.ayahNo}
          className="verse-audio"
        />
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
        <ShareButton 
          ayahData={getAyahDataForSharing()}
          className="large"
        >
          Share this Ayah
        </ShareButton>
        
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