# 🚀 Quick Demo Deployment Guide

Deploy JobFlow quickly for public demo testing.

## ⚡ Fastest Deployment (5 minutes)

### 1. Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Railway will auto-detect the Python backend and create:
   - PostgreSQL database
   - Redis cache
   - Backend service

5. Set environment variables in Railway dashboard:
```bash
JWT_SECRET_KEY=your-secure-32-char-key
EXTENSION_SECRET=your-secure-32-char-key
CORS_ORIGINS=https://your-frontend.vercel.app
OPENAI_API_KEY=sk-your-openai-key-for-ai-features
```

6. Get your Railway backend URL (e.g., `https://jobflow-backend.up.railway.app`)

### 2. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import your GitHub repository
3. Set build settings:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Root Directory: `/` (leave default)

4. Add environment variable:
   - `VITE_API_URL` = Your Railway backend URL

5. Deploy! Your demo will be live at `https://your-project.vercel.app`

### 3. Update CORS Origins

Go back to Railway → Environment Variables and update:
```
CORS_ORIGINS=https://your-actual-vercel-url.vercel.app
```

## ✨ Demo Features

Your deployed demo includes:

- 🎯 **"Try Demo" button** with pre-loaded sample data
- 📊 **6 realistic job applications** from major companies
- 📈 **Analytics dashboard** with charts and insights
- 🔥 **Streak tracking** and goal setting
- 📱 **Mobile-responsive** PWA design
- 🌙 **Dark mode** support

## 🎯 Demo Flow for Users

1. Visit your Vercel URL
2. Click "Try Demo" 
3. Explore pre-loaded applications from Google, Netflix, Microsoft, etc.
4. Test all features without registration
5. Option to create account later to keep data

## 🔐 Security

- Demo data is client-side only
- No user accounts required for demo
- Privacy-first design
- All sensitive data excluded from demo

## 📝 Customization

To update demo data, edit `frontend/src/services/demoData.ts`

---

**Total deployment time: ~5 minutes** ⚡

Your JobFlow demo will be live and ready for user testing!