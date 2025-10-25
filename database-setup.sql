-- Database setup for sync-counter application
-- This file contains the SQL commands to set up the required database tables

-- Create counters table
CREATE TABLE IF NOT EXISTS public.counters (
    id text PRIMARY KEY,
    name text NOT NULL,
    value integer NOT NULL DEFAULT 0,
    lastUpdated bigint,
    dailyGoal integer,
    dailyCount integer DEFAULT 0,
    users jsonb,
    history jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- (Since this is a public counter app, allowing read/write for all)
CREATE POLICY "Allow all operations on counters" ON public.counters
    FOR ALL USING (true)
    WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_counters_name ON public.counters(name);
CREATE INDEX IF NOT EXISTS idx_counters_lastUpdated ON public.counters(lastUpdated);

-- Grant necessary permissions
GRANT ALL ON public.counters TO anon;
GRANT ALL ON public.counters TO authenticated;
GRANT ALL ON public.counters TO service_role;