import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaFile = path.join(__dirname, "init.sql");

export const ensureSchema = async () => {
  const raw = await fs.readFile(schemaFile, "utf-8");
  const statements = raw
    .split(/;\s*\n+/)
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      console.debug("initSchema skipped statement", statement.replace(/\s+/g, " ").slice(0, 80));
      console.debug("initSchema error", error.message);
    }
  }
};
