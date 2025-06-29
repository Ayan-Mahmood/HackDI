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
      <div className="community-header">
        <Link to="/dashboard" className="back-button">
          ← Back to Dashboard
        </Link>
        <h1>Community</h1>
      </div>

      <div className="community-content">
        <div className="leaderboard-section">
          <Leaderboard />
        </div>

        <div className="discussions-section">
          {selectedThread ? (
            <ThreadPage threadId={selectedThread} onBack={() => setSelectedThread(null)} />
          ) : (
            <ThreadList onSelectThread={setSelectedThread} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Community; 