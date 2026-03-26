// ============================================================
// TECA CAPITAL EDTECH - PAINEL ADMINISTRATIVO V2 (RECONSTRUÇÃO COMPLETA)
// ============================================================
// Versão: 2.0
// Data: 26/03/2026
// Autor: Engenharia Sénior
// Descrição: Sistema administrativo completo com gestão de sessão,
//            dashboard, gestão de utilizadores por aba, insights financeiros,
//            visualização de senhas com toggle, logs de login, etc.
// ============================================================

// ============================================================
// SECÇÃO 1 — CONFIGURAÇÃO GLOBAL
// ============================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeahMxXzXIDou1hTshRYLmSPeHRFx5RmQvEe5iFP717iKbvyTt1covpO-ydpzmiD_Abg/exec';

// ============================================================
// MAPA DE ABAS — FONTE DE VERDADE ÚNICA
// ============================================================
const MAPA_ABAS = {
    dashboard: {
        idHTML: 'dashboard',
        cacheKey: 'dashboard',
        icone: 'fa-tachometer-alt',
        label: 'Dashboard'
    },
    parceiros: {
        nomeAba: 'Parceiros',
        idHTML: 'parceiros',
        cacheKey: 'aba_parceiros',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Função', 'Status', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: true,
        temFuncao: true,
        temTurma: false,
        temValor: true,
        temInstituicao: false,
        temSenha: true,
        icone: 'fa-handshake',
        label: 'Parceiros'
    },
    simuladores: {
        nomeAba: 'Simuladores-Bibliotecas',
        idHTML: 'simuladores',
        cacheKey: 'aba_simuladores',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Valor Pago', 'Status', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: true,
        temFuncao: false,
        temTurma: false,
        temValor: true,
        temInstituicao: false,
        temSenha: true,
        icone: 'fa-calculator',
        label: 'Simuladores e Biblioteca'
    },
    cursos: {
        nomeAba: 'Cursos Online',
        idHTML: 'cursos',
        cacheKey: 'aba_cursos',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Turma', 'Valor', 'Status', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: true,
        temFuncao: false,
        temTurma: true,
        temValor: true,
        temInstituicao: false,
        temSenha: true,
        icone: 'fa-video',
        label: 'Cursos Online'
    },
    formacao: {
        nomeAba: 'Formação Presencial',
        idHTML: 'formacao',
        cacheKey: 'aba_formacao',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Instituição', 'Turma', 'Valor', 'Status', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: true,
        temFuncao: false,
        temTurma: true,
        temValor: true,
        temInstituicao: true,
        temSenha: true,
        icone: 'fa-chalkboard-teacher',
        label: 'Formação Presencial'
    },
    servicos: {
        nomeAba: 'Serviços Personalizados',
        idHTML: 'servicos',
        cacheKey: 'aba_servicos',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Proposta Valor', 'Descrição', 'Status', 'Data Registo', 'Ações'],
        temStatus: true,
        temFuncao: false,
        temTurma: false,
        temValor: true,
        temInstituicao: false,
        temSenha: false,
        icone: 'fa-concierge-bell',
        label: 'Serviços Personalizados'
    },
    naopagos: {
        nomeAba: 'Usuários Não Pagos',
        idHTML: 'naopagos',
        cacheKey: 'aba_naopagos',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: false,
        temFuncao: false,
        temTurma: false,
        temValor: false,
        temInstituicao: false,
        temSenha: true,
        icone: 'fa-user-slash',
        label: 'Usuários Não Pagos'
    },
    todos: {
        nomeAba: null,
        idHTML: 'todos',
        cacheKey: 'aba_todos',
        colunas: ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Tipo', 'Planilha', 'Status', 'Data Registo', 'Expiração', 'Ações'],
        temStatus: true,
        temFuncao: false,
        temTurma: false,
        temValor: false,
        temInstituicao: false,
        temSenha: true,
        icone: 'fa-users',
        label: 'Todos os Utilizadores'
    }
};

// ============================================================
// STATUS CONFIGURATION
// ============================================================
const STATUS_CONFIG = {
    'aguardando validacao': { cor: 'var(--orange)', icone: 'fa-clock', label: 'Aguardando' },
    'aprovado': { cor: 'var(--green)', icone: 'fa-check-circle', label: 'Aprovado' },
    'removido': { cor: 'var(--red)', icone: 'fa-ban', label: 'Removido' },
    'negociacao': { cor: 'var(--blue)', icone: 'fa-handshake', label: 'Negociação' },
    'fechado': { cor: 'var(--text-dim)', icone: 'fa-times-circle', label: 'Fechado' }
};

// ============================================================
// FUNÇÃO DE NORMALIZAÇÃO DE DADOS DO UTILIZADOR
// ============================================================
function normalizarUser(user) {
    if (!user) return {};
    
    return {
        ...user,
        id: user.id || user.ID || '',
        nome: user.nome || user['Nome do Usuário'] || user.NOME || '',
        email: user.email || user.Email || user.EMAIL || '',
        telefone: user.telefone || user['Número de Telefone'] || user.TELEFONE || '-',
        regiao: user.regiao || user.Região || user.REGIAO || '-',
        status: user.status || user.Status || user.STATUS || '',
        funcao: user.funcao || user.Função || user.FUNCAO || '-',
        valorPago: user.valorPago || user['Valor Pago'] || user.VALOR_PAGO || '-',
        turma: user.turma || user.Turma || user.TURMA || '-',
        instituicao: user.instituicao || user['Instituição Associada'] || user.INSTITUICAO || '-',
        descricao: user.descricao || user.Descrição || user.DESCRICAO || '-',
        senha: user.senha || user.Senha || user.SENHA || '',
        dataRegistro: user.dataRegistro || user['Data de Registro'] || user.DATA_REGISTRO || '',
        dataExpiracao: user.dataExpiracao || user['Data Para Expirar o Acesso'] || user.DATA_EXPIRACAO || 'Permanente',
        dataNascimento: user.dataNascimento || user['Data de Nascimento'] || '-',
        sexo: user.sexo || user.Sexo || '-',
        pais: user.pais || user.País || 'Angola',
        tipo: user.tipo || user['Tipo de Usuario'] || user.aba || '-',
        aba: user.aba || ''
    };
}

// ============================================================
// SECÇÃO 2 — CLASSE AdminPanel
// ============================================================

class AdminPanel {
    constructor() {
        this.adminInfo = null;
        this.secaoActiva = 'dashboard';
        this.dadosCache = new Map();
        this.estadoFiltros = {};
        this.paginacao = {};
        this.timerInactividade = null;
        this.timerAviso = null;
        this.timerDisplay = null;
        this.TEMPO_MAX = 120000;
        this.TEMPO_AVISO = 90000;
        this.ultimaAtividade = Date.now();
        this.aguardandoConfirmacao = null;
        this.logsLogin = [];
        
        this.init();
    }
    
    // ============================================================
    // 2.1 INICIALIZAÇÃO
    // ============================================================
    async init() {
        if (!this.verificarAcesso()) return;
        
        this.carregarInfoAdmin();
        this.carregarLogsPersistidos();
        this.registarLogLogin();
        this.iniciarTimerSessao();
        this.attachEventosGlobais();
        this.iniciarTimerDisplay();
        
        await this.navegarPara('dashboard');
    }
    
