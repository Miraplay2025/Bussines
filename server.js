const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let client;

// Inicia WPPConnect com Puppeteer e opções de sandbox
wppconnect.create({
    session: 'mysession',
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    catchQR: (qrCode, asciiQR, attempts, urlCode) => {
        // QR code para frontend
        console.log('QR RECEBIDO:', qrCode);
        client.qrCode = qrCode;
    },
    statusFind: (statusSession, session) => {
        console.log('Status da Sessão:', statusSession);
    },
    headless: true
}).then((c) => {
    client = c;
    console.log('Cliente WPPConnect iniciado!');
}).catch(err => console.log('Erro ao iniciar WPPConnect:', err));

// Rota para enviar QR Code
app.get('/get_qr', (req, res) => {
    if (client && client.qrCode) {
        res.json({ qrcode: client.qrCode });
    } else {
        res.json({ qrcode: null, status: 'Aguardando QR...' });
    }
});

// Rota para enviar mensagem
app.post('/send_message', async (req, res) => {
    const { phone, message } = req.body;
    if (!client) return res.json({ error: 'Cliente não conectado ainda' });
    try {
        const result = await client.sendText(phone + '@c.us', message);
        res.json(result);
    } catch (e) {
        res.json({ error: e.message });
    }
});

// Servir HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

