// Substitua 'SUA-URL-AQUI' pelo link que a Render te deu (ex: https://os-menos-menos.onrender.com)
const SERVER_URL = 'https://os-menos-menos-chat.onrender.com'; 

// Inicializa o Socket.io e o exporta para ser usado no app.js
export const socket = io(SERVER_URL);

export const ChatManager = {
    mensagens: [],

    // Envia os dados do chat para o servidor
    save(data) {
        socket.emit('enviar_mensagem', data);
    },

    // Escuta o servidor e atualiza a lista local de mensagens
    subscribe(onUpdate) {
        // Quando você entra, recebe as últimas mensagens
        socket.on('historico', (dados) => {
            this.mensagens = dados;
            onUpdate();
        });

        // Quando qualquer pessoa (inclusive você) envia uma mensagem nova
        socket.on('nova_mensagem', (msg) => {
            this.mensagens.unshift(msg); // Adiciona no topo
            onUpdate();
        });
    },

    // Retorna a lista de mensagens para o app.js renderizar na tela
    get() {
        return this.mensagens;
    }
};