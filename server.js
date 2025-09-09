const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let client;
let lastQRCode = null;
let isConnected = false;

// Criação da sessão WhatsApp
wppconnect.create({
    session: 'session1',
    puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    folderNameToken: './tokens',
    autoClose: 0,
    disableWelcome: true
}).then(async (c) => {
    client = c;
    console.log('WhatsApp iniciado!');

    // Captura QR Code sempre que for gerado
    client.on('qr', async (qr) => {
        try {
            lastQRCode = await QRCode.toDataURL(qr);
            isConnected = false;
            console.log('✅ QR Code atualizado, escaneie para conectar!');
        } catch (err) {
            console.log('Erro ao gerar QR Code:', err.message);
        }
    });

    // Cliente conectado
    client.on('ready', () => {
        console.log('📲 Cliente pronto e conectado!');
        lastQRCode = null;
        isConnected = true;
    });

    // Cliente desconectado
    client.on('disconnected', (reason) => {
        console.log('⚠️ Cliente desconectado:', reason);
        isConnected = false;
    });

}).catch(err => console.log('Erro ao criar sessão:', err));

// Endpoint para retornar QR code
app.get('/qrcode', (req, res) => {
    res.json({ qr: lastQRCode, connected: isConnected });
});

// Endpoint para enviar mensagem
app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    if (!client || !isConnected) {
        return res.status(500).json({ error: 'Cliente não conectado' });
    }

    try {
        await client.sendText(number + '@c.us', message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
