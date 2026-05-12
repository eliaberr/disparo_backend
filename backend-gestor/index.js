// 🔥 Puxa o .env da pasta principal (uma pasta para trás)
require('dotenv').config({ path: '../.env' });

const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// Configuração da API do Chatwoot
const chatwootAPI = axios.create({
    baseURL: `${process.env.CHATWOOT_URL}/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}`,
    headers: { api_access_token: process.env.CHATWOOT_TOKEN }
});

// Etiquetas do seu novo fluxo
const LABEL_INICIAL = "disparo_esperando_cliente";
const LABEL_AVISO = "disparo_aviso_enviado";
const LABEL_FINAL = "disparo_nao_respondeu";

// ==========================================
// 1. WEBHOOK: Se o cliente responder, limpa TODAS as etiquetas de controle
// ==========================================
app.post('/webhook', async (req, res) => {
    const data = req.body;

    if (data.event === 'message_created' && data.message_type === 'incoming') {
        const conversationId = data.conversation?.id;

        if (conversationId) {
            try {
                // Remove qualquer etiqueta de controle se o cliente interagir
                await chatwootAPI.delete(`/conversations/${conversationId}/labels/${LABEL_INICIAL}`);
                await chatwootAPI.delete(`/conversations/${conversationId}/labels/${LABEL_AVISO}`);
                await chatwootAPI.delete(`/conversations/${conversationId}/labels/${LABEL_FINAL}`);
                console.log(`[Webhook] Cliente respondeu! Etiquetas de controle limpas na conversa ${conversationId}.`);
            } catch (err) {
                // Silencioso se não houver etiquetas
            }
        }
    }
    res.status(200).send('OK');
});

// ==========================================
// 2. VARREDOR: Lógica de 10 minutos (Baseada em updated_at via API)
// ==========================================
cron.schedule('* * * * *', async () => {
    console.log("[Varredor] Verificando inatividade nas conversas...");

    try {
        const res = await chatwootAPI.get('/conversations?status=open');
        const conversations = res.data.data.payload;
        const agora = new Date();

        for (const conv of conversations) {
            const labels = conv.labels || [];
            const dataUltimaAtualizacao = new Date(conv.updated_at * 1000);
            const minutosInativo = (agora - dataUltimaAtualizacao) / (1000 * 60);

            // --- FASE 1: ENVIO DE AVISO (5 MINUTOS) ---
            if (labels.includes(LABEL_INICIAL) && !labels.includes(LABEL_AVISO) && minutosInativo >= 5) {
                console.log(`[Aviso] Conversa ${conv.id} inativa há 5min. Enviando alerta...`);
                
                try {
                    await chatwootAPI.post(`/conversations/${conv.id}/messages`, {
                        content: "Olha, não vai perder essa oportunidade! Basta apenas responder essa mensagem que um de nossos atendentes vai te ajudar. Se não, em 5 minutos terei que encerrar o atendimento.",
                        message_type: "outgoing"
                    });

                    // Troca LABEL_INICIAL por LABEL_AVISO
                    let novasLabels = labels.filter(l => l !== LABEL_INICIAL);
                    if (!novasLabels.includes(LABEL_AVISO)) novasLabels.push(LABEL_AVISO);

                    await chatwootAPI.post(`/conversations/${conv.id}/labels`, { labels: novasLabels });
                    console.log(`[Sucesso] Etiqueta de aviso aplicada à conversa ${conv.id}`);
                } catch (err) {
                    console.error(`[Erro Aviso] Conversa ${conv.id}:`, err.message);
                }
            }

            // --- FASE 2: MARCAR COMO NÃO RESPONDEU (MAIS 5 MINUTOS APÓS AVISO) ---
            else if (labels.includes(LABEL_AVISO) && !labels.includes(LABEL_FINAL) && minutosInativo >= 5) {
                console.log(`[Final] Conversa ${conv.id} não respondeu ao aviso. Aplicando label final...`);

                try {
                    // Remove a de aviso e coloca a final para sua automação do Chatwoot agir
                    let novasLabels = labels.filter(l => l !== LABEL_AVISO);
                    if (!novasLabels.includes(LABEL_FINAL)) novasLabels.push(LABEL_FINAL);

                    await chatwootAPI.post(`/conversations/${conv.id}/labels`, { labels: novasLabels });
                    
                    console.log(`[Varredor] Conversa ${conv.id} marcada como '${LABEL_FINAL}'.`);
                } catch (err) {
                    console.error(`[Erro Final] Conversa ${conv.id}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error("[Varredor Error]: Falha ao processar conversas.");
    }
});

const PORT = process.env.PORTA_GESTOR || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Gestor AGX Software rodando na porta ${PORT}`);
});