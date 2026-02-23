// ============================================
// SISTEMA UNIVERSAL DE CADASTRO/LOGIN - TECA CAPITAL
// Integração com Google Sheets API
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbzXfX-xfT0a1_o1JjBw-7sN5iXJrRQ0XC92utFGdqyD1tlnb9rwyXXruC2wfBBeWiuW/exec';

class TecaCapitalAuth {
    constructor() {
        this.timerInterval = null;
        this.progressInterval = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.setDataAtual();
        this.showLoginContainer(); // Por padrão, mostra o container de login
    }
    
    setupEventListeners() {
        // Alternar entre tipos de serviço no cadastro
        document.querySelectorAll('input[name="tipoServico"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.toggleCamposEspecificos(e.target.value));
        });
        
        // Formulário de cadastro
        document.getElementById('formCadastroUniversal')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processarCadastro();
        });
        
        // Formulário de login
        document.getElementById('formLogin')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processarLogin();
        });
        
        // Botão copiar senha
        document.getElementById('btnCopiarSenha')?.addEventListener('click', () => this.copiarSenha());
        
        // Botão limpar formulário
        document.getElementById('btnLimparForm')?.addEventListener('click', () => {
            document.getElementById('formCadastroUniversal').reset();
            this.setDataAtual();
        });
        
        // Links para alternar entre cadastro e login
        document.getElementById('linkCadastro')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showCadastroContainer();
        });
        
        // Link para recuperar senha (simulado)
        document.getElementById('linkRecuperar')?.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Para recuperar sua senha, entre em contato via WhatsApp ou e-mail: contato@tecacapital.com');
        });
    }
    
    showLoginContainer() {
        document.getElementById('cadastroContainer').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';
    }
    
    showCadastroContainer() {
        document.getElementById('cadastroContainer').style.display = 'block';
        document.getElementById('loginContainer').style.display = 'none';
    }
    
    setDataAtual() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataInput = document.getElementById('dataCadastro');
        if (dataInput) dataInput.value = hoje;
    }
    
    toggleCamposEspecificos(tipoServico) {
        // Esconder todos os campos específicos
        document.querySelectorAll('.campos-especificos').forEach(campo => {
            campo.style.display = 'none';
        });
        
        // Mostrar o campo correspondente
        const mapaCampos = {
            'simuladores': 'camposSimuladores',
            'cursoOnline': 'camposCursoOnline',
            'formacaoPresencial': 'camposFormacaoPresencial',
            'parceiros': 'camposParceiros',
            'personalizado': 'camposPersonalizados'
        };
        
        const campoId = mapaCampos[tipoServico];
        if (campoId) {
            document.getElementById(campoId).style.display = 'block';
        }
    }
    
    // ========== GERADOR DE SENHAS ==========
    gerarSenha(nomeCompleto, tipo) {
        const nomes = nomeCompleto.trim().split(' ');
        const primeiroNome = nomes[0];
        const segundoNome = nomes[1] || '';
        const primeiraLetra1 = primeiroNome.charAt(0).toLowerCase();
        const primeiraLetra2 = segundoNome ? segundoNome.charAt(0).toLowerCase() : 'x';
        const ultimaLetra1 = primeiroNome.charAt(primeiroNome.length - 1).toLowerCase();
        const numeroAleatorio = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        
        switch(tipo) {
            case 'simuladores':
                return `sb${primeiraLetra1}${primeiraLetra2}${numeroAleatorio}`;
            case 'cursoOnline':
                return `co${primeiraLetra1}${primeiraLetra2}${numeroAleatorio}`;
            case 'formacaoPresencial':
                return `fp${primeiraLetra1}${primeiraLetra2}${numeroAleatorio}`;
            case 'parceiros':
                return `prc${primeiraLetra1}${ultimaLetra1}${numeroAleatorio}`;
            default:
                return '';
        }
    }
    
    // ========== CÁLCULO DE EXPIRAÇÃO ==========
    calcularDataExpiracao(tipo, dataCadastro) {
        const data = new Date(dataCadastro);
        
        switch(tipo) {
            case 'simuladores':
                data.setDate(data.getDate() + 90);
                break;
            case 'formacaoPresencial':
                data.setDate(data.getDate() + 15);
                break;
            default:
                return null;
        }
        
        return data.toISOString().split('T')[0];
    }
    
    // ========== BARRA DE PROGRESSO ==========
    mostrarProgresso(containerId, percentual, mensagem) {
        const container = document.getElementById(containerId);
        // Os IDs das barras seguem o padrão: progressBar, loginProgressBar
        const barId = containerId === 'progressContainer' ? 'progressBar' : 'loginProgressBar';
        const textId = containerId === 'progressContainer' ? 'progressText' : 'loginProgressText';
        
        const barra = document.getElementById(barId);
        const texto = document.getElementById(textId);
        
        if (container) container.style.display = 'block';
        if (barra) barra.style.width = `${percentual}%`;
        if (texto) texto.textContent = `${mensagem} (${percentual}%)`;
        
        if (percentual >= 100) {
            setTimeout(() => {
                if (container) container.style.display = 'none';
            }, 1000);
        }
    }
    
    simularProgresso(containerId, duracaoMs, callback) {
        let progresso = 0;
        const incremento = 100 / (duracaoMs / 100);
        
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        this.progressInterval = setInterval(() => {
            progresso += incremento;
            if (progresso >= 100) {
                clearInterval(this.progressInterval);
                this.mostrarProgresso(containerId, 100, 'Concluído');
                setTimeout(callback, 500);
            } else {
                this.mostrarProgresso(containerId, Math.min(progresso, 99), 'Processando...');
            }
        }, 100);
    }
    
    // ========== EXIBIÇÃO TEMPORÁRIA DE SENHA ==========
    exibirSenhaTemporaria(senha) {
        const modal = document.getElementById('senhaModal');
        const senhaDisplay = document.getElementById('senhaGerada');
        const timerNumber = document.getElementById('timerNumber');
        const timerProgress = document.getElementById('timerProgress');
        const timerSegundos = document.getElementById('timerSegundos');
        
        senhaDisplay.textContent = senha;
        modal.style.display = 'flex';
        
        let segundos = 60;
        timerNumber.textContent = segundos;
        timerSegundos.textContent = segundos;
        
        const circumference = 2 * Math.PI * 45; // 2πr para r=45
        
        // Configurar o círculo
        timerProgress.style.strokeDasharray = circumference;
        timerProgress.style.strokeDashoffset = '0';
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            segundos--;
            timerNumber.textContent = segundos;
            timerSegundos.textContent = segundos;
            
            // Atualizar círculo de progresso (quanto menor o segundos, maior o offset)
            const offset = circumference * (1 - (segundos / 60));
            timerProgress.style.strokeDashoffset = offset;
            
            if (segundos <= 0) {
                clearInterval(this.timerInterval);
                modal.style.display = 'none';
            }
        }, 1000);
    }
    
    copiarSenha() {
        const senha = document.getElementById('senhaGerada').textContent;
        navigator.clipboard.writeText(senha).then(() => {
            alert('Senha copiada para a área de transferência!');
        }).catch(() => {
            alert('Clique na senha e copie manualmente.');
        });
    }
    
    // ========== PROCESSAMENTO DE CADASTRO ==========
    async processarCadastro() {
        const tipoServico = document.querySelector('input[name="tipoServico"]:checked')?.value;
        if (!tipoServico) {
            alert('Selecione o tipo de serviço');
            return;
        }
        
        // Coletar dados básicos
        const dadosBasicos = {
            nome: document.getElementById('nomeCompleto').value,
            sexo: document.getElementById('sexo').value,
            pais: document.getElementById('pais').value,
            regiao: document.getElementById('regiao').value,
            idade: document.getElementById('idade').value,
            gmail: document.getElementById('gmail').value,
            telefone: document.getElementById('telefone').value,
            dataCadastro: document.getElementById('dataCadastro').value,
            tipoServico: tipoServico
        };
        
        // Validar campos básicos
        for (let [key, value] of Object.entries(dadosBasicos)) {
            if (!value) {
                alert(`O campo ${key} é obrigatório`);
                return;
            }
        }
        
        // Gerar senha/código
        let senhaGerada = '';
        let codigoEspecial = '';
        
        switch(tipoServico) {
            case 'simuladores':
                senhaGerada = this.gerarSenha(dadosBasicos.nome, 'simuladores');
                break;
            case 'cursoOnline':
                codigoEspecial = this.gerarSenha(dadosBasicos.nome, 'cursoOnline');
                break;
            case 'formacaoPresencial':
                codigoEspecial = this.gerarSenha(dadosBasicos.nome, 'formacaoPresencial');
                break;
            case 'parceiros':
                senhaGerada = this.gerarSenha(dadosBasicos.nome, 'parceiros');
                break;
        }
        
        // Calcular expiração
        const dataExpiracao = this.calcularDataExpiracao(tipoServico, dadosBasicos.dataCadastro);
        
        // Coletar dados específicos
        const dadosEspecificos = this.coletarDadosEspecificos(tipoServico);
        
        // Montar objeto completo para envio
        const dadosCompletos = {
            ...dadosBasicos,
            ...dadosEspecificos,
            senha: senhaGerada,
            codigoEspecial: codigoEspecial,
            dataExpiracao: dataExpiracao
        };
        
        console.log('Dados a serem enviados:', dadosCompletos); // Para debug
        
        // Iniciar barra de progresso
        this.simularProgresso('progressContainer', 2000, async () => {
            // Chamar API para cadastrar
            const resultado = await TecaCapitalAPI.cadastrar(dadosCompletos);
            
            if (resultado.sucesso) {
                // Mostrar senha temporariamente (exceto para parceiros)
                if (tipoServico !== 'parceiros' && senhaGerada) {
                    this.exibirSenhaTemporaria(senhaGerada);
                } else if (tipoServico === 'parceiros') {
                    alert('Cadastro realizado! Você receberá a senha após autorização do administrador.');
                } else if (tipoServico === 'personalizado') {
                    alert('Sua solicitação de serviço personalizado foi enviada! Aguarde o contato da nossa equipe.');
                } else {
                    alert('Cadastro realizado com sucesso!');
                }
                
                // Limpar formulário ou redirecionar
                document.getElementById('formCadastroUniversal').reset();
                this.setDataAtual();
                // Voltar para a tela de login
                this.showLoginContainer();
            }
        });
    }
    
    coletarDadosEspecificos(tipoServico) {
        switch(tipoServico) {
            case 'simuladores':
                return {
                    tipoPagamento: document.getElementById('tipoPagamentoSimuladores')?.value || '',
                    valor: document.getElementById('valorSimuladores')?.value || '7500',
                    comprovativo: document.getElementById('comprovativoSimuladores')?.files[0]?.name || ''
                };
                
            case 'cursoOnline':
                return {
                    tipoCurso: document.getElementById('tipoCurso')?.value || '',
                    turma: document.getElementById('turmaCurso')?.value || '',
                    tipoPagamento: document.getElementById('tipoPagamentoCurso')?.value || '',
                    valor: document.getElementById('valorCurso')?.value || '15000',
                    comprovativo: document.getElementById('comprovativoCurso')?.files[0]?.name || ''
                };
                
            case 'formacaoPresencial':
                return {
                    instituicao: document.getElementById('instituicao')?.value || '',
                    tipoFormacao: document.getElementById('tipoFormacao')?.value || '',
                    turma: document.getElementById('turmaFormacao')?.value || '',
                    tipoPagamento: document.getElementById('tipoPagamentoFormacao')?.value || '',
                    valor: document.getElementById('valorFormacao')?.value || '25000',
                    comprovativo: document.getElementById('comprovativoFormacao')?.files[0]?.name || ''
                };
                
            case 'parceiros':
                return {
                    funcao: document.getElementById('funcaoParceiro')?.value || '',
                    status: document.getElementById('statusParceiro')?.value || 'Pendente'
                };
                
            case 'personalizado':
                return {
                    identificacao: document.getElementById('identificacao')?.value || '',
                    tipoServicoPersonalizado: document.getElementById('tipoServicoPersonalizado')?.value || '',
                    descricao: document.getElementById('descricaoServico')?.value || '',
                    formaPagamento: document.getElementById('formaPagamentoPersonalizado')?.value || '',
                    valor: document.getElementById('valorPersonalizado')?.value || '0',
                    comprovativo: document.getElementById('comprovativoPersonalizado')?.files[0]?.name || ''
                };
                
            default:
                return {};
        }
    }
    
    // ========== PROCESSAMENTO DE LOGIN ==========
    async processarLogin() {
        const nome = document.getElementById('loginNome').value;
        const credencial = document.getElementById('loginCredencial').value;
        
        if (!nome || !credencial) {
            alert('Preencha todos os campos');
            return;
        }
        
        this.simularProgresso('loginProgressContainer', 1500, async () => {
            const resultado = await TecaCapitalAPI.login(nome, credencial);
            
            if (resultado.sucesso) {
                // Verificar expiração antes de liberar acesso
                const acessoValido = await this.verificarExpiracao(nome);
                
                if (acessoValido) {
                    alert('Login realizado com sucesso!');
                    // Redirecionar para a área do usuário
                    // window.location.href = '/area-do-usuario.html';
                    console.log('Redirecionar para área do usuário');
                } else {
                    alert('Seu acesso expirou. Por favor, renove seu cadastro.');
                }
            } else {
                alert('Nome de usuário ou senha incorretos.');
            }
        });
    }
    
    async verificarExpiracao(nome) {
        // Em uma implementação real, consultaria a API
        // Por enquanto, retorna true
        return true;
    }
    
    checkExistingSession() {
        // Verificar se já existe uma sessão ativa
        const sessionActive = sessionStorage.getItem('tecaSession');
        if (sessionActive) {
            const loginTime = parseInt(sessionStorage.getItem('tecaLoginTime'));
            const now = Date.now();
            const diff = now - loginTime;
            
            // Se a sessão tiver menos de 24 horas, manter logado
            if (diff < 86400000) { // 24 horas
                // Redirecionar para área do usuário se estiver na página de login
                // window.location.href = '/area-do-usuario.html';
                console.log('Sessão ativa encontrada');
            } else {
                sessionStorage.removeItem('tecaSession');
                sessionStorage.removeItem('tecaLoginTime');
            }
        }
    }
}

