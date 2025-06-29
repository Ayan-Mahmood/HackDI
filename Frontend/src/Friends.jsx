import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import './Friends.css';

const Friends = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [friendStats, setFriendStats] = useState({ total: 0, online: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user profile data from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUsername(userData.username || currentUser.email);
          } else {
            setUsername(currentUser.email);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUsername(currentUser.email);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Listen for friends and friend requests
  useEffect(() => {
    if (!user) return;

    // Listen for friends
    const friendsUnsubscribe = onSnapshot(
      query(collection(db, "friendships"), where("status", "==", "accepted")),
      async (snapshot) => {
        const friendsList = [];
        for (const friendshipDoc of snapshot.docs) {
          const data = friendshipDoc.data();
          if (data.user1Id === user.uid || data.user2Id === user.uid) {
            const otherUserId = data.user1Id === user.uid ? data.user2Id : data.user1Id;
            const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
            if (otherUserDoc.exists()) {
              const userData = otherUserDoc.data();
              friendsList.push({
                id: friendshipDoc.id,
                userId: otherUserId,
                username: userData.username,
                email: userData.email,
                streak: userData.longestStreak || 0,
                lastActive: userData.lastActive || null
              });
            }
          }
        }
        setFriends(friendsList);
        setFriendStats({ 
          total: friendsList.length, 
          online: friendsList.filter(f => f.lastActive && (Date.now() - f.lastActive.toDate()) < 300000).length // 5 minutes
        });
      }
    );

    // Listen for incoming friend requests
    const requestsUnsubscribe = onSnapshot(
      query(collection(db, "friendships"), where("user2Id", "==", user.uid), where("status", "==", "pending")),
      async (snapshot) => {
        const requestsList = [];
        for (const requestDoc of snapshot.docs) {
          const data = requestDoc.data();
          const requesterDoc = await getDoc(doc(db, "users", data.user1Id));
          if (requesterDoc.exists()) {
            const userData = requesterDoc.data();
            requestsList.push({
              id: requestDoc.id,
              userId: data.user1Id,
              username: userData.username,
              email: userData.email,
              streak: userData.longestStreak || 0,
              timestamp: data.timestamp
            });
          }
        }
        setFriendRequests(requestsList);
      }
    );

    return () => {
      friendsUnsubscribe();
      requestsUnsubscribe();
    };
  }, [user]);

  const searchUser = async () => {
    if (!searchUsername.trim()) {
      setSearchError('Please enter a username');
      setSearchResult(null);
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", searchUsername.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setSearchError('User not found');
        setSearchResult(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userDoc.id === user.uid) {
          setSearchError('You cannot add yourself as a friend');
          setSearchResult(null);
        } else {
          setSearchResult({
            id: userDoc.id,
            username: userData.username,
            email: userData.email,
            streak: userData.longestStreak || 0
          });
          setSearchError('');
        }
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      setSearchError('Error searching for user');
      setSearchResult(null);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchResult) return;

    try {
      // Check if friendship already exists
      const friendshipsRef = collection(db, "friendships");
      
      // Check both directions of the friendship
      const q1 = query(
        friendshipsRef,
        where("user1Id", "==", user.uid),
        where("user2Id", "==", searchResult.id)
      );
      const q2 = query(
        friendshipsRef,
        where("user1Id", "==", searchResult.id),
        where("user2Id", "==", user.uid)
      );
      
      const [existing1, existing2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      if (!existing1.empty || !existing2.empty) {
        setSearchError('Friend request already sent or friendship already exists');
        return;
      }

      // Send friend request
      await addDoc(collection(db, "friendships"), {
        user1Id: user.uid,
        user2Id: searchResult.id,
        status: "pending",
        timestamp: new Date()
      });

      setSearchError('Friend request sent successfully!');
      setSearchResult(null);
      setSearchUsername('');
    } catch (error) {
      console.error('Error sending friend request:', error);
      setSearchError('Error sending friend request');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, "friendships", requestId), {
        status: "accepted",
        acceptedAt: new Date()
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, "friendships", requestId));
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const removeFriend = async (friendshipId) => {
    try {
      await deleteDoc(doc(db, "friendships", friendshipId));
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const isOnline = (lastActive) => {
    if (!lastActive) return false;
    return (Date.now() - lastActive.toDate()) < 300000; // 5 minutes
  };

  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Never';
    const diff = Date.now() - lastActive.toDate();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #39836e 0%, #24664a 100%)',
        color: 'white'
      }}>
        <p style={{ 
          fontSize: '1.2rem', 
          margin: '0 0 20px 0',
          color: 'white',
          animation: 'none',
          transform: 'none'
        }}>
          Loading database...
        </p>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <div className="header-content">
          <h1>👥 Friends</h1>
          <div className="friends-stats">
            <span className="stat-item">
              <span className="stat-number">{friendStats.total}</span>
              <span className="stat-label">Total Friends</span>
            </span>
            <span className="stat-item">
              <span className="stat-number">{friendStats.online}</span>
              <span className="stat-label">Online</span>
            </span>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Back to Dashboard
        </button>
      </div>

      <div className="friends-tabs">
        <button 
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Friends ({friends.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📨 Requests ({friendRequests.length})
        </button>
      </div>

      <div className="add-friend-section">
        <h3>🔍 Add Friends</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter username to search..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && searchUser()}
          />
          <button onClick={searchUser} className="search-button">
            Search
          </button>
        </div>

        {searchError && (
          <div className={`search-message ${searchError.includes('successfully') ? 'success' : 'error'}`}>
            {searchError}
          </div>
        )}

        {searchResult && (
          <div className="search-result">
            <div className="user-card">
              <div className="user-info">
                <h4>{searchResult.username}</h4>
                <p>{searchResult.email}</p>
                <div className="user-stats">
                  <span className="streak-badge">🔥 {searchResult.streak} day streak</span>
                </div>
              </div>
              <button onClick={sendFriendRequest} className="add-friend-button">
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="friends-content">
        {activeTab === 'friends' && (
          <div className="friends-list">
            <h3>Your Friends</h3>
            {friends.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <p>You don't have any friends yet.</p>
                <p>Search for users above to add them!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-info">
                    <div className="friend-header">
                      <h4>{friend.username}</h4>
                      <span className={`status-indicator ${isOnline(friend.lastActive) ? 'online' : 'offline'}`}>
                        {isOnline(friend.lastActive) ? '🟢' : '⚫'}
                      </span>
                    </div>
                    <p>{friend.email}</p>
                    <div className="friend-stats">
                      <span className="streak-badge">🔥 {friend.streak} day streak</span>
                      <span className="last-active">
                        {isOnline(friend.lastActive) ? 'Online' : `Last active: ${formatLastActive(friend.lastActive)}`}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFriend(friend.id)} 
                    className="remove-friend-button"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="friend-requests-list">
            <h3>Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📨</div>
                <p>No pending friend requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="friend-request-card">
                  <div className="request-info">
                    <h4>{request.username}</h4>
                    <p>{request.email}</p>
                    <div className="request-stats">
                      <span className="streak-badge">🔥 {request.streak} day streak</span>
                      <span className="request-time">
                        {request.timestamp ? formatLastActive(request.timestamp) : 'Recently'} ago
                      </span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => acceptFriendRequest(request.id)} 
                      className="accept-button"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => declineFriendRequest(request.id)} 
                      className="decline-button"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends; 