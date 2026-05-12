const r = require("express").Router();
const auth = require("../middlewares/auth");
const c = require("../controllers/campaignController");

r.use(auth);

// listar campanhas
r.get("/", c.list);

// buscar contatos da campanha
r.get("/:id/contacts", c.getContacts);

// criar campanha
r.post("/", c.create);

// 🔥 editar campanha
r.put("/:id", c.update);

// excluir campanha
r.delete("/:id", c.remove);

// limpar contatos
r.delete("/:id/contacts/all", c.clear);

// iniciar disparo
r.post("/:id/send", c.send);

module.exports = r;