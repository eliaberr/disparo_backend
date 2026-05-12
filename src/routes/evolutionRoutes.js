const express = require('express');
const router = express.Router();
const evolutionController = require('../controllers/evolutionController');
const authMiddleware = require('../middlewares/auth'); // Use o seu middleware de auth

router.use(authMiddleware);

router.get('/instances', evolutionController.list);
router.post('/instances', evolutionController.create);
router.get('/instances/connect/:name', evolutionController.connect);
router.delete('/instances/:name', evolutionController.remove);

module.exports = router;