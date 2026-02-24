/**
 * TECA CAPITAL - SISTEMA DE CADASTRO E LOGIN
 */

// ===== CONFIGURAÇÕES =====
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjtDzuJm013k7HGGZbjwfmMPNr5HjpqiPl2fWuM33nKSuvzfb7AOTisZjLyAaSViSesw/exec";
const TEMPO_VISIBILIDADE = 60; // segundos

// ===== VALIDAÇÕES PREDEFINIDAS =====
const VALIDACOES = {
    sexo: ['Homem', 'Mulher'],
    tipoPagamento: ['Caixa', 'Transferência Bancária', 'Express', 'Unitel Money', 'USDT via Binance ou outra corretora'],
    tipoCurso: ['Mercados Financeiro', 'Gestão', 'Economia'],
    turmas: ['Da manhã', 'De Tarde', 'De Noite', 'Do fim de semana'],
    funcoesParceiro: ['Formador', 'Assistente', 'Caixa', 'Líder regional', 'Secretaria/o', 'Estagiário/a']
};

// ===== ESTADO GLOBAL =====
let timerInterval = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarAbas();
    inicializarFormularioCadastro();
    inicializarFormularioLogin();
    inicializarFormularioAdmin();
    carregarCamposDinamicos();
    configurarMascaras();
    configurarValidacoesTempoReal();
});

// ===== 1. GERENCIAMENTO DE ABAS =====
function inicializarAbas() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        });
    });
}

// ===== 2. FORMULÁRIO DINÂMICO =====
function carregarCamposDinamicos() {
    const selectTipo = document.getElementById('tipo-servico');
    if (!selectTipo) return;
    
    selectTipo.addEventListener('change', () => {
        atualizarCamposPorTipo(selectTipo.value);
    });
}

