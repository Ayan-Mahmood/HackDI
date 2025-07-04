// User types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  dailyGoal: number; // verses per day
}

export interface UserStats {
  totalVersesRead: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number; // in minutes
  lastReadDate?: Date;
}

// Quran types
export interface Surah {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  description?: string;
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  text: string;
  textAr: string;
  translation: string;
  audioUrl?: string;
}

export interface DailyLesson {
  id: string;
  date: Date;
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  title: string;
  description: string;
  reflection: string;
  completedBy: string[]; // user IDs
}

// Social types
export interface Thread {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  surahId?: number;
  ayahNumber?: number;
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Comment {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: Date;
  likes: number;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// Firebase specific types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  displayName: string;
}

export interface ProfileFormData {
  displayName: string;
  preferences: UserPreferences;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  daily_ayats: number;
  learning_mode: 'read' | 'memorize';
  preferred_language: 'english' | 'arabic' | 'urdu';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Quran types
export interface Verse {
  surah_no: number;
  ayah_no: number;
  arabic: string;
  english: string;
  transliteration?: string;
}

export interface SurahProgress {
  surah_number: number;
  surah_name: string;
  english_name: string;
  total_verses: number;
  status: 'completed' | 'current' | 'available';
  progress_percentage: number;
}

export interface QuranRoadmap {
  user_progress: UserProgress;
  surahs: SurahProgress[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  current_streak: number;
  longest_streak: number;
  total_verses_completed: number;
  daily_ayats: number;
  learning_mode: 'read' | 'memorize';
  preferred_language: 'english' | 'arabic' | 'urdu';
  last_completed_date: string | null;
}

export interface UserProgress {
  current_surah: number;
  current_verse: number;
  current_streak: number;
  longest_streak: number;
  total_verses_completed: number;
  last_completed_date: string | null;
}

export interface UserUpdate {
  username?: string;
  daily_ayats?: number;
  learning_mode?: 'read' | 'memorize';
  preferred_language?: 'english' | 'arabic' | 'urdu';
}

export interface ThreadCreate {
  title: string;
  content: string;
  thread_type: 'discussion' | 'ayah-share';
  ayah_surah?: number;
  ayah_verse?: number;
  ayah_arabic?: string;
  ayah_translation?: string;
}

export interface CommentCreate {
  content: string;
  parent_id?: number;
}

// Remove or fix ThreadDetail interface
// export interface ThreadDetail extends Thread {
//   comments: Comment[];
//   is_liked: boolean;
// }

export interface LeaderboardEntry {
  username: string;
  current_streak: number;
  longest_streak: number;
  total_verses_completed: number;
  rank: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// UI types
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
} 