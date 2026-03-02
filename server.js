const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Permite que o site se conecte ao servidor

const server = http.createServer(app);

// Configuração do Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Permite conexões de qualquer origem (GitHub Pages, localhost, etc)
        methods: ["GET", "POST"]
    }
});

let mensagens = []; // Memória temporária para o histórico do chat

io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    // --- LÓGICA DO CHAT ---

    // Envia as mensagens antigas para quem acabou de entrar
    socket.emit('historico', mensagens);

    // Quando alguém envia uma mensagem no chat
    socket.on('enviar_mensagem', (data) => {
        const novaMsg = {
            ...data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now()
        };
        
        mensagens.unshift(novaMsg); // Adiciona no topo da lista
        if (mensagens.length > 50) mensagens.pop(); // Mantém apenas as últimas 50 mensagens
        
        io.emit('nova_mensagem', novaMsg); // Envia para todos os usuários conectados
    });

    // --- LÓGICA DE VÍDEO (SINALIZAÇÃO) ---

    // Quando um usuário liga a câmera, ele avisa seu ID do PeerJS
    socket.on('join-video', (peerId) => {
        console.log(`Usuário ${socket.id} entrou na chamada de vídeo com PeerID: ${peerId}`);
        
        // Avisa a todos os outros usuários para "ligarem" para este PeerID
        socket.broadcast.emit('user-connected', peerId);

        // Se o usuário desconectar, avisa para remover o vídeo da tela dos outros
        socket.on('disconnect', () => {
            console.log(`Usuário ${socket.id} saiu.`);
            socket.broadcast.emit('user-disconnected', peerId);
        });
    });
});

// A porta é definida pela Render automaticamente ou usa a 3000 localmente
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando com sucesso!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
});