function atualizarCamposPorTipo(tipo) {
    const container = document.getElementById('campos-dinamicos');
    if (!container) return;
    
    let html = '';
    
    switch(tipo) {
        case 'Simuladores/Bibliotecas':
            html = `
                <h3 class="section-title"><i class="fas fa-credit-card"></i> Dados de Pagamento</h3>
                <div class="form-group">
                    <label for="tipo-pagamento">Tipo de Pagamento <span class="required">*</span></label>
                    <select id="tipo-pagamento" name="tipoPagamento" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${VALIDACOES.tipoPagamento.map(op => `<option value="${op}">${op}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="valor-pago">Valor Pago (AOA) <span class="required">*</span></label>
                    <input type="number" id="valor-pago" name="valorPago" class="form-control" value="1500.00" readonly required>
                </div>
                <div class="form-group">
                    <label for="comprovativo">Comprovativo (PDF, JPG, PNG) <span class="required">*</span></label>
                    <input type="file" id="comprovativo" name="comprovativo" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
                    <small class="text-dim">Máximo 5MB</small>
                </div>
            `;
            break;
            
        case 'Curso Online':
            html = `
                <h3 class="section-title"><i class="fas fa-graduation-cap"></i> Dados do Curso</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tipo-curso">Tipo de Curso <span class="required">*</span></label>
                        <select id="tipo-curso" name="tipoCurso" class="form-control" required>
                            <option value="">Selecione...</option>
                            ${VALIDACOES.tipoCurso.map(op => `<option value="${op}">${op}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="turma">Turma <span class="required">*</span></label>
                        <select id="turma" name="turma" class="form-control" required>
                            <option value="">Selecione...</option>
                            ${VALIDACOES.turmas.map(op => `<option value="${op}">${op}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="tipo-pagamento">Tipo de Pagamento <span class="required">*</span></label>
                    <select id="tipo-pagamento" name="tipoPagamento" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${VALIDACOES.tipoPagamento.map(op => `<option value="${op}">${op}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="valor-pago">Valor Pago (AOA) <span class="required">*</span></label>
                    <input type="number" id="valor-pago" name="valorPago" class="form-control" value="2000.00" readonly required>
                </div>
                <div class="form-group">
                    <label for="comprovativo">Comprovativo (PDF, JPG, PNG) <span class="required">*</span></label>
                    <input type="file" id="comprovativo" name="comprovativo" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
                    <small class="text-dim">Máximo 5MB</small>
                </div>
            `;
            break;
            
        case 'Formação Presencial':
            html = `
                <h3 class="section-title"><i class="fas fa-chalkboard-teacher"></i> Dados da Formação</h3>
                <div class="form-group">
                    <label for="instituicao">Instituição Associada <span class="required">*</span></label>
                    <input type="text" id="instituicao" name="instituicao" class="form-control" placeholder="Nome da instituição" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tipo-formacao">Tipo de Formação <span class="required">*</span></label>
                        <select id="tipo-formacao" name="tipoFormacao" class="form-control" required>
                            <option value="">Selecione...</option>
                            ${VALIDACOES.tipoCurso.map(op => `<option value="${op}">${op}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="turma">Turma <span class="required">*</span></label>
                        <select id="turma" name="turma" class="form-control" required>
                            <option value="">Selecione...</option>
                            ${VALIDACOES.turmas.map(op => `<option value="${op}">${op}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="tipo-pagamento">Tipo de Pagamento <span class="required">*</span></label>
                    <select id="tipo-pagamento" name="tipoPagamento" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${VALIDACOES.tipoPagamento.map(op => `<option value="${op}">${op}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="valor-pago">Valor Pago (AOA) <span class="required">*</span></label>
                    <input type="number" id="valor-pago" name="valorPago" class="form-control" value="2500.00" readonly required>
                </div>
                <div class="form-group">
                    <label for="comprovativo">Comprovativo (PDF, JPG, PNG) <span class="required">*</span></label>
                    <input type="file" id="comprovativo" name="comprovativo" class="form-control" accept=".pdf,.jpg,.jpeg,.png" required>
                    <small class="text-dim">Máximo 5MB</small>
                </div>
            `;
            break;
            
        case 'Servicos':
            html = `
                <h3 class="section-title"><i class="fas fa-cogs"></i> Detalhes do Serviço</h3>
                <div class="form-group">
                    <label for="identificacao">Identificação (BI/Passaporte/NIF) <span class="required">*</span></label>
                    <input type="text" id="identificacao" name="identificacao" class="form-control" placeholder="Ex: 123456789LA" required>
                </div>
                <div class="form-group">
                    <label for="sector">Sector de Atuação <span class="required">*</span></label>
                    <input type="text" id="sector" name="sector" class="form-control" placeholder="Ex: Tecnologia, Saúde, etc." required>
                </div>
                <div class="form-group">
                    <label for="tipo-servico-personalizado">Tipo de Serviço <span class="required">*</span></label>
                    <input type="text" id="tipo-servico-personalizado" name="tipoServico" class="form-control" placeholder="Ex: Consultoria Financeira" required>
                </div>
                <div class="form-group">
                    <label for="descricao">Descrição do Serviço <span class="required">*</span></label>
                    <textarea id="descricao" name="descricao" class="form-control" rows="4" placeholder="Descreva em detalhes o que precisa..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="forma-pagamento">Forma de Pagamento <span class="required">*</span></label>
                    <select id="forma-pagamento" name="formaPagamento" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${VALIDACOES.tipoPagamento.map(op => `<option value="${op}">${op}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="valor-pago-servico">Valor Proposto (AOA) <span class="required">*</span></label>
                    <input type="number" id="valor-pago-servico" name="valorPago" class="form-control" placeholder="Ex: 50000" required>
                </div>
                <div class="form-group">
                    <label for="comprovativo-servico">Comprovativo (opcional)</label>
                    <input type="file" id="comprovativo-servico" name="comprovativo" class="form-control" accept=".pdf,.jpg,.jpeg,.png">
                    <small class="text-dim">Máximo 5MB</small>
                </div>
            `;
            break;
            
        case 'Parceiros':
            html = `
                <h3 class="section-title"><i class="fas fa-handshake"></i> Dados do Parceiro</h3>
                <div class="form-group">
                    <label for="funcao">Função <span class="required">*</span></label>
                    <select id="funcao" name="funcao" class="form-control" required>
                        <option value="">Selecione...</option>
                        ${VALIDACOES.funcoesParceiro.map(op => `<option value="${op}">${op}</option>`).join('')}
                    </select>
                </div>
                <div class="alert-info" style="margin-top: 15px;">
                    <i class="fas fa-info-circle"></i> Após o cadastro, aguarde a autorização do Administrador.
                </div>
            `;
            break;
            
        default:
            html = '<p class="text-dim">Selecione um tipo de serviço para continuar.</p>';
    }
    
    container.innerHTML = html;
}

// ===== 3. VALIDAÇÕES EM TEMPO REAL =====
function configurarValidacoesTempoReal() {
    const nomeInput = document.getElementById('nome');
    if (nomeInput) {
        nomeInput.addEventListener('input', () => validarNome());
    }
    
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', () => validarEmail());
    }
    
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', () => validarTelefone());
    }
    
    const idadeInput = document.getElementById('idade');
    if (idadeInput) {
        idadeInput.addEventListener('input', () => validarIdade());
    }
}

function validarNome() {
    const input = document.getElementById('nome');
    const error = document.getElementById('error-nome');
    const valor = input.value.trim();
    
    if (valor.length < 3) {
        error.textContent = 'Nome deve ter pelo menos 3 caracteres';
        return false;
    } else {
        error.textContent = '';
        return true;
    }
}

function validarEmail() {
    const input = document.getElementById('email');
    const error = document.getElementById('error-email');
    const valor = input.value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!regex.test(valor)) {
        error.textContent = 'E-mail inválido';
        return false;
    } else {
        error.textContent = '';
        return true;
    }
}

function validarTelefone() {
    const input = document.getElementById('telefone');
    const error = document.getElementById('error-telefone');
    const valor = input.value.replace(/\D/g, '');
    
    if (valor.length < 9) {
        error.textContent = 'Telefone deve ter pelo menos 9 dígitos';
        return false;
    } else {
        error.textContent = '';
        return true;
    }
}

function validarIdade() {
    const input = document.getElementById('idade');
    const error = document.getElementById('error-idade');
    const valor = parseInt(input.value);
    
    if (isNaN(valor) || valor < 16 || valor > 100) {
        error.textContent = 'Idade deve estar entre 16 e 100 anos';
        return false;
    } else {
        error.textContent = '';
        return true;
    }
}

// ===== 4. MÁSCARAS =====
function configurarMascaras() {
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length > 9) valor = valor.slice(0, 9);
            e.target.value = valor;
        });
    }
}

// ===== 5. FILE TO BASE64 =====
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Arquivo muito grande. Máximo 5MB.'));
            return;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// ===== 6. FUNÇÕES DE REGISTRO NAS PLANILHAS (NOVAS) =====

/**
 * Calcula data de expiração (30 dias a partir da data atual)
 * @returns {string} Data formatada YYYY-MM-DD
 */
function calcularDataExpiracao() {
    const data = new Date();
    data.setDate(data.getDate() + 30);
    
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
}

/**
 * Salva dados na planilha principal "Cadastro/Logion"
 * @param {Object} dados - Dados completos do usuário
 * @param {string} senha - Senha gerada
 */
async function salvarDadosPlanilhaPrincipal(dados, senha) {
    const payload = {
        acao: 'salvarPrincipal',
        planilha: 'Cadastro/Logion',
        dados: JSON.stringify({
            nome: dados.nome,
            sexo: dados.sexo,
            pais: dados.pais,
            regiao: dados.regiao,
            idade: dados.idade,
            email: dados.email,
            telefone: dados.telefone,
            data: dados.data || new Date().toISOString().split('T')[0],
            senha: senha,
            codigoEspecial: senha
        })
    };

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload)
        });
        console.log('✅ Dados salvos na planilha principal');
    } catch (error) {
        console.error('❌ Erro ao salvar na planilha principal:', error);
    }
}

