# 🚀 Netlify Deployment Guide

## 📋 Prerequisites
- Netlify account
- Your Razorpay live keys
- Firebase project configured

## 🔧 Build Configuration

### **1. Build Commands:**
```bash
# Development build
npm run build:dev

# Production build (recommended for Netlify)
npm run build:prod

# Preview production build locally
npm run preview:build
```

### **2. Environment Variables:**
Create `.env.local` with your production keys:
```env
VITE_RAZORPAY_KEY_ID=rzp_live_your_actual_live_key
VITE_RAZORPAY_SECRET_KEY=your_actual_live_secret_key
# ... other variables
```

## 🚀 Deployment Steps

### **Method 1: Drag & Drop (Quick)**
1. **Build your project:**
   ```bash
   npm run build:prod
   ```
2. **Go to [Netlify](https://app.netlify.com/)**
3. **Drag `dist/` folder** to Netlify
4. **Set environment variables** in site settings

### **Method 2: Git Integration (Recommended)**
1. **Push code to GitHub**
2. **Connect repository** in Netlify
3. **Set build settings:**
   - Build command: `npm run build:prod`
   - Publish directory: `dist`
4. **Deploy automatically**

## ⚙️ Netlify Configuration

### **Environment Variables (Required):**
Go to **Site Settings** → **Environment Variables**:
```
VITE_RAZORPAY_KEY_ID=rzp_live_your_key
VITE_RAZORPAY_SECRET_KEY=your_secret
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
VITE_AGENT_ID=your_agent_id
```

### **Build Settings:**
- **Build command:** `npm run build:prod`
- **Publish directory:** `dist`
- **Node version:** 18 (auto-detected)

## 📱 PWA (Progressive Web App) Features

### **✅ PWA Capabilities:**
- **Installable** - Users can add to home screen
- **Offline Support** - Works without internet
- **Native App Feel** - Full-screen, no browser UI
- **Push Notifications** - Ready for future implementation
- **App-like Experience** - Smooth transitions and caching

### **🔧 PWA Components:**
- **Service Worker** (`/sw.js`) - Handles caching and offline functionality
- **Web App Manifest** (`/manifest.json`) - App metadata and icons
- **Install Prompt** - Shows when app can be installed
- **Theme Integration** - Matches your app's olive green theme

### **📱 Installation Instructions:**
1. **Mobile Chrome/Edge:** 
   - Tap menu → "Add to Home screen"
   - Or look for install banner
2. **Desktop Chrome/Edge:**
   - Look for install icon in address bar
   - Or use menu → "Install GoodMind Tara"
3. **Safari (iOS):**
   - Tap share button → "Add to Home Screen"

## 🔍 Post-Deployment

### **1. Test Payment Flow:**
- Set user's `remaining` to 0 in Firebase
- Try to make a call → "Subscribe" button appears
- Click "Subscribe" → Select plan → Payment gateway opens
- Complete test payment with real cards

### **2. Test PWA Features:**
- **Install Prompt:** Should appear on first visit
- **Offline Mode:** Disconnect internet, refresh page
- **Home Screen:** Add to home screen on mobile
- **App-like Experience:** Full-screen mode, smooth navigation

### **3. Verify Firebase Updates:**
- Check if user's plan is updated
- Verify remaining minutes are added
- Confirm total_conversation_seconds is reset

### **4. Monitor Logs:**
- Check Netlify function logs
- Monitor Firebase console
- Watch Razorpay dashboard
- Check PWA service worker registration

## 🚨 Important Notes

### **Live Keys in Production:**
- ✅ **Will work perfectly** on Netlify
- ✅ **Real payment processing**
- ✅ **Proper webhook support**
- ✅ **Production-grade security**

### **PWA Benefits:**
- ✅ **Better user engagement**
- ✅ **Faster loading** with caching
- ✅ **Offline functionality**
- ✅ **Native app experience**
- ✅ **Higher conversion rates**

### **Security Features:**
- **HTTPS** automatically enabled
- **Security headers** configured
- **CSP** properly set for Razorpay
- **Frame protection** enabled
- **Service Worker** security

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Fails:**
   - Check Node.js version (18+)
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **Payment Gateway Not Opening:**
   - Verify Razorpay keys in environment variables
   - Check CSP settings
   - Ensure HTTPS is enabled

3. **PWA Not Installing:**
   - Check manifest.json is accessible
   - Verify service worker registration
   - Ensure HTTPS is enabled
   - Check browser console for errors

4. **Firebase Not Updating:**
   - Check Firebase rules
   - Verify authentication state
   - Check network connectivity

## 📱 Mobile/WebView Support

- **Responsive design** for all devices
- **Touch-friendly** interface
- **WebView compatible**
- **PWA ready** ✅
- **Offline support** ✅
- **Installable** ✅

## 🎯 Success Indicators

✅ **Payment gateway opens**
✅ **Real payments processed**
✅ **Firebase updates correctly**
✅ **No more 400 errors**
✅ **Production domain working**
✅ **PWA installable** ✅
✅ **Offline functionality** ✅
✅ **App-like experience** ✅

---

**🎉 Your app is now a production-ready PWA on Netlify with live Razorpay integration!**

### **🚀 PWA Installation Steps for Users:**

1. **Visit your deployed app**
2. **Look for install prompt** (bottom-right corner)
3. **Click "Install App"** when prompted
4. **App will be added to home screen**
5. **Launch like a native app**
6. **Enjoy offline functionality and faster loading**
