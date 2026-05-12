const axios = require("axios");
const Contact = require("../models/Contact");
const Campaign = require("../models/Campaign");
const Chatwoot = require("./chatwootService");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.run = async (campaignId) => {
  try {
    const campaignRes = await Campaign.findById(campaignId);
    const campaign = campaignRes.rows[0];

    if (!campaign) return;

    const contacts = await Contact.pending(campaignId);

    await Campaign.start(campaignId);
    await Campaign.updateTotal(campaignId, contacts.rows.length);

    console.log(`[Sistema] Iniciando campanha: ${campaign.name}`);
    
    // 🔥 Garante que as DUAS etiquetas existam no Chatwoot antes de disparar
    await Chatwoot.createLabel(campaign.name);
    await Chatwoot.createLabel("disparo_esperando_cliente");

    for (const c of contacts.rows) {
      try {
        console.log("Processando:", c.number);

        const text = campaign.message.replace("{nome}", c.name || "Cliente");

        // 1. Dispara a mensagem na Evolution
        await axios.post(
          `${process.env.EVOLUTION_URL}/message/sendText/${process.env.INSTANCE}`,
          { number: c.number, text },
          { headers: { apikey: process.env.EVOLUTION_KEY } }
        );

        // 2. Aguarda 4 segundos para o Chatwoot processar o recebimento
        await sleep(4000);

        // 🔥 3. Passa a etiqueta da campanha E a etiqueta fixa nova
        await Chatwoot.addLabelToContact(c.number, campaign.name, "disparo_esperando_cliente");

        await Contact.markSent(c.id);
        await Campaign.increment(campaignId);

      } catch (err) {
        await Contact.markError(c.id);
        await Campaign.incrementError(campaignId);
        console.error(`Erro ao enviar para ${c.number}:`, err.message);
      }

      // Tempo de segurança para evitar bloqueios (Rate Limit)
      await sleep(3000); 
    }

    await Campaign.finish(campaignId);
    console.log("✔ Campanha Finalizada com Sucesso");

  } catch (err) {
    console.error("Erro Crítico na Campanha:", err.message);
  }
};