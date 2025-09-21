# Deployment Guide

## Quick Deployment Options

### Option 1: Vercel (Recommended)

Vercel is perfect for this project because it supports both frontend and serverless functions.

#### Setup Steps:
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your project:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project? No
   - Project name: target-the-heart
   - Directory: ./
   - Override settings? No

5. Set environment variables in Vercel dashboard:
   - Go to your project dashboard
   - Go to Settings > Environment Variables
   - Add all variables from your `.env` file

#### Vercel Configuration:
Create `vercel.json` in your project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

### Option 2: Railway

Railway is great for full-stack applications with databases.

#### Setup Steps:
1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" > "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect Node.js
6. Add environment variables in Railway dashboard

#### Railway Configuration:
Create `railway.json` in your project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Option 3: Render

Render provides free hosting for web services.

#### Setup Steps:
1. Go to [render.com](https://render.com/)
2. Sign up with GitHub
3. Click "New" > "Web Service"
4. Connect your repository
5. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

### Option 4: DigitalOcean App Platform

#### Setup Steps:
1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Create a new App
3. Connect your GitHub repository
4. Configure:
   - Source: GitHub
   - Branch: main
   - Build Command: `npm run build`
   - Run Command: `npm start`

## Environment Variables for Production

Make sure to set these in your hosting platform:

### Required:
```env
DATABASE_URL=your-production-database-url
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=production
```

### Optional:
```env
ESV_API_KEY=your-esv-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## Post-Deployment Configuration

### 1. Update Firebase Authorized Domains
1. Go to Firebase Console > Authentication > Settings
2. Add your production domain to "Authorized domains"

### 2. Update Google Maps API Restrictions
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click on your API key
3. Add your production domain to "HTTP referrers"

### 3. Test Production Deployment
1. Test user registration/login
2. Test creating groups
3. Test prayer requests
4. Test Google Maps functionality
5. Check browser console for errors

## Database Migration for Production

If you're using a different database for production:

1. **Export from development database:**
   ```bash
   pg_dump your-dev-database-url > backup.sql
   ```

2. **Import to production database:**
   ```bash
   psql your-production-database-url < backup.sql
   ```

Or use your hosting platform's database migration tools.

## Monitoring and Maintenance

### 1. Error Tracking
Consider adding error tracking:
- [Sentry](https://sentry.io/) - Error monitoring
- [LogRocket](https://logrocket.com/) - Session replay

### 2. Performance Monitoring
- [Vercel Analytics](https://vercel.com/analytics) (if using Vercel)
- [Google Analytics](https://analytics.google.com/)

### 3. Database Backups
- Most cloud providers offer automatic backups
- Set up regular backup schedules
- Test restore procedures

### 4. Security
- Regular security audits
- Keep dependencies updated
- Monitor for vulnerabilities with `npm audit`

## Troubleshooting

### Common Deployment Issues:

1. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for TypeScript errors

2. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify no typos in values

3. **Database Connection:**
   - Verify DATABASE_URL is correct
   - Check database is accessible from hosting platform
   - Ensure firewall allows connections

4. **Firebase Issues:**
   - Verify authorized domains include production URL
   - Check Firebase project settings
   - Ensure API keys are correct

5. **Google Maps Issues:**
   - Verify API key restrictions include production domain
   - Check billing is enabled
   - Ensure required APIs are enabled
