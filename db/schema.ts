import { pgTable, text, timestamp, boolean, jsonb, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("user_role", ["requester", "approver", "admin"]);
export const typeEnum = pgEnum("request_type", ["flight", "hotel", "car"]);
export const statusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

// Tabela de Usuários
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Usaremos o ID do Clerk ou CUID manual
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").default("requester").notNull(),
  avatar: text("avatar"),
});

// Tabela de Solicitações
export const travelRequests = pgTable("travel_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(),
  type: typeEnum("type").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  returnDate: timestamp("return_date").notNull(),
  reason: text("reason").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  selectedOption: jsonb("selected_option").notNull(), // Substitui o Json do Prisma
  alternatives: jsonb("alternatives").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvalCode: text("approval_code"),
  rejectionReason: text("rejection_reason"),
  approverId: text("approver_id"),
});

// Relações para a tabela de Usuários
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(travelRequests),
}));

// Relações para a tabela de Solicitações (Obrigatório para o Studio)
export const travelRequestsRelations = relations(travelRequests, ({ one }) => ({
  user: one(users, {
    fields: [travelRequests.userId],
    references: [users.id],
  }),
}));