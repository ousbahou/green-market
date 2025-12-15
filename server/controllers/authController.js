import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

// Rôles autorisés dans l'application
const ALLOWED_ROLES = ["ADMIN", "LOGISTICS", "CUSTOMER_SERVICE"];

// Inscription utilisateur
export const register = async (req, res) => {
  try {
  const { email, password, role = "LOGISTICS" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Utilisateur déjà existant" });
    }

    const normalizedRole = (role || "LOGISTICS").toUpperCase();
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion
    const [result] = await pool.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashedPassword, normalizedRole]
    );

    const payload = { id: result.insertId, email, role: normalizedRole };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "changeme", {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return res.status(201).json({
      message: "Utilisateur créé",
      user: { id: result.insertId, email, role: normalizedRole },
      token,
    });
  } catch (error) {
    console.error("Erreur inscription:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Connexion utilisateur
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "changeme", {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });

    return res.json({
      message: "Connexion réussie",
      user: { id: user.id, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    console.error("Erreur connexion:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
