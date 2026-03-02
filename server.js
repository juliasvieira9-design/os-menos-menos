const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Criando o servidor HTTP
const server = http.createServer(app);

// Configurando o Socket.io com CORS liberado
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

let mensagens = []; // Armazena as últimas mensagens temporariamente

io.on('connection', (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);

    // --- LÓGICA DO CHAT ---
    
    // Envia o histórico para quem acabou de conectar
    socket.emit('historico', mensagens);

    // Recebe nova mensagem e repassa para todos
    socket.on('enviar_mensagem', (data) => {
        const novaMsg = {
            ...data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            id: Date.now()
        };
        
        mensagens.unshift(novaMsg);
        if (mensagens.length > 50) mensagens.pop(); // Limita o histórico
        
        io.emit('nova_mensagem', novaMsg);
    });

    // --- LÓGICA DE VÍDEO (PEERJS SIGNALING) ---

    // Quando o usuário liga a câmera, ele envia o seu "Peer ID"
    socket.on('join-video', (peerId) => {
        console.log(`Usuário ${socket.id} entrou no vídeo com PeerID: ${peerId}`);
        
        // Avisa a todos os OUTROS usuários que este PeerID se conectou
        // Assim eles podem "ligar" para esse ID automaticamente
        socket.broadcast.emit('user-connected', peerId);

        // Quando o usuário desconecta, avisamos para remover o vídeo dele da tela
        socket.on('disconnect', () => {
            console.log(`Usuário ${socket.id} saiu do vídeo`);
            socket.broadcast.emit('user-disconnected', peerId);
        });
    });
});

// Porta padrão para Render ou Localhost
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});