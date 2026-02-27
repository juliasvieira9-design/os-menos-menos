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
    socket.emit('historico', mensagens);

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
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor a bombar em http://localhost:${PORT}`));