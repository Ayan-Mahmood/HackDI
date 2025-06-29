import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config.js';
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

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
            setUserProgress(userData);
          } else {
            setUsername(currentUser.email);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUsername(currentUser.email);
        }
        
        // Fetch surah list
        await fetchSurahList();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchSurahList = async () => {
    try {
      // Since Quran API doesn't provide a surah list endpoint, we'll use a static list
      // This contains all 114 surahs with their names and verse counts
      const surahList = [
        { number: 1, name: "Al-Fatiha", englishName: "The Opening", numberOfAyahs: 7 },
        { number: 2, name: "Al-Baqarah", englishName: "The Cow", numberOfAyahs: 286 },
        { number: 3, name: "Aal-Imran", englishName: "Family of Imran", numberOfAyahs: 200 },
        { number: 4, name: "An-Nisa", englishName: "The Women", numberOfAyahs: 176 },
        { number: 5, name: "Al-Ma'idah", englishName: "The Table Spread", numberOfAyahs: 120 },
        { number: 6, name: "Al-An'am", englishName: "The Cattle", numberOfAyahs: 165 },
        { number: 7, name: "Al-A'raf", englishName: "The Heights", numberOfAyahs: 206 },
        { number: 8, name: "Al-Anfal", englishName: "The Spoils of War", numberOfAyahs: 75 },
        { number: 9, name: "At-Tawbah", englishName: "The Repentance", numberOfAyahs: 129 },
        { number: 10, name: "Yunus", englishName: "Jonah", numberOfAyahs: 109 },
        { number: 11, name: "Hud", englishName: "Hud", numberOfAyahs: 123 },
        { number: 12, name: "Yusuf", englishName: "Joseph", numberOfAyahs: 111 },
        { number: 13, name: "Ar-Ra'd", englishName: "The Thunder", numberOfAyahs: 43 },
        { number: 14, name: "Ibrahim", englishName: "Abraham", numberOfAyahs: 52 },
        { number: 15, name: "Al-Hijr", englishName: "The Rocky Tract", numberOfAyahs: 99 },
        { number: 16, name: "An-Nahl", englishName: "The Bee", numberOfAyahs: 128 },
        { number: 17, name: "Al-Isra", englishName: "The Night Journey", numberOfAyahs: 111 },
        { number: 18, name: "Al-Kahf", englishName: "The Cave", numberOfAyahs: 110 },
        { number: 19, name: "Maryam", englishName: "Mary", numberOfAyahs: 98 },
        { number: 20, name: "Ta-Ha", englishName: "Ta-Ha", numberOfAyahs: 135 },
        { number: 21, name: "Al-Anbya", englishName: "The Prophets", numberOfAyahs: 112 },
        { number: 22, name: "Al-Hajj", englishName: "The Pilgrimage", numberOfAyahs: 78 },
        { number: 23, name: "Al-Mu'minun", englishName: "The Believers", numberOfAyahs: 118 },
        { number: 24, name: "An-Nur", englishName: "The Light", numberOfAyahs: 64 },
        { number: 25, name: "Al-Furqan", englishName: "The Criterion", numberOfAyahs: 77 },
        { number: 26, name: "Ash-Shu'ara", englishName: "The Poets", numberOfAyahs: 227 },
        { number: 27, name: "An-Naml", englishName: "The Ant", numberOfAyahs: 93 },
        { number: 28, name: "Al-Qasas", englishName: "The Stories", numberOfAyahs: 88 },
        { number: 29, name: "Al-Ankabut", englishName: "The Spider", numberOfAyahs: 69 },
        { number: 30, name: "Ar-Rum", englishName: "The Romans", numberOfAyahs: 60 },
        { number: 31, name: "Luqman", englishName: "Luqman", numberOfAyahs: 34 },
        { number: 32, name: "As-Sajdah", englishName: "The Prostration", numberOfAyahs: 30 },
        { number: 33, name: "Al-Ahzab", englishName: "The Combined Forces", numberOfAyahs: 73 },
        { number: 34, name: "Saba", englishName: "Sheba", numberOfAyahs: 54 },
        { number: 35, name: "Fatir", englishName: "Originator", numberOfAyahs: 45 },
        { number: 36, name: "Ya-Sin", englishName: "Ya-Sin", numberOfAyahs: 83 },
        { number: 37, name: "As-Saffat", englishName: "Those who set the Ranks", numberOfAyahs: 182 },
        { number: 38, name: "Sad", englishName: "Sad", numberOfAyahs: 88 },
        { number: 39, name: "Az-Zumar", englishName: "The Troops", numberOfAyahs: 75 },
        { number: 40, name: "Ghafir", englishName: "The Forgiver", numberOfAyahs: 85 },
        { number: 41, name: "Fussilat", englishName: "Explained in Detail", numberOfAyahs: 54 },
        { number: 42, name: "Ash-Shuraa", englishName: "The Consultation", numberOfAyahs: 53 },
        { number: 43, name: "Az-Zukhruf", englishName: "The Ornaments of Gold", numberOfAyahs: 89 },
        { number: 44, name: "Ad-Dukhan", englishName: "The Smoke", numberOfAyahs: 59 },
        { number: 45, name: "Al-Jathiyah", englishName: "The Kneeling", numberOfAyahs: 37 },
        { number: 46, name: "Al-Ahqaf", englishName: "The Wind-Curved Sandhills", numberOfAyahs: 35 },
        { number: 47, name: "Muhammad", englishName: "Muhammad", numberOfAyahs: 38 },
        { number: 48, name: "Al-Fath", englishName: "The Victory", numberOfAyahs: 29 },
        { number: 49, name: "Al-Hujurat", englishName: "The Private Apartments", numberOfAyahs: 18 },
        { number: 50, name: "Qaf", englishName: "Qaf", numberOfAyahs: 45 },
        { number: 51, name: "Adh-Dhariyat", englishName: "The Winnowing Winds", numberOfAyahs: 60 },
        { number: 52, name: "At-Tur", englishName: "The Mount", numberOfAyahs: 49 },
        { number: 53, name: "An-Najm", englishName: "The Star", numberOfAyahs: 62 },
        { number: 54, name: "Al-Qamar", englishName: "The Moon", numberOfAyahs: 55 },
        { number: 55, name: "Ar-Rahman", englishName: "The Beneficent", numberOfAyahs: 78 },
        { number: 56, name: "Al-Waqi'ah", englishName: "The Inevitable", numberOfAyahs: 96 },
        { number: 57, name: "Al-Hadid", englishName: "The Iron", numberOfAyahs: 29 },
        { number: 58, name: "Al-Mujadila", englishName: "The Pleading Woman", numberOfAyahs: 22 },
        { number: 59, name: "Al-Hashr", englishName: "The Exile", numberOfAyahs: 24 },
        { number: 60, name: "Al-Mumtahanah", englishName: "The Woman to be Examined", numberOfAyahs: 13 },
        { number: 61, name: "As-Saf", englishName: "The Ranks", numberOfAyahs: 14 },
        { number: 62, name: "Al-Jumu'ah", englishName: "The Congregation", numberOfAyahs: 11 },
        { number: 63, name: "Al-Munafiqun", englishName: "The Hypocrites", numberOfAyahs: 11 },
        { number: 64, name: "At-Taghabun", englishName: "The Mutual Disillusion", numberOfAyahs: 18 },
        { number: 65, name: "At-Talaq", englishName: "Divorce", numberOfAyahs: 12 },
        { number: 66, name: "At-Tahrim", englishName: "The Prohibition", numberOfAyahs: 12 },
        { number: 67, name: "Al-Mulk", englishName: "The Sovereignty", numberOfAyahs: 30 },
        { number: 68, name: "Al-Qalam", englishName: "The Pen", numberOfAyahs: 52 },
        { number: 69, name: "Al-Haqqah", englishName: "The Reality", numberOfAyahs: 52 },
        { number: 70, name: "Al-Ma'arij", englishName: "The Ascending Stairways", numberOfAyahs: 44 },
        { number: 71, name: "Nuh", englishName: "Noah", numberOfAyahs: 28 },
        { number: 72, name: "Al-Jinn", englishName: "The Jinn", numberOfAyahs: 28 },
        { number: 73, name: "Al-Muzzammil", englishName: "The Enshrouded One", numberOfAyahs: 20 },
        { number: 74, name: "Al-Muddathir", englishName: "The Cloaked One", numberOfAyahs: 56 },
        { number: 75, name: "Al-Qiyamah", englishName: "The Resurrection", numberOfAyahs: 40 },
        { number: 76, name: "Al-Insan", englishName: "Man", numberOfAyahs: 31 },
        { number: 77, name: "Al-Mursalat", englishName: "The Emissaries", numberOfAyahs: 50 },
        { number: 78, name: "An-Naba", englishName: "The Tidings", numberOfAyahs: 40 },
        { number: 79, name: "An-Nazi'at", englishName: "Those who drag forth", numberOfAyahs: 46 },
        { number: 80, name: "Abasa", englishName: "He frowned", numberOfAyahs: 42 },
        { number: 81, name: "At-Takwir", englishName: "The Overthrowing", numberOfAyahs: 29 },
        { number: 82, name: "Al-Infitar", englishName: "The Cleaving", numberOfAyahs: 19 },
        { number: 83, name: "Al-Mutaffifin", englishName: "The Defrauding", numberOfAyahs: 36 },
        { number: 84, name: "Al-Inshiqaq", englishName: "The Splitting Open", numberOfAyahs: 25 },
        { number: 85, name: "Al-Buruj", englishName: "The Mansions of the Stars", numberOfAyahs: 22 },
        { number: 86, name: "At-Tariq", englishName: "The Morning Star", numberOfAyahs: 17 },
        { number: 87, name: "Al-A'la", englishName: "The Most High", numberOfAyahs: 19 },
        { number: 88, name: "Al-Ghashiyah", englishName: "The Overwhelming", numberOfAyahs: 26 },
        { number: 89, name: "Al-Fajr", englishName: "The Dawn", numberOfAyahs: 30 },
        { number: 90, name: "Al-Balad", englishName: "The City", numberOfAyahs: 20 },
        { number: 91, name: "Ash-Shams", englishName: "The Sun", numberOfAyahs: 15 },
        { number: 92, name: "Al-Layl", englishName: "The Night", numberOfAyahs: 21 },
        { number: 93, name: "Ad-Duha", englishName: "The Morning Hours", numberOfAyahs: 11 },
        { number: 94, name: "Ash-Sharh", englishName: "The Relief", numberOfAyahs: 8 },
        { number: 95, name: "At-Tin", englishName: "The Fig", numberOfAyahs: 8 },
        { number: 96, name: "Al-'Alaq", englishName: "The Clot", numberOfAyahs: 19 },
        { number: 97, name: "Al-Qadr", englishName: "The Power", numberOfAyahs: 5 },
        { number: 98, name: "Al-Bayyinah", englishName: "The Clear Proof", numberOfAyahs: 8 },
        { number: 99, name: "Az-Zalzalah", englishName: "The Earthquake", numberOfAyahs: 8 },
        { number: 100, name: "Al-'Adiyat", englishName: "The Coursers", numberOfAyahs: 11 },
        { number: 101, name: "Al-Qari'ah", englishName: "The Calamity", numberOfAyahs: 11 },
        { number: 102, name: "At-Takathur", englishName: "The Rivalry in world increase", numberOfAyahs: 8 },
        { number: 103, name: "Al-'Asr", englishName: "The Declining Day", numberOfAyahs: 3 },
        { number: 104, name: "Al-Humazah", englishName: "The Traducer", numberOfAyahs: 9 },
        { number: 105, name: "Al-Fil", englishName: "The Elephant", numberOfAyahs: 5 },
        { number: 106, name: "Quraish", englishName: "Quraish", numberOfAyahs: 4 },
        { number: 107, name: "Al-Ma'un", englishName: "The Small kindnesses", numberOfAyahs: 7 },
        { number: 108, name: "Al-Kawthar", englishName: "The Abundance", numberOfAyahs: 3 },
        { number: 109, name: "Al-Kafirun", englishName: "The Disbelievers", numberOfAyahs: 6 },
        { number: 110, name: "An-Nasr", englishName: "The Divine Support", numberOfAyahs: 3 },
        { number: 111, name: "Al-Masad", englishName: "The Palm Fiber", numberOfAyahs: 5 },
        { number: 112, name: "Al-Ikhlas", englishName: "The Sincerity", numberOfAyahs: 4 },
        { number: 113, name: "Al-Falaq", englishName: "The Daybreak", numberOfAyahs: 5 },
        { number: 114, name: "An-Nas", englishName: "Mankind", numberOfAyahs: 6 }
      ];
      
      setSurahs(surahList);
    } catch (error) {
      console.error('Error setting surah list:', error);
      // Fallback surah data for first few surahs
      setSurahs([
        { number: 1, name: "Al-Fatiha", englishName: "The Opening", numberOfAyahs: 7 },
        { number: 2, name: "Al-Baqarah", englishName: "The Cow", numberOfAyahs: 286 },
        { number: 3, name: "Aal-Imran", englishName: "Family of Imran", numberOfAyahs: 200 },
        { number: 4, name: "An-Nisa", englishName: "The Women", numberOfAyahs: 176 },
        { number: 5, name: "Al-Ma'idah", englishName: "The Table Spread", numberOfAyahs: 120 }
      ]);
    }
  };

  const getSurahStatus = (surahNumber) => {
    if (!userProgress) return 'available';
    
    const currentSurah = userProgress.currentSurah || 1;
    
    if (surahNumber < currentSurah) return 'completed';
    if (surahNumber === currentSurah) return 'current';
    return 'available';
  };

  const getSurahProgress = (surahNumber, surahAyahs) => {
    if (!userProgress) return 0;
    const currentSurah = userProgress.currentSurah || 1;
    const currentVerse = userProgress.currentVerse || 1;
    if (surahNumber < currentSurah) return 100;
    if (surahNumber === currentSurah) {
      return Math.min(Math.round(((currentVerse-1) / surahAyahs) * 100), 100);
    }
    return 0;
  };

  const handleSurahClick = (surahNumber) => {
    // Navigate to Quran viewer with specific surah
    navigate('/quran-viewer', { state: { surah: surahNumber, verse: 1 } });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome to Quran Quest</h1>
          <p>Your daily Quran journey starts here</p>
        </div>
        <div className="header-actions">
          <Link to="/friends" className="friends-button">
            Friends
            {friendRequestsCount > 0 && (
              <span className="notification-badge">{friendRequestsCount}</span>
            )}
          </Link>
          <Link to="/community" className="community-button">
            Community
          </Link>
          <Link to="/profile" className="profile-button">
            Profile
          </Link>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Daily Lessons Main Card */}
        <div className="daily-lessons-main-card">
          <div className="streak-highlight">
            <div className="streak-icon">🔥</div>
            <div className="streak-number">{userProgress?.currentStreak || 0}</div>
            <div className="streak-label">Day Streak</div>
            <div className="streak-motivation">
              {userProgress?.lastCompletedDate && new Date(userProgress.lastCompletedDate).toDateString() === new Date().toDateString()
                ? 'Great job! Come back tomorrow to keep your streak.'
                : 'Keep your streak alive!'}
            </div>
          </div>
          <h2>Daily Lessons</h2>
          <p>Access today's Quran pages and ayāt</p>
          <Link
            to="/daily-lesson"
            className={
              userProgress?.lastCompletedDate && new Date(userProgress.lastCompletedDate).toDateString() === new Date().toDateString()
                ? 'main-lesson-button completed'
                : 'main-lesson-button'
            }
          >
            {userProgress?.lastCompletedDate && new Date(userProgress.lastCompletedDate).toDateString() === new Date().toDateString()
              ? 'Lesson Completed'
              : "Start Today's Lesson"}
          </Link>
        </div>

        {/* Other Features */}
        <div className="feature-cards de-emphasized">
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3>Track Progress</h3>
            <p>Monitor your daily streaks and goals</p>
            <Link to="/profile" className="feature-button">
              View Stats
            </Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Community</h3>
            <p>Connect with other learners</p>
            <Link to="/community" className="feature-button">
              View Community
            </Link>
          </div>
        </div>

        {/* Quran Roadmap Section */}
        <div className="roadmap-section">
          <h2>Complete Quran</h2>
          <p>Click on any surah to read its verses</p>
          
          <div className="surah-list">
            {surahs.map((surah) => {
              const status = getSurahStatus(surah.number);
              const progress = getSurahProgress(surah.number, surah.numberOfAyahs);
              
              return (
                <div
                  key={surah.number}
                  className={`surah-item ${status}`}
                  onClick={() => handleSurahClick(surah.number)}
                >
                  <div className="surah-number">{surah.number}</div>
                  <div className="surah-info">
                    <h3 className="surah-name">{surah.name}</h3>
                    <p className="surah-english">{surah.englishName}</p>
                    <p className="surah-ayahs">{surah.numberOfAyahs} verses</p>
                  </div>
                  <div className={`progress-bar${progress === 100 ? ' completed' : ''}`}>
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 0 && (
                        <span className="progress-label">{progress}%{progress === 100 ? ' (Completed)' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
