const axios = require('axios');
const ChatwootService = require('../services/chatwootService'); // 🔥 Importação do serviço aqui em cima

const EVO_URL = "http://10.10.0.153:8080";
const EVO_KEY = "BQYHJGJHJ"; 

const headers = { headers: { apikey: EVO_KEY } };

// 🔥 NOVA FUNÇÃO: Intercepta o status conectado e cria a Estrutura no Chatwoot
exports.handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // Dispara apenas quando escanear o QR Code (status open)
    if (event === "CONNECTION_UPDATE" && data.status === "open") {
      const instanceName = data.instance;
      console.log(`[Webhook Evolution] Instância '${instanceName}' conectada! Iniciando provisionamento no Chatwoot...`);

      // 1. Cria a caixa API dinamicamente
      const inboxData = await ChatwootService.createInbox(instanceName);

      // 2. Vincula a instância do WhatsApp à nova caixa do Chatwoot
      const setChatwootUrl = `${EVO_URL}/chatwoot/set/${instanceName}`;
      const chatwootPayload = {
        enabled: true,
        accountId: parseInt(process.env.CHATWOOT_ACCOUNT_ID),
        token: inboxData.inboxToken, // Usa o Token gerado dinamicamente
        url: process.env.CHATWOOT_URL,
        signMessage: true,
        reopenChat: true,
        importContacts: true,
        importMessages: true
      };

      await axios.post(setChatwootUrl, chatwootPayload, headers);
      console.log(`[Webhook Evolution] Integração concluída com sucesso para a instância: ${instanceName}`);
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.log("[Webhook Evolution Error]:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const response = await axios.get(`${EVO_URL}/instance/fetchInstances`, headers);
    res.json(response.data);
  } catch (err) {
    console.log("[Evolution] Erro ao listar:", err.message);
    res.status(500).json({ error: "Erro ao buscar instâncias na Evolution" });
  }
};

exports.create = async (req, res) => {
  try {
    const { instanceName } = req.body;
    const response = await axios.post(`${EVO_URL}/instance/create`, {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    }, headers);
    res.json(response.data);
  } catch (err) {
    console.log("[Evolution] Erro ao criar:", err.message);
    res.status(500).json({ error: "Erro ao criar instância" });
  }
};

exports.connect = async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(`${EVO_URL}/instance/connect/${name}`, headers);
    res.json(response.data); 
  } catch (err) {
    console.log("[Evolution] Erro ao conectar:", err.message);
    res.status(500).json({ error: "Erro ao gerar QR Code" });
  }
};

exports.remove = async (req, res) => {
  try {
    const { name } = req.params;
    await axios.delete(`${EVO_URL}/instance/delete/${name}`, headers);
    res.json({ ok: true });
  } catch (err) {
    console.log("[Evolution] Erro ao remover:", err.message);
    res.status(500).json({ error: "Erro ao remover instância" });
  }
};