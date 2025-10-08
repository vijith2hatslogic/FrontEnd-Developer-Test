import { nanoid } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { supabase, supabaseAdmin } from './supabase'
import * as crypto from 'crypto'

// Types
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  description?: string
}

export interface Task {
  type: 'coding' | 'ui-implementation' | 'debugging' | 'optimization' | 'thought-process'
  title: string
  description: string
  timeAllotted: number
  codeSnippet?: string
  expectedOutput?: string
  designImageUrl?: string
  requiresJavaScript?: boolean
  testCases?: TestCase[]
}

export interface Test {
  id: string
  title: string
  description: string
  experienceLevel: string
  techStacks: string[]
  totalTime: number
  tasks: Task[]
  createdAt: string
  testUrl: string
  createdBy: string
  submissions: TestSubmission[]
}

export interface TaskSubmission {
  taskId: number
  answer: string
  codeSubmission?: string
  htmlImplementation?: string
  cssImplementation?: string
  jsImplementation?: string
  thoughtProcess?: string
  testResults?: {
    passed: boolean
    message?: string
    executionTime?: number
  }[]
}

export interface TestSubmission {
  id: string
  candidateName: string
  candidateEmail: string
  candidatePhone?: string
  yearsOfExperience: string
  taskSubmissions: TaskSubmission[]
  submittedAt: string
  timeSpent: number
}

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
};

