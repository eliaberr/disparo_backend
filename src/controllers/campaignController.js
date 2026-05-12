// controllers/campaignController.js
const Campaign = require("../models/Campaign");
const Contact = require("../models/Contact");
const Send = require("../services/sendService");
const Chatwoot = require("../services/chatwootService"); // 🔥 IMPORTAMOS O SERVIÇO AQUI

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

exports.create = async (req, res) => {
  try {
    const { name, message, contacts = [] } = req.body;

    const campaign = await Campaign.create(
      req.user.id,
      name,
      message,
      contacts.length
    );

    const c = campaign.rows[0];

    await Contact.bulkInsert(c.id, contacts);

    // 🔥 ADICIONADO AQUI: Cria a etiqueta no Chatwoot ao criar a campanha
    console.log(`[Sistema] Criando etiqueta '${name}' no Chatwoot...`);
    await Chatwoot.createLabel(name);

    res.json(c);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erro ao criar campanha" });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, message, contacts = [] } = req.body;

    await Campaign.update(
      req.params.id,
      req.user.id,
      name,
      message,
      contacts.length
    );

    await Contact.clear(req.params.id);
    await Contact.bulkInsert(req.params.id, contacts);

    // 🔥 ADICIONADO AQUI: Caso você edite o nome da campanha, garante que a nova etiqueta exista lá também
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