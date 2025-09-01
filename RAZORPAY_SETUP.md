# 🚀 Razorpay Integration Setup Guide

## 📋 Prerequisites
- Razorpay account with API keys
- Firebase project configured
- React app with environment variables support

## 🔑 Environment Variables Setup

1. **Copy your Razorpay keys** from your Razorpay dashboard:
   - Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Navigate to Settings → API Keys
   - Copy your **Key ID** and **Secret Key**

2. **Create/Update your `.env` file** in the project root:
```env
# Razorpay Payment Gateway Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
VITE_RAZORPAY_SECRET_KEY=your_secret_key_here
```

3. **Restart your development server** after adding environment variables

## 🎯 How It Works

### **Subscription Flow:**
1. User runs out of free minutes (`remaining = 0`)
2. "Subscribe" button appears instead of "Call"
3. User clicks "Subscribe" → Subscription modal opens
4. User selects a plan (Basic/Pro/Premium)
5. Clicks "Continue to Payment" → Razorpay gateway opens
6. User completes payment
7. On success → Firebase updated with new plan and minutes
8. Modal closes → User can start calling

### **Plan Mapping:**
| Plan | Price | Minutes | Seconds | Plan Name |
|------|-------|---------|---------|-----------|
| ₹249 | 249 | 40 | 2,400 | Basic |
| ₹1150 | 1,150 | 200 | 12,000 | Pro |
| ₹2250 | 2,250 | 400 | 24,000 | Premium |

### **Firebase Updates:**
- `plan`: Updated to "Basic", "Pro", or "Premium"
- `remaining`: Set to minutes converted to seconds
- `total_conversation_seconds`: Reset to 0

## 🧪 Testing

### **Test Mode:**
- Use Razorpay test keys for development
- Test with these card numbers:
  - **Success**: 4111 1111 1111 1111
  - **Failure**: 4000 0000 0000 0002

### **Test Flow:**
1. Set user's `remaining` to 0 in Firebase
2. Try to make a call → "Subscribe" button appears
3. Click "Subscribe" → Modal opens
4. Select plan → Click "Continue to Payment"
5. Complete test payment
6. Verify Firebase updates

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Razorpay Key ID not found"**
   - Check `.env` file exists
   - Verify `VITE_RAZORPAY_KEY_ID` is set
   - Restart dev server

2. **"Razorpay not loaded"**
   - Check internet connection
   - Verify Razorpay script loads in `index.html`
   - Check browser console for errors

3. **Payment succeeds but Firebase not updated**
   - Check Firebase permissions
   - Verify user authentication
   - Check browser console for errors

4. **Modal not opening**
   - Verify `showSubscriptionModal` state
   - Check `canStartCall()` function
   - Ensure user has `remaining = 0`

## 🚨 Security Notes

### **Client-Side Limitations:**
- **Payment verification is basic** (client-side only)
- **Order IDs are generated client-side** (not secure for production)
- **Secret key should NEVER be exposed** (only Key ID in frontend)

### **Production Recommendations:**
- Implement server-side payment verification
- Use webhooks for payment confirmation
- Generate order IDs server-side
- Add payment amount validation
- Implement proper error handling

## 📱 Mobile/WebView Support

- Works in all modern browsers
- Compatible with mobile WebViews
- Responsive design for all screen sizes
- Touch-friendly interface

## 🔄 Next Steps

After successful integration:
1. **Test all payment scenarios**
2. **Implement proper error handling**
3. **Add payment analytics**
4. **Set up webhook handling**
5. **Add subscription management**
6. **Implement plan upgrades/downgrades**

## 📞 Support

- **Razorpay Documentation**: [docs.razorpay.com](https://docs.razorpay.com/)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Project Issues**: Check GitHub issues or contact development team

---

**🎉 Congratulations! Your Razorpay integration is now ready to use!**
