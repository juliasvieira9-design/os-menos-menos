import { ChatManager, socket } from './api.js';

let localStream = null;
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('localVideo');

// Inicializa o PeerJS (ele cria um ID único para o seu vídeo)
const peer = new Peer(undefined, {
    host: '/',
    port: '443'
});

// --- SISTEMA DE VÍDEO E ÁUDIO REAL ---

// 1. Escuta quando alguém te liga
peer.on('call', call => {
    call.answer(localStream); // Atende com seu vídeo/áudio
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, call.peer);
    });
});

// 2. Função para ligar a mídia
async function startMedia() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            localVideo.srcObject = localStream;
            
            // Começa mutado/desligado para evitar sustos
            localStream.getVideoTracks()[0].enabled = false;
            localStream.getAudioTracks()[0].enabled = false;

            // Avisa o Socket que você está pronto para receber chamadas
            socket.emit('join-video', peer.id);
        } catch (err) {
            alert("Erro: Ative a câmera/microfone no seu navegador!");
        }
    }
}

// 3. Quando um amigo entra, você liga para ele
socket.on('user-connected', userId => {
    if (localStream) {
        const call = peer.call(userId, localStream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, userId);
        });
    }
});

function addVideoStream(video, stream, id) {
    if (document.getElementById(id)) return;
    video.id = id;
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => video.play());
    video.style.width = "100%";
    video.style.border = "1px solid var(--hot-pink)";
    video.style.background = "#000";
    videoGrid.append(video);
}

socket.on('user-disconnected', userId => {
    const video = document.getElementById(userId);
    if (video) video.remove();
});

// Botões de controle
document.getElementById('btn-cam').onclick = async () => {
    await startMedia();
    const state = !localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = state;
    document.getElementById('btn-cam').style.background = state ? "var(--hot-pink)" : "var(--neon-green)";
};

document.getElementById('btn-mic').onclick = async () => {
    await startMedia();
    const state = !localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = state;
    document.getElementById('btn-mic').style.background = state ? "var(--hot-pink)" : "var(--neon-green)";
};

// --- LÓGICA DO CHAT (MANTIDA) ---
document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupAvatarSelector();
    ChatManager.subscribe(() => renderFeed());
});

function renderFeed() {
    const feed = document.getElementById('social-feed');
    feed.innerHTML = ChatManager.get().map(m => `
        <div class="chat-bubble">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.avatar}" class="mini-avatar" style="width:25px; float:left; margin-right:10px;">
            <b>${m.name}:</b> <p>${m.msg}</p>
        </div>
    `).join('');
}

// Reutilize suas funções initUser, setupAvatarSelector e checkLatestForVideo aqui abaixo...