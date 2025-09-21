# Target The Heart - Migration from Replit to Cursor

## Overview
This guide will help you migrate your Target The Heart project from Replit to Cursor and set up everything needed to run it locally and deploy it to a web hosting service.

## Prerequisites
Before starting, ensure you have the following installed on your machine:

### Required Software
1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

3. **PostgreSQL** (choose one option):
   - **Option A: Local PostgreSQL**
     - Download from [postgresql.org](https://www.postgresql.org/download/)
     - Install and start the service
   - **Option B: Cloud PostgreSQL (Recommended)**
     - Use [Neon](https://neon.tech/) (free tier available)
     - Use [Supabase](https://supabase.com/) (free tier available)
     - Use [Railway](https://railway.app/) (free tier available)

4. **Cursor IDE** (already installed if you're reading this)

## Step 1: Project Setup

### 1.1 Clone or Download Your Project
If your project is in a Git repository:
```bash
git clone <your-repository-url>
cd Target-the-Heart
```

If you need to download from Replit:
1. In Replit, click the "Share" button
2. Download as ZIP file
3. Extract to your desired location

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Remove Replit-Specific Dependencies
The project has some Replit-specific dependencies that need to be removed:

```bash
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

## Step 2: Database Setup

### 2.1 Choose Your Database Option

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE target_the_heart;
   ```
3. Update your `.env` file with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/target_the_heart
   ```

#### Option B: Cloud PostgreSQL (Recommended)
1. Sign up for [Neon](https://neon.tech/) (free tier)
2. Create a new project
3. Copy the connection string
4. Update your `.env` file with the connection string

### 2.2 Set Up Environment Variables
1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```
2. Edit `.env` with your actual values (see Step 3 for API keys)

### 2.3 Initialize Database Schema
```bash
npm run db:push
```

This will create all the necessary tables in your database.

## Step 3: External Services Setup

### 3.1 Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google and Email/Password providers
4. Get your configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Add a web app if you haven't already
   - Copy the config values to your `.env` file

### 3.2 Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domains
6. Add the API key to your `.env` file

### 3.3 Optional Services
- **ESV Bible API**: Sign up at [api.esv.org](https://api.esv.org/) for Bible verses
- **SendGrid**: Sign up at [sendgrid.com](https://sendgrid.com/) for email notifications
- **Google Gemini**: Get API key from [Google AI Studio](https://makersuite.google.com/) for AI features

## Step 4: Update Configuration Files

### 4.1 Update Vite Configuration
Remove Replit-specific plugins from `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Remove Replit-specific plugins
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### 4.2 Update Package.json Scripts
The scripts should work as-is, but you can verify they're correct:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## Step 5: Test Local Setup

### 5.1 Start Development Server
```bash
npm run dev
```

This should start both the frontend (Vite) and backend (Express) servers.

### 5.2 Verify Everything Works
1. Open your browser to `http://localhost:5173` (or the port shown in terminal)
2. Test authentication (sign up/sign in)
3. Test creating a group
4. Test prayer requests
5. Check browser console for any errors

### 5.3 Common Issues and Solutions

#### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running (if using local)
- Check firewall settings

#### Firebase Authentication Issues
- Verify all Firebase config values are correct
- Check that authorized domains include `localhost:5173`
- Ensure Google OAuth is enabled in Firebase Console

#### Google Maps Issues
- Verify API key is correct
- Check that required APIs are enabled
- Ensure API key restrictions allow your domain

## Step 6: Production Deployment

### 6.1 Build for Production
```bash
npm run build
```

### 6.2 Deployment Options

#### Option A: Vercel (Recommended for Frontend + Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Set environment variables in Vercel dashboard

#### Option B: Railway
1. Sign up at [railway.app](https://railway.app/)
2. Connect your GitHub repository
3. Railway will auto-detect Node.js and deploy
4. Set environment variables in Railway dashboard

#### Option C: Render
1. Sign up at [render.com](https://render.com/)
2. Create a new Web Service
3. Connect your repository
4. Set environment variables

#### Option D: DigitalOcean App Platform
1. Sign up at [DigitalOcean](https://www.digitalocean.com/)
2. Create a new App
3. Connect your repository
4. Configure environment variables

### 6.3 Environment Variables for Production
Make sure to set all the same environment variables in your hosting platform:
- `DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `SESSION_SECRET`

## Step 7: Post-Deployment Configuration

### 7.1 Update Firebase Authorized Domains
Add your production domain to Firebase Console > Authentication > Settings > Authorized domains

### 7.2 Update Google Maps API Restrictions
Update your Google Maps API key restrictions to include your production domain

### 7.3 Test Production Deployment
1. Test authentication
2. Test all major features
3. Check for any console errors
4. Verify database operations work

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `npm install` again
2. **Database connection errors**: Check your `DATABASE_URL`
3. **Firebase errors**: Verify all Firebase config values
4. **Build errors**: Check TypeScript errors with `npm run check`
5. **CORS errors**: Ensure your frontend URL is allowed in backend CORS settings

### Getting Help

1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all environment variables are set correctly
4. Ensure all external services are properly configured

## Next Steps

Once everything is working:

1. **Set up monitoring**: Consider adding error tracking (Sentry, LogRocket)
2. **Set up backups**: Regular database backups
3. **Performance optimization**: Monitor and optimize as needed
4. **Security**: Regular security audits and updates
5. **CI/CD**: Set up automated deployments

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Maps Platform](https://developers.google.com/maps)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

---

**Note**: This migration removes Replit-specific features but maintains all core functionality. The application should work identically to how it worked in Replit, but now you have full control over your development environment and deployment.
