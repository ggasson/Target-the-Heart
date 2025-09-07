import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertGroupSchema, insertPrayerRequestSchema, insertGroupMembershipSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Location update route
  app.post('/api/auth/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, location } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        location
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Group routes
  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupData = insertGroupSchema.parse({
        ...req.body,
        adminId: userId
      });
      
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, radius } = req.query;
      
      let groups;
      if (latitude && longitude) {
        groups = await storage.getGroupsByLocation(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          radius ? parseFloat(radius as string) : undefined
        );
      } else {
        groups = await storage.getPublicGroups();
      }
      
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.get('/api/groups/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.get('/api/groups/:id', isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // Group membership routes
  app.post('/api/groups/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupId = req.params.id;
      const { message } = req.body;
      
      // Check if user already has a membership request
      const existingMembership = await storage.getUserMembershipStatus(userId, groupId);
      if (existingMembership) {
        return res.status(400).json({ message: "Membership request already exists" });
      }
      
      const membership = await storage.requestGroupJoin({
        groupId,
        userId,
        message: message || ""
      });
      
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error requesting group join:", error);
      res.status(500).json({ message: "Failed to request group join" });
    }
  });

  app.post('/api/memberships/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      await storage.approveGroupMembership(req.params.id);
      res.json({ message: "Membership approved" });
    } catch (error) {
      console.error("Error approving membership:", error);
      res.status(500).json({ message: "Failed to approve membership" });
    }
  });

  app.post('/api/memberships/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      await storage.rejectGroupMembership(req.params.id);
      res.json({ message: "Membership rejected" });
    } catch (error) {
      console.error("Error rejecting membership:", error);
      res.status(500).json({ message: "Failed to reject membership" });
    }
  });

  app.get('/api/memberships/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pendingMemberships = await storage.getPendingMemberships(userId);
      res.json(pendingMemberships);
    } catch (error) {
      console.error("Error fetching pending memberships:", error);
      res.status(500).json({ message: "Failed to fetch pending memberships" });
    }
  });

  // Prayer request routes
  app.post('/api/prayers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerData = insertPrayerRequestSchema.parse({
        ...req.body,
        authorId: userId
      });
      
      const prayer = await storage.createPrayerRequest(prayerData);
      res.status(201).json(prayer);
    } catch (error) {
      console.error("Error creating prayer request:", error);
      res.status(500).json({ message: "Failed to create prayer request" });
    }
  });

  app.get('/api/prayers/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayers = await storage.getUserPrayerRequests(userId);
      res.json(prayers);
    } catch (error) {
      console.error("Error fetching user prayers:", error);
      res.status(500).json({ message: "Failed to fetch user prayers" });
    }
  });

  app.get('/api/groups/:id/prayers', isAuthenticated, async (req: any, res) => {
    try {
      const prayers = await storage.getGroupPrayerRequests(req.params.id);
      res.json(prayers);
    } catch (error) {
      console.error("Error fetching group prayers:", error);
      res.status(500).json({ message: "Failed to fetch group prayers" });
    }
  });

  app.post('/api/prayers/:id/pray', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.addPrayerResponse(req.params.id, userId);
      res.json({ message: "Prayer response added" });
    } catch (error) {
      console.error("Error adding prayer response:", error);
      res.status(500).json({ message: "Failed to add prayer response" });
    }
  });

  app.delete('/api/prayers/:id/pray', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removePrayerResponse(req.params.id, userId);
      res.json({ message: "Prayer response removed" });
    } catch (error) {
      console.error("Error removing prayer response:", error);
      res.status(500).json({ message: "Failed to remove prayer response" });
    }
  });

  // Chat routes
  app.get('/api/groups/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getGroupChatMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/groups/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        groupId: req.params.id,
        userId
      });
      
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
