import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'sales', 'support', 'client']);

// Enum for subscription types
export const subscriptionTypeEnum = pgEnum('subscription_type', ['monthly', 'quarterly', 'yearly']);

// Enum for license status
export const licenseStatusEnum = pgEnum('license_status', ['active', 'expired', 'pending', 'revoked']);

// Enum for ticket status
export const ticketStatusEnum = pgEnum('ticket_status', ['new', 'in_progress', 'resolved', 'closed']);

// Enum for ticket priority
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'critical']);

// Enum for transaction status
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'refunded', 'failed']);

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('client'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Clients Table
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  companyName: text('company_name').notNull(),
  contactEmail: text('contact_email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  phoneNumber: text('phone_number'),
  website: text('website'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products Table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions Table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  subscriptionType: subscriptionTypeEnum('subscription_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  autoRenew: boolean('auto_renew').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Licenses Table
export const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id).notNull(),
  licenseKey: text('license_key').notNull().unique(),
  status: licenseStatusEnum('status').notNull().default('active'),
  activationDate: date('activation_date').notNull(),
  expirationDate: date('expiration_date').notNull(),
  lastChecked: timestamp('last_checked'),
  notificationsSent: integer('notifications_sent').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices Table
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  isPaid: boolean('is_paid').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions Table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  invoiceId: integer('invoice_id').references(() => invoices.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Staff Table
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  department: text('department').notNull(),
  position: text('position').notNull(),
  hireDate: date('hire_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Support Tickets Table
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('status').notNull().default('new'),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  assignedTo: integer('assigned_to').references(() => staff.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

// Ticket Updates Table
export const ticketUpdates = pgTable('ticket_updates', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').references(() => tickets.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  type: text('type').notNull(),
  relatedId: integer('related_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define Relations

export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  staff: one(staff, {
    fields: [users.id],
    references: [staff.userId],
  }),
  ticketUpdates: many(ticketUpdates),
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  transactions: many(transactions),
  tickets: many(tickets),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  client: one(clients, {
    fields: [subscriptions.clientId],
    references: [clients.id],
  }),
  product: one(products, {
    fields: [subscriptions.productId],
    references: [products.id],
  }),
  licenses: many(licenses),
  invoices: many(invoices),
}));

export const licensesRelations = relations(licenses, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [licenses.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [transactions.invoiceId],
    references: [invoices.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  assignedTickets: many(tickets, {
    fields: [staff.id],
    references: [tickets.assignedTo],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  assignedStaff: one(staff, {
    fields: [tickets.assignedTo],
    references: [staff.id],
  }),
  updates: many(ticketUpdates),
}));

export const ticketUpdatesRelations = relations(ticketUpdates, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketUpdates.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketUpdates.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Define Insert Schemas

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export const insertTicketUpdateSchema = createInsertSchema(ticketUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Define Types

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staff.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertTicketUpdate = z.infer<typeof insertTicketUpdateSchema>;
export type TicketUpdate = typeof ticketUpdates.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
