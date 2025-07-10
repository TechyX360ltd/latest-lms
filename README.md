# TECHYX 360 Learning Management System

A comprehensive Learning Management System built with React, TypeScript, and Supabase.

## Features

- User authentication and role-based access control
- Course management and enrollment
- Learning progress tracking
- Assignment submission and grading
- Notification system
- Certificate generation
- Analytics dashboard
- Mobile-responsive design

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Supabase for backend and database

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (optional - app works in offline mode)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/techyx-360-lms.git
   cd techyx-360-lms
   ```

2. Install dependencies
   ```
   npm install
   ```

3. **Optional: Set up Supabase (for production use)**
   - Sign up for Supabase at https://supabase.com
   - Create a new project
   - Get your project URL and anon key
   - Create a `.env` file in the root directory with:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Run the SQL migrations in the `supabase/migrations` folder

4. **Start the development server**
   ```
   npm run dev
   ```

## Offline Mode

The app is designed to work **without Supabase** in development mode:
- Uses localStorage for data persistence
- Includes mock data for testing
- Shows "Using Local Storage" status indicator
- All features work locally

## Demo Accounts

The app includes demo accounts for testing:

**Learner Account:**
- Email: `john@example.com`
- Password: `password`

**Admin Account:**
- Email: `admin@example.com`
- Password: `password`

## Deployment

The application is deployed on Netlify at https://funny-kheer-26acae.netlify.app

## License

MIT