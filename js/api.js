// Exemplo: se seu IP for 192.168.1.10
const SERVER_URL = 'http://192.168.30.15:3000'; 
const socket = io(SERVER_URL);

export const ChatManager = {
    mensagens: [],
    save(data) {
        socket.emit('enviar_mensagem', data);
    },
    subscribe(onUpdate) {
        socket.on('historico', (dados) => {
            this.mensagens = dados;
            onUpdate();
        });
        socket.on('nova_mensagem', (msg) => {
            this.mensagens.unshift(msg);
            onUpdate();
        });
    },
    get() { return this.mensagens; }
};