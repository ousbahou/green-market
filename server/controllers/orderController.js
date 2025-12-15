import pool from "../config/db.js";
import { sendMail } from "../services/mailer.js";

const wrapEmail = ({ title, body }) => `
  <div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:24px;">
    <div style="max-width:520px; margin:auto; background:#fff; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.06); overflow:hidden;">
      <div style="background:#0f7a4b; color:#fff; padding:16px 20px; font-size:18px; font-weight:700;">${title}</div>
      <div style="padding:20px; color:#1f2933; line-height:1.6; font-size:14px;">${body}</div>
      <div style="padding:12px 20px; font-size:12px; color:#6b7280; background:#f9fafb;">Notification Green Market</div>
    </div>
  </div>`;

const renderOrderSummaryTable = (lines = []) => {
  if (!Array.isArray(lines) || lines.length === 0) return "<p>Aucune ligne</p>";
  const rows = lines
    .map(
      (l) => `
        <tr>
          <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb;">${l.quantity}</td>
          <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb;">${l.sku || l.product_id}</td>
          <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb;">${l.name || "Produit"}</td>
          ${l.price !== undefined ? `<td style="padding:8px 10px; border-bottom:1px solid #e5e7eb;">${Number(l.price).toFixed(2)} €</td>` : ""}
        </tr>`
    )
    .join("");

  const hasPrice = lines.some((l) => l.price !== undefined);

  return `
    <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th align="left" style="padding:8px 10px;">Qté</th>
          <th align="left" style="padding:8px 10px;">SKU / ID</th>
          <th align="left" style="padding:8px 10px;">Produit</th>
          ${hasPrice ? '<th align="left" style="padding:8px 10px;">Prix</th>' : ""}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

// Récupérer toutes les commandes (simple liste)
export const getOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, external_reference, customer_name, status, tracking_number, created_at FROM orders ORDER BY created_at DESC"
    );
    return res.json(rows);
  } catch (error) {
    console.error("Erreur récupération commandes:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer une commande avec ses lignes + produits
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      "SELECT id, external_reference, customer_name, status, tracking_number, created_at FROM orders WHERE id = ?",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const order = orders[0];

    const [lines] = await pool.query(
      `SELECT ol.id, ol.quantity, p.id AS product_id, p.sku, p.name, p.price
       FROM order_lines ol
       JOIN products p ON ol.product_id = p.id
       WHERE ol.order_id = ?`,
      [id]
    );

    return res.json({ ...order, lines });
  } catch (error) {
    console.error("Erreur récupération commande:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Créer une commande + lignes
export const createOrder = async (req, res) => {
  let connection;
  try {
    const {
      external_reference,
      customer_name,
      customer_email,
      status = "PENDING",
      tracking_number = null,
      lines = [],
    } = req.body;

    if (!external_reference) {
      return res.status(400).json({ message: "external_reference requis" });
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "lines doit contenir au moins un produit" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Vérifier unicité de la ref externe
    const [existing] = await connection.query(
      "SELECT id FROM orders WHERE external_reference = ?",
      [external_reference]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "external_reference déjà utilisée" });
    }

    // Vérifier existence des produits
    for (const line of lines) {
      if (!line.product_id || !line.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: "Chaque ligne doit avoir product_id et quantity" });
      }
      const [prod] = await connection.query("SELECT id FROM products WHERE id = ?", [line.product_id]);
      if (prod.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Produit ${line.product_id} introuvable` });
      }
    }

    // Insertion commande
    const [orderResult] = await connection.query(
      "INSERT INTO orders (external_reference, customer_name, status, tracking_number) VALUES (?, ?, ?, ?)",
      [external_reference, customer_name || null, status, tracking_number]
    );

    const orderId = orderResult.insertId;

    // Insertion lignes
    for (const line of lines) {
      await connection.query(
        "INSERT INTO order_lines (order_id, product_id, quantity) VALUES (?, ?, ?)",
        [orderId, line.product_id, line.quantity]
      );
    }

    await connection.commit();

    const [createdOrderRows] = await connection.query(
      "SELECT id, external_reference, customer_name, status, tracking_number, created_at FROM orders WHERE id = ?",
      [orderId]
    );
    const [createdLines] = await connection.query(
      `SELECT ol.id, ol.quantity, p.id AS product_id, p.sku, p.name, p.price
       FROM order_lines ol
       JOIN products p ON ol.product_id = p.id
       WHERE ol.order_id = ?`,
      [orderId]
    );

    const createdOrder = { ...createdOrderRows[0], lines: createdLines };

    // Notification (best effort)
    try {
      const htmlBody = `
        <p>Une nouvelle commande vient d'être créée.</p>
        <div style="margin-top:10px; padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
          <div><strong>Référence :</strong> ${createdOrder.external_reference}</div>
          <div><strong>Client :</strong> ${createdOrder.customer_name || "N/A"}</div>
          <div><strong>Statut :</strong> ${createdOrder.status}</div>
          <div><strong>Lignes :</strong> ${createdLines.length}</div>
        </div>
        ${renderOrderSummaryTable(createdLines)}
        <p style="margin-top:12px;">Merci pour votre confiance.</p>
      `;

      await sendMail({
        to: customer_email,
        subject: `Nouvelle commande ${createdOrder.external_reference}`,
        text: `Commande ${createdOrder.external_reference} créée avec ${createdLines.length} ligne(s). Statut: ${createdOrder.status}.`,
        html: wrapEmail({ title: "Nouvelle commande", body: htmlBody }),
      });
    } catch (mailErr) {
      console.warn("Envoi mail création commande échoué:", mailErr.message);
    }

    return res.status(201).json({
      message: "Commande créée",
      order: createdOrder,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erreur création commande:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  } finally {
    if (connection) connection.release();
  }
};

