import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  pgEnum,
  unique,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  birthday: date("birthday"), // Optional birthday for group sharing
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  location: varchar("location"), // Human readable location
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Notification preferences
  prayerNotifications: boolean("prayer_notifications").default(true),
  meetingNotifications: boolean("meeting_notifications").default(true),
  groupNotifications: boolean("group_notifications").default(true),
  dailyVerseNotifications: boolean("daily_verse_notifications").default(true),
  birthdayNotifications: boolean("birthday_notifications").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  
  // Privacy preferences
  profileVisibility: varchar("profile_visibility").default("group_members"), // 'public', 'group_members', 'private'
  showPrayerActivity: boolean("show_prayer_activity").default(true),
  showMeetingAttendance: boolean("show_meeting_attendance").default(true),
  allowGroupInvitations: boolean("allow_group_invitations").default(true),
  
  // Phase 2: Advanced notification settings
  notificationFrequency: varchar("notification_frequency").default("real_time"), // 'real_time', 'daily_digest', 'weekly_summary'
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: varchar("quiet_hours_start").default("22:00"), // HH:MM format
  quietHoursEnd: varchar("quiet_hours_end").default("08:00"), // HH:MM format
  pushNotifications: boolean("push_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  
  // Phase 2: Location privacy
  locationSharingEnabled: boolean("location_sharing_enabled").default(true),
  locationAccuracy: varchar("location_accuracy").default("approximate"), // 'exact', 'approximate', 'city_only'
  proximityBasedGroups: boolean("proximity_based_groups").default(true),
  
  // Phase 2: Data management
  dataRetentionDays: integer("data_retention_days").default(365), // How long to keep user data
  autoArchivePrayers: boolean("auto_archive_prayers").default(false),
  archiveAfterDays: integer("archive_after_days").default(30),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId), // One preferences record per user
]);

// Group-specific notification preferences
export const groupNotificationPreferences = pgTable("group_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  
  // Group-specific notification toggles
  prayerNotifications: boolean("prayer_notifications").default(true),
  meetingNotifications: boolean("meeting_notifications").default(true),
  groupActivityNotifications: boolean("group_activity_notifications").default(true),
  chatNotifications: boolean("chat_notifications").default(true),
  
  // Notification frequency for this group
  notificationFrequency: varchar("notification_frequency").default("real_time"), // 'real_time', 'daily_digest', 'weekly_summary'
  
  // Mute settings
  mutedUntil: timestamp("muted_until"), // Temporarily mute notifications until this date
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.groupId), // One preference record per user per group
]);

// Group audience (who can join) - moved up for proper initialization
export const groupAudienceEnum = pgEnum("group_audience", [
  "men_only",
  "women_only", 
  "coed"
]);

// Group purpose categories - moved up for proper initialization  
export const groupPurposeEnum = pgEnum("group_purpose", [
  "prayer",
  "bible_study",
  "fellowship",
  "youth",
  "marriage_couples",
  "recovery_healing",
  "outreach_service",
  "other"
]);