/**
 * Salva dados na planilha específica conforme o destino
 * @param {Object} dados - Dados completos do usuário
 * @param {string} destino - Tipo de serviço
 * @param {string} senha - Senha gerada
 */
async function salvarDadosPlanilhaEspecifica(dados, destino, senha) {
    let payload = {
        acao: 'salvarEspecifica',
        destino: destino,
        dados: {}
    };

    const dataExpiracao = calcularDataExpiracao();
    const dataAtual = new Date().toISOString().split('T')[0];

    switch(destino) {
        case 'Simuladores/Bibliotecas':
            payload.dados = {
                nome: dados.nome,
                sexo: dados.sexo,
                pais: dados.pais,
                regiao: dados.regiao,
                idade: dados.idade,
                email: dados.email,
                telefone: dados.telefone,
                data: dataAtual,
                tipoPagamento: dados.tipoPagamento,
                valorPago: dados.valorPago || '1500.00',
                comprovativo: dados.comprovativo || '',
                dataExpiracao: dataExpiracao,
                senha: senha
            };
            break;
            
        case 'Curso Online':
            payload.dados = {
                nome: dados.nome,
                sexo: dados.sexo,
                pais: dados.pais,
                regiao: dados.regiao,
                idade: dados.idade,
                email: dados.email,
                telefone: dados.telefone,
                data: dataAtual,
                tipoCurso: dados.tipoCurso,
                turma: dados.turma,
                tipoPagamento: dados.tipoPagamento,
                valorPago: dados.valorPago || '2000.00',
                comprovativo: dados.comprovativo || '',
                senha: senha
            };
            break;
            
        case 'Formação Presencial':
            payload.dados = {
                nome: dados.nome,
                sexo: dados.sexo,
                pais: dados.pais,
                regiao: dados.regiao,
                idade: dados.idade,
                email: dados.email,
                telefone: dados.telefone,
                instituicao: dados.instituicao,
                tipoFormacao: dados.tipoFormacao,
                turma: dados.turma,
                tipoPagamento: dados.tipoPagamento,
                valorPago: dados.valorPago || '2500.00',
                comprovativo: dados.comprovativo || '',
                data: dataAtual,
                senha: senha,
                dataExpiracao: dataExpiracao
            };
            break;
            
        case 'Servicos':
            payload.dados = {
                nome: dados.nome,
                identificacao: dados.identificacao,
                sector: dados.sector,
                paisRegiao: `${dados.pais}-${dados.regiao}`,
                tipoServico: dados.tipoServico,
                descricao: dados.descricao,
                formaPagamento: dados.formaPagamento,
                valorPago: dados.valorPago,
                comprovativo: dados.comprovativo || '',
                data: dataAtual
            };
            break;
            
        case 'Parceiros':
            payload.dados = {
                nome: dados.nome,
                sexo: dados.sexo,
                pais: dados.pais,
                regiao: dados.regiao,
                idade: dados.idade,
                funcao: dados.funcao,
                email: dados.email,
                telefone: dados.telefone,
                data: dataAtual,
                senha: senha,
                status: 'Pendente'
            };
            break;
    }

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(payload)
        });
        console.log(`✅ Dados salvos na planilha específica: ${destino}`);
    } catch (error) {
        console.error('❌ Erro ao salvar na planilha específica:', error);
    }
}

