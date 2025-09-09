const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let sessions = {}; // { nome: { client, qrCode, active } }

// Criar nova sessão
async function createSession(sessionName) {
  if (sessions[sessionName]) return sessions[sessionName];

  sessions[sessionName] = { client: null, qrCode: null, active: false };

  return wppconnect.create({
    session: sessionName,
    catchQR: (qr) => {
      sessions[sessionName].qrCode = qr;
      sessions[sessionName].active = false;
      console.log(`QR atualizado para sessão ${sessionName}`);
    },
    statusFind: (statusSession) => {
      sessions[sessionName].active = (statusSession === 'CONNECTED');
      console.log(`Sessão ${sessionName}: ${statusSession}`);
    },
    headless: true,
    puppeteerOptions: { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
  }).then(client => {
    sessions[sessionName].client = client;
    return sessions[sessionName];
  });
}

// 🔹 Listar sessões
app.get('/sessions', (req, res) => {
  const data = Object.keys(sessions).map(name => ({
    name,
    active: sessions[name].active,
  }));
  res.json(data);
});

// 🔹 Iniciar nova sessão
app.post('/start-session', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.json({ error: 'Nome da sessão é obrigatório' });

  await createSession(name);
  res.json({ status: 'Sessão criada', name });
});

// 🔹 Retornar QR de uma sessão
app.get('/qr/:name', (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session) return res.json({ error: 'Sessão não encontrada' });
  res.json({ qr: session.active ? null : session.qrCode, active: session.active });
});

// 🔹 Enviar mensagem
app.post('/send-message/:name', async (req, res) => {
  const { name } = req.params;
  const { number, message } = req.body;

  if (!sessions[name] || !sessions[name].client) {
    return res.json({ status: 'Erro', message: 'Sessão não encontrada' });
  }

  try {
    await sessions[name].client.sendText(number + '@c.us', message);
    res.json({ status: `Mensagem enviada pela sessão ${name}` });
  } catch (err) {
    res.json({ status: 'Erro', message: err.message });
  }
});

// 🔹 Obter dados de uma sessão
app.get('/get-session/:name', async (req, res) => {
  const { name } = req.params;
  if (!sessions[name]) return res.json({ error: 'Sessão não encontrada' });

  try {
    const info = await sessions[name].client.getHostDevice();
    res.json(info);
  } catch {
    res.json({ error: 'Não foi possível obter dados' });
  }
});

// Rodar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
