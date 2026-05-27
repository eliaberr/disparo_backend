const axios = require("axios");
const ChatwootService = require("../services/chatwootService");

const headers = { headers: { apikey: process.env.EVOLUTION_KEY } };

exports.handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === "CONNECTION_UPDATE" && data.status === "open") {
      const instanceName = data.instance;
      console.log(`[Webhook] Conectou: ${instanceName}. Provisionando Chatwoot...`);

      // 1. Cria a caixa no Chatwoot
      const inboxData = await ChatwootService.createInbox(instanceName);
      console.log(`[DEBUG] Inbox criada. Enviando dados para Evolution...`);

      // 2. Configura a integração na Evolution API
      try {
        const evoResponse = await axios.post(
          `http://10.10.0.153:3000/chatwoot/set/${instanceName}`,
          {
            enabled: true,
            accountId: parseInt(process.env.CHATWOOT_ACCOUNT_ID),
            token: inboxData.inboxToken, // inbox_identifier
            url: process.env.CHATWOOT_URL,
            signMessage: true,
            reopenChat: true,
            importContacts: true,
            importMessages: true,
          },
          headers
        );
        console.log(`[Webhook] Integração Evolution respondida:`, evoResponse.data);
        console.log(`[Webhook] Instância ${instanceName} integrada com sucesso.`);
      } catch (evoErr) {
        // 🔥 LOG DETALHADO: Se falhar aqui, o terminal vai te contar o motivo real
        console.error("[ERRO CRÍTICO NA INTEGRAÇÃO EVO]:", evoErr.response?.data || evoErr.message);
        throw new Error("Falha ao configurar Chatwoot na Evolution API");
      }
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