#!/bin/bash

# Database Setup Script for sync-counter
# This script helps set up the required database tables for the sync-counter application

echo "=== Sync Counter Database Setup ==="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please copy .env.dev to .env.local and configure your Supabase credentials:"
    echo "cp .env.dev .env.local"
    echo ""
    echo "Then edit .env.local with your Supabase URL and keys from:"
    echo "https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    exit 1
fi

echo "✅ .env.local file found"

# Check if Supabase credentials are configured
if ! grep -q "SYNC_COUNTER_SUPABASE_URL" .env.local; then
    echo "❌ Supabase credentials not found in .env.local"
    echo "Please add your Supabase URL and keys to .env.local"
    exit 1
fi

echo "✅ Supabase credentials configured"

# Extract Supabase URL
SUPABASE_URL=$(grep "SYNC_COUNTER_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
echo "📍 Supabase URL: ${SUPABASE_URL}"

echo ""
echo "🔧 Next steps:"
echo "1. Go to your Supabase dashboard: ${SUPABASE_URL}"
echo "2. Navigate to SQL Editor"
echo "3. Run the SQL from database-setup.sql:"
echo ""
cat database-setup.sql
echo ""
echo "4. Or copy and paste this SQL into your Supabase SQL Editor:"
echo ""
echo "--- COPY AND PASTE THIS SQL ---"
cat database-setup.sql
echo "--- END SQL ---"
echo ""
echo "5. After running the SQL, restart your development server:"
echo "npm run dev"
echo ""
echo "🎉 Your database should now be ready!"
