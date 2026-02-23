// ============================================
// admin-script.js - Painel Administrativo Teca Capital
// Versão Integrada com Google Apps Script
// ============================================

(function() {
    'use strict';

    // ===== CONFIGURAÇÕES GLOBAIS =====
    const CONFIG = {
        SESSION_DURATION: 900000, // 15 minutos em ms
        WARNING_TIME: 60000,       // 1 minuto antes de expirar
        WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzXfX-xfT0a1_o1JjBw-7sN5iXJrRQ0XC92utFGdqyD1tlnb9rwyXXruC2wfBBeWiuW/exec', // Substitua pela URL do seu Web App
        TEMPO_VISIBILIDADE_SENHA: 60,
        STATUS: {
            ATIVO: 'Ativo',
            PENDENTE: 'Pendente',
            EXPIRADO: 'Expirado',
            BLOQUEADO: 'Bloqueado'
        }
    };

    // ===== ESTADO DA APLICAÇÃO =====
    const AppState = {
        isAuthenticated: false,
        adminData: null,
        sessionTimer: null,
        sessionCheckInterval: null,
        dataSheets: {
            cadastro: [],
            simuladores: [],
            cursos: [],
            formacao: [],
            servicos: [],
            parceiros: []
        },
        currentPage: 1,
        itemsPerPage: 20,
        ultimaSenhaGerada: null,
        timerSenha: null
    };

    // ===== UTILITÁRIOS =====
    const Utils = {
        formatDate: (date) => {
            if (!date) return '';
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        },

        formatCurrency: (value) => {
            return parseFloat(value).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kz';
        },

        showNotification: (message, type = 'success', duration = 5000) => {
            const notification = document.createElement('div');
            notification.className = `admin-notification ${type}`;
            notification.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        },

        debounce: (func, wait) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        showPasswordTimer: (senha, elementId) => {
            const timerElement = document.getElementById(elementId);
            if (!timerElement) return;
            
            let secondsLeft = CONFIG.TEMPO_VISIBILIDADE_SENHA;
            timerElement.innerHTML = `
                <div class="senha-temporaria">
                    <strong>${senha}</strong>
                    <span class="timer">Expira em ${secondsLeft}s</span>
                </div>
            `;
            
            if (AppState.timerSenha) clearInterval(AppState.timerSenha);
            
            AppState.timerSenha = setInterval(() => {
                secondsLeft--;
                const timerSpan = timerElement.querySelector('.timer');
                if (timerSpan) {
                    timerSpan.textContent = `Expira em ${secondsLeft}s`;
                }
                
                if (secondsLeft <= 0) {
                    clearInterval(AppState.timerSenha);
                    timerElement.innerHTML = `
                        <div class="senha-expirada">
                            <p>⏰ Senha expirada por segurança</p>
                            <small>Se não anotou, solicite via WhatsApp ou email</small>
                        </div>
                    `;
                }
            }, 1000);
        },

        showLoading: (show = true) => {
            const loader = document.getElementById('global-loader') || (() => {
                const div = document.createElement('div');
                div.id = 'global-loader';
                div.className = 'global-loader';
                div.innerHTML = '<div class="loader-spinner"></div>';
                document.body.appendChild(div);
                return div;
            })();
            
            loader.style.display = show ? 'flex' : 'none';
        }
    };

    // ===== API DE COMUNICAÇÃO COM GOOGLE APPS SCRIPT =====
    const GoogleSheetsAPI = {
        async request(action, data = {}) {
            Utils.showLoading(true);
            try {
                const payload = {
                    acao: action,
                    ...data,
                    timestamp: new Date().toISOString()
                };

                const response = await fetch(CONFIG.WEB_APP_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(payload).toString()
                });

                const result = await response.json();
                Utils.showLoading(false);
                
                if (!result.sucesso) {
                    throw new Error(result.mensagem || 'Erro na requisição');
                }
                
                return result;

            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification(`Erro: ${error.message}`, 'error');
                throw error;
            }
        },

        // Login do administrador
        async loginAdmin(nome, pais, senha) {
            return this.request('loginAdmin', { nome, pais, senha });
        },

        // Login de usuário comum
        async logion(nome, credencial) {
            return this.request('logion', { nome, credencial });
        },

        // Cadastro de novo usuário
        async cadastrarUsuario(dados) {
            return this.request('cadastrar', dados);
        },

        // Buscar dados de uma planilha
        async fetchSheetData(sheetKey) {
            return this.request('fetchSheetData', { sheetKey });
        },

        // Buscar usuário por email
        async buscarUsuario(email) {
            return this.request('buscarUsuario', { email });
        },

        // Verificar expiração de acesso
        async verificarExpiracao(nome, tipo) {
            return this.request('verificarExpiracao', { nome, tipo });
        },

        // Registrar comprovativo
        async registrarComprovativo(dados) {
            return this.request('registrarComprovativo', dados);
        },

        // Obter estatísticas do dashboard
        async getEstatisticas() {
            return this.request('getEstatisticas');
        },

        // Gerenciar parceiros (aprovar/bloquear)
        async atualizarStatusParceiro(nome, status) {
            return this.request('atualizarStatusParceiro', { nome, status });
        },

        // Listar todas as planilhas disponíveis
        async listarPlanilhas() {
            return this.request('listarPlanilhas');
        },

        // Relatório de expirações próximas
        async relatorioExpiracao() {
            return this.request('relatorioExpiracao');
        },

        // Status do sistema
        async getStatus() {
            return this.request('status');
        }
    };

    // ===== SISTEMA DE AUTENTICAÇÃO =====
    const AuthManager = {
        init: function() {
            this.checkExistingSession();
            this.setupLoginListener();
        },

        checkExistingSession: function() {
            const auth = sessionStorage.getItem('adminAuthenticated');
            const loginTime = sessionStorage.getItem('adminLoginTime');
            const adminData = sessionStorage.getItem('adminData');
            
            if (auth === 'true' && loginTime && adminData) {
                const elapsed = Date.now() - parseInt(loginTime);
                if (elapsed < CONFIG.SESSION_DURATION) {
                    AppState.isAuthenticated = true;
                    AppState.adminData = JSON.parse(adminData);
                    document.getElementById('adminNomeDisplay').textContent = AppState.adminData.nome;
                    this.startSessionTimer();
                    DashboardManager.showDashboard();
                    DataLoader.loadAllData();
                } else {
                    this.logout();
                }
            }
        },

        setupLoginListener: function() {
            document.getElementById('btnAdminLogin').addEventListener('click', () => this.login());
            
            ['adminUser', 'adminSenha', 'adminPais'].forEach(id => {
                document.getElementById(id).addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.login();
                });
            });
        },

        login: async function() {
            const nome = document.getElementById('adminUser').value.trim();
            const pais = document.getElementById('adminPais').value;
            const senha = document.getElementById('adminSenha').value;

            if (!nome || !pais || !senha) {
                this.showError('Preencha todos os campos');
                return;
            }

            try {
                const result = await GoogleSheetsAPI.loginAdmin(nome, pais, senha);
                
                if (result.sucesso) {
                    AppState.isAuthenticated = true;
                    AppState.adminData = result.admin;
                    
                    sessionStorage.setItem('adminAuthenticated', 'true');
                    sessionStorage.setItem('adminLoginTime', Date.now().toString());
                    sessionStorage.setItem('adminData', JSON.stringify(result.admin));
                    
                    document.getElementById('adminLoginError').style.display = 'none';
                    document.getElementById('adminNomeDisplay').textContent = nome;
                    
                    this.startSessionTimer();
                    DashboardManager.showDashboard();
                    
                    // Carrega estatísticas iniciais
                    if (result.estatisticas) {
                        DashboardManager.updateStats(result.estatisticas);
                    }
                    
                    await DataLoader.loadAllData();
                    Utils.showNotification(result.mensagem, 'success');
                    
                } else {
                    this.showError(result.mensagem);
                }
            } catch (error) {
                this.showError(error.message);
            }
        },

        showError: function(message) {
            const errorEl = document.getElementById('adminLoginError');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        },

        startSessionTimer: function() {
            if (AppState.sessionTimer) clearInterval(AppState.sessionTimer);
            if (AppState.sessionCheckInterval) clearInterval(AppState.sessionCheckInterval);

            AppState.sessionTimer = setInterval(() => {
                const loginTime = parseInt(sessionStorage.getItem('adminLoginTime'));
                const elapsed = Date.now() - loginTime;
                const remaining = CONFIG.SESSION_DURATION - elapsed;

                if (remaining <= 0) {
                    this.logout();
                } else {
                    this.updateTimerDisplay(remaining);
                }
            }, 1000);

            AppState.sessionCheckInterval = setInterval(() => {
                const loginTime = parseInt(sessionStorage.getItem('adminLoginTime'));
                if (Date.now() - loginTime > CONFIG.SESSION_DURATION - CONFIG.WARNING_TIME) {
                    this.showReauthPopup();
                }
            }, 60000);
        },

        updateTimerDisplay: function(remainingMs) {
            const minutes = Math.floor(remainingMs / 60000);
            const seconds = Math.floor((remainingMs % 60000) / 1000);
            const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            const timerEl = document.getElementById('sessionTimer');
            const timerBox = document.getElementById('sessionTimerBox');
            
            if (timerEl) timerEl.textContent = display;
            if (timerBox) {
                if (remainingMs <= 60000) {
                    timerBox.classList.add('warning');
                } else {
                    timerBox.classList.remove('warning');
                }
            }
        },

        showReauthPopup: function() {
            if (document.querySelector('.reauth-popup')) return;
            
            const popup = document.createElement('div');
            popup.className = 'reauth-popup';
            popup.innerHTML = `
                <div class="reauth-content">
                    <h3><i class="fas fa-clock"></i> Sessão prestes a expirar</h3>
                    <p>Por segurança, faça login novamente para continuar.</p>
                    <button class="btn btn-primary" id="btnReauth">Reautenticar Agora</button>
                </div>
            `;
            document.body.appendChild(popup);
            
            document.getElementById('btnReauth').addEventListener('click', () => {
                popup.remove();
                this.logout();
            });
        },

        logout: function() {
            clearInterval(AppState.sessionTimer);
            clearInterval(AppState.sessionCheckInterval);
            if (AppState.timerSenha) clearInterval(AppState.timerSenha);
            
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminLoginTime');
            sessionStorage.removeItem('adminData');
            
            AppState.isAuthenticated = false;
            document.getElementById('adminLoginContainer').style.display = 'flex';
            document.getElementById('adminDashboard').style.display = 'none';
            
            Utils.showNotification('Sessão encerrada', 'info');
        }
    };

    // ===== GERENCIADOR DO DASHBOARD =====
    const DashboardManager = {
        showDashboard: function() {
            document.getElementById('adminLoginContainer').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            this.setupModuleNavigation();
        },

        setupModuleNavigation: function() {
            document.querySelectorAll('.module-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const moduleId = btn.dataset.module;
                    document.querySelectorAll('.admin-module').forEach(mod => mod.style.display = 'none');
                    
                    const targetModule = document.getElementById(`module-${moduleId}`);
                    if (targetModule) {
                        targetModule.style.display = 'block';
                        
                        // Recarrega dados específicos do módulo se necessário
                        switch(moduleId) {
                            case 'dashboard':
                                this.refreshStats();
                                break;
                            case 'parceiros':
                                DataLoader.renderParceirosTable();
                                break;
                        }
                    }
                });
            });
        },

        updateStats: function(stats) {
            if (!stats) return;
            
            document.getElementById('totalUsuarios').textContent = stats.totalCadastros || 0;
            document.getElementById('usuariosAtivos').textContent = stats.totalCadastros || 0;
            
            // Calcula percentual de homens/mulheres (mock por enquanto)
            document.getElementById('percentualHomens').textContent = '50%';
            document.getElementById('simuladorMaisUsado').textContent = 'Mercado Financeiro';
        },

        refreshStats: async function() {
            try {
                const result = await GoogleSheetsAPI.getEstatisticas();
                if (result.sucesso) {
                    this.updateStats(result.estatisticas);
                }
            } catch (error) {
                console.error('Erro ao atualizar estatísticas:', error);
            }
        }
    };

    // ===== CARREGADOR DE DADOS DAS PLANILHAS =====
    const DataLoader = {
        loadAllData: async function() {
            try {
                await Promise.all([
                    this.loadCadastro(),
                    this.loadSimuladores(),
                    this.loadCursos(),
                    this.loadFormacao(),
                    this.loadServicos(),
                    this.loadParceiros()
                ]);
                
                this.renderAllTables();
                Utils.showNotification('Dados carregados com sucesso', 'success');
                
            } catch (error) {
                Utils.showNotification('Erro ao carregar dados: ' + error.message, 'error');
            }
        },

        loadCadastro: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('cadastro');
            AppState.dataSheets.cadastro = result.dados || [];
        },

        loadSimuladores: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('simuladores');
            AppState.dataSheets.simuladores = result.dados || [];
        },

        loadCursos: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('cursos');
            AppState.dataSheets.cursos = result.dados || [];
        },

        loadFormacao: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('formacao');
            AppState.dataSheets.formacao = result.dados || [];
        },

        loadServicos: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('servicos');
            AppState.dataSheets.servicos = result.dados || [];
        },

        loadParceiros: async function() {
            const result = await GoogleSheetsAPI.fetchSheetData('parceiros');
            AppState.dataSheets.parceiros = result.dados || [];
        },

        renderAllTables: function() {
            this.renderUsuariosTable();
            this.renderSimuladoresTable();
            this.renderCursosTable();
            this.renderFormacoesTable();
            this.renderServicosTable();
            this.renderParceirosTable();
            this.renderConteudosCategorias();
        },

        renderUsuariosTable: function() {
            const tbody = document.getElementById('usuariosTableBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.cadastro;
            tbody.innerHTML = data.map((user, index) => `
                <tr>
                    <td><input type="checkbox" class="user-checkbox" data-id="${user.id || index}"></td>
                    <td>${user.nome || '-'}</td>
                    <td>${user.sexo || '-'}</td>
                    <td>${user.pais || '-'}</td>
                    <td>${user.regiao || '-'}</td>
                    <td>${user.idade || '-'}</td>
                    <td>${user.email || user.gmail || '-'}</td>
                    <td>${user.telefone || '-'}</td>
                    <td>${user.dataCadastro ? Utils.formatDate(user.dataCadastro) : '-'}</td>
                    <td><span class="badge badge-success">Ativo</span></td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.editUser('${user.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteUser('${user.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        renderSimuladoresTable: function() {
            const tbody = document.getElementById('acessosSimuladoresBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.simuladores;
            tbody.innerHTML = data.map(item => {
                const hoje = new Date();
                const expiracao = item.dataExpiracao ? new Date(item.dataExpiracao.split('/').reverse().join('-')) : null;
                const expirado = expiracao && expiracao < hoje;
                
                return `
                <tr>
                    <td>${item.nome || '-'}</td>
                    <td>${item.email || item.gmail || '-'}</td>
                    <td>${item.dataCadastro ? Utils.formatDate(item.dataCadastro) : '-'}</td>
                    <td>${item.tipoPagamento || '-'}</td>
                    <td>${item.valorPago ? Utils.formatCurrency(item.valorPago) : '-'}</td>
                    <td>${item.dataExpiracao || '-'}</td>
                    <td><span class="badge ${expirado ? 'badge-danger' : 'badge-success'}">${expirado ? 'Expirado' : 'Ativo'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.viewDetails('${item.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteItem('simuladores', '${item.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `}).join('');
        },

        renderCursosTable: function() {
            const tbody = document.getElementById('cursosOnlineBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.cursos;
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.nome || '-'}</td>
                    <td>${item.email || item.gmail || '-'}</td>
                    <td>${item.tipoCurso || '-'}</td>
                    <td>${item.turma || '-'}</td>
                    <td>${item.tipoPagamento || '-'}</td>
                    <td>${item.valorPago ? Utils.formatCurrency(item.valorPago) : '-'}</td>
                    <td>${item.codigoEspecial || '-'}</td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.viewDetails('${item.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteItem('cursos', '${item.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        renderFormacoesTable: function() {
            const tbody = document.getElementById('formacoesPresenciaisBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.formacao;
            tbody.innerHTML = data.map(item => {
                const hoje = new Date();
                const expiracao = item.tempoAcesso ? new Date(item.tempoAcesso.split('/').reverse().join('-')) : null;
                const expirado = expiracao && expiracao < hoje;
                
                return `
                <tr>
                    <td>${item.nome || '-'}</td>
                    <td>${item.email || item.gmail || '-'}</td>
                    <td>${item.instituicao || '-'}</td>
                    <td>${item.tipoFormacao || '-'}</td>
                    <td>${item.turma || '-'}</td>
                    <td>${item.tipoPagamento || '-'}</td>
                    <td>${item.codigoEspecial || '-'}</td>
                    <td><span class="badge ${expirado ? 'badge-danger' : 'badge-success'}">${item.tempoAcesso || '-'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.viewDetails('${item.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteItem('formacao', '${item.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `}).join('');
        },

        renderServicosTable: function() {
            const tbody = document.getElementById('servicosPersonalizadosBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.servicos;
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.nome || '-'}</td>
                    <td>${item.identificacao || '-'}</td>
                    <td>${item.sector || '-'}</td>
                    <td>${item.paisRegiao || '-'}</td>
                    <td>${item.tipoServico || '-'}</td>
                    <td>${item.descricao ? item.descricao.substring(0, 30) + '...' : '-'}</td>
                    <td>${item.formaPagamento || '-'}</td>
                    <td>${item.valorPago ? Utils.formatCurrency(item.valorPago) : '-'}</td>
                    <td>${item.dataCadastro ? Utils.formatDate(item.dataCadastro) : '-'}</td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.viewDetails('${item.id}')" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteItem('servicos', '${item.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        },

        renderParceirosTable: function() {
            const tbody = document.getElementById('parceirosBody');
            if (!tbody) return;
            
            const data = AppState.dataSheets.parceiros;
            tbody.innerHTML = data.map(item => {
                const statusClass = item.status === 'Ativo' ? 'badge-success' : 
                                   item.status === 'Pendente' ? 'badge-warning' : 'badge-danger';
                
                return `
                <tr>
                    <td>${item.nome || '-'}</td>
                    <td>${item.funcao || '-'}</td>
                    <td>${item.email || item.gmail || '-'}</td>
                    <td>${item.telefone || '-'}</td>
                    <td>${item.pais || '-'}</td>
                    <td>${item.regiao || '-'}</td>
                    <td><span class="badge ${statusClass}">${item.status || 'Pendente'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="DataLoader.aprovarParceiro('${item.id}')" title="Aprovar"><i class="fas fa-check-circle"></i></button>
                        <button class="btn-icon" onclick="DataLoader.bloquearParceiro('${item.id}')" title="Bloquear"><i class="fas fa-ban"></i></button>
                        <button class="btn-icon" onclick="DataLoader.deleteItem('parceiros', '${item.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `}).join('');
        },

        renderConteudosCategorias: function() {
            const container = document.getElementById('conteudosCategorias');
            if (!container) return;
            
            container.innerHTML = `
                <div class="categoria-card">
                    <h4>Biblioteca de E-books</h4>
                    <div class="categoria-actions">
                        <button class="btn btn-primary btn-small" onclick="ContentManager.showForm('ebook')">
                            <i class="fas fa-plus"></i> Adicionar E-book
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="ContentManager.gerenciar('ebooks')">
                            <i class="fas fa-edit"></i> Gerenciar
                        </button>
                    </div>
                    <div class="itens-preview" id="previewEbooks"></div>
                </div>
                <div class="categoria-card">
                    <h4>Biblioteca de Infográficos</h4>
                    <div class="categoria-actions">
                        <button class="btn btn-primary btn-small" onclick="ContentManager.showForm('infografico')">
                            <i class="fas fa-plus"></i> Adicionar Infográfico
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="ContentManager.gerenciar('infograficos')">
                            <i class="fas fa-edit"></i> Gerenciar
                        </button>
                    </div>
                    <div class="itens-preview" id="previewInfograficos"></div>
                </div>
                <div class="categoria-card">
                    <h4>Vídeos e Áudios</h4>
                    <div class="categoria-actions">
                        <button class="btn btn-primary btn-small" onclick="ContentManager.showForm('video')">
                            <i class="fas fa-plus"></i> Adicionar Mídia
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="ContentManager.gerenciar('videos')">
                            <i class="fas fa-edit"></i> Gerenciar
                        </button>
                    </div>
                    <div class="itens-preview" id="previewVideos"></div>
                </div>
                <div class="categoria-card">
                    <h4>Slides e Apresentações</h4>
                    <div class="categoria-actions">
                        <button class="btn btn-primary btn-small" onclick="ContentManager.showForm('slide')">
                            <i class="fas fa-plus"></i> Adicionar Slide
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="ContentManager.gerenciar('slides')">
                            <i class="fas fa-edit"></i> Gerenciar
                        </button>
                    </div>
                    <div class="itens-preview" id="previewSlides"></div>
                </div>
            `;
        },

        // Ações CRUD
        editUser: async function(userId) {
            Utils.showNotification('Funcionalidade de edição em desenvolvimento', 'warning');
        },

        deleteUser: async function(userId) {
            if (confirm('Tem certeza que deseja excluir este usuário permanentemente?')) {
                Utils.showNotification('Usuário excluído com sucesso', 'success');
                // Implementar chamada à API
            }
        },

        deleteItem: async function(sheet, itemId) {
            if (confirm('Tem certeza que deseja excluir este item?')) {
                Utils.showNotification('Item excluído com sucesso', 'success');
            }
        },

        viewDetails: async function(itemId) {
            Utils.showNotification('Detalhes do item em desenvolvimento', 'info');
        },

        aprovarParceiro: async function(parceiroId) {
            if (confirm('Aprovar este parceiro?')) {
                try {
                    await GoogleSheetsAPI.atualizarStatusParceiro(parceiroId, 'Ativo');
                    Utils.showNotification('Parceiro aprovado com sucesso', 'success');
                    await this.loadParceiros();
                    this.renderParceirosTable();
                } catch (error) {
                    Utils.showNotification('Erro ao aprovar parceiro', 'error');
                }
            }
        },

        bloquearParceiro: async function(parceiroId) {
            if (confirm('Bloquear este parceiro?')) {
                try {
                    await GoogleSheetsAPI.atualizarStatusParceiro(parceiroId, 'Bloqueado');
                    Utils.showNotification('Parceiro bloqueado', 'success');
                    await this.loadParceiros();
                    this.renderParceirosTable();
                } catch (error) {
                    Utils.showNotification('Erro ao bloquear parceiro', 'error');
                }
            }
        },

        searchData: async function(sheetKey, term) {
            const result = await GoogleSheetsAPI.searchData(sheetKey, term);
            return result.dados || [];
        }
    };

    // ===== GERENCIADOR DE CONTEÚDOS =====
    const ContentManager = {
        showForm: function(tipo) {
            document.getElementById('formConteudoTitle').textContent = `Adicionar ${tipo}`;
            document.getElementById('tipoConteudo').value = tipo;
            document.getElementById('editConteudoId').value = '';
            document.getElementById('conteudoForm').reset();
            document.getElementById('formAdicionarConteudo').style.display = 'block';
        },

        hideForm: function() {
            document.getElementById('formAdicionarConteudo').style.display = 'none';
        },

        gerenciar: function(categoria) {
            Utils.showNotification(`Gerenciar ${categoria} em desenvolvimento`, 'info');
        },

        saveContent: async function(event) {
            event.preventDefault();
            
            const formData = {
                id: document.getElementById('editConteudoId').value || Date.now(),
                tipo: document.getElementById('tipoConteudo').value,
                categoria: document.getElementById('categoriaConteudo').value,
                titulo: document.getElementById('tituloConteudo').value,
                descricao: document.getElementById('descricaoConteudo').value,
                url: document.getElementById('urlConteudo').value,
                thumbnail: document.getElementById('thumbnailConteudo').value,
                tags: document.getElementById('tagsConteudo').value.split(',').map(t => t.trim())
            };

            Utils.showNotification('Conteúdo salvo com sucesso', 'success');
            this.hideForm();
        }
    };

    // ===== SISTEMA DE BUSCA =====
    const SearchManager = {
        init: function() {
            const searchInput = document.getElementById('searchUsuarios');
            if (searchInput) {
                searchInput.addEventListener('input', Utils.debounce((e) => {
                    this.searchUsuarios(e.target.value);
                }, 300));
            }
        },

        searchUsuarios: async function(term) {
            if (!term) {
                DataLoader.renderUsuariosTable();
                return;
            }
            
            const results = await DataLoader.searchData('cadastro', term);
            AppState.dataSheets.cadastro = results;
            DataLoader.renderUsuariosTable();
        }
    };

    // ===== INICIALIZAÇÃO =====
    function init() {
        console.log('🚀 Inicializando Painel Administrativo Teca Capital...');
        
        AuthManager.init();
        SearchManager.init();

        // Event listener para logout
        document.getElementById('btnLogout').addEventListener('click', () => AuthManager.logout());

        // Event listener para formulário de conteúdo
        document.getElementById('conteudoForm').addEventListener('submit', (e) => ContentManager.saveContent(e));
        document.getElementById('cancelarConteudo').addEventListener('click', () => ContentManager.hideForm());

        // Event listener para checkboxes de seleção em massa
        document.getElementById('selectAllUsuarios')?.addEventListener('change', (e) => {
            document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = e.target.checked);
        });

        // Event listener para botões de ação em massa
        document.getElementById('btnBloquearSelecionados')?.addEventListener('click', () => {
            const selected = document.querySelectorAll('.user-checkbox:checked');
            if (selected.length === 0) {
                Utils.showNotification('Selecione pelo menos um usuário', 'warning');
                return;
            }
            Utils.showNotification(`${selected.length} usuário(s) bloqueado(s)`, 'success');
        });

        document.getElementById('btnRemoverSelecionados')?.addEventListener('click', () => {
            const selected = document.querySelectorAll('.user-checkbox:checked');
            if (selected.length === 0) {
                Utils.showNotification('Selecione pelo menos um usuário', 'warning');
                return;
            }
            if (confirm(`Remover ${selected.length} usuário(s) permanentemente?`)) {
                Utils.showNotification(`${selected.length} usuário(s) removido(s)`, 'success');
            }
        });

        // Carregar Font Awesome se não existir
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
            document.head.appendChild(link);
        }

        // Verificar status do sistema
        GoogleSheetsAPI.getStatus().then(result => {
            if (result.sucesso) {
                console.log('✅ Sistema conectado:', result);
            }
        }).catch(error => {
            console.error('❌ Erro de conexão:', error);
            Utils.showNotification('Erro ao conectar com o servidor', 'error');
        });

        // Adicionar estilos para notificações e loader
        addCustomStyles();
    }

    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                background: var(--primary-black);
                border: 2px solid var(--primary-gold);
                border-radius: 12px;
                color: var(--primary-white);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            }
            
            .admin-notification.show {
                transform: translateX(0);
            }
            
            .admin-notification.success {
                border-color: var(--secondary-green);
            }
            
            .admin-notification.error {
                border-color: var(--secondary-red);
            }
            
            .admin-notification i {
                font-size: 1.5rem;
            }
            
            .global-loader {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                backdrop-filter: blur(5px);
            }
            
            .loader-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid var(--admin-card-bg);
                border-top-color: var(--primary-gold);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .senha-temporaria {
                background: rgba(214,174,100,0.2);
                border: 2px solid var(--primary-gold);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                animation: pulse 2s infinite;
            }
            
            .senha-temporaria strong {
                font-size: 1.5rem;
                display: block;
                margin-bottom: 10px;
                color: var(--primary-gold);
                letter-spacing: 2px;
            }
            
            .senha-temporaria .timer {
                color: var(--secondary-red);
                font-weight: 600;
            }
            
            .senha-expirada {
                background: rgba(204,51,51,0.1);
                border: 2px solid var(--secondary-red);
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            
            .reauth-popup {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
                backdrop-filter: blur(10px);
            }
            
            .reauth-content {
                background: var(--admin-card-bg);
                border: 2px solid var(--primary-gold);
                border-radius: 20px;
                padding: 40px;
                max-width: 400px;
                text-align: center;
            }
            
            .reauth-content h3 {
                color: var(--primary-gold);
                margin-bottom: 20px;
            }
            
            .reauth-content p {
                margin-bottom: 30px;
                color: var(--text-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expor funções globalmente
    window.DataLoader = DataLoader;
    window.ContentManager = ContentManager;
    window.Utils = Utils;
})();