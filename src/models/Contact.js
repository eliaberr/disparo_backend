const db = require("../config/db");

// contatos pendentes para disparo
exports.pending = (campaignId) =>
  db.query(
    "SELECT * FROM contacts WHERE campaign_id=$1 AND status='pending' ORDER BY id ASC",
    [campaignId]
  );

// buscar TODOS contatos da campanha (para editar modal)
exports.listByCampaign = (campaignId) =>
  db.query(
    "SELECT * FROM contacts WHERE campaign_id=$1 ORDER BY id ASC",
    [campaignId]
  );

// marcar enviado
exports.markSent = (id) =>
  db.query(
    "UPDATE contacts SET status='sent' WHERE id=$1",
    [id]
  );

// marcar erro
exports.markError = (id) =>
  db.query(
    "UPDATE contacts SET status='error' WHERE id=$1",
    [id]
  );

// apagar contatos da campanha
exports.clear = (campaignId) =>
  db.query(
    "DELETE FROM contacts WHERE campaign_id=$1",
    [campaignId]
  );

// inserir lista de contatos
exports.bulkInsert = async (campaignId, contacts) => {
  for (const c of contacts) {
    await db.query(
      "INSERT INTO contacts(campaign_id, number, name, status) VALUES($1,$2,$3,'pending')",
      [
        campaignId,
        c.number,
        c.name || ""
      ]
    );
  }
};