// Prayer groups
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  meetingDay: varchar("meeting_day"), // e.g., "Friday" - default schedule for discovery
  meetingTime: varchar("meeting_time"), // e.g., "17:45" - default schedule for discovery
  meetingLocation: varchar("meeting_location"), // Default meeting location
  isRecurringMeeting: boolean("is_recurring_meeting").default(true), // true for ongoing groups, false for one-time events
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isPublic: boolean("is_public").default(true),
  // Group characteristics for discovery
  audience: groupAudienceEnum("audience").default("coed"), // Who can join this group
  purpose: groupPurposeEnum("purpose").default("prayer"), // Main purpose of the group
  purposeTagline: text("purpose_tagline"), // Optional short description of group's focus
  // Moderation settings
  requireApprovalToJoin: boolean("require_approval_to_join").default(true),
  requireApprovalToPost: boolean("require_approval_to_post").default(false),
  allowMembersToInvite: boolean("allow_members_to_invite").default(false),
  requireBirthdayToJoin: boolean("require_birthday_to_join").default(false),
  maxMembers: varchar("max_members").default("50"),
  groupRules: text("group_rules"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group membership status
export const membershipStatusEnum = pgEnum("membership_status", [
  "pending",
  "approved",
  "rejected"
]);

// Group member roles
export const memberRoleEnum = pgEnum("member_role", [
  "member",
  "admin",
  "moderator"
]);

// Group memberships
export const groupMemberships = pgTable("group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: membershipStatusEnum("status").default("pending"),
  role: memberRoleEnum("role").default("member"),
  message: text("message"), // Join request message
  shareBirthday: boolean("share_birthday").default(false), // Whether to share birthday with this group
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prayer request status
export const prayerStatusEnum = pgEnum("prayer_status", [
  "active",
  "answered",
  "closed"
]);

// Prayer request category
export const prayerCategoryEnum = pgEnum("prayer_category", [
  "health_healing",
  "family_relationships",
  "work_career",
  "spiritual_growth",
  "financial_provision",
  "other"
]);

// Prayer requests
export const prayerRequests = pgTable("prayer_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: prayerCategoryEnum("category").default("other"),
  status: prayerStatusEnum("status").default("active"),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  isUrgent: boolean("is_urgent").default(false),
  
  // Phase 3: Enhanced prayer request features
  privacyLevel: varchar("privacy_level").default("group"), // 'public', 'group', 'private'
  expiresAt: timestamp("expires_at"), // Optional expiration date
  templateId: varchar("template_id"), // Will reference prayer templates table
  tags: text("tags"), // JSON array of tags for better organization
  priority: varchar("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  allowComments: boolean("allow_comments").default(true),
  allowPrayerResponses: boolean("allow_prayer_responses").default(true),
  reminderEnabled: boolean("reminder_enabled").default(false),
  reminderFrequency: varchar("reminder_frequency").default("weekly"), // 'daily', 'weekly', 'monthly'
  lastReminderSent: timestamp("last_reminder_sent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prayer templates for common prayer request types
export const prayerTemplates = pgTable("prayer_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: prayerCategoryEnum("category").notNull(),
  template: text("template").notNull(), // The prayer request template text
  isPublic: boolean("is_public").default(true), // Can be used by all groups
  createdBy: varchar("created_by").references(() => users.id), // If null, it's a system template
  groupId: varchar("group_id").references(() => groups.id), // If null, it's available to all groups
  tags: text("tags"), // JSON array of tags
  usageCount: integer("usage_count").default(0), // How many times this template has been used
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prayer responses (when someone says "I'm praying")
export const prayerResponses = pgTable("prayer_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prayerRequestId: varchar("prayer_request_id").references(() => prayerRequests.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prayer comments for enhanced interaction
export const prayerComments = pgTable("prayer_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prayerRequestId: varchar("prayer_request_id").references(() => prayerRequests.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false), // Private comments only visible to prayer author
  parentCommentId: varchar("parent_comment_id"), // For nested comments - will add reference later
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Message status for moderation
export const messageStatusEnum = pgEnum("message_status", [
  "pending",
  "approved",
  "rejected"
]);

// Meeting status
export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled",
  "cancelled",
  "completed"
]);

// RSVP status
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "attending",
  "not_attending", 
  "maybe"
]);

// Two-factor authentication settings
export const twoFactorAuth = pgTable("two_factor_auth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  secret: varchar("secret").notNull(), // TOTP secret key
  backupCodes: text("backup_codes"), // JSON array of backup codes
  isEnabled: boolean("is_enabled").default(false),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.userId), // One 2FA record per user
]);

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, prayer_request, etc.
  status: messageStatusEnum("status").default("approved"), // Auto-approved unless group requires moderation
  prayerRequestId: varchar("prayer_request_id").references(() => prayerRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group meetings
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  topic: varchar("topic"),
  meetingDate: timestamp("meeting_date").notNull(),
  venue: varchar("venue"),
  venueAddress: text("venue_address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: meetingStatusEnum("status").default("scheduled"),
  maxAttendees: varchar("max_attendees"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // weekly, monthly, etc.
  recurringDayOfWeek: varchar("recurring_day_of_week"), // Monday, Tuesday, etc.
  recurringTime: varchar("recurring_time"), // HH:MM format
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting RSVPs
export const meetingRsvps = pgTable("meeting_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: rsvpStatusEnum("status").default("attending"),
  notes: text("notes"),
  guestCount: integer("guest_count").default(0), // Number of additional people they're bringing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint to ensure one RSVP per user per meeting
  unique().on(table.meetingId, table.userId),
]);

// Group invitations
export const groupInvitations = pgTable("group_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  token: varchar("token").unique().notNull(),
  createdById: varchar("created_by_id").references(() => users.id).notNull(),
  maxUses: varchar("max_uses").default("unlimited"), // "unlimited" or a number
  currentUses: varchar("current_uses").default("0"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification types
export const notificationTypeEnum = pgEnum("notification_type", [
  "meeting_reminder",
  "prayer_request",
  "rsvp_reminder",
  "meeting_update",
  "general"
]);

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedMeetingId: varchar("related_meeting_id").references(() => meetings.id),
  relatedPrayerRequestId: varchar("related_prayer_request_id").references(() => prayerRequests.id),
  relatedGroupId: varchar("related_group_id").references(() => groups.id),
  isRead: boolean("is_read").default(false),
  scheduledFor: timestamp("scheduled_for"), // When to send the notification
  sentAt: timestamp("sent_at"), // When notification was actually sent
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  adminGroups: many(groups),
  memberships: many(groupMemberships),
  prayerRequests: many(prayerRequests),
  prayerResponses: many(prayerResponses),
  chatMessages: many(chatMessages),
  meetingRsvps: many(meetingRsvps),
  createdInvitations: many(groupInvitations),
  notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  admin: one(users, {
    fields: [groups.adminId],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
  prayerRequests: many(prayerRequests),
  chatMessages: many(chatMessages),
  meetings: many(meetings),
  invitations: many(groupInvitations),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

export const prayerRequestsRelations = relations(prayerRequests, ({ one, many }) => ({
  author: one(users, {
    fields: [prayerRequests.authorId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [prayerRequests.groupId],
    references: [groups.id],
  }),
  responses: many(prayerResponses),
  chatMessages: many(chatMessages),
}));

export const prayerResponsesRelations = relations(prayerResponses, ({ one }) => ({
  prayerRequest: one(prayerRequests, {
    fields: [prayerResponses.prayerRequestId],
    references: [prayerRequests.id],
  }),
  user: one(users, {
    fields: [prayerResponses.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  group: one(groups, {
    fields: [chatMessages.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  prayerRequest: one(prayerRequests, {
    fields: [chatMessages.prayerRequestId],
    references: [prayerRequests.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  group: one(groups, {
    fields: [meetings.groupId],
    references: [groups.id],
  }),
  rsvps: many(meetingRsvps),
}));

export const meetingRsvpsRelations = relations(meetingRsvps, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingRsvps.meetingId],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingRsvps.userId],
    references: [users.id],
  }),
}));

export const groupInvitationsRelations = relations(groupInvitations, ({ one }) => ({
  group: one(groups, {
    fields: [groupInvitations.groupId],
    references: [groups.id],
  }),
  createdBy: one(users, {
    fields: [groupInvitations.createdById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  meeting: one(meetings, {
    fields: [notifications.relatedMeetingId],
    references: [meetings.id],
  }),
  prayerRequest: one(prayerRequests, {
    fields: [notifications.relatedPrayerRequestId],
    references: [prayerRequests.id],
  }),
  group: one(groups, {
    fields: [notifications.relatedGroupId],
    references: [groups.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  createdAt: true,
  joinedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  meetingDate: z.string().datetime().transform((val) => new Date(val)),
  createdBy: z.string(),
});

export const insertMeetingRsvpSchema = createInsertSchema(meetingRsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupInvitationSchema = createInsertSchema(groupInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupNotificationPreferencesSchema = createInsertSchema(groupNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerTemplateSchema = createInsertSchema(prayerTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerCommentSchema = createInsertSchema(prayerComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTwoFactorAuthSchema = createInsertSchema(twoFactorAuth).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type GroupNotificationPreferences = typeof groupNotificationPreferences.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type PrayerTemplate = typeof prayerTemplates.$inferSelect;
export type PrayerComment = typeof prayerComments.$inferSelect;
export type PrayerResponse = typeof prayerResponses.$inferSelect;
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type MeetingRsvp = typeof meetingRsvps.$inferSelect;
export type GroupInvitation = typeof groupInvitations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertGroupNotificationPreferences = z.infer<typeof insertGroupNotificationPreferencesSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type InsertPrayerTemplate = z.infer<typeof insertPrayerTemplateSchema>;
export type InsertPrayerComment = z.infer<typeof insertPrayerCommentSchema>;
export type InsertTwoFactorAuth = z.infer<typeof insertTwoFactorAuthSchema>;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type InsertMeetingRsvp = z.infer<typeof insertMeetingRsvpSchema>;
export type InsertGroupInvitation = z.infer<typeof insertGroupInvitationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
