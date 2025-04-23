import { db } from "../server/db";
import { sql } from "drizzle-orm";
import { pool } from "../server/db";

async function addContactEmailField() {
  console.log("Adding contact_email field to clients table...");

  try {
    // Check if the column already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'contact_email'
    `);

    if (checkResult.rows.length === 0) {
      // Add the column if it doesn't exist
      await pool.query(`
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS contact_email TEXT
      `);
      console.log("Successfully added contact_email field to clients table");
    } else {
      console.log("contact_email field already exists in clients table");
    }
  } catch (error) {
    console.error("Error adding contact_email field:", error);
  }
}

addContactEmailField()
  .catch(error => {
    console.error("Unexpected error:", error);
  })
  .finally(() => {
    process.exit(0);
  });