const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7L5XowJYawTYChVsG-k_FtO0ieen4ilQd9UpDjnilcgIy3uLSRdIg_5rG3QY6blwr5Q/exec";

/**
 * Função para enviar o cadastro do Frontend para o Google Sheets
 * @param {Object} dadosForm - Objeto contendo os dados do formulário HTML
 */
async function enviarCadastro(dadosForm) {
    try {
        // Adiciona a ação para o Apps Script identificar
        const payload = {
            acao: 'cadastrar',
            ...dadosForm
        };

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (resultado.status === "sucesso") {
            tratarExibicaoSenha(resultado, dadosForm.destino);
        } else {
            alert("Erro ao cadastrar: " + resultado.mensagem);
        }
    } catch (error) {
        console.error("Erro na comunicação com a base de dados:", error);
    }
}

/**
 * Lógica de exibição de senhas e mensagens temporárias
 */
function tratarExibicaoSenha(resultado, destino) {
    const painelMensagem = document.getElementById("mensagem-retorno"); // ID do seu elemento HTML
    
    // Regra para Parceiros: Não vê a senha
    if (destino === "Parceiros") {
        painelMensagem.innerHTML = `
            <div class="alerta-sucesso">
                Solicitação enviada! Receberás a senha de acesso depois da autorização do Administrador master, 
                o mesmo irá entrar em contacto e fornecer a sua senha de acesso e outras instruções.
            </div>`;
        return;
    }

    // Regra para Serviços Personalizados: Sem senha
    if (destino === "Servicos") {
        painelMensagem.innerHTML = `<div class="alerta-sucesso">Requisição enviada com sucesso! Aguarde nosso contato.</div>`;
        return;
    }

    // Regra para Simuladores, Curso e Formação: Exibe por 60 segundos
    if (resultado.senha) {
        painelMensagem.innerHTML = `
            <div id="bloco-senha" class="card-senha">
                <p>Sua senha/código de acesso é:</p>
                <h2 id="codigo-gerado">${resultado.senha}</h2>
                <p><strong>Atenção:</strong> Você tem <span id="timer">60</span> segundos para anotar!</p>
            </div>`;

        let segundos = 60;
        const intervalo = setInterval(() => {
            segundos--;
            document.getElementById("timer").innerText = segundos;

            if (segundos <= 0) {
                clearInterval(intervalo);
                painelMensagem.innerHTML = `
                    <div class="alerta-info">
                        Se não anotou a senha, solicite pela mesma via whatsapp ou email da Teca Capital, 
                        ou liga para o nosso nº para poder ter acesso aos simuladores e bibliotecas. 
                        Tempo mínimo de espera para resposta: 5 minutos a 2 horas. Obrigado.
                    </div>`;
            }
        }, 1000);
    }
}

/**
 * Função de Login
 */
async function realizarLogin(usuario, senha, tipo = 'comum', pais = '') {
    const urlConsulta = `${SCRIPT_URL}?usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}&tipo=${tipo}&pais=${encodeURIComponent(pais)}`;
    
    try {
        const response = await fetch(urlConsulta);
        const dados = await response.json();

        if (dados.login) {
            alert("Acesso autorizado! Bem-vindo, " + (dados.nome || "Administrador"));
            window.location.href = "dashboard.html"; // Redireciona para sua área logada
        } else {
            alert("Dados incorretos. Verifique seu usuário e senha.");
        }
    } catch (error) {
        alert("Erro ao conectar com o servidor.");
    }
}