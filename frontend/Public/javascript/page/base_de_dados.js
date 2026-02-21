const API_URL = 'https://script.google.com/macros/s/AKfycbzXfX-xfT0a1_o1JjBw-7sN5iXJrRQ0XC92utFGdqyD1tlnb9rwyXXruC2wfBBeWiuW/exec';

class TecaCapitalAPI {
    
    // CADASTRO COM BARRA DE PROGRESSO
    static async cadastrar(dados) {
        try {
            // INICIA BARRA DE PROGRESSO
            this.mostrarProgresso(30, 'Processando cadastro...');
            
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    acao: 'cadastrar',
                    ...dados
                })
            });

            this.mostrarProgresso(80, 'Verificando dados...');
            
            // MENSAGEM DE SUCESSO OBRIGATÓRIA
            alert('✅ Cadastramento feito com sucesso');
            
            // MOSTRA SENHA POR 60 SEGUNDOS
            if (dados.tipoServico !== 'Parceiros') {
                this.exibirSenhaTemporaria(resultado.senhaVisivel);
            }
            
            this.mostrarProgresso(100, 'Concluído!');
            
            return { sucesso: true };
            
        } catch (error) {
            alert(`❌ Erro: ${error.message}`);
            return { sucesso: false };
        }
    }
    
    // LOGIN COM BARRA DE PROGRESSO
    static async login(nome, credencial) {
        try {
            this.mostrarProgresso(50, 'Consultando base de dados...');
            
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    acao: 'logion',
                    nome: nome,
                    credencial: credencial
                })
            });
            
            // MENSAGEM DE SUCESSO OBRIGATÓRIA
            alert('✅ Logion feito com sucesso');
            
            this.mostrarProgresso(100, 'Acesso liberado!');
            
            return { sucesso: true };
            
        } catch (error) {
            alert(`❌ Erro: ${error.message}`);
            return { sucesso: false };
        }
    }
    
    // BARRA DE PROGRESSO VISUAL
    static mostrarProgresso(percent, mensagem) {
        // IMPLEMENTE SUA BARRA DE PROGRESSO AQUI
        console.log(`${percent}% - ${mensagem}`);
    }
}