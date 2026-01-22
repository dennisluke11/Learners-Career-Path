# Fix Firestore Permission Errors

## 🔴 Current Issue

You're seeing these errors:
- `[AnnouncementsService] Permission denied - using default announcements`
- `Missing or insufficient permissions` for study resources

## ✅ Solution: Deploy Firestore Rules

Your `firestore.rules` file is correct, but it needs to be **deployed to Firebase**.

### Step 1: Check Firebase Project

```bash
# List your Firebase projects
firebase projects:list

# Set active project (if not set)
firebase use --add
# Then select your project from the list
```

### Step 2: Deploy Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Step 3: Verify Deployment

After deployment, refresh your app. The permission errors should be gone.

## 📋 What the Rules Allow

Your current rules allow:
- ✅ **Public read** for all collections (countries, careers, announcements, studyResources, marketData)
- ✅ **Public create** for userEvents (analytics)
- ✅ **Update** for announcements (views/clicks tracking only)
- ❌ **No write** access (admin only)

## 🔍 If Errors Persist

### Check Rules Syntax

The rules file should be valid. Test it:

```bash
# Validate rules syntax
firebase deploy --only firestore:rules --dry-run
```

### Check Firebase Console

1. Go to Firebase Console
2. Navigate to Firestore Database > Rules
3. Verify the rules match your `firestore.rules` file

### Common Issues

1. **Rules not deployed** - Most common issue
2. **Wrong project selected** - Check with `firebase use`
3. **Rules syntax error** - Check console for errors

## 🎯 Quick Fix

If you can't deploy right now, you can temporarily test with:

```bash
# Make sure you're in the right project
firebase use <your-project-id>

# Deploy rules
firebase deploy --only firestore:rules
```

After deployment, your app should work without permission errors! 🎉

