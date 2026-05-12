const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const evolutionRoutes = require('./routes/evolutionRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>res.send('API OK'));

app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/evolution', evolutionRoutes);

module.exports = app;