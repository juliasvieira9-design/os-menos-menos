import { ChatManager, socket } from './api.js';

let localStream = null;
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('localVideo');

// --- SISTEMA DE VÍDEO MULTI-USUÁRIO ---
async function startMedia() {
    if (!localStream) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            localStream.getVideoTracks()[0].enabled = false;
            localStream.getAudioTracks()[0].enabled = false;
            socket.emit('join-video', socket.id);
        } catch (err) {
            alert("Ative a câmera para participar!");
        }
    }
}

document.getElementById('btn-cam').addEventListener('click', async function() {
    await startMedia();
    const state = !localStream.getVideoTracks()[0].enabled;
    localStream.getVideoTracks()[0].enabled = state;
    this.innerText = state ? "OFF CAM" : "ON CAM";
    this.style.background = state ? "var(--hot-pink)" : "var(--neon-green)";
});

document.getElementById('btn-mic').addEventListener('click', async function() {
    await startMedia();
    const state = !localStream.getAudioTracks()[0].enabled;
    localStream.getAudioTracks()[0].enabled = state;
    this.innerText = state ? "OFF MIC" : "ON MIC";
    this.style.background = state ? "var(--hot-pink)" : "var(--neon-green)";
});

// Detecta amigos ligando a câmera
socket.on('user-connected', userId => {
    if (document.getElementById(`video-${userId}`)) return;
    const remoteVideo = document.createElement('video');
    remoteVideo.id = `video-${userId}`;
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;
    remoteVideo.style.width = "100%";
    remoteVideo.style.border = "1px solid var(--hot-pink)";
    remoteVideo.style.background = "#222";
    videoGrid.appendChild(remoteVideo);
});

socket.on('user-disconnected', userId => {
    const el = document.getElementById(`video-${userId}`);
    if (el) el.remove();
});

// --- CHAT, AVATAR E TV ---
window.selectAvatar = (seed) => {
    localStorage.setItem('omm_avatar', seed);
    initUser();
    setupAvatarSelector();
};

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupAvatarSelector();
    ChatManager.subscribe(() => {
        renderFeed();
        checkLatestForVideo();
    });
});

function renderFeed() {
    const feed = document.getElementById('social-feed');
    if (!feed) return;
    feed.innerHTML = ChatManager.get().map(m => `
        <div class="chat-bubble">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.avatar}" class="mini-avatar" style="width:25px; height:25px; float:left;">
            <b>${m.name}:</b>
            <p style="margin:5px 0">${m.msg}</p>
            <small style="font-size:10px; opacity:0.6">${m.time}</small>
        </div>
    `).join('');
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
    const current = localStorage.getItem('omm_avatar');
    const container = document.getElementById('avatar-selector');
    if (!container) return;
    container.innerHTML = seeds.map(s => `
        <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}" 
             class="avatar-option ${current === s ? 'selected' : ''}" 
             onclick="window.selectAvatar('${s}')">
    `).join('');
}

function checkLatestForVideo() {
    const msgs = ChatManager.get();
    if (msgs.length === 0) return;
    const lastMsg = msgs[0].msg;
    if (lastMsg.includes('youtube.com') || lastMsg.includes('youtu.be')) {
        playVideo(lastMsg);
    }
}

function playVideo(url) {
    const tvScreen = document.getElementById('tv-screen');
    let videoId = "";
    if (url.includes('v=')) { videoId = url.split('v=')[1].split('&')[0]; } 
    else { videoId = url.split('/').pop(); }
    if (tvScreen && videoId) {
        tvScreen.innerHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`;
    }
}

document.getElementById('social-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name-input').value;
    const msgInput = document.getElementById('msg-input');
    ChatManager.save({ name, msg: msgInput.value, avatar: localStorage.getItem('omm_avatar') || 'Felix' });
    msgInput.value = '';
};