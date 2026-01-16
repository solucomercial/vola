import { pgTable, text, timestamp, jsonb, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["requester", "approver", "admin"]);
export const typeEnum = pgEnum("request_type", ["flight", "hotel", "car"]);
export const statusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").default("requester").notNull(),
  avatar: text("avatar"),
});

export const travelRequests = pgTable("travel_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(),
  type: typeEnum("type").notNull(),
  origin: text("origin"),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  reason: text("reason").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  selectedOption: jsonb("selected_option").notNull(),
  alternatives: jsonb("alternatives").notNull(),
  bookingUrl: text("booking_url"), // Campo para o link de reserva externa
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvalCode: text("approval_code"),
  rejectionReason: text("rejection_reason"),
  approverId: text("approver_id"),
});

export const usersRelations = relations(users, ({ many }) => ({
  requests: many(travelRequests),
}));

export const travelRequestsRelations = relations(travelRequests, ({ one }) => ({
  user: one(users, {
    fields: [travelRequests.userId],
    references: [users.id],
  }),
}));