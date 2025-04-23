import { db } from "../server/db";
import { 
  users, clients, products, subscriptions, licenses, invoices, transactions,
  userRoleEnum, subscriptionTypeEnum, licenseStatusEnum
} from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

async function seedData() {
  console.log("Seeding test data...");

  // Create admin user if not exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
  
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: "admin",
      password: "password-hash", // In a real app, this would be properly hashed
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin"
    });
    console.log("Created admin user");
  }

  // Create product if not exists
  let productId = 1;
  const existingProduct = await db.select().from(products).where(eq(products.name, "Enterprise Suite")).limit(1);
  
  if (existingProduct.length === 0) {
    const [insertedProduct] = await db.insert(products).values({
      name: "Enterprise Suite",
      description: "Complete enterprise solution with all features",
      price: 1000
    }).returning();
    
    productId = insertedProduct.id;
    console.log(`Created product with ID: ${productId}`);
  } else {
    productId = existingProduct[0].id;
  }

  // Create Axis Solutions client if not exists
  let clientId = 1;
  const existingClient = await db.select().from(clients).where(eq(clients.companyName, "Axis Solutions")).limit(1);
  
  if (existingClient.length === 0) {
    // First create a user for this client
    const [clientUser] = await db.insert(users).values({
      username: "axissolutions",
      password: "password-hash", // In a real app, this would be properly hashed
      email: "info@axissolutions.com",
      fullName: "Axis Solutions Account",
      role: "client"
    }).returning();

    const [insertedClient] = await db.insert(clients).values({
      userId: clientUser.id,
      companyName: "Axis Solutions",
      address: "123 Business Ave, Tech Park",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
      country: "US",
      phoneNumber: "+1234567890",
      website: "https://axissolutions.example.com",
      notes: "Important enterprise client"
    }).returning();
    
    clientId = insertedClient.id;
    console.log(`Created client with ID: ${clientId}`);
  } else {
    clientId = existingClient[0].id;
  }

  // Create subscriptions for this client - monthly and quarterly
  const currentDate = new Date();
  let monthlySubscriptionId = 0;
  let quarterlySubscriptionId = 0;

  // Check if monthly subscription exists
  const existingMonthlySubscription = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.clientId, clientId))
    .where(eq(subscriptions.subscriptionType, "monthly"))
    .limit(1);

  if (existingMonthlySubscription.length === 0) {
    const [monthlySubscription] = await db.insert(subscriptions).values({
      clientId: clientId,
      productId: productId,
      startDate: currentDate,
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, currentDate.getDate()), // 1 year from now
      price: 1200, // Monthly price
      subscriptionType: "monthly",
      status: "active",
      autoRenew: true
    }).returning();

    monthlySubscriptionId = monthlySubscription.id;
    console.log(`Created monthly subscription with ID: ${monthlySubscriptionId}`);
  } else {
    monthlySubscriptionId = existingMonthlySubscription[0].id;
  }

  // Check if quarterly subscription exists
  const existingQuarterlySubscription = await db.select()
    .from(subscriptions)
    .where(eq(subscriptions.clientId, clientId))
    .where(eq(subscriptions.subscriptionType, "quarterly"))
    .limit(1);

  if (existingQuarterlySubscription.length === 0) {
    const [quarterlySubscription] = await db.insert(subscriptions).values({
      clientId: clientId,
      productId: productId,
      startDate: currentDate,
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 12, currentDate.getDate()), // 1 year from now
      price: 3300, // Quarterly price
      subscriptionType: "quarterly",
      status: "active",
      autoRenew: true
    }).returning();

    quarterlySubscriptionId = quarterlySubscription.id;
    console.log(`Created quarterly subscription with ID: ${quarterlySubscriptionId}`);
  } else {
    quarterlySubscriptionId = existingQuarterlySubscription[0].id;
  }

  // Generate a license key
  function generateLicenseKey() {
    return randomBytes(16).toString('hex').toUpperCase();
  }

  // Create licenses for each subscription
  let monthlyLicenseId = 0;
  let quarterlyLicenseId = 0;

  // Check if monthly license exists
  const existingMonthlyLicense = await db.select()
    .from(licenses)
    .where(eq(licenses.subscriptionId, monthlySubscriptionId))
    .limit(1);

  if (existingMonthlyLicense.length === 0) {
    const [monthlyLicense] = await db.insert(licenses).values({
      subscriptionId: monthlySubscriptionId,
      licenseKey: generateLicenseKey(),
      issuedDate: currentDate,
      expirationDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()), // 1 month from now
      status: "active",
      seats: 10,
      restrictions: "Standard usage terms",
      notes: "Monthly license for Axis Solutions"
    }).returning();

    monthlyLicenseId = monthlyLicense.id;
    console.log(`Created monthly license with ID: ${monthlyLicenseId}`);
  } else {
    monthlyLicenseId = existingMonthlyLicense[0].id;
  }

  // Check if quarterly license exists
  const existingQuarterlyLicense = await db.select()
    .from(licenses)
    .where(eq(licenses.subscriptionId, quarterlySubscriptionId))
    .limit(1);

  if (existingQuarterlyLicense.length === 0) {
    const [quarterlyLicense] = await db.insert(licenses).values({
      subscriptionId: quarterlySubscriptionId,
      licenseKey: generateLicenseKey(),
      issuedDate: currentDate,
      expirationDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, currentDate.getDate()), // 3 months from now
      status: "active",
      seats: 25,
      restrictions: "Standard usage terms",
      notes: "Quarterly license for Axis Solutions"
    }).returning();

    quarterlyLicenseId = quarterlyLicense.id;
    console.log(`Created quarterly license with ID: ${quarterlyLicenseId}`);
  } else {
    quarterlyLicenseId = existingQuarterlyLicense[0].id;
  }

  // Create invoices for each subscription
  let monthlyInvoiceId = 0;
  let quarterlyInvoiceId = 0;

  // Generate invoice number
  function generateInvoiceNumber() {
    const year = new Date().getFullYear().toString();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-${randomNum}`;
  }

  // Check if monthly invoice exists
  const existingMonthlyInvoice = await db.select()
    .from(invoices)
    .where(eq(invoices.subscriptionId, monthlySubscriptionId))
    .limit(1);

  if (existingMonthlyInvoice.length === 0) {
    const [monthlyInvoice] = await db.insert(invoices).values({
      clientId: clientId,
      subscriptionId: monthlySubscriptionId,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: currentDate,
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 15), // 15 days from now
      amount: 1200,
      status: "paid",
      notes: "Monthly subscription invoice for Axis Solutions"
    }).returning();

    monthlyInvoiceId = monthlyInvoice.id;
    console.log(`Created monthly invoice with ID: ${monthlyInvoiceId}`);

    // Create transaction for this invoice
    const [monthlyTransaction] = await db.insert(transactions).values({
      clientId: clientId,
      invoiceId: monthlyInvoiceId,
      transactionDate: currentDate,
      amount: 1200,
      paymentMethod: "credit_card",
      status: "completed",
      notes: "Payment for monthly subscription"
    }).returning();

    console.log(`Created transaction for monthly invoice with ID: ${monthlyTransaction.id}`);
  } else {
    monthlyInvoiceId = existingMonthlyInvoice[0].id;
  }

  // Check if quarterly invoice exists
  const existingQuarterlyInvoice = await db.select()
    .from(invoices)
    .where(eq(invoices.subscriptionId, quarterlySubscriptionId))
    .limit(1);

  if (existingQuarterlyInvoice.length === 0) {
    const [quarterlyInvoice] = await db.insert(invoices).values({
      clientId: clientId,
      subscriptionId: quarterlySubscriptionId,
      invoiceNumber: generateInvoiceNumber(),
      issueDate: currentDate,
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 30), // 30 days from now
      amount: 3300,
      status: "paid",
      notes: "Quarterly subscription invoice for Axis Solutions"
    }).returning();

    quarterlyInvoiceId = quarterlyInvoice.id;
    console.log(`Created quarterly invoice with ID: ${quarterlyInvoiceId}`);

    // Create transaction for this invoice
    const [quarterlyTransaction] = await db.insert(transactions).values({
      clientId: clientId,
      invoiceId: quarterlyInvoiceId,
      transactionDate: currentDate,
      amount: 3300,
      paymentMethod: "bank_transfer",
      status: "completed",
      notes: "Payment for quarterly subscription"
    }).returning();

    console.log(`Created transaction for quarterly invoice with ID: ${quarterlyTransaction.id}`);
  } else {
    quarterlyInvoiceId = existingQuarterlyInvoice[0].id;
  }

  console.log("Data seeding completed!");
}

seedData()
  .catch(error => {
    console.error("Error seeding data:", error);
  })
  .finally(() => {
    // Pool connection will be closed by the application
    process.exit(0);
  });