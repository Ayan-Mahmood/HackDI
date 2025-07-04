import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserPreferences, UserStats, Thread, Comment, Friendship } from '../types';

// Authentication services
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userData: User = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName,
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'light',
        language: 'english',
        notifications: true,
        dailyGoal: 10,
      },
      stats: {
        totalVersesRead: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
      },
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    return userData;
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
    });

    return userDoc.data() as User;
  },

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};

// User services
export const userService = {
  // Get user by ID
  async getUser(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data() as User;
  },

  // Update user preferences
  async updatePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      preferences: preferences,
    });
  },

  // Update user stats
  async updateStats(uid: string, stats: Partial<UserStats>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      stats: stats,
    });
  },

  // Get user profile
  async getProfile(uid: string): Promise<User | null> {
    return this.getUser(uid);
  },
};

// Social services
export const socialService = {
  // Create a new thread
  async createThread(thread: Omit<Thread, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const threadData = {
      ...thread,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'threads'), threadData);
    return docRef.id;
  },

  // Get threads with pagination
  async getThreads(limitCount: number = 20): Promise<Thread[]> {
    const q = query(
      collection(db, 'threads'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Thread[];
  },

  // Add comment to thread
  async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> {
    const commentData = {
      ...comment,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'comments'), commentData);
    return docRef.id;
  },

  // Get comments for a thread
  async getComments(threadId: string): Promise<Comment[]> {
    const q = query(
      collection(db, 'comments'),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Comment[];
  },

  // Send friend request
  async sendFriendRequest(userId: string, friendId: string): Promise<string> {
    const friendshipData = {
      userId,
      friendId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'friendships'), friendshipData);
    return docRef.id;
  },

  // Get friendships for a user
  async getFriendships(userId: string): Promise<Friendship[]> {
    const q = query(
      collection(db, 'friendships'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Friendship[];
  },
};

// Utility function to convert Firestore timestamp to Date
export const convertTimestamp = (timestamp: Timestamp | null): Date | null => {
  if (!timestamp) return null;
  return timestamp.toDate();
}; 