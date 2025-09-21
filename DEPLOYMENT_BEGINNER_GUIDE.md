# 🚀 Deploy Your Website to a Domain - Beginner Guide

## What You Need

1. **Your code** (✅ You have this)
2. **A hosting service** (Free options available)
3. **A domain name** (~$10/year)
4. **GitHub account** (Free)

## Step 1: Prepare Your Code for GitHub

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository
1. Go to [github.com](https://github.com/)
2. Click "New repository"
3. Name it: `target-the-heart`
4. Make it **Public** (required for free hosting)
5. Click "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/target-the-heart.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy with Vercel (Free & Easy)

### 2.1 Sign Up for Vercel
1. Go to [vercel.com](https://vercel.com/)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your repositories

### 2.2 Deploy Your Project
1. Click "New Project"
2. Find your `target-the-heart` repository
3. Click "Import"
4. Vercel will auto-detect your settings

### 2.3 Configure Environment Variables
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Environment Variables"
3. Add all variables from your `.env` file:
   ```
   DATABASE_URL=your-database-url
   FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   SESSION_SECRET=your-session-secret
   NODE_ENV=production
   ```

### 2.4 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like: `target-the-heart-abc123.vercel.app`

## Step 3: Get a Domain Name

### 3.1 Buy a Domain
Choose a registrar:
- **Namecheap**: [namecheap.com](https://namecheap.com/) (~$10/year)
- **GoDaddy**: [godaddy.com](https://godaddy.com/) (~$12/year)
- **Google Domains**: [domains.google](https://domains.google/) (~$12/year)

### 3.2 Choose Your Domain
Examples:
- `yourname.com`
- `yourname.net`
- `yourname.org`
- `yourname.dev`

## Step 4: Connect Domain to Vercel

### 4.1 Add Domain in Vercel
1. Go to your Vercel project
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your domain: `yourdomain.com`
5. Click "Add"

### 4.2 Update DNS Records
Go to your domain registrar and add these records:

**For Namecheap:**
```
Type: A Record
Host: @
Value: 76.76.19.61
TTL: Automatic

Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**For GoDaddy:**
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 Wait for DNS Propagation
- DNS changes take 5-60 minutes to propagate
- You can check status at [whatsmydns.net](https://whatsmydns.net/)

## Step 5: Test Your Live Website

1. Visit `https://yourdomain.com`
2. Test all features:
   - User registration/login
   - Creating groups
   - Prayer requests
   - Google Maps

## Step 6: Set Up Database for Production

### Option A: Use Neon (Recommended)
1. Go to [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in Vercel environment variables

### Option B: Use Supabase
1. Go to [supabase.com](https://supabase.com/)
2. Create a new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in Vercel

## Step 7: Update External Services

### 7.1 Firebase Configuration
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add your domain: `yourdomain.com`

### 7.2 Google Maps API
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit your API key
4. Add domain restrictions: `yourdomain.com/*`

## Automatic Deployments

Once set up, every time you push code to GitHub:
1. Vercel automatically detects changes
2. Builds and deploys your app
3. Your live website updates automatically

## Cost Breakdown

- **Hosting**: FREE (Vercel free tier)
- **Domain**: ~$10-12/year
- **Database**: FREE (Neon/Supabase free tier)
- **Total**: ~$10-12/year

## Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check environment variables are set
   - Verify all dependencies are in package.json

2. **Domain Not Working:**
   - Wait for DNS propagation (up to 60 minutes)
   - Check DNS records are correct

3. **Database Connection Issues:**
   - Verify DATABASE_URL is correct
   - Check database is accessible from Vercel

4. **Firebase Errors:**
   - Add domain to authorized domains
   - Verify API keys are correct

## Next Steps

1. **Set up monitoring**: Add error tracking (Sentry)
2. **Backup database**: Regular backups
3. **SSL certificate**: Vercel provides free SSL
4. **Performance**: Monitor and optimize

---

**🎉 Congratulations!** Your website will be live at `https://yourdomain.com`

## Quick Summary

1. Push code to GitHub
2. Deploy with Vercel
3. Buy domain name
4. Connect domain to Vercel
5. Set up production database
6. Update external services
7. Test everything

**Total time**: 1-2 hours
**Total cost**: ~$10-12/year
