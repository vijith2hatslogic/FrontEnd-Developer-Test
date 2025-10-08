import { User } from './storage';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Default admin user
const DEFAULT_ADMIN: User = {
  id: '1',
  name: 'Admin',
  email: 'admin@example.com',
  createdAt: new Date().toISOString()
};

// Default admin password (hashed)
const DEFAULT_PASSWORD = 'admin123';

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
};

// Local storage service
export const localStorageService = {
  // Initialize local storage with default admin
  init: (): void => {
    if (typeof window !== 'undefined') {
      // Check if users are already initialized
      const users = localStorage.getItem('users');
      if (!users) {
        // Store default admin user
        localStorage.setItem('users', JSON.stringify([DEFAULT_ADMIN]));
        
        // Store admin credentials
        localStorage.setItem('credentials', JSON.stringify([{
          userId: DEFAULT_ADMIN.id,
          passwordHash: hashPassword(DEFAULT_PASSWORD)
        }]));
      }
    }
  },

  // Auth
  getCurrentUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        try {
          return JSON.parse(userStr) as User;
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }
    return null;
  },
  
  login: async (email: string, password: string): Promise<User> => {
    if (typeof window === 'undefined') {
      throw new Error('Cannot access localStorage on server side');
    }

    try {
      // Initialize if not already done
      localStorageService.init();
      
      // Get users
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) as User[] : [];
      
      // Find user by email
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Get credentials
      const credentialsStr = localStorage.getItem('credentials');
      const credentials = credentialsStr ? JSON.parse(credentialsStr) as Array<{userId: string, passwordHash: string}> : [];
      
      // Find user credentials
      const userCreds = credentials.find(c => c.userId === user.id);
      if (!userCreds) {
        throw new Error('Invalid email or password');
      }
      
      // Check password
      const hashedPassword = hashPassword(password);
      if (hashedPassword !== userCreds.passwordHash) {
        throw new Error('Invalid email or password');
      }
      
      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    return Promise.resolve();
  }
};
