const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');

const WPP_PORT = 21465;
const SESSIONS_DIR = path.join(__dirname, 'sessions');

// Cria pasta de sessões se não existir
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// Inicia o WPPConnect Server via npx
console.log('Iniciando WPPConnect Server...');
const wppProcess = spawn('npx', ['wppconnect-server', '--port', WPP_PORT, '--sessionDir', SESSIONS_DIR], {
    stdio: 'inherit',
    shell: true
});

// Aguarda alguns segundos antes de iniciar o servidor web
setTimeout(() => {
    console.log('Iniciando servidor web...');
    startWebServer();
}, 5000);

// Servidor web para receber requisições
function startWebServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'public')));

    const WPP_SERVER_URL = `http://localhost:${WPP_PORT}`;

    app.post('/send', async (req, res) => {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
        }

        try {
            const response = await fetch(`${WPP_SERVER_URL}/sendText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: number, message })
            });

            const data = await response.json();
            res.json({ success: true, result: data });
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
            res.status(500).json({ error: 'Falha ao enviar mensagem via WPPConnect Server.' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Servidor web rodando na porta ${PORT}`);
    });
}
