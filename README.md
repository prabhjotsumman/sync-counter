# Sync Counter

A real-time collaborative counter application built with Next.js, React, and Supabase.

## Features

- 📊 Real-time counter tracking with daily goals
- 👥 Multi-user support with user colors
- 📱 Responsive design for all devices
- 🔄 Automatic daily reset at 19:20 UTC
- 💾 Offline support with local storage
- 🌐 Real-time synchronization across devices

## Quick Start

### 1. Environment Setup

Copy the environment file and configure your Supabase credentials:

```bash
cp .env.dev .env.local
```

Edit `.env.local` with your Supabase credentials from [Supabase Dashboard](https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api).

### 2. Database Setup

The application requires a `counters` table in Supabase. Run the database setup script:

```bash
bash setup-db.sh
```

This will show you the SQL commands to run in your Supabase SQL Editor.

**Important**: Copy and paste the SQL from the script output into your Supabase SQL Editor and run it.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Database Schema

The `counters` table includes:
- `id` (text, primary key) - Unique counter identifier
- `name` (text) - Counter display name
- `value` (integer) - Current counter value
- `dailyGoal` (integer, optional) - Daily target value
- `dailyCount` (integer) - Current progress toward daily goal
- `users` (jsonb) - Per-user contribution tracking
- `history` (jsonb) - Historical data by date
- `lastUpdated` (bigint) - Timestamp of last update

## API Endpoints

- `GET /api/counters` - Fetch all counters
- `POST /api/counters` - Create a new counter
- `PUT /api/counters/:id` - Update a counter
- `DELETE /api/counters/:id` - Delete a counter
- `POST /api/counters/:id/increment` - Increment counter value

## Troubleshooting

### 500 Internal Server Error

If you get a 500 error when creating counters, it's likely the database table doesn't exist. Make sure to:

1. Run the SQL setup in Supabase SQL Editor
2. Check that the `counters` table exists in your Supabase project
3. Verify your Supabase credentials in `.env.local`

### Offline Mode

The app supports offline functionality using local storage. If the server is unavailable, it will automatically switch to offline mode.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and API clients
├── providers/       # React context providers
└── types/           # TypeScript type definitions
```

## License

MIT License - see LICENSE file for details.