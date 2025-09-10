const wppconnect = require('@wppconnect-team/wppconnect');

async function start() {
  try {
    const client = await wppconnect.create({
      session: 'render-session',
      catchQR: (qrCode, asciiQR) => {
        console.log('📸 Escaneie o QR Code abaixo para conectar:');
        console.log(asciiQR); // QR Code no terminal
      },
      statusFind: (statusSession, session) => {
        console.log('Status da sessão:', statusSession);
      },
      headless: true,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ WhatsApp conectado!');

    const numero = '258878196239';
    const mensagem = 'Olá, tudo bem?';
    await client.sendText(numero + '@c.us', mensagem);

    console.log('Mensagem enviada com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ou enviar mensagem:', error);
  }
}

start();
