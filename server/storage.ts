import {
  users,
  groups,
  groupMemberships,
  prayerRequests,
  prayerResponses,
  chatMessages,
  meetings,
  meetingRsvps,
  groupInvitations,
  notifications,
  type User,
  type UpsertUser,
  type Group,
  type GroupMembership,
  type PrayerRequest,
  type PrayerResponse,
  type ChatMessage,
  type Meeting,
  type MeetingRsvp,
  type GroupInvitation,
  type InsertGroup,
  type InsertPrayerRequest,
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
  updateGroup(id: string, group: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsByLocation(latitude: number, longitude: number, radiusKm?: number): Promise<Group[]>;
  getUserGroups(userId: string): Promise<Group[]>;
  getPublicGroups(): Promise<Group[]>;
  deleteGroup(id: string): Promise<void>;
  
  // Group membership operations
  requestGroupJoin(membership: InsertGroupMembership): Promise<GroupMembership>;
  approveGroupMembership(membershipId: string): Promise<void>;
  rejectGroupMembership(membershipId: string): Promise<void>;
  getGroupMemberships(groupId: string): Promise<(GroupMembership & { user: User })[]>;
  getPendingMemberships(adminUserId: string): Promise<(GroupMembership & { user: User; group: Group })[]>;
  getUserMembershipStatus(userId: string, groupId: string): Promise<GroupMembership | undefined>;
  
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
        target: users.id,
        set: {
          ...userData,
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

  async updateGroup(id: string, groupData: InsertGroup): Promise<Group> {
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
    // Delete all related data in the correct order due to foreign key constraints
    
    // Delete group invitations
    await db
      .delete(groupInvitations)
      .where(eq(groupInvitations.groupId, id));
    
    // Delete meeting RSVPs for meetings in this group
    const groupMeetings = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.groupId, id));
    
    const meetingIds = groupMeetings.map(m => m.id);
    if (meetingIds.length > 0) {
      await db
        .delete(meetingRsvps)
        .where(inArray(meetingRsvps.meetingId, meetingIds));
    }
    
    // Delete meetings
    await db
      .delete(meetings)
      .where(eq(meetings.groupId, id));
    
    // Delete chat messages
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.groupId, id));
    
    // Get prayer request IDs to delete responses
    const groupPrayers = await db
      .select({ id: prayerRequests.id })
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, id));
    
    const prayerIds = groupPrayers.map(p => p.id);
    if (prayerIds.length > 0) {
      // Delete prayer responses
      await db
        .delete(prayerResponses)
        .where(inArray(prayerResponses.prayerRequestId, prayerIds));
    }
    
    // Delete prayer requests
    await db
      .delete(prayerRequests)
      .where(eq(prayerRequests.groupId, id));
    
    // Delete group memberships
    await db
      .delete(groupMemberships)
      .where(eq(groupMemberships.groupId, id));
    
    // Delete notifications related to this group
    await db
      .delete(notifications)
      .where(eq(notifications.relatedGroupId, id));
    
    // Finally delete the group itself
    await db
      .delete(groups)
      .where(eq(groups.id, id));
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
    const [newRsvp] = await db
      .insert(meetingRsvps)
      .values(rsvp)
      .onConflictDoUpdate({
        target: [meetingRsvps.meetingId, meetingRsvps.userId],
        set: {
          status: rsvp.status,
          notes: rsvp.notes,
          guestCount: rsvp.guestCount,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newRsvp;
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
          sql`${meetings.meetingDate} >= ${now}`,
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
      attending: attendingRsvps.reduce((total, rsvp) => total + 1 + parseInt(rsvp.guestCount || '0'), 0),
      notAttending: rsvps.filter(r => r.status === "not_attending").length,
      maybe: maybeRsvps.reduce((total, rsvp) => total + 1 + parseInt(rsvp.guestCount || '0'), 0),
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
}

export const storage = new DatabaseStorage();
