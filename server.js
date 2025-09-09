const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let client;

// Opções do Puppeteer
const puppeteerOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: puppeteer.executablePath()
};

// Inicializa WPPConnect
wppconnect.create({
    session: 'mysession',
    puppeteerOptions: puppeteerOptions,
    headless: true,
    catchQR: (qrCode, asciiQR, attempts, urlCode) => {
        console.log('QR RECEBIDO:', qrCode ? 'Gerado' : 'Aguardando...');
        client.qrCode = qrCode;
    },
    statusFind: (statusSession, session) => {
        console.log('Status da Sessão:', statusSession);
        if (statusSession === 'CONNECTED') {
            console.log('WhatsApp conectado!');
        }
    }
}).then(c => {
    client = c;
    console.log('Cliente WPPConnect iniciado com sucesso!');
}).catch(err => console.log('Erro ao iniciar WPPConnect:', err));

// Rota para QR Code
app.get('/get_qr', (req, res) => {
    if (client && client.qrCode) {
        res.json({ qrcode: client.qrCode, status: 'CONNECTED' });
    } else {
        res.json({ qrcode: null, status: 'WAITING' });
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

// Servir frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Porta do Render ou local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
