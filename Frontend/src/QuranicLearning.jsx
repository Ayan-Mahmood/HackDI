import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './QuranicLearning.css';

const QuranicLearning = () => {
  console.log('QuranicLearning component rendered');
  
  const [words, setWords] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState({});

  useEffect(() => {
    console.log('QuranicLearning useEffect triggered');
    loadWords();
  }, []);

  const loadWords = async () => {
    console.log('Loading words...');
    try {
      const response = await fetch('/top_500_quranic_words.json');
      console.log('Fetch response:', response);
      const data = await response.json();
      console.log('Loaded data:', data.length, 'words');
      setWords(data);
      // Create lessons (10 words per lesson)
      const lessonData = [];
      for (let i = 0; i < 50; i++) {
        const lessonWords = data.slice(i * 10, (i + 1) * 10);
        lessonData.push({
          id: i + 1,
          title: `Lesson ${i + 1}: Words ${i * 10 + 1}-${(i + 1) * 10}`,
          words: lessonWords,
          completed: false,
          score: 0
        });
      }
      setLessons(lessonData);
      setLoading(false);
      console.log('Lessons created:', lessonData.length);
    } catch (error) {
      console.error('Error loading words:', error);
      setLoading(false);
    }
  };

  const startLesson = (lessonId) => {
    setCurrentLesson(lessonId);
    setCurrentWordIndex(0);
    setShowAnswer(false);
    setScore(0);
  };

  const nextWord = () => {
    if (currentWordIndex < lessons[currentLesson - 1].words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setShowAnswer(false);
    } else {
      completeLesson();
    }
  };

  const completeLesson = () => {
    const updatedLessons = [...lessons];
    updatedLessons[currentLesson - 1].completed = true;
    updatedLessons[currentLesson - 1].score = score;
    setLessons(updatedLessons);
    // Update progress
    const progress = Math.round((score / lessons[currentLesson - 1].words.length) * 100);
    setLessonProgress(prev => ({
      ...prev,
      [currentLesson]: progress
    }));
    setCurrentLesson(0); // Return to lesson selection
  };

  const currentWord = lessons[currentLesson - 1]?.words[currentWordIndex];

  if (loading) {
    return (
      <div className="quranic-learning">
        <div className="back-to-dashboard">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading Quranic words...</p>
        </div>
      </div>
    );
  }

  if (currentLesson === 0) {
    return (
      <div className="quranic-learning">
        <div className="back-to-dashboard">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="learning-header">
          <h1>🌙 Quranic Arabic Learning</h1>
          <p>Learn the 500 most frequent words in the Quran</p>
        </div>
        <div className="lessons-grid">
          {lessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className={`lesson-card ${lesson.completed ? 'completed' : ''}`}
              onClick={() => startLesson(lesson.id)}
            >
              <div className="lesson-header">
                <h3>{lesson.title}</h3>
                {lesson.completed && (
                  <div className="completion-badge">✓</div>
                )}
              </div>
              <div className="lesson-stats">
                <span>{lesson.words.length} words</span>
                {lesson.completed && (
                  <span className="score">Score: {lesson.score}/{lesson.words.length}</span>
                )}
              </div>
              {lessonProgress[lesson.id] && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${lessonProgress[lesson.id]}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quranic-learning">
      <div className="back-to-dashboard">
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="lesson-header">
        <button 
          className="back-button"
          onClick={() => setCurrentLesson(0)}
        >
          ← Back to Lessons
        </button>
        <div className="lesson-progress">
          <span>Word {currentWordIndex + 1} of {lessons[currentLesson - 1].words.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentWordIndex + 1) / lessons[currentLesson - 1].words.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="word-card">
        <div className="word-display">
          <div className="arabic-word">{currentWord?.arabic}</div>
          <div className="word-info">
            <span className="rank">Rank #{currentWord?.rank}</span>
            <span className="frequency">Appears {currentWord?.frequency} times</span>
          </div>
        </div>
        {!showAnswer ? (
          <div className="interaction-area">
            <p className="instruction">What does this word mean?</p>
            <button 
              className="show-answer-btn"
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
            </button>
          </div>
        ) : (
          <div className="answer-area">
            <div className="english-translation">
              <h3>English:</h3>
              <p>{currentWord?.english}</p>
            </div>
            <div className="word-context">
              <h4>Example occurrences:</h4>
              <div className="occurrences">
                {currentWord?.occurrences.slice(0, 3).map((occ, index) => (
                  <div key={index} className="occurrence">
                    Surah {occ.surah}, Ayah {occ.ayah}
                  </div>
                ))}
              </div>
            </div>
            <div className="action-buttons">
              <button 
                className="correct-btn"
                onClick={() => {
                  setScore(score + 1);
                  nextWord();
                }}
              >
                ✓ I knew this
              </button>
              <button 
                className="incorrect-btn"
                onClick={() => {
                  nextWord();
                }}
              >
                ✗ Need to review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuranicLearning; 