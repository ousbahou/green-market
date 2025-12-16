import pool from "../config/db.js";

// Récupérer tous les produits
export const getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, sku, name, stock_quantity, price, created_at FROM products"
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erreur récupération produits:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Créer un produit
export const createProduct = async (req, res) => {
  try {
    const { sku, name, stock_quantity = 0, price = null } = req.body;

    if (!sku || !name) {
      return res.status(400).json({ message: "sku et name sont requis" });
    }

    const [existing] = await pool.query("SELECT id FROM products WHERE sku = ?", [sku]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "SKU déjà utilisé" });
    }

    const [result] = await pool.query(
      "INSERT INTO products (sku, name, stock_quantity, price) VALUES (?, ?, ?, ?)",
      [sku, name, Number(stock_quantity) || 0, price !== undefined ? price : null]
    );

    const [productRows] = await pool.query(
      "SELECT id, sku, name, stock_quantity, price, created_at FROM products WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json({ message: "Produit créé", product: productRows[0] });
  } catch (error) {
    console.error("Erreur création produit:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour le stock d'un produit
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    if (stock_quantity === undefined || Number.isNaN(Number(stock_quantity))) {
      return res.status(400).json({ message: "stock_quantity requis (nombre)" });
    }

    const [result] = await pool.query(
      "UPDATE products SET stock_quantity = ? WHERE id = ?",
      [Number(stock_quantity), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    const [productRows] = await pool.query(
      "SELECT id, sku, name, stock_quantity, price, created_at FROM products WHERE id = ?",
      [id]
    );

    return res.json({ message: "Stock mis à jour", product: productRows[0] });
  } catch (error) {
    console.error("Erreur mise à jour stock:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un produit (nom/sku/price)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, price } = req.body;

    if (!name && !sku && price === undefined) {
      return res.status(400).json({ message: "Fournir au moins un champ à mettre à jour (name, sku, price)" });
    }

    // Si SKU fourni, vérifier unicité
    if (sku) {
      const [existing] = await pool.query("SELECT id FROM products WHERE sku = ? AND id <> ?", [sku, id]);
      if (existing.length > 0) {
        return res.status(409).json({ message: "SKU déjà utilisé" });
      }
    }

    const fields = [];
    const values = [];
    if (name) { fields.push("name = ?"); values.push(name); }
    if (sku) { fields.push("sku = ?"); values.push(sku); }
    if (price !== undefined) { fields.push("price = ?"); values.push(price); }
    values.push(id);

    const [result] = await pool.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }

    const [productRows] = await pool.query(
      "SELECT id, sku, name, stock_quantity, price, created_at FROM products WHERE id = ?",
      [id]
    );

    return res.json({ message: "Produit mis à jour", product: productRows[0] });
  } catch (error) {
    console.error("Erreur mise à jour produit:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un produit
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Produit introuvable" });
    }
    return res.json({ message: "Produit supprimé" });
  } catch (error) {
    console.error("Erreur suppression produit:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
