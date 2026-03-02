import { ChatManager, socket } from './api.js';

// --- SISTEMA DE VÍDEO E VOZ ---
const peer = new Peer(undefined, { host: '/', port: '443' });
let localStream = null;
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('localVideo');

// Receber chamada
peer.on('call', call => {
    call.answer(localStream);
    const video = document.createElement('video');
    call.on('stream', userStream => addStream(video, userStream, call.peer));
});

// Iniciar Câmera/Microfone
async function startMedia() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: { echoCancellation: true, noiseSuppression: true } 
            });
            localVideo.srcObject = localStream;
            localStream.getVideoTracks()[0].enabled = false;
            localStream.getAudioTracks()[0].enabled = false;
            socket.emit('join-video', peer.id);
        } catch (err) {
            alert("Ative as permissões de câmera e microfone!");
        }
    }
}

// Ligar para quem entrou
socket.on('user-connected', userId => {
    if (localStream) {
        const call = peer.call(userId, localStream);
        const video = document.createElement('video');
        call.on('stream', userStream => addStream(video, userStream, userId));
    }
});

// Adicionar vídeo de outra pessoa com ÁUDIO ATIVO
function addStream(video, stream, id) {
    if (document.getElementById(id)) return;
    video.id = id;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsinline = true;
    video.muted = false; // Garante que você ouça o amigo
    video.volume = 1.0;
    video.style.width = "100%";
    video.style.aspectRatio = "1/1";
    video.style.objectFit = "cover";
    video.style.border = "1px solid var(--hot-pink)";
    videoGrid.append(video);
    
    // Forçar o áudio a tocar após interação
    video.play().catch(() => {
        window.addEventListener('click', () => video.play(), { once: true });
    });
}

socket.on('user-disconnected', userId => {
    const video = document.getElementById(userId);
    if (video) video.remove();
});

// Botões
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

// --- CHAT E AVATARES (MANTIDO) ---
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