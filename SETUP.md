# Frontend Developer Test Platform Setup

This document provides instructions for setting up the Frontend Developer Test Platform with Resend for email functionality and Supabase for database storage.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- A Resend account

## Setting Up Supabase

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)

2. Once your project is created, go to the SQL Editor and run the migration script located at `supabase/migrations/20251007_initial_schema.sql`

3. Get your Supabase URL and API keys:
   - Go to Project Settings > API
   - Copy the "Project URL" - this is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon" public key - this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the "service_role" secret key - this is your `SUPABASE_SERVICE_ROLE_KEY`

## Setting Up Resend

1. Create a Resend account at [https://resend.com](https://resend.com)

2. Create an API key:
   - Go to the API Keys section in your Resend dashboard
   - Create a new API key
   - Copy the API key - this is your `RESEND_API_KEY`

## Environment Variables

1. Create a `.env.local` file in the root of the project by copying the example:
   ```
   cp env.local.example .env.local
   ```

2. Fill in the environment variables in `.env.local`:
   ```
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Email Configuration (Resend)
   RESEND_API_KEY=your-resend-api-key

   # Admin Email
   NEXT_PUBLIC_ADMIN_EMAIL=your-admin-email@example.com

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

## Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Creating an Admin User

To create your first admin user, you can use the Supabase SQL Editor to run the following SQL:

```sql
-- Insert a user
INSERT INTO users (id, name, email, created_at)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@example.com',
  NOW()
);

-- Get the user ID
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM users WHERE email = 'admin@example.com';
  
  -- Insert auth info with password 'adminpassword'
  -- Note: In production, use a proper password hashing library
  INSERT INTO auth_users (user_id, password_hash)
  VALUES (
    user_id,
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' -- SHA-256 hash of 'admin'
  );
END $$;
```

This creates an admin user with:
- Email: admin@example.com
- Password: admin

**Note:** For production use, implement a proper authentication system with Supabase Auth.
