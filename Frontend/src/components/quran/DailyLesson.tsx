import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { BookOpen, Play, Pause, CheckCircle, Award } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

import { DailyLesson as DailyLessonType } from '../../types';

const DailyLesson: React.FC = () => {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const queryClient = useQueryClient();

  // Mock data for now - replace with Firebase calls later
  const { data: lesson, isLoading } = useQuery(
    'dailyLesson',
    () => Promise.resolve({
      id: '1',
      date: new Date(),
      surahId: 1,
      ayahStart: 1,
      ayahEnd: 7,
      title: 'Al-Fatiha (The Opening)',
      description: 'The opening chapter of the Quran',
      reflection: 'This chapter teaches us about the relationship between Allah and His creation.',
      completedBy: [],
      verses: [
        { id: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
        { id: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'All praise is due to Allah, Lord of the worlds.' },
        { id: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Entirely Merciful, the Especially Merciful.' },
        { id: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'Sovereign of the Day of Recompense.' },
        { id: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'It is You we worship and You we ask for help.' },
        { id: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Guide us to the straight path.' },
        { id: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', translation: 'The path of those upon whom You have bestowed favor, not of those who have evoked Your anger or of those who are astray.' }
      ],
      total_verses: 7,
      current_surah: 1,
      current_verse: 1,
      next_surah: 2,
      next_verse: 1
    })
  );

  const completeLessonMutation = useMutation(
    () => Promise.resolve({ verses_completed: 7, achievement: 'First Lesson Complete!' }),
    {
      onSuccess: (data: any) => {
        toast.success(`Lesson completed! +${data.verses_completed} verses`);
        if (data.achievement) {
          toast.success(`Achievement unlocked: ${data.achievement}`);
        }
        setIsCompleted(true);
        queryClient.invalidateQueries('userProgress');
      },
      onError: () => {
        toast.error('Failed to complete lesson');
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No lesson available today</p>
      </div>
    );
  }

  const currentVerse = lesson.verses?.[currentVerseIndex];

  const handleVerseClick = (index: number) => {
    setCurrentVerseIndex(index);
  };

  const handleNext = () => {
    if (lesson.verses && currentVerseIndex < lesson.verses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    }
  };

  const handleComplete = () => {
    completeLessonMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Lesson Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lesson.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {lesson.total_verses} verses • Surah {lesson.current_surah}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            {isCompleted && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {lesson.description}
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reflection</h3>
          <p className="text-gray-600 dark:text-gray-400">{lesson.reflection}</p>
        </div>
      </div>

      {/* Verse Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {lesson.verses?.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => handleVerseClick(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentVerseIndex
                    ? 'bg-green-500 text-white'
                    : index < currentVerseIndex
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Verse */}
        {currentVerse && (
          <div className="text-center mb-6">
            <div className="mb-4">
              <p className="text-2xl leading-relaxed text-gray-900 dark:text-white mb-4">
                {currentVerse.text}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {currentVerse.translation}
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>{currentVerseIndex + 1} of {lesson.total_verses}</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentVerseIndex + 1) / lesson.total_verses) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handlePrevious}
            disabled={currentVerseIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {lesson.verses && currentVerseIndex < lesson.verses.length - 1 ? (
              <Button onClick={handleNext}>
                Next Verse
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isCompleted || completeLessonMutation.isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {completeLessonMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Completing...
                  </div>
                ) : (
                  'Complete Lesson'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      {isCompleted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Lesson Completed!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                Surah {lesson.current_surah}, Verse {lesson.current_verse} - 
                Surah {lesson.next_surah}, Verse {lesson.next_verse}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLesson; 