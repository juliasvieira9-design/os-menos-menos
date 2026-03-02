// Substitua pela sua URL da Render
const SERVER_URL = 'https://os-menos-menos-chat.onrender.com'; 

// Inicializa o Socket.io
export const socket = io(SERVER_URL);

export const ChatManager = {
    mensagens: [],

    // Envia mensagem para o servidor
    save(data) {
        socket.emit('enviar_mensagem', data);
    },

    // Escuta as atualizações do servidor
    subscribe(onUpdate) {
        // Quando recebe o histórico ao entrar
        socket.on('historico', (dados) => {
            this.mensagens = dados;
            onUpdate();
        });

        // Quando chega uma mensagem nova de alguém
        socket.on('nova_mensagem', (msg) => {
            this.mensagens.unshift(msg);
            onUpdate();
        });
    },

    // Retorna a lista atual para o app.js renderizar
    get() {
        return this.mensagens;
    }
};