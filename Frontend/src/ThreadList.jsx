import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import CreateThreadModal from './CreateThreadModal';

const ThreadList = ({ onSelectThread }) => {
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});

  useEffect(() => {
    const fetchThreads = async () => {
      const q = query(collection(db, 'threads'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const threadArr = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setThreads(threadArr);

      // Fetch comment counts for each thread
      const counts = {};
      await Promise.all(threadArr.map(async (thread) => {
        const commentsSnap = await getDocs(collection(db, 'threads', thread.id, 'comments'));
        counts[thread.id] = commentsSnap.size;
      }));
      setCommentCounts(counts);
    };
    fetchThreads();
  }, [showModal]);

  const filtered = threads.filter(
    t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="thread-list">
      <div className="thread-list-header">
        <input
          type="text"
          placeholder="Search threads..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setShowModal(true)}>Create Thread</button>
      </div>
      <ul>
        {filtered.map(thread => (
          <li key={thread.id} onClick={() => onSelectThread(thread.id)}>
            <div className="thread-title">{thread.title}</div>
            <div className="thread-meta">
              <span>by {thread.username}</span>
              <span>{new Date(thread.timestamp?.toDate?.() || thread.timestamp).toLocaleString()}</span>
              <span>👍 {thread.likes ? thread.likes.length : 0}</span>
              <span>💬 {commentCounts[thread.id] || 0}</span>
            </div>
          </li>
        ))}
      </ul>
      {showModal && <CreateThreadModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default ThreadList; 