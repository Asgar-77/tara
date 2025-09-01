# 🚀 Vercel Deployment Guide

This guide will walk you through deploying your Eleven Voice Connect app to Vercel via GitHub.

## 📋 Prerequisites

1. **GitHub Account** - You need a GitHub account
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **ElevenLabs API Key** - Get from [elevenlabs.io](https://elevenlabs.io/)

## 🔧 Step-by-Step Deployment

### Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it `eleven-voice-connect`
   - Make it public or private
   - Don't initialize with README (we already have one)

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/eleven-voice-connect.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `eleven-voice-connect` repository

2. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

3. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add the following:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_ELEVENLABS_API_KEY` | `your_elevenlabs_api_key_here` | Production, Preview, Development |
   | `VITE_AGENT_ID` | `agent_01jz0yb4veemarp3sbqx2hgxy4` | Production, Preview, Development |

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project.vercel.app`

## 🔑 Getting Your ElevenLabs API Key

1. **Sign up/Login** at [elevenlabs.io](https://elevenlabs.io/)
2. **Go to Profile** → API Key
3. **Copy your API key**
4. **Add it to Vercel environment variables**

## 🌐 Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## 🔄 Automatic Deployments

- **Every push to `main`** will trigger a new deployment
- **Pull requests** will create preview deployments
- **Environment variables** are automatically included

## 🐛 Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure `vercel.json` is properly configured
- Check build logs in Vercel dashboard

### API Key Issues
- Verify API key is correct in Vercel environment variables
- Check ElevenLabs account has sufficient credits
- Test API key locally first

### Voice Not Working
- Ensure microphone permissions are granted
- Check browser supports WebRTC
- Verify agent ID is correct

## 📱 Testing Your Deployment

1. **Visit your Vercel URL**
2. **Grant microphone permission**
3. **Click the green call button**
4. **Test voice conversation with Tara**

## 🔧 Local Testing Before Deployment

```bash
# Test build locally
npm run build

# Test production build
npm run preview
```

## 📊 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Check for server-side errors
- **Real-time Logs**: Monitor during deployment

## 🚀 Performance Tips

- **CDN**: Vercel automatically serves static assets via CDN
- **Caching**: Configured in `vercel.json`
- **Optimization**: Vite automatically optimizes the build

---

**Need Help?** Check out:
- [Vercel Documentation](https://vercel.com/docs)
- [ElevenLabs Documentation](https://docs.elevenlabs.io/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
