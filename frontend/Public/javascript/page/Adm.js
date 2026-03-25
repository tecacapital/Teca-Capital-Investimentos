// ============================================================
// TECA CAPITAL EDTECH - PAINEL ADMINISTRATIVO (V1)
// ============================================================
// Integrado ao sistema de login existente
// Controle de sessão: 2 minutos de inatividade com aviso
// ============================================================

// Configuração
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeahMxXzXIDou1hTshRYLmSPeHRFx5RmQvEe5iFP717iKbvyTt1covpO-ydpzmiD_Abg/exec';

// Status badges configuration
const STATUS_CONFIG = {
    'aguardando validacao': { cor: 'var(--gold)', icone: 'fa-clock', label: 'Aguardando' },
    'aprovado': { cor: 'var(--green)', icone: 'fa-check-circle', label: 'Aprovado' },
    'removido': { cor: 'var(--red)', icone: 'fa-ban', label: 'Removido' },
    'negociacao': { cor: 'var(--blue)', icone: 'fa-handshake', label: 'Negociação' },
    'fechado': { cor: 'var(--text-dim)', icone: 'fa-times-circle', label: 'Fechado' }
};

// Mapeamento de abas
const ABAS_CONFIG = {
    'Parceiros': { nome: 'Parceiros', temStatus: true, temFuncao: true, temTurma: false, temValor: true, temInstituicao: false },
    'Simuladores-Bibliotecas': { nome: 'Simuladores-Bibliotecas', temStatus: true, temFuncao: false, temTurma: false, temValor: true, temInstituicao: false },
    'Cursos Online': { nome: 'Cursos Online', temStatus: true, temFuncao: false, temTurma: true, temValor: true, temInstituicao: false },
    'Formação Presencial': { nome: 'Formação Presencial', temStatus: true, temFuncao: false, temTurma: true, temValor: true, temInstituicao: true },
    'Serviços Personalizados': { nome: 'Serviços Personalizados', temStatus: true, temFuncao: false, temTurma: false, temValor: true, temInstituicao: false, semSenha: true },
    'Usuários Não Pagos': { nome: 'Usuários Não Pagos', temStatus: false, temFuncao: false, temTurma: false, temValor: false, temInstituicao: false }
};

