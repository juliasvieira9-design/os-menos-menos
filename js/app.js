import { ChatManager, socket } from './api.js';

// Gera um ID curto aleatório (Ex: A4B2)
const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
const peer = new Peer(randomId, { host: '/', port: '443' });

let localStream = null;
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('localVideo');
const myIdDisplay = document.getElementById('my-id-display');

// Exibe seu ID embaixo do botão ON CAM
peer.on('open', id => {
    myIdDisplay.innerText = "ID: " + id;
});

// 1. ATENDER CHAMADA (Quando seu amigo te liga usando seu ID)
peer.on('call', async (call) => {
    if (!localStream) { await startMedia(); }
    call.answer(localStream); 
    const video = document.createElement('video');
    call.on('stream', userStream => {
        addStream(video, userStream, call.peer);
    });
});

async function startMedia() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: { echoCancellation: true, noiseSuppression: true } 
            });
            localVideo.srcObject = localStream;
            // Inicia desativado (usuário clica para ligar de fato)
            localStream.getVideoTracks()[0].enabled = false;
            localStream.getAudioTracks()[0].enabled = false;
        } catch (err) {
            alert("Erro: Permita câmera e microfone!");
        }
    }
}

// 2. LIGAR PARA O AMIGO (Você cola o ID dele e clica em Conectar)
document.getElementById('btn-connect').onclick = async () => {
    const remoteId = document.getElementById('peer-id-input').value.trim().toUpperCase();
    if (!remoteId || remoteId === randomId) return alert("Digite um ID válido de um amigo!");

    await startMedia();
    
    const call = peer.call(remoteId, localStream);
    const video = document.createElement('video');
    call.on('stream', userStream => {
        addStream(video, userStream, remoteId);
    });
};

// 3. MOSTRAR VÍDEO DO AMIGO E ATIVAR ÁUDIO
function addStream(video, stream, id) {
    if (document.getElementById(id)) return;
    
    video.id = id;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsinline = true;
    
    // Configurações de som: O vídeo do amigo NÃO pode ser muted
    video.muted = false; 
    video.volume = 1.0;
    
    video.style.width = "100%";
    video.style.aspectRatio = "1/1";
    video.style.objectFit = "cover";
    video.style.border = "1px solid var(--hot-pink)";
    
    videoGrid.append(video);
    
    // Forçar áudio (navegadores bloqueiam som sem clique prévio)
    video.play().catch(() => {
        window.addEventListener('click', () => video.play(), { once: true });
    });
}

// Botões de ON/OFF
document.getElementById('btn-cam').onclick = async () => {
    await startMedia();
    const active = !localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = active;
    document.getElementById('btn-cam').style.background = active ? "var(--hot-pink)" : "var(--neon-green)";
};

document.getElementById('btn-mic').onclick = async () => {
    await startMedia();
    const active = !localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = active;
    document.getElementById('btn-mic').style.background = active ? "var(--hot-pink)" : "var(--neon-green)";
};

// --- LOGICA DO CHAT (MANTIDA) ---
window.selectAvatar = (s) => { localStorage.setItem('omm_avatar', s); initUser(); setupAvatarSelector(); };

document.addEventListener('DOMContentLoaded', () => {
    initUser(); setupAvatarSelector();
    ChatManager.subscribe(() => {
        renderFeed();
        checkLatestForVideo();
    });
});

function renderFeed() {
    const feed = document.getElementById('social-feed');
    feed.innerHTML = ChatManager.get().map(m => `
        <div class="chat-bubble">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.avatar}" class="mini-avatar" style="width:20px; float:left; margin-right:8px;">
            <b>${m.name}:</b> <p style="margin:0">${m.msg}</p>
        </div>
    `).join('');
}

function checkLatestForVideo() {
    const msgs = ChatManager.get();
    if (msgs.length === 0) return;
    const lastMsg = msgs[0].msg;
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = lastMsg.match(ytRegex);
    if (match && match[1]) {
        document.getElementById('tv-screen').innerHTML = `
            <div style="position:relative; width:100%; padding-bottom:56.25%;">
                <iframe src="https://www.youtube.com/embed/${match[1]}?autoplay=1" 
                    style="position:absolute; top:0; left:0; width:100%; height:100%;" 
                    frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>`;
    }
}

function initUser() {
    const avatar = localStorage.getItem('omm_avatar') || 'Felix';
    const name = localStorage.getItem('omm_name') || 'Visitante';
    document.getElementById('user-display-avatar').src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatar}`;
    document.getElementById('user-display-name').innerText = name;
    document.getElementById('user-name-input').value = name;
}

function setupAvatarSelector() {
    const seeds = ['Felix', 'Luna', 'Jack', 'Misty', 'Bear', 'Panda'];
    const container = document.getElementById('avatar-selector');
    if (!container) return;
    container.innerHTML = seeds.map(s => `<img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}" class="avatar-option" onclick="window.selectAvatar('${s}')">`).join('');
}

document.getElementById('social-form').onsubmit = (e) => {
    e.preventDefault();
    ChatManager.save({ 
        name: document.getElementById('user-name-input').value, 
        msg: document.getElementById('msg-input').value, 
        avatar: localStorage.getItem('omm_avatar') || 'Felix' 
    });
    document.getElementById('msg-input').value = '';
};