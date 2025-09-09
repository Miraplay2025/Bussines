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
    console.log('WhatsApp conectado!');

    // Evento de QR code
    client.on('qr', async (qr) => {
        lastQRCode = await QRCode.toDataURL(qr);
        console.log('QR Code atualizado!');
    });

    // Cliente pronto
    client.on('ready', () => {
        console.log('Cliente pronto e conectado!');
        lastQRCode = null; // QR code não é mais necessário
    });

    // Cliente desconectado
    client.on('disconnected', (reason) => {
        console.log('Cliente desconectado:', reason);
        lastQRCode = null;
    });

}).catch(err => console.log('Erro ao criar sessão:', err));

// Atualiza QR code a cada 30 segundos
setInterval(async () => {
    if (client && !client.isConnected) {
        try {
            await client.getQRCode().then(async (qr) => {
                if (qr) lastQRCode = await QRCode.toDataURL(qr);
            }).catch(() => {});
        } catch (err) {
            console.log('Erro ao atualizar QR code:', err.message);
        }
    }
}, 30000); // 30 segundos

// Endpoint para retornar QR code
app.get('/qrcode', (req, res) => {
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
