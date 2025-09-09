const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let client;
let connected = false;

// Inicializa WPPConnect
wppconnect.create({
  session: 'my-session',
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  },
}).then(c => {
  client = c;
  console.log('WPPConnect iniciado com sucesso!');

  client.onStateChange((state) => {
    console.log('Estado WhatsApp:', state);
    if (state === 'CONNECTED' || state === 'QR_READ_SUCCESS' || state === 'OPENING') {
      connected = true;
    } else if (state === 'TIMEOUT' || state === 'UNPAIRED') {
      connected = false;
    }
  });

  client.onMessage((msg) => {
    console.log('Mensagem recebida:', msg.body);
  });

}).catch(err => console.log('Erro ao iniciar WPPConnect:', err));

// Endpoint para obter QR Code
app.get('/qr', async (req, res) => {
  if (connected) {
    return res.json({ status: 'conectado' });
  }

  try {
    const qr = await client.getQrCode();
    res.json({ qr });
  } catch (err) {
    res.json({ status: 'conectado' });
  }
});

// Endpoint para enviar mensagem
app.post('/send', async (req, res) => {
  const { number, message } = req.body;
  if (!client) return res.status(500).json({ status: 'Cliente não conectado' });

  try {
    await client.sendText(`${number}@c.us`, message);
    res.json({ status: 'Mensagem enviada!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
