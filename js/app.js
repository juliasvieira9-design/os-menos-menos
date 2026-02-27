import { ChatManager } from './api.js';

// Função Global para os avatares funcionar no HTML
window.selectAvatar = (seed) => {
    localStorage.setItem('omm_avatar', seed);
    initUser();
    setupAvatarSelector();
};

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupAvatarSelector();
    renderFeed(); // Renderiza vazio inicialmente
    
    // Se inscreve para receber mensagens e comandos da TV
    ChatManager.subscribe(() => {
        renderFeed();
        checkLatestForVideo(); // Verifica se a última mensagem tem vídeo
    });
});

function renderFeed() {
    const feed = document.getElementById('social-feed');
    if (!feed) return;
    const msgs = ChatManager.get();
    
    feed.innerHTML = msgs.map(m => `
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

// Lógica da TVzinha (Detecta YouTube)
function checkLatestForVideo() {
    const msgs = ChatManager.get();
    if (msgs.length === 0) return;
    
    const lastMsg = msgs[0].msg; // Pega a mensagem mais recente
    if (lastMsg.includes('youtube.com') || lastMsg.includes('youtu.be')) {
        playVideo(lastMsg);
    }
}

function playVideo(url) {
    const tvWindow = document.getElementById('pip-tv');
    const tvScreen = document.getElementById('tv-screen');
    
    // Extrai o ID do vídeo (suporta links curtos e longos)
    let videoId = "";
    try {
        if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
    } catch (e) {
        console.error("Erro ao processar URL do YouTube");
    }

    if (videoId && tvScreen) {
        // Força a exibição da janela
        if (tvWindow) tvWindow.style.display = 'block';
        
        tvScreen.innerHTML = `
            <div class="video-wrapper" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
                <iframe 
                    style="position:absolute; top:0; left:0; width:100%; height:100%;"
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allow="autoplay; encrypted-media" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    }
}

document.getElementById('social-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name-input').value;
    const msgInput = document.getElementById('msg-input');
    const msg = msgInput.value;
    const avatar = localStorage.getItem('omm_avatar') || 'Felix';
    
    localStorage.setItem('omm_name', name);
    ChatManager.save({ name, msg, avatar });
    msgInput.value = '';
};