    verificarAcesso() {
        const logado = sessionStorage.getItem('teca_logado');
        const tipo = sessionStorage.getItem('teca_tipo');
        
        if (logado !== 'true' || tipo !== 'Administrador') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
    
    carregarInfoAdmin() {
        const usuarioStr = sessionStorage.getItem('teca_utilizador');
        if (usuarioStr) {
            this.adminInfo = JSON.parse(usuarioStr);
            const nomeEl = document.getElementById('adm-admin-nome');
            if (nomeEl) nomeEl.textContent = this.adminInfo.nome || 'Administrador';
        }
    }
    
    carregarLogsPersistidos() {
        try {
            const logsSalvos = sessionStorage.getItem('teca_logs');
            if (logsSalvos) {
                this.logsLogin = JSON.parse(logsSalvos);
            }
        } catch (e) {
            console.error('Erro ao carregar logs:', e);
        }
    }
    
    registarLogLogin() {
        this.registarLog({
            tipo: 'success',
            acao: 'LOGIN',
            utilizador: this.adminInfo?.nome || 'Administrador',
            tipoUtilizador: 'Administrador',
            detalhes: `Sessão iniciada — ${new Date().toLocaleString('pt-PT')}`
        });
    }
    
    registarLog(dadosLog) {
        const log = {
            timestamp: new Date().toLocaleString('pt-PT'),
            ...dadosLog
        };
        this.logsLogin.unshift(log);
        
        if (this.logsLogin.length > 200) this.logsLogin.pop();
        
        try {
            sessionStorage.setItem('teca_logs', JSON.stringify(this.logsLogin.slice(0, 50)));
        } catch (e) {}
    }
    
    // ============================================================
    // 2.2 CONTROLE DE SESSÃO
    // ============================================================
    iniciarTimerSessao() {
        this.resetarTimer();
        
        const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        eventos.forEach(evento => {
            document.addEventListener(evento, () => this.resetarTimer());
        });
    }
    
    resetarTimer() {
        this.ultimaAtividade = Date.now();
        
        if (this.timerAviso) clearTimeout(this.timerAviso);
        if (this.timerInactividade) clearTimeout(this.timerInactividade);
        
        this.timerAviso = setTimeout(() => this.mostrarAvisoSessao(), this.TEMPO_AVISO);
        this.timerInactividade = setTimeout(() => this.logoutAutomatico(), this.TEMPO_MAX);
    }
    
    iniciarTimerDisplay() {
        if (this.timerDisplay) clearInterval(this.timerDisplay);
        
        this.timerDisplay = setInterval(() => {
            this.atualizarTimerDisplay();
        }, 1000);
    }
    
    atualizarTimerDisplay() {
        const tempoDecorrido = Date.now() - this.ultimaAtividade;
        const tempoRestante = Math.max(0, this.TEMPO_MAX - tempoDecorrido);
        const segundosRestantes = Math.ceil(tempoRestante / 1000);
        const minutos = Math.floor(segundosRestantes / 60);
        const segundos = segundosRestantes % 60;
        const display = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('adm-timer-display');
        const topbarTimer = document.getElementById('adm-topbar-timer');
        if (timerDisplay) timerDisplay.textContent = display;
        if (topbarTimer) topbarTimer.textContent = display;
    }
    
    mostrarAvisoSessao() {
        let tempoRestante = 30;
        const modal = document.getElementById('adm-modal-sessao');
        const timerSpan = document.getElementById('adm-tempo-restante');
        
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        const interval = setInterval(() => {
            tempoRestante--;
            if (timerSpan) timerSpan.textContent = tempoRestante;
            
            if (tempoRestante <= 0) {
                clearInterval(interval);
                modal.style.display = 'none';
            }
        }, 1000);
        
        const continuarBtn = document.getElementById('adm-continuar-sessao');
        const continuarHandler = () => {
            clearInterval(interval);
            modal.style.display = 'none';
            this.resetarTimer();
            continuarBtn.removeEventListener('click', continuarHandler);
        };
        continuarBtn.addEventListener('click', continuarHandler);
    }
    
    logoutAutomatico() {
        this.mostrarToast('Sessão expirada por inatividade. Faça login novamente.', 'aviso');
        this.logout();
    }
    
    logout() {
        if (this.timerInactividade) clearTimeout(this.timerInactividade);
        if (this.timerAviso) clearTimeout(this.timerAviso);
        if (this.timerDisplay) clearInterval(this.timerDisplay);
        
        this.registarLog({
            tipo: 'info',
            acao: 'LOGOUT',
            utilizador: this.adminInfo?.nome || 'Administrador',
            tipoUtilizador: 'Administrador',
            detalhes: 'Sessão encerrada'
        });
        
        sessionStorage.removeItem('teca_logado');
        sessionStorage.removeItem('teca_utilizador');
        sessionStorage.removeItem('teca_tipo');
        window.location.href = 'index.html';
    }
    
    // ============================================================
    // 2.3 EVENTOS GLOBAIS
    // ============================================================
    attachEventosGlobais() {
        document.getElementById('adm-logout-btn')?.addEventListener('click', () => this.logout());
        
        document.querySelectorAll('.adm-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const secao = btn.dataset.secao;
                if (secao) this.navegarPara(secao);
            });
        });
        
        const menuToggle = document.getElementById('adm-menu-toggle');
        const sidebar = document.getElementById('adm-sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('adm-sidebar-mobile-open');
            });
        }
        
        document.querySelectorAll('.adm-btn-refresh').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                if (aba === 'todos') {
                    this.carregarTodos(true);
                } else if (aba) {
                    const config = Object.values(MAPA_ABAS).find(c => c.nomeAba === aba || c.idHTML === aba);
                    if (config) this.carregarDadosSecao(config.idHTML, true);
                }
            });
        });
        
        document.querySelectorAll('.adm-btn-export').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                if (aba) {
                    const config = Object.values(MAPA_ABAS).find(c => c.nomeAba === aba || c.idHTML === aba);
                    if (config) this.exportarCSV(config.idHTML);
                }
            });
        });
        
        document.querySelectorAll('.adm-btn-clear').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                if (aba) {
                    const config = Object.values(MAPA_ABAS).find(c => c.nomeAba === aba || c.idHTML === aba);
                    if (config) this.limparFiltros(config.idHTML);
                }
            });
        });
        
        // Inputs de busca com debounce
        const idsBusca = ['parceiros', 'simuladores', 'cursos', 'formacao', 'servicos', 'naopagos', 'todos'];
        idsBusca.forEach(id => {
            const input = document.getElementById(`adm-search-${id}`);
            if (input) {
                let debounceTimeout;
                input.addEventListener('input', (e) => {
                    clearTimeout(debounceTimeout);
                    debounceTimeout = setTimeout(() => {
                        this.estadoFiltros[id] = this.estadoFiltros[id] || {};
                        this.estadoFiltros[id].texto = e.target.value;
                        this.aplicarFiltros(id);
                    }, 300);
                });
            }
        });
        
        // Filtros de região e status para cada aba
        Object.keys(MAPA_ABAS).forEach(idHTML => {
            if (idHTML === 'dashboard') return;
            
            const regiaoSelect = document.getElementById(`adm-filtro-regiao-${idHTML}`);
            if (regiaoSelect) {
                regiaoSelect.addEventListener('change', () => {
                    this.estadoFiltros[idHTML] = this.estadoFiltros[idHTML] || {};
                    this.estadoFiltros[idHTML].regiao = regiaoSelect.value;
                    this.aplicarFiltros(idHTML);
                });
            }
            
            const statusSelect = document.getElementById(`adm-filtro-status-${idHTML}`);
            if (statusSelect && MAPA_ABAS[idHTML].temStatus) {
                statusSelect.addEventListener('change', () => {
                    this.estadoFiltros[idHTML] = this.estadoFiltros[idHTML] || {};
                    this.estadoFiltros[idHTML].status = statusSelect.value;
                    this.aplicarFiltros(idHTML);
                });
            }
        });
        
        // Filtros especiais para a aba "todos"
        const tipoSelect = document.getElementById('adm-filtro-tipo-todos');
        if (tipoSelect) {
            tipoSelect.addEventListener('change', () => {
                this.estadoFiltros.todos = this.estadoFiltros.todos || {};
                this.estadoFiltros.todos.tipo = tipoSelect.value;
                this.aplicarFiltros('todos');
            });
        }
        
        const abaSelect = document.getElementById('adm-filtro-aba-todos');
        if (abaSelect) {
            abaSelect.addEventListener('change', () => {
                this.estadoFiltros.todos = this.estadoFiltros.todos || {};
                this.estadoFiltros.todos.aba = abaSelect.value;
                this.aplicarFiltros('todos');
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('adm-modal')) {
                e.target.style.display = 'none';
            }
        });
        
        document.getElementById('adm-confirm-cancelar')?.addEventListener('click', () => {
            document.getElementById('adm-modal-confirmacao').style.display = 'none';
            this.aguardandoConfirmacao = null;
        });
        
        document.getElementById('adm-confirm-ok')?.addEventListener('click', () => {
            if (this.aguardandoConfirmacao) {
                this.aguardandoConfirmacao.executar();
                this.aguardandoConfirmacao = null;
            }
            document.getElementById('adm-modal-confirmacao').style.display = 'none';
        });
    }
    
    // ============================================================
    // 2.4 NAVEGAÇÃO
    // ============================================================
    async navegarPara(secao) {
        this.secaoActiva = secao;
        
        document.querySelectorAll('.adm-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.secao === secao);
        });
        
        document.querySelectorAll('.adm-secao').forEach(view => {
            view.classList.remove('active');
        });
        
        const viewAtiva = document.getElementById(`adm-secao-${secao}`);
        if (viewAtiva) viewAtiva.classList.add('active');
        
        const sidebar = document.getElementById('adm-sidebar');
        if (sidebar) sidebar.classList.remove('adm-sidebar-mobile-open');
        
        if (secao === 'dashboard') {
            await this.carregarDashboard();
        } else if (MAPA_ABAS[secao]) {
            await this.carregarDadosSecao(secao);
        }
    }
    
    // ============================================================
    // 2.5 COMUNICAÇÃO COM BACKEND
    // ============================================================
    async chamarBackendGet(params) {
        const url = new URL(APPS_SCRIPT_URL);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
            const resposta = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal,
                redirect: 'follow'
            });
            clearTimeout(timeoutId);
            
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            const dados = await resposta.json();
            
            this.registarLog({
                tipo: 'info',
                acao: 'DADOS_CARREGADOS',
                utilizador: this.adminInfo?.nome || 'Sistema',
                tipoUtilizador: 'Sistema',
                detalhes: `GET ${JSON.stringify(params)} — Sucesso`
            });
            
            return dados;
        } catch (erro) {
            clearTimeout(timeoutId);
            console.error('Erro GET:', erro);
            
            this.registarLog({
                tipo: 'error',
                acao: 'ERRO_API',
                utilizador: this.adminInfo?.nome || 'Sistema',
                tipoUtilizador: 'Sistema',
                detalhes: `GET ${JSON.stringify(params)} — ${erro.message}`
            });
            
            return { status: 'error', mensagem: 'Erro de conexão com o servidor' };
        }
    }
    
    async chamarBackendPost(payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
            const resposta = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                signal: controller.signal,
                redirect: 'follow'
            });
            clearTimeout(timeoutId);
            
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            const dados = await resposta.json();
            
            this.registarLog({
                tipo: dados.status === 'success' ? 'success' : 'error',
                acao: payload.acao.toUpperCase(),
                utilizador: this.adminInfo?.nome || 'Sistema',
                tipoUtilizador: 'Administrador',
                detalhes: `${payload.acao} — ${dados.mensagem || 'Executado'}`
            });
            
            return dados;
        } catch (erro) {
            clearTimeout(timeoutId);
            console.error('Erro POST:', erro);
            
            this.registarLog({
                tipo: 'error',
                acao: 'ERRO_API',
                utilizador: this.adminInfo?.nome || 'Sistema',
                tipoUtilizador: 'Sistema',
                detalhes: `POST ${payload.acao} — ${erro.message}`
            });
            
            return { status: 'error', mensagem: 'Erro de conexão com o servidor' };
        }
    }
    
    // ============================================================
    // 2.6 DASHBOARD
    // ============================================================
    async carregarDashboard() {
        try {
            const resultado = await this.chamarBackendGet({ acao: 'listar' });
            if (resultado.status === 'success' && resultado.dados) {
                const dadosNormalizados = resultado.dados.map(normalizarUser);
                this.calcularEstatisticas(dadosNormalizados);
                this.renderizarUltimosCadastros(dadosNormalizados);
                this.renderizarGraficoBarras(dadosNormalizados);
            } else {
                this.mostrarToast('Erro ao carregar dashboard', 'erro');
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            this.mostrarToast('Erro ao carregar dashboard', 'erro');
        }
    }
    
    calcularEstatisticas(dados) {
        const stats = {
            total: 0,
            parceiros: 0,
            simuladores: 0,
            cursos: 0,
            formacao: 0,
            servicos: 0,
            naopagos: 0,
            aguardando: 0,
            porStatus: {},
            porRegiao: {},
            ultimos30Dias: 0,
            expirados: 0,
            aExpirar30Dias: 0
        };
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        const trintaDiasFrente = new Date();
        trintaDiasFrente.setDate(hoje.getDate() + 30);
        
        dados.forEach(user => {
            if (user.aba !== 'Administrador') {
                stats.total++;
                
                switch(user.aba) {
                    case 'Parceiros': stats.parceiros++; break;
                    case 'Simuladores-Bibliotecas': stats.simuladores++; break;
                    case 'Cursos Online': stats.cursos++; break;
                    case 'Formação Presencial': stats.formacao++; break;
                    case 'Serviços Personalizados': stats.servicos++; break;
                    case 'Usuários Não Pagos': stats.naopagos++; break;
                }
                
                if (user.status === 'aguardando validacao') stats.aguardando++;
                if (user.status) stats.porStatus[user.status] = (stats.porStatus[user.status] || 0) + 1;
                if (user.regiao && user.regiao !== '-') stats.porRegiao[user.regiao] = (stats.porRegiao[user.regiao] || 0) + 1;
                
                if (user.dataRegistro) {
                    const dataReg = this.parseData(user.dataRegistro);
                    if (dataReg && dataReg >= trintaDiasAtras) stats.ultimos30Dias++;
                }
                
                if (user.dataExpiracao && user.dataExpiracao !== 'Permanente') {
                    const dataExp = this.parseData(user.dataExpiracao);
                    if (dataExp) {
                        if (dataExp < hoje) stats.expirados++;
                        else if (dataExp <= trintaDiasFrente) stats.aExpirar30Dias++;
                    }
                }
            }
        });
        
        this.renderizarCards(stats);
    }
    
    parseData(dataStr) {
        if (!dataStr) return null;
        if (dataStr.includes('/')) {
            const partes = dataStr.split('/');
            if (partes.length === 3) {
                return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
            }
        }
        const d = new Date(dataStr);
        return isNaN(d.getTime()) ? null : d;
    }
    
    renderizarCards(stats) {
        const grid = document.getElementById('adm-stats-grid');
        if (!grid) return;
        
        const cards = [
            { valor: stats.total, label: 'Total de Utilizadores', icone: 'fa-users', cor: 'gold', secao: 'todos' },
            { valor: stats.parceiros, label: 'Parceiros', icone: 'fa-handshake', cor: 'gold', secao: 'parceiros' },
            { valor: stats.aguardando, label: 'Aguardando Validação', icone: 'fa-clock', cor: 'gold', secao: 'parceiros' },
            { valor: stats.simuladores, label: 'Simuladores e Biblioteca', icone: 'fa-calculator', cor: 'blue', secao: 'simuladores' },
            { valor: stats.cursos, label: 'Cursos Online', icone: 'fa-video', cor: 'blue', secao: 'cursos' },
            { valor: stats.formacao, label: 'Formação Presencial', icone: 'fa-chalkboard-teacher', cor: 'blue', secao: 'formacao' },
            { valor: stats.servicos, label: 'Serviços Personalizados', icone: 'fa-concierge-bell', cor: 'blue', secao: 'servicos' },
            { valor: stats.naopagos, label: 'Usuários Não Pagos', icone: 'fa-user-slash', cor: 'red', secao: 'naopagos' }
        ];
        
        grid.innerHTML = cards.map(card => `
            <div class="adm-stat-card adm-stat-card-${card.cor}" data-secao="${card.secao}">
                <div class="adm-stat-icon"><i class="fas ${card.icone}"></i></div>
                <div class="adm-stat-info">
                    <h3>${card.valor}</h3>
                    <p>${card.label}</p>
                </div>
            </div>
        `).join('');
        
        grid.querySelectorAll('.adm-stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const secao = card.dataset.secao;
                if (secao) this.navegarPara(secao);
            });
        });
    }
    
    renderizarGraficoBarras(dados) {
        const container = document.getElementById('adm-grafico-barras');
        if (!container) return;
        
        const categorias = {
            'Parceiros': 0,
            'Simuladores-Bibliotecas': 0,
            'Cursos Online': 0,
            'Formação Presencial': 0,
            'Serviços Personalizados': 0,
            'Usuários Não Pagos': 0
        };
        
        dados.forEach(user => {
            if (categorias[user.aba] !== undefined) categorias[user.aba]++;
        });
        
        const total = Object.values(categorias).reduce((a, b) => a + b, 0);
        const maxValor = Math.max(...Object.values(categorias), 1);
        
        container.innerHTML = `
            <div class="adm-grafico-container">
                ${Object.entries(categorias).map(([categoria, valor]) => {
                    const percentual = total > 0 ? (valor / total * 100).toFixed(1) : 0;
                    const altura = maxValor > 0 ? (valor / maxValor * 100) : 0;
                    return `
                        <div class="adm-grafico-bar">
                            <div class="adm-grafico-label">${categoria}</div>
                            <div class="adm-grafico-bar-container">
                                <div class="adm-grafico-bar-fill" style="height: ${altura}px; width: 40px;"></div>
                            </div>
                            <div class="adm-grafico-valor">${valor} (${percentual}%)</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    renderizarUltimosCadastros(dados) {
        const tbody = document.getElementById('adm-ultimos-body');
        if (!tbody) return;
        
        const recentes = [...dados]
            .filter(u => u.aba !== 'Administrador')
            .sort((a, b) => (b.dataRegistro || '').localeCompare(a.dataRegistro || ''))
            .slice(0, 10);
        
        if (recentes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="adm-text-center">Nenhum registro encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = recentes.map(user => `
            <tr>
                <td>${user.id || '-'}</td>
                <td>${this.escapeHtml(user.nome || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${user.tipo || user.aba || '-'}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
            </tr>
        `).join('');
    }
    
    // ============================================================
    // 2.7 CARREGAMENTO DE DADOS POR SECÇÃO
    // ============================================================
    async carregarDadosSecao(idHTML, forceReload = false) {
        const config = MAPA_ABAS[idHTML];
        if (!config || !config.nomeAba) {
            if (idHTML === 'todos') return this.carregarTodos(forceReload);
            return;
        }
        
        const cacheKey = config.cacheKey;
        const agora = Date.now();
        
        if (!forceReload && this.dadosCache.has(cacheKey)) {
            const cached = this.dadosCache.get(cacheKey);
            if (agora - cached.timestamp < 60000) {
                this.dadosFiltrados = cached.dados;
                this.renderizarTabela(idHTML, cached.dados);
                this.inicializarFiltros(idHTML, cached.dados);
                return;
            }
        }
        
        this.mostrarSkeleton(idHTML);
        
        try {
            const resultado = await this.chamarBackendGet({ acao: 'listar', aba: config.nomeAba });
            if (resultado.status === 'success' && resultado.dados) {
                const dadosNormalizados = resultado.dados.map(normalizarUser);
                this.dadosCache.set(cacheKey, {
                    dados: dadosNormalizados,
                    timestamp: agora
                });
                this.dadosFiltrados = dadosNormalizados;
                this.renderizarTabela(idHTML, dadosNormalizados);
                this.inicializarFiltros(idHTML, dadosNormalizados);
            } else {
                this.mostrarToast(`Erro ao carregar ${config.label}`, 'erro');
                this.renderizarTabela(idHTML, []);
            }
        } catch (error) {
            console.error(`Erro ao carregar ${idHTML}:`, error);
            this.mostrarToast(`Erro ao carregar ${config.label}`, 'erro');
            this.renderizarTabela(idHTML, []);
        }
    }
    
    async carregarTodos(forceReload = false) {
        const cacheKey = MAPA_ABAS.todos.cacheKey;
        const agora = Date.now();
        
        if (!forceReload && this.dadosCache.has(cacheKey)) {
            const cached = this.dadosCache.get(cacheKey);
            if (agora - cached.timestamp < 60000) {
                this.dadosFiltrados = cached.dados;
                this.renderizarTabela('todos', cached.dados);
                this.inicializarFiltros('todos', cached.dados);
                return;
            }
        }
        
        this.mostrarSkeleton('todos');
        
        try {
            const resultado = await this.chamarBackendGet({ acao: 'listar' });
            if (resultado.status === 'success' && resultado.dados) {
                const dadosFiltrados = resultado.dados.filter(u => u.aba !== 'Administrador').map(normalizarUser);
                this.dadosCache.set(cacheKey, {
                    dados: dadosFiltrados,
                    timestamp: agora
                });
                this.dadosFiltrados = dadosFiltrados;
                this.renderizarTabela('todos', dadosFiltrados);
                this.inicializarFiltros('todos', dadosFiltrados);
                
                const abasUnicas = [...new Set(dadosFiltrados.map(u => u.aba))];
                const abaSelect = document.getElementById('adm-filtro-aba-todos');
                if (abaSelect) {
                    abaSelect.innerHTML = '<option value="">Todas as planilhas</option>' + 
                        abasUnicas.map(aba => `<option value="${aba}">${aba}</option>`).join('');
                }
            } else {
                this.mostrarToast('Erro ao carregar todos os utilizadores', 'erro');
                this.renderizarTabela('todos', []);
            }
        } catch (error) {
            console.error('Erro ao carregar todos:', error);
            this.mostrarToast('Erro ao carregar todos os utilizadores', 'erro');
            this.renderizarTabela('todos', []);
        }
    }
    
    // ============================================================
    // 2.8 RENDERIZAÇÃO DE TABELAS (CORRIGIDA)
    // ============================================================
    renderizarTabela(idHTML, dados) {
        const config = MAPA_ABAS[idHTML];
        if (!config) return;
        
        const tbody = document.getElementById(`adm-table-body-${config.idHTML}`);
        const contadorSpan = document.getElementById(`adm-contador-${config.idHTML}`);
        
        if (!tbody) return;
        
        if (!dados || dados.length === 0) {
            tbody.innerHTML = '}<tr><td colspan="10" class="adm-text-center">Nenhum registro encontrado</td></tr>';
            if (contadorSpan) contadorSpan.textContent = '0';
            return;
        }
        
        const registrosPorPagina = 20;
        const paginaActual = this.paginacao[idHTML]?.pagina || 1;
        const inicio = (paginaActual - 1) * registrosPorPagina;
        const paginados = dados.slice(inicio, inicio + registrosPorPagina);
        
        if (contadorSpan) contadorSpan.textContent = dados.length;
        
        tbody.innerHTML = paginados.map(user => this.renderizarLinhaTabela(user, idHTML)).join('');
        this.renderizarPaginacao(idHTML, dados.length, registrosPorPagina, paginaActual);
    }
    
    renderizarLinhaTabela(user, idHTML) {
        const config = MAPA_ABAS[idHTML];
        if (!config) return '';
        
        const statusBadge = config.temStatus ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>';
        const acoes = this.renderizarAcoes(user, idHTML);
        
        const nome = this.escapeHtml(user.nome || '-');
        const email = this.escapeHtml(user.email || '-');
        const telefone = user.telefone || '-';
        const regiao = user.regiao || '-';
        const dataRegistro = this.formatarData(user.dataRegistro);
        const dataExpiracao = user.dataExpiracao || 'Permanente';
        
        const colunasBase = `
            <td>${user.id || '-'}</td>
            <td>${nome}</td>
            <td>${email}</td>
            <td>${telefone}</td>
            <td>${regiao}</td>
        `;
        
        switch(idHTML) {
            case 'parceiros':
                return `<tr>${colunasBase}<td>${user.funcao || '-'}</td><td>${statusBadge}</td><td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            case 'simuladores':
                return `<tr>${colunasBase}<td>${user.valorPago || '-'}</td><td>${statusBadge}</td><td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            case 'cursos':
                return `<tr>${colunasBase}<td>${user.turma || '-'}</td><td>${user.valorPago || '-'}</td><td>${statusBadge}</td><td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            case 'formacao':
                return `<tr>${colunasBase}<td>${user.instituicao || '-'}</td><td>${user.turma || '-'}</td><td>${user.valorPago || '-'}</td><td>${statusBadge}</td><td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            case 'servicos':
                return `<tr><td>${user.id || '-'}</td><td>${nome}</td><td>${email}</td><td>${telefone}</td><td title="${user.valorPago}">${this.truncarTexto(user.valorPago || '-', 30)}</td><td title="${user.descricao}">${this.truncarTexto(user.descricao || '-', 40)}</td><td>${statusBadge}</td><td>${dataRegistro}</td>${acoes}</tr>`;
            case 'naopagos':
                return `<tr>${colunasBase}<td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            case 'todos':
                return `<tr><td>${user.id || '-'}</td><td>${nome}</td><td>${email}</td><td>${telefone}</td><td>${regiao}</td><td>${user.tipo || user.aba || '-'}</td><td>${user.aba || '-'}</td><td>${user.status ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>'}</td><td>${dataRegistro}</td><td>${dataExpiracao}</td>${acoes}</tr>`;
            default:
                return `<tr>${colunasBase}<td colspan="4">${statusBadge}${acoes}</td></tr>`;
        }
    }
    
    renderizarStatusBadge(status) {
        const config = STATUS_CONFIG[status] || { cor: 'var(--text-dim)', icone: 'fa-question', label: status || 'Desconhecido' };
        return `<span class="adm-badge" style="background: ${config.cor}20; color: ${config.cor}; border-color: ${config.cor}40;">
            <i class="fas ${config.icone}"></i> ${config.label}
        </span>`;
    }
    
    renderizarAcoes(user, idHTML) {
        const config = MAPA_ABAS[idHTML];
        if (!config) return '<td class="adm-actions"></td>';
        
        const isServicos = idHTML === 'servicos';
        const isNaoPagos = idHTML === 'naopagos';
        const isParceiros = idHTML === 'parceiros';
        
        let botoes = `<button class="adm-btn-icon adm-btn-view" onclick="adminPanel.abrirModalDetalhes('${user.id}', '${idHTML}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>`;
        
        if (isParceiros && user.status !== 'aprovado') {
            botoes += `<button class="adm-btn-icon adm-btn-approve" onclick="adminPanel.aprovarUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}')" title="Aprovar"><i class="fas fa-check-circle"></i></button>`;
        }
        
        if (!isNaoPagos && config.temStatus && user.status !== 'removido') {
            botoes += `<button class="adm-btn-icon adm-btn-block" onclick="adminPanel.bloquearUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}')" title="Bloquear"><i class="fas fa-ban"></i></button>`;
        }
        
        if (!isServicos && !isNaoPagos) {
            botoes += `<button class="adm-btn-icon adm-btn-renew" onclick="adminPanel.renovarAcesso('${user.email}', '${idHTML}')" title="Renovar acesso"><i class="fas fa-sync-alt"></i></button>`;
        }
        
        botoes += `<button class="adm-btn-icon adm-btn-delete" onclick="adminPanel.removerUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}')" title="Remover"><i class="fas fa-trash-alt"></i></button>`;
        
        return `<td class="adm-actions">${botoes}</td>`;
    }
    
    renderizarPaginacao(idHTML, total, porPagina, paginaActual) {
        const totalPaginas = Math.ceil(total / porPagina);
        const container = document.getElementById(`adm-paginacao-${idHTML}`);
        if (!container) return;
        
        if (totalPaginas <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div class="adm-paginacao-controls">';
        html += `<button class="adm-pag-btn" data-pag="${paginaActual - 1}" ${paginaActual === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Anterior</button>`;
        
        for (let i = 1; i <= Math.min(totalPaginas, 5); i++) {
            html += `<button class="adm-pag-btn ${i === paginaActual ? 'active' : ''}" data-pag="${i}">${i}</button>`;
        }
        
        if (totalPaginas > 5) {
            html += `<span>...</span>`;
            html += `<button class="adm-pag-btn" data-pag="${totalPaginas}">${totalPaginas}</button>`;
        }
        
        html += `<button class="adm-pag-btn" data-pag="${paginaActual + 1}" ${paginaActual === totalPaginas ? 'disabled' : ''}>Seguinte <i class="fas fa-chevron-right"></i></button>`;
        html += '</div>';
        
        container.innerHTML = html;
        
        container.querySelectorAll('.adm-pag-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    const novaPagina = parseInt(btn.dataset.pag);
                    if (!isNaN(novaPagina)) {
                        this.paginacao[idHTML] = this.paginacao[idHTML] || {};
                        this.paginacao[idHTML].pagina = novaPagina;
                        this.aplicarFiltros(idHTML);
                    }
                });
            }
        });
    }
    
    mostrarSkeleton(idHTML) {
        const tbody = document.getElementById(`adm-table-body-${idHTML}`);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="adm-text-center"><div class="adm-skeleton"></div> Carregando...</td></tr>';
        }
    }
    
    // ============================================================
    // 2.9 FILTROS E BUSCA
    // ============================================================
    inicializarFiltros(idHTML, dados) {
        const regioesUnicas = [...new Set(dados.map(u => u.regiao).filter(r => r && r !== '-'))];
        const statusUnicos = [...new Set(dados.map(u => u.status).filter(s => s))];
        
        const regiaoSelect = document.getElementById(`adm-filtro-regiao-${idHTML}`);
        if (regiaoSelect) {
            regiaoSelect.innerHTML = '<option value="">Todas as regiões</option>' + 
                regioesUnicas.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        
        const statusSelect = document.getElementById(`adm-filtro-status-${idHTML}`);
        if (statusSelect && MAPA_ABAS[idHTML]?.temStatus) {
            statusSelect.innerHTML = '<option value="">Todos os status</option>' + 
                statusUnicos.map(s => `<option value="${s}">${STATUS_CONFIG[s]?.label || s}</option>`).join('');
        }
    }
    
    aplicarFiltros(idHTML) {
        const config = MAPA_ABAS[idHTML];
        if (!config) return;
        
        const cacheKey = config.cacheKey;
        const cached = this.dadosCache.get(cacheKey);
        if (!cached) return;
        
        const filtros = this.estadoFiltros[idHTML] || {};
        let dadosFiltrados = [...cached.dados];
        
        if (filtros.texto) {
            const textoLower = filtros.texto.toLowerCase();
            dadosFiltrados = dadosFiltrados.filter(u => 
                (u.nome || '').toLowerCase().includes(textoLower) || 
                (u.email || '').toLowerCase().includes(textoLower)
            );
        }
        
        if (filtros.regiao) {
            dadosFiltrados = dadosFiltrados.filter(u => u.regiao === filtros.regiao);
        }
        
        if (filtros.status && config.temStatus) {
            dadosFiltrados = dadosFiltrados.filter(u => u.status === filtros.status);
        }
        
        if (idHTML === 'todos') {
            if (filtros.tipo) {
                dadosFiltrados = dadosFiltrados.filter(u => u.tipo === filtros.tipo);
            }
            if (filtros.aba) {
                dadosFiltrados = dadosFiltrados.filter(u => u.aba === filtros.aba);
            }
        }
        
        this.renderizarTabela(idHTML, dadosFiltrados);
        
        const contadorSpan = document.getElementById(`adm-contador-${idHTML}`);
        if (contadorSpan) contadorSpan.textContent = dadosFiltrados.length;
    }
    
    limparFiltros(idHTML) {
        this.estadoFiltros[idHTML] = {};
        
        const searchInput = document.getElementById(`adm-search-${idHTML}`);
        if (searchInput) searchInput.value = '';
        
        const regiaoSelect = document.getElementById(`adm-filtro-regiao-${idHTML}`);
        if (regiaoSelect) regiaoSelect.value = '';
        
        const statusSelect = document.getElementById(`adm-filtro-status-${idHTML}`);
        if (statusSelect) statusSelect.value = '';
        
        if (idHTML === 'todos') {
            const tipoSelect = document.getElementById('adm-filtro-tipo-todos');
            if (tipoSelect) tipoSelect.value = '';
            const abaSelect = document.getElementById('adm-filtro-aba-todos');
            if (abaSelect) abaSelect.value = '';
        }
        
        this.aplicarFiltros(idHTML);
    }
    
    // ============================================================
    // 2.10 MODAL DE DETALHES COM SENHA TOGGLE
    // ============================================================
    async abrirModalDetalhes(id, idHTML) {
        const modal = document.getElementById('adm-modal-detalhes');
        const conteudo = document.getElementById('adm-detalhes-conteudo');
        
        if (!modal || !conteudo) return;
        
        conteudo.innerHTML = '<div class="adm-detalhes-loading">Carregando dados...</div>';
        modal.style.display = 'flex';
        
        try {
            let user = null;
            const config = MAPA_ABAS[idHTML];
            const cacheKey = config?.cacheKey;
            
            if (cacheKey && this.dadosCache.has(cacheKey)) {
                const cached = this.dadosCache.get(cacheKey);
                user = cached.dados.find(u => u.id == id);
            }
            
            if (!user && config?.nomeAba) {
                const resultado = await this.chamarBackendGet({ acao: 'buscarUsuario', id: id, aba: config.nomeAba });
                if (resultado.status === 'success' && resultado.dados) {
                    user = normalizarUser(resultado.dados);
                }
            }
            
            if (user) {
                conteudo.innerHTML = this.renderizarDetalhesUsuario(user, idHTML);
            } else {
                conteudo.innerHTML = '<div class="adm-detalhes-erro">Utilizador não encontrado</div>';
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            conteudo.innerHTML = '<div class="adm-detalhes-erro">Erro ao carregar dados do utilizador</div>';
        }
    }
    
    renderizarDetalhesUsuario(user, idHTML) {
        const config = MAPA_ABAS[idHTML];
        
        const camposBase = [
            { label: 'ID', valor: user.id },
            { label: 'Nome', valor: user.nome },
            { label: 'Email', valor: user.email },
            { label: 'Telefone', valor: user.telefone },
            { label: 'Data de Nascimento', valor: user.dataNascimento },
            { label: 'Sexo', valor: user.sexo },
            { label: 'País', valor: user.pais },
            { label: 'Região', valor: user.regiao },
            { label: 'Tipo de Usuário', valor: user.tipo || user.aba || idHTML }
        ];
        
        const camposCondicionais = [];
        if (config?.temFuncao || idHTML === 'parceiros') camposCondicionais.push({ label: 'Função', valor: user.funcao });
        if (config?.temTurma || idHTML === 'cursos' || idHTML === 'formacao') camposCondicionais.push({ label: 'Turma', valor: user.turma });
        if (config?.temInstituicao || idHTML === 'formacao') camposCondicionais.push({ label: 'Instituição', valor: user.instituicao });
        if (config?.temValor || idHTML !== 'naopagos') camposCondicionais.push({ label: 'Valor Pago', valor: user.valorPago });
        if (user.descricao || idHTML === 'servicos') camposCondicionais.push({ label: 'Descrição', valor: user.descricao });
        
        const camposFinais = [
            ...camposBase,
            ...camposCondicionais,
            { label: 'Data de Registo', valor: this.formatarData(user.dataRegistro) },
            { label: 'Data de Expiração', valor: user.dataExpiracao || 'Permanente' }
        ];
        
        const senhaHtml = config?.temSenha && user.senha ? `
            <div class="adm-detalhes-campo adm-detalhes-senha">
                <label>Senha</label>
                <div class="adm-senha-wrapper">
                    <span id="adm-senha-valor" class="adm-senha-oculta">••••••••</span>
                    <button type="button" class="adm-toggle-senha" onclick="adminPanel.toggleSenha('${this.escapeHtml(user.senha)}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <small class="adm-senha-aviso">⚠️ Acesso restrito. Partilhar apenas após confirmação de identidade do utilizador.</small>
            </div>
        ` : '';
        
        return `
            <div class="adm-detalhes-grid">
                ${camposFinais.map(campo => `
                    <div class="adm-detalhes-campo">
                        <label>${campo.label}</label>
                        <span>${this.escapeHtml(campo.valor || '-')}</span>
                    </div>
                `).join('')}
                ${senhaHtml}
                <div class="adm-detalhes-campo adm-detalhes-status">
                    <label>Status</label>
                    ${this.renderizarStatusBadge(user.status)}
                </div>
            </div>
            <div class="adm-detalhes-acoes">
                ${this.renderizarAcoesDetalhes(user, idHTML)}
            </div>
        `;
    }
    
    toggleSenha(senhaReal) {
        const span = document.getElementById('adm-senha-valor');
        const btn = document.querySelector('.adm-toggle-senha i');
        
        if (!span || !btn) return;
        
        if (span.classList.contains('adm-senha-oculta')) {
            span.textContent = senhaReal;
            span.classList.remove('adm-senha-oculta');
            span.classList.add('adm-senha-visivel');
            btn.classList.remove('fa-eye');
            btn.classList.add('fa-eye-slash');
        } else {
            span.textContent = '••••••••';
            span.classList.remove('adm-senha-visivel');
            span.classList.add('adm-senha-oculta');
            btn.classList.remove('fa-eye-slash');
            btn.classList.add('fa-eye');
        }
    }
    
    renderizarAcoesDetalhes(user, idHTML) {
        const isParceiros = idHTML === 'parceiros';
        const isServicos = idHTML === 'servicos';
        const isNaoPagos = idHTML === 'naopagos';
        
        let html = '';
        
        if (isParceiros && user.status !== 'aprovado') {
            html += `<button class="adm-btn adm-btn-success" onclick="adminPanel.aprovarUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Aprovar Parceiro</button>`;
        }
        
        if (!isNaoPagos && user.status !== 'removido') {
            html += `<button class="adm-btn adm-btn-warning" onclick="adminPanel.bloquearUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Bloquear Acesso</button>`;
        }
        
        if (!isServicos && !isNaoPagos) {
            html += `<button class="adm-btn adm-btn-primary" onclick="adminPanel.renovarAcesso('${user.email}', '${idHTML}'); adminPanel.fecharModal('adm-modal-detalhes')">Renovar Acesso</button>`;
        }
        
        if (isServicos && user.status !== 'negociacao' && user.status !== 'fechado') {
            html += `<button class="adm-btn adm-btn-info" onclick="adminPanel.mudarStatus('${user.id}', '${idHTML}', 'negociacao', '${this.escapeHtml(user.nome)}')">Marcar como Negociação</button>`;
        }
        
        if (isServicos && user.status !== 'fechado') {
            html += `<button class="adm-btn adm-btn-secondary" onclick="adminPanel.mudarStatus('${user.id}', '${idHTML}', 'fechado', '${this.escapeHtml(user.nome)}')">Marcar como Fechado</button>`;
        }
        
        html += `<button class="adm-btn adm-btn-danger" onclick="adminPanel.removerUtilizador('${user.id}', '${idHTML}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Remover Utilizador</button>`;
        
        return html;
    }
    
    // ============================================================
    // 2.11 AÇÕES SOBRE UTILIZADORES
    // ============================================================
    confirmarAcao(titulo, mensagem, callback) {
        const tituloEl = document.getElementById('adm-confirm-titulo');
        const mensagemEl = document.getElementById('adm-confirm-mensagem');
        if (tituloEl) tituloEl.textContent = titulo;
        if (mensagemEl) mensagemEl.textContent = mensagem;
        
        this.aguardandoConfirmacao = { executar: callback };
        const modal = document.getElementById('adm-modal-confirmacao');
        if (modal) modal.style.display = 'flex';
    }
    
    async aprovarUtilizador(id, idHTML, nome) {
        this.confirmarAcao('Aprovar Utilizador', `Tens a certeza que pretendes APROVAR o utilizador "${nome}"?`, async () => {
            const config = MAPA_ABAS[idHTML];
            let payload;
            
            if (idHTML === 'parceiros') {
                payload = { acao: 'aprovar', id: id };
            } else if (idHTML === 'servicos') {
                payload = { acao: 'atualizarStatus', id: id, aba: config.nomeAba, novoStatus: 'fechado' };
            } else {
                payload = { acao: 'atualizarStatus', id: id, aba: config.nomeAba, novoStatus: 'aprovado' };
            }
            
            const resultado = await this.chamarBackendPost(payload);
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} aprovado com sucesso!`, 'sucesso');
                this.invalidarCache(idHTML);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao aprovar ${nome}: ${resultado.mensagem || 'Erro desconhecido'}`, 'erro');
            }
        });
    }
    
    async bloquearUtilizador(id, idHTML, nome) {
        this.confirmarAcao('Bloquear Utilizador', `Tens a certeza que pretendes BLOQUEAR o utilizador "${nome}"? O acesso será revogado.`, async () => {
            const config = MAPA_ABAS[idHTML];
            const resultado = await this.chamarBackendPost({ acao: 'atualizarStatus', id: id, aba: config.nomeAba, novoStatus: 'removido' });
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} bloqueado com sucesso!`, 'sucesso');
                this.invalidarCache(idHTML);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao bloquear ${nome}`, 'erro');
            }
        });
    }
    
    async removerUtilizador(id, idHTML, nome) {
        this.confirmarAcao('Remover Utilizador', `Tens a certeza que pretendes REMOVER o utilizador "${nome}"? Esta acção não pode ser desfeita.`, async () => {
            const config = MAPA_ABAS[idHTML];
            const resultado = await this.chamarBackendPost({ acao: 'remover', id: id, aba: config.nomeAba });
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} removido com sucesso!`, 'sucesso');
                this.invalidarCache(idHTML);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao remover ${nome}`, 'erro');
            }
        });
    }
    
    async mudarStatus(id, idHTML, novoStatus, nome) {
        const statusLabel = STATUS_CONFIG[novoStatus]?.label || novoStatus;
        this.confirmarAcao('Alterar Status', `Tens a certeza que pretendes alterar o status do utilizador "${nome}" para "${statusLabel}"?`, async () => {
            const config = MAPA_ABAS[idHTML];
            const resultado = await this.chamarBackendPost({ acao: 'atualizarStatus', id: id, aba: config.nomeAba, novoStatus: novoStatus });
            if (resultado.status === 'success') {
                this.mostrarToast(`Status de ${nome} alterado para ${statusLabel}!`, 'sucesso');
                this.invalidarCache(idHTML);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao alterar status de ${nome}`, 'erro');
            }
        });
    }
    
    async renovarAcesso(email, idHTML) {
        this.confirmarAcao('Renovar Acesso', `Tens a certeza que pretendes RENOVAR o acesso do utilizador com email "${email}"? Será adicionado +90 dias.`, async () => {
            const config = MAPA_ABAS[idHTML];
            const resultado = await this.chamarBackendPost({ acao: 'renovar', email: email, aba: config.nomeAba, novoComprovativo: 'Sim' });
            if (resultado.status === 'success') {
                this.mostrarToast(`Acesso renovado para ${email}!`, 'sucesso');
                this.invalidarCache(idHTML);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao renovar acesso de ${email}`, 'erro');
            }
        });
    }
    
    // ============================================================
    // 2.12 UTILITÁRIOS
    // ============================================================
    invalidarCache(idHTML) {
        const config = MAPA_ABAS[idHTML];
        if (config) {
            this.dadosCache.delete(config.cacheKey);
        }
        if (idHTML === 'todos') {
            this.dadosCache.delete(MAPA_ABAS.todos.cacheKey);
        }
    }
    
    async recarregarSecaoAtual() {
        await this.navegarPara(this.secaoActiva);
    }
    
    exportarCSV(idHTML) {
        const config = MAPA_ABAS[idHTML];
        if (!config) return;
        
        const cacheKey = config.cacheKey;
        const cached = this.dadosCache.get(cacheKey);
        if (!cached || !cached.dados) {
            this.mostrarToast('Aguardando dados para exportar...', 'aviso');
            return;
        }
        
        let dados = [...cached.dados];
        const filtros = this.estadoFiltros[idHTML] || {};
        
        if (filtros.texto) {
            const textoLower = filtros.texto.toLowerCase();
            dados = dados.filter(u => (u.nome || '').toLowerCase().includes(textoLower) || (u.email || '').toLowerCase().includes(textoLower));
        }
        if (filtros.regiao) dados = dados.filter(u => u.regiao === filtros.regiao);
        if (filtros.status && config.temStatus) dados = dados.filter(u => u.status === filtros.status);
        
        const cabecalhos = config.colunas;
        const linhas = dados.map(user => this.userToCSVRow(user, idHTML));
        
        const csvContent = [cabecalhos, ...linhas].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const data = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `teca_${idHTML}_${data}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.mostrarToast(`Exportação concluída: ${linhas.length} registos`, 'sucesso');
    }
    
    userToCSVRow(user, idHTML) {
        switch(idHTML) {
            case 'parceiros':
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.funcao, user.status, user.dataRegistro, user.dataExpiracao];
            case 'simuladores':
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.valorPago, user.status, user.dataRegistro, user.dataExpiracao];
            case 'cursos':
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.turma, user.valorPago, user.status, user.dataRegistro, user.dataExpiracao];
            case 'formacao':
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.instituicao, user.turma, user.valorPago, user.status, user.dataRegistro, user.dataExpiracao];
            case 'servicos':
                return [user.id, user.nome, user.email, user.telefone, user.valorPago, user.descricao, user.status, user.dataRegistro];
            case 'naopagos':
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.dataRegistro, user.dataExpiracao];
            default:
                return [user.id, user.nome, user.email, user.telefone, user.regiao, user.tipo, user.aba, user.status, user.dataRegistro, user.dataExpiracao];
        }
    }
    
    formatarData(data) {
        if (!data) return '-';
        if (data.includes('/')) return data;
        try {
            const d = new Date(data);
            if (isNaN(d.getTime())) return data;
            return d.toLocaleDateString('pt-PT');
        } catch {
            return data;
        }
    }
    
    truncarTexto(texto, max) {
        if (!texto) return '-';
        return texto.length > max ? texto.substring(0, max) + '...' : texto;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    mostrarToast(mensagem, tipo) {
        const container = document.getElementById('adm-toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `adm-toast adm-toast-${tipo}`;
        toast.innerHTML = `
            <i class="fas ${tipo === 'sucesso' ? 'fa-check-circle' : tipo === 'erro' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${mensagem}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    fecharModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
});

