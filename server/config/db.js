import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Création d'un pool de connexions MySQL (promesses)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "greenmarket",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
  queueLimit: 0,
});

// Petite fonction helper pour tester la connexion au démarrage
export const testConnection = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 AS alive");
    return rows;
  } catch (error) {
    console.error("Erreur de connexion MySQL :", error.message);
    throw error;
  }
};

export default pool;
