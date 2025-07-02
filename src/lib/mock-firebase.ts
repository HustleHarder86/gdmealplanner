// Mock Firebase implementation for development/deployment without credentials
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// Mock Auth
class MockAuth {
  private currentUser: MockUser | null = null;
  private listeners: ((user: MockUser | null) => void)[] = [];

  constructor() {
    // Check localStorage for existing session
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('mockUser');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    // Mock successful login
    const user: MockUser = {
      uid: 'mock-' + Date.now(),
      email,
      displayName: email.split('@')[0]
    };
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(user));
    }
    this.notifyListeners();
    return { user };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    return this.signInWithEmailAndPassword(email, password);
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser');
    }
    this.notifyListeners();
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

// Mock Firestore
class MockFirestore {
  private data: Record<string, Record<string, any>> = {
    users: {},
    recipes: {
      'recipe-1': {
        id: 'recipe-1',
        title: 'Quinoa Power Bowl',
        description: 'Nutrient-dense bowl perfect for managing blood sugar',
        category: 'lunch',
        prepTime: 20,
        cookTime: 15,
        servings: 2,
        ingredients: [
          '1 cup quinoa',
          '2 cups vegetable broth',
          '1 cup chickpeas',
          '2 cups spinach',
          '1 avocado',
          '2 tbsp tahini'
        ],
        instructions: [
          'Cook quinoa in vegetable broth',
          'Sauté chickpeas with spices',
          'Assemble bowl with quinoa, chickpeas, spinach',
          'Top with avocado and tahini dressing'
        ],
        nutrition: {
          calories: 420,
          protein: 18,
          carbs: 45,
          fat: 20,
          fiber: 12,
          sugar: 4
        },
        tags: ['vegetarian', 'high-fiber', 'meal-prep'],
        isPublic: true,
        createdAt: new Date().toISOString()
      },
      'recipe-2': {
        id: 'recipe-2',
        title: 'Overnight Chia Pudding',
        description: 'Easy breakfast with stable energy release',
        category: 'breakfast',
        prepTime: 10,
        cookTime: 0,
        servings: 1,
        ingredients: [
          '3 tbsp chia seeds',
          '1 cup unsweetened almond milk',
          '1 tsp vanilla extract',
          '1/4 cup berries',
          '1 tbsp chopped nuts'
        ],
        instructions: [
          'Mix chia seeds with almond milk and vanilla',
          'Refrigerate overnight',
          'Top with berries and nuts before serving'
        ],
        nutrition: {
          calories: 280,
          protein: 10,
          carbs: 24,
          fat: 16,
          fiber: 14,
          sugar: 8
        },
        tags: ['no-cook', 'make-ahead', 'dairy-free'],
        isPublic: true,
        createdAt: new Date().toISOString()
      }
    },
    mealPlans: {},
    glucoseReadings: {},
    nutritionLogs: {}
  };

  collection(name: string) {
    return {
      doc: (id?: string) => ({
        get: async () => {
          const docId = id || 'generated-' + Date.now();
          const data = this.data[name]?.[docId];
          return {
            exists: () => !!data,
            data: () => data,
            id: docId
          };
        },
        set: async (data: any) => {
          const docId = id || 'generated-' + Date.now();
          if (!this.data[name]) this.data[name] = {};
          this.data[name][docId] = { ...data, id: docId };
          return docId;
        },
        update: async (data: any) => {
          const docId = id || 'generated-' + Date.now();
          if (this.data[name]?.[docId]) {
            this.data[name][docId] = { ...this.data[name][docId], ...data };
          }
        },
        delete: async () => {
          const docId = id || 'generated-' + Date.now();
          if (this.data[name]?.[docId]) {
            delete this.data[name][docId];
          }
        }
      }),
      where: () => ({
        get: async () => ({
          docs: Object.values(this.data[name] || {}).map(doc => ({
            data: () => doc,
            id: doc.id
          }))
        })
      }),
      add: async (data: any) => {
        const id = 'generated-' + Date.now();
        if (!this.data[name]) this.data[name] = {};
        this.data[name][id] = { ...data, id };
        return { id };
      }
    };
  }

  // Helper to get all data (for debugging)
  getAllData() {
    return this.data;
  }
}

// Mock Storage
class MockStorage {
  async uploadBytes(path: string, file: File): Promise<{ ref: { fullPath: string } }> {
    console.log('Mock upload:', path, file.name);
    return {
      ref: { fullPath: path }
    };
  }

  async getDownloadURL(path: string): Promise<string> {
    // Return a placeholder image URL
    return 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(path.split('/').pop() || 'Image');
  }

  ref(path: string) {
    return {
      child: (childPath: string) => this.ref(`${path}/${childPath}`),
      delete: async () => console.log('Mock delete:', path)
    };
  }
}

// Export mock instances
export const mockAuth = new MockAuth();
export const mockDb = new MockFirestore();
export const mockStorage = new MockStorage();

// Mock Firebase app
export const mockApp = {
  name: 'mock-firebase-app',
  options: {}
};