// Storage service
export const storageService = {
  // Auth
  getCurrentUser: async (): Promise<User | null> => {
    // First try to get from localStorage for client-side persistence
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
    try {
      // Get user by email
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      if (userError || !users || users.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      const user = users[0];
      
      // Get auth info
      const { data: authData, error: authError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      if (authError || !authData || authData.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      // Check password
      const hashedPassword = hashPassword(password);
      if (hashedPassword !== authData[0].password_hash) {
        throw new Error('Invalid email or password');
      }
      
      // Convert to our User type
      const loggedInUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      };
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      }
      
      return loggedInUser;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (name: string, email: string, password: string): Promise<User> => {
    try {
      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Email already in use');
      }
      
      // Create user
      const userId = uuidv4();
      const hashedPassword = hashPassword(password);
      
      // Insert user
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          name,
          email,
          created_at: new Date().toISOString()
        });
      
      if (userError) {
        throw userError;
      }
      
      // Insert auth info
      const { error: authError } = await supabase
        .from('auth_users')
        .insert({
          user_id: userId,
          password_hash: hashedPassword
        });
      
      if (authError) {
        // Rollback user creation
        await supabase
          .from('users')
          .delete()
          .eq('id', userId);
          
        throw authError;
      }
      
      // Create user object
      const newUser: User = {
        id: userId,
        name,
        email,
        createdAt: new Date().toISOString()
      };
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(newUser));
      }
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
    return Promise.resolve();
  },
  
  // Tests
  getTests: async (userId?: string): Promise<Test[]> => {
    try {
      let query = supabase
        .from('tests')
        .select('*, test_submissions(*)');
      
      if (userId) {
        query = query.eq('created_by', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Convert to our Test type
      return (data || []).map(test => ({
        id: test.id,
        title: test.title,
        description: test.description,
        experienceLevel: test.experience_level,
        techStacks: test.tech_stacks,
        totalTime: test.total_time,
        tasks: test.tasks as Task[],
        createdAt: test.created_at,
        testUrl: test.test_url,
        createdBy: test.created_by,
        submissions: (test.test_submissions || []).map((submission: {
          id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone?: string;
          years_of_experience: string;
          task_submissions: TaskSubmission[];
          submitted_at: string;
          time_spent: number;
        }) => ({
          id: submission.id,
          candidateName: submission.candidate_name,
          candidateEmail: submission.candidate_email,
          candidatePhone: submission.candidate_phone,
          yearsOfExperience: submission.years_of_experience,
          taskSubmissions: submission.task_submissions as TaskSubmission[],
          submittedAt: submission.submitted_at,
          timeSpent: submission.time_spent
        }))
      }));
    } catch (error) {
      console.error('Error fetching tests:', error);
      return [];
    }
  },
  
  getTestById: async (testId: string): Promise<Test | null> => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, test_submissions(*)')
        .eq('id', testId)
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // Convert to our Test type
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        experienceLevel: data.experience_level,
        techStacks: data.tech_stacks,
        totalTime: data.total_time,
        tasks: data.tasks as Task[],
        createdAt: data.created_at,
        testUrl: data.test_url,
        createdBy: data.created_by,
        submissions: (data.test_submissions || []).map((submission: {
          id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone?: string;
          years_of_experience: string;
          task_submissions: TaskSubmission[];
          submitted_at: string;
          time_spent: number;
        }) => ({
          id: submission.id,
          candidateName: submission.candidate_name,
          candidateEmail: submission.candidate_email,
          candidatePhone: submission.candidate_phone,
          yearsOfExperience: submission.years_of_experience,
          taskSubmissions: submission.task_submissions as TaskSubmission[],
          submittedAt: submission.submitted_at,
          timeSpent: submission.time_spent
        }))
      };
    } catch (error) {
      console.error('Error fetching test by ID:', error);
      return null;
    }
  },
  
  getTestByUrl: async (testUrl: string): Promise<Test | null> => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, test_submissions(*)')
        .eq('test_url', testUrl)
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // Convert to our Test type
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        experienceLevel: data.experience_level,
        techStacks: data.tech_stacks,
        totalTime: data.total_time,
        tasks: data.tasks as Task[],
        createdAt: data.created_at,
        testUrl: data.test_url,
        createdBy: data.created_by,
        submissions: (data.test_submissions || []).map((submission: {
          id: string;
          candidate_name: string;
          candidate_email: string;
          candidate_phone?: string;
          years_of_experience: string;
          task_submissions: TaskSubmission[];
          submitted_at: string;
          time_spent: number;
        }) => ({
          id: submission.id,
          candidateName: submission.candidate_name,
          candidateEmail: submission.candidate_email,
          candidatePhone: submission.candidate_phone,
          yearsOfExperience: submission.years_of_experience,
          taskSubmissions: submission.task_submissions as TaskSubmission[],
          submittedAt: submission.submitted_at,
          timeSpent: submission.time_spent
        }))
      };
    } catch (error) {
      console.error('Error fetching test by URL:', error);
      return null;
    }
  },
  
  createTest: async (testData: Omit<Test, 'id' | 'createdAt' | 'testUrl' | 'submissions'>): Promise<Test> => {
    try {
      const testId = uuidv4();
      const testUrl = nanoid(10); // We can keep nanoid for the URL as it's not a UUID in the database
      const createdAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('tests')
        .insert({
          id: testId,
          title: testData.title,
          description: testData.description,
          experience_level: testData.experienceLevel,
          tech_stacks: testData.techStacks,
          total_time: testData.totalTime,
          tasks: testData.tasks,
          created_at: createdAt,
          test_url: testUrl,
          created_by: testData.createdBy
        });
      
      if (error) {
        throw error;
      }
      
      // Return the created test
      return {
        ...testData,
        id: testId,
        createdAt,
        testUrl,
        submissions: []
      };
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  },
  
  updateTest: async (testId: string, testData: Partial<Test>): Promise<Test> => {
    try {
      // Prepare data for Supabase
      const updateData: Record<string, unknown> = {};
      
      if (testData.title) updateData.title = testData.title;
      if (testData.description) updateData.description = testData.description;
      if (testData.experienceLevel) updateData.experience_level = testData.experienceLevel;
      if (testData.techStacks) updateData.tech_stacks = testData.techStacks;
      if (testData.totalTime) updateData.total_time = testData.totalTime;
      if (testData.tasks) updateData.tasks = testData.tasks;
      
      const { error } = await supabase
        .from('tests')
        .update(updateData)
        .eq('id', testId);
      
      if (error) {
        throw error;
      }
      
      // Get the updated test
      const updatedTest = await storageService.getTestById(testId);
      
      if (!updatedTest) {
        throw new Error('Test not found after update');
      }
      
      return updatedTest;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  },
  
  duplicateTest: async (testId: string, userId: string): Promise<Test> => {
    try {
      // Get the original test
      const originalTest = await storageService.getTestById(testId);
      
      if (!originalTest) {
        throw new Error('Test not found');
      }
      
      // Create a new test with the same data but a new ID and URL
      const duplicatedTest = await storageService.createTest({
        title: `${originalTest.title} (Copy)`,
        description: originalTest.description,
        experienceLevel: originalTest.experienceLevel,
        techStacks: originalTest.techStacks,
        totalTime: originalTest.totalTime,
        tasks: originalTest.tasks,
        createdBy: userId
      });
      
      return duplicatedTest;
    } catch (error) {
      console.error('Error duplicating test:', error);
      throw error;
    }
  },
  
  addSubmission: async (testId: string, submission: Omit<TestSubmission, 'id' | 'submittedAt'>): Promise<TestSubmission> => {
    try {
      const submissionId = uuidv4();
      const submittedAt = new Date().toISOString();
      
      // Start a transaction to add submission and expire the test URL
      const { data, error: submissionError } = await supabase
        .from('test_submissions')
        .insert({
          id: submissionId,
          test_id: testId,
          candidate_name: submission.candidateName,
          candidate_email: submission.candidateEmail,
          candidate_phone: submission.candidatePhone || null,
          years_of_experience: submission.yearsOfExperience,
          task_submissions: submission.taskSubmissions,
          submitted_at: submittedAt,
          time_spent: submission.timeSpent
        })
        .select();
      
      if (submissionError) {
        throw submissionError;
      }
      
      // Expire the test URL
      const { error: updateError } = await supabase
        .from('tests')
        .update({ is_expired: true })
        .eq('id', testId);
      
      if (updateError) {
        console.error('Error expiring test URL:', updateError);
        // We don't throw here to still return the submission
      }
      
      // Return the created submission
      return {
        ...submission,
        id: submissionId,
        submittedAt
      };
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  },
  
  // Method to check if a test URL is expired
  isTestExpired: async (testUrl: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('is_expired')
        .eq('test_url', testUrl)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - test URL doesn't exist
          return true;
        }
        console.error('Error checking if test is expired:', error);
        return false; // Don't treat as expired if there's a server error
      }
      
      if (!data) {
        return false; // No data but no error means test exists but has no expiration info
      }
      
      return data.is_expired === true;
    } catch (error) {
      console.error('Error checking if test is expired:', error);
      return false; // Default to not expired on error to allow access
    }
  }
}