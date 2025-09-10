const wppconnect = require('@wppconnect-team/wppconnect');

const CHROMIUM_PATH = '/opt/render/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chromium';

wppconnect.create({
    session: 'session1',
    catchQR: (qr, asciiQR) => {
        console.log('QR Code gerado, escaneie pelo WhatsApp:');
        console.log(asciiQR);
    },
    statusFind: (statusSession, session) => {
        console.log('Status da sessão:', statusSession);
    },
    headless: true,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    useChrome: false,
    puppeteerOptions: {
        executablePath: CHROMIUM_PATH
    }
})
.then(client => {
    console.log('WhatsApp conectado com sucesso!');

    const numero = '258878196239';
    const mensagem = 'Olá, tudo bem?';

    client.sendText(numero + '@c.us', mensagem)
        .then((result) => {
            console.log('Mensagem enviada com sucesso:', result);
        })
        .catch((erro) => {
            console.error('Erro ao enviar mensagem:', erro);
        });
})
.catch((erro) => {
    console.error('Erro ao criar sessão:', erro);
});