// ===== 7. ENVIO DE CADASTRO (MODIFICADO PARA INCLUIR REGISTRO) =====
function inicializarFormularioCadastro() {
    const form = document.getElementById('form-cadastro');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validarNome() || !validarEmail() || !validarTelefone() || !validarIdade()) {
            mostrarMensagem('mensagem-cadastro', 'Por favor, corrija os erros no formulário.', 'error');
            return;
        }
        
        const tipoServico = document.getElementById('tipo-servico').value;
        if (!tipoServico) {
            mostrarMensagem('mensagem-cadastro', 'Selecione um tipo de serviço.', 'error');
            return;
        }
        
        // Coletar dados comuns
        const dados = {
            nome: document.getElementById('nome').value.trim(),
            sexo: document.getElementById('sexo').value,
            pais: document.getElementById('pais').value.trim(),
            regiao: document.getElementById('regiao').value.trim(),
            idade: document.getElementById('idade').value,
            email: document.getElementById('email').value.trim(),
            telefone: document.getElementById('telefone').value,
            destino: tipoServico,
            data: new Date().toISOString().split('T')[0]
        };
        
        try {
            // Coletar campos específicos
            const comprovativoInput = document.querySelector('#campos-dinamicos input[type="file"]');
            if (comprovativoInput && comprovativoInput.files && comprovativoInput.files[0]) {
                dados.comprovativo = await fileToBase64(comprovativoInput.files[0]);
                dados.nomeArquivo = comprovativoInput.files[0].name;
            }
            
            switch(tipoServico) {
                case 'Simuladores/Bibliotecas':
                    dados.tipoPagamento = document.getElementById('tipo-pagamento')?.value;
                    dados.valorPago = document.getElementById('valor-pago')?.value;
                    break;
                    
                case 'Curso Online':
                    dados.tipoCurso = document.getElementById('tipo-curso')?.value;
                    dados.turma = document.getElementById('turma')?.value;
                    dados.tipoPagamento = document.getElementById('tipo-pagamento')?.value;
                    dados.valorPago = document.getElementById('valor-pago')?.value;
                    break;
                    
                case 'Formação Presencial':
                    dados.instituicao = document.getElementById('instituicao')?.value;
                    dados.tipoFormacao = document.getElementById('tipo-formacao')?.value;
                    dados.turma = document.getElementById('turma')?.value;
                    dados.tipoPagamento = document.getElementById('tipo-pagamento')?.value;
                    dados.valorPago = document.getElementById('valor-pago')?.value;
                    break;
                    
                case 'Servicos':
                    dados.identificacao = document.getElementById('identificacao')?.value;
                    dados.sector = document.getElementById('sector')?.value;
                    dados.tipoServico = document.getElementById('tipo-servico-personalizado')?.value;
                    dados.descricao = document.getElementById('descricao')?.value;
                    dados.formaPagamento = document.getElementById('forma-pagamento')?.value;
                    dados.valorPago = document.getElementById('valor-pago-servico')?.value;
                    break;
                    
                case 'Parceiros':
                    dados.funcao = document.getElementById('funcao')?.value;
                    break;
            }
            
            await enviarCadastro(dados);
            
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            mostrarMensagem('mensagem-cadastro', 'Erro ao processar o arquivo: ' + error.message, 'error');
        }
    });
}

