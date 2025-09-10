const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Inicializa o cliente WPPConnect usando o Chromium do Render
wppconnect.create({
    session: 'bot',
    puppeteerOptions: {
        executablePath: '/usr/bin/chromium-browser', // Caminho do Chromium do Render
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
}).then(client => {
    console.log('WPPConnect iniciado com sucesso!');

    // Endpoint HTTP para enviar mensagens
    app.post('/send', async (req, res) => {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
        }

        try {
            const result = await client.sendText(number.includes('@c.us') ? number : `${number}@c.us`, message);
            console.log('Mensagem enviada:', result);
            return res.json({ success: true, result });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return res.status(500).json({ error: 'Falha ao enviar mensagem', details: error });
        }
    });

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });

}).catch(error => {
    console.error('Erro ao iniciar WPPConnect:', error);
});

