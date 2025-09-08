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
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  location: varchar("location"), // Human readable location
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prayer groups
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  meetingDay: varchar("meeting_day"), // e.g., "Friday"
  meetingTime: varchar("meeting_time"), // e.g., "17:45"
  meetingLocation: varchar("meeting_location"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isPublic: boolean("is_public").default(true),
  // Moderation settings
  requireApprovalToJoin: boolean("require_approval_to_join").default(true),
  requireApprovalToPost: boolean("require_approval_to_post").default(false),
  allowMembersToInvite: boolean("allow_members_to_invite").default(false),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting RSVPs
export const meetingRsvps = pgTable("meeting_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: rsvpStatusEnum("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  adminGroups: many(groups),
  memberships: many(groupMemberships),
  prayerRequests: many(prayerRequests),
  prayerResponses: many(prayerResponses),
  chatMessages: many(chatMessages),
  meetingRsvps: many(meetingRsvps),
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
});

export const insertMeetingRsvpSchema = createInsertSchema(meetingRsvps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMembership = typeof groupMemberships.$inferSelect;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type PrayerResponse = typeof prayerResponses.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Meeting = typeof meetings.$inferSelect;
export type MeetingRsvp = typeof meetingRsvps.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type InsertMeetingRsvp = z.infer<typeof insertMeetingRsvpSchema>;
