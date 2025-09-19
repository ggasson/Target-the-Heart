// Firebase authentication for backend
import type { RequestHandler } from "express";
import { storage } from "./storage";

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token using Google's public endpoint
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.VITE_FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: token
      })
    });

    if (!response.ok) {
      console.error('Firebase token verification failed:', response.status, response.statusText);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = await response.json();
    if (!data.users || data.users.length === 0) {
      console.error('No user found in Firebase token response');
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = data.users[0];
    console.log('✅ Firebase user authenticated:', user.email);
    
    // Create user object similar to Replit format for compatibility
    (req as any).user = {
      claims: {
        sub: user.localId,
        email: user.email,
        name: user.displayName || user.email,
        picture: user.photoUrl
      }
    };

    // Ensure user exists in our database
    await storage.upsertUser({
      id: user.localId,
      email: user.email,
      firstName: user.displayName?.split(' ')[0] || user.email.split('@')[0],
      lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
      profileImageUrl: user.photoUrl
    });

    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};