// Mettre à jour statut/tracking
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, notify_email } = req.body;

    if (!status && !tracking_number) {
      return res.status(400).json({ message: "Fournir status ou tracking_number" });
    }

    // Construction dynamique
    const fields = [];
    const values = [];
    if (status) {
      fields.push("status = ?");
      values.push(status);
    }
    if (tracking_number) {
      fields.push("tracking_number = ?");
      values.push(tracking_number);
    }
    values.push(id);

    const [result] = await pool.query(
      `UPDATE orders SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const [orderRows] = await pool.query(
      "SELECT id, external_reference, customer_name, status, tracking_number, created_at FROM orders WHERE id = ?",
      [id]
    );

    const updated = orderRows[0];

    // Notification (best effort)
    if (status || tracking_number) {
      try {
        const htmlBody = `
          <p>Les informations de la commande ont été mises à jour.</p>
          <div style="margin-top:10px; padding:12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
            <div><strong>Référence :</strong> ${updated.external_reference}</div>
            <div><strong>Statut :</strong> ${updated.status}</div>
            ${updated.tracking_number ? `<div><strong>Tracking :</strong> ${updated.tracking_number}</div>` : ""}
          </div>
        `;

        await sendMail({
          to: notify_email,
          subject: `Commande ${updated.external_reference} mise à jour`,
          text: `Statut: ${updated.status}${updated.tracking_number ? `, Tracking: ${updated.tracking_number}` : ""}`,
          html: wrapEmail({ title: "Commande mise à jour", body: htmlBody }),
        });
      } catch (mailErr) {
        console.warn("Envoi mail MAJ commande échoué:", mailErr.message);
      }
    }

    return res.json({ message: "Commande mise à jour", order: updated });
  } catch (error) {
    console.error("Erreur mise à jour commande:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer une commande
export const deleteOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    // Supprimer les lignes d'abord pour respecter les contraintes FK éventuelles
    await connection.query("DELETE FROM order_lines WHERE order_id = ?", [id]);
    const [result] = await connection.query("DELETE FROM orders WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: "Commande introuvable" });
    }

    await connection.commit();
    connection.release();
    return res.json({ message: "Commande supprimée" });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Erreur suppression commande:", error.message);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
