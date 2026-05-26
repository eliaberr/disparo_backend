const axios = require("axios");
const ChatwootService = require("../services/chatwootService");

const headers = { headers: { apikey: process.env.EVOLUTION_KEY } };

exports.handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === "CONNECTION_UPDATE" && data.status === "open") {
      const instanceName = data.instance;
      console.log(
        `[Webhook] Conectou: ${instanceName}. Provisionando Chatwoot...`,
      );

      const inboxData = await ChatwootService.createInbox(instanceName);

      await axios.post(
        `http://10.10.0.153:8080/chatwoot/set/${instanceName}`,
        {
          enabled: true,
          accountId: parseInt(process.env.CHATWOOT_ACCOUNT_ID),
          token: inboxData.inboxToken,
          url: process.env.CHATWOOT_URL,
          signMessage: true,
          reopenChat: true,
          importContacts: true,
          importMessages: true,
        },
        headers,
      );

      console.log(`[Webhook] Instância ${instanceName} integrada com sucesso.`);
    }
    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error("[Webhook Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const response = await axios.get(
      `http://10.10.0.153:8080/instance/fetchInstances`,
      headers,
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar" });
  }
};

exports.create = async (req, res) => {
  try {
    const response = await axios.post(
      `http://10.10.0.153:8080/instance/create`,
      req.body,
      headers,
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ err });
  }
};

exports.connect = async (req, res) => {
  try {
    const response = await axios.get(
      `http://10.10.0.153:8080/instance/connect/${req.params.name}`,
      headers,
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao conectar" });
  }
};

exports.remove = async (req, res) => {
  try {
    await axios.delete(
      `http://10.10.0.153:8080/instance/delete/${req.params.name}`,
      headers,
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover" });
  }
};
