# OAuth Setup Guide for SnapList

## 🎯 Overview

SnapList supports Google and Facebook OAuth authentication. This guide will help you set up OAuth credentials for local development.

## 📋 Prerequisites

- A Google account for Google OAuth
- A Facebook account for Facebook OAuth
- Your app running at `http://localhost:5173`

---

## 🔵 Google OAuth Setup

### Step 1: Go to Google Cloud Console
Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project" or select an existing project
3. Give it a name like "SnapList Dev"

### Step 3: Enable Google+ API (if required)
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: SnapList
   - User support email: Your email
   - Developer contact: Your email
   - Add scope: `./auth/userinfo.email` and `./auth/userinfo.profile`
   - Add test users if needed
4. Application type: **Web application**
5. Name: "SnapList Local Dev"
6. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   ```
7. **Authorized redirect URIs:**
   ```
   http://localhost:5173/api/auth/google/callback
   ```
8. Click "Create"
9. **Copy the Client ID and Client Secret**

### Step 5: Update .env File
```bash
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

---

## 🔷 Facebook OAuth Setup

### Step 1: Go to Facebook Developers
Visit: [https://developers.facebook.com/](https://developers.facebook.com/)

### Step 2: Create an App
1. Click "My Apps" → "Create App"
2. Use case: "Other"
3. App type: "Business" or "Consumer"
4. App name: "SnapList"
5. Contact email: Your email
6. Click "Create App"

### Step 3: Add Facebook Login Product
1. In your app dashboard, find "Add Products"
2. Click "Set Up" on "Facebook Login"
3. Select "Web" platform
4. Site URL: `http://localhost:5173`

### Step 4: Configure Facebook Login Settings
1. Go to "Facebook Login" → "Settings" in the left sidebar
2. Under "Valid OAuth Redirect URIs", add:
   ```
   http://localhost:5173/api/auth/facebook/callback
   ```
3. Save changes

### Step 5: Get App Credentials
1. Go to "Settings" → "Basic"
2. Copy your **App ID** and **App Secret**
   - You may need to click "Show" to reveal the App Secret

### Step 6: Update .env File
```bash
FACEBOOK_APP_ID=your_actual_app_id_here
FACEBOOK_APP_SECRET=your_actual_app_secret_here
```

### Step 7: Set App to Development Mode (for testing)
1. In the top navigation, you'll see your app is in "Development" mode
2. This is fine for local testing
3. Add test users if needed in "Roles" → "Test Users"

---

## 🚀 Testing OAuth

After setting up both OAuth providers:

1. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C if running in foreground, or kill the process)
   yarn dev
   ```

2. **Visit the login page:**
   ```
   http://localhost:5173/login
   ```

3. **Click "Google" or "Facebook" button**

4. **You should see:**
   - Google: OAuth consent screen
   - Facebook: Login dialog
   - After authentication: Redirect to `/dashboard`

---

## 🔍 Troubleshooting

### "OAuth Error" or "Redirect URI Mismatch"
- **Check:** Make sure redirect URIs match exactly (including http vs https)
- **Local URL:** `http://localhost:5173/api/auth/google/callback`
- **Local URL:** `http://localhost:5173/api/auth/facebook/callback`

### "This app hasn't been verified by Google"
- **For Development:** Click "Advanced" → "Go to [App Name] (unsafe)"
- This is normal for development apps with external users

### Facebook: "App Not Set Up"
- **Check:** Facebook Login product is added to your app
- **Check:** Valid OAuth Redirect URIs are saved
- **Check:** App is in Development mode

### OAuth Buttons Don't Work
- **Check:** Environment variables are set in `.env`
- **Check:** Server has been restarted after adding credentials
- **Check:** No console errors in browser

### User Not Created After OAuth
- **Check:** Email scope is requested and approved
- **Check:** Database connection is working
- **Check:** Check server logs for errors

---

## 📝 Current Implementation Features

✅ **Google OAuth:**
- Requests email and profile scope
- Creates user account automatically
- Assigns FREE membership tier
- Redirects to dashboard on success

✅ **Facebook OAuth:**
- Requests email permission
- Creates user account automatically
- Assigns FREE membership tier
- Redirects to dashboard on success

✅ **Security:**
- JWT tokens stored in HttpOnly cookies
- Random passwords for OAuth users
- No password reset needed for OAuth accounts

---

## 🔐 Production Deployment

When deploying to production:

1. **Update redirect URIs to production domain:**
   ```
   https://yourdomain.com/api/auth/google/callback
   https://yourdomain.com/api/auth/facebook/callback
   ```

2. **Update .env with production credentials**

3. **Google:** Complete OAuth consent screen verification

4. **Facebook:** Switch app to "Live" mode

5. **Add production domain to authorized origins**

---

## 📞 Need Help?

- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Facebook Login Docs: https://developers.facebook.com/docs/facebook-login/web
- Passport.js Docs: http://www.passportjs.org/

---

## ✅ Quick Checklist

Before testing OAuth:

- [ ] Created Google Cloud project
- [ ] Created OAuth 2.0 credentials in Google
- [ ] Added correct redirect URI in Google Console
- [ ] Copied Google Client ID and Secret to `.env`
- [ ] Created Facebook App
- [ ] Added Facebook Login product
- [ ] Added redirect URI in Facebook settings
- [ ] Copied Facebook App ID and Secret to `.env`
- [ ] Restarted development server
- [ ] Tested OAuth buttons on login page

---

**Once you've set up the credentials, OAuth will work seamlessly!** 🎉

