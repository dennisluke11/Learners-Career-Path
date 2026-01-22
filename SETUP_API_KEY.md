# Setting Up Gemini API Key for Production

## Quick Setup

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" or go to [API Keys page](https://aistudio.google.com/app/apikey)
4. Create a new API key
5. Copy the API key (you'll only see it once!)

### Step 2: Set API Key in Firebase Functions

```bash
# Set the API key (replace YOUR_KEY with your actual key)
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Verify it was set correctly
firebase functions:config:get
```

You should see:
```json
{
  "gemini": {
    "api_key": "YOUR_KEY_HERE"
  }
}
```

### Step 3: Deploy Functions

```bash
# Deploy functions with the new config
firebase deploy --only functions
```

### Step 4: Verify It Works

1. Deploy your app: `npm run deploy`
2. Test study resources or market data features
3. Check Firebase Functions logs: `firebase functions:log`

---

## Security Notes

✅ **DO:**
- Store API key in Firebase Functions config (server-side)
- Use environment variables in CI/CD
- Rotate keys periodically
- Monitor API usage

❌ **DON'T:**
- Commit API keys to git
- Put API keys in client code
- Share API keys publicly
- Use same key for dev and prod

---

## Troubleshooting

### "API key not configured" Error

**Solution:**
```bash
# Check if key is set
firebase functions:config:get

# If not set, set it
firebase functions:config:set gemini.api_key="YOUR_KEY"

# Redeploy functions
firebase deploy --only functions
```

### "Quota exceeded" Error

**Solution:**
- Check your Gemini API quota at [Google AI Studio](https://aistudio.google.com/)
- Free tier: 15 requests/minute, 1000 requests/day
- Consider upgrading or implementing better caching

### Functions Not Deploying

**Solution:**
```bash
# Check Firebase CLI is logged in
firebase login

# Check you're using the right project
firebase use

# Try deploying again
firebase deploy --only functions
```

---

## Alternative: Using Environment Variables (CI/CD)

If using CI/CD, you can set the API key as an environment variable:

```bash
# In your CI/CD environment
export GEMINI_API_KEY="YOUR_KEY"

# Functions will use process.env.GEMINI_API_KEY as fallback
```

---

*Last Updated: Based on current Firebase Functions setup*

