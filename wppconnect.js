const wppconnect = require('@wppconnect-team/wppconnect');

wppconnect.create({
    session: 'meu_session',
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    autoClose: 0 // não fecha automaticamente
})
.then((client) => {
    console.log('WPPConnect Server iniciado');
})
.catch((err) => {
    console.log('Erro:', err);
});
