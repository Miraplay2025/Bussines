const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let sessions = {}; // { name: { client, qrCode, active, interval } }

// Criar nova sessão
async function createSession(name) {
  if (sessions[name]) return sessions[name];

  let tempSession = { client: null, qrCode: null, active: false, interval: null };

  const client = await wppconnect.create({
    session: name,
    catchQR: (qr) => {
      tempSession.qrCode = qr;
      tempSession.active = false;
      console.log(`📲 QR atualizado para sessão ${name}`);
    },
    statusFind: (status) => {
      console.log(`Sessão ${name}: ${status}`);

      if (status === 'CONNECTED') {
        tempSession.active = true;
        sessions[name] = tempSession;
        if (tempSession.interval) clearInterval(tempSession.interval);
        tempSession.interval = null;
        console.log(`✅ Sessão ${name} conectada`);
      }

      if (['DISCONNECTED', 'NOTLOGGED', 'CLOSED'].includes(status)) {
        if (tempSession.interval) clearInterval(tempSession.interval);
        tempSession.interval = null;
        delete sessions[name];
        console.log(`❌ Sessão ${name} removida`);
      }
    },
    headless: true,
    puppeteerOptions: { args: ["--no-sandbox", "--disable-setuid-sandbox"] }
  });

  tempSession.client = client;
  sessions[name] = tempSession;
  return tempSession;
}

// Listar sessões
app.get('/sessions', (req, res) => {
  const data = Object.keys(sessions).map(name => ({
    name,
    active: sessions[name].active,
  }));
  res.json(data);
});

// Iniciar sessão
app.post('/start-session', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.json({ error: 'Nome da sessão é obrigatório' });

  try {
    const session = await createSession(name);

    // Intervalo de log QR aguardando conexão
    if (!session.active && !session.interval) {
      session.interval = setInterval(() => {
        console.log(`⏳ Sessão ${name} aguardando QR...`);
      }, 4000);
    }

    res.json({ status: 'Sessão criada, aguarde QR', name });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Retornar QR de uma sessão
app.get('/qr/:name', (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session) return res.json({ error: 'Sessão não encontrada' });
  if (session.active) return res.json({ qr: null, active: true });
  res.json({ qr: session.qrCode, active: false });
});

// Enviar mensagem
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

// Obter dados da sessão
app.get('/get-session/:name', async (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session || !session.active) return res.json({ error: 'Sessão não conectada' });

  try {
    const info = await session.client.getHostDevice();
    res.json(info);
  } catch {
    res.json({ error: 'Não foi possível obter dados' });
  }
});

// Excluir sessão
app.delete('/delete-session/:name', async (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session) return res.json({ error: 'Sessão não encontrada' });

  try {
    await session.client.close();
    if (session.interval) clearInterval(session.interval);
    delete sessions[name];
    res.json({ status: `Sessão ${name} excluída` });
  } catch (err) {
    res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
