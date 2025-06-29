import React, { useState } from 'react';
import { db, auth } from './firebase-config';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import AudioPlayer from './AudioPlayer';
import './ShareAyahModal.css';

const ShareAyahModal = ({ onClose, ayahData }) => {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to share ayahs');
        return;
      }

      // Fetch username from users collection
      let username = user.email;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          username = userDoc.data().username || user.email;
        }
      } catch (err) {}

      // Create a thread with the ayah data and user's comment
      const threadData = {
        title: `Reflection on ${ayahData.surahName} (${ayahData.surahNumber}:${ayahData.verseNumber})`,
        content: `**Ayah Shared:**\n\n${ayahData.arabicText}\n\n**Translation:**\n${ayahData.translation}\n\n**My Thoughts:**\n${comment}`,
        userId: user.uid,
        username,
        timestamp: serverTimestamp(),
        likes: [],
        // Add ayah-specific metadata
        ayahData: {
          surahNumber: ayahData.surahNumber,
          surahName: ayahData.surahName,
          verseNumber: ayahData.verseNumber,
          arabicText: ayahData.arabicText,
          translation: ayahData.translation,
          source: ayahData.source || 'Quran Quest'
        },
        threadType: 'ayah-share'
      };

      await addDoc(collection(db, 'threads'), threadData);
      
      setLoading(false);
      onClose();
      
      // Show success message
      alert('Ayah shared successfully to the community!');
    } catch (error) {
      console.error('Error sharing ayah:', error);
      setLoading(false);
      alert('Error sharing ayah. Please try again.');
    }
  };

  if (!ayahData) {
    return null;
  }

  return (
    <div className="share-ayah-modal-overlay">
      <div className="share-ayah-modal">
        <div className="modal-header">
          <h2>Share Ayah to Community</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="ayah-preview">
          <div className="ayah-header">
            <span className="surah-info">{ayahData.surahName} ({ayahData.surahNumber}:{ayahData.verseNumber})</span>
          </div>
          <div className="ayah-text">
            <div className="arabic-text">{ayahData.arabicText}</div>
            <div className="translation-text">{ayahData.translation}</div>
          </div>
          
          <AudioPlayer 
            surahNumber={ayahData.surahNumber}
            verseNumber={ayahData.verseNumber}
            className="share-modal-audio"
          />
        </div>

        <form onSubmit={handleSubmit} className="share-form">
          <div className="form-group">
            <label htmlFor="comment">Share your thoughts about this ayah:</label>
            <textarea
              id="comment"
              placeholder="What does this ayah mean to you? Share your reflections, questions, or insights..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={4}
            />
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
              type="submit" 
              className="share-button"
              disabled={loading || !comment.trim()}
            >
              {loading ? 'Sharing...' : 'Share to Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareAyahModal; 