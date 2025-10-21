# AWS Amplify Setup Guide

## Issue Fixed
The 404 error was caused by missing AWS Amplify build configuration. The following files have been created/updated:

1. **amplify.yml** - AWS Amplify build configuration
2. **next.config.js** - Updated for static export
3. **public/sitemap.xml** - Static sitemap (dynamic sitemap removed)

## Steps to Deploy

### 1. Push Changes to Git
```bash
git add .
git commit -m "Add AWS Amplify configuration for Next.js static export"
git push
```

### 2. Configure Environment Variables in AWS Amplify

Go to your Amplify Console > App Settings > Environment variables and add:

**Required Variables:**
- `NEXT_PUBLIC_NODE_ENV` = `production`
- `NEXT_PUBLIC_API_BASE_URL` = `https://api.vidyaai.co`
- `NEXT_PUBLIC_SITE_URL` = `https://www.vidyaai.co`

**Firebase Variables:**
- `NEXT_PUBLIC_FIREBASE_API_KEY` = `AIzaSyBUhq707Esl0fIpuLJBG0DpBbRxXe14_uo`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `vidyaai-app.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `vidyaai-app`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `vidyaai-app.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `872319959539`
- `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:872319959539:web:1cdb67b9e269a88ca9d286`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` = `G-G3YGF6WKSW`

### 3. Verify Build Settings in Amplify Console

Go to App Settings > Build settings and verify:
- **Build command:** `yarn build` (defined in amplify.yml)
- **Base directory:** (leave empty)
- **Output directory:** `out` (defined in amplify.yml)

### 4. Redeploy Your App

In the Amplify Console:
1. Go to your app
2. Click "Redeploy this version" on the latest deployment
3. Wait for the build to complete

The build should now succeed and your site will be accessible at www.vidyaai.co

## What Changed

### next.config.js
Added three critical settings:
- `output: 'export'` - Enables static site generation
- `images.unoptimized: true` - Required for static export
- `trailingSlash: true` - Better URL handling

### amplify.yml
Created with:
- Correct build commands
- Output directory set to `out` (Next.js static export output)
- Node modules caching for faster builds

### Sitemap
- Moved from dynamic (`src/app/sitemap.ts`) to static (`public/sitemap.xml`)
- Static export doesn't support dynamic sitemaps

## Troubleshooting

### If you still get 404:
1. Check that the build succeeded in Amplify Console
2. Verify all environment variables are set correctly
3. Check the build logs for errors
4. Make sure the domain is properly connected in Amplify Console

### If the build fails:
1. Check the build logs in Amplify Console
2. Verify `yarn install` succeeds
3. Try building locally: `yarn build`
4. Check that `out` directory is created after build

### To test locally:
```bash
yarn install
yarn build
# The 'out' directory should be created with your static files
```

## Notes

- This is now a **static site** (no server-side rendering)
- All pages are pre-rendered at build time
- Client-side features (Firebase auth, API calls) still work normally
- Better performance and lower costs compared to SSR

