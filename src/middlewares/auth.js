const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Libera a rota do Webhook da Evolution
  if (req.path === '/evolution/webhook') return next();

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};