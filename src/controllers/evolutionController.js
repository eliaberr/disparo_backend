const axios = require('axios');

// Configure aqui o IP da sua Evolution API (porta 8080) e a API Key Global
const EVO_URL = "http://10.10.0.153:8080";
const EVO_KEY = "BQYHJGJHJ"; // Pegue no seu .env da Evolution

const headers = { headers: { apikey: EVO_KEY } };

exports.list = async (req, res) => {
  try {
    const response = await axios.get(`${EVO_URL}/instance/fetchInstances`, headers);
    // A Evolution retorna um array de instâncias
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
    res.json(response.data); // Retorna o base64 do QR Code
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