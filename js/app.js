import { ChatManager } from './api.js';

// --- VARIÁVEIS DE MÍDIA ---
let localStream = null;
const localVideo = document.getElementById('localVideo');

async function toggleMedia(type) {
    try {
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            localStream.getVideoTracks()[0].enabled = false;
            localStream.getAudioTracks()[0].enabled = false;
        }

        const track = type === 'cam' ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
        
        const btn = document.getElementById(type === 'cam' ? 'btn-cam' : 'btn-mic');
        btn.style.background = track.enabled ? "var(--hot-pink)" : "var(--neon-green)";
    } catch (err) {
        alert("Erro ao acessar câmera/microfone. Verifique as permissões do navegador.");
    }
}

document.getElementById('btn-cam').onclick = () => toggleMedia('cam');
document.getElementById('btn-mic').onclick = () => toggleMedia('mic');

// --- LÓGICA DO SITE (BASE ANTERIOR) ---
window.selectAvatar = (seed) => {
    localStorage.setItem('omm_avatar', seed);
    initUser();
    setupAvatarSelector();
};

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupAvatarSelector();
    renderFeed();
    ChatManager.subscribe(() => {
        renderFeed();
        checkLatestForVideo();
    });
});

function renderFeed() {
    const feed = document.getElementById('social-feed');
    if (!feed) return;
    const msgs = ChatManager.get();
    feed.innerHTML = msgs.map(m => `
        <div class="chat-bubble">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.avatar}" class="mini-avatar" style="width:25px; height:25px; float:left; margin-right:10px;">
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
        tvScreen.innerHTML = `<div class="video-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allowfullscreen></iframe></div>`;
    }
}

document.getElementById('social-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name-input').value;
    const msgInput = document.getElementById('msg-input');
    localStorage.setItem('omm_name', name);
    ChatManager.save({ name, msg: msgInput.value, avatar: localStorage.getItem('omm_avatar') || 'Felix' });
    msgInput.value = '';
};