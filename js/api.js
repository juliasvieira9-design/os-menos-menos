/**
 * api.js - Conexão Real-time com Supabase
 */

// COLE SUA URL E SUA CHAVE ANON ABAIXO:
const supabaseUrl = 'https://nyfkauavbekedmvaimld.supabase.co';
const supabaseKey = 'sb_publishable_KEaTXTETwMq6b05ommBkng_ElxP_I-H';

const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

export const ChatManager = {
    // Salva a mensagem no banco de dados
    async save(data) {
        const { error } = await _supabase
            .from('mensagens')
            .insert([{ 
                name: data.name, 
                msg: data.msg, 
                avatar: data.avatar 
            }]);
        
        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
        }
    },

    // Busca as últimas 20 mensagens
    async get() {
        const { data, error } = await _supabase
            .from('mensagens')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Erro ao buscar mensagens:', error.message);
            return [];
        }
        return data;
    },

    // Escuta em tempo real por novas mensagens
    subscribe(callback) {
        _supabase
            .channel('public:mensagens')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'mensagens' 
            }, 
            (payload) => {
                console.log('Nova mensagem recebida em tempo real!');
                callback(payload.new);
            })
            .subscribe();
    }
};