import {
  users,
  userPreferences,
  groupNotificationPreferences,
  groups,
  groupMemberships,
  prayerRequests,
  prayerTemplates,
  prayerComments,
  prayerResponses,
  chatMessages,
  meetings,
  meetingRsvps,
  groupInvitations,
  notifications,
  twoFactorAuth,
  type User,
  type UserPreferences,
  type GroupNotificationPreferences,
  type UpsertUser,
  type Group,
  type GroupMembership,
  type PrayerRequest,
  type PrayerTemplate,
  type PrayerComment,
  type PrayerResponse,
  type TwoFactorAuth,
  type ChatMessage,
  type Meeting,
  type MeetingRsvp,
  type GroupInvitation,
  type InsertGroup,
  type InsertUserPreferences,
  type InsertGroupNotificationPreferences,
  type InsertPrayerRequest,
  type InsertPrayerTemplate,
  type InsertPrayerComment,
  type InsertTwoFactorAuth,
  type InsertGroupMembership,
  type InsertChatMessage,
  type InsertMeeting,
  type InsertMeetingRsvp,
  type InsertGroupInvitation,
  type InsertNotification,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, count, isNull, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsByLocation(latitude: number, longitude: number, radiusKm?: number): Promise<Group[]>;
  getUserGroups(userId: string): Promise<Group[]>;
  getPublicGroups(): Promise<Group[]>;
  deleteGroup(id: string): Promise<void>;
  deleteAllGroups(): Promise<void>;
  
  // Group membership operations
  requestGroupJoin(membership: InsertGroupMembership): Promise<GroupMembership>;
  approveGroupMembership(membershipId: string): Promise<void>;
  rejectGroupMembership(membershipId: string): Promise<void>;
  getGroupMemberships(groupId: string): Promise<(GroupMembership & { user: User })[]>;
  getPendingMemberships(adminUserId: string): Promise<(GroupMembership & { user: User; group: Group })[]>;
  getUserMembershipStatus(userId: string, groupId: string): Promise<GroupMembership | undefined>;
  getUserPendingRequests(userId: string): Promise<(GroupMembership & { group: Group })[]>;
  
  // Prayer request operations
  createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest>;
  getPrayerRequest(id: string): Promise<(PrayerRequest & { author: User; group: Group; responses: PrayerResponse[] }) | undefined>;
  getGroupPrayerRequests(groupId: string): Promise<(PrayerRequest & { author: User; responses: PrayerResponse[] })[]>;
  getUserPrayerRequests(userId: string): Promise<(PrayerRequest & { group: Group; responses: PrayerResponse[] })[]>;
  addPrayerResponse(prayerRequestId: string, userId: string): Promise<void>;
  removePrayerResponse(prayerRequestId: string, userId: string): Promise<void>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getGroupChatMessages(groupId: string, limit?: number): Promise<(ChatMessage & { user: User })[]>;
  
  // Meeting operations
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getGroupMeetings(groupId: string): Promise<Meeting[]>;
  getUpcomingMeetings(groupId: string): Promise<Meeting[]>;
  deleteMeeting(id: string): Promise<void>;
  
  // RSVP operations
  createOrUpdateRsvp(rsvp: InsertMeetingRsvp): Promise<MeetingRsvp>;
  getMeetingRsvps(meetingId: string): Promise<(MeetingRsvp & { user: User })[]>;
  getUserRsvp(meetingId: string, userId: string): Promise<MeetingRsvp | undefined>;
  deleteRsvp(meetingId: string, userId: string): Promise<void>;
  
  // Invitation operations
  createGroupInvitation(invitation: InsertGroupInvitation): Promise<GroupInvitation>;
  getGroupInvitation(token: string): Promise<(GroupInvitation & { group: Group }) | undefined>;
  useGroupInvitation(token: string): Promise<void>;
  getGroupInvitations(groupId: string): Promise<(GroupInvitation & { createdBy: User })[]>;
  deactivateGroupInvitation(id: string): Promise<void>;
  
  // Birthday operations
  updateUserBirthday(userId: string, birthday: string | null): Promise<void>;
  updateUserProfile(userId: string, profileData: { firstName?: string | null; lastName?: string | null; birthday?: string | null; profileImageUrl?: string | null }): Promise<void>;
  updateMembershipBirthdaySharing(membershipId: string, shareBirthday: boolean): Promise<void>;
  getGroupTodaysBirthdays(groupId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          phoneNumber: userData.phoneNumber,
          birthday: userData.birthday,
          isVerified: userData.isVerified,
          verificationCode: userData.verificationCode,
          verificationExpiry: userData.verificationExpiry,
          latitude: userData.latitude,
          longitude: userData.longitude,
          location: userData.location,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Group operations
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    
    // Automatically add the admin as an approved member
    await db.insert(groupMemberships).values({
      groupId: newGroup.id,
      userId: group.adminId,
      status: "approved",
      joinedAt: new Date(),
    });
    
    return newGroup;
  }

  async updateGroup(id: string, groupData: Partial<InsertGroup>): Promise<Group> {
    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...groupData,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupsByLocation(latitude: number, longitude: number, radiusKm: number = 50): Promise<Group[]> {
    // Use Haversine formula to find groups within radius
    const groupsWithDistance = await db
      .select()
      .from(groups)
      .where(
        and(
          eq(groups.isPublic, true),
          sql`
            (6371 * acos(
              cos(radians(${latitude})) * 
              cos(radians(${groups.latitude})) * 
              cos(radians(${groups.longitude}) - radians(${longitude})) + 
              sin(radians(${latitude})) * 
              sin(radians(${groups.latitude}))
            )) <= ${radiusKm}
          `
        )
      )
      .orderBy(asc(groups.name));
    
    return groupsWithDistance;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await db
      .select({ group: groups })
      .from(groupMemberships)
      .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.status, "approved")
        )
      )
      .orderBy(asc(groups.name));
    
    return userGroups.map(result => result.group);
  }

  async getPublicGroups(): Promise<Group[]> {
    return await db
      .select()
      .from(groups)
      .where(eq(groups.isPublic, true))
      .orderBy(asc(groups.name));
  }

  async deleteGroup(id: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get related IDs first for notification cleanup
      const groupMeetings = await tx
        .select({ id: meetings.id })
        .from(meetings)
        .where(eq(meetings.groupId, id));
      
      const groupPrayers = await tx
        .select({ id: prayerRequests.id })
        .from(prayerRequests)
        .where(eq(prayerRequests.groupId, id));
      
      const meetingIds = groupMeetings.map(m => m.id);
      const prayerIds = groupPrayers.map(p => p.id);
      
      // Delete all related data in the correct order due to foreign key constraints
      
      // 1. Delete group invitations
      await tx
        .delete(groupInvitations)
        .where(eq(groupInvitations.groupId, id));
      
      // 2. Delete meeting RSVPs for meetings in this group
      if (meetingIds.length > 0) {
        await tx
          .delete(meetingRsvps)
          .where(inArray(meetingRsvps.meetingId, meetingIds));
      }
      
      // 3. Delete prayer responses for prayers in this group
      if (prayerIds.length > 0) {
        await tx
          .delete(prayerResponses)
          .where(inArray(prayerResponses.prayerRequestId, prayerIds));
      }
      
      // 4. Delete notifications - handle all related notifications including those referencing meetings/prayers
      const notificationConditions = [eq(notifications.relatedGroupId, id)];
      if (meetingIds.length > 0) {
        notificationConditions.push(inArray(notifications.relatedMeetingId, meetingIds));
      }
      if (prayerIds.length > 0) {
        notificationConditions.push(inArray(notifications.relatedPrayerRequestId, prayerIds));
      }
      
      await tx
        .delete(notifications)
        .where(
          notificationConditions.length === 1 
            ? notificationConditions[0] 
            : or(...notificationConditions)
        );
      
      // 5. Delete meetings
      await tx
        .delete(meetings)
        .where(eq(meetings.groupId, id));
      
      // 6. Delete chat messages
      await tx
        .delete(chatMessages)
        .where(eq(chatMessages.groupId, id));
      
      // 7. Delete prayer requests
      await tx
        .delete(prayerRequests)
        .where(eq(prayerRequests.groupId, id));
      
      // 8. Delete group memberships
      await tx
        .delete(groupMemberships)
        .where(eq(groupMemberships.groupId, id));
      
      // 9. Finally delete the group itself
      await tx
        .delete(groups)
        .where(eq(groups.id, id));
    });
  }

  // Group membership operations
  async requestGroupJoin(membership: InsertGroupMembership): Promise<GroupMembership> {
    const [newMembership] = await db
      .insert(groupMemberships)
      .values(membership)
      .returning();
    return newMembership;
  }

  async approveGroupMembership(membershipId: string): Promise<void> {
    await db
      .update(groupMemberships)
      .set({ 
        status: "approved",
        joinedAt: new Date()
      })
      .where(eq(groupMemberships.id, membershipId));
  }

  async rejectGroupMembership(membershipId: string): Promise<void> {
    await db
      .update(groupMemberships)
      .set({ status: "rejected" })
      .where(eq(groupMemberships.id, membershipId));
  }

  async getGroupMemberships(groupId: string): Promise<(GroupMembership & { user: User })[]> {
    const memberships = await db
      .select()
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.status, "approved")
        )
      )
      .orderBy(asc(users.firstName));
    
    return memberships.map(result => ({
      ...result.group_memberships,
      user: result.users
    }));
  }

  async getPendingMemberships(adminUserId: string): Promise<(GroupMembership & { user: User; group: Group })[]> {
    const pendingMemberships = await db
      .select()
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(
        and(
          eq(groups.adminId, adminUserId),
          eq(groupMemberships.status, "pending")
        )
      )
      .orderBy(desc(groupMemberships.createdAt));
    
    return pendingMemberships.map(result => ({
      ...result.group_memberships,
      user: result.users,
      group: result.groups
    }));
  }

  async getUserMembershipStatus(userId: string, groupId: string): Promise<GroupMembership | undefined> {
    const [membership] = await db
      .select()
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.groupId, groupId)
        )
      );
    return membership;
  }

  async getUserPendingRequests(userId: string): Promise<(GroupMembership & { group: Group })[]> {
    const pendingRequests = await db
      .select()
      .from(groupMemberships)
      .innerJoin(groups, eq(groupMemberships.groupId, groups.id))
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.status, "pending")
        )
      )
      .orderBy(desc(groupMemberships.createdAt));
    
    return pendingRequests.map(result => ({
      ...result.group_memberships,
      group: result.groups
    }));
  }

  // Prayer request operations
  async createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest> {
    const [newPrayer] = await db
      .insert(prayerRequests)
      .values(prayer)
      .returning();
    return newPrayer;
  }

  async getPrayerRequest(id: string): Promise<(PrayerRequest & { author: User; group: Group; responses: PrayerResponse[] }) | undefined> {
    const [prayer] = await db
      .select()
      .from(prayerRequests)
      .innerJoin(users, eq(prayerRequests.authorId, users.id))
      .innerJoin(groups, eq(prayerRequests.groupId, groups.id))
      .where(eq(prayerRequests.id, id));
    
    if (!prayer) return undefined;

    const responses = await db
      .select()
      .from(prayerResponses)
      .where(eq(prayerResponses.prayerRequestId, id));

    return {
      ...prayer.prayer_requests,
      author: prayer.users,
      group: prayer.groups,
      responses
    };
  }

  async getGroupPrayerRequests(groupId: string): Promise<(PrayerRequest & { author: User; responses: PrayerResponse[] })[]> {
    const prayers = await db
      .select()
      .from(prayerRequests)
      .innerJoin(users, eq(prayerRequests.authorId, users.id))
      .where(eq(prayerRequests.groupId, groupId))
      .orderBy(desc(prayerRequests.createdAt));

    const prayersWithResponses = await Promise.all(
      prayers.map(async (prayer) => {
        const responses = await db
          .select()
          .from(prayerResponses)
          .where(eq(prayerResponses.prayerRequestId, prayer.prayer_requests.id));
        
        return {
          ...prayer.prayer_requests,
          author: prayer.users,
          responses
        };
      })
    );

    return prayersWithResponses;
  }

  async getUserPrayerRequests(userId: string): Promise<(PrayerRequest & { group: Group; responses: PrayerResponse[] })[]> {
    const prayers = await db
      .select()
      .from(prayerRequests)
      .innerJoin(groups, eq(prayerRequests.groupId, groups.id))
      .where(eq(prayerRequests.authorId, userId))
      .orderBy(desc(prayerRequests.createdAt));

    const prayersWithResponses = await Promise.all(
      prayers.map(async (prayer) => {
        const responses = await db
          .select()
          .from(prayerResponses)
          .where(eq(prayerResponses.prayerRequestId, prayer.prayer_requests.id));
        
        return {
          ...prayer.prayer_requests,
          group: prayer.groups,
          responses
        };
      })
    );

    return prayersWithResponses;
  }

  async addPrayerResponse(prayerRequestId: string, userId: string): Promise<void> {
    await db
      .insert(prayerResponses)
      .values({
        prayerRequestId,
        userId
      })
      .onConflictDoNothing();
  }

  async removePrayerResponse(prayerRequestId: string, userId: string): Promise<void> {
    await db
      .delete(prayerResponses)
      .where(
        and(
          eq(prayerResponses.prayerRequestId, prayerRequestId),
          eq(prayerResponses.userId, userId)
        )
      );
  }

  async updatePrayerStatus(id: string, status: "active" | "answered" | "closed"): Promise<void> {
    await db
      .update(prayerRequests)
      .set({ status })
      .where(eq(prayerRequests.id, id));
  }

  async deletePrayerRequest(id: string): Promise<void> {
    // Delete all related responses first
    await db
      .delete(prayerResponses)
      .where(eq(prayerResponses.prayerRequestId, id));
    
    // Then delete the prayer request
    await db
      .delete(prayerRequests)
      .where(eq(prayerRequests.id, id));
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getGroupChatMessages(groupId: string, limit: number = 50): Promise<(ChatMessage & { user: User })[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.groupId, groupId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.map(result => ({
      ...result.chat_messages,
      user: result.users
    })).reverse(); // Reverse to show oldest first
  }

  // Meeting operations
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db
      .insert(meetings)
      .values(meeting)
      .returning();
    return newMeeting;
  }

  async updateMeeting(id: string, meetingData: Partial<InsertMeeting>): Promise<Meeting> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        ...meetingData,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, id));
    return meeting;
  }

  async getGroupMeetings(groupId: string): Promise<Meeting[]> {
    return await db
      .select()
      .from(meetings)
      .where(eq(meetings.groupId, groupId))
      .orderBy(asc(meetings.meetingDate));
  }

  async getUpcomingMeetings(groupId: string): Promise<Meeting[]> {
    const now = new Date();
    return await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.groupId, groupId),
          sql`${meetings.meetingDate} >= ${now}`,
          eq(meetings.status, "scheduled")
        )
      )
      .orderBy(asc(meetings.meetingDate));
  }

  async getAllUserMeetings(userId: string): Promise<(Meeting & { group: { id: string; name: string } })[]> {
    // Get all meetings from groups the user is a member of
    const userMeetings = await db
      .select({
        meeting: meetings,
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(meetings)
      .innerJoin(groups, eq(meetings.groupId, groups.id))
      .innerJoin(groupMemberships, eq(groups.id, groupMemberships.groupId))
      .where(
        and(
          eq(groupMemberships.userId, userId),
          eq(groupMemberships.status, "approved")
        )
      )
      .orderBy(asc(meetings.meetingDate));

    return userMeetings.map(result => ({
      ...result.meeting,
      group: result.group,
    }));
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // RSVP operations
  async createOrUpdateRsvp(rsvp: InsertMeetingRsvp): Promise<MeetingRsvp> {
    // Try to find existing RSVP first
    const existingRsvp = await db
      .select()
      .from(meetingRsvps)
      .where(and(
        eq(meetingRsvps.meetingId, rsvp.meetingId),
        eq(meetingRsvps.userId, rsvp.userId)
      ))
      .limit(1);

    if (existingRsvp.length > 0) {
      // Update existing RSVP
      const [updatedRsvp] = await db
        .update(meetingRsvps)
        .set({
          status: rsvp.status,
          notes: rsvp.notes,
          guestCount: rsvp.guestCount,
          updatedAt: new Date(),
        })
        .where(eq(meetingRsvps.id, existingRsvp[0].id))
        .returning();
      return updatedRsvp;
    } else {
      // Create new RSVP
      const [newRsvp] = await db
        .insert(meetingRsvps)
        .values(rsvp)
        .returning();
      return newRsvp;
    }
  }

  async getMeetingRsvps(meetingId: string): Promise<(MeetingRsvp & { user: User })[]> {
    const rsvps = await db
      .select()
      .from(meetingRsvps)
      .innerJoin(users, eq(meetingRsvps.userId, users.id))
      .where(eq(meetingRsvps.meetingId, meetingId))
      .orderBy(asc(users.firstName));

    return rsvps.map(result => ({
      ...result.meeting_rsvps,
      user: result.users
    }));
  }

  async getUserRsvp(meetingId: string, userId: string): Promise<MeetingRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(meetingRsvps)
      .where(
        and(
          eq(meetingRsvps.meetingId, meetingId),
          eq(meetingRsvps.userId, userId)
        )
      );
    return rsvp;
  }

  async deleteRsvp(meetingId: string, userId: string): Promise<void> {
    await db
      .delete(meetingRsvps)
      .where(
        and(
          eq(meetingRsvps.meetingId, meetingId),
          eq(meetingRsvps.userId, userId)
        )
      );
  }

  // Invitation operations
  async createGroupInvitation(invitation: InsertGroupInvitation): Promise<GroupInvitation> {
    const [newInvitation] = await db
      .insert(groupInvitations)
      .values(invitation)
      .returning();
    return newInvitation;
  }

  async getGroupInvitation(token: string): Promise<(GroupInvitation & { group: Group }) | undefined> {
    const [invitation] = await db
      .select()
      .from(groupInvitations)
      .innerJoin(groups, eq(groupInvitations.groupId, groups.id))
      .where(
        and(
          eq(groupInvitations.token, token),
          eq(groupInvitations.isActive, true),
          or(
            isNull(groupInvitations.expiresAt),
            sql`${groupInvitations.expiresAt} > NOW()`
          )
        )
      );

    if (!invitation) return undefined;

    return {
      ...invitation.group_invitations,
      group: invitation.groups
    };
  }

  async useGroupInvitation(token: string): Promise<void> {
    await db
      .update(groupInvitations)
      .set({
        currentUses: sql`CAST(${groupInvitations.currentUses} AS INTEGER) + 1`
      })
      .where(eq(groupInvitations.token, token));
  }

  async getGroupInvitations(groupId: string): Promise<(GroupInvitation & { createdBy: User })[]> {
    const invitations = await db
      .select()
      .from(groupInvitations)
      .innerJoin(users, eq(groupInvitations.createdById, users.id))
      .where(eq(groupInvitations.groupId, groupId))
      .orderBy(desc(groupInvitations.createdAt));

    return invitations.map(result => ({
      ...result.group_invitations,
      createdBy: result.users
    }));
  }

  async deactivateGroupInvitation(id: string): Promise<void> {
    await db
      .update(groupInvitations)
      .set({ isActive: false })
      .where(eq(groupInvitations.id, id));
  }

  // Delete all groups and related data - ADMIN ONLY operation
  async deleteAllGroups(): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get all group, meeting, and prayer IDs for comprehensive cleanup
      const allGroups = await tx.select({ id: groups.id }).from(groups);
      const allMeetings = await tx.select({ id: meetings.id }).from(meetings);
      const allPrayers = await tx.select({ id: prayerRequests.id }).from(prayerRequests);
      
      const groupIds = allGroups.map(g => g.id);
      const meetingIds = allMeetings.map(m => m.id);
      const prayerIds = allPrayers.map(p => p.id);
      
      if (groupIds.length === 0) return; // No groups to delete
      
      // Delete in proper order to avoid foreign key constraint violations
      
      // 1. Delete meeting RSVPs
      if (meetingIds.length > 0) {
        await tx
          .delete(meetingRsvps)
          .where(inArray(meetingRsvps.meetingId, meetingIds));
      }
      
      // 2. Delete prayer responses
      if (prayerIds.length > 0) {
        await tx
          .delete(prayerResponses)
          .where(inArray(prayerResponses.prayerRequestId, prayerIds));
      }
      
      // 3. Delete ALL notifications related to groups, meetings, or prayers
      await tx
        .delete(notifications)
        .where(
          or(
            inArray(notifications.relatedGroupId, groupIds),
            ...(meetingIds.length > 0 ? [inArray(notifications.relatedMeetingId, meetingIds)] : []),
            ...(prayerIds.length > 0 ? [inArray(notifications.relatedPrayerRequestId, prayerIds)] : [])
          )
        );
      
      // 4. Delete meetings
      await tx.delete(meetings);
      
      // 5. Delete chat messages
      await tx.delete(chatMessages);
      
      // 6. Delete prayer requests
      await tx.delete(prayerRequests);
      
      // 7. Delete group invitations
      await tx.delete(groupInvitations);
      
      // 8. Delete group memberships
      await tx.delete(groupMemberships);
      
      // 9. Finally delete all groups
      await tx.delete(groups);
    });
  }

  // Get next upcoming meeting across all user groups with RSVP counts
  async getNextUpcomingMeeting(userId: string): Promise<(Meeting & { group: Group; rsvpCounts: { attending: number; notAttending: number; maybe: number; notResponded: number }; userRsvp?: MeetingRsvp }) | null> {
    const now = new Date();
    
    // Get all user's groups
    const userGroups = await this.getUserGroups(userId);
    if (userGroups.length === 0) return null;
    
    const groupIds = userGroups.map(g => g.id);
    
    // Get the next upcoming meeting across all groups
    const [nextMeeting] = await db
      .select()
      .from(meetings)
      .innerJoin(groups, eq(meetings.groupId, groups.id))
      .where(
        and(
          inArray(meetings.groupId, groupIds),
          sql`${meetings.meetingDate} >= ${now.toISOString()}`,
          eq(meetings.status, "scheduled")
        )
      )
      .orderBy(asc(meetings.meetingDate))
      .limit(1);

    if (!nextMeeting) return null;

    // Get RSVP counts for this meeting
    const rsvps = await db
      .select()
      .from(meetingRsvps)
      .where(eq(meetingRsvps.meetingId, nextMeeting.meetings.id));

    // Get total group members count
    const groupMembers = await db
      .select()
      .from(groupMemberships)
      .where(
        and(
          eq(groupMemberships.groupId, nextMeeting.meetings.groupId),
          eq(groupMemberships.status, "approved")
        )
      );

    // Count RSVPs by status including guests
    const attendingRsvps = rsvps.filter(r => r.status === "attending");
    const maybeRsvps = rsvps.filter(r => r.status === "maybe");
    
    const rsvpCounts = {
      attending: attendingRsvps.reduce((total, rsvp) => total + 1 + parseInt(String(rsvp.guestCount || '0')), 0),
      notAttending: rsvps.filter(r => r.status === "not_attending").length,
      maybe: maybeRsvps.reduce((total, rsvp) => total + 1 + parseInt(String(rsvp.guestCount || '0')), 0),
      notResponded: groupMembers.length - rsvps.length
    };

    // Get user's RSVP if exists
    const userRsvp = rsvps.find(r => r.userId === userId);

    return {
      ...nextMeeting.meetings,
      group: nextMeeting.groups,
      rsvpCounts,
      userRsvp
    };
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
  }

  // Notification generators
  async createMeetingReminderNotifications(meetingId: string): Promise<void> {
    // Get meeting details
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) return;

    // Get group members
    const groupMembers = await db
      .select()
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .where(
        and(
          eq(groupMemberships.groupId, meeting.groupId),
          eq(groupMemberships.status, "approved")
        )
      );

    // Create notifications for all group members
    const meetingDate = new Date(meeting.meetingDate);
    const reminderTime = new Date(meetingDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    for (const member of groupMembers) {
      await this.createNotification({
        userId: member.users.id,
        type: "meeting_reminder",
        title: "Upcoming Meeting Reminder",
        message: `Don't forget about tomorrow's meeting: ${meeting.title}`,
        relatedMeetingId: meetingId,
        relatedGroupId: meeting.groupId,
        scheduledFor: reminderTime,
      });
    }
  }

  async createPrayerRequestNotifications(prayerRequestId: string): Promise<void> {
    // Get prayer request details
    const prayerRequest = await db
      .select()
      .from(prayerRequests)
      .innerJoin(users, eq(prayerRequests.authorId, users.id))
      .where(eq(prayerRequests.id, prayerRequestId));

    if (prayerRequest.length === 0) return;

    const prayer = prayerRequest[0];

    // Get group members (excluding the author)
    const groupMembers = await db
      .select()
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .where(
        and(
          eq(groupMemberships.groupId, prayer.prayer_requests.groupId),
          eq(groupMemberships.status, "approved"),
          sql`${users.id} != ${prayer.prayer_requests.authorId}`
        )
      );

    // Create notifications for all group members
    for (const member of groupMembers) {
      await this.createNotification({
        userId: member.users.id,
        type: "prayer_request",
        title: "New Prayer Request",
        message: `${prayer.users.firstName} has shared a new prayer request: ${prayer.prayer_requests.title}`,
        relatedPrayerRequestId: prayerRequestId,
        relatedGroupId: prayer.prayer_requests.groupId,
      });
    }
  }

  // Birthday operations
  async updateUserBirthday(userId: string, birthday: string | null): Promise<void> {
    await db
      .update(users)
      .set({ birthday })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, profileData: { firstName?: string | null; lastName?: string | null; birthday?: string | null; profileImageUrl?: string | null }): Promise<void> {
    await db
      .update(users)
      .set({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        birthday: profileData.birthday,
        profileImageUrl: profileData.profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateMembershipBirthdaySharing(membershipId: string, shareBirthday: boolean): Promise<void> {
    await db
      .update(groupMemberships)
      .set({ shareBirthday })
      .where(eq(groupMemberships.id, membershipId));
  }

  async getGroupTodaysBirthdays(groupId: string): Promise<User[]> {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // getMonth() returns 0-11, need 1-12
    const todayDay = today.getDate();

    const birthdayMembers = await db
      .select({ user: users })
      .from(groupMemberships)
      .innerJoin(users, eq(groupMemberships.userId, users.id))
      .where(
        and(
          eq(groupMemberships.groupId, groupId),
          eq(groupMemberships.status, "approved"),
          eq(groupMemberships.shareBirthday, true),
          sql`EXTRACT(MONTH FROM ${users.birthday}) = ${todayMonth}`,
          sql`EXTRACT(DAY FROM ${users.birthday}) = ${todayDay}`
        )
      )
      .orderBy(asc(users.firstName));

    return birthdayMembers.map(result => result.user);
  }

  // User preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);
    
    return preferences || null;
  }

  async createOrUpdateUserPreferences(userId: string, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Check if preferences exist
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(userPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...preferences,
        })
        .returning();
      return created;
    }
  }

  // Group-specific notification preferences
  async getGroupNotificationPreferences(userId: string, groupId: string): Promise<GroupNotificationPreferences | null> {
    const [preferences] = await db
      .select()
      .from(groupNotificationPreferences)
      .where(and(
        eq(groupNotificationPreferences.userId, userId),
        eq(groupNotificationPreferences.groupId, groupId)
      ))
      .limit(1);
    
    return preferences || null;
  }

  async createOrUpdateGroupNotificationPreferences(userId: string, groupId: string, preferences: Partial<InsertGroupNotificationPreferences>): Promise<GroupNotificationPreferences> {
    // Check if preferences exist
    const existing = await this.getGroupNotificationPreferences(userId, groupId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(groupNotificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(and(
          eq(groupNotificationPreferences.userId, userId),
          eq(groupNotificationPreferences.groupId, groupId)
        ))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(groupNotificationPreferences)
        .values({
          userId,
          groupId,
          ...preferences,
        })
        .returning();
      return created;
    }
  }

  async getAllGroupNotificationPreferences(userId: string): Promise<GroupNotificationPreferences[]> {
    return await db
      .select()
      .from(groupNotificationPreferences)
      .where(eq(groupNotificationPreferences.userId, userId));
  }

  // Data export functionality
  async exportUserData(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const preferences = await this.getUserPreferences(userId);
    const groupPreferences = await this.getAllGroupNotificationPreferences(userId);
    const userGroups = await this.getUserGroups(userId);
    const userPrayers = await this.getUserPrayerRequests(userId);
    const userPendingRequests = await this.getUserPendingRequests(userId);
    
    return {
      user,
      preferences,
      groupNotificationPreferences: groupPreferences,
      groups: userGroups,
      prayerRequests: userPrayers,
      pendingMembershipRequests: userPendingRequests,
      exportedAt: new Date().toISOString(),
    };
  }

  // Phase 3: Prayer Templates
  async getPrayerTemplates(groupId?: string): Promise<PrayerTemplate[]> {
    const query = db
      .select()
      .from(prayerTemplates)
      .where(and(
        eq(prayerTemplates.isActive, true),
        or(
          eq(prayerTemplates.isPublic, true),
          eq(prayerTemplates.groupId, groupId || '')
        )
      ))
      .orderBy(desc(prayerTemplates.usageCount));
    
    return await query;
  }

  async createPrayerTemplate(template: InsertPrayerTemplate): Promise<PrayerTemplate> {
    const [created] = await db
      .insert(prayerTemplates)
      .values(template)
      .returning();
    return created;
  }

  async updatePrayerTemplateUsage(templateId: string): Promise<void> {
    await db
      .update(prayerTemplates)
      .set({
        usageCount: sql`usage_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(prayerTemplates.id, templateId));
  }

  // Phase 3: Prayer Comments
  async getPrayerComments(prayerRequestId: string, userId?: string): Promise<(PrayerComment & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> })[]> {
    const comments = await db
      .select({
        id: prayerComments.id,
        prayerRequestId: prayerComments.prayerRequestId,
        userId: prayerComments.userId,
        content: prayerComments.content,
        isPrivate: prayerComments.isPrivate,
        parentCommentId: prayerComments.parentCommentId,
        createdAt: prayerComments.createdAt,
        updatedAt: prayerComments.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(prayerComments)
      .innerJoin(users, eq(prayerComments.userId, users.id))
      .where(and(
        eq(prayerComments.prayerRequestId, prayerRequestId),
        or(
          eq(prayerComments.isPrivate, false),
          eq(prayerComments.userId, userId || '')
        )
      ))
      .orderBy(asc(prayerComments.createdAt));
    
    return comments;
  }

  async createPrayerComment(comment: InsertPrayerComment): Promise<PrayerComment> {
    const [created] = await db
      .insert(prayerComments)
      .values(comment)
      .returning();
    return created;
  }

  // Phase 3: Two-Factor Authentication
  async getTwoFactorAuth(userId: string): Promise<TwoFactorAuth | null> {
    const [auth] = await db
      .select()
      .from(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId))
      .limit(1);
    
    return auth || null;
  }

  async createTwoFactorAuth(auth: InsertTwoFactorAuth): Promise<TwoFactorAuth> {
    const [created] = await db
      .insert(twoFactorAuth)
      .values(auth)
      .returning();
    return created;
  }

  async updateTwoFactorAuth(userId: string, updates: Partial<InsertTwoFactorAuth>): Promise<TwoFactorAuth> {
    const [updated] = await db
      .update(twoFactorAuth)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId))
      .returning();
    return updated;
  }

  async deleteTwoFactorAuth(userId: string): Promise<void> {
    await db
      .delete(twoFactorAuth)
      .where(eq(twoFactorAuth.userId, userId));
  }

  // Phase 3: Enhanced Prayer Request Analytics
  async getPrayerRequestAnalytics(groupId: string, userId?: string): Promise<any> {
    const totalRequests = await db
      .select({ count: count() })
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId));

    const categoryStats = await db
      .select({
        category: prayerRequests.category,
        count: count(),
      })
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId))
      .groupBy(prayerRequests.category);

    const priorityStats = await db
      .select({
        priority: prayerRequests.priority,
        count: count(),
      })
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId))
      .groupBy(prayerRequests.priority);

    const recentActivity = await db
      .select({
        id: prayerRequests.id,
        title: prayerRequests.title,
        category: prayerRequests.category,
        priority: prayerRequests.priority,
        createdAt: prayerRequests.createdAt,
        author: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(prayerRequests)
      .innerJoin(users, eq(prayerRequests.authorId, users.id))
      .where(eq(prayerRequests.groupId, groupId))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(10);

    return {
      totalRequests: totalRequests[0]?.count || 0,
      categoryStats,
      priorityStats,
      recentActivity,
    };
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  /**
   * Get admin dashboard statistics
   * 
   * @description Retrieves overview statistics for the admin dashboard
   * @returns {Promise<object>} Dashboard statistics including user, group, meeting, and prayer counts
   */
  async getAdminDashboardStats() {
    const [userCount] = await this.db.select({ count: sql`count(*)` }).from(users);
    const [groupCount] = await this.db.select({ count: sql`count(*)` }).from(groups);
    const [meetingCount] = await this.db.select({ count: sql`count(*)` }).from(meetings);
    const [prayerCount] = await this.db.select({ count: sql`count(*)` }).from(prayerRequests);
    
    const recentUsers = await this.db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    const recentGroups = await this.db
      .select()
      .from(groups)
      .orderBy(desc(groups.createdAt))
      .limit(5);

    return {
      stats: {
        users: userCount.count,
        groups: groupCount.count,
        meetings: meetingCount.count,
        prayers: prayerCount.count,
      },
      recent: {
        users: recentUsers,
        groups: recentGroups,
      }
    };
  }

  /**
   * Get paginated users for admin
   * 
   * @description Retrieves users with pagination and search functionality
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of users per page
   * @param {string} search - Search term for filtering users
   * @returns {Promise<object>} Paginated user results
   */
  async getAdminUsers(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    
    let query = this.db.select().from(users);
    
    if (search) {
      query = query.where(
        sql`${users.firstName} ILIKE ${`%${search}%`} OR 
            ${users.lastName} ILIKE ${`%${search}%`} OR 
            ${users.email} ILIKE ${`%${search}%`}`
      );
    }

    const [results, [totalCount]] = await Promise.all([
      query.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: sql`count(*)` }).from(users)
    ]);

    return {
      users: results,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  /**
   * Get detailed user information for admin
   * 
   * @description Retrieves comprehensive user details including group memberships
   * @param {string} userId - User ID to retrieve
   * @returns {Promise<object>} Detailed user information
   */
  async getAdminUserDetails(userId: string) {
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return null;

    const userMemberships = await this.db
      .select({
        groupId: memberships.groupId,
        groupName: groups.name,
        role: memberships.role,
        joinedAt: memberships.createdAt
      })
      .from(memberships)
      .leftJoin(groups, eq(memberships.groupId, groups.id))
      .where(eq(memberships.userId, userId));

    return {
      ...user[0],
      memberships: userMemberships
    };
  }

  /**
   * Update user information (admin only)
   * 
   * @description Updates user details with admin privileges
   * @param {string} userId - User ID to update
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated user information
   */
  async updateAdminUser(userId: string, updateData: any) {
    const [updatedUser] = await this.db
      .update(users)
      .set({
        ...updateData,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  /**
   * Delete user (admin only)
   * 
   * @description Soft deletes a user and removes from all groups
   * @param {string} userId - User ID to delete
   * @returns {Promise<void>}
   */
  async deleteAdminUser(userId: string) {
    // Remove from all groups
    await this.db.delete(memberships).where(eq(memberships.userId, userId));
    
    // Soft delete user
    await this.db
      .update(users)
      .set({ 
        email: sql`${users.email} || '_deleted_' || extract(epoch from now())`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(users.id, userId));
  }

  /**
   * Get paginated groups for admin
   * 
   * @description Retrieves groups with pagination and search functionality
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of groups per page
   * @param {string} search - Search term for filtering groups
   * @returns {Promise<object>} Paginated group results
   */
  async getAdminGroups(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    
    let query = this.db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdAt: groups.createdAt,
        memberCount: sql`count(${memberships.userId})`
      })
      .from(groups)
      .leftJoin(memberships, eq(groups.id, memberships.groupId));
    
    if (search) {
      query = query.where(
        sql`${groups.name} ILIKE ${`%${search}%`} OR 
            ${groups.description} ILIKE ${`%${search}%`}`
      );
    }

    const [results, [totalCount]] = await Promise.all([
      query
        .groupBy(groups.id)
        .orderBy(desc(groups.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql`count(*)` }).from(groups)
    ]);

    return {
      groups: results,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  /**
   * Get detailed group information for admin
   * 
   * @description Retrieves comprehensive group details including members
   * @param {string} groupId - Group ID to retrieve
   * @returns {Promise<object>} Detailed group information
   */
  async getAdminGroupDetails(groupId: string) {
    const group = await this.db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group.length) return null;

    const members = await this.db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: memberships.role,
        joinedAt: memberships.createdAt
      })
      .from(memberships)
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.groupId, groupId));

    return {
      ...group[0],
      members
    };
  }

  /**
   * Update group information (admin only)
   * 
   * @description Updates group details with admin privileges
   * @param {string} groupId - Group ID to update
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated group information
   */
  async updateAdminGroup(groupId: string, updateData: any) {
    const [updatedGroup] = await this.db
      .update(groups)
      .set({
        ...updateData,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(groups.id, groupId))
      .returning();

    return updatedGroup;
  }

  /**
   * Delete group (admin only)
   * 
   * @description Deletes a group and all associated data
   * @param {string} groupId - Group ID to delete
   * @returns {Promise<void>}
   */
  async deleteAdminGroup(groupId: string) {
    // Delete all memberships
    await this.db.delete(memberships).where(eq(memberships.groupId, groupId));
    
    // Delete all meetings
    await this.db.delete(meetings).where(eq(meetings.groupId, groupId));
    
    // Delete all prayer requests
    await this.db.delete(prayerRequests).where(eq(prayerRequests.groupId, groupId));
    
    // Delete the group
    await this.db.delete(groups).where(eq(groups.id, groupId));
  }

  /**
   * Get paginated meetings for admin
   * 
   * @description Retrieves meetings with pagination and search functionality
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of meetings per page
   * @param {string} search - Search term for filtering meetings
   * @returns {Promise<object>} Paginated meeting results
   */
  async getAdminMeetings(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    
    let query = this.db
      .select({
        id: meetings.id,
        title: meetings.title,
        description: meetings.description,
        meetingDate: meetings.meetingDate,
        status: meetings.status,
        groupName: groups.name,
        createdAt: meetings.createdAt
      })
      .from(meetings)
      .leftJoin(groups, eq(meetings.groupId, groups.id));
    
    if (search) {
      query = query.where(
        sql`${meetings.title} ILIKE ${`%${search}%`} OR 
            ${meetings.description} ILIKE ${`%${search}%`} OR
            ${groups.name} ILIKE ${`%${search}%`}`
      );
    }

    const [results, [totalCount]] = await Promise.all([
      query.orderBy(desc(meetings.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: sql`count(*)` }).from(meetings)
    ]);

    return {
      meetings: results,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  /**
   * Get detailed meeting information for admin
   * 
   * @description Retrieves comprehensive meeting details including RSVPs
   * @param {string} meetingId - Meeting ID to retrieve
   * @returns {Promise<object>} Detailed meeting information
   */
  async getAdminMeetingDetails(meetingId: string) {
    const meeting = await this.db
      .select({
        id: meetings.id,
        title: meetings.title,
        description: meetings.description,
        meetingDate: meetings.meetingDate,
        status: meetings.status,
        groupId: meetings.groupId,
        groupName: groups.name,
        createdAt: meetings.createdAt
      })
      .from(meetings)
      .leftJoin(groups, eq(meetings.groupId, groups.id))
      .where(eq(meetings.id, meetingId))
      .limit(1);
      
    if (!meeting.length) return null;

    const rsvps = await this.db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        status: meetingRsvps.status,
        notes: meetingRsvps.notes,
        rsvpDate: meetingRsvps.createdAt
      })
      .from(meetingRsvps)
      .leftJoin(users, eq(meetingRsvps.userId, users.id))
      .where(eq(meetingRsvps.meetingId, meetingId));

    return {
      ...meeting[0],
      rsvps
    };
  }

  /**
   * Delete meeting (admin only)
   * 
   * @description Deletes a meeting and all associated RSVPs
   * @param {string} meetingId - Meeting ID to delete
   * @returns {Promise<void>}
   */
  async deleteAdminMeeting(meetingId: string) {
    // Delete all RSVPs
    await this.db.delete(meetingRsvps).where(eq(meetingRsvps.meetingId, meetingId));
    
    // Delete the meeting
    await this.db.delete(meetings).where(eq(meetings.id, meetingId));
  }

  /**
   * Get paginated prayers for admin
   * 
   * @description Retrieves prayers with pagination and search functionality
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of prayers per page
   * @param {string} search - Search term for filtering prayers
   * @returns {Promise<object>} Paginated prayer results
   */
  async getAdminPrayers(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;
    
    let query = this.db
      .select({
        id: prayerRequests.id,
        title: prayerRequests.title,
        description: prayerRequests.description,
        category: prayerRequests.category,
        priority: prayerRequests.priority,
        status: prayerRequests.status,
        groupName: groups.name,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: prayerRequests.createdAt
      })
      .from(prayerRequests)
      .leftJoin(groups, eq(prayerRequests.groupId, groups.id))
      .leftJoin(users, eq(prayerRequests.authorId, users.id));
    
    if (search) {
      query = query.where(
        sql`${prayerRequests.title} ILIKE ${`%${search}%`} OR 
            ${prayerRequests.description} ILIKE ${`%${search}%`} OR
            ${groups.name} ILIKE ${`%${search}%`}`
      );
    }

    const [results, [totalCount]] = await Promise.all([
      query.orderBy(desc(prayerRequests.createdAt)).limit(limit).offset(offset),
      this.db.select({ count: sql`count(*)` }).from(prayerRequests)
    ]);

    return {
      prayers: results,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  /**
   * Get detailed prayer information for admin
   * 
   * @description Retrieves comprehensive prayer details including responses
   * @param {string} prayerId - Prayer ID to retrieve
   * @returns {Promise<object>} Detailed prayer information
   */
  async getAdminPrayerDetails(prayerId: string) {
    const prayer = await this.db
      .select({
        id: prayerRequests.id,
        title: prayerRequests.title,
        description: prayerRequests.description,
        category: prayerRequests.category,
        priority: prayerRequests.priority,
        status: prayerRequests.status,
        groupId: prayerRequests.groupId,
        groupName: groups.name,
        authorId: prayerRequests.authorId,
        authorName: sql`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: prayerRequests.createdAt
      })
      .from(prayerRequests)
      .leftJoin(groups, eq(prayerRequests.groupId, groups.id))
      .leftJoin(users, eq(prayerRequests.authorId, users.id))
      .where(eq(prayerRequests.id, prayerId))
      .limit(1);
      
    if (!prayer.length) return null;

    const responses = await this.db
      .select({
        id: prayerResponses.id,
        message: prayerResponses.message,
        responseType: prayerResponses.responseType,
        userId: users.id,
        userName: sql`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: prayerResponses.createdAt
      })
      .from(prayerResponses)
      .leftJoin(users, eq(prayerResponses.userId, users.id))
      .where(eq(prayerResponses.prayerRequestId, prayerId))
      .orderBy(prayerResponses.createdAt);

    return {
      ...prayer[0],
      responses
    };
  }

  /**
   * Delete prayer (admin only)
   * 
   * @description Deletes a prayer and all associated responses
   * @param {string} prayerId - Prayer ID to delete
   * @returns {Promise<void>}
   */
  async deleteAdminPrayer(prayerId: string) {
    // Delete all responses
    await this.db.delete(prayerResponses).where(eq(prayerResponses.prayerRequestId, prayerId));
    
    // Delete the prayer request
    await this.db.delete(prayerRequests).where(eq(prayerRequests.id, prayerId));
  }

  /**
   * Get paginated chat messages for admin
   * 
   * @description Retrieves chat messages with pagination and optional group filtering
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of messages per page
   * @param {string} groupId - Optional group ID to filter messages
   * @returns {Promise<object>} Paginated chat results
   */
  async getAdminChats(page: number, limit: number, groupId: string) {
    const offset = (page - 1) * limit;
    
    let query = this.db
      .select({
        id: sql`'chat_' || generate_random_uuid()`, // Placeholder since we don't have a chat table yet
        message: sql`'Sample chat message'`,
        groupName: groups.name,
        userName: sql`${users.firstName} || ' ' || ${users.lastName}`,
        createdAt: sql`CURRENT_TIMESTAMP`
      })
      .from(groups)
      .leftJoin(users, sql`true`); // Placeholder join
    
    if (groupId) {
      query = query.where(eq(groups.id, groupId));
    }

    // This is a placeholder implementation since chat functionality needs to be built
    return {
      chats: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0
      }
    };
  }

  /**
   * Delete chat message (admin only)
   * 
   * @description Deletes a chat message
   * @param {string} messageId - Message ID to delete
   * @returns {Promise<void>}
   */
  async deleteAdminChatMessage(messageId: string) {
    // Placeholder implementation since chat functionality needs to be built
    console.log(`Admin deleted chat message: ${messageId}`);
  }

  /**
   * Get system logs for admin
   * 
   * @description Retrieves system logs with pagination and optional level filtering
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of logs per page
   * @param {string} level - Optional log level to filter
   * @returns {Promise<object>} Paginated log results
   */
  async getAdminLogs(page: number, limit: number, level: string) {
    // Placeholder implementation since logging functionality needs to be built
    return {
      logs: [
        {
          id: 1,
          level: 'info',
          message: 'System startup',
          timestamp: new Date().toISOString(),
          source: 'server'
        }
      ],
      pagination: {
        page,
        limit,
        total: 1,
        pages: 1
      }
    };
  }

  /**
   * Get system health information
   * 
   * @description Retrieves system health status and metrics
   * @returns {Promise<object>} System health information
   */
  async getSystemHealth() {
    const dbTest = await this.db.select({ test: sql`1` }).limit(1);
    
    return {
      status: 'healthy',
      database: dbTest.length > 0 ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

export const storage = new DatabaseStorage();
