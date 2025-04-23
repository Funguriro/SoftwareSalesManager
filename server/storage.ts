import {
  users, clients, products, subscriptions, licenses,
  invoices, transactions, staff, tickets, ticketUpdates, notifications,
  type User, type InsertUser, type Client, type InsertClient,
  type Product, type InsertProduct, type Subscription, type InsertSubscription,
  type License, type InsertLicense, type Invoice, type InsertInvoice,
  type Transaction, type InsertTransaction, type Staff, type InsertStaff,
  type Ticket, type InsertTicket, type TicketUpdate, type InsertTicketUpdate,
  type Notification, type InsertNotification
} from "@shared/schema";

import { db } from "./db";
import { eq, and, gte, desc, lt, sql, or } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { randomUUID } from "crypto";
import { format, addDays } from "date-fns";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  
  // Subscription operations
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByClient(clientId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // License operations
  getLicense(id: number): Promise<License | undefined>;
  getLicenseByKey(licenseKey: string): Promise<License | undefined>;
  getLicensesBySubscription(subscriptionId: number): Promise<License[]>;
  getExpiringLicenses(daysThreshold: number): Promise<License[]>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, data: Partial<InsertLicense>): Promise<License | undefined>;
  generateLicenseKey(): string;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  generateInvoiceNumber(): Promise<string>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByClient(clientId: number): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  
  // Staff operations
  getStaff(id: number): Promise<Staff | undefined>;
  getStaffByUserId(userId: number): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined>;
  
  // Ticket operations
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketsByClient(clientId: number): Promise<Ticket[]>;
  getTicketsByAssignee(staffId: number): Promise<Ticket[]>;
  getRecentTickets(limit?: number): Promise<Ticket[]>;
  getOpenTicketsCount(): Promise<number>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined>;
  
  // Ticket update operations
  getTicketUpdates(ticketId: number): Promise<TicketUpdate[]>;
  createTicketUpdate(update: InsertTicketUpdate): Promise<TicketUpdate>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Dashboard statistics
  getClientCount(): Promise<number>;
  getActiveLicensesCount(): Promise<number>;
  getMonthlyRevenue(): Promise<number>;
  
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  
  async getClientByUserId(userId: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
    return client;
  }
  
  async getClients(): Promise<Client[]> {
    return db.select().from(clients);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [createdClient] = await db.insert(clients).values(client).returning();
    return createdClient;
  }
  
  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }
  
  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [createdProduct] = await db.insert(products).values(product).returning();
    return createdProduct;
  }
  
  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
  
  // Subscription operations
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }
  
  async getSubscriptionsByClient(clientId: number): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.clientId, clientId));
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [createdSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return createdSubscription;
  }
  
  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
  
  // License operations
  async getLicense(id: number): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }
  
  async getLicenseByKey(licenseKey: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.licenseKey, licenseKey));
    return license;
  }
  
  async getLicensesBySubscription(subscriptionId: number): Promise<License[]> {
    return db.select().from(licenses).where(eq(licenses.subscriptionId, subscriptionId));
  }
  
  async getExpiringLicenses(daysThreshold: number): Promise<License[]> {
    const thresholdDate = addDays(new Date(), daysThreshold);
    return db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.status, 'active'),
          lt(licenses.expirationDate, thresholdDate)
        )
      );
  }
  
  async createLicense(license: InsertLicense): Promise<License> {
    const [createdLicense] = await db.insert(licenses).values(license).returning();
    return createdLicense;
  }
  
  async updateLicense(id: number, data: Partial<InsertLicense>): Promise<License | undefined> {
    const [updatedLicense] = await db
      .update(licenses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return updatedLicense;
  }
  
  generateLicenseKey(): string {
    const prefix = "LIC";
    const uuid = randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
    const timestamp = format(new Date(), "yyyyMMdd");
    return `${prefix}-${uuid}-${timestamp}`;
  }
  
  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }
  
  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.clientId, clientId));
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [createdInvoice] = await db.insert(invoices).values(invoice).returning();
    return createdInvoice;
  }
  
  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }
  
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.select({ count: sql`count(*)` }).from(invoices);
    const nextNum = parseInt(count[0].count as string) + 1;
    return `INV-${year}-${nextNum.toString().padStart(5, '0')}`;
  }
  
  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }
  
  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.clientId, clientId));
  }
  
  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.transactionDate))
      .limit(limit);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [createdTransaction] = await db.insert(transactions).values(transaction).returning();
    return createdTransaction;
  }
  
  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  // Staff operations
  async getStaff(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember;
  }
  
  async getStaffByUserId(userId: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.userId, userId));
    return staffMember;
  }
  
  async getAllStaff(): Promise<Staff[]> {
    return db.select().from(staff).where(eq(staff.isActive, true));
  }
  
  async createStaff(staffData: InsertStaff): Promise<Staff> {
    const [createdStaff] = await db.insert(staff).values(staffData).returning();
    return createdStaff;
  }
  
  async updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updatedStaff] = await db
      .update(staff)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updatedStaff;
  }
  
  // Ticket operations
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }
  
  async getTicketsByClient(clientId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.clientId, clientId));
  }
  
  async getTicketsByAssignee(staffId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.assignedTo, staffId));
  }
  
  async getRecentTickets(limit: number = 5): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt))
      .limit(limit);
  }
  
  async getOpenTicketsCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(tickets)
      .where(
        or(
          eq(tickets.status, 'new'),
          eq(tickets.status, 'in_progress')
        )
      );
    return parseInt(result[0].count as string);
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [createdTicket] = await db.insert(tickets).values(ticket).returning();
    return createdTicket;
  }
  
  async updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updatedTicket] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }
  
  // Ticket update operations
  async getTicketUpdates(ticketId: number): Promise<TicketUpdate[]> {
    return db
      .select()
      .from(ticketUpdates)
      .where(eq(ticketUpdates.ticketId, ticketId))
      .orderBy(desc(ticketUpdates.createdAt));
  }
  
  async createTicketUpdate(update: InsertTicketUpdate): Promise<TicketUpdate> {
    const [createdUpdate] = await db.insert(ticketUpdates).values(update).returning();
    return createdUpdate;
  }
  
  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return parseInt(result[0].count as string);
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    return createdNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  // Dashboard statistics
  async getClientCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(clients);
    return parseInt(result[0].count as string);
  }
  
  async getActiveLicensesCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(licenses)
      .where(eq(licenses.status, 'active'));
    return parseInt(result[0].count as string);
  }
  
  async getMonthlyRevenue(): Promise<number> {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const result = await db
      .select({
        sum: sql<string>`sum(amount)`
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, firstDayOfMonth),
          eq(transactions.status, 'completed')
        )
      );
    
    return result[0].sum ? parseFloat(result[0].sum) : 0;
  }
}

export const storage = new DatabaseStorage();
