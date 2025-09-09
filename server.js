// server.js
const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let sessions = {}; // { nome: { client, qrCode, active, interval } }

// 🔹 Criar nova sessão
async function createSession(sessionName) {
  if (sessions[sessionName]) return sessions[sessionName];

  let tempSession = { client: null, qrCode: null, active: false, interval: null };

  return wppconnect.create({
    session: sessionName,
    catchQR: (qr) => {
      tempSession.qrCode = qr;
      tempSession.active = false;
      console.log(`📲 QR atualizado para sessão ${sessionName}`);
    },
    statusFind: (statusSession) => {
      console.log(`Sessão ${sessionName}: ${statusSession}`);

      if (statusSession === 'CONNECTED') {
        tempSession.active = true;
        sessions[sessionName] = tempSession;

        if (tempSession.interval) {
          clearInterval(tempSession.interval);
          tempSession.interval = null;
        }

        console.log(`✅ Sessão ${sessionName} conectada`);
      }

      if (['DISCONNECTED', 'NOTLOGGED', 'CLOSED'].includes(statusSession)) {
        if (tempSession.interval) {
          clearInterval(tempSession.interval);
          tempSession.interval = null;
        }
        delete sessions[sessionName];
        console.log(`❌ Sessão ${sessionName} removida`);
      }
    },
    headless: true,
    puppeteerOptions: { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
  }).then(client => {
    tempSession.client = client;
    return tempSession;
  });
}

// 🔹 Servir HTML diretamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔹 Listar sessões
app.get('/sessions', (req, res) => {
  const data = Object.keys(sessions).map(name => ({
    name,
    active: sessions[name].active,
  }));
  res.json(data);
});

// 🔹 Iniciar sessão
app.post('/start-session', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.json({ error: 'Nome da sessão é obrigatório' });

  const session = await createSession(name);
  if (session.active) {
    return res.json({ status: 'Sessão já conectada', name });
  }

  if (!session.interval) {
    session.interval = setInterval(() => {
      if (!session.active) {
        console.log(`⏳ Sessão ${name} aguardando conexão...`);
      }
    }, 40000);
  }

  res.json({ status: 'Sessão iniciada, escaneie o QR', name });
});

// 🔹 Retornar QR de uma sessão
app.get('/qr/:name', (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session) return res.json({ error: 'Sessão não encontrada' });
  if (session.active) return res.json({ qr: null, active: true });
  res.json({ qr: session.qrCode, active: false });
});

// 🔹 Enviar mensagem
app.post('/send-message/:name', async (req, res) => {
  const { name } = req.params;
  const { number, message } = req.body;

  if (!sessions[name] || !sessions[name].client || !sessions[name].active) {
    return res.json({ status: 'Erro', message: 'Sessão não conectada' });
  }

  try {
    await sessions[name].client.sendText(number + '@c.us', message);
    res.json({ status: `Mensagem enviada pela sessão ${name}` });
  } catch (err) {
    res.json({ status: 'Erro', message: err.message });
  }
});

// 🔹 Obter dados da sessão
app.get('/get-session/:name', async (req, res) => {
  const { name } = req.params;
  if (!sessions[name] || !sessions[name].active) {
    return res.json({ error: 'Sessão não conectada' });
  }

  try {
    const info = await sessions[name].client.getHostDevice();
    res.json(info);
  } catch {
    res.json({ error: 'Não foi possível obter dados' });
  }
});

// 🔹 Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
