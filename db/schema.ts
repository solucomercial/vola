// db/schema.ts
import { pgTable, text, timestamp, jsonb, pgEnum, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["requester", "approver", "buyer", "admin"]);
export const typeEnum = pgEnum("request_type", ["flight", "hotel", "car"]);
export const statusEnum = pgEnum("request_status", ["pending", "approved", "rejected", "purchased"]);
export const notifTypeEnum = pgEnum("notif_type", ["approval", "rejection", "system", "new_request"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("requester").notNull(),
  avatar: text("avatar"),
});

export const travelRequests: any = pgTable("travel_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(),
  type: typeEnum("type").notNull(),
  origin: text("origin"),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  reason: text("reason").notNull(),
  justification: text("justification"), // Campo para justificar se não for a opção mais barata
  costCenter: text("cost_center").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  selectedOption: jsonb("selected_option").notNull(),
  alternatives: jsonb("alternatives").notNull(),
  bookingUrl: text("booking_url"),
  parentRequestId: uuid("parent_request_id").references(() => travelRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvalCode: text("approval_code"),
  rejectionReason: text("rejection_reason"),
  approverId: text("approver_id"),
  purchaseConfirmationCodes: jsonb("purchase_confirmation_codes"),
  buyerId: text("buyer_id"),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  type: notifTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  requestId: uuid("request_id").references(() => travelRequests.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  requests: many(travelRequests),
  notifications: many(notifications),
}));

export const travelRequestsRelations = relations(travelRequests, ({ one }) => ({
  user: one(users, {
    fields: [travelRequests.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  request: one(travelRequests, {
    fields: [notifications.requestId],
    references: [travelRequests.id],
  }),
}));