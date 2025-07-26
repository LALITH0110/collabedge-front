# Frontend Deployment Guide

## 🚀 Vercel Deployment Instructions

### 1. **Repository Setup**
This repository contains only the frontend code for CollabEdge. The backend is deployed separately on Fly.io.

### 2. **Environment Variables Setup in Vercel**

Go to your Vercel Dashboard → Your Project → Settings → Environment Variables and add these:

**CRITICAL:** Do NOT commit actual secrets to this public repository!

```bash
# Backend URLs (Replace with your actual Fly.io backend URL)
NEXT_PUBLIC_BACKEND_URL=https://your-backend-app.fly.dev
NEXT_PUBLIC_WS_URL=wss://your-backend-app.fly.dev  
BACKEND_URL=https://your-backend-app.fly.dev

# App URLs (Replace with your actual Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-frontend-app.vercel.app
FRONTEND_URL=https://your-frontend-app.vercel.app

# Stripe Configuration (Live keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
STRIPE_SECRET_KEY=sk_live_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret

# AI Configuration
ANTHROPIC_API_KEY=sk-ant-your_actual_key

# Email Configuration  
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS (Replace with your Vercel domain)
CORS_ALLOWED_ORIGINS=https://your-frontend-app.vercel.app
```

### 3. **Build Configuration**

Vercel will automatically detect this as a Next.js project. No additional configuration needed.

**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### 4. **Domain Configuration**

1. Deploy to Vercel first to get your `.vercel.app` domain
2. Update your environment variables with the actual domains
3. Configure custom domain if desired

### 5. **Backend Integration**

This frontend connects to a backend deployed on Fly.io. Make sure:

1. Your Fly.io backend is deployed and running
2. CORS is configured on backend to allow your Vercel domain
3. All environment variables point to correct backend URLs

### 6. **Post-Deployment Checklist**

- [ ] Frontend loads correctly
- [ ] API calls reach backend (check Network tab)
- [ ] Authentication works
- [ ] Stripe payments work
- [ ] WebSocket connections establish
- [ ] All environment variables are properly set

## 🔒 Security Notes

- This is a public repository - NO SECRETS are stored here
- All sensitive configuration is handled via Vercel environment variables
- The `.env` file is ignored and should never be committed

## 🆘 Troubleshooting

**API calls failing?**
- Check NEXT_PUBLIC_BACKEND_URL points to your Fly.io backend
- Verify CORS configuration on backend includes your Vercel domain

**WebSocket not connecting?**
- Check NEXT_PUBLIC_WS_URL uses `wss://` (not `ws://`)
- Verify your backend supports WebSocket connections

**Stripe not working?**
- Verify webhook URL in Stripe dashboard points to your backend
- Check STRIPE_WEBHOOK_SECRET matches your Stripe configuration 