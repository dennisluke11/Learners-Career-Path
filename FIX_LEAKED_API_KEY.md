# Fix Leaked Gemini API Key

## 🚨 Critical Issue

Your Gemini API key has been reported as leaked and is no longer valid. You need to:

1. **Get a new API key**
2. **Delete the old key** (if possible)
3. **Set up the new key securely**

## Steps to Fix

### Step 1: Get a New API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the new API key

### Step 2: Delete the Old Key (Recommended)

1. In Google AI Studio, go to your API keys
2. Find the leaked key: `AIzaSyAnDnk21A8Vu6v2e8oQ0hjTH0M8VXoJzH4`
3. Delete it to prevent unauthorized usage

### Step 3: Set Up the New Key Securely

**Option A: Using .env file (Recommended)**

1. Create a `.env` file in the project root:
   ```bash
   cd /Users/dennislukeowuor/Documents/CareerPath
   touch .env
   ```

2. Add your new API key to `.env`:
   ```
   GEMINI_API_KEY=your-new-api-key-here
   ```

3. Load the environment variables:
   ```bash
   node scripts/load-env.js
   ```

4. Restart your development server:
   ```bash
   npm start
   ```

**Option B: Directly in environment.ts (Not Recommended for Production)**

If you prefer to set it directly (only for local development):

1. Edit `src/environments/environment.ts`
2. Set:
   ```typescript
   geminiApiKey: 'your-new-api-key-here',
   ```

⚠️ **Warning**: Never commit API keys to git! The `.env` file is already in `.gitignore`.

### Step 4: Verify It Works

1. Check the browser console - you should no longer see `403 (Forbidden)` errors
2. Test the study resources feature - it should work with the new key

## Security Best Practices

1. ✅ **Use `.env` files** for local development
2. ✅ **Never commit API keys** to git
3. ✅ **Use environment variables** in production
4. ✅ **Rotate keys regularly** if they're exposed
5. ✅ **Use Firebase Functions** for production (keeps keys server-side)

## If You've Already Committed the Old Key

If the old key was already committed to git:

1. **Remove it from git history** (if the repo is private):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch src/environments/environment.ts" \
     --prune-empty --tag-name-filter cat -- --all
   ```

2. **Or simply change the key** - the old one is already invalid, so it doesn't matter if it's in history

3. **Force push** (only if repo is private and you're sure):
   ```bash
   git push origin --force --all
   ```

⚠️ **Warning**: Force pushing rewrites history. Only do this if:
- The repository is private
- You understand the implications
- You've coordinated with your team

## Alternative: Use Firebase Functions

For production, consider using Firebase Functions to keep the API key server-side:

1. Set the key in Firebase Functions config:
   ```bash
   firebase functions:config:set gemini.api_key="your-new-api-key"
   ```

2. Update `environment.ts`:
   ```typescript
   useFirebaseFunctions: true,
   firebaseFunctionsUrl: 'https://your-region-your-project.cloudfunctions.net'
   ```

This keeps the API key secure and never exposes it to the client.

## Need Help?

- Check the console for specific error messages
- Verify the API key is correct (no extra spaces)
- Ensure `.env` file is in the project root
- Run `node scripts/load-env.js` after updating `.env`

