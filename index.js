const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

wppconnect.create({
    session: 'bot',
    puppeteerOptions: {
        executablePath: '/usr/bin/chromium-browser', // Render Chromium
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
}).then(client => {
    console.log('WPPConnect iniciado com sucesso!');

    app.post('/send', async (req, res) => {
        const { number, message } = req.body;
        if (!number || !message) return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });

        try {
            const result = await client.sendText(number.includes('@c.us') ? number : `${number}@c.us`, message);
            console.log('Mensagem enviada:', result);
            res.json({ success: true, result });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({ error: 'Falha ao enviar mensagem', details: error });
        }
    });

    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });

}).catch(error => {
    console.error('Erro ao iniciar WPPConnect:', error);
});
