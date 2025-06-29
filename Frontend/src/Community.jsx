import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Leaderboard from './Leaderboard';
import ThreadList from './ThreadList';
import ThreadPage from './ThreadPage';
import './Community.css';

const Community = () => {
  const [selectedThread, setSelectedThread] = useState(null);

  return (
    <div className="community-container">
      <Link to="/dashboard" className="back-button" style={{ marginBottom: 24 }}>
        Home
      </Link>
      <Leaderboard />
      {selectedThread ? (
        <ThreadPage threadId={selectedThread} onBack={() => setSelectedThread(null)} />
      ) : (
        <ThreadList onSelectThread={setSelectedThread} />
      )}
    </div>
  );
};

export default Community; 