// ============================================================
// CLASSE PRINCIPAL DO PAINEL ADMIN
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
        this.TEMPO_MAX = 120000;
        this.TEMPO_AVISO = 90000;
        this.ultimaAtividade = Date.now();
        this.aguardandoConfirmacao = null;
        
        this.init();
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    async init() {
        // 1. Verificar acesso antes de tudo
        if (!this.verificarAcesso()) return;
        
        // 2. Carregar info do admin
        this.carregarInfoAdmin();
        
        // 3. Iniciar timer de sessão
        this.iniciarTimerSessao();
        
        // 4. Attach eventos globais
        this.attachEventosGlobais();
        
        // 5. Carregar dashboard
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
            document.getElementById('adm-admin-nome').textContent = this.adminInfo.nome || 'Administrador';
        }
    }

    // ============================================================
    // CONTROLE DE SESSÃO
    // ============================================================
    iniciarTimerSessao() {
        this.resetarTimer();
        
        // Eventos que reiniciam o contador
        const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        eventos.forEach(evento => {
            document.addEventListener(evento, () => this.resetarTimer());
        });
    }

    resetarTimer() {
        this.ultimaAtividade = Date.now();
        this.atualizarTimerDisplay();
        
        if (this.timerAviso) clearTimeout(this.timerAviso);
        if (this.timerInactividade) clearTimeout(this.timerInactividade);
        
        // Agendar aviso (90 segundos)
        this.timerAviso = setTimeout(() => this.mostrarAvisoSessao(), this.TEMPO_AVISO);
        
        // Agendar logout (120 segundos)
        this.timerInactividade = setTimeout(() => this.logoutAutomatico(), this.TEMPO_MAX);
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
        sessionStorage.removeItem('teca_logado');
        sessionStorage.removeItem('teca_utilizador');
        sessionStorage.removeItem('teca_tipo');
        window.location.href = 'index.html';
    }

    // ============================================================
    // EVENTOS GLOBAIS
    // ============================================================
    attachEventosGlobais() {
        // Logout manual
        document.getElementById('adm-logout-btn').addEventListener('click', () => this.logout());
        
        // Navegação sidebar
        document.querySelectorAll('.adm-nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const secao = btn.dataset.secao;
                this.navegarPara(secao);
            });
        });
        
        // Menu toggle mobile
        const menuToggle = document.getElementById('adm-menu-toggle');
        const sidebar = document.getElementById('adm-sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('adm-sidebar-mobile-open');
            });
        }
        
        // Refresh buttons
        document.querySelectorAll('.adm-btn-refresh').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                if (aba === 'todos') {
                    this.carregarTodosUtilizadores(true);
                } else {
                    this.carregarDadosAba(aba, true);
                }
            });
        });
        
        // Export buttons
        document.querySelectorAll('.adm-btn-export').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                this.exportarCSV(aba);
            });
        });
        
        // Clear filters buttons
        document.querySelectorAll('.adm-btn-clear').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aba = btn.dataset.aba;
                this.limparFiltros(aba);
            });
        });
        
        // Search inputs
        const abas = ['parceiros', 'simuladores', 'cursos', 'formacao', 'servicos', 'naopagos', 'todos'];
        abas.forEach(aba => {
            const searchInput = document.getElementById(`adm-search-${aba}`);
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.estadoFiltros[aba] = this.estadoFiltros[aba] || {};
                    this.estadoFiltros[aba].texto = e.target.value;
                    this.aplicarFiltros(aba);
                });
            }
        });
        
        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('adm-modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Confirm modal buttons
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
    // NAVEGAÇÃO
    // ============================================================
    async navegarPara(secao) {
        this.secaoActiva = secao;
        
        // Atualizar sidebar
        document.querySelectorAll('.adm-nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.secao === secao);
        });
        
        // Atualizar views
        document.querySelectorAll('.adm-secao').forEach(view => {
            view.classList.remove('active');
        });
        const viewAtiva = document.getElementById(`adm-secao-${secao}`);
        if (viewAtiva) viewAtiva.classList.add('active');
        
        // Fechar sidebar mobile
        const sidebar = document.getElementById('adm-sidebar');
        if (sidebar) sidebar.classList.remove('adm-sidebar-mobile-open');
        
        // Carregar dados conforme secao
        switch(secao) {
            case 'dashboard':
                await this.carregarDashboard();
                break;
            case 'parceiros':
                await this.carregarDadosAba('Parceiros');
                break;
            case 'simuladores':
                await this.carregarDadosAba('Simuladores-Bibliotecas');
                break;
            case 'cursos':
                await this.carregarDadosAba('Cursos Online');
                break;
            case 'formacao':
                await this.carregarDadosAba('Formação Presencial');
                break;
            case 'servicos':
                await this.carregarDadosAba('Serviços Personalizados');
                break;
            case 'naopagos':
                await this.carregarDadosAba('Usuários Não Pagos');
                break;
            case 'todos':
                await this.carregarTodosUtilizadores();
                break;
        }
    }

    // ============================================================
    // BACKEND COMMUNICATION
    // ============================================================
    async chamarBackendPost(payload) {
        try {
            const resposta = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow'
            });
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
            return await resposta.json();
        } catch (erro) {
            console.error('Erro na comunicação:', erro);
            return { status: 'error', mensagem: 'Erro de conexão com o servidor' };
        }
    }

    async chamarBackendGet(params) {
        const url = new URL(APPS_SCRIPT_URL);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        try {
            const resposta = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
            if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
            return await resposta.json();
        } catch (erro) {
            console.error('Erro na comunicação:', erro);
            return { status: 'error', mensagem: 'Erro de conexão com o servidor' };
        }
    }

    // ============================================================
    // DASHBOARD
    // ============================================================
    async carregarDashboard() {
        try {
            const resultado = await this.chamarBackendGet({ acao: 'listar' });
            if (resultado.status === 'success' && resultado.dados) {
                this.calcularEstatisticas(resultado.dados);
                this.renderizarUltimosCadastros(resultado.dados);
                this.renderizarGrafico(resultado.dados);
            }
        } catch (error) {
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
            aguardando: 0
        };
        
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
            }
        });
        
        this.renderizarCards(stats);
    }

    renderizarCards(stats) {
        const grid = document.getElementById('adm-stats-grid');
        if (!grid) return;
        
        const cards = [
            { valor: stats.total, label: 'Total de Utilizadores', icone: 'fa-users', cor: 'gold', secao: 'todos' },
            { valor: stats.parceiros, label: 'Parceiros', icone: 'fa-handshake', cor: 'gold', secao: 'parceiros' },
            { valor: stats.aguardando, label: 'Aguardando Validação', icone: 'fa-clock', cor: 'gold', secao: 'parceiros' },
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
        
        // Adicionar evento de clique nos cards
        grid.querySelectorAll('.adm-stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const secao = card.dataset.secao;
                if (secao) this.navegarPara(secao);
            });
        });
    }

    renderizarGrafico(dados) {
        const container = document.getElementById('adm-grafico-barras');
        if (!container) return;
        
        const categorias = {
            'Parceiros': 0,
            'Simuladores': 0,
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
                                <div class="adm-grafico-bar-fill" style="width: ${percentual}%; height: ${altura}px;"></div>
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
    // CARREGAMENTO DE DADOS POR ABA
    // ============================================================
    async carregarDadosAba(aba, forceReload = false) {
        const cacheKey = `aba_${aba}`;
        const agora = Date.now();
        
        if (!forceReload && this.dadosCache.has(cacheKey)) {
            const cached = this.dadosCache.get(cacheKey);
            if (agora - cached.timestamp < 60000) { // 60 segundos de cache
                this.dadosFiltrados = cached.dados;
                this.renderizarTabela(aba, cached.dados);
                this.inicializarFiltros(aba, cached.dados);
                return;
            }
        }
        
        this.mostrarSkeleton(aba);
        
        try {
            const resultado = await this.chamarBackendGet({ acao: 'listar', aba: aba });
            if (resultado.status === 'success' && resultado.dados) {
                this.dadosCache.set(cacheKey, {
                    dados: resultado.dados,
                    timestamp: agora
                });
                this.dadosFiltrados = resultado.dados;
                this.renderizarTabela(aba, resultado.dados);
                this.inicializarFiltros(aba, resultado.dados);
            } else {
                this.mostrarToast(`Erro ao carregar ${aba}`, 'erro');
                this.renderizarTabela(aba, []);
            }
        } catch (error) {
            this.mostrarToast(`Erro ao carregar ${aba}`, 'erro');
            this.renderizarTabela(aba, []);
        }
    }

    async carregarTodosUtilizadores(forceReload = false) {
        const cacheKey = 'todos_utilizadores';
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
                const dadosFiltrados = resultado.dados.filter(u => u.aba !== 'Administrador');
                this.dadosCache.set(cacheKey, {
                    dados: dadosFiltrados,
                    timestamp: agora
                });
                this.dadosFiltrados = dadosFiltrados;
                this.renderizarTabela('todos', dadosFiltrados);
                this.inicializarFiltros('todos', dadosFiltrados);
                
                // Populate aba filter
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
            this.mostrarToast('Erro ao carregar todos os utilizadores', 'erro');
            this.renderizarTabela('todos', []);
        }
    }

    // ============================================================
    // RENDERIZAÇÃO DE TABELAS
    // ============================================================
    renderizarTabela(aba, dados) {
        const tbody = document.getElementById(`adm-table-body-${aba.toLowerCase()}`);
        if (!tbody) return;
        
        if (!dados || dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="adm-text-center">Nenhum registro encontrado</td></tr>';
            document.getElementById(`adm-contador-${aba.toLowerCase()}`).textContent = '0';
            return;
        }
        
        const config = ABAS_CONFIG[aba] || { temStatus: true, temFuncao: false, temTurma: false, temValor: true, temInstituicao: false };
        const registrosPorPagina = 20;
        const paginaActual = this.paginacao[aba]?.pagina || 1;
        const inicio = (paginaActual - 1) * registrosPorPagina;
        const paginados = dados.slice(inicio, inicio + registrosPorPagina);
        
        document.getElementById(`adm-contador-${aba.toLowerCase()}`).textContent = dados.length;
        
        tbody.innerHTML = paginados.map(user => this.renderizarLinhaTabela(user, aba, config)).join('');
        this.renderizarPaginacao(aba, dados.length, registrosPorPagina, paginaActual);
    }

    renderizarLinhaTabela(user, aba, config) {
        const statusBadge = config.temStatus ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>';
        const acoes = this.renderizarAcoes(user, aba, config);
        
        const colunasBase = `
            <td>${user.id || '-'}</td>
            <td>${this.escapeHtml(user.nome || '-')}</td>
            <td>${this.escapeHtml(user.email || '-')}</td>
            <td>${user.telefone || '-'}</td>
            <td>${user.regiao || '-'}</td>
        `;
        
        if (aba === 'Parceiros') {
            return `<tr>
                ${colunasBase}
                <td>${user.funcao || '-'}</td>
                <td>${statusBadge}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || 'Permanente'}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'Simuladores-Bibliotecas') {
            return `<tr>
                ${colunasBase}
                <td>${user.valorPago || '-'}</td>
                <td>${statusBadge}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || '-'}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'Cursos Online') {
            return `<tr>
                ${colunasBase}
                <td>${user.turma || '-'}</td>
                <td>${user.valorPago || '-'}</td>
                <td>${statusBadge}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || '-'}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'Formação Presencial') {
            return `<tr>
                ${colunasBase}
                <td>${user.instituicao || '-'}</td>
                <td>${user.turma || '-'}</td>
                <td>${user.valorPago || '-'}</td>
                <td>${statusBadge}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || '-'}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'Serviços Personalizados') {
            return `<tr>
                <td>${user.id || '-'}</td>
                <td>${this.escapeHtml(user.nome || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${user.telefone || '-'}</td>
                <td title="${this.escapeHtml(user.valorPago || '-')}">${this.truncarTexto(user.valorPago || '-', 30)}</td>
                <td title="${this.escapeHtml(user.descricao || '-')}">${this.truncarTexto(user.descricao || '-', 40)}</td>
                <td>${statusBadge}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'Usuários Não Pagos') {
            return `<tr>
                ${colunasBase}
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || '-'}</td>
                ${acoes}
            </tr>`;
        }
        
        if (aba === 'todos') {
            return `<tr>
                <td>${user.id || '-'}</td>
                <td>${this.escapeHtml(user.nome || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${user.telefone || '-'}</td>
                <td>${user.regiao || '-'}</td>
                <td>${user.tipo || user.aba || '-'}</td>
                <td>${user.aba || '-'}</td>
                <td>${user.status ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>'}</td>
                <td>${this.formatarData(user.dataRegistro)}</td>
                <td>${user.dataExpiracao || 'Permanente'}</td>
                ${acoes}
            </tr>`;
        }
        
        return `<tr>${colunasBase}<td colspan="4">${statusBadge}${acoes}</td></tr>`;
    }

    renderizarStatusBadge(status) {
        const config = STATUS_CONFIG[status] || { cor: 'var(--text-dim)', icone: 'fa-question', label: status || 'Desconhecido' };
        return `<span class="adm-badge" style="background: ${config.cor}20; color: ${config.cor}; border-color: ${config.cor}40;">
            <i class="fas ${config.icone}"></i> ${config.label}
        </span>`;
    }

    renderizarAcoes(user, aba, config) {
        const isServicos = aba === 'Serviços Personalizados';
        const isNaoPagos = aba === 'Usuários Não Pagos';
        const isParceiros = aba === 'Parceiros';
        
        let botoes = `<button class="adm-btn-icon adm-btn-view" onclick="adminPanel.abrirModalDetalhes('${user.id}', '${aba}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>`;
        
        if (isParceiros && user.status !== 'aprovado') {
            botoes += `<button class="adm-btn-icon adm-btn-approve" onclick="adminPanel.aprovarUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}')" title="Aprovar"><i class="fas fa-check-circle"></i></button>`;
        }
        
        if (!isNaoPagos && config.temStatus && user.status !== 'removido') {
            botoes += `<button class="adm-btn-icon adm-btn-block" onclick="adminPanel.bloquearUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}')" title="Bloquear"><i class="fas fa-ban"></i></button>`;
        }
        
        if (!isServicos && !isNaoPagos) {
            botoes += `<button class="adm-btn-icon adm-btn-renew" onclick="adminPanel.renovarAcesso('${user.email}', '${aba}')" title="Renovar acesso"><i class="fas fa-sync-alt"></i></button>`;
        }
        
        botoes += `<button class="adm-btn-icon adm-btn-delete" onclick="adminPanel.removerUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}')" title="Remover"><i class="fas fa-trash-alt"></i></button>`;
        
        return `<td class="adm-actions">${botoes}</td>`;
    }

    renderizarPaginacao(aba, total, porPagina, paginaActual) {
        const totalPaginas = Math.ceil(total / porPagina);
        const container = document.getElementById(`adm-paginacao-${aba.toLowerCase()}`);
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
                        this.paginacao[aba] = this.paginacao[aba] || {};
                        this.paginacao[aba].pagina = novaPagina;
                        this.aplicarFiltros(aba);
                    }
                });
            }
        });
    }

    mostrarSkeleton(aba) {
        const tbody = document.getElementById(`adm-table-body-${aba.toLowerCase()}`);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" class="adm-text-center"><div class="adm-skeleton"></div> Carregando...</td></tr>';
        }
    }

    // ============================================================
    // FILTROS E BUSCA
    // ============================================================
    inicializarFiltros(aba, dados) {
        const regioesUnicas = [...new Set(dados.map(u => u.regiao).filter(r => r))];
        const statusUnicos = [...new Set(dados.map(u => u.status).filter(s => s))];
        
        const regiaoSelect = document.getElementById(`adm-filtro-regiao-${aba.toLowerCase()}`);
        if (regiaoSelect) {
            regiaoSelect.innerHTML = '<option value="">Todas as regiões</option>' + 
                regioesUnicas.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        
        const statusSelect = document.getElementById(`adm-filtro-status-${aba.toLowerCase()}`);
        if (statusSelect && aba !== 'naopagos') {
            statusSelect.innerHTML = '<option value="">Todos os status</option>' + 
                statusUnicos.map(s => `<option value="${s}">${STATUS_CONFIG[s]?.label || s}</option>`).join('');
        }
    }

    aplicarFiltros(aba) {
        const cacheKey = `aba_${aba === 'todos' ? 'todos_utilizadores' : `aba_${aba}`}`;
        const cached = this.dadosCache.get(cacheKey);
        if (!cached) return;
        
        const filtros = this.estadoFiltros[aba] || {};
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
        
        if (filtros.status && aba !== 'naopagos') {
            dadosFiltrados = dadosFiltrados.filter(u => u.status === filtros.status);
        }
        
        if (aba === 'todos') {
            if (filtros.tipo) {
                dadosFiltrados = dadosFiltrados.filter(u => u.tipo === filtros.tipo);
            }
            if (filtros.aba) {
                dadosFiltrados = dadosFiltrados.filter(u => u.aba === filtros.aba);
            }
        }
        
        this.renderizarTabela(aba, dadosFiltrados);
        
        const contadorSpan = document.getElementById(`adm-contador-${aba.toLowerCase()}`);
        if (contadorSpan) contadorSpan.textContent = dadosFiltrados.length;
    }

    limparFiltros(aba) {
        this.estadoFiltros[aba] = {};
        
        const searchInput = document.getElementById(`adm-search-${aba.toLowerCase()}`);
        if (searchInput) searchInput.value = '';
        
        const regiaoSelect = document.getElementById(`adm-filtro-regiao-${aba.toLowerCase()}`);
        if (regiaoSelect) regiaoSelect.value = '';
        
        const statusSelect = document.getElementById(`adm-filtro-status-${aba.toLowerCase()}`);
        if (statusSelect) statusSelect.value = '';
        
        if (aba === 'todos') {
            const tipoSelect = document.getElementById('adm-filtro-tipo-todos');
            if (tipoSelect) tipoSelect.value = '';
            const abaSelect = document.getElementById('adm-filtro-aba-todos');
            if (abaSelect) abaSelect.value = '';
        }
        
        this.aplicarFiltros(aba);
    }

    // ============================================================
    // AÇÕES SOBRE UTILIZADORES
    // ============================================================
    async abrirModalDetalhes(id, aba) {
        const modal = document.getElementById('adm-modal-detalhes');
        const conteudo = document.getElementById('adm-detalhes-conteudo');
        conteudo.innerHTML = '<div class="adm-detalhes-loading">Carregando dados...</div>';
        modal.style.display = 'flex';
        
        try {
            const resultado = await this.chamarBackendGet({ acao: 'buscarUsuario', id: id, aba: aba });
            if (resultado.status === 'success' && resultado.dados) {
                const user = resultado.dados;
                conteudo.innerHTML = this.renderizarDetalhesUsuario(user, aba);
            } else {
                conteudo.innerHTML = '<div class="adm-detalhes-erro">Erro ao carregar dados do utilizador</div>';
            }
        } catch (error) {
            conteudo.innerHTML = '<div class="adm-detalhes-erro">Erro ao carregar dados do utilizador</div>';
        }
    }

    renderizarDetalhesUsuario(user, aba) {
        const config = ABAS_CONFIG[aba] || {};
        const campos = [
            { label: 'ID', valor: user.id },
            { label: 'Nome', valor: user.nome },
            { label: 'Email', valor: user.email },
            { label: 'Telefone', valor: user.telefone },
            { label: 'Data de Nascimento', valor: user.dataNascimento },
            { label: 'Sexo', valor: user.sexo },
            { label: 'País', valor: user.pais },
            { label: 'Região', valor: user.regiao },
            { label: 'Tipo de Usuário', valor: user.tipo || aba }
        ];
        
        if (config.temFuncao) campos.push({ label: 'Função', valor: user.funcao });
        if (config.temTurma) campos.push({ label: 'Turma', valor: user.turma });
        if (config.temInstituicao) campos.push({ label: 'Instituição', valor: user.instituicao });
        if (config.temValor) campos.push({ label: 'Valor Pago', valor: user.valorPago });
        if (user.descricao) campos.push({ label: 'Descrição', valor: user.descricao });
        
        campos.push(
            { label: 'Data de Registo', valor: this.formatarData(user.dataRegistro) },
            { label: 'Data de Expiração', valor: user.dataExpiracao || 'Permanente' }
        );
        
        return `
            <div class="adm-detalhes-grid">
                ${campos.map(campo => `
                    <div class="adm-detalhes-campo">
                        <label>${campo.label}</label>
                        <span>${this.escapeHtml(campo.valor || '-')}</span>
                    </div>
                `).join('')}
                <div class="adm-detalhes-campo adm-detalhes-status">
                    <label>Status</label>
                    ${this.renderizarStatusBadge(user.status)}
                </div>
            </div>
            <div class="adm-detalhes-acoes">
                ${this.renderizarAcoesDetalhes(user, aba)}
            </div>
        `;
    }

    renderizarAcoesDetalhes(user, aba) {
        const isParceiros = aba === 'Parceiros';
        const isServicos = aba === 'Serviços Personalizados';
        const isNaoPagos = aba === 'Usuários Não Pagos';
        
        let html = '';
        
        if (isParceiros && user.status !== 'aprovado') {
            html += `<button class="adm-btn adm-btn-success" onclick="adminPanel.aprovarUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Aprovar Parceiro</button>`;
        }
        
        if (!isNaoPagos && user.status !== 'removido') {
            html += `<button class="adm-btn adm-btn-warning" onclick="adminPanel.bloquearUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Bloquear Acesso</button>`;
        }
        
        if (!isServicos && !isNaoPagos) {
            html += `<button class="adm-btn adm-btn-primary" onclick="adminPanel.renovarAcesso('${user.email}', '${aba}'); adminPanel.fecharModal('adm-modal-detalhes')">Renovar Acesso</button>`;
        }
        
        if (isServicos && user.status !== 'negociacao' && user.status !== 'fechado') {
            html += `<button class="adm-btn adm-btn-info" onclick="adminPanel.mudarStatus('${user.id}', '${aba}', 'negociacao', '${this.escapeHtml(user.nome)}')">Marcar como Negociação</button>`;
        }
        
        if (isServicos && user.status !== 'fechado') {
            html += `<button class="adm-btn adm-btn-secondary" onclick="adminPanel.mudarStatus('${user.id}', '${aba}', 'fechado', '${this.escapeHtml(user.nome)}')">Marcar como Fechado</button>`;
        }
        
        html += `<button class="adm-btn adm-btn-danger" onclick="adminPanel.removerUtilizador('${user.id}', '${aba}', '${this.escapeHtml(user.nome)}'); adminPanel.fecharModal('adm-modal-detalhes')">Remover Utilizador</button>`;
        
        return html;
    }

    confirmarAcao(titulo, mensagem, callback) {
        document.getElementById('adm-confirm-titulo').textContent = titulo;
        document.getElementById('adm-confirm-mensagem').textContent = mensagem;
        this.aguardandoConfirmacao = { executar: callback };
        document.getElementById('adm-modal-confirmacao').style.display = 'flex';
    }

    async aprovarUtilizador(id, aba, nome) {
        this.confirmarAcao('Aprovar Utilizador', `Tens a certeza que pretendes APROVAR o utilizador "${nome}"?`, async () => {
            const payload = aba === 'Parceiros' 
                ? { acao: 'aprovar', id: id }
                : { acao: 'atualizarStatus', id: id, aba: aba, novoStatus: 'aprovado' };
            
            const resultado = await this.chamarBackendPost(payload);
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} aprovado com sucesso!`, 'sucesso');
                this.invalidarCache(aba);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao aprovar ${nome}`, 'erro');
            }
        });
    }

    async bloquearUtilizador(id, aba, nome) {
        this.confirmarAcao('Bloquear Utilizador', `Tens a certeza que pretendes BLOQUEAR o utilizador "${nome}"? O acesso será revogado.`, async () => {
            const resultado = await this.chamarBackendPost({ acao: 'atualizarStatus', id: id, aba: aba, novoStatus: 'removido' });
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} bloqueado com sucesso!`, 'sucesso');
                this.invalidarCache(aba);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao bloquear ${nome}`, 'erro');
            }
        });
    }

    async removerUtilizador(id, aba, nome) {
        this.confirmarAcao('Remover Utilizador', `Tens a certeza que pretendes REMOVER o utilizador "${nome}"? Esta acção não pode ser desfeita.`, async () => {
            const resultado = await this.chamarBackendPost({ acao: 'remover', id: id, aba: aba });
            if (resultado.status === 'success') {
                this.mostrarToast(`Utilizador ${nome} removido com sucesso!`, 'sucesso');
                this.invalidarCache(aba);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao remover ${nome}`, 'erro');
            }
        });
    }

    async mudarStatus(id, aba, novoStatus, nome) {
        const statusLabel = STATUS_CONFIG[novoStatus]?.label || novoStatus;
        this.confirmarAcao('Alterar Status', `Tens a certeza que pretendes alterar o status do utilizador "${nome}" para "${statusLabel}"?`, async () => {
            const resultado = await this.chamarBackendPost({ acao: 'atualizarStatus', id: id, aba: aba, novoStatus: novoStatus });
            if (resultado.status === 'success') {
                this.mostrarToast(`Status de ${nome} alterado para ${statusLabel}!`, 'sucesso');
                this.invalidarCache(aba);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao alterar status de ${nome}`, 'erro');
            }
        });
    }

    async renovarAcesso(email, aba) {
        this.confirmarAcao('Renovar Acesso', `Tens a certeza que pretendes RENOVAR o acesso do utilizador com email "${email}"? Será adicionado +90 dias.`, async () => {
            const resultado = await this.chamarBackendPost({ acao: 'renovar', email: email, aba: aba, novoComprovativo: 'Sim' });
            if (resultado.status === 'success') {
                this.mostrarToast(`Acesso renovado para ${email}!`, 'sucesso');
                this.invalidarCache(aba);
                await this.recarregarSecaoAtual();
            } else {
                this.mostrarToast(`Erro ao renovar acesso de ${email}`, 'erro');
            }
        });
    }

    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    invalidarCache(aba) {
        if (aba === 'todos') {
            this.dadosCache.delete('todos_utilizadores');
        } else {
            this.dadosCache.delete(`aba_${aba}`);
        }
    }

    async recarregarSecaoAtual() {
        await this.navegarPara(this.secaoActiva);
    }

    exportarCSV(aba) {
        const cacheKey = aba === 'todos' ? 'todos_utilizadores' : `aba_${aba}`;
        const cached = this.dadosCache.get(cacheKey);
        if (!cached || !cached.dados) {
            this.mostrarToast('Aguardando dados para exportar...', 'aviso');
            return;
        }
        
        let dados = cached.dados;
        const filtros = this.estadoFiltros[aba === 'todos' ? 'todos' : aba.toLowerCase()] || {};
        
        if (filtros.texto) {
            const textoLower = filtros.texto.toLowerCase();
            dados = dados.filter(u => (u.nome || '').toLowerCase().includes(textoLower) || (u.email || '').toLowerCase().includes(textoLower));
        }
        if (filtros.regiao) dados = dados.filter(u => u.regiao === filtros.regiao);
        if (filtros.status && aba !== 'naopagos') dados = dados.filter(u => u.status === filtros.status);
        
        const cabecalhos = this.getCabecalhosCSV(aba);
        const linhas = dados.map(user => this.userToCSVRow(user, aba));
        
        const csvContent = [cabecalhos, ...linhas].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const data = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `teca_${aba.toLowerCase().replace(/\s/g, '_')}_${data}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.mostrarToast(`Exportação concluída: ${linhas.length} registos`, 'sucesso');
    }

    getCabecalhosCSV(aba) {
        const base = ['ID', 'Nome', 'Email', 'Telefone', 'Região'];
        if (aba === 'Parceiros') return [...base, 'Função', 'Status', 'Data Registo', 'Expiração'];
        if (aba === 'Simuladores-Bibliotecas') return [...base, 'Valor Pago', 'Status', 'Data Registo', 'Expiração'];
        if (aba === 'Cursos Online') return [...base, 'Turma', 'Valor', 'Status', 'Data Registo', 'Expiração'];
        if (aba === 'Formação Presencial') return [...base, 'Instituição', 'Turma', 'Valor', 'Status', 'Data Registo', 'Expiração'];
        if (aba === 'Serviços Personalizados') return [...base, 'Proposta Valor', 'Descrição', 'Status', 'Data Registo'];
        if (aba === 'Usuários Não Pagos') return [...base, 'Data Registo', 'Expiração'];
        return [...base, 'Tipo', 'Planilha', 'Status', 'Data Registo', 'Expiração'];
    }

    userToCSVRow(user, aba) {
        const base = [user.id || '', user.nome || '', user.email || '', user.telefone || '', user.regiao || ''];
        if (aba === 'Parceiros') return [...base, user.funcao || '', user.status || '', user.dataRegistro || '', user.dataExpiracao || ''];
        if (aba === 'Simuladores-Bibliotecas') return [...base, user.valorPago || '', user.status || '', user.dataRegistro || '', user.dataExpiracao || ''];
        if (aba === 'Cursos Online') return [...base, user.turma || '', user.valorPago || '', user.status || '', user.dataRegistro || '', user.dataExpiracao || ''];
        if (aba === 'Formação Presencial') return [...base, user.instituicao || '', user.turma || '', user.valorPago || '', user.status || '', user.dataRegistro || '', user.dataExpiracao || ''];
        if (aba === 'Serviços Personalizados') return [...base, user.valorPago || '', user.descricao || '', user.status || '', user.dataRegistro || ''];
        if (aba === 'Usuários Não Pagos') return [...base, user.dataRegistro || '', user.dataExpiracao || ''];
        return [...base, user.tipo || '', user.aba || '', user.status || '', user.dataRegistro || '', user.dataExpiracao || ''];
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
        document.getElementById(id).style.display = 'none';
    }
}

// Inicializar
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
    window.adminPanel = adminPanel;
});

// ============================================================
// TECA CAPITAL EDTECH - PLUGIN DE INSIGHT ADMINISTRATIVO
// ============================================================
// Versão: 1.0
// Descrição: Ferramenta avançada para visualização e análise
// de todos os dados da plataforma em tempo real
// ============================================================

class TecaInsight {
    constructor(config = {}) {
        // Configuração
        this.apiUrl = config.apiUrl || 'https://script.google.com/macros/s/AKfycbzeahMxXzXIDou1hTshRYLmSPeHRFx5RmQvEe5iFP717iKbvyTt1covpO-ydpzmiD_Abg/exec';
        this.autoRefresh = config.autoRefresh !== false;
        this.refreshInterval = config.refreshInterval || 30000;
        this.debug = config.debug || false;
        
        // Estado
        this.dados = {
            todos: [],
            porAba: {},
            estatisticas: {}
        };
        this.filtros = {};
        this.refreshTimer = null;
        this.isLoading = false;
        this.modalAberto = false;
        
        // Inicializar
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
        // Botão flutuante
        const btn = document.createElement('div');
        btn.id = 'teca-insight-btn';
        btn.innerHTML = '<i class="fas fa-chart-line"></i><span>Insight</span>';
        btn.title = 'Abrir Painel de Inspeção de Dados';
        btn.onclick = () => this.abrirModal();
        document.body.appendChild(btn);
        
        // Estilos do botão
        const styleBtn = document.createElement('style');
        styleBtn.textContent = `
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
        document.head.appendChild(styleBtn);
        
        // Criar modal
        this.criarModal();
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
        
        // Estilos do modal
        this.adicionarEstilos();
        
        // Eventos
        document.getElementById('teca-insight-close')?.addEventListener('click', () => this.fecharModal());
        document.getElementById('teca-insight-refresh')?.addEventListener('click', () => this.carregarDados(true));
        
        document.querySelectorAll('.teca-insight-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.mudarTab(tabId);
            });
        });
        
        // Fechar ao clicar fora
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
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
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
                font-size: 0.8rem;
                color: #888888;
                margin-bottom: 0.5rem;
            }
            .teca-insight-stat-card .value {
                font-size: 2rem;
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
            }
            
            /* Filtros */
            .teca-insight-filtros-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
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
                background: #111111;
                border-radius: 12px;
                padding: 1rem;
                font-family: monospace;
                font-size: 0.75rem;
                max-height: 400px;
                overflow-y: auto;
            }
            .teca-insight-log-entry {
                padding: 0.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                color: #888888;
            }
            .teca-insight-log-entry.error {
                color: #d63031;
            }
            .teca-insight-log-entry.success {
                color: #00b45a;
            }
            .teca-insight-log-entry.warning {
                color: #f39c12;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
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
        
        // Recarregar conteúdo específico
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
        // Filtrar administrador
        this.dados.todos = rawData.filter(u => u.aba !== 'Administrador');
        
        // Organizar por aba
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
        
        // Calcular estatísticas
        this.calcularEstatisticas();
        
        // Renderizar dashboard
        this.renderizarDashboard();
        
        // Atualizar total
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
            // Contagem por aba
            stats.porAba[user.aba] = (stats.porAba[user.aba] || 0) + 1;
            
            // Contagem por status
            if (user.status) {
                stats.porStatus[user.status] = (stats.porStatus[user.status] || 0) + 1;
            }
            
            // Contagem por região
            if (user.regiao) {
                stats.porRegiao[user.regiao] = (stats.porRegiao[user.regiao] || 0) + 1;
            }
            
            // Últimos 30 dias
            if (user.dataRegistro) {
                const dataReg = this.parseData(user.dataRegistro);
                if (dataReg && dataReg >= trintaDiasAtras) {
                    stats.ultimos30Dias++;
                }
            }
            
            // Expiração
            if (user.dataExpiracao && user.dataExpiracao !== 'Permanente') {
                const dataExp = this.parseData(user.dataExpiracao);
                if (dataExp) {
                    if (dataExp < hoje) {
                        stats.expirados++;
                    } else if (dataExp <= trintaDiasFrente) {
                        stats.aExpirar30Dias++;
                    }
                }
            }
        });
        
        this.dados.estatisticas = stats;
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
    // RENDERIZAÇÃO DO DASHBOARD
    // ============================================================
    renderizarDashboard() {
        const container = document.getElementById('teca-insight-dashboard');
        if (!container) return;
        
        const stats = this.dados.estatisticas;
        
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
            
            <div class="teca-insight-stat-card">
                <h3><i class="fas fa-chart-line"></i> Evolução Mensal (Últimos 6 meses)</h3>
                <div id="teca-insight-grafico"></div>
            </div>
        `;
        
        this.renderizarGraficoEvolucao();
    }
    
    renderizarGraficoEvolucao() {
        const container = document.getElementById('teca-insight-grafico');
        if (!container) return;
        
        // Agrupar por mês
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
            <div style="display: flex; align-items: flex-end; gap: 1rem; height: 200px; margin-top: 1rem;">
                ${dadosGrafico.map(mes => `
                    <div style="flex: 1; text-align: center;">
                        <div style="background: rgb(214, 174, 100); height: ${(mes.total / maxValor) * 180}px; width: 100%; border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                        <div style="font-size: 0.7rem; margin-top: 0.5rem; color: #888;">${mes.nome}</div>
                        <div style="font-size: 0.8rem; font-weight: bold; color: rgb(214, 174, 100);">${mes.total}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // ============================================================
    // RENDERIZAÇÃO DE TABELAS
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
                                    <tr>
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
        
        // Eventos das abas secundárias
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
                        ${Object.keys(this.dados.porAba).map(aba => `<option value="${aba}">${aba}</option>`).join('')}
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
            </div>
        `;
        
        // Eventos
        document.getElementById('insight-aplicar-filtros')?.addEventListener('click', () => this.aplicarFiltros());
        document.getElementById('insight-limpar-filtros')?.addEventListener('click', () => this.limparFiltros());
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
    
    limparFiltros() {
        const inputs = ['insight-search-text', 'insight-filter-regiao', 'insight-filter-status', 'insight-filter-aba', 'insight-filter-data-inicio', 'insight-filter-data-fim'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this.renderizarResultadosFiltrados(this.dados.todos);
    }
    
    renderizarResultadosFiltrados(resultados) {
        const tbody = document.querySelector('#insight-resultados-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = resultados.map(user => `
            <tr onclick="window.tecaInsight?.verDetalhesUsuario(${user.id}, '${user.aba}')" style="cursor: pointer;">
                <td>${user.id || '-'}</td>
                <td>${this.escapeHtml(user.nome || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${user.regiao || '-'}</td>
                <td>${user.aba || '-'}</td>
                <td>${this.renderizarBadgeStatus(user.status)}</td>
            </tr>
        `).join('');
        
        this.registrarLog(`Filtro aplicado: ${resultados.length} resultados encontrados`, 'info');
    }
    
    // ============================================================
    // EXPORTAÇÃO DE DADOS
    // ============================================================
    renderizarExportacao() {
        const container = document.getElementById('teca-insight-exportar');
        if (!container) return;
        
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
                        ${Object.keys(this.dados.porAba).map(aba => `<option value="${aba}">${aba}</option>`).join('')}
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
        const relatorio = {
            dataGeracao: new Date().toISOString(),
            totalUtilizadores: stats.total,
            distribuicaoCategoria: stats.porAba,
            distribuicaoStatus: stats.porStatus,
            distribuicaoRegiao: stats.porRegiao,
            novosUltimos30Dias: stats.ultimos30Dias,
            acessosExpirados: stats.expirados,
            aExpirar30Dias: stats.aExpirar30Dias,
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
    // LOGS DO SISTEMA
    // ============================================================
    renderizarLogs() {
        const container = document.getElementById('teca-insight-logs');
        if (!container) return;
        
        const logs = this.logs || [];
        
        container.innerHTML = `
            <div class="teca-insight-logs-container">
                ${logs.map(log => `
                    <div class="teca-insight-log-entry ${log.tipo}">
                        <span style="color: #888;">[${log.timestamp}]</span>
                        <span>${log.mensagem}</span>
                    </div>
                `).join('')}
                ${logs.length === 0 ? '<div class="teca-insight-log-entry">Nenhum log registado</div>' : ''}
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                <button id="insight-clear-logs" class="teca-insight-btn" style="background: #161616;">Limpar Logs</button>
                <button id="insight-export-logs" class="teca-insight-btn">Exportar Logs</button>
            </div>
        `;
        
        document.getElementById('insight-clear-logs')?.addEventListener('click', () => {
            this.logs = [];
            this.renderizarLogs();
            this.registrarLog('Logs limpos', 'info');
        });
        
        document.getElementById('insight-export-logs')?.addEventListener('click', () => this.exportarLogs());
    }
    
    registrarLog(mensagem, tipo = 'info') {
        if (!this.logs) this.logs = [];
        this.logs.unshift({
            timestamp: new Date().toLocaleString('pt-PT'),
            mensagem: mensagem,
            tipo: tipo
        });
        
        if (this.logs.length > 100) this.logs.pop();
        
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
        if (user) {
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
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================
let tecaInsight;
document.addEventListener('DOMContentLoaded', () => {
    tecaInsight = new TecaInsight({ debug: false });
    window.tecaInsight = tecaInsight;
});


/**
 * ========================================================
 * TECA CAPITAL EDTECH - PLUGIN DE CORREÇÃO PARA PAINEL ADMIN
 * Versão: 1.0
 * Descrição: Corrige e completa funcionalidades do painel admin
 * ========================================================
 * 
 * PROBLEMAS RESOLVIDOS:
 * 1. Redirecionamento correto dos cards estatísticos
 * 2. Dados completos no dashboard de parceiros (telefone, região, função)
 * 3. Busca de dados em todas as tabelas (simuladores, cursos, formação, serviços, não pagos)
 * 4. Filtros funcionando em todas as tabelas
 * 5. Modal de detalhes com dados completos
 * 6. Ações (aprovar, bloquear, remover, renovar) funcionando em todas as tabelas
 * 7. Aprovação de usuários com status "aguardando validação"
 * 8. Estatísticas do dashboard com dados reais do banco
 * ========================================================
 */

(function() {
    'use strict';
    
    // Aguardar o AdminPanel ser inicializado
    const waitForAdminPanel = setInterval(() => {
        if (window.adminPanel && window.adminPanel.constructor === AdminPanel) {
            clearInterval(waitForAdminPanel);
            console.log('[AdminFix] Plugin de correção iniciado');
            
            // Aplicar todas as correções
            aplicarCorrecoes();
        }
    }, 100);
    
    function aplicarCorrecoes() {
        // 1. Corrigir redirecionamento dos cards estatísticos
        corrigirRedirecionamentoCards();
        
        // 2. Melhorar renderização das tabelas
        melhorarRenderizacaoTabelas();
        
        // 3. Corrigir carregamento de dados por aba
        corrigirCarregamentoDados();
        
        // 4. Corrigir modal de detalhes
        corrigirModalDetalhes();
        
        // 5. Melhorar ações sobre utilizadores
        melhorarAcoesUtilizadores();
        
        // 6. Forçar atualização do dashboard com dados reais
        forcarAtualizacaoDashboard();
        
        // 7. Adicionar observer para atualizar tabelas quando necessário
        adicionarObserverTabelas();
        
        console.log('[AdminFix] Todas as correções aplicadas com sucesso');
    }
    
    // ============================================================
    // 1. CORREÇÃO DE REDIRECIONAMENTO DOS CARDS
    // ============================================================
    function corrigirRedirecionamentoCards() {
        // Sobrescrever o método renderizarCards original
        const originalRenderizarCards = window.adminPanel.renderizarCards;
        
        window.adminPanel.renderizarCards = function(stats) {
            const grid = document.getElementById('adm-stats-grid');
            if (!grid) return;
            
            const cards = [
                { valor: stats.total, label: 'Total de Utilizadores', icone: 'fa-users', cor: 'gold', secao: 'todos' },
                { valor: stats.parceiros, label: 'Parceiros', icone: 'fa-handshake', cor: 'gold', secao: 'parceiros' },
                { valor: stats.aguardando, label: 'Aguardando Validação', icone: 'fa-clock', cor: 'gold', secao: 'parceiros' },
                { valor: stats.simuladores || 0, label: 'Simuladores e Biblioteca', icone: 'fa-calculator', cor: 'blue', secao: 'simuladores' },
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
            
            // Adicionar evento de clique nos cards
            grid.querySelectorAll('.adm-stat-card').forEach(card => {
                card.addEventListener('click', () => {
                    const secao = card.dataset.secao;
                    if (secao) {
                        // Chamar navegarPara diretamente
                        window.adminPanel.navegarPara(secao);
                    }
                });
            });
        };
        
        console.log('[AdminFix] Cards corrigidos');
    }
    
    // ============================================================
    // 2. MELHORAR RENDERIZAÇÃO DAS TABELAS
    // ============================================================
    function melhorarRenderizacaoTabelas() {
        // Sobrescrever renderizarLinhaTabela para garantir dados completos
        const originalRenderizarLinhaTabela = window.adminPanel.renderizarLinhaTabela;
        
        window.adminPanel.renderizarLinhaTabela = function(user, aba, config) {
            const statusBadge = config.temStatus ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>';
            const acoes = this.renderizarAcoes(user, aba, config);
            
            // Garantir que dados essenciais estão presentes
            const telefone = user.telefone || user.TELEFONE || user['Número de Telefone'] || '-';
            const regiao = user.regiao || user.REGIAO || user.Região || '-';
            const dataRegistro = this.formatarData(user.dataRegistro || user['Data de Registro']);
            const dataExpiracao = user.dataExpiracao || user['Data Para Expirar o Acesso'] || 'Permanente';
            const nome = this.escapeHtml(user.nome || user['Nome do Usuário'] || '-');
            const email = this.escapeHtml(user.email || user.Email || '-');
            const funcao = user.funcao || user.FUNCAO || user.Função || '-';
            const valorPago = user.valorPago || user['Valor Pago'] || '-';
            const turma = user.turma || user.TURMA || user.Turma || '-';
            const instituicao = user.instituicao || user.INSTITUICAO || user['Instituição Associada'] || '-';
            const descricao = user.descricao || user.DESCRICAO || user.Descrição || '-';
            
            const colunasBase = `
                <td>${user.id || '-'}</td>
                <td>${nome}</td>
                <td>${email}</td>
                <td>${telefone}</td>
                <td>${regiao}</td>
            `;
            
            if (aba === 'Parceiros') {
                return `<tr>
                    ${colunasBase}
                    <td>${funcao}</td>
                    <td>${statusBadge}</td>
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'Simuladores-Bibliotecas') {
                return `<tr>
                    ${colunasBase}
                    <td>${valorPago}</td>
                    <td>${statusBadge}</td>
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'Cursos Online') {
                return `<tr>
                    ${colunasBase}
                    <td>${turma}</td>
                    <td>${valorPago}</td>
                    <td>${statusBadge}</td>
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'Formação Presencial') {
                return `<tr>
                    ${colunasBase}
                    <td>${instituicao}</td>
                    <td>${turma}</td>
                    <td>${valorPago}</td>
                    <td>${statusBadge}</td>
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'Serviços Personalizados') {
                return `<tr>
                    <td>${user.id || '-'}</td>
                    <td>${nome}</td>
                    <td>${email}</td>
                    <td>${telefone}</td>
                    <td title="${valorPago}">${valorPago.length > 30 ? valorPago.substring(0, 30) + '...' : valorPago}</td>
                    <td title="${descricao}">${descricao.length > 40 ? descricao.substring(0, 40) + '...' : descricao}</td>
                    <td>${statusBadge}</td>
                    <td>${dataRegistro}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'Usuários Não Pagos') {
                return `<tr>
                    ${colunasBase}
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            if (aba === 'todos') {
                return `<tr>
                    <td>${user.id || '-'}</td>
                    <td>${nome}</td>
                    <td>${email}</td>
                    <td>${telefone}</td>
                    <td>${regiao}</td>
                    <td>${user.tipo || user.aba || '-'}</td>
                    <td>${user.aba || '-'}</td>
                    <td>${user.status ? this.renderizarStatusBadge(user.status) : '<span class="adm-badge adm-badge-neutral">N/A</span>'}</td>
                    <td>${dataRegistro}</td>
                    <td>${dataExpiracao}</td>
                    ${acoes}
                </tr>`;
            }
            
            return `<tr>${colunasBase}<td colspan="4">${statusBadge}${acoes}</td></tr>`;
        };
        
        console.log('[AdminFix] Renderização de tabelas melhorada');
    }
    
    // ============================================================
    // 3. CORRIGIR CARREGAMENTO DE DADOS POR ABA
    // ============================================================
    function corrigirCarregamentoDados() {
        // Sobrescrever carregarDadosAba para garantir dados corretos
        const originalCarregarDadosAba = window.adminPanel.carregarDadosAba;
        
        window.adminPanel.carregarDadosAba = async function(aba, forceReload = false) {
            const cacheKey = `aba_${aba}`;
            const agora = Date.now();
            
            if (!forceReload && this.dadosCache.has(cacheKey)) {
                const cached = this.dadosCache.get(cacheKey);
                if (agora - cached.timestamp < 60000) {
                    this.dadosFiltrados = cached.dados;
                    this.renderizarTabela(aba, cached.dados);
                    this.inicializarFiltros(aba, cached.dados);
                    return;
                }
            }
            
            this.mostrarSkeleton(aba);
            
            try {
                // Chamar listar com filtro de aba
                const resultado = await this.chamarBackendGet({ acao: 'listar', aba: aba });
                if (resultado.status === 'success' && resultado.dados) {
                    // Normalizar dados para garantir campos consistentes
                    const dadosNormalizados = resultado.dados.map(user => ({
                        ...user,
                        telefone: user.telefone || user['Número de Telefone'] || user.TELEFONE || '-',
                        regiao: user.regiao || user.REGIAO || user.Região || '-',
                        funcao: user.funcao || user.FUNCAO || user.Função || '-',
                        dataRegistro: user.dataRegistro || user['Data de Registro'],
                        dataExpiracao: user.dataExpiracao || user['Data Para Expirar o Acesso'] || 'Permanente',
                        valorPago: user.valorPago || user['Valor Pago'] || '-',
                        turma: user.turma || user.TURMA || user.Turma || '-',
                        instituicao: user.instituicao || user.INSTITUICAO || user['Instituição Associada'] || '-',
                        descricao: user.descricao || user.DESCRICAO || user.Descrição || '-'
                    }));
                    
                    this.dadosCache.set(cacheKey, {
                        dados: dadosNormalizados,
                        timestamp: agora
                    });
                    this.dadosFiltrados = dadosNormalizados;
                    this.renderizarTabela(aba, dadosNormalizados);
                    this.inicializarFiltros(aba, dadosNormalizados);
                } else {
                    this.mostrarToast(`Erro ao carregar ${aba}`, 'erro');
                    this.renderizarTabela(aba, []);
                }
            } catch (error) {
                console.error(`Erro ao carregar ${aba}:`, error);
                this.mostrarToast(`Erro ao carregar ${aba}`, 'erro');
                this.renderizarTabela(aba, []);
            }
        };
        
        // Sobrescrever carregarTodosUtilizadores
        const originalCarregarTodosUtilizadores = window.adminPanel.carregarTodosUtilizadores;
        
        window.adminPanel.carregarTodosUtilizadores = async function(forceReload = false) {
            const cacheKey = 'todos_utilizadores';
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
                    const dadosFiltrados = resultado.dados.filter(u => u.aba !== 'Administrador');
                    
                    // Normalizar dados
                    const dadosNormalizados = dadosFiltrados.map(user => ({
                        ...user,
                        telefone: user.telefone || user['Número de Telefone'] || '-',
                        regiao: user.regiao || user.REGIAO || '-'
                    }));
                    
                    this.dadosCache.set(cacheKey, {
                        dados: dadosNormalizados,
                        timestamp: agora
                    });
                    this.dadosFiltrados = dadosNormalizados;
                    this.renderizarTabela('todos', dadosNormalizados);
                    this.inicializarFiltros('todos', dadosNormalizados);
                    
                    // Populate aba filter
                    const abasUnicas = [...new Set(dadosNormalizados.map(u => u.aba))];
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
        };
        
        console.log('[AdminFix] Carregamento de dados corrigido');
    }
    
    // ============================================================
    // 4. CORRIGIR MODAL DE DETALHES
    // ============================================================
    function corrigirModalDetalhes() {
        // Sobrescrever renderizarDetalhesUsuario
        const originalRenderizarDetalhesUsuario = window.adminPanel.renderizarDetalhesUsuario;
        
        window.adminPanel.renderizarDetalhesUsuario = function(user, aba) {
            const config = ABAS_CONFIG[aba] || {};
            
            // Extrair todos os campos possíveis
            const campos = [
                { label: 'ID', valor: user.id },
                { label: 'Nome', valor: user.nome || user['Nome do Usuário'] },
                { label: 'Email', valor: user.email || user.Email },
                { label: 'Telefone', valor: user.telefone || user['Número de Telefone'] },
                { label: 'Data de Nascimento', valor: user.dataNascimento || user['Data de Nascimento'] },
                { label: 'Sexo', valor: user.sexo || user.Sexo },
                { label: 'País', valor: user.pais || user.País },
                { label: 'Região', valor: user.regiao || user.Região },
                { label: 'Tipo de Usuário', valor: user.tipo || user['Tipo de Usuario'] || aba }
            ];
            
            if (config.temFuncao || aba === 'Parceiros') campos.push({ label: 'Função', valor: user.funcao || user.FUNCAO || user.Função });
            if (config.temTurma || aba === 'Cursos Online' || aba === 'Formação Presencial') campos.push({ label: 'Turma', valor: user.turma || user.TURMA || user.Turma });
            if (config.temInstituicao || aba === 'Formação Presencial') campos.push({ label: 'Instituição', valor: user.instituicao || user.INSTITUICAO || user['Instituição Associada'] });
            if (config.temValor || aba !== 'Usuários Não Pagos') campos.push({ label: 'Valor Pago', valor: user.valorPago || user['Valor Pago'] });
            if (user.descricao || aba === 'Serviços Personalizados') campos.push({ label: 'Descrição', valor: user.descricao || user.DESCRICAO || user.Descrição });
            
            campos.push(
                { label: 'Data de Registo', valor: this.formatarData(user.dataRegistro || user['Data de Registro']) },
                { label: 'Data de Expiração', valor: user.dataExpiracao || user['Data Para Expirar o Acesso'] || 'Permanente' }
            );
            
            return `
                <div class="adm-detalhes-grid">
                    ${campos.map(campo => `
                        <div class="adm-detalhes-campo">
                            <label>${campo.label}</label>
                            <span>${this.escapeHtml(campo.valor || '-')}</span>
                        </div>
                    `).join('')}
                    <div class="adm-detalhes-campo adm-detalhes-status">
                        <label>Status</label>
                        ${this.renderizarStatusBadge(user.status)}
                    </div>
                </div>
                <div class="adm-detalhes-acoes">
                    ${this.renderizarAcoesDetalhes(user, aba)}
                </div>
            `;
        };
        
        // Sobrescrever abrirModalDetalhes para garantir busca correta
        const originalAbrirModalDetalhes = window.adminPanel.abrirModalDetalhes;
        
        window.adminPanel.abrirModalDetalhes = async function(id, aba) {
            const modal = document.getElementById('adm-modal-detalhes');
            const conteudo = document.getElementById('adm-detalhes-conteudo');
            conteudo.innerHTML = '<div class="adm-detalhes-loading">Carregando dados...</div>';
            modal.style.display = 'flex';
            
            try {
                // Buscar dados do utilizador
                let user = null;
                const cacheKey = aba === 'todos' ? 'todos_utilizadores' : `aba_${aba}`;
                const cached = this.dadosCache.get(cacheKey);
                
                if (cached && cached.dados) {
                    user = cached.dados.find(u => u.id == id);
                }
                
                if (!user) {
                    const resultado = await this.chamarBackendGet({ acao: 'buscarUsuario', id: id, aba: aba });
                    if (resultado.status === 'success' && resultado.dados) {
                        user = resultado.dados;
                    }
                }
                
                if (user) {
                    conteudo.innerHTML = this.renderizarDetalhesUsuario(user, aba);
                } else {
                    conteudo.innerHTML = '<div class="adm-detalhes-erro">Utilizador não encontrado</div>';
                }
            } catch (error) {
                console.error('Erro ao buscar detalhes:', error);
                conteudo.innerHTML = '<div class="adm-detalhes-erro">Erro ao carregar dados do utilizador</div>';
            }
        };
        
        console.log('[AdminFix] Modal de detalhes corrigido');
    }
    
    // ============================================================
    // 5. MELHORAR AÇÕES SOBRE UTILIZADORES
    // ============================================================
    function melhorarAcoesUtilizadores() {
        // Garantir que aprovarUtilizador funciona para todos os tipos
        const originalAprovarUtilizador = window.adminPanel.aprovarUtilizador;
        
        window.adminPanel.aprovarUtilizador = function(id, aba, nome) {
            this.confirmarAcao('Aprovar Utilizador', `Tens a certeza que pretendes APROVAR o utilizador "${nome}"?`, async () => {
                let payload;
                
                if (aba === 'Parceiros') {
                    payload = { acao: 'aprovar', id: id };
                } else if (aba === 'Serviços Personalizados') {
                    payload = { acao: 'atualizarStatus', id: id, aba: aba, novoStatus: 'fechado' };
                } else {
                    payload = { acao: 'atualizarStatus', id: id, aba: aba, novoStatus: 'aprovado' };
                }
                
                const resultado = await this.chamarBackendPost(payload);
                if (resultado.status === 'success') {
                    this.mostrarToast(`Utilizador ${nome} aprovado com sucesso!`, 'sucesso');
                    this.invalidarCache(aba);
                    await this.recarregarSecaoAtual();
                } else {
                    this.mostrarToast(`Erro ao aprovar ${nome}: ${resultado.mensagem || 'Erro desconhecido'}`, 'erro');
                }
            });
        };
        
        // Melhorar renovarAcesso
        const originalRenovarAcesso = window.adminPanel.renovarAcesso;
        
        window.adminPanel.renovarAcesso = function(email, aba) {
            this.confirmarAcao('Renovar Acesso', `Tens a certeza que pretendes RENOVAR o acesso do utilizador com email "${email}"? Será adicionado +90 dias.`, async () => {
                const resultado = await this.chamarBackendPost({ acao: 'renovar', email: email, aba: aba, novoComprovativo: 'Sim' });
                if (resultado.status === 'success') {
                    this.mostrarToast(`Acesso renovado para ${email}!`, 'sucesso');
                    this.invalidarCache(aba);
                    await this.recarregarSecaoAtual();
                } else {
                    this.mostrarToast(`Erro ao renovar acesso: ${resultado.mensagem || 'Erro desconhecido'}`, 'erro');
                }
            });
        };
        
        console.log('[AdminFix] Ações de utilizadores corrigidas');
    }
    
    // ============================================================
    // 6. FORÇAR ATUALIZAÇÃO DO DASHBOARD
    // ============================================================
    function forcarAtualizacaoDashboard() {
        // Sobrescrever carregarDashboard
        const originalCarregarDashboard = window.adminPanel.carregarDashboard;
        
        window.adminPanel.carregarDashboard = async function() {
            try {
                const resultado = await this.chamarBackendGet({ acao: 'listar' });
                if (resultado.status === 'success' && resultado.dados) {
                    this.calcularEstatisticas(resultado.dados);
                    this.renderizarUltimosCadastros(resultado.dados);
                    this.renderizarGrafico(resultado.dados);
                } else {
                    this.mostrarToast('Erro ao carregar dashboard', 'erro');
                }
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
                this.mostrarToast('Erro ao carregar dashboard', 'erro');
            }
        };
        
        // Sobrescrever calcularEstatisticas
        const originalCalcularEstatisticas = window.adminPanel.calcularEstatisticas;
        
        window.adminPanel.calcularEstatisticas = function(dados) {
            const stats = {
                total: 0,
                parceiros: 0,
                simuladores: 0,
                cursos: 0,
                formacao: 0,
                servicos: 0,
                naopagos: 0,
                aguardando: 0
            };
            
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
                }
            });
            
            this.renderizarCards(stats);
        };
        
        // Forçar atualização do dashboard
        setTimeout(() => {
            if (window.adminPanel && window.adminPanel.secaoActiva === 'dashboard') {
                window.adminPanel.carregarDashboard();
            }
        }, 1000);
        
        console.log('[AdminFix] Dashboard corrigido com dados reais');
    }
    
    // ============================================================
    // 7. ADICIONAR OBSERVER PARA ATUALIZAR TABELAS
    // ============================================================
    function adicionarObserverTabelas() {
        // Observer para recarregar dados quando a aba é ativada
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('active')) {
                        const secaoId = target.id;
                        if (secaoId && window.adminPanel) {
                            const secao = secaoId.replace('adm-secao-', '');
                            if (secao !== 'dashboard' && secao !== window.adminPanel.secaoActiva) {
                                // Recarregar dados da secao
                                setTimeout(() => {
                                    switch(secao) {
                                        case 'parceiros':
                                            window.adminPanel.carregarDadosAba('Parceiros', true);
                                            break;
                                        case 'simuladores':
                                            window.adminPanel.carregarDadosAba('Simuladores-Bibliotecas', true);
                                            break;
                                        case 'cursos':
                                            window.adminPanel.carregarDadosAba('Cursos Online', true);
                                            break;
                                        case 'formacao':
                                            window.adminPanel.carregarDadosAba('Formação Presencial', true);
                                            break;
                                        case 'servicos':
                                            window.adminPanel.carregarDadosAba('Serviços Personalizados', true);
                                            break;
                                        case 'naopagos':
                                            window.adminPanel.carregarDadosAba('Usuários Não Pagos', true);
                                            break;
                                        case 'todos':
                                            window.adminPanel.carregarTodosUtilizadores(true);
                                            break;
                                    }
                                }, 100);
                            }
                        }
                    }
                }
            });
        });
        
        // Observar mudanças nas seções
        const secoes = document.querySelectorAll('.adm-secao');
        secoes.forEach(secao => {
            observer.observe(secao, { attributes: true });
        });
        
        console.log('[AdminFix] Observer de tabelas adicionado');
    }
    
    // ============================================================
    // 8. CORRIGIR FILTROS NAS TABELAS
    // ============================================================
    function corrigirFiltros() {
        // Adicionar event listeners para filtros de região e status
        const adicionarEventListenersFiltros = () => {
            const abas = ['parceiros', 'simuladores', 'cursos', 'formacao', 'servicos', 'naopagos', 'todos'];
            
            abas.forEach(aba => {
                const regiaoSelect = document.getElementById(`adm-filtro-regiao-${aba}`);
                const statusSelect = document.getElementById(`adm-filtro-status-${aba}`);
                const tipoSelect = document.getElementById(`adm-filtro-tipo-${aba}`);
                const abaSelect = document.getElementById(`adm-filtro-aba-${aba}`);
                
                if (regiaoSelect) {
                    regiaoSelect.addEventListener('change', () => {
                        if (window.adminPanel) {
                            window.adminPanel.estadoFiltros[aba] = window.adminPanel.estadoFiltros[aba] || {};
                            window.adminPanel.estadoFiltros[aba].regiao = regiaoSelect.value;
                            window.adminPanel.aplicarFiltros(aba);
                        }
                    });
                }
                
                if (statusSelect) {
                    statusSelect.addEventListener('change', () => {
                        if (window.adminPanel) {
                            window.adminPanel.estadoFiltros[aba] = window.adminPanel.estadoFiltros[aba] || {};
                            window.adminPanel.estadoFiltros[aba].status = statusSelect.value;
                            window.adminPanel.aplicarFiltros(aba);
                        }
                    });
                }
                
                if (tipoSelect && aba === 'todos') {
                    tipoSelect.addEventListener('change', () => {
                        if (window.adminPanel) {
                            window.adminPanel.estadoFiltros.todos = window.adminPanel.estadoFiltros.todos || {};
                            window.adminPanel.estadoFiltros.todos.tipo = tipoSelect.value;
                            window.adminPanel.aplicarFiltros('todos');
                        }
                    });
                }
                
                if (abaSelect && aba === 'todos') {
                    abaSelect.addEventListener('change', () => {
                        if (window.adminPanel) {
                            window.adminPanel.estadoFiltros.todos = window.adminPanel.estadoFiltros.todos || {};
                            window.adminPanel.estadoFiltros.todos.aba = abaSelect.value;
                            window.adminPanel.aplicarFiltros('todos');
                        }
                    });
                }
            });
        };
        
        // Executar após um pequeno delay para garantir que o DOM está pronto
        setTimeout(adicionarEventListenersFiltros, 500);
        
        console.log('[AdminFix] Filtros corrigidos');
    }
    
    // Iniciar correção de filtros após um delay
    setTimeout(corrigirFiltros, 1000);
    
})();