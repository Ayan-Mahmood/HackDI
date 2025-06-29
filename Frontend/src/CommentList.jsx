import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase-config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc, doc } from 'firebase/firestore';

const CommentList = ({ threadId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, 'threads', threadId, 'comments'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [threadId]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user) return;
    // Fetch username from users collection
    let username = user.email;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        username = userDoc.data().username || user.email;
      }
    } catch (err) {}
    await addDoc(collection(db, 'threads', threadId, 'comments'), {
      content,
      userId: user.uid,
      username,
      timestamp: serverTimestamp(),
    });
    setContent('');
  };

  return (
    <div className="comments">
      <h4>Comments</h4>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Add a comment..."
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <button type="submit">Post</button>
      </form>
      <ul>
        {comments.map(c => (
          <li key={c.id}>
            <span className="comment-user">{c.username && c.username.includes('@') ? c.username.split('@')[0] : (c.username || 'Unknown User')}</span>
            <span className="comment-date">{new Date(c.timestamp?.toDate?.() || c.timestamp).toLocaleString()}</span>
            <div>{c.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommentList; 