import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const Leaderboard = () => {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [userIndex, setUserIndex] = useState(-1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get all friends (accepted friendships)
        const friendshipsRef = collection(db, 'friendships');
        const q1 = query(friendshipsRef, where('status', '==', 'accepted'), where('user1Id', '==', currentUser.uid));
        const q2 = query(friendshipsRef, where('status', '==', 'accepted'), where('user2Id', '==', currentUser.uid));
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const friendIds = new Set();
        snap1.forEach(docSnap => friendIds.add(docSnap.data().user2Id));
        snap2.forEach(docSnap => friendIds.add(docSnap.data().user1Id));
        friendIds.add(currentUser.uid); // include self

        // Get streaks for all
        const friendsArr = [];
        for (const id of friendIds) {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            friendsArr.push({
              id,
              username: userDoc.data().username,
              streak: userDoc.data().longestStreak || 0,
              isSelf: id === currentUser.uid,
            });
          }
        }
        // Sort by streak descending
        friendsArr.sort((a, b) => b.streak - a.streak);
        setFriends(friendsArr);
        setUserIndex(friendsArr.findIndex(f => f.id === currentUser.uid));
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) return null;

  // Show 3 above, self, 3 below, scrollable if more
  const start = Math.max(0, userIndex - 3);
  const end = Math.min(friends.length, userIndex + 4);
  const visible = friends.slice(start, end);

  return (
    <div className="leaderboard" style={{ maxHeight: '350px', overflowY: 'auto' }}>
      <h2>Leaderboard (Longest Streaks)</h2>
      <ul>
        {visible.map((f, i) => (
          <li key={f.id} className={f.isSelf ? 'self' : ''}>
            <span className="rank">{start + i + 1}.</span>
            <span className="username">{f.username}</span>
            <span className="streak">{f.streak} 🔥</span>
            {f.isSelf && <span className="you">(You)</span>}
          </li>
        ))}
      </ul>
      <div className="your-rank">Your rank: #{userIndex + 1} of {friends.length} | Your streak: {friends[userIndex]?.streak || 0} 🔥</div>
    </div>
  );
};

export default Leaderboard; 