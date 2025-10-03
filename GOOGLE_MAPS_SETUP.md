# Google Maps API Setup for Address Autocomplete

## 🗺️ Get Your Google Maps API Key

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click "New Project" or select an existing one
3. Give it a name (e.g., "SnapList")

### Step 3: Enable Places API
1. Go to "APIs & Services" → "Library"
2. Search for "**Places API**"
3. Click on it and press "**Enable**"
4. Also enable "**Maps JavaScript API**"

### Step 4: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "API key"
3. Copy the API key that appears

### Step 5: Restrict Your API Key (Recommended)
1. Click on your new API key to edit it
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:5173/*` (for development)
   - Add your production domain when ready
3. Under "API restrictions":
   - Select "Restrict key"
   - Check "Places API" and "Maps JavaScript API"
4. Click "Save"

### Step 6: Add to Your .env File
Add this line to your `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-key-here
```

### Step 7: Restart Your Dev Server
```bash
yarn dev
```

## 🎯 How It Works

Once configured, the address form will:
- ✅ **Auto-suggest addresses** as user types
- ✅ **Auto-fill city, state, ZIP** when address is selected
- ✅ **Validate real addresses** with Google's database
- ✅ **Fallback to manual entry** if API fails or isn't configured

## 💰 Pricing

Google Maps Platform has **generous free tier**:
- **$200 free credit per month**
- Places Autocomplete: ~$2.83 per 1,000 requests
- Most small to medium apps stay within free tier

## 🔒 Security Tips

1. **Always restrict your API key** (Step 5 above)
2. **Don't commit `.env`** file to git (already in `.gitignore`)
3. **Use different keys** for dev and production
4. **Set up billing alerts** in Google Cloud Console

## 🆘 Troubleshooting

### Address autocomplete not showing?
- Check browser console for errors
- Verify API key is correct in `.env`
- Make sure Places API is enabled in Google Cloud
- Restart dev server after adding key

### "This API project is not authorized..."?
- Enable "Places API" and "Maps JavaScript API"
- Wait 1-2 minutes for changes to propagate

### Works locally but not in production?
- Add production domain to API key restrictions
- Verify environment variable is set in production

## 📝 Without API Key

The form works fine without the API key! It just won't have:
- Address autocomplete suggestions
- Auto-fill features

Users can still enter addresses manually.

