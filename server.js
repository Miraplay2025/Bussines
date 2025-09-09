const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

let client;
let lastQRCode = null;

// Cria a sessão do WhatsApp com persistência e args para root
wppconnect.create({
    session: 'session1',
    puppeteerOptions: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    folderNameToken: './tokens' // pasta para salvar sessão
}).then((c) => {
    client = c;
    console.log('WhatsApp conectado!');

    client.on('qr', async (qr) => {
        lastQRCode = await QRCode.toDataURL(qr);
        console.log('QR Code atualizado!');
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp desconectado:', reason);
        lastQRCode = null;
    });

}).catch(err => console.log('Erro ao criar sessão:', err));

// Endpoint para pegar QR code
app.get('/qrcode', async (req, res) => {
    const connected = client && client.isConnected ? true : false;
    res.json({ qr: lastQRCode, connected });
});

// Endpoint para enviar mensagem
app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    if (!client || !client.isConnected) {
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
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
