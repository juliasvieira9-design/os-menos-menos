const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } 
});

let mensagens = []; 

io.on('connection', (socket) => {
    // Chat: Envia histórico
    socket.emit('historico', mensagens);

    // Chat: Recebe e espalha mensagens
    socket.on('enviar_mensagem', (data) => {
        const novaMsg = {
            ...data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now()
        };
        mensagens.unshift(novaMsg);
        if (mensagens.length > 50) mensagens.pop(); 
        io.emit('nova_mensagem', novaMsg);
    });

    // Vídeo: Quando um usuário entra na chamada
    socket.on('join-video', (userId) => {
        socket.broadcast.emit('user-connected', userId);
        
        socket.on('disconnect', () => {
            socket.broadcast.emit('user-disconnected', userId);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));