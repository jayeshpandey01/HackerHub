import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  userType: 'doctor' | 'patient';
  firstName: string;
  lastName: string;
  specialization?: string[];
  patientType?: string[];
  createdAt: string;
  lastLoginAt: string;
  profileCompleted: boolean;
  hasSeenWelcome: boolean;
}

export interface MedicalProfile {
  userId: string;
  diseases?: string[];
  customDiseases?: string[];
  allergies?: string[];
  medications?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  doctorInfo?: {
    licenseNumber?: string;
    hospitalAffiliation?: string;
    yearsOfExperience?: number;
    consultationFee?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: any;
  timestamp: string;
  category: 'login' | 'profile_update' | 'consultation' | 'health_data' | 'system';
}

export interface DatabaseState {
  users: { [key: string]: UserProfile };
  medicalProfiles: { [key: string]: MedicalProfile };
  activities: ActivityLog[];
  appSettings: {
    firstTimeUser: boolean;
    lastBackupDate?: string;
  };
}

class DatabaseService {
  private static instance: DatabaseService;
  private readonly STORAGE_KEY = 'swap_health_database';
  private readonly BACKUP_KEY = 'swap_health_backup';

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize database
  async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing database...');
      const existingData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!existingData) {
        console.log('No existing data, creating initial database');
        const initialData: DatabaseState = {
          users: {},
          medicalProfiles: {},
          activities: [],
          appSettings: {
            firstTimeUser: true
          }
        };
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
        console.log('Initial database created');
        
        // Don't log activity during initialization to avoid recursion
        try {
          await this.logActivity('system', 'database_initialized', { timestamp: new Date().toISOString() });
        } catch (logError) {
          console.warn('Failed to log initialization activity:', logError);
        }
      } else {
        console.log('Database already exists');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Don't throw error, just log it and continue
      console.warn('Continuing without database initialization');
    }
  }

  // Get database state
  private async getDatabase(): Promise<DatabaseState> {
    try {
      console.log('Getting database...');
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        console.log('No database found, initializing...');
        await this.initializeDatabase();
        return this.getDatabase();
      }
      const parsedData = JSON.parse(data);
      console.log('Database loaded, users count:', Object.keys(parsedData.users || {}).length);
      return parsedData;
    } catch (error) {
      console.error('Failed to get database:', error);
      // Return a default database structure instead of throwing
      return {
        users: {},
        medicalProfiles: {},
        activities: [],
        appSettings: {
          firstTimeUser: true
        }
      };
    }
  }

  // Save database state
  private async saveDatabase(data: DatabaseState): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      // Create backup every 10 activities
      if (data.activities.length % 10 === 0) {
        await this.createBackup(data);
      }
    } catch (error) {
      console.error('Failed to save database:', error);
      throw new Error('Failed to save to database');
    }
  }

  // Create backup
  private async createBackup(data: DatabaseState): Promise<void> {
    try {
      const backupData = {
        ...data,
        backupTimestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));
      
      // Update backup date in settings
      data.appSettings.lastBackupDate = new Date().toISOString();
      await this.saveDatabase(data);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // User Management
  async createUser(userData: Omit<UserProfile, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<UserProfile> {
    try {
      const db = await this.getDatabase();
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: UserProfile = {
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profileCompleted: false,
        hasSeenWelcome: false
      };

      db.users[userId] = newUser;
      db.appSettings.firstTimeUser = false;
      await this.saveDatabase(db);

      await this.logActivity(userId, 'user_created', {
        userType: userData.userType,
        email: userData.email
      });

      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user account');
    }
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      console.log('Getting user by email:', email);
      const db = await this.getDatabase();
      const user = Object.values(db.users).find(u => u.email.toLowerCase() === email.toLowerCase());
      console.log('User found:', !!user);
      return user || null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const db = await this.getDatabase();
      if (!db.users[userId]) {
        throw new Error('User not found');
      }

      db.users[userId] = { ...db.users[userId], ...updates };
      await this.saveDatabase(db);

      await this.logActivity(userId, 'user_updated', updates);

      return db.users[userId];
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error('Failed to update user');
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { lastLoginAt: new Date().toISOString() });
      await this.logActivity(userId, 'user_login', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  async markWelcomeAsSeen(userId: string): Promise<void> {
    try {
      await this.updateUser(userId, { hasSeenWelcome: true });
      await this.logActivity(userId, 'welcome_completed', { timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to mark welcome as seen:', error);
    }
  }

  async markGlobalWelcomeAsSeen(): Promise<void> {
    try {
      const db = await this.getDatabase();
      db.appSettings.firstTimeUser = false;
      await this.saveDatabase(db);
    } catch (error) {
      console.error('Failed to mark global welcome as seen:', error);
    }
  }

  // Medical Profile Management
  async createMedicalProfile(userId: string, profileData: Omit<MedicalProfile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<MedicalProfile> {
    try {
      const db = await this.getDatabase();
      
      const medicalProfile: MedicalProfile = {
        ...profileData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.medicalProfiles[userId] = medicalProfile;
      await this.saveDatabase(db);

      // Mark user profile as completed
      await this.updateUser(userId, { profileCompleted: true });

      await this.logActivity(userId, 'medical_profile_created', {
        profileType: db.users[userId]?.userType,
        hasData: Object.keys(profileData).length > 0
      });

      return medicalProfile;
    } catch (error) {
      console.error('Failed to create medical profile:', error);
      throw new Error('Failed to create medical profile');
    }
  }

  async getMedicalProfile(userId: string): Promise<MedicalProfile | null> {
    try {
      const db = await this.getDatabase();
      return db.medicalProfiles[userId] || null;
    } catch (error) {
      console.error('Failed to get medical profile:', error);
      return null;
    }
  }

  async updateMedicalProfile(userId: string, updates: Partial<MedicalProfile>): Promise<MedicalProfile> {
    try {
      const db = await this.getDatabase();
      if (!db.medicalProfiles[userId]) {
        throw new Error('Medical profile not found');
      }

      db.medicalProfiles[userId] = {
        ...db.medicalProfiles[userId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await this.saveDatabase(db);

      await this.logActivity(userId, 'medical_profile_updated', updates);

      return db.medicalProfiles[userId];
    } catch (error) {
      console.error('Failed to update medical profile:', error);
      throw new Error('Failed to update medical profile');
    }
  }

  // Activity Logging
  async logActivity(userId: string, action: string, details: any, category: ActivityLog['category'] = 'system'): Promise<void> {
    try {
      const db = await this.getDatabase();
      
      const activity: ActivityLog = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        category
      };

      db.activities.push(activity);
      
      // Keep only last 1000 activities to prevent storage bloat
      if (db.activities.length > 1000) {
        db.activities = db.activities.slice(-1000);
      }

      await this.saveDatabase(db);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async getUserActivities(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const db = await this.getDatabase();
      return db.activities
        .filter(activity => activity.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }

  // App Settings
  async isFirstTimeUser(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      return db.appSettings.firstTimeUser;
    } catch (error) {
      console.error('Failed to check first time user:', error);
      return true;
    }
  }

  async shouldShowWelcome(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        return await this.isFirstTimeUser();
      }
      
      const db = await this.getDatabase();
      const user = db.users[userId];
      return !user?.hasSeenWelcome;
    } catch (error) {
      console.error('Failed to check welcome status:', error);
      return true;
    }
  }

  // Data Export/Import
  async exportUserData(userId: string): Promise<string> {
    try {
      const db = await this.getDatabase();
      const userData = {
        user: db.users[userId],
        medicalProfile: db.medicalProfiles[userId],
        activities: db.activities.filter(a => a.userId === userId),
        exportTimestamp: new Date().toISOString()
      };

      await this.logActivity(userId, 'data_exported', { timestamp: new Date().toISOString() });

      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export data');
    }
  }

  // Database Statistics
  async getDatabaseStats(): Promise<any> {
    try {
      const db = await this.getDatabase();
      return {
        totalUsers: Object.keys(db.users).length,
        totalDoctors: Object.values(db.users).filter(u => u.userType === 'doctor').length,
        totalPatients: Object.values(db.users).filter(u => u.userType === 'patient').length,
        totalProfiles: Object.keys(db.medicalProfiles).length,
        totalActivities: db.activities.length,
        lastBackupDate: db.appSettings.lastBackupDate,
        databaseSize: JSON.stringify(db).length
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {};
    }
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem(this.BACKUP_KEY);
      await this.initializeDatabase();
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('Failed to clear database');
    }
  }

  // Reset welcome status (for testing)
  async resetWelcomeStatus(): Promise<void> {
    try {
      const db = await this.getDatabase();
      db.appSettings.firstTimeUser = true;
      
      // Reset all users' welcome status
      Object.keys(db.users).forEach(userId => {
        db.users[userId].hasSeenWelcome = false;
      });
      
      await this.saveDatabase(db);
    } catch (error) {
      console.error('Failed to reset welcome status:', error);
      throw new Error('Failed to reset welcome status');
    }
  }
}

export const databaseService = DatabaseService.getInstance();