/**
 * Função para enviar o cadastro do Frontend para o Google Sheets
 * @param {Object} dadosForm - Objeto contendo os dados do formulário HTML
 */
async function enviarCadastro(dadosForm) {
    const btn = document.getElementById('btn-cadastrar');
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
        // Adiciona a ação para o Apps Script identificar
        const payload = {
            acao: 'cadastrar',
            ...dadosForm
        };

        console.log('Enviando dados:', payload);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        console.log('Requisição enviada com sucesso');
        
        // Gerar senha conforme as regras
        const senhaGerada = gerarSenhaSimulada(dadosForm.destino, dadosForm.nome);
        
        // === NOVO: SALVAR NAS PLANILHAS ===
        await salvarDadosPlanilhaPrincipal(dadosForm, senhaGerada);
        await salvarDadosPlanilhaEspecifica(dadosForm, dadosForm.destino, senhaGerada);
        
        // Criar resultado com a senha
        const resultado = {
            status: "sucesso",
            mensagem: "Cadastro realizado",
            senha: senhaGerada
        };
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('mensagem-cadastro', 'Cadastramento feito com sucesso', 'success');
        
        // Tratar exibição da senha
        tratarExibicaoSenha(resultado, dadosForm.destino);
        
        // Limpar formulário
        document.getElementById('form-cadastro').reset();
        atualizarCamposPorTipo('');
        
    } catch (error) {
        console.error("Erro na comunicação com a base de dados:", error);
        mostrarMensagem('mensagem-cadastro', 'Erro ao conectar com o servidor. Tente novamente.', 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// Função auxiliar para gerar senha simulada
function gerarSenhaSimulada(destino, nome) {
    if (!nome) return 'SB-123456';
    
    const partes = nome.split(' ');
    const primeiroNome = partes[0] || '';
    const segundoNome = partes[1] || '';
    
    const primeiraLetra1 = primeiroNome.charAt(0).toLowerCase() || 'x';
    const primeiraLetra2 = segundoNome.charAt(0).toLowerCase() || 'x';
    const ultimaLetra1 = primeiroNome.charAt(primeiroNome.length - 1).toLowerCase() || 'x';
    
    const numero = Math.floor(Math.random() * 1000) + 1;
    const numeroFormatado = numero.toString().padStart(4, '0');
    
    switch(destino) {
        case 'Simuladores/Bibliotecas':
            return `sb${primeiraLetra1}${primeiraLetra2}${numeroFormatado}`;
        case 'Curso Online':
            return `co${primeiraLetra1}${primeiraLetra2}${numeroFormatado}`;
        case 'Formação Presencial':
            return `fp${primeiraLetra1}${primeiraLetra2}${numeroFormatado}`;
        case 'Parceiros':
            return `prc${primeiraLetra1}${ultimaLetra1}${numeroFormatado}`;
        default:
            return `TECA-${numeroFormatado}`;
    }
}

// ===== 8. EXIBIÇÃO DE SENHA COM TIMER E BOTÕES (MODIFICADO) =====
function tratarExibicaoSenha(resultado, destino) {
    const painelMensagem = document.getElementById("mensagem-cadastro");
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (destino === "Parceiros") {
        painelMensagem.innerHTML = `
            <div class="alert-info">
                <i class="fas fa-info-circle"></i>
                Receberás a senha de acesso depois da autorização do Administrador master, 
                o mesmo irá entrar em contacto e fornecer a sua senha de acesso e outras instruções.
            </div>`;
        return;
    }

    if (destino === "Servicos") {
        painelMensagem.innerHTML = `
            <div class="alert-success">
                <i class="fas fa-check-circle"></i>
                Solicitação enviada com sucesso! Aguarde nosso contato em até 48h úteis.
            </div>`;
        return;
    }
    
    if (resultado.senha) {
        painelMensagem.innerHTML = `
            <div class="senha-card">
                <h4><i class="fas fa-key"></i> Sua senha/código de acesso:</h4>
                <div class="codigo">${resultado.senha}</div>
                <div class="timer-container">
                    <div class="timer-display" id="timerDisplay">60</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 100%"></div>
                    </div>
                    <p><strong>Atenção:</strong> Você tem <span id="timerText">60</span> segundos para anotar!</p>
                </div>
                <div class="botoes-acesso" id="botoesAcesso" style="display: none; margin-top: 20px;">
                    <p><strong>✅ Cadastro concluído! Agora você pode acessar:</strong></p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        ${destino === 'Simuladores/Bibliotecas' ? 
                            `<a href="biblioteca.html" class="btn btn-primary" style="text-decoration: none;">📚 Acessar Biblioteca</a>
                             <a href="simuladores.html" class="btn btn-secondary" style="text-decoration: none;">📊 Acessar Simuladores</a>` : 
                            `<a href="biblioteca.html" class="btn btn-primary" style="text-decoration: none;">📚 Acessar Biblioteca</a>`
                        }
                    </div>
                </div>
                <div class="aviso" id="avisoFinal" style="display: none;">
                    Se não anotou a senha, solicite pela mesma via whatsapp ou email da Teca Capital, 
                    ou liga para o nosso nº para poder ter acesso aos simuladores e bibliotecas. 
                    Tempo mínimo de espera para resposta: 5 minutos a 2 horas. Obrigado.
                </div>
            </div>`;
        
        let segundos = TEMPO_VISIBILIDADE;
        const timerDisplay = document.getElementById('timerDisplay');
        const timerText = document.getElementById('timerText');
        const progressFill = document.getElementById('progressFill');
        const avisoFinal = document.getElementById('avisoFinal');
        const botoesAcesso = document.getElementById('botoesAcesso');
        
        timerInterval = setInterval(() => {
            segundos--;
            timerDisplay.textContent = segundos;
            timerText.textContent = segundos;
            
            const percent = (segundos / TEMPO_VISIBILIDADE) * 100;
            progressFill.style.width = `${percent}%`;
            
            if (segundos <= 10) {
                timerDisplay.classList.add('urgent');
            }
            
            if (segundos <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                document.querySelector('.timer-container').style.display = 'none';
                document.querySelector('.codigo').style.opacity = '0.3';
                avisoFinal.style.display = 'block';
            }
        }, 1000);
        
        // Mostrar botões após 1 segundo
        setTimeout(() => {
            if (botoesAcesso) {
                botoesAcesso.style.display = 'block';
            }
        }, 1000);
    }
}

// ===== 9. LOGIN DE USUÁRIO (MODIFICADO) =====
function inicializarFormularioLogin() {
    const form = document.getElementById('form-login');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById('login-usuario').value.trim();
        const senha = document.getElementById('login-senha').value;
        
        if (!usuario || !senha) {
            mostrarMensagem('mensagem-login', 'Preencha todos os campos.', 'error');
            return;
        }
        
        await realizarLogin(usuario, senha, 'comum');
    });
}

