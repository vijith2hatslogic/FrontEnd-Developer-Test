# Front-end Developer Test Platform

A platform for creating and administering front-end developer tests. This application allows recruiters to create customized tests based on experience level, tech stacks, and specific requirements.

## Login Credentials

The application is configured for a single admin recruiter:

- **Email**: admin@example.com
- **Password**: admin123

## Features

- **Authentication**: Secure login for test creators
- **Test Creation**: Build customized tests with various task types:
  - Coding challenges
  - UI implementation tasks
  - Debugging exercises
  - Optimization problems
  - Thought process evaluation
- **Shareable URLs**: Generate unique URLs for candidates to take tests
- **Real-time Preview**: Live preview for UI implementation tasks
- **Email Notifications**: Automatic email notifications to recruiters when tests are completed
- **Time Tracking**: Monitor time spent by candidates on each task

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- UnoCSS (Atomic CSS utility)
- Local Storage for data persistence
- EmailJS for email notifications
- React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- EmailJS account (optional, for email notifications)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd frontend-dev-test
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables (optional for EmailJS)
   Copy the `env.local.example` file to `.env.local` and fill in your EmailJS credentials if you want to enable email notifications:
   ```bash
   cp env.local.example .env.local
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Set up the environment variables in Vercel dashboard
4. Deploy

## Project Structure

- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and Firebase configuration
- `/src/components/auth` - Authentication components
- `/src/components/tasks` - Task-specific components

## License

MIT