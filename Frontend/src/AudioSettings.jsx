import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import './AudioSettings.css';

const AudioSettings = ({ onClose }) => {
  const [selectedReciter, setSelectedReciter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);

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
        setUser(currentUser);
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

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        defaultReciter: selectedReciter
      });
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audio-settings-overlay">
      <div className="audio-settings-modal">
        <div className="modal-header">
          <h2>Audio Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-content">
          <div className="setting-group">
            <label htmlFor="default-reciter">Default Reciter:</label>
            <select
              id="default-reciter"
              value={selectedReciter}
              onChange={(e) => setSelectedReciter(parseInt(e.target.value))}
            >
              {reciters.map(reciter => (
                <option key={reciter.id} value={reciter.id}>
                  {reciter.name}
                </option>
              ))}
            </select>
            <p className="setting-description">
              Choose your preferred reciter for Quran audio. This will be used as the default when playing ayahs.
            </p>
          </div>

          <div className="reciter-info">
            <h3>Available Reciters:</h3>
            <div className="reciter-list">
              {reciters.map(reciter => (
                <div key={reciter.id} className="reciter-item">
                  <span className="reciter-name">{reciter.name}</span>
                  {selectedReciter === reciter.id && (
                    <span className="selected-badge">Default</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            onClick={onClose}
            className="cancel-button"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave}
            className="save-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings; 