// ============================================================
// SECÇÃO 3 — CLASSE TecaInsight (PLUGIN DE INSIGHTS)
// ============================================================
// Versão: 2.0
// Descrição: Ferramenta avançada para visualização e análise
// de todos os dados da plataforma em tempo real
// ============================================================

class TecaInsight {
    constructor(config = {}) {
        this.apiUrl = config.apiUrl || APPS_SCRIPT_URL;
        this.autoRefresh = config.autoRefresh !== false;
        this.refreshInterval = config.refreshInterval || 30000;
        this.debug = config.debug || false;
        
        this.dados = {
            todos: [],
            porAba: {},
            estatisticas: {},
            receitas: {}
        };
        this.filtros = {};
        this.refreshTimer = null;
        this.isLoading = false;
        this.modalAberto = false;
        this.logs = [];
        
        this.init();
    }
    
    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    init() {
        this.log('🔍 Plugin TecaInsight iniciado');
        this.criarInterface();
        this.carregarDados();
        
        if (this.autoRefresh) {
            this.iniciarAutoRefresh();
        }
    }
    
    log(...args) {
        if (this.debug) {
            console.log('[TecaInsight]', ...args);
        }
    }
    
    // ============================================================
    // CRIAÇÃO DA INTERFACE FLUTUANTE
    // ============================================================
    criarInterface() {
        const btn = document.createElement('div');
        btn.id = 'teca-insight-btn';
        btn.innerHTML = '<i class="fas fa-chart-line"></i><span>Insight</span>';
        btn.title = 'Abrir Painel de Inspeção de Dados';
        btn.onclick = () => this.abrirModal();
        document.body.appendChild(btn);
        
        this.criarModal();
        this.adicionarEstilos();
    }
    
