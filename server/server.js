import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { testConnection } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware globaux
app.use(cors());
app.use(express.json());

// Options Swagger
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "GreenMarket Orders API",
    version: "1.0.0",
    description: "API logistique GreenMarket (auth, produits, commandes)",
  },
  servers: [{ url: process.env.BASE_URL || "http://localhost:3001/api/v1" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  // Glob avec slashs normalisés pour Windows/Linux
  apis: [path.join(__dirname, "routes", "*.js").replace(/\\/g, "/")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);

// Healthcheck
app.get("/api/v1/health", (req, res) => {
  res.json({ ok: true, message: "API opérationnelle" });
});

// Documentation Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Gestion des 404
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

const PORT = process.env.PORT || 3001;

// Démarrage du serveur après test de connexion DB
const start = async () => {
  try {
    await testConnection();
    console.log("Connexion MySQL OK");
    app.listen(PORT, () => {
      console.log(`API démarrée sur http://localhost:${PORT}`);
      console.log(`Swagger disponible sur http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Impossible de démarrer le serveur (DB KO)", error.message);
    process.exit(1);
  }
};

start();
