import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Middleware pour vérifier le token JWT
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error.message);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// Middleware optionnel pour vérifier le rôle (si besoin)
export const authorizeRoles = (...roles) => (req, res, next) => {
  try {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    next();
  } catch (error) {
    console.error("Erreur d'autorisation:", error.message);
    return res.status(403).json({ message: "Accès interdit" });
  }
};
