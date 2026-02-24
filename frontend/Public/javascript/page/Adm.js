// ============================================
// ADMIN PANEL - TECA CAPITAL
// SISTEMA COMPLETO COM PERMISSÕES (MASTER VS LÍDER REGIONAL)
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURAÇÕES GLOBAIS
    // ============================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7L5XowJYawTYChVsG-k_FtO0ieen4ilQd9UpDjnilcgIy3uLSRdIg_5rG3QY6blwr5Q/exec";
    
    const SHEET_NAMES = {
        CADASTRO: 'Cadastro/Logion',
        SIMULADORES: 'Simuladores/Bibliotecas',
        CURSOS: 'Curso Online',
        FORMACAO: 'Formação Presencial',
        SERVICOS: 'Serviços personalizados',
        ADMIN: 'Administrador',
        PARCEIROS: 'Parceiros'
    };

    // ============================================
    // GERENCIADOR DE AUTENTICAÇÃO
    // ============================================
    class AuthManager {
        constructor() {
            this.usuario = null;
            this.nivel = null;
            this.regiao = null;
            this.nome = null;
            this.loginTime = null;
            this.sessionDuration = 900000; // 15 minutos (master)
            this.liderSessionDuration = 1800000; // 30 minutos (líder)
        }
        
        async login(usuario, senha, remember = false) {
            try {
                // Primeiro tenta como admin master
                let url = `${SCRIPT_URL}?acao=loginAdmin&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`;
                let response = await fetch(url);
                let dados = await response.json();
                
                if (dados.login && dados.tipo === 'master') {
                    this.usuario = usuario;
                    this.nivel = 'master';
                    this.nome = dados.nome || usuario;
                    this.loginTime = Date.now();
                    
                    this.salvarSessao(remember);
                    return { success: true, nivel: 'master', dados: dados };
                }
                
                // Se não for master, tenta como parceiro (líder regional)
                url = `${SCRIPT_URL}?acao=loginParceiro&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`;
                response = await fetch(url);
                dados = await response.json();
                
                if (dados.login && dados.funcao === 'Líder regional' && dados.status === 'Ativo') {
                    this.usuario = usuario;
                    this.nivel = 'lider';
                    this.regiao = dados.regiao;
                    this.nome = dados.nome || usuario;
                    this.loginTime = Date.now();
                    
                    this.salvarSessao(remember);
                    return { success: true, nivel: 'lider', dados: dados };
                }
                
                return { success: false, mensagem: 'Credenciais inválidas ou acesso não autorizado' };
                
            } catch (error) {
                console.error('Erro no login:', error);
                return { success: false, mensagem: 'Erro de conexão com o servidor' };
            }
        }
        
        salvarSessao(remember) {
            const sessionData = {
                usuario: this.usuario,
                nivel: this.nivel,
                regiao: this.regiao,
                nome: this.nome,
                loginTime: this.loginTime
            };
            
            if (remember) {
                localStorage.setItem('teca_admin_session', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('teca_admin_session', JSON.stringify(sessionData));
            }
        }
        
        carregarSessao() {
            // Tenta sessionStorage primeiro
            let sessionData = sessionStorage.getItem('teca_admin_session');
            if (sessionData) {
                try {
                    const data = JSON.parse(sessionData);
                    this.usuario = data.usuario;
                    this.nivel = data.nivel;
                    this.regiao = data.regiao;
                    this.nome = data.nome;
                    this.loginTime = data.loginTime;
                    
                    // Verificar expiração
                    const duration = this.nivel === 'master' ? this.sessionDuration : this.liderSessionDuration;
                    if (Date.now() - this.loginTime > duration) {
                        this.logout();
                        return false;
                    }
                    
                    return true;
                } catch (e) {
                    return false;
                }
            }
            
            // Tenta localStorage
            sessionData = localStorage.getItem('teca_admin_session');
            if (sessionData) {
                try {
                    const data = JSON.parse(sessionData);
                    this.usuario = data.usuario;
                    this.nivel = data.nivel;
                    this.regiao = data.regiao;
                    this.nome = data.nome;
                    this.loginTime = data.loginTime;
                    
                    // Verificar expiração
                    const duration = this.nivel === 'master' ? this.sessionDuration : this.liderSessionDuration;
                    if (Date.now() - this.loginTime > duration) {
                        this.logout();
                        return false;
                    }
                    
                    return true;
                } catch (e) {
                    return false;
                }
            }
            
            return false;
        }
        
        logout() {
            sessionStorage.removeItem('teca_admin_session');
            localStorage.removeItem('teca_admin_session');
            this.usuario = null;
            this.nivel = null;
            this.regiao = null;
            this.nome = null;
            this.loginTime = null;
            window.location.href = 'adm.html';
        }
        
        getTempoRestante() {
            if (!this.loginTime) return 0;
            
            const duration = this.nivel === 'master' ? this.sessionDuration : this.liderSessionDuration;
            const elapsed = Date.now() - this.loginTime;
            return Math.max(0, duration - elapsed);
        }
        
        pode(acao, alvo = null) {
            if (this.nivel === 'master') return true;
            
            if (this.nivel === 'lider') {
                // Líder não pode agir em parceiros
                if (alvo && alvo.tipo === 'parceiro') return false;
                
                // Líder só pode agir em sua região
                if (alvo && alvo.regiao && alvo.regiao !== this.regiao) return false;
                
                // Ações permitidas para líder
                const acoesPermitidas = ['ver', 'bloquear', 'remover', 'editar'];
                return acoesPermitidas.includes(acao);
            }
            
            return false;
        }
    }

    // ============================================
    // GERENCIADOR DE API
    // ============================================
    class APIManager {
        constructor(authManager) {
            this.auth = authManager;
        }
        
        async buscarDados(planilha, filtros = {}) {
            // Aplicar filtro regional para líder
            if (this.auth.nivel === 'lider' && this.auth.regiao) {
                filtros.regiao = this.auth.regiao;
            }
            
            const url = `${SCRIPT_URL}?acao=buscar&planilha=${encodeURIComponent(planilha)}&filtros=${encodeURIComponent(JSON.stringify(filtros))}`;
            
            try {
                const response = await fetch(url);
                const dados = await response.json();
                return dados;
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                return [];
            }
        }
        
        async buscarEstatisticas() {
            let url = `${SCRIPT_URL}?acao=estatisticas`;
            
            // Para líder, passar região
            if (this.auth.nivel === 'lider' && this.auth.regiao) {
                url += `&regiao=${encodeURIComponent(this.auth.regiao)}`;
            }
            
            try {
                const response = await fetch(url);
                const dados = await response.json();
                return dados;
            } catch (error) {
                console.error('Erro ao buscar estatísticas:', error);
                return this.getEstatisticasPadrao();
            }
        }
        
        getEstatisticasPadrao() {
            return {
                totalUsuarios: 0,
                receitaTotal: 0,
                totalRegioes: 0,
                percentualHomens: 50,
                idadeMedia: 0,
                distribuicaoGenero: { Homens: 0, Mulheres: 0 },
                distribuicaoServicos: { simuladores: 0, cursos: 0, formacoes: 0 },
                usuariosPorRegiao: [],
                receitaPorDia: []
            };
        }
        
        async alterarStatusUsuario(planilha, linha, status) {
            // Verificar permissão
            if (!this.auth.pode('bloquear', { tipo: planilha === SHEET_NAMES.PARCEIROS ? 'parceiro' : 'usuario' })) {
                return { status: 'erro', mensagem: 'Sem permissão para esta ação' };
            }
            
            const payload = {
                acao: 'alterarStatus',
                planilha: planilha,
                linha: linha,
                status: status
            };
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const resultado = await response.json();
                return resultado;
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                return { status: 'erro', mensagem: error.message };
            }
        }
        
        async removerUsuario(planilha, linha) {
            // Verificar permissão
            if (!this.auth.pode('remover', { tipo: planilha === SHEET_NAMES.PARCEIROS ? 'parceiro' : 'usuario' })) {
                return { status: 'erro', mensagem: 'Sem permissão para esta ação' };
            }
            
            const payload = {
                acao: 'remover',
                planilha: planilha,
                linha: linha
            };
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const resultado = await response.json();
                return resultado;
            } catch (error) {
                console.error('Erro ao remover usuário:', error);
                return { status: 'erro', mensagem: error.message };
            }
        }
        
        async adicionarParceiro(dados) {
            // Apenas master pode adicionar parceiros
            if (this.auth.nivel !== 'master') {
                return { status: 'erro', mensagem: 'Apenas o Administrador Master pode adicionar parceiros' };
            }
            
            const payload = {
                acao: 'adicionarParceiro',
                dados: dados
            };
            
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const resultado = await response.json();
                return resultado;
            } catch (error) {
                console.error('Erro ao adicionar parceiro:', error);
                return { status: 'erro', mensagem: error.message };
            }
        }
    }

    // ============================================
    // GERENCIADOR DE GRÁFICOS
    // ============================================
    class ChartManager {
        constructor() {
            this.charts = {};
        }
        
        criarGraficoReceita(canvasId, dados) {
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dados.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Receita (Kz)',
                        data: dados.valores || [0, 0, 0, 0, 0, 0],
                        borderColor: '#d6ae64',
                        backgroundColor: 'rgba(214, 174, 100, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#cccccc' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#cccccc' }
                        }
                    }
                }
            });
        }
        
        criarGraficoRegioes(canvasId, dados) {
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dados.regioes || ['Luanda', 'Huambo', 'Benguela', 'Cabinda'],
                    datasets: [{
                        label: 'Usuários',
                        data: dados.valores || [0, 0, 0, 0],
                        backgroundColor: '#d6ae64',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#cccccc' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#cccccc' }
                        }
                    }
                }
            });
        }
        
        criarGraficoGenero(canvasId, homens, mulheres) {
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Homens', 'Mulheres'],
                    datasets: [{
                        data: [homens, mulheres],
                        backgroundColor: ['#1976D2', '#d6ae64'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#cccccc' }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
        
        criarGraficoServicos(canvasId, dados) {
            const ctx = document.getElementById(canvasId)?.getContext('2d');
            if (!ctx) return;
            
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            this.charts[canvasId] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Simuladores', 'Cursos', 'Formações'],
                    datasets: [{
                        label: 'Contratações',
                        data: [
                            dados.simuladores || 0,
                            dados.cursos || 0,
                            dados.formacoes || 0
                        ],
                        backgroundColor: ['#d6ae64', '#1976D2', '#28a745'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#cccccc' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#cccccc' }
                        }
                    }
                }
            });
        }
        
        destroyAll() {
            Object.values(this.charts).forEach(chart => chart.destroy());
            this.charts = {};
        }
    }

    // ============================================
    // GERENCIADOR DE TABELAS
    // ============================================
    class TableManager {
        constructor(apiManager, authManager) {
            this.api = apiManager;
            this.auth = authManager;
            this.currentPage = 1;
            this.itemsPerPage = 50;
            this.totalItems = 0;
            this.currentData = [];
            this.currentFilters = {};
        }
        
        async carregarDados(planilha, tabelaId, colunas, options = {}) {
            try {
                const dados = await this.api.buscarDados(planilha, this.currentFilters);
                this.currentData = dados;
                this.totalItems = dados.length;
                
                this.renderTabela(tabelaId, dados, colunas, options);
                this.renderPaginacao(tabelaId.replace('TableBody', 'Pagination'), dados.length);
                
                return dados;
            } catch (error) {
                console.error(`Erro ao carregar dados de ${planilha}:`, error);
                const tbody = document.getElementById(tabelaId);
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="10" class="text-center">Erro ao carregar dados</td></tr>`;
                }
                return [];
            }
        }
        
        renderTabela(tabelaId, dados, colunas, options = {}) {
            const tbody = document.getElementById(tabelaId);
            if (!tbody) return;
            
            if (!dados || dados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${colunas.length + 2}" class="text-center">Nenhum dado encontrado</td></tr>`;
                return;
            }
            
            // Paginação
            const start = (this.currentPage - 1) * this.itemsPerPage;
            const end = Math.min(start + this.itemsPerPage, dados.length);
            const pageData = dados.slice(start, end);
            
            tbody.innerHTML = '';
            
            pageData.forEach((item, index) => {
                const linha = item.linha || (start + index + 2);
                const row = document.createElement('tr');
                
                let cells = '';
                
                // Checkbox (apenas para master na tabela de usuários)
                if (options.showCheckbox && this.auth.nivel === 'master' && tabelaId === 'usuariosTableBody') {
                    cells += `<td><input type="checkbox" class="select-user" data-linha="${linha}"></td>`;
                }
                
                // Células de dados
                colunas.forEach(col => {
                    let valor = item[col] || '';
                    
                    // Formatação especial para status
                    if (col.toLowerCase().includes('status')) {
                        const statusClass = valor === 'Ativo' ? 'badge-green' : 
                                           valor === 'Pendente' ? 'badge-yellow' : 'badge-red';
                        cells += `<td><span class="badge ${statusClass}">${valor}</span></td>`;
                    }
                    // Formatação para email (aceitar variações)
                    else if (col.toLowerCase().includes('email') || col.toLowerCase().includes('gmail')) {
                        const email = item.email || item.gmail || item['Gmail'] || item['Email'] || '';
                        cells += `<td>${email}</td>`;
                    }
                    else {
                        cells += `<td>${valor}</td>`;
                    }
                });
                
                // Ações
                cells += `<td class="actions-cell">`;
                
                // Botão Editar
                cells += `<button class="btn-icon btn-edit" onclick="window.adminPanel.editarRegistro('${tabelaId}', '${linha}')" title="Editar"><i class="fas fa-edit"></i></button>`;
                
                // Botão Bloquear (se tiver permissão)
                if (this.auth.pode('bloquear', { tipo: options.tipo || 'usuario', regiao: item.regiao })) {
                    cells += `<button class="btn-icon btn-block" onclick="window.adminPanel.bloquearRegistro('${tabelaId}', '${linha}')" title="Bloquear"><i class="fas fa-ban"></i></button>`;
                }
                
                // Botão Remover (se tiver permissão)
                if (this.auth.pode('remover', { tipo: options.tipo || 'usuario', regiao: item.regiao })) {
                    cells += `<button class="btn-icon btn-danger" onclick="window.adminPanel.removerRegistro('${tabelaId}', '${linha}')" title="Remover"><i class="fas fa-trash"></i></button>`;
                }
                
                cells += `</td>`;
                
                row.innerHTML = cells;
                tbody.appendChild(row);
            });
        }
        
        renderPaginacao(paginationId, totalItems) {
            const container = document.getElementById(paginationId);
            if (!container) return;
            
            const totalPages = Math.ceil(totalItems / this.itemsPerPage);
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }
            
            let html = '';
            
            // Botão Anterior
            html += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.adminPanel.tableManager.irPagina(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
            
            // Páginas
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                    html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.adminPanel.tableManager.irPagina(${i})">${i}</button>`;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    html += `<span class="page-dots">...</span>`;
                }
            }
            
            // Botão Próximo
            html += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.adminPanel.tableManager.irPagina(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
            
            container.innerHTML = html;
        }
        
        irPagina(pagina) {
            this.currentPage = pagina;
            // Recarregar dados da tabela atual
            if (window.adminPanel) {
                window.adminPanel.recarregarModuloAtual();
            }
        }
        
        aplicarFiltros(filtros) {
            this.currentFilters = filtros;
            this.currentPage = 1;
            // Recarregar dados com filtros
            if (window.adminPanel) {
                window.adminPanel.recarregarModuloAtual();
            }
        }
        
        limparFiltros() {
            this.currentFilters = {};
            this.currentPage = 1;
            if (window.adminPanel) {
                window.adminPanel.recarregarModuloAtual();
            }
        }
    }

    // ============================================
    // CLASSE PRINCIPAL DO PAINEL ADMIN
    // ============================================
    class AdminPanel {
        constructor() {
            this.auth = new AuthManager();
            this.api = new APIManager(this.auth);
            this.charts = new ChartManager();
            this.tableManager = new TableManager(this.api, this.auth);
            this.currentModule = 'dashboard';
            this.selectedLinhas = new Set();
            this.updateInterval = null;
            this.sessionTimer = null;
            this.init();
        }
        
        async init() {
            // Verificar autenticação
            if (!this.auth.carregarSessao()) {
                window.location.href = 'adm.html';
                return;
            }
            
            // Inicializar interface
            this.atualizarInterfaceUsuario();
            this.configurarEventListeners();
            this.iniciarSessionTimer();
            
            // Carregar dados iniciais
            await this.carregarDadosDashboard();
            
            // Iniciar atualização periódica (a cada 30 segundos)
            this.iniciarAtualizacaoPeriodica();
        }
        
        atualizarInterfaceUsuario() {
            // Nome do usuário
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) userNameDisplay.textContent = this.auth.nome;
            
            // Role
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            if (userRoleDisplay) {
                userRoleDisplay.textContent = this.auth.nivel === 'master' ? 'Administrador Master' : 'Líder Regional';
            }
            
            // Região (para líder)
            const userRegionDisplay = document.getElementById('userRegionDisplay');
            if (userRegionDisplay) {
                if (this.auth.nivel === 'lider' && this.auth.regiao) {
                    userRegionDisplay.textContent = `Região: ${this.auth.regiao}`;
                } else {
                    userRegionDisplay.textContent = '';
                }
            }
            
            // Mostrar/esconder itens de menu específicos do master
            if (this.auth.nivel === 'master') {
                document.getElementById('configMenu').style.display = 'block';
                document.getElementById('addUsuarioBtn').style.display = 'inline-flex';
                document.getElementById('addParceiroBtn').style.display = 'inline-flex';
            } else {
                document.getElementById('configMenu').style.display = 'none';
                document.getElementById('addUsuarioBtn').style.display = 'none';
                document.getElementById('addParceiroBtn').style.display = 'none';
            }
        }
        
        configurarEventListeners() {
            // Navegação por módulos
            document.querySelectorAll('.nav-item[data-module]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const module = item.dataset.module;
                    this.switchModule(module);
                });
            });
            
            // Botão de logout
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.confirmarAcao('Terminar Sessão', 'Deseja realmente sair do sistema?', () => {
                    this.auth.logout();
                });
            });
            
            // Menu toggle (sidebar)
            document.getElementById('menuToggle').addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('collapsed');
                document.querySelector('.main-content').classList.toggle('expanded');
            });
            
            // Botão de refresh
            document.getElementById('refreshData').addEventListener('click', () => {
                this.recarregarModuloAtual();
            });
            
            // Fullscreen
            document.getElementById('fullscreenBtn').addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
            
            // Filtros
            document.getElementById('applyFilterUsuarios')?.addEventListener('click', () => {
                this.aplicarFiltrosUsuarios();
            });
            
            // Checkbox "Selecionar todos"
            const selectAll = document.getElementById('selectAllUsuarios');
            if (selectAll) {
                selectAll.addEventListener('change', (e) => {
                    const checkboxes = document.querySelectorAll('.select-user');
                    checkboxes.forEach(cb => {
                        cb.checked = e.target.checked;
                        const linha = cb.dataset.linha;
                        if (e.target.checked) {
                            this.selectedLinhas.add(linha);
                        } else {
                            this.selectedLinhas.delete(linha);
                        }
                    });
                    this.atualizarBulkActions();
                });
            }
            
            // Botões de ação em massa
            document.getElementById('btnBloquearSelecionados')?.addEventListener('click', () => {
                this.bulkAction('bloquear');
            });
            
            document.getElementById('btnRemoverSelecionados')?.addEventListener('click', () => {
                this.bulkAction('remover');
            });
            
            document.getElementById('btnCancelarSelecao')?.addEventListener('click', () => {
                this.limparSelecao();
            });
        }
        
        async switchModule(module) {
            // Atualizar navegação
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.nav-item[data-module="${module}"]`).classList.add('active');
            
            // Esconder todos os módulos
            document.querySelectorAll('.admin-module').forEach(mod => {
                mod.classList.remove('active');
            });
            
            // Mostrar módulo selecionado
            const moduleElement = document.getElementById(`module-${module}`);
            if (moduleElement) {
                moduleElement.classList.add('active');
                
                // Atualizar título da página
                const pageTitle = document.getElementById('pageTitle');
                const moduleNames = {
                    'dashboard': 'Dashboard',
                    'usuarios': 'Usuários',
                    'simuladores': 'Simuladores',
                    'biblioteca': 'Biblioteca',
                    'cursos': 'Cursos Online',
                    'formacoes': 'Formações Presenciais',
                    'parceiros': 'Parceiros',
                    'servicos': 'Serviços Personalizados',
                    'configuracoes': 'Configurações'
                };
                pageTitle.textContent = moduleNames[module] || 'Dashboard';
                
                // Carregar dados do módulo
                await this.carregarDadosModulo(module);
            }
            
            this.currentModule = module;
        }
        
        async carregarDadosModulo(module) {
            this.showLoader();
            
            try {
                switch(module) {
                    case 'dashboard':
                        await this.carregarDadosDashboard();
                        break;
                    case 'usuarios':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.CADASTRO,
                            'usuariosTableBody',
                            ['Nome', 'Sexo', 'País', 'Região', 'Idade', 'Email', 'Telefone', 'Data', 'Status'],
                            { showCheckbox: true, tipo: 'usuario' }
                        );
                        break;
                    case 'simuladores':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.SIMULADORES,
                            'simuladoresTableBody',
                            ['Nome de usuario', 'Sexo', 'País', 'Região', 'Idade', 'Email', 'Data', 'Tipo de Pagamento', 'Valor Pago', 'Data de Expiração do Acesso'],
                            { tipo: 'usuario' }
                        );
                        break;
                    case 'biblioteca':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.SIMULADORES,
                            'bibliotecaTableBody',
                            ['Nome de usuario', 'Sexo', 'País', 'Região', 'Idade', 'Email', 'Data', 'Tipo de Pagamento', 'Valor Pago', 'Data de Expiração do Acesso'],
                            { tipo: 'usuario' }
                        );
                        break;
                    case 'cursos':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.CURSOS,
                            'cursosTableBody',
                            ['Nome do Usuario', 'Sexo', 'País', 'Idade', 'Email', 'Tipo do Curso', 'Turma Escolhida', 'Tipo de Pagamento', 'Valor Pago'],
                            { tipo: 'usuario' }
                        );
                        break;
                    case 'formacoes':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.FORMACAO,
                            'formacoesTableBody',
                            ['Nome do Usuario', 'Sexo', 'País', 'Instituição Associada', 'Tipo de Formação', 'Turma', 'Tipo de Pagamento', 'Valor Pago', 'Tempo de Acesso'],
                            { tipo: 'usuario' }
                        );
                        break;
                    case 'parceiros':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.PARCEIROS,
                            'parceirosTableBody',
                            ['Nome', 'Sexo', 'País', 'Região', 'Idade', 'Função', 'Email', 'Telefone', 'Status'],
                            { tipo: 'parceiro' }
                        );
                        break;
                    case 'servicos':
                        await this.tableManager.carregarDados(
                            SHEET_NAMES.SERVICOS,
                            'servicosTableBody',
                            ['Nome do Cliente', 'Identificação', 'Sexo/Sector de atuação', 'País-Região', 'Tipo de Serviço', 'Descrição do Mesmo', 'Forma de Pagamento', 'Valor Pago', 'Data'],
                            { tipo: 'servico' }
                        );
                        break;
                }
            } catch (error) {
                console.error(`Erro ao carregar módulo ${module}:`, error);
                this.showToast('Erro ao carregar dados', 'error');
            } finally {
                this.hideLoader();
            }
        }
        
        async carregarDadosDashboard() {
            try {
                const stats = await this.api.buscarEstatisticas();
                
                // Renderizar cards
                this.renderStats(stats);
                
                // Renderizar gráficos
                this.renderGraficos(stats);
                
                // Carregar últimos cadastros
                const ultimos = await this.api.buscarDados(SHEET_NAMES.CADASTRO, { limite: 10 });
                this.renderUltimosCadastros(ultimos);
                
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            }
        }
        
        renderStats(stats) {
            const statsGrid = document.getElementById('statsGrid');
            if (!statsGrid) return;
            
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.totalUsuarios || 0}</div>
                        <div class="stat-label">Total de Usuários</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${(stats.receitaTotal || 0).toLocaleString()} Kz</div>
                        <div class="stat-label">Receita Total</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.totalRegioes || 0}</div>
                        <div class="stat-label">Regiões Ativas</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.idadeMedia || 0}</div>
                        <div class="stat-label">Idade Média</div>
                    </div>
                </div>
            `;
        }
        
        renderGraficos(stats) {
            // Gráfico de receita
            this.charts.criarGraficoReceita('receitaChart', {
                labels: stats.receitaPorDia?.map(d => d.dia) || [],
                valores: stats.receitaPorDia?.map(d => d.valor) || []
            });
            
            // Gráfico de regiões
            this.charts.criarGraficoRegioes('regiaoChart', {
                regioes: stats.usuariosPorRegiao?.map(r => r.regiao) || [],
                valores: stats.usuariosPorRegiao?.map(r => r.count) || []
            });
            
            // Gráfico de gênero
            this.charts.criarGraficoGenero(
                'generoChart',
                stats.distribuicaoGenero?.Homens || 0,
                stats.distribuicaoGenero?.Mulheres || 0
            );
            
            // Gráfico de serviços
            this.charts.criarGraficoServicos('servicosChart', stats.distribuicaoServicos || {});
        }
        
        renderUltimosCadastros(usuarios) {
            const tbody = document.getElementById('ultimosCadastrosTable');
            if (!tbody) return;
            
            if (!usuarios || usuarios.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cadastro recente</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            usuarios.slice(0, 10).forEach(usuario => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${usuario.nome || usuario['Nome do Usuário'] || ''}</td>
                    <td>${usuario.email || usuario.gmail || ''}</td>
                    <td>${usuario.regiao || ''}</td>
                    <td>${this.determinarServico(usuario)}</td>
                    <td>${usuario.data || usuario['Data'] || ''}</td>
                    <td><span class="badge badge-green">Ativo</span></td>
                `;
                tbody.appendChild(row);
            });
        }
        
        determinarServico(usuario) {
            if (usuario['Tipo de Pagamento'] || usuario.tipoPagamento) return 'Simulador';
            if (usuario['Tipo do Curso'] || usuario.tipoCurso) return 'Curso';
            if (usuario['Tipo de Formação'] || usuario.tipoFormacao) return 'Formação';
            return 'N/A';
        }
        
        aplicarFiltrosUsuarios() {
            const filtros = {
                nome: document.getElementById('searchUsuarios')?.value,
                regiao: document.getElementById('filterRegiaoUsuarios')?.value,
                status: document.getElementById('filterStatusUsuarios')?.value
            };
            this.tableManager.aplicarFiltros(filtros);
        }
        
        atualizarBulkActions() {
            const container = document.getElementById('bulkActionsUsuarios');
            const selectedCount = document.getElementById('selectedCount');
            
            if (this.selectedLinhas.size > 0) {
                container.style.display = 'flex';
                selectedCount.textContent = this.selectedLinhas.size;
            } else {
                container.style.display = 'none';
            }
            
            document.getElementById('btnBloquearSelecionados').disabled = this.selectedLinhas.size === 0;
            document.getElementById('btnRemoverSelecionados').disabled = this.selectedLinhas.size === 0;
        }
        
        limparSelecao() {
            this.selectedLinhas.clear();
            document.querySelectorAll('.select-user').forEach(cb => {
                cb.checked = false;
            });
            document.getElementById('selectAllUsuarios').checked = false;
            this.atualizarBulkActions();
        }
        
        async bulkAction(acao) {
            if (this.selectedLinhas.size === 0) return;
            
            const confirmMsg = acao === 'bloquear' 
                ? `Deseja bloquear ${this.selectedLinhas.size} usuário(s)?`
                : `Deseja remover ${this.selectedLinhas.size} usuário(s) permanentemente?`;
            
            if (!confirm(confirmMsg)) return;
            
            this.showLoader();
            
            try {
                const linhas = Array.from(this.selectedLinhas);
                let sucessos = 0;
                
                for (const linha of linhas) {
                    let resultado;
                    if (acao === 'bloquear') {
                        resultado = await this.api.alterarStatusUsuario(SHEET_NAMES.CADASTRO, linha, 'Bloqueado');
                    } else {
                        resultado = await this.api.removerUsuario(SHEET_NAMES.CADASTRO, linha);
                    }
                    
                    if (resultado.status === 'sucesso') sucessos++;
                }
                
                this.showToast(`${sucessos} de ${linhas.length} processados com sucesso`, sucessos === linhas.length ? 'success' : 'warning');
                this.limparSelecao();
                await this.recarregarModuloAtual();
                
            } catch (error) {
                console.error('Erro na ação em massa:', error);
                this.showToast('Erro ao processar ação', 'error');
            } finally {
                this.hideLoader();
            }
        }
        
        async bloquearRegistro(tabelaId, linha) {
            const planilha = this.getPlanilhaPorTabela(tabelaId);
            if (!planilha) return;
            
            this.confirmarAcao('Bloquear', 'Deseja bloquear este registro?', async () => {
                this.showLoader();
                const resultado = await this.api.alterarStatusUsuario(planilha, linha, 'Bloqueado');
                this.hideLoader();
                
                if (resultado.status === 'sucesso') {
                    this.showToast('Registro bloqueado com sucesso', 'success');
                    await this.recarregarModuloAtual();
                } else {
                    this.showToast(resultado.mensagem || 'Erro ao bloquear', 'error');
                }
            });
        }
        
        async removerRegistro(tabelaId, linha) {
            const planilha = this.getPlanilhaPorTabela(tabelaId);
            if (!planilha) return;
            
            this.confirmarAcao('Remover', 'Deseja remover este registro permanentemente?', async () => {
                this.showLoader();
                const resultado = await this.api.removerUsuario(planilha, linha);
                this.hideLoader();
                
                if (resultado.status === 'sucesso') {
                    this.showToast('Registro removido com sucesso', 'success');
                    await this.recarregarModuloAtual();
                } else {
                    this.showToast(resultado.mensagem || 'Erro ao remover', 'error');
                }
            });
        }
        
        getPlanilhaPorTabela(tabelaId) {
            const map = {
                'usuariosTableBody': SHEET_NAMES.CADASTRO,
                'simuladoresTableBody': SHEET_NAMES.SIMULADORES,
                'bibliotecaTableBody': SHEET_NAMES.SIMULADORES,
                'cursosTableBody': SHEET_NAMES.CURSOS,
                'formacoesTableBody': SHEET_NAMES.FORMACAO,
                'parceirosTableBody': SHEET_NAMES.PARCEIROS,
                'servicosTableBody': SHEET_NAMES.SERVICOS
            };
            return map[tabelaId];
        }
        
        async recarregarModuloAtual() {
            await this.carregarDadosModulo(this.currentModule);
        }
        
        iniciarSessionTimer() {
            this.sessionTimer = setInterval(() => {
                const tempoRestante = this.auth.getTempoRestante();
                
                // Atualizar display
                const timerDisplay = document.getElementById('sessionTimerDisplay');
                if (timerDisplay) {
                    const minutos = Math.floor(tempoRestante / 60000);
                    const segundos = Math.floor((tempoRestante % 60000) / 1000);
                    timerDisplay.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                }
                
                // Aviso 1 minuto antes
                if (tempoRestante <= 60000 && tempoRestante > 0) {
                    document.getElementById('sessionTimer').classList.add('warning');
                    if (tempoRestante <= 60000 && tempoRestante > 58000) {
                        this.mostrarReauthPopup();
                    }
                } else {
                    document.getElementById('sessionTimer').classList.remove('warning');
                }
                
                // Logout automático
                if (tempoRestante <= 0) {
                    clearInterval(this.sessionTimer);
                    this.auth.logout();
                }
            }, 1000);
        }
        
        iniciarAtualizacaoPeriodica() {
            this.updateInterval = setInterval(() => {
                if (this.currentModule === 'dashboard') {
                    this.carregarDadosDashboard();
                }
            }, 30000);
        }
        
        mostrarReauthPopup() {
            const popup = document.getElementById('reauthPopup');
            if (!popup) return;
            
            popup.style.display = 'flex';
            
            const btnReauth = document.getElementById('btnReauth');
            const btnCancel = document.getElementById('btnReauthCancel');
            
            btnReauth.onclick = () => {
                popup.style.display = 'none';
                // Renovar sessão
                this.auth.loginTime = Date.now();
                this.auth.salvarSessao(true);
            };
            
            btnCancel.onclick = () => {
                popup.style.display = 'none';
                this.auth.logout();
            };
        }
        
        confirmarAcao(titulo, mensagem, callback) {
            const modal = document.getElementById('confirmModal');
            document.getElementById('confirmModalTitle').textContent = titulo;
            document.getElementById('confirmModalMessage').textContent = mensagem;
            
            modal.style.display = 'flex';
            
            const confirmar = () => {
                modal.style.display = 'none';
                callback();
                document.getElementById('confirmActionBtn').removeEventListener('click', confirmar);
            };
            
            document.getElementById('confirmActionBtn').addEventListener('click', confirmar);
            document.getElementById('cancelConfirmBtn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            document.getElementById('closeConfirmModal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        showToast(mensagem, tipo = 'info') {
            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${tipo}`;
            toast.innerHTML = `
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${mensagem}</span>
            `;
            
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: ${tipo === 'success' ? 'rgba(40,167,69,0.9)' : tipo === 'error' ? 'rgba(220,53,69,0.9)' : 'rgba(214,174,100,0.9)'};
                color: ${tipo === 'success' ? 'black' : 'white'};
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 50000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
        
        showLoader() {
            document.getElementById('mainLoader').style.display = 'flex';
        }
        
        hideLoader() {
            document.getElementById('mainLoader').style.display = 'none';
        }
    }

    // ============================================
    // FUNÇÕES DE LOGIN (GLOBAIS)
    // ============================================
    window.realizarLoginAdmin = async function() {
        const usuario = document.getElementById('adminUser')?.value;
        const senha = document.getElementById('adminSenha')?.value;
        const remember = document.getElementById('rememberMe')?.checked;
        
        if (!usuario || !senha) {
            mostrarMensagemLogin('Preencha todos os campos!', 'error');
            return;
        }
        
        // Mostrar loader
        document.getElementById('loginLoader').style.display = 'flex';
        
        const auth = new AuthManager();
        const resultado = await auth.login(usuario, senha, remember);
        
        document.getElementById('loginLoader').style.display = 'none';
        
        if (resultado.success) {
            window.location.href = 'admin-dashboard.html';
        } else {
            mostrarMensagemLogin(resultado.mensagem, 'error');
        }
    };
    
    function mostrarMensagemLogin(texto, tipo) {
        const container = document.getElementById('loginMessage');
        container.innerHTML = `<div class="alert-${tipo}"><i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${texto}</div>`;
    }
    
    // Inicializar painel quando a página carregar
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar se estamos na página do dashboard
        if (document.querySelector('.dashboard-page')) {
            window.adminPanel = new AdminPanel();
        }
        
        // Configurar modal de recuperação de senha
        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('forgotPasswordModal').style.display = 'flex';
            });
        }
        
        document.getElementById('closeForgotModal')?.addEventListener('click', () => {
            document.getElementById('forgotPasswordModal').style.display = 'none';
        });
        
        document.getElementById('closeForgotBtn')?.addEventListener('click', () => {
            document.getElementById('forgotPasswordModal').style.display = 'none';
        });
    });
})();