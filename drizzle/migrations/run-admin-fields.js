import db from "../../config/connect.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log("Running admin fields migration...");
    
    const sqlFile = await fs.readFile(
      path.join(__dirname, "0006_admin_fields.sql"),
      "utf-8"
    );
    
    const queries = sqlFile
      .split(";")
      .map((query) => query.trim())
      .filter((query) => query.length > 0);

    for (const query of queries) {
      console.log("Executing:", query);
      await db.execute(query);
    }

    console.log("Admin fields migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration(); 