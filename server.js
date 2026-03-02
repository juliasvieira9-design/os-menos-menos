const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Permite que o site acesse o servidor

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexões de qualquer lugar (GitHub Pages, localhost, etc)
        methods: ["GET", "POST"]
    }
});

let mensagens = []; // Memória temporária para o chat

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    // Envia as mensagens antigas para quem acabou de entrar
    socket.emit('historico', mensagens);

    // Quando alguém envia uma mensagem
    socket.on('enviar_mensagem', (data) => {
        const novaMsg = {
            ...data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now()
        };
        
        mensagens.unshift(novaMsg); // Adiciona no início da lista
        if (mensagens.length > 50) mensagens.pop(); // Mantém apenas as últimas 50
        
        io.emit('nova_mensagem', novaMsg); // Envia para TODO MUNDO
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

// A Render define a porta automaticamente, ou usa 3000 localmente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});