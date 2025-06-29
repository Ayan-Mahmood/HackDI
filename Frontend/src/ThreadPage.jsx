import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase-config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import CommentList from './CommentList';

const ThreadPage = ({ threadId, onBack }) => {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchThread = async () => {
      const docRef = doc(db, 'threads', threadId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setThread({ id: docSnap.id, ...docSnap.data() });
      setLoading(false);
    };
    fetchThread();
  }, [threadId]);

  const handleLike = async () => {
    if (!user || !thread) return;
    const docRef = doc(db, 'threads', threadId);
    const hasLiked = thread.likes?.includes(user.uid);
    await updateDoc(docRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
    setThread({
      ...thread,
      likes: hasLiked
        ? thread.likes.filter(id => id !== user.uid)
        : [...(thread.likes || []), user.uid],
    });
  };

  if (loading) return <div>Loading...</div>;
  if (!thread) return <div>Thread not found.</div>;

  // Function to format content with markdown-like formatting
  const formatContent = (content) => {
    if (!content) return '';
    
    // Split content by double newlines to separate sections
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      if (section.startsWith('**Ayah Shared:**')) {
        return (
          <div key={index} className="ayah-share-section">
            <h3 className="ayah-share-title">📖 Ayah Shared</h3>
            <div className="ayah-content">
              {section.replace('**Ayah Shared:**\n\n', '').split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="ayah-line">{line}</div>
              ))}
            </div>
          </div>
        );
      } else if (section.startsWith('**Translation:**')) {
        return (
          <div key={index} className="translation-section">
            <h4 className="translation-title">Translation</h4>
            <div className="translation-content">
              {section.replace('**Translation:**\n\n', '').split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="translation-line">{line}</div>
              ))}
            </div>
          </div>
        );
      } else if (section.startsWith('**My Thoughts:**')) {
        return (
          <div key={index} className="thoughts-section">
            <h4 className="thoughts-title">💭 My Thoughts</h4>
            <div className="thoughts-content">
              {section.replace('**My Thoughts:**\n\n', '').split('\n').map((line, lineIndex) => (
                <div key={lineIndex} className="thoughts-line">{line}</div>
              ))}
            </div>
          </div>
        );
      } else {
        return <div key={index} className="regular-content">{section}</div>;
      }
    });
  };

  return (
    <div className="thread-page">
      <button onClick={onBack} className="back-button">Back</button>
      <h2>
        {thread.threadType === 'ayah-share' && (
          <span className="ayah-share-badge">📖 Ayah Share</span>
        )}
        {thread.title}
      </h2>
      <div className="thread-meta">
        <span>by {thread.username && thread.username.includes('@') ? thread.username.split('@')[0] : (thread.username || 'Unknown User')}</span>
        <span>{new Date(thread.timestamp?.toDate?.() || thread.timestamp).toLocaleString()}</span>
        <span>👍 {thread.likes ? thread.likes.length : 0}</span>
        <button onClick={handleLike} className="like-button">
          {thread.likes?.includes(user?.uid) ? 'Unlike' : 'Like'}
        </button>
      </div>
      <div className="thread-content">
        {thread.threadType === 'ayah-share' ? formatContent(thread.content) : thread.content}
      </div>
      <CommentList threadId={threadId} />
    </div>
  );
};

export default ThreadPage; 