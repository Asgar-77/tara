# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# ElevenLabs API Configuration
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Agent Configuration
VITE_AGENT_ID=your_agent_id_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Razorpay Payment Gateway Configuration
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
VITE_RAZORPAY_SECRET_KEY=your_razorpay_secret_key_here
```

## How to Get These Values

### ElevenLabs API Key
1. Go to [elevenlabs.io](https://elevenlabs.io/)
2. Sign up/Login to your account
3. Go to Profile → API Key
4. Copy your API key

### Agent ID
1. In ElevenLabs dashboard, go to Voice Library
2. Select your voice agent
3. Copy the agent ID from the URL or agent details

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Copy the configuration values

### Razorpay Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate new key pair or copy existing ones
4. Use test keys for development, live keys for production

## Security Notes

- **Never commit real API keys** to version control
- **Use .env files** for local development
- **Set environment variables** in your hosting platform for production
- **Keep your keys secure** and don't share them publicly
