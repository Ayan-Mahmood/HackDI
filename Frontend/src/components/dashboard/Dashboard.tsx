import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Target, 
  Zap,
  TrendingUp,
  Calendar,
  Award,
  GraduationCap
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import DailyLesson from '../quran/DailyLesson';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data for now - replace with Firebase calls later
  const { data: progress } = useQuery(
    'userProgress',
    () => Promise.resolve({
      current_surah: 1,
      current_verse: 1,
      current_streak: user?.stats?.currentStreak || 0,
      longest_streak: user?.stats?.longestStreak || 0,
      total_verses_completed: user?.stats?.totalVersesRead || 0,
      last_completed_date: null
    }),
    { enabled: !!user }
  );

  const { data: leaderboard } = useQuery(
    'leaderboard',
    () => Promise.resolve([
      { username: 'Ahmed', verses_completed: 150, streak: 25 },
      { username: 'Fatima', verses_completed: 120, streak: 18 },
      { username: 'Omar', verses_completed: 95, streak: 12 },
      { username: 'Aisha', verses_completed: 80, streak: 8 },
      { username: 'Yusuf', verses_completed: 65, streak: 5 }
    ])
  );

  const stats = [
    {
      name: 'Current Streak',
      value: user?.stats?.currentStreak || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Longest Streak',
      value: user?.stats?.longestStreak || 0,
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Total Verses',
      value: user?.stats?.totalVersesRead || 0,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Daily Goal',
      value: user?.preferences?.dailyGoal || 10,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.displayName || 'User'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your spiritual journey with today's lesson
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Lesson */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Today's Lesson
            </h2>
            <DailyLesson />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Community Leaderboard
            </h2>
            <div className="space-y-4">
              {leaderboard?.map((entry: any, index: number) => (
                <div key={entry.username} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {entry.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.verses_completed} verses • {entry.streak} day streak
                      </p>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="flex items-center">
                      <Award className={`h-5 w-5 ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 'text-amber-600'
                      }`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Track Progress */}
        <Link to="/roadmap" className="group">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Track Progress
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Visualize your Quran reading journey with interactive progress tracking
            </p>
          </div>
        </Link>

        {/* Community */}
        <Link to="/community" className="group">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Community
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with fellow learners and share your insights
            </p>
          </div>
        </Link>

        {/* Quranic Learning */}
        <Link to="/quranic-learning" className="group">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                Quranic Learning
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Master the 500 most frequent Arabic words in the Quran
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 