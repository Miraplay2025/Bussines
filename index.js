const venom = require('venom-bot');

venom
  .create({
    session: 'whatsapp-session',
    headless: true,
    multidevice: true, // suporte para multi-dispositivo
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })
  .then((client) => start(client))
  .catch((err) => {
    console.error('Erro ao iniciar sessão:', err);
  });

function start(client) {
  console.log('✅ WhatsApp conectado!');

  // O número deve estar no formato internacional sem "+" e sem espaços
  const numero = '258878196239'; // +258 é o código de Moçambique
  const mensagem = 'Olá, tudo bem?';

  client
    .sendText(numero + '@c.us', mensagem)
    .then((result) => {
      console.log('Mensagem enviada com sucesso:', result);
    })
    .catch((erro) => {
      console.error('Erro ao enviar mensagem:', erro);
    });
}