// ===== 10. LOGIN ADMIN (MODIFICADO) =====
function inicializarFormularioAdmin() {
    const form = document.getElementById('form-admin');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById('admin-usuario').value.trim();
        const pais = document.getElementById('admin-pais').value.trim();
        const senha = document.getElementById('admin-senha').value;
        
        if (!usuario || !pais || !senha) {
            mostrarMensagem('mensagem-admin', 'Preencha todos os campos.', 'error');
            return;
        }
        
        await realizarLogin(usuario, senha, 'admin', pais);
    });
}

/**
 * Função de Login (MODIFICADA - REDIRECIONAMENTOS ATUALIZADOS)
 */
async function realizarLogin(usuario, senha, tipo = 'comum', pais = '') {
    const btn = tipo === 'admin' 
        ? document.querySelector('#form-admin button[type="submit"]')
        : document.querySelector('#form-login button[type="submit"]');
    
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    try {
        let url = `${SCRIPT_URL}?usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}&tipo=${tipo}`;
        if (pais) {
            url += `&pais=${encodeURIComponent(pais)}`;
        }
        
        const response = await fetch(url);
        const dados = await response.json();

        if (dados.login) {
            const mensagemId = tipo === 'admin' ? 'mensagem-admin' : 'mensagem-login';
            mostrarMensagem(mensagemId, 'Logion feito com sucesso', 'success');
            
            // REDIRECIONAMENTOS ATUALIZADOS
            setTimeout(() => {
                if (tipo === 'admin') {
                    window.location.href = "adm.html"; // Admin
                } else {
                    window.location.href = "biblioteca.html"; // Usuário comum
                }
            }, 1000);
        } else {
            const mensagemId = tipo === 'admin' ? 'mensagem-admin' : 'mensagem-login';
            mostrarMensagem(mensagemId, 'Dados incorretos. Verifique seu usuário e senha.', 'error');
        }
    } catch (error) {
        console.error("Erro no login:", error);
        const mensagemId = tipo === 'admin' ? 'mensagem-admin' : 'mensagem-login';
        mostrarMensagem(mensagemId, 'Erro ao conectar com o servidor.', 'error');
    } finally {
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
}

// ===== 11. UTILITÁRIOS =====
function mostrarMensagem(containerId, texto, tipo = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-error',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[tipo] || 'alert-info';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = alertClass;
    alertDiv.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${texto}
    `;
    
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    if (tipo === 'success') {
        setTimeout(() => {
            if (container.contains(alertDiv)) {
                alertDiv.remove();
            }
        }, 5000);
    }
}