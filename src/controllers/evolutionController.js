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

      // 1. Cria a caixa no Chatwoot
      const inboxData = await ChatwootService.createInbox(instanceName);
      console.log(
        `[DEBUG] Inbox criada com sucesso. Token: ${inboxData.inboxToken}`,
      );

      // 2. Configura a integração na Evolution API
      try {
        const evoResponse = await axios.post(
          `http://10.10.0.153:8080/chatwoot/set/${instanceName}`,
          {
            enabled: true,
            accountId: String(process.env.CHATWOOT_ACCOUNT_ID),
            token: inboxData.inboxToken, // Corrigido: usando o token da caixa criada
            url: process.env.CHATWOOT_URL,
            signMsg: true, // ✅ Nome correto exigido pela API
            reopenConversation: true, // ✅ Nome correto exigido pela API
            conversationPending: true, // ✅ Campo obrigatório que faltava
            importContacts: true,
            importMessages: true,
          },
          headers,
        );
        console.log(
          `[Webhook] Integração Evolution respondida:`,
          evoResponse.data,
        );
        console.log(
          `[Webhook] Instância ${instanceName} integrada com sucesso.`,
        );
      } catch (evoErr) {
        // Log detalhado para identificar falhas na configuração
        if (evoErr.response) {
          console.error(
            "[ERRO CRÍTICO NA INTEGRAÇÃO EVO]:",
            JSON.stringify(evoErr.response.data, null, 2),
          );
        } else {
          console.error("[ERRO CRÍTICO NA INTEGRAÇÃO EVO]:", evoErr.message);
        }
        throw new Error(evoErr);
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
    res.status(500).json({ error: "Erro ao listar instâncias" });
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
    console.error("[Error Create Instance]:", err.message);
    res.status(500).json({ error: "Erro ao criar instância" });
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
    res.status(500).json({ error: "Erro ao conectar instância" });
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
    res.status(500).json({ error: "Erro ao remover instância" });
  }
};
