const db = require("../config/db");

exports.list = (userId) =>
  db.query(
    "SELECT * FROM campaigns WHERE user_id=$1 ORDER BY created_at DESC",
    [userId]
  );

exports.create = (userId, name, message, total) =>
  db.query(
    `
    INSERT INTO campaigns(user_id, name, message, total, status, sent, errors, updated_at)
    VALUES($1,$2,$3,$4,'ativa',0,0,NOW())
    RETURNING *
    `,
    [userId, name, message, total]
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

exports.update = (id, userId, name, message, total) =>
  db.query(
    `
    UPDATE campaigns
    SET
      name=$1,
      message=$2,
      total=$3,
      sent=0,
      errors=0,
      status='ativa (editada)',
      updated_at=NOW()
    WHERE id=$4 AND user_id=$5
    `,
    [name, message, total, id, userId]
  );