const express = require('express');
const router = express.Router();
const evolutionController = require('../controllers/evolutionController');
const authMiddleware = require('../middlewares/auth');

// Endpoint público para receber os dados do QR code escaneado (Sem travar no JWT)
router.post('/webhook', evolutionController.handleWebhook);

// Aplica autenticação apenas para as rotas internas da plataforma
router.use(authMiddleware);

router.get('/instances', evolutionController.list);
router.post('/instances', evolutionController.create);
router.get('/instances/connect/:name', evolutionController.connect);
router.delete('/instances/:name', evolutionController.remove);

module.exports = router;