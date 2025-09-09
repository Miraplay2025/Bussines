const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Servir HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

let sessions = {}; // { name: { client, qrCode, active, interval } }

// Criar nova sessão
async function createSession(name) {
  if (sessions[name]) return sessions[name];

  let tempSession = { client: null, qrCode: null, active: false, interval: null };
  sessions[name] = tempSession; // registrar imediatamente para que o QR seja acessível

  const client = await wppconnect.create({
    session: name,
    catchQR: (qr) => {
      tempSession.qrCode = `data:image/png;base64,${Buffer.from(qr).toString('base64')}`;
      tempSession.active = false;
      console.log(`📲 QR atualizado para sessão ${name}`);
    },
    statusFind: (status) => {
      console.log(`Sessão ${name}: ${status}`);

      if (status === 'CONNECTED') {
        tempSession.active = true;
        console.log(`✅ Sessão ${name} conectada`);
        if (tempSession.interval) {
          clearInterval(tempSession.interval);
          tempSession.interval = null;
        }
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

  // Intervalo para log enquanto QR não conectado
  tempSession.interval = setInterval(() => {
    if (!tempSession.active) {
      console.log(`⏳ Sessão ${name} aguardando QR...`);
    }
  }, 4000);

  return tempSession;
}

// Listar sessões
app.get('/sessions', (req, res) => {
  const data = Object.keys(sessions).map(name => ({
    name,
    active: sessions[name].active
  }));
  res.json(data);
});

// Iniciar sessão
app.post('/start-session', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.json({ error: 'Nome da sessão é obrigatório' });

  try {
    const session = await createSession(name);
    res.json({ status: 'Sessão criada, aguarde QR', name });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Retornar QR
app.get('/qr/:name', (req, res) => {
  const { name } = req.params;
  const session = sessions[name];
  if (!session) return res.json({ error: 'Sessão não encontrada' });
  res.json({ qr: session.active ? null : session.qrCode, active: session.active });
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
  
