import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './QuranicLearning.css';

function getRandomOptions(words, correctWord, count = 4) {
  // Get 3 random unique distractors that are not the correct word
  const distractors = [];
  const used = new Set([correctWord.english]);
  while (distractors.length < count - 1) {
    const idx = Math.floor(Math.random() * words.length);
    const option = words[idx];
    if (!used.has(option.english)) {
      distractors.push(option.english);
      used.add(option.english);
    }
  }
  // Insert the correct answer at a random position
  const options = [...distractors];
  const correctIdx = Math.floor(Math.random() * count);
  options.splice(correctIdx, 0, correctWord.english);
  return options;
}

const QuranicLearning = () => {
  const [words, setWords] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState({});
  const [reviewList, setReviewList] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    // When a new word is shown, generate new options
    if (currentLesson > 0 && lessons.length > 0) {
      const word = lessons[currentLesson - 1].words[currentWordIndex];
      setOptions(getRandomOptions(words, word));
      setSelectedOption(null);
      setShowFeedback(false);
      setFeedback('');
    }
  }, [currentWordIndex, currentLesson, lessons, words]);

  const loadWords = async () => {
    try {
      const response = await fetch('/top_500_quranic_words.json');
      const data = await response.json();
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
    } catch (error) {
      setLoading(false);
    }
  };

  const startLesson = (lessonId) => {
    setCurrentLesson(lessonId);
    setCurrentWordIndex(0);
    setScore(0);
    setReviewList([]);
    setShowFeedback(false);
    setFeedback('');
  };

  const nextWord = () => {
    setShowFeedback(false);
    setFeedback('');
    setSelectedOption(null);
    if (currentWordIndex < lessons[currentLesson - 1].words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else if (reviewList.length > 0) {
      // If there are words to review, start them
      setLessons(prev => {
        const updated = [...prev];
        updated[currentLesson - 1].words = reviewList;
        return updated;
      });
      setCurrentWordIndex(0);
      setReviewList([]);
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

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    if (option === currentWord.english) {
      setScore(score + 1);
      setFeedback('Correct!');
      setShowFeedback(true);
      setTimeout(() => {
        nextWord();
      }, 900);
    } else {
      setFeedback('Incorrect!');
      setShowFeedback(true);
      setReviewList(prev => [...prev, currentWord]);
      setTimeout(() => {
        nextWord();
      }, 900);
    }
  };

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
        </div>
        <div className="interaction-area">
          <p className="instruction">What does this word mean?</p>
          <div className="mcq-options">
            {options.map((option, idx) => (
              <button
                key={idx}
                className={`mcq-option-btn ${selectedOption === option ? (option === currentWord.english ? 'correct' : 'incorrect') : ''}`}
                onClick={() => handleOptionClick(option)}
                disabled={!!selectedOption}
              >
                {option}
              </button>
            ))}
          </div>
          {showFeedback && (
            <div className={`mcq-feedback ${feedback === 'Correct!' ? 'correct' : 'incorrect'}`}>{feedback}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuranicLearning; 