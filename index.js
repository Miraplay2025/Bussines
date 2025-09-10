const wppconnect = require('@wppconnect-team/wppconnect');

const args = process.argv.slice(2);

// Recebe número e mensagem via argumentos
const number = args[0]; // ex: '25884xxxxxxx'
const message = args[1]; // ex: 'Olá, essa é uma mensagem de teste'

if (!number || !message) {
    console.log('Uso: node index.js <numero> <mensagem>');
    process.exit(1);
}

wppconnect.create({
    session: 'bot',
    puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
}).then(client => {
    client.sendText(number.includes('@c.us') ? number : `${number}@c.us`, message)
        .then((result) => {
            console.log('Mensagem enviada com sucesso:', result);
        })
        .catch((error) => {
            console.error('Erro ao enviar mensagem:', error);
        });
}).catch((error) => {
    console.error('Erro ao criar cliente WPPConnect:', error);
});
