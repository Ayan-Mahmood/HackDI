import React from 'react';
import './QuranRoadmap.css';

const QuranRoadmap = ({
  surahs = [],
  userProgress = {},
  getSurahStatus = () => 'available',
  getSurahProgress = () => 0,
  handleSurahClick = () => {},
  searchTerm = '',
  onSearchChange = () => {}
}) => {
  // Filter surahs based on search term
  const filteredSurahs = surahs.filter(surah => 
    surah.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    surah.number.toString().includes(searchTerm)
  );

  return (
    <div className="roadmap-section">
      <h2>Complete Quran</h2>
      <p>Click on any surah to read its verses</p>
      <div className="surah-search-container">
        <input
          type="text"
          placeholder="Search surahs by name, English name, or number..."
          value={searchTerm}
          onChange={onSearchChange}
          className="surah-search-input"
        />
        <div className="search-results-count">
          {filteredSurahs.length} of {surahs.length} surahs
        </div>
      </div>
      <div className="surah-list">
        {filteredSurahs.map((surah) => {
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
  );
};

export default QuranRoadmap; 