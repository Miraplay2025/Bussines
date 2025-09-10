const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const wppconnect = require('@wppconnect-team/wppconnect');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let client;

// Inicializa WPPConnect
wppconnect.create({
    session: 'bot',
    catchQR: (qrCode) => {
        console.log('QR Code gerado. Escaneie para autenticar:');
        console.log(qrCode);
    },
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
}).then(c => {
    client = c;
    console.log('WPPConnect iniciado com sucesso!');
}).catch(err => {
    console.error('Erro ao iniciar WPPConnect:', err);
});

// Rota principal para envio
app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
    }

    if (!client) {
        return res.status(500).json({ error: 'Cliente WhatsApp não iniciado ainda.' });
    }

    try {
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;
        const result = await client.sendText(formattedNumber, message);
        res.json({ success: true, result });
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).json({ error: 'Falha ao enviar mensagem.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
