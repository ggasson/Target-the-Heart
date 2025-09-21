# External Services Setup Guide

## Required Services

### 1. Firebase Authentication

#### Setup Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable **Google** provider
   - Enable **Email/Password** provider
4. Get your configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click "Add app" > Web app if you haven't already
   - Copy the config values

#### Update .env file:
```env
# Frontend Firebase config (VITE_ prefix makes them available in browser)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend Firebase config (for server-side verification)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
```

#### Get Firebase Admin SDK Key:
1. Go to Project Settings > Service accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the values to your `.env` file

### 2. Google Maps API

#### Setup Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable APIs:
   - Go to APIs & Services > Library
   - Enable **Maps JavaScript API**
   - Enable **Places API**
   - Enable **Geocoding API**
4. Create credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > API Key
   - Copy the API key

#### Update .env file:
```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Restrict API Key (Important for Security):
1. Click on your API key in Google Cloud Console
2. Under "Application restrictions", select "HTTP referrers"
3. Add your domains:
   - `localhost:5173/*` (for development)
   - `your-production-domain.com/*` (for production)

## Optional Services

### 3. ESV Bible API (for Bible verses)

#### Setup Steps:
1. Go to [api.esv.org](https://api.esv.org/)
2. Sign up for a free account
3. Get your API key

#### Update .env file:
```env
ESV_API_KEY=your-esv-api-key
```

### 4. SendGrid (for email notifications)

#### Setup Steps:
1. Go to [sendgrid.com](https://sendgrid.com/)
2. Sign up for a free account
3. Create an API key

#### Update .env file:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 5. Google Gemini AI (for AI features)

#### Setup Steps:
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Get your API key

#### Update .env file:
```env
GEMINI_API_KEY=your-gemini-api-key
```

## Testing Your Setup

After configuring all services, test them by running:

```bash
npm run dev
```

Then check:
1. **Firebase Auth**: Try signing up/signing in
2. **Google Maps**: Check if maps load on the groups page
3. **Database**: Try creating a group or prayer request

## Common Issues

### Firebase Authentication Issues:
- Make sure authorized domains include `localhost:5173`
- Verify all config values are correct
- Check that Google OAuth is enabled

### Google Maps Issues:
- Ensure all required APIs are enabled
- Check API key restrictions
- Verify billing is enabled (required for Maps API)

### Database Issues:
- Verify DATABASE_URL is correct
- Check if database is accessible
- Ensure schema is initialized with `npm run db:push`
