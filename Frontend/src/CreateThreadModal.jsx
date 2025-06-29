import React, { useState } from 'react';
import { db, auth } from './firebase-config';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

const CreateThreadModal = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return;
    // Fetch username from users collection
    let username = user.email;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        username = userDoc.data().username || user.email;
      }
    } catch (err) {}
    await addDoc(collection(db, 'threads'), {
      title,
      content,
      userId: user.uid,
      username,
      timestamp: serverTimestamp(),
      likes: [],
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <h3>Create Thread</h3>
        <input
          type="text"
          placeholder="Thread title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Thread content"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Post</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default CreateThreadModal; 