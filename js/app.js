import { ChatManager } from './api.js';

const FRIENDS = ['Cyber_Kitty', 'Neon_Boy_2004', 'Pixel_Gamer', 'Pink_Punk', 'VibeMaster'];

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    renderFeed();
    renderOnlineFriends();
    setupAvatarSelector();
});

// GESTÃO DE USUÁRIO
function initUser() {
    const savedAvatar = localStorage.getItem('omm_user_avatar') || 'Felix';
    const savedName = localStorage.getItem('omm_user_name') || 'Visitante';
    updateProfileUI(savedAvatar, savedName);
    document.getElementById('user-name-input').value = savedName;
}

function updateProfileUI(avatar, name) {
    const url = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatar}`;
    document.getElementById('user-display-avatar').src = url;
    document.getElementById('user-display-name').innerText = name;
    localStorage.setItem('omm_user_avatar', avatar);
}

// SELETOR DE AVATAR
function setupAvatarSelector() {
    const seeds = ['Felix', 'Luna', 'Jack', 'Misty', 'Bear', 'Panda', 'Blue', 'Star'];
    const container = document.getElementById('avatar-selector');
    container.innerHTML = seeds.map(s => `
        <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}" 
             class="avatar-option ${localStorage.getItem('omm_user_avatar') === s ? 'selected' : ''}" 
             data-seed="${s}">
    `).join('');

    container.querySelectorAll('.avatar-option').forEach(img => {
        img.onclick = () => {
            const seed = img.dataset.seed;
            updateProfileUI(seed, localStorage.getItem('omm_user_name') || 'Visitante');
            setupAvatarSelector();
        };
    });
}

// MURAL
function renderFeed() {
    const feed = document.getElementById('social-feed');
    feed.innerHTML = ChatManager.get().map(m => `
        <div class="chat-bubble">
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.avatar}" style="width:30px; float:left; margin-right:10px;">
            <b style="color:var(--deep-purple)">${m.name}:</b>
            <p style="margin: 5px 0;">${m.msg}</p>
            <small style="font-size:10px; color:#888;">${m.time}</small>
        </div>
    `).join('');
}

document.getElementById('social-form').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('user-name-input').value;
    const msg = document.getElementById('msg-input').value;
    const avatar = localStorage.getItem('omm_user_avatar');

    localStorage.setItem('omm_user_name', name);
    
    if(msg.includes('youtube.com') || msg.includes('youtu.be')) {
        const id = msg.includes('v=') ? msg.split('v=')[1].split('&')[0] : msg.split('/').pop();
        document.getElementById('pip-tv').style.display = 'block';
        document.getElementById('tv-screen').innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
    }

    ChatManager.save({ name, msg, avatar });
    e.target.reset();
    renderFeed();
};

function renderOnlineFriends() {
    document.getElementById('online-friends').innerHTML = FRIENDS.map(f => `
        <div class="friend-item">
            <div class="status-dot"></div>
            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${f}" style="width:20px; margin-right:5px;">
            <span>${f}</span>
        </div>
    `).join('');
}