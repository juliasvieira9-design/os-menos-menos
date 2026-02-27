export const ChatManager = {
    key: 'omm_social_db',
    save(data) {
        const msgs = this.get();
        msgs.unshift({
            ...data,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            id: Date.now()
        });
        localStorage.setItem(this.key, JSON.stringify(msgs));
    },
    get() {
        return JSON.parse(localStorage.getItem(this.key) || '[]');
    }
};