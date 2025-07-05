declare namespace NodeJS {
  interface ProcessEnv {
    // Firebase Client Configuration
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    
    // Spoonacular API Configuration
    SPOONACULAR_API_KEY: string;
    
    // Firebase Admin Configuration
    FIREBASE_ADMIN_KEY?: string;
    
    // Recipe Import Campaign Configuration
    CAMPAIGN_START_DATE?: string;
    
    // Optional: Notification webhook for import reports
    NOTIFICATION_WEBHOOK?: string;
  }
}