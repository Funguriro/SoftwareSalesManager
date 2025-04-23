import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertClientSchema, insertProductSchema, insertSubscriptionSchema, 
  insertLicenseSchema, insertInvoiceSchema, insertTransactionSchema, 
  insertTicketSchema, insertTicketUpdateSchema, insertNotificationSchema,
  Client, Product, Subscription, License, Invoice, Transaction, Ticket, TicketUpdate } from "@shared/schema";
import { z } from "zod";
import { differenceInDays } from "date-fns";

// Auth middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const isSupport = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user.role === "support" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

const isSales = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user.role === "sales" || req.user.role === "admin")) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Dashboard
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // Using try/catch for each call to identify which one is causing the issue
      let clientCount = 0;
      let activeLicensesCount = 0;
      let openTicketsCount = 0;
      let monthlyRevenue = 0;
      
      try {
        clientCount = await storage.getClientCount();
      } catch (err) {
        console.error("Error getting client count:", err);
      }
      
      try {
        activeLicensesCount = await storage.getActiveLicensesCount();
      } catch (err) {
        console.error("Error getting active licenses count:", err);
      }
      
      try {
        openTicketsCount = await storage.getOpenTicketsCount();
      } catch (err) {
        console.error("Error getting open tickets count:", err);
      }
      
      try {
        monthlyRevenue = await storage.getMonthlyRevenue();
      } catch (err) {
        console.error("Error getting monthly revenue:", err);
      }

      res.json({
        totalClients: clientCount,
        activeSubscriptions: activeLicensesCount,
        openTickets: openTicketsCount,
        monthlyRevenue: monthlyRevenue
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  // License expiration alerts for dashboard
  app.get("/api/dashboard/expiring-licenses", isAuthenticated, async (req, res) => {
    try {
      const expiringLicenses = await storage.getExpiringLicenses(14); // Licenses expiring in the next 14 days
      
      // Get additional data for each license
      const licenseData = await Promise.all(
        expiringLicenses.map(async (license) => {
          const subscription = await storage.getSubscription(license.subscriptionId);
          const client = subscription ? await storage.getClient(subscription.clientId) : null;
          const daysUntilExpiration = differenceInDays(new Date(license.expirationDate), new Date());
          
          return {
            id: license.id,
            licenseKey: license.licenseKey,
            expirationDate: license.expirationDate,
            expiresIn: daysUntilExpiration,
            company: client?.companyName || "Unknown",
            clientId: client?.id || 0,
            subscriptionId: subscription?.id || 0
          };
        })
      );
      
      res.json(licenseData);
    } catch (error) {
      res.status(500).json({ message: "Error fetching expiring licenses" });
    }
  });

  // Recent tickets for dashboard
  app.get("/api/dashboard/recent-tickets", isAuthenticated, async (req, res) => {
    try {
      const recentTickets = await storage.getRecentTickets(5);
      
      // Get additional data for each ticket
      const ticketsWithDetails = await Promise.all(
        recentTickets.map(async (ticket) => {
          const client = await storage.getClient(ticket.clientId);
          const assignedStaff = ticket.assignedTo ? await storage.getStaff(ticket.assignedTo) : null;
          const assignedUser = assignedStaff ? await storage.getUser(assignedStaff.userId) : null;
          
          return {
            ...ticket,
            clientName: client?.companyName || "Unknown",
            assignedToName: assignedUser?.fullName || "Unassigned",
            createdAgo: new Date(ticket.createdAt).toISOString()
          };
        })
      );
      
      res.json(ticketsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent tickets" });
    }
  });

  // Recent transactions for dashboard
  app.get("/api/dashboard/recent-transactions", isAuthenticated, async (req, res) => {
    try {
      const recentTransactions = await storage.getRecentTransactions(5);
      
      // Get additional data for each transaction
      const transactionsWithDetails = await Promise.all(
        recentTransactions.map(async (transaction) => {
          const client = await storage.getClient(transaction.clientId);
          const invoice = transaction.invoiceId ? await storage.getInvoice(transaction.invoiceId) : null;
          const subscription = invoice?.subscriptionId ? await storage.getSubscription(invoice.subscriptionId) : null;
          const product = subscription?.productId ? await storage.getProduct(subscription.productId) : null;
          
          return {
            ...transaction,
            clientName: client?.companyName || "Unknown",
            productName: product?.name || "Unknown Product",
            subscriptionType: subscription?.subscriptionType || "Unknown",
          };
        })
      );
      
      res.json(transactionsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent transactions" });
    }
  });

  // Clients
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", isSales, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.patch("/api/clients/:id", isSales, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating client" });
    }
  });

  // Products
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.patch("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating product" });
    }
  });

  // Subscriptions
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let subscriptions: Subscription[];
      if (clientId) {
        subscriptions = await storage.getSubscriptionsByClient(clientId);
      } else if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "Client profile not found" });
        }
        subscriptions = await storage.getSubscriptionsByClient(client.id);
      } else {
        // For admins, sales, support - fetch all subscriptions
        // This would require an additional method in storage
        // For now, returning empty array to avoid error
        subscriptions = [];
      }
      
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });

  app.get("/api/subscriptions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.getSubscription(id);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Check if user has access to this subscription
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== subscription.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscription" });
    }
  });

  app.post("/api/subscriptions", isSales, async (req, res) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  app.patch("/api/subscriptions/:id", isSales, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscriptionData = insertSubscriptionSchema.partial().parse(req.body);
      const subscription = await storage.updateSubscription(id, subscriptionData);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating subscription" });
    }
  });

  // Licenses
  app.get("/api/licenses", isAuthenticated, async (req, res) => {
    try {
      const subscriptionId = req.query.subscriptionId ? parseInt(req.query.subscriptionId as string) : undefined;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID required" });
      }
      
      const licenses = await storage.getLicensesBySubscription(subscriptionId);
      
      // Check if user has access to these licenses
      if (req.user.role === 'client') {
        const subscription = await storage.getSubscription(subscriptionId);
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }
        
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== subscription.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(licenses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching licenses" });
    }
  });

  app.get("/api/licenses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicense(id);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }

      // Check if user has access to this license
      if (req.user.role === 'client') {
        const subscription = await storage.getSubscription(license.subscriptionId);
        if (!subscription) {
          return res.status(404).json({ message: "Subscription not found" });
        }
        
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== subscription.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(license);
    } catch (error) {
      res.status(500).json({ message: "Error fetching license" });
    }
  });

  app.post("/api/licenses", isSales, async (req, res) => {
    try {
      let licenseData = insertLicenseSchema.parse(req.body);
      
      // Generate license key if not provided
      if (!licenseData.licenseKey) {
        licenseData = {
          ...licenseData,
          licenseKey: storage.generateLicenseKey()
        };
      }
      
      const license = await storage.createLicense(licenseData);
      res.status(201).json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid license data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating license" });
    }
  });

  app.patch("/api/licenses/:id", isSales, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const licenseData = insertLicenseSchema.partial().parse(req.body);
      const license = await storage.updateLicense(id, licenseData);
      
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      
      res.json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid license data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating license" });
    }
  });

  // Invoices
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let invoices: Invoice[];
      if (clientId) {
        invoices = await storage.getInvoicesByClient(clientId);
      } else if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "Client profile not found" });
        }
        invoices = await storage.getInvoicesByClient(client.id);
      } else {
        // For admins, sales, support - would need a method to fetch all invoices
        // For now, returning empty array to avoid error
        invoices = [];
      }
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoices" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if user has access to this invoice
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== invoice.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Error fetching invoice" });
    }
  });

  app.post("/api/invoices", isSales, async (req, res) => {
    try {
      let invoiceData = insertInvoiceSchema.parse(req.body);
      
      // Generate invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        invoiceData = {
          ...invoiceData,
          invoiceNumber: await storage.generateInvoiceNumber()
        };
      }
      
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating invoice" });
    }
  });

  app.patch("/api/invoices/:id", isSales, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(id, invoiceData);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating invoice" });
    }
  });

  // Transactions
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      let transactions: Transaction[];
      if (clientId) {
        transactions = await storage.getTransactionsByClient(clientId);
      } else if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "Client profile not found" });
        }
        transactions = await storage.getTransactionsByClient(client.id);
      } else {
        // For admins, sales, support - fetch recent transactions
        transactions = await storage.getRecentTransactions(20);
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransaction(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Check if user has access to this transaction
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== transaction.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });

  app.post("/api/transactions", isSales, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      
      // If this transaction is for an invoice, update the invoice paid status
      if (transaction.invoiceId) {
        await storage.updateInvoice(transaction.invoiceId, { isPaid: true });
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating transaction" });
    }
  });

  app.patch("/api/transactions/:id", isSales, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, transactionData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating transaction" });
    }
  });

  // Support Tickets
  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const assignedTo = req.query.assignedTo ? parseInt(req.query.assignedTo as string) : undefined;
      
      let tickets: Ticket[];
      if (clientId) {
        tickets = await storage.getTicketsByClient(clientId);
      } else if (assignedTo) {
        tickets = await storage.getTicketsByAssignee(assignedTo);
      } else if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "Client profile not found" });
        }
        tickets = await storage.getTicketsByClient(client.id);
      } else if (req.user.role === 'support') {
        const staffMember = await storage.getStaffByUserId(req.user.id);
        if (!staffMember) {
          return res.status(403).json({ message: "Staff profile not found" });
        }
        tickets = await storage.getTicketsByAssignee(staffMember.id);
      } else {
        // For admins and sales - fetch recent tickets
        tickets = await storage.getRecentTickets(20);
      }
      
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tickets" });
    }
  });

  app.get("/api/tickets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user has access to this ticket
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== ticket.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user.role === 'support') {
        const staffMember = await storage.getStaffByUserId(req.user.id);
        if (!staffMember || (ticket.assignedTo && ticket.assignedTo !== staffMember.id)) {
          return res.status(403).json({ message: "Ticket not assigned to you" });
        }
      }
      
      // Get ticket updates
      const updates = await storage.getTicketUpdates(id);
      
      res.json({ ...ticket, updates });
    } catch (error) {
      res.status(500).json({ message: "Error fetching ticket" });
    }
  });

  app.post("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      let ticketData = insertTicketSchema.parse(req.body);
      
      // If client user is creating a ticket, use their client ID
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "Client profile not found" });
        }
        ticketData.clientId = client.id;
      }
      
      const ticket = await storage.createTicket(ticketData);
      
      // Create initial ticket update
      await storage.createTicketUpdate({
        ticketId: ticket.id,
        userId: req.user.id,
        message: "Ticket created",
        attachments: null
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating ticket" });
    }
  });

  app.patch("/api/tickets/:id", isSupport, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticketData = insertTicketSchema.partial().parse(req.body);
      
      // If status changed to resolved or closed, set closedAt
      if (ticketData.status === 'resolved' || ticketData.status === 'closed') {
        ticketData.closedAt = new Date();
      }
      
      const ticket = await storage.updateTicket(id, ticketData);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Create ticket update for status change
      if (ticketData.status) {
        await storage.createTicketUpdate({
          ticketId: ticket.id,
          userId: req.user.id,
          message: `Status changed to ${ticketData.status}`,
          attachments: null
        });
      }
      
      // Create ticket update for assignee change
      if (ticketData.assignedTo) {
        const staffMember = await storage.getStaff(ticketData.assignedTo);
        const staffUser = staffMember ? await storage.getUser(staffMember.userId) : null;
        
        await storage.createTicketUpdate({
          ticketId: ticket.id,
          userId: req.user.id,
          message: `Assigned to ${staffUser?.fullName || 'Unknown'}`,
          attachments: null
        });
      }
      
      res.json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating ticket" });
    }
  });

  // Ticket Updates
  app.post("/api/tickets/:id/updates", isAuthenticated, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Check if user has access to add updates to this ticket
      if (req.user.role === 'client') {
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== ticket.clientId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (req.user.role === 'support') {
        const staffMember = await storage.getStaffByUserId(req.user.id);
        if (!staffMember || (ticket.assignedTo && ticket.assignedTo !== staffMember.id)) {
          return res.status(403).json({ message: "Ticket not assigned to you" });
        }
      }
      
      const updateData = insertTicketUpdateSchema.parse({
        ...req.body,
        ticketId,
        userId: req.user.id
      });
      
      const ticketUpdate = await storage.createTicketUpdate(updateData);
      
      // If client added an update, update ticket status to new
      if (req.user.role === 'client' && ticket.status !== 'new') {
        await storage.updateTicket(ticketId, { status: 'new', updatedAt: new Date() });
      }
      
      res.status(201).json(ticketUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating ticket update" });
    }
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Error fetching notification count" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId: req.body.userId || req.user.id
      });
      
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating notification" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Error updating notification" });
    }
  });

  // Setup HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
