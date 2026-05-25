// 1. Cole suas chaves aqui (Essas chaves são públicas, não há problema em ficarem no frontend)
const SUPABASE_URL = sb_publishable_nDvHBgKJ0taX7cMGWo4_6A_1j_H5xmi'';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZXByendqeG5ja3dvdmRpdmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjYyODYsImV4cCI6MjA5NTMwMjI4Nn0.AzX8a8NL0x8UQCjipSb9gjkkDQ6JwLqg5RY7_Y5J_eQ';

// 2. Inicializando o cliente do Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3. Função para testar a inserção no banco de dados
async function criarContaTeste() {
    const statusEl = document.getElementById('status_mensagem');
    statusEl.innerText = "Enviando dados para o Supabase...";
    statusEl.style.color = "blue";

    // Disparando o comando INSERT para a tabela 'contas'
    const { data, error } = await supabaseClient
        .from('contas')
        .insert([
            {
                nome: 'Conta Corrente Teste',
                instituicao: 'Banco Inter',
                tipo: 'corrente',
                saldo_atual: 1500.00
            }
        ])
        .select(); // O .select() pede para o Supabase devolver a linha recém-criada

    // 4. Tratando a resposta
    if (error) {
        console.error("Erro na inserção:", error);
        statusEl.innerText = `Erro: ${error.message}`;
        statusEl.style.color = "red";
    } else {
        console.log("Sucesso! Dados retornados:", data);
        statusEl.innerText = `Sucesso! Conta criada com ID: ${data[0].id}`;
        statusEl.style.color = "green";
    }
}