    criarModal() {
        const modal = document.createElement('div');
        modal.id = 'teca-insight-modal';
        modal.className = 'teca-insight-modal';
        modal.innerHTML = `
            <div class="teca-insight-modal-content">
                <div class="teca-insight-modal-header">
                    <div class="teca-insight-title">
                        <i class="fas fa-chart-line"></i>
                        <h2>Insight Administrativo</h2>
                    </div>
                    <div class="teca-insight-controls">
                        <button id="teca-insight-refresh" title="Actualizar dados">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button id="teca-insight-close" title="Fechar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="teca-insight-tabs">
                    <button class="teca-insight-tab active" data-tab="dashboard">Dashboard</button>
                    <button class="teca-insight-tab" data-tab="tabelas">Tabelas</button>
                    <button class="teca-insight-tab" data-tab="filtros">Filtros Avançados</button>
                    <button class="teca-insight-tab" data-tab="exportar">Exportar Dados</button>
                    <button class="teca-insight-tab" data-tab="logs">Logs do Sistema</button>
                </div>
                <div class="teca-insight-body">
                    <div id="teca-insight-dashboard" class="teca-insight-panel active">
                        <div class="teca-insight-loading">Carregando dados...</div>
                    </div>
                    <div id="teca-insight-tabelas" class="teca-insight-panel">
                        <div class="teca-insight-loading">Carregando...</div>
                    </div>
                    <div id="teca-insight-filtros" class="teca-insight-panel">
                        <div class="teca-insight-filtros-container"></div>
                    </div>
                    <div id="teca-insight-exportar" class="teca-insight-panel">
                        <div class="teca-insight-export-container"></div>
                    </div>
                    <div id="teca-insight-logs" class="teca-insight-panel">
                        <div class="teca-insight-logs-container"></div>
                    </div>
                </div>
                <div class="teca-insight-footer">
                    <div class="teca-insight-stats">
                        <span id="teca-insight-total">0</span> registos no total
                        <span id="teca-insight-last-update"></span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('teca-insight-close')?.addEventListener('click', () => this.fecharModal());
        document.getElementById('teca-insight-refresh')?.addEventListener('click', () => this.carregarDados(true));
        
        document.querySelectorAll('.teca-insight-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.mudarTab(tabId);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.fecharModal();
        });
    }
    
    adicionarEstilos() {
        const styles = `
            .teca-insight-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(8px);
                z-index: 10000;
                font-family: 'Segoe UI', 'Inter', sans-serif;
            }
            .teca-insight-modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 1400px;
                height: 85%;
                background: #0d0d0d;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.1);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            }
            .teca-insight-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                background: #111111;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .teca-insight-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .teca-insight-title i {
                font-size: 1.5rem;
                color: rgb(214, 174, 100);
            }
            .teca-insight-title h2 {
                font-size: 1.2rem;
                color: #f0f0f0;
                margin: 0;
            }
            .teca-insight-controls {
                display: flex;
                gap: 0.5rem;
            }
            .teca-insight-controls button {
                background: transparent;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 0.5rem;
                color: #888888;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .teca-insight-controls button:hover {
                border-color: rgb(214, 174, 100);
                color: rgb(214, 174, 100);
            }
            .teca-insight-tabs {
                display: flex;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                background: #0a0a0a;
                border-bottom: 1px solid rgba(255,255,255,0.07);
                overflow-x: auto;
            }
            .teca-insight-tab {
                background: transparent;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                color: #888888;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.85rem;
            }
            .teca-insight-tab:hover {
                background: rgba(214, 174, 100, 0.1);
                color: rgb(214, 174, 100);
            }
            .teca-insight-tab.active {
                background: rgba(214, 174, 100, 0.15);
                color: rgb(214, 174, 100);
                border-bottom: 2px solid rgb(214, 174, 100);
            }
            .teca-insight-body {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
            }
            .teca-insight-panel {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            .teca-insight-panel.active {
                display: block;
            }
            .teca-insight-loading {
                text-align: center;
                padding: 2rem;
                color: #888888;
            }
            .teca-insight-footer {
                padding: 0.75rem 1.5rem;
                background: #111111;
                border-top: 1px solid rgba(255,255,255,0.07);
                font-size: 0.8rem;
                color: #888888;
            }
            .teca-insight-stats {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            .teca-insight-stats span {
                color: rgb(214, 174, 100);
                font-weight: bold;
            }
            
            /* Cards Dashboard */
            .teca-insight-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .teca-insight-stat-card {
                background: #111111;
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid rgba(255,255,255,0.07);
                transition: all 0.3s ease;
            }
            .teca-insight-stat-card:hover {
                border-color: rgba(214, 174, 100, 0.3);
                transform: translateY(-2px);
            }
            .teca-insight-stat-card h3 {
                font-size: 0.75rem;
                color: #888888;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .teca-insight-stat-card .value {
                font-size: 1.8rem;
                font-weight: bold;
                color: rgb(214, 174, 100);
            }
            
            /* Tabela de Receitas */
            .teca-insight-receitas-table {
                background: #111111;
                border-radius: 12px;
                overflow: hidden;
                margin-top: 1rem;
            }
            .teca-insight-receitas-table table {
                width: 100%;
                border-collapse: collapse;
            }
            .teca-insight-receitas-table th,
            .teca-insight-receitas-table td {
                padding: 0.75rem 1rem;
                text-align: left;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .teca-insight-receitas-table th {
                background: #0a0a0a;
                color: rgb(214, 174, 100);
                font-weight: 600;
            }
            .teca-insight-receitas-table td:last-child {
                text-align: right;
                font-weight: bold;
                color: #00b45a;
            }
            .teca-insight-receitas-table tr.total-row td {
                border-top: 2px solid rgb(214, 174, 100);
                font-weight: bold;
                color: rgb(214, 174, 100);
            }
            
            /* Tabelas */
            .teca-insight-table-container {
                overflow-x: auto;
                margin-bottom: 1rem;
            }
            .teca-insight-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.8rem;
            }
            .teca-insight-table th,
            .teca-insight-table td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid rgba(255,255,255,0.07);
            }
            .teca-insight-table th {
                background: #0a0a0a;
                color: rgb(214, 174, 100);
                font-weight: 600;
                position: sticky;
                top: 0;
            }
            .teca-insight-table tr:hover {
                background: rgba(255,255,255,0.03);
                cursor: pointer;
            }
            
            /* Filtros */
            .teca-insight-filtros-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .teca-insight-filtro-group {
                background: #111111;
                border-radius: 12px;
                padding: 1rem;
                border: 1px solid rgba(255,255,255,0.07);
            }
            .teca-insight-filtro-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #888888;
                font-size: 0.85rem;
            }
            .teca-insight-filtro-group input,
            .teca-insight-filtro-group select {
                width: 100%;
                padding: 0.5rem;
                background: #161616;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: #f0f0f0;
            }
            
            /* Tabs Secundárias */
            .teca-insight-tabs-secondary {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }
            .teca-insight-tab-secondary {
                background: #161616;
                border: 1px solid rgba(255,255,255,0.1);
                padding: 0.5rem 1rem;
                border-radius: 8px;
                color: #888888;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .teca-insight-tab-secondary:hover {
                border-color: rgb(214, 174, 100);
                color: rgb(214, 174, 100);
            }
            .teca-insight-tab-secondary.active {
                background: rgba(214, 174, 100, 0.15);
                border-color: rgb(214, 174, 100);
                color: rgb(214, 174, 100);
            }
            .teca-insight-tabela-panel {
                display: none;
            }
            .teca-insight-tabela-panel.active {
                display: block;
            }
            
            /* Botões */
            .teca-insight-btn {
                background: linear-gradient(135deg, rgb(214, 174, 100), rgb(160, 126, 60));
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                color: #050505;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .teca-insight-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(214, 174, 100, 0.3);
            }
            
            /* Logs */
            .teca-insight-logs-container {
                background: #0a0a0a;
                border-radius: 12px;
                padding: 1rem;
                font-family: 'Courier New', monospace;
                font-size: 0.75rem;
                max-height: 500px;
                overflow-y: auto;
            }
            .teca-insight-log-entry {
                padding: 0.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-family: monospace;
            }
            .teca-insight-log-entry .log-timestamp {
                color: #666666;
                margin-right: 1rem;
            }
            .teca-insight-log-entry .log-type {
                display: inline-block;
                padding: 0.15rem 0.4rem;
                border-radius: 4px;
                font-size: 0.65rem;
                font-weight: bold;
                margin-right: 0.75rem;
            }
            .teca-insight-log-entry.success .log-type {
                background: rgba(0, 180, 90, 0.2);
                color: #00b45a;
            }
            .teca-insight-log-entry.error .log-type {
                background: rgba(214, 48, 49, 0.2);
                color: #d63031;
            }
            .teca-insight-log-entry.warning .log-type {
                background: rgba(243, 156, 18, 0.2);
                color: #f39c12;
            }
            .teca-insight-log-entry.info .log-type {
                background: rgba(136, 136, 136, 0.2);
                color: #888888;
            }
            .teca-insight-log-entry .log-message {
                color: #f0f0f0;
            }
            .teca-insight-log-entry .log-user {
                color: rgb(214, 174, 100);
                font-size: 0.7rem;
                margin-left: 1rem;
            }
            
            /* Gráfico de barras vertical */
            .teca-insight-grafico-mensal {
                margin-top: 1.5rem;
            }
            .teca-insight-barras-container {
                display: flex;
                align-items: flex-end;
                gap: 1rem;
                height: 200px;
                margin-top: 1rem;
            }
            .teca-insight-barra-item {
                flex: 1;
                text-align: center;
            }
            .teca-insight-barra {
                background: rgb(214, 174, 100);
                width: 100%;
                border-radius: 4px 4px 0 0;
                transition: height 0.5s ease;
                min-height: 4px;
            }
            .teca-insight-barra-label {
                font-size: 0.7rem;
                margin-top: 0.5rem;
                color: #888;
            }
            .teca-insight-barra-valor {
                font-size: 0.8rem;
                font-weight: bold;
                color: rgb(214, 174, 100);
                margin-top: 0.25rem;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Botão flutuante */
            #teca-insight-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 30px;
                background: linear-gradient(135deg, rgb(214, 174, 100), rgb(160, 126, 60));
                color: #050505;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                z-index: 9999;
                font-family: 'Segoe UI', sans-serif;
            }
            #teca-insight-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(214, 174, 100, 0.4);
            }
            #teca-insight-btn i {
                font-size: 1.5rem;
            }
            #teca-insight-btn span {
                font-size: 0.7rem;
                font-weight: bold;
                margin-top: 2px;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
    
    // ============================================================
    // ABRIR/FECHAR MODAL
    // ============================================================
    abrirModal() {
        const modal = document.getElementById('teca-insight-modal');
        if (modal) {
            modal.style.display = 'block';
            this.modalAberto = true;
            this.carregarDados(true);
        }
    }
    
    fecharModal() {
        const modal = document.getElementById('teca-insight-modal');
        if (modal) {
            modal.style.display = 'none';
            this.modalAberto = false;
        }
    }
    
    mudarTab(tabId) {
        document.querySelectorAll('.teca-insight-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabId) tab.classList.add('active');
        });
        
        document.querySelectorAll('.teca-insight-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        const panelAtivo = document.getElementById(`teca-insight-${tabId}`);
        if (panelAtivo) panelAtivo.classList.add('active');
        
        if (tabId === 'tabelas') this.renderizarTabelas();
        if (tabId === 'filtros') this.renderizarFiltros();
        if (tabId === 'exportar') this.renderizarExportacao();
        if (tabId === 'logs') this.renderizarLogs();
    }
    
    // ============================================================
    // CARREGAMENTO DE DADOS
    // ============================================================
    async carregarDados(force = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.log('Carregando dados...');
        
        try {
            const resposta = await fetch(this.apiUrl + '?acao=listar', {
                method: 'GET',
                redirect: 'follow'
            });
            
            if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
            
            const resultado = await resposta.json();
            
            if (resultado.status === 'success' && resultado.dados) {
                this.processarDados(resultado.dados);
                this.registrarLog('Dados carregados com sucesso', 'success');
                this.atualizarTimestamp();
            } else {
                throw new Error(resultado.mensagem || 'Erro ao carregar dados');
            }
        } catch (error) {
            this.log('Erro ao carregar dados:', error);
            this.registrarLog(`Erro: ${error.message}`, 'error');
            this.mostrarErro('Falha ao carregar dados. Verifique a conexão.');
        } finally {
            this.isLoading = false;
        }
    }
    
    processarDados(rawData) {
        this.dados.todos = rawData.filter(u => u.aba !== 'Administrador').map(normalizarUser);
        
        this.dados.porAba = {
            'Parceiros': [],
            'Simuladores-Bibliotecas': [],
            'Cursos Online': [],
            'Formação Presencial': [],
            'Serviços Personalizados': [],
            'Usuários Não Pagos': []
        };
        
        this.dados.todos.forEach(user => {
            if (this.dados.porAba[user.aba]) {
                this.dados.porAba[user.aba].push(user);
            }
        });
        
        this.calcularEstatisticas();
        this.calcularReceitas();
        this.renderizarDashboard();
        
        const totalSpan = document.getElementById('teca-insight-total');
        if (totalSpan) totalSpan.textContent = this.dados.todos.length;
    }
    
    calcularEstatisticas() {
        const stats = {
            total: this.dados.todos.length,
            porAba: {},
            porStatus: {},
            porRegiao: {},
            ultimos30Dias: 0,
            expirados: 0,
            aExpirar30Dias: 0
        };
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        const trintaDiasFrente = new Date();
        trintaDiasFrente.setDate(hoje.getDate() + 30);
        
        this.dados.todos.forEach(user => {
            stats.porAba[user.aba] = (stats.porAba[user.aba] || 0) + 1;
            if (user.status) stats.porStatus[user.status] = (stats.porStatus[user.status] || 0) + 1;
            if (user.regiao && user.regiao !== '-') stats.porRegiao[user.regiao] = (stats.porRegiao[user.regiao] || 0) + 1;
            
            if (user.dataRegistro) {
                const dataReg = this.parseData(user.dataRegistro);
                if (dataReg && dataReg >= trintaDiasAtras) stats.ultimos30Dias++;
            }
            
            if (user.dataExpiracao && user.dataExpiracao !== 'Permanente') {
                const dataExp = this.parseData(user.dataExpiracao);
                if (dataExp) {
                    if (dataExp < hoje) stats.expirados++;
                    else if (dataExp <= trintaDiasFrente) stats.aExpirar30Dias++;
                }
            }
        });
        
        this.dados.estatisticas = stats;
    }
    
    calcularReceitas() {
        const abas = ['Simuladores-Bibliotecas', 'Cursos Online', 'Formação Presencial', 'Serviços Personalizados'];
        const receitas = {};
        let totalGeral = 0;
        
        abas.forEach(aba => {
            const utilizadoresDaAba = this.dados.todos.filter(u => u.aba === aba);
            const soma = utilizadoresDaAba.reduce((acc, u) => {
                const valor = this.parseValorMonetario(u.valorPago);
                return acc + valor;
            }, 0);
            receitas[aba] = soma;
            totalGeral += soma;
        });
        
        receitas.total = totalGeral;
        this.dados.receitas = receitas;
    }
    
    parseValorMonetario(valorStr) {
        if (!valorStr || valorStr === '-') return 0;
        
        let valor = valorStr.toString();
        
        valor = valor.replace(/[^\d,.-]/g, '');
        
        valor = valor.replace(/\.(?=\d{3})/g, '');
        
        valor = valor.replace(',', '.');
        
        const numero = parseFloat(valor);
        return isNaN(numero) ? 0 : numero;
    }
    
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 2
        }).format(valor);
    }
    
    parseData(dataStr) {
        if (!dataStr) return null;
        if (dataStr.includes('/')) {
            const partes = dataStr.split('/');
            if (partes.length === 3) {
                return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
            }
        }
        const d = new Date(dataStr);
        return isNaN(d.getTime()) ? null : d;
    }
    
    // ============================================================
    // RENDERIZAÇÃO DO DASHBOARD (com Painel Financeiro)
    // ============================================================
    renderizarDashboard() {
        const container = document.getElementById('teca-insight-dashboard');
        if (!container) return;
        
        const stats = this.dados.estatisticas;
        const receitas = this.dados.receitas;
        
        container.innerHTML = `
            <div class="teca-insight-stats-grid">
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-users"></i> Total de Utilizadores</h3>
                    <div class="value">${stats.total}</div>
                </div>
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-calendar-plus"></i> Últimos 30 dias</h3>
                    <div class="value">${stats.ultimos30Dias}</div>
                </div>
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-exclamation-triangle"></i> Acessos Expirados</h3>
                    <div class="value" style="color: #d63031">${stats.expirados}</div>
                </div>
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-hourglass-half"></i> Expira em 30 dias</h3>
                    <div class="value" style="color: #f39c12">${stats.aExpirar30Dias}</div>
                </div>
            </div>
            
            <div class="teca-insight-stats-grid">
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-chart-pie"></i> Distribuição por Categoria</h3>
                    ${Object.entries(stats.porAba).map(([aba, count]) => `
                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                            <span>${aba}</span>
                            <span style="color: rgb(214, 174, 100); font-weight: bold;">${count}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-chart-bar"></i> Distribuição por Status</h3>
                    ${Object.entries(stats.porStatus).map(([status, count]) => `
                        <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                            <span>${this.getStatusLabel(status)}</span>
                            <span style="color: ${this.getStatusColor(status)}; font-weight: bold;">${count}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="teca-insight-stat-card">
                    <h3><i class="fas fa-map-marker-alt"></i> Top 5 Regiões</h3>
                    ${Object.entries(stats.porRegiao)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([regiao, count]) => `
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>${regiao}</span>
                                <span style="color: rgb(214, 174, 100); font-weight: bold;">${count}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
            
            <div class="teca-insight-receitas-table">
                <h3 style="margin-bottom: 0.75rem; color: rgb(214, 174, 100);"><i class="fas fa-coins"></i> 💰 RECEITAS DA PLATAFORMA</h3>
                <table>
                    <thead>
                        <tr><th>Categoria</th><th>Valor Total</th> </tr>
                    </thead>
                    <tbody>
                        <tr><td>Simuladores e Biblioteca</td><td>${this.formatarMoeda(receitas['Simuladores-Bibliotecas'] || 0)}</td></tr>
                        <tr><td>Cursos Online</td><td>${this.formatarMoeda(receitas['Cursos Online'] || 0)}</td></tr>
                        <tr><td>Formação Presencial</td><td>${this.formatarMoeda(receitas['Formação Presencial'] || 0)}</td></tr>
                        <tr><td>Serviços Personalizados</td><td>${this.formatarMoeda(receitas['Serviços Personalizados'] || 0)}</td></tr>
                        <tr class="total-row"><td><strong>TOTAL GERAL</strong></td><td><strong>${this.formatarMoeda(receitas.total || 0)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
            
            <div class="teca-insight-grafico-mensal">
                <h3 style="margin: 1.5rem 0 0.75rem 0; color: rgb(214, 174, 100);"><i class="fas fa-chart-line"></i> Evolução Mensal (Últimos 6 meses)</h3>
                <div id="teca-insight-grafico-evolucao"></div>
            </div>
        `;
        
        this.renderizarGraficoEvolucao();
    }
    
    renderizarGraficoEvolucao() {
        const container = document.getElementById('teca-insight-grafico-evolucao');
        if (!container) return;
        
        const meses = {};
        const hoje = new Date();
        
        for (let i = 0; i < 6; i++) {
            const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
            const key = `${data.getFullYear()}-${data.getMonth() + 1}`;
            meses[key] = { nome: data.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' }), total: 0 };
        }
        
        this.dados.todos.forEach(user => {
            if (user.dataRegistro) {
                const dataReg = this.parseData(user.dataRegistro);
                if (dataReg) {
                    const key = `${dataReg.getFullYear()}-${dataReg.getMonth() + 1}`;
                    if (meses[key]) meses[key].total++;
                }
            }
        });
        
        const dadosGrafico = Object.values(meses).reverse();
        const maxValor = Math.max(...dadosGrafico.map(d => d.total), 1);
        
        container.innerHTML = `
            <div class="teca-insight-barras-container">
                ${dadosGrafico.map(mes => `
                    <div class="teca-insight-barra-item">
                        <div class="teca-insight-barra" style="height: ${(mes.total / maxValor) * 160}px;"></div>
                        <div class="teca-insight-barra-label">${mes.nome}</div>
                        <div class="teca-insight-barra-valor">${mes.total}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // ============================================================
    // RENDERIZAÇÃO DE TABELAS (com abas)
    // ============================================================
    renderizarTabelas() {
        const container = document.getElementById('teca-insight-tabelas');
        if (!container) return;
        
        let html = '<div class="teca-insight-tabs-secondary">';
        const abas = Object.keys(this.dados.porAba);
        
        html += abas.map((aba, index) => `
            <button class="teca-insight-tab-secondary ${index === 0 ? 'active' : ''}" data-aba="${aba}">
                ${aba}
            </button>
        `).join('');
        html += '</div>';
        
        html += '<div class="teca-insight-tabelas-container">';
        
        abas.forEach((aba, index) => {
            const users = this.dados.porAba[aba];
            html += `
                <div class="teca-insight-tabela-panel ${index === 0 ? 'active' : ''}" data-aba-panel="${aba}">
                    <div class="teca-insight-table-container">
                        <table class="teca-insight-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Telefone</th>
                                    <th>Região</th>
                                    <th>Status</th>
                                    <th>Data Registo</th>
                                    <th>Expiração</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr onclick="tecaInsight.verDetalhesUsuario('${user.id}', '${aba}')">
                                        <td>${user.id || '-'}</td>
                                        <td>${this.escapeHtml(user.nome || '-')}</td>
                                        <td>${this.escapeHtml(user.email || '-')}</td>
                                        <td>${user.telefone || '-'}</td>
                                        <td>${user.regiao || '-'}</td>
                                        <td>${this.renderizarBadgeStatus(user.status)}</td>
                                        <td>${user.dataRegistro || '-'}</td>
                                        <td>${user.dataExpiracao || 'Permanente'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        container.querySelectorAll('.teca-insight-tab-secondary').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const aba = tab.dataset.aba;
                container.querySelectorAll('.teca-insight-tab-secondary').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                container.querySelectorAll('.teca-insight-tabela-panel').forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.dataset.abaPanel === aba) panel.classList.add('active');
                });
            });
        });
    }
    
    // ============================================================
    // FILTROS AVANÇADOS
    // ============================================================
    renderizarFiltros() {
        const container = document.getElementById('teca-insight-filtros');
        if (!container) return;
        
        const stats = this.dados.estatisticas;
        const regioes = Object.keys(stats.porRegiao).sort();
        const statusList = Object.keys(stats.porStatus);
        const categorias = Object.keys(this.dados.porAba);
        
        container.innerHTML = `
            <div class="teca-insight-filtros-container">
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-search"></i> Buscar por Nome ou Email</label>
                    <input type="text" id="insight-search-text" placeholder="Digite para filtrar...">
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-map-marker-alt"></i> Região</label>
                    <select id="insight-filter-regiao">
                        <option value="">Todas as regiões</option>
                        ${regioes.map(r => `<option value="${r}">${r}</option>`).join('')}
                    </select>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-tag"></i> Status</label>
                    <select id="insight-filter-status">
                        <option value="">Todos os status</option>
                        ${statusList.map(s => `<option value="${s}">${this.getStatusLabel(s)}</option>`).join('')}
                    </select>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-layer-group"></i> Categoria</label>
                    <select id="insight-filter-aba">
                        <option value="">Todas as categorias</option>
                        ${categorias.map(aba => `<option value="${aba}">${aba}</option>`).join('')}
                    </select>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-calendar"></i> Data Inicial</label>
                    <input type="date" id="insight-filter-data-inicio">
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-calendar"></i> Data Final</label>
                    <input type="date" id="insight-filter-data-fim">
                </div>
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                <button id="insight-aplicar-filtros" class="teca-insight-btn">Aplicar Filtros</button>
                <button id="insight-limpar-filtros" class="teca-insight-btn" style="background: #161616; color: #f0f0f0;">Limpar Filtros</button>
            </div>
            <div id="insight-resultados-filtrados" style="margin-top: 1.5rem;">
                <div class="teca-insight-table-container">
                    <table class="teca-insight-table" id="insight-resultados-table">
                        <thead>
                            <tr><th>ID</th><th>Nome</th><th>Email</th><th>Região</th><th>Categoria</th><th>Status</th></tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div id="insight-resultados-count" style="margin-top: 0.5rem; text-align: right; color: #888; font-size: 0.8rem;"></div>
            </div>
        `;
        
        document.getElementById('insight-aplicar-filtros')?.addEventListener('click', () => this.aplicarFiltros());
        document.getElementById('insight-limpar-filtros')?.addEventListener('click', () => this.limparFiltrosUI());
    }
    
    aplicarFiltros() {
        const searchText = document.getElementById('insight-search-text')?.value.toLowerCase() || '';
        const regiao = document.getElementById('insight-filter-regiao')?.value || '';
        const status = document.getElementById('insight-filter-status')?.value || '';
        const aba = document.getElementById('insight-filter-aba')?.value || '';
        const dataInicio = document.getElementById('insight-filter-data-inicio')?.value;
        const dataFim = document.getElementById('insight-filter-data-fim')?.value;
        
        let resultados = [...this.dados.todos];
        
        if (searchText) {
            resultados = resultados.filter(u => 
                (u.nome || '').toLowerCase().includes(searchText) ||
                (u.email || '').toLowerCase().includes(searchText)
            );
        }
        
        if (regiao) resultados = resultados.filter(u => u.regiao === regiao);
        if (status) resultados = resultados.filter(u => u.status === status);
        if (aba) resultados = resultados.filter(u => u.aba === aba);
        
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            resultados = resultados.filter(u => {
                const data = this.parseData(u.dataRegistro);
                return data && data >= inicio;
            });
        }
        
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59);
            resultados = resultados.filter(u => {
                const data = this.parseData(u.dataRegistro);
                return data && data <= fim;
            });
        }
        
        this.renderizarResultadosFiltrados(resultados);
    }
    
    limparFiltrosUI() {
        const inputs = ['insight-search-text', 'insight-filter-regiao', 'insight-filter-status', 'insight-filter-aba', 'insight-filter-data-inicio', 'insight-filter-data-fim'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this.renderizarResultadosFiltrados(this.dados.todos);
    }
    
    renderizarResultadosFiltrados(resultados) {
        const tbody = document.querySelector('#insight-resultados-table tbody');
        const countSpan = document.getElementById('insight-resultados-count');
        
        if (!tbody) return;
        
        tbody.innerHTML = resultados.map(user => `
            <tr onclick="tecaInsight.verDetalhesUsuario('${user.id}', '${user.aba}')" style="cursor: pointer;">
                <td>${user.id || '-'}</td>
                <td>${this.escapeHtml(user.nome || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${user.regiao || '-'}</td>
                <td>${user.aba || '-'}</td>
                <td>${this.renderizarBadgeStatus(user.status)}</td>
            </tr>
        `).join('');
        
        if (countSpan) {
            countSpan.textContent = `${resultados.length} resultados encontrados`;
        }
        
        this.registrarLog(`Filtro aplicado: ${resultados.length} resultados encontrados`, 'info');
    }
    
    // ============================================================
    // EXPORTAÇÃO DE DADOS
    // ============================================================
    renderizarExportacao() {
        const container = document.getElementById('teca-insight-exportar');
        if (!container) return;
        
        const categorias = Object.keys(this.dados.porAba);
        
        container.innerHTML = `
            <div class="teca-insight-filtros-container">
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-file-csv"></i> Exportar para CSV</label>
                    <button id="insight-export-csv" class="teca-insight-btn">Exportar Todos os Dados</button>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-file-excel"></i> Exportar por Categoria</label>
                    <select id="insight-export-aba">
                        <option value="">Todas as categorias</option>
                        ${categorias.map(aba => `<option value="${aba}">${aba}</option>`).join('')}
                    </select>
                    <button id="insight-export-csv-aba" class="teca-insight-btn" style="margin-top: 0.5rem;">Exportar Categoria</button>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-chart-line"></i> Exportar Relatório</label>
                    <button id="insight-export-relatorio" class="teca-insight-btn">Exportar Relatório Completo</button>
                </div>
                <div class="teca-insight-filtro-group">
                    <label><i class="fas fa-copy"></i> Copiar para Clipboard</label>
                    <button id="insight-copy-dados" class="teca-insight-btn">Copiar Dados (JSON)</button>
                </div>
            </div>
        `;
        
        document.getElementById('insight-export-csv')?.addEventListener('click', () => this.exportarCSV());
        document.getElementById('insight-export-csv-aba')?.addEventListener('click', () => {
            const aba = document.getElementById('insight-export-aba')?.value;
            this.exportarCSV(aba);
        });
        document.getElementById('insight-export-relatorio')?.addEventListener('click', () => this.exportarRelatorio());
        document.getElementById('insight-copy-dados')?.addEventListener('click', () => this.copiarDados());
    }
    
    exportarCSV(aba = null) {
        let dados = aba ? this.dados.porAba[aba] || [] : this.dados.todos;
        
        const cabecalhos = ['ID', 'Nome', 'Email', 'Telefone', 'Região', 'Categoria', 'Status', 'Data Registo', 'Expiração'];
        const linhas = dados.map(user => [
            user.id || '',
            user.nome || '',
            user.email || '',
            user.telefone || '',
            user.regiao || '',
            user.aba || '',
            user.status || '',
            user.dataRegistro || '',
            user.dataExpiracao || ''
        ]);
        
        const csvContent = [cabecalhos, ...linhas].map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const filename = aba ? `teca_${aba.toLowerCase().replace(/\s/g, '_')}` : 'teca_todos_utilizadores';
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.registrarLog(`Exportação CSV concluída: ${dados.length} registos`, 'success');
    }
    
    exportarRelatorio() {
        const stats = this.dados.estatisticas;
        const receitas = this.dados.receitas;
        
        const relatorio = {
            dataGeracao: new Date().toISOString(),
            totalUtilizadores: stats.total,
            distribuicaoCategoria: stats.porAba,
            distribuicaoStatus: stats.porStatus,
            distribuicaoRegiao: stats.porRegiao,
            novosUltimos30Dias: stats.ultimos30Dias,
            acessosExpirados: stats.expirados,
            aExpirar30Dias: stats.aExpirar30Dias,
            receitas: {
                simuladores: receitas['Simuladores-Bibliotecas'] || 0,
                cursos: receitas['Cursos Online'] || 0,
                formacao: receitas['Formação Presencial'] || 0,
                servicos: receitas['Serviços Personalizados'] || 0,
                total: receitas.total || 0
            },
            listaUtilizadores: this.dados.todos.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email,
                categoria: u.aba,
                status: u.status,
                dataRegisto: u.dataRegistro,
                expiracao: u.dataExpiracao
            }))
        };
        
        const json = JSON.stringify(relatorio, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `teca_relatorio_${new Date().toISOString().slice(0, 10)}.json`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.registrarLog('Relatório completo exportado', 'success');
    }
    
    copiarDados() {
        const dadosStr = JSON.stringify(this.dados.todos, null, 2);
        navigator.clipboard.writeText(dadosStr).then(() => {
            this.registrarLog('Dados copiados para a área de transferência', 'success');
        }).catch(() => {
            this.registrarLog('Erro ao copiar dados', 'error');
        });
    }
    
    // ============================================================
    // LOGS DO SISTEMA (com logs reais do AdminPanel)
    // ============================================================
    renderizarLogs() {
        const container = document.getElementById('teca-insight-logs');
        if (!container) return;
        
        const logs = this.logs;
        
        container.innerHTML = `
            <div class="teca-insight-logs-container">
                ${logs.map(log => `
                    <div class="teca-insight-log-entry ${log.tipo}">
                        <span class="log-timestamp">[${log.timestamp}]</span>
                        <span class="log-type">${log.acao || log.tipo?.toUpperCase() || 'INFO'}</span>
                        <span class="log-message">${log.detalhes || log.mensagem}</span>
                        ${log.utilizador ? `<span class="log-user">— ${log.utilizador} (${log.tipoUtilizador || 'Sistema'})</span>` : ''}
                    </div>
                `).join('')}
                ${logs.length === 0 ? '<div class="teca-insight-log-entry">Nenhum log registado</div>' : ''}
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                <button id="insight-clear-logs" class="teca-insight-btn" style="background: #161616;">Limpar Logs</button>
                <button id="insight-export-logs" class="teca-insight-btn">Exportar Logs</button>
                <button id="insight-refresh-logs" class="teca-insight-btn">Actualizar Logs</button>
            </div>
        `;
        
        document.getElementById('insight-clear-logs')?.addEventListener('click', () => {
            this.logs = [];
            this.renderizarLogs();
            this.registrarLog('Logs limpos', 'info');
        });
        
        document.getElementById('insight-export-logs')?.addEventListener('click', () => this.exportarLogs());
        document.getElementById('insight-refresh-logs')?.addEventListener('click', () => this.carregarLogsDoAdminPanel());
    }
    
    carregarLogsDoAdminPanel() {
        if (window.adminPanel && window.adminPanel.logsLogin) {
            this.logs = [...window.adminPanel.logsLogin];
            this.renderizarLogs();
            this.registrarLog('Logs actualizados a partir do painel admin', 'success');
        } else {
            this.registrarLog('Não foi possível carregar logs do painel admin', 'warning');
        }
    }
    
    registrarLog(mensagem, tipo = 'info') {
        this.logs.unshift({
            timestamp: new Date().toLocaleString('pt-PT'),
            tipo: tipo,
            acao: tipo.toUpperCase(),
            detalhes: mensagem,
            utilizador: window.adminPanel?.adminInfo?.nome || 'Sistema',
            tipoUtilizador: 'Sistema'
        });
        
        if (this.logs.length > 200) this.logs.pop();
        
        if (document.getElementById('teca-insight-logs')) {
            this.renderizarLogs();
        }
    }
    
    exportarLogs() {
        const logsStr = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([logsStr], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `teca_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.registrarLog('Logs exportados', 'success');
    }
    
    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    verDetalhesUsuario(id, aba) {
        const user = this.dados.todos.find(u => u.id == id && u.aba === aba);
        if (!user) return;
        
        const detalhes = `
            <div style="background: #111; border-radius: 12px; padding: 1rem;">
                <h3 style="color: rgb(214, 174, 100); margin-bottom: 1rem;">Detalhes do Utilizador</h3>
                ${Object.entries(user).map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #888;">${key}:</span>
                        <span style="color: #f0f0f0;">${this.escapeHtml(String(value || '-'))}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        modal.innerHTML = `
            <div style="background: #0d0d0d; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto; padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: rgb(214, 174, 100);">Detalhes do Utilizador</h3>
                    <button id="close-detalhes" style="background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                ${detalhes}
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#close-detalhes').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
    
    getStatusLabel(status) {
        const labels = {
            'aguardando validacao': 'Aguardando',
            'aprovado': 'Aprovado',
            'removido': 'Removido',
            'negociacao': 'Negociação',
            'fechado': 'Fechado'
        };
        return labels[status] || status || 'Desconhecido';
    }
    
    getStatusColor(status) {
        const colors = {
            'aguardando validacao': '#f39c12',
            'aprovado': '#00b45a',
            'removido': '#d63031',
            'negociacao': '#1a6de8',
            'fechado': '#888888'
        };
        return colors[status] || '#888888';
    }
    
    renderizarBadgeStatus(status) {
        const label = this.getStatusLabel(status);
        const color = this.getStatusColor(status);
        return `<span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 20px; background: ${color}20; color: ${color}; font-size: 0.7rem;">${label}</span>`;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    mostrarErro(mensagem) {
        this.registrarLog(mensagem, 'error');
        const dashboard = document.getElementById('teca-insight-dashboard');
        if (dashboard && dashboard.querySelector('.teca-insight-loading')) {
            dashboard.innerHTML = `<div style="text-align: center; padding: 2rem; color: #d63031;">${mensagem}</div>`;
        }
    }
    
    atualizarTimestamp() {
        const span = document.getElementById('teca-insight-last-update');
        if (span) {
            span.textContent = `Última atualização: ${new Date().toLocaleString('pt-PT')}`;
        }
    }
    
    iniciarAutoRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        this.refreshTimer = setInterval(() => {
            if (this.modalAberto) {
                this.carregarDados(true);
            }
        }, this.refreshInterval);
    }
    
    destruir() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        const btn = document.getElementById('teca-insight-btn');
        const modal = document.getElementById('teca-insight-modal');
        if (btn) btn.remove();
        if (modal) modal.remove();
        this.log('Plugin destruído');
    }
}

// ============================================================
// INICIALIZAÇÃO DO TECAINSIGHT
// ============================================================
let tecaInsight;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        tecaInsight = new TecaInsight({ debug: false });
        window.tecaInsight = tecaInsight;
    }, 500);
});