const db = require("../config/db");

exports.list = (userId) =>
  db.query(
    "SELECT * FROM campaigns WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

// Adicionado messageB e messageC no INSERT
exports.create = (userId, name, message, messageB, messageC, total) =>
  db.query(
    `
    INSERT INTO campaigns(user_id, name, message, message_b, message_c, total, status, sent, errors, updated_at)
    VALUES($1,$2,$3,$4,$5,$6,'ativa',0,0,NOW())
    RETURNING *
    `,
    [userId, name, message, messageB, messageC, total]
  );

exports.remove = (id, userId) =>
  db.query(
    "DELETE FROM campaigns WHERE id=$1 AND user_id=$2",
    [id, userId]
  );

exports.findById = (id) =>
  db.query(
    "SELECT * FROM campaigns WHERE id=$1",
    [id]
  );

exports.increment = (id) =>
  db.query(
    "UPDATE campaigns SET sent = sent + 1 WHERE id=$1",
    [id]
  );

exports.incrementError = (id) =>
  db.query(
    "UPDATE campaigns SET errors = errors + 1 WHERE id=$1",
    [id]
  );

exports.setStatus = (id, status) =>
  db.query(
    "UPDATE campaigns SET status=$1, updated_at=NOW() WHERE id=$2",
    [status, id]
  );

exports.start = (id) =>
  db.query(
    "UPDATE campaigns SET status='enviando', updated_at=NOW() WHERE id=$1",
    [id]
  );

exports.finish = (id) =>
  db.query(
    "UPDATE campaigns SET status='finalizado', updated_at=NOW() WHERE id=$1",
    [id]
  );

exports.updateTotal = (id, total) =>
  db.query(
    "UPDATE campaigns SET total=$1, updated_at=NOW() WHERE id=$2",
    [total, id]
  );

// Adicionado messageB e messageC no UPDATE
exports.update = (id, userId, name, message, messageB, messageC, total) =>
  db.query(
    `
    UPDATE campaigns
    SET
      name=$1,
      message=$2,
      message_b=$3,
      message_c=$4,
      total=$5,
      sent=0,
      errors=0,
      status='ativa (editada)',
      updated_at=NOW()
    WHERE id=$6 AND user_id=$7
    `,
    [name, message, messageB, messageC, total, id, userId]
  );