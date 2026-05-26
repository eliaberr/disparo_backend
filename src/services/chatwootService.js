const axios = require('axios');

const chatwootAPI = axios.create({
  baseURL: `${process.env.CHATWOOT_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`,
  headers: { api_access_token: process.env.CHATWOOT_TOKEN }
});

const formatLabelName = (name) => {
  if (!name) return '';
  return name.replace(/\s+/g, '_').toLowerCase(); 
};

// 🔥 FUNÇÃO CORRIGIDA: Usa inbox_identifier conforme sua API retorna
exports.createInbox = async (instanceName) => {
  try {
    const url = `${process.env.CHATWOOT_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/inboxes`;
    
    const payload = {
      name: instanceName,
      channel: { type: "api" }
    };

    const response = await axios.post(url, payload, {
      headers: {
        api_access_token: process.env.CHATWOOT_ADMIN_TOKEN,
        "Content-Type": "application/json"
      }
    });

    console.log(`[Chatwoot] Caixa de entrada '${instanceName}' criada com sucesso!`);
    
    // O campo que você identificou no Postman é "inbox_identifier"
    return { 
      id: response.data.id, 
      inboxToken: response.data.inbox_identifier 
    };
  } catch (err) {
    if (err.response) {
      console.error("[Chatwoot API ERRO DETALHADO]:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("[Chatwoot ERRO]:", err.message);
    }
    throw new Error("Falha ao criar caixa de entrada no Chatwoot");
  }
};

exports.createLabel = async (labelName) => {
  const formattedLabel = formatLabelName(labelName);
  try {
    await chatwootAPI.post('/labels', {
      title: formattedLabel,
      description: 'Criada pela plataforma de campanhas',
      color: '#3b82f6',
      show_on_sidebar: true 
    });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 422) return true; 
    return false;
  }
};

exports.addLabelToContact = async (phoneNumber, labelName, secondLabel) => {
  const formattedLabel1 = formatLabelName(labelName);
  const formattedLabel2 = secondLabel ? formatLabelName(secondLabel) : null;
  const labelsToSend = formattedLabel2 ? [formattedLabel1, formattedLabel2] : [formattedLabel1];

  try {
    const cleanNumber = phoneNumber.replace('+', '');
    const searchRes = await chatwootAPI.get(`/contacts/search?q=%2B${cleanNumber}`);
    let contacts = searchRes.data.payload;

    if (!contacts || contacts.length === 0) {
      const fallbackSearch = await chatwootAPI.get(`/contacts/search?q=${cleanNumber}`);
      contacts = fallbackSearch.data.payload;
    }

    if (!contacts || contacts.length === 0) return false;

    const contactId = contacts[0].id;
    await chatwootAPI.post(`/contacts/${contactId}/labels`, { labels: labelsToSend });

    let conversations = [];
    const maxAttempts = 5; 

    for (let i = 0; i < maxAttempts; i++) {
      const convRes = await chatwootAPI.get(`/contacts/${contactId}/conversations`);
      conversations = convRes.data.payload.filter(c => c.status !== 'resolved');
      if (conversations && conversations.length > 0) break;
      await new Promise(r => setTimeout(r, 3000));
    }

    if (conversations && conversations.length > 0) {
      await chatwootAPI.post(`/conversations/${conversations[0].id}/labels`, { labels: labelsToSend });
    }
    return true;
  } catch (error) {
    console.error("[Chatwoot Error]:", error.response?.data || error.message);
    return false;
  }
};