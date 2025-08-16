# Quick Deployment Guide

## Deploy to Vercel in 3 Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial shared counters app"
git push origin main
```

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository
- Vercel will auto-detect Next.js settings

### 3. Deploy
- Click "Deploy"
- Your app will be live in ~2 minutes!

## Alternative: Vercel CLI
```bash
npm i -g vercel
vercel
```

## What's Included
- ✅ Next.js 15 with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ API routes for counter operations
- ✅ JSON file-based persistence
- ✅ Responsive design
- ✅ Real-time updates

## Post-Deployment
- Your app will be available at `https://your-project.vercel.app`
- All API endpoints will work automatically
- Data persists across deployments

## Production Notes
- For high-traffic apps, consider upgrading to Vercel KV or a database
- Monitor function execution times in Vercel dashboard
- Set up custom domain if needed
