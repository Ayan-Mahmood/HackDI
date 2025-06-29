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

  return (
    <div className="thread-page">
      <button onClick={onBack}>Back</button>
      <h2>{thread.title}</h2>
      <div className="thread-meta">
        <span>by {thread.username}</span>
        <span>{new Date(thread.timestamp?.toDate?.() || thread.timestamp).toLocaleString()}</span>
        <span>👍 {thread.likes ? thread.likes.length : 0}</span>
        <button onClick={handleLike}>
          {thread.likes?.includes(user?.uid) ? 'Unlike' : 'Like'}
        </button>
      </div>
      <div className="thread-content">{thread.content}</div>
      <CommentList threadId={threadId} />
    </div>
  );
};

export default ThreadPage; 