import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Porta do WPPConnect Server
const WPP_PORT = 21465;

// Pasta para salvar sessão
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// Inicia o WPPConnect Server
console.log('Iniciando WPPConnect Server...');
const wppProcess = spawn('npx', ['wppconnect-server', '--port', WPP_PORT, '--sessionDir', SESSIONS_DIR], {
    stdio: 'inherit',
    shell: true
});

// Aguardar 5 segundos antes de iniciar o servidor web
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
