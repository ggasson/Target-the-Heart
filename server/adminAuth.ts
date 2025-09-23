/**
 * Admin authentication middleware for Target The Heart
 * Provides administrative access for system management
 * 
 * @description Middleware that checks if the authenticated user has admin privileges
 * @param {string} adminEmail - The email address that has admin privileges
 * @returns {RequestHandler} Express middleware function for admin authentication
 */

import type { RequestHandler } from "express";
import { isAuthenticated } from "./firebaseAuth";

// Admin email address - only this email has admin privileges
const ADMIN_EMAIL = "garygasson@gmail.com";

/**
 * Middleware to verify admin privileges
 * Must be used after isAuthenticated middleware
 * 
 * @description Checks if the authenticated user has admin privileges
 * @param req - Express request object (must have user from isAuthenticated)
 * @param res - Express response object
 * @param next - Express next function
 * @returns {void} Calls next() if admin, returns 403 if not admin
 */
export const requireAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    // Ensure user is authenticated first
    if (!req.user || !req.user.claims) {
      return res.status(401).json({ message: "Unauthorized - authentication required" });
    }

    const userEmail = req.user.claims.email;
    
    // Check if user email matches admin email
    if (userEmail !== ADMIN_EMAIL) {
            return res.status(403).json({ 
              message: "Forbidden - admin privileges required",
              userEmail: userEmail,
              requiredEmail: ADMIN_EMAIL 
            });
          }
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ message: "Internal server error during admin authentication" });
  }
};

/**
 * Combined middleware that checks both authentication and admin privileges
 * 
 * @description Convenience middleware that combines isAuthenticated and requireAdmin
 * @param req - Express request object
 * @param res - Express response object  
 * @param next - Express next function
 * @returns {void} Calls next() if authenticated admin, returns error otherwise
 */
export const requireAuthenticatedAdmin: RequestHandler[] = [isAuthenticated, requireAdmin];

/**
 * Utility function to check if an email has admin privileges
 * 
 * @description Helper function to check admin status without middleware
 * @param {string} email - Email address to check
 * @returns {boolean} True if email has admin privileges, false otherwise
 */
export function isAdminEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}

/**
 * Get the admin email address
 * 
 * @description Returns the configured admin email address
 * @returns {string} The admin email address
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}
