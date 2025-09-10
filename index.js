const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Inicializa o cliente WPPConnect
wppconnect.create({
    session: 'bot',
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
            // Adiciona @c.us se não estiver presente
            const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
            const result = await client.sendText(chatId, message);

            console.log(`Mensagem enviada para ${chatId}:`, result);
            return res.json({ success: true, result });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return res.status(500).json({ error: 'Falha ao enviar mensagem', details: error.toString() });
        }
    });

    // Inicia o servidor HTTP
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });

}).catch(error => {
    console.error('Erro ao iniciar WPPConnect:', error);
});
