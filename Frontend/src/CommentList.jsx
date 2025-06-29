import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase-config';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
    await addDoc(collection(db, 'threads', threadId, 'comments'), {
      content,
      userId: user.uid,
      username: user.email, // or fetch username from users collection
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
            <span className="comment-user">{c.username}</span>
            <span className="comment-date">{new Date(c.timestamp?.toDate?.() || c.timestamp).toLocaleString()}</span>
            <div>{c.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommentList; 