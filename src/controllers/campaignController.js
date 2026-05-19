const Campaign = require("../models/Campaign");
const Contact = require("../models/Contact");
const Send = require("../services/sendService");
const Chatwoot = require("../services/chatwootService"); 

exports.list = async (req, res) => {
  const rows = await Campaign.list(req.user.id);
  res.json(rows.rows);
};

exports.getContacts = async (req, res) => {
  try {
    const rows = await Contact.listByCampaign(req.params.id);
    res.json(rows.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao buscar contatos" });
  }
};

// Recebe message_b e message_c da requisição e passa para o Model
exports.create = async (req, res) => {
  try {
    const { name, message, message_b, message_c, contacts = [] } = req.body;

    const campaign = await Campaign.create(
      req.user.id,
      name,
      message,
      message_b || null, // Se vier vazio salva como nulo
      message_c || null, // Se vier vazio salva como nulo
      contacts.length
    );

    const c = campaign.rows[0];

    await Contact.bulkInsert(c.id, contacts);

    console.log(`[Sistema] Criando etiqueta '${name}' no Chatwoot...`);
    await Chatwoot.createLabel(name);

    res.json(c);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao criar campanha" });
  }
};

// Recebe message_b e message_c da requisição e passa para o Model no update
exports.update = async (req, res) => {
  try {
    const { name, message, message_b, message_c, contacts = [] } = req.body;

    await Campaign.update(
      req.params.id,
      req.user.id,
      name,
      message,
      message_b || null,
      message_c || null,
      contacts.length
    );

    await Contact.clear(req.params.id);
    await Contact.bulkInsert(req.params.id, contacts);

    await Chatwoot.createLabel(name);

    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao atualizar campanha" });
  }
};

exports.remove = async (req, res) => {
  await Campaign.remove(req.params.id, req.user.id);
  res.json({ ok: true });
};

exports.clear = async (req, res) => {
  await Contact.clear(req.params.id);
  res.json({ ok: true });
};

exports.send = async (req, res) => {
  res.json({ started: true });
  Send.run(req.params.id);
};