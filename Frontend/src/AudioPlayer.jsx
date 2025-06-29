import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import './AudioPlayer.css';

const AudioPlayer = ({ surahNumber, verseNumber, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(1);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const reciters = [
    { id: 1, name: "Mishary Rashid Al Afasy" },
    { id: 2, name: "Abu Bakr Al Shatri" },
    { id: 3, name: "Nasser Al Qatami" },
    { id: 4, name: "Yasser Al Dosari" },
    { id: 5, name: "Hani Ar Rifai" }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchUserPreferences(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserPreferences = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedReciter(userData.defaultReciter || 1);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const getAudioUrl = () => {
    // Format: /<reciterNo>/<surahNo>_<ayahNo>.mp3
    return `https://the-quran-project.github.io/Quran-Audio/Data/${selectedReciter}/${surahNumber}_${verseNumber}.mp3`;
  };

  const handlePlay = async () => {
    if (!surahNumber || !verseNumber) {
      setError('Invalid surah or verse number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (audioRef.current) {
        audioRef.current.src = getAudioUrl();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to load audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleReciterChange = (event) => {
    const newReciter = parseInt(event.target.value);
    setSelectedReciter(newReciter);
    
    // If currently playing, restart with new reciter
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (e) => {
    // Only show error if it's a network error, not just loading issues
    if (e.target.error && e.target.error.code === MediaError.MEDIA_ERR_NETWORK) {
      setError('Audio failed to load. Please try a different reciter.');
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  return (
    <div className={`audio-player ${className}`}>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
      />
      
      <div className="audio-controls">
        <div className="reciter-selector">
          <label htmlFor="reciter-select">Reciter:</label>
          <select
            id="reciter-select"
            value={selectedReciter}
            onChange={handleReciterChange}
            disabled={isLoading}
          >
            {reciters.map(reciter => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.name}
              </option>
            ))}
          </select>
        </div>

        <div className="playback-controls">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={isLoading}
              className="play-button"
              title="Play recitation"
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
              {isLoading ? 'Loading...' : 'Play'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="pause-button"
              title="Pause recitation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
              Pause
            </button>
          )}

          {isPlaying && (
            <button
              onClick={handleStop}
              className="stop-button"
              title="Stop recitation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h12v12H6z"/>
              </svg>
              Stop
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="audio-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {isPlaying && (
        <div className="playing-indicator">
          <div className="pulse-dot"></div>
          <span>Now playing: {reciters.find(r => r.id === selectedReciter)?.name}</span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer; 