const axios = require("axios");
const Contact = require("../models/Contact");
const Campaign = require("../models/Campaign");
const Chatwoot = require("./chatwootService");

// 1. Função de Sleep Fixo (Para as pausas obrigatórias como a do Chatwoot)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 🔥 2. NOVO: Função de Sleep Aleatório (Para enganar o algoritmo de spam)
const randomSleep = (minSeconds, maxSeconds) => {
  const timeMs = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  return new Promise((r) => setTimeout(r, timeMs));
};

// 🔥 3. NOVO: Função para resolver o Spintax [opcaoA|opcaoB]
const parseSpintax = (text) => {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]/g, (match, options) => {
    const choices = options.split('|');
    return choices[Math.floor(Math.random() * choices.length)];
  });
};

exports.run = async (campaignId) => {
  try {
    const campaignRes = await Campaign.findById(campaignId);
    const campaign = campaignRes.rows[0];

    if (!campaign) return;

    const contacts = await Contact.pending(campaignId);

    await Campaign.start(campaignId);
    await Campaign.updateTotal(campaignId, contacts.rows.length);

    console.log(`[Sistema] Iniciando campanha: ${campaign.name}`);
    
    // Garante que as DUAS etiquetas existam no Chatwoot antes de disparar
    await Chatwoot.createLabel(campaign.name);
    await Chatwoot.createLabel("disparo_esperando_cliente");

    // 🔥 4. NOVO: Separa todas as mensagens válidas num "Pote" para sorteio
    const mensagensDisponiveis = [
      campaign.message,
      campaign.message_b,
      campaign.message_c
    ].filter(Boolean); // Remove as opções vazias/nulas

    for (const c of contacts.rows) {
      try {
        console.log(`Processando: ${c.number}...`);

        // 🔥 5. NOVO: Sorteia uma das mensagens para esse contato
        const mensagemSorteada = mensagensDisponiveis[Math.floor(Math.random() * mensagensDisponiveis.length)];

        // 🔥 6. NOVO: Processa o Spintax e troca a variável de Nome
        const textComSpintax = parseSpintax(mensagemSorteada);
        // Usamos Regex /g para substituir o nome mais de uma vez se ele aparecer na mensagem
        const textFinal = textComSpintax.replace(/{nome}/gi, c.name || "Cliente"); 

        // 🔥 7. NOVO: Envia comando de "Digitando..." para o WhatsApp (Humanização)
        try {
          const tempoDigitando = Math.floor(Math.random() * (4000 - 2000 + 1) + 2000); // 2 a 4 segundos
          await axios.post(
            `${process.env.EVOLUTION_URL}/chat/sendPresence/${process.env.INSTANCE}`,
            { number: c.number, presence: "composing", delay: tempoDigitando },
            { headers: { apikey: process.env.EVOLUTION_KEY } }
          );
          await sleep(tempoDigitando); // Aguarda o "tempo de digitação" antes de disparar a mensagem
        } catch (presenceErr) {
          console.log(`(Aviso) Falha no 'digitando' para ${c.number}, prosseguindo...`);
        }

        // 8. Dispara a mensagem oficial de texto na Evolution
        await axios.post(
          `${process.env.EVOLUTION_URL}/message/sendText/${process.env.INSTANCE}`,
          { number: c.number, text: textFinal },
          { headers: { apikey: process.env.EVOLUTION_KEY } }
        );

        // Aguarda o Chatwoot processar o webhook
        await sleep(4000);

        // Passa a etiqueta da campanha E a etiqueta fixa nova
        await Chatwoot.addLabelToContact(c.number, campaign.name, "disparo_esperando_cliente");

        await Contact.markSent(c.id);
        await Campaign.increment(campaignId);

      } catch (err) {
        await Contact.markError(c.id);
        await Campaign.incrementError(campaignId);
        console.error(`Erro ao enviar para ${c.number}:`, err.message);
      }

      // 🔥 9. NOVO: Tempo de segurança Variável Anti-Ban (8 a 15 segundos)
      console.log(`Aguardando tempo aleatório para segurança da conta...`);
      await randomSleep(8, 15); 
    }

    await Campaign.finish(campaignId);
    console.log("✔ Campanha Finalizada com Sucesso");

  } catch (err) {
    console.error("Erro Crítico na Campanha:", err.message);
  }
};