// ============================================
// API DE INTEGRAÇÃO COM GOOGLE SHEETS
// ============================================

class TecaCapitalAPI {
    
    // CADASTRO
    static async cadastrar(dados) {
        try {
            // Em produção, usar fetch real
            // const response = await fetch(API_URL, {
            //     method: 'POST',
            //     mode: 'no-cors',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         acao: 'cadastrar',
            //         ...dados
            //     })
            // });

            // Simulação de sucesso
            console.log('Dados enviados para API:', dados);
            
            // Simular um pequeno atraso de rede
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { sucesso: true };
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            return { sucesso: false };
        }
    }
    
    // LOGIN
    static async login(nome, credencial) {
        try {
            // Em produção, usar fetch real
            // const response = await fetch(API_URL, {
            //     method: 'POST',
            //     mode: 'no-cors',
            //     body: JSON.stringify({
            //         acao: 'login',
            //         nome: nome,
            //         credencial: credencial
            //     })
            // });
            
            // Simulação de sucesso
            console.log('Tentativa de login:', nome, credencial);
            
            // Simular um pequeno atraso de rede
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Salvar sessão
            sessionStorage.setItem('tecaSession', 'true');
            sessionStorage.setItem('tecaLoginTime', Date.now().toString());
            sessionStorage.setItem('tecaUserName', nome);
            
            return { sucesso: true };
            
        } catch (error) {
            console.error('Erro no login:', error);
            return { sucesso: false };
        }
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    window.tecaAuth = new TecaCapitalAuth();
});