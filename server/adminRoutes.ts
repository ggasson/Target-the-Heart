/**
 * Administrative API routes for Target The Heart
 * Provides admin-only endpoints for system management
 * 
 * @description Admin routes for managing users, groups, meetings, prayers, and chats
 * @param {Express} app - Express application instance
 * @returns {void} Registers admin routes on the application
 */

import type { Express } from "express";
import { requireAuthenticatedAdmin } from "./adminAuth";
import { storage } from "./storage";

/**
 * Register all administrative routes
 * 
 * @description Adds admin routes to the Express application
 * @param {Express} app - Express application instance
 * @returns {void} Routes are registered on the app
 */
export function registerAdminRoutes(app: Express): void {
  
  
  // Admin dashboard data - overview statistics
  app.get('/api/admin/dashboard', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  // Get all users with pagination
  app.get('/api/admin/users', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';
      
      const result = await storage.getAdminUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get specific user details
  app.get('/api/admin/users/:userId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const user = await storage.getAdminUserDetails(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Update user (admin can modify any user)
  app.put('/api/admin/users/:userId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const updatedUser = await storage.updateAdminUser(req.params.userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (soft delete)
  app.delete('/api/admin/users/:userId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      await storage.deleteAdminUser(req.params.userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  // Get all groups with admin details
  app.get('/api/admin/groups', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';
      
      const result = await storage.getAdminGroups(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // Get specific group details with members
  app.get('/api/admin/groups/:groupId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const group = await storage.getAdminGroupDetails(req.params.groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group details:", error);
      res.status(500).json({ message: "Failed to fetch group details" });
    }
  });

  // Update group
  app.put('/api/admin/groups/:groupId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const updatedGroup = await storage.updateAdminGroup(req.params.groupId, req.body);
      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  // Delete group
  app.delete('/api/admin/groups/:groupId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      await storage.deleteAdminGroup(req.params.groupId);
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // ============================================================================
  // MEETING MANAGEMENT
  // ============================================================================

  // Get all meetings
  app.get('/api/admin/meetings', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';
      
      const result = await storage.getAdminMeetings(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  // Get specific meeting details with RSVPs
  app.get('/api/admin/meetings/:meetingId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const meeting = await storage.getAdminMeetingDetails(req.params.meetingId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      res.status(500).json({ message: "Failed to fetch meeting details" });
    }
  });

  // Delete meeting
  app.delete('/api/admin/meetings/:meetingId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      await storage.deleteAdminMeeting(req.params.meetingId);
      res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // ============================================================================
  // PRAYER MANAGEMENT
  // ============================================================================

  // Get all prayers
  app.get('/api/admin/prayers', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';
      
      const result = await storage.getAdminPrayers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin prayers:", error);
      res.status(500).json({ message: "Failed to fetch prayers" });
    }
  });

  // Get specific prayer details with responses
  app.get('/api/admin/prayers/:prayerId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const prayer = await storage.getAdminPrayerDetails(req.params.prayerId);
      if (!prayer) {
        return res.status(404).json({ message: "Prayer not found" });
      }
      res.json(prayer);
    } catch (error) {
      console.error("Error fetching prayer details:", error);
      res.status(500).json({ message: "Failed to fetch prayer details" });
    }
  });

  // Delete prayer
  app.delete('/api/admin/prayers/:prayerId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      await storage.deleteAdminPrayer(req.params.prayerId);
      res.json({ message: "Prayer deleted successfully" });
    } catch (error) {
      console.error("Error deleting prayer:", error);
      res.status(500).json({ message: "Failed to delete prayer" });
    }
  });

  // ============================================================================
  // CHAT MANAGEMENT
  // ============================================================================

  // Get all chat messages
  app.get('/api/admin/chats', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const groupId = req.query.groupId as string || '';
      
      const result = await storage.getAdminChats(page, limit, groupId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Delete chat message
  app.delete('/api/admin/chats/:messageId', requireAuthenticatedAdmin, async (req, res) => {
    try {
      await storage.deleteAdminChatMessage(req.params.messageId);
      res.json({ message: "Chat message deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ message: "Failed to delete chat message" });
    }
  });

  // ============================================================================
  // SYSTEM MANAGEMENT
  // ============================================================================

  // Get system logs
  app.get('/api/admin/logs', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const level = req.query.level as string || '';
      
      const result = await storage.getAdminLogs(page, limit, level);
      res.json(result);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Health check for admin
  app.get('/api/admin/health', requireAuthenticatedAdmin, async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ message: "Failed to check system health" });
    }
  });

  console.log("✅ Admin routes registered successfully");
}
