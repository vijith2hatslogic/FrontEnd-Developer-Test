-- Create tables for the frontend developer test platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authentication table (simple password storage - in a real app, use Supabase Auth)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  password_hash TEXT NOT NULL
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  tech_stacks TEXT[] NOT NULL,
  total_time INTEGER NOT NULL,
  tasks JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  test_url TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_expired BOOLEAN DEFAULT FALSE
);

-- Test submissions table
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  years_of_experience TEXT NOT NULL,
  task_submissions JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);
CREATE INDEX IF NOT EXISTS idx_tests_test_url ON tests(test_url);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_auth_users_user_id ON auth_users(user_id);

-- Insert admin user (using SHA-256 hash of 'admin123')
INSERT INTO users (id, name, email, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin',
  'admin@example.com',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Insert admin credentials (SHA-256 hash of 'admin123')
INSERT INTO auth_users (user_id, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
)
ON CONFLICT (user_id) DO NOTHING;