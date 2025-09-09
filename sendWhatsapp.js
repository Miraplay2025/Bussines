const wppconnect = require('@wppconnect-team/wppconnect');

wppconnect.create({
    session: 'session1',             // Nome da sessão
    catchQR: (qr, asciiQR) => {
        console.log('QR Code gerado, escaneie pelo WhatsApp:');
        console.log(asciiQR);       // Exibe QR no terminal
    },
    statusFind: (statusSession, session) => {
        console.log('Status da sessão:', statusSession);
    },
    headless: true,                  // Navegador headless
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'], // Flags
    useChrome: true                  // Usar navegador padrão instalado
})
.then(client => {
    console.log('WhatsApp conectado com sucesso!');

    // Enviar mensagem
    const numero = '258878196239'; // Inclua o código do país (Moçambique: 258)
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

