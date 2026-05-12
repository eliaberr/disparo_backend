const axios = require('axios');

const chatwootAPI = axios.create({
  baseURL: `${process.env.CHATWOOT_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`,
  headers: { api_access_token: process.env.CHATWOOT_TOKEN }
});

const formatLabelName = (name) => {
  if (!name) return '';
  return name.replace(/\s+/g, '_').toLowerCase(); 
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
    console.log(`[Chatwoot] Etiqueta '${formattedLabel}' preparada.`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 422) return true; 
    return false;
  }
};

exports.addLabelToContact = async (phoneNumber, labelName, secondLabel) => {
  const formattedLabel1 = formatLabelName(labelName);
  const formattedLabel2 = secondLabel ? formatLabelName(secondLabel) : null;

  // Monta a lista com as etiquetas passadas
  const labelsToSend = formattedLabel2 
    ? [formattedLabel1, formattedLabel2] 
    : [formattedLabel1];

  try {
    const cleanNumber = phoneNumber.replace('+', '');
    const searchRes = await chatwootAPI.get(`/contacts/search?q=%2B${cleanNumber}`);
    let contacts = searchRes.data.payload;

    if (!contacts || contacts.length === 0) {
      const fallbackSearch = await chatwootAPI.get(`/contacts/search?q=${cleanNumber}`);
      contacts = fallbackSearch.data.payload;
    }

    if (!contacts || contacts.length === 0) {
      console.log(`[Chatwoot] Contato ${phoneNumber} não encontrado.`);
      return false;
    }

    const contactId = contacts[0].id;

    // 1. Adiciona as etiquetas no Perfil do Contato
    await chatwootAPI.post(`/contacts/${contactId}/labels`, {
      labels: labelsToSend 
    });
    console.log(`[Chatwoot] Etiquetas adicionadas ao CONTATO ${phoneNumber}:`, labelsToSend);

    // 2. Busca persistente da conversa (Aumentado para 5 tentativas)
    let conversations = [];
    const maxAttempts = 5; // 🔥 Alterado de 3 para 5 conforme solicitado

    for (let i = 0; i < maxAttempts; i++) {
      const convRes = await chatwootAPI.get(`/contacts/${contactId}/conversations`);
      // Buscamos apenas conversas que não estão resolvidas
      conversations = convRes.data.payload.filter(c => c.status !== 'resolved');

      if (conversations && conversations.length > 0) break;

      console.log(`[Chatwoot] Aguardando criação da conversa para ${phoneNumber} (Tentativa ${i + 1}/${maxAttempts})...`);
      await new Promise(r => setTimeout(r, 3000)); // Espera 3 segundos entre tentativas
    }

    if (conversations && conversations.length > 0) {
      const convId = conversations[0].id;
      
      // 3. Adiciona as etiquetas na Conversa
      await chatwootAPI.post(`/conversations/${convId}/labels`, {
        labels: labelsToSend 
      });
      console.log(`[Chatwoot] Etiquetas vinculadas à CONVERSA de ${phoneNumber}:`, labelsToSend);
    } else {
      console.log(`[Chatwoot] Aviso: Conversa não foi encontrada após ${maxAttempts} tentativas para ${phoneNumber}.`);
    }

    return true;
  } catch (error) {
    console.error("[Chatwoot Error]:", error.response?.data || error.message);
    return false;
  }
};