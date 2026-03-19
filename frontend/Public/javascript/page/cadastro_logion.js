// ============================================================
// TECA CAPITAL INVESTIMENTOS - FRONTEND JAVASCRIPT
// ============================================================
// Plataforma: Fintech Angolana
// Comunicação: Google Apps Script + Google Sheets
// ============================================================

// ============================================================
// CONFIGURAÇÃO GLOBAL — URL DO APPS SCRIPT
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8Esw7LGasoZ3lkDOWugWSd6Cz18daJMXO2ZtNxFwo4KZnDNgcfwilToMcIuJl-sBC/exec';

// ============================================================
// CLASSE PRINCIPAL DO FORMULÁRIO
// ============================================================
class TecaForm {
    constructor() {
        // Configurações
        this.WHATSAPP_NUMBER = '244974235284';
        
        // Estado da aplicação
        this.currentMode = 'cadastro';
        this.currentUserType = null;
        this.formData = {};
        this.isLoading = false;
        
        // Inicializar
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEvents();
        this.renderForm();
        
        // Verificar se há utilizador logado
        this.verificarSessao();
    }

    cacheElements() {
        this.dynamicForm = document.getElementById('teca-dynamic-form');
        this.messageContainer = document.getElementById('teca-message-container');
        this.navButtons = document.querySelectorAll('.teca-nav-btn');
    }

    attachEvents() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        this.dynamicForm.addEventListener('change', (e) => {
            if (e.target.name === 'tipoUsuario') {
                this.handleUserTypeChange(e.target.value);
            }
            if (e.target.name === 'comprovativoEnviado') {
                this.handleComprovativoChange(e.target.value);
            }
        });

        this.dynamicForm.addEventListener('click', (e) => {
            if (e.target.closest('.teca-toggle-btn')) {
                const btn = e.target.closest('.teca-toggle-btn');
                const type = btn.dataset.type;
                this.handleTipoPessoaToggle(type);
            }
            if (e.target.closest('.teca-whatsapp-btn')) {
                this.openWhatsApp();
            }
        });

        this.dynamicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    verificarSessao() {
        const logado = sessionStorage.getItem('logado');
        if (logado === 'true') {
            const utilizador = JSON.parse(sessionStorage.getItem('utilizador') || '{}');
            console.log('👤 Utilizador logado:', utilizador);
            
            // Se estiver na página de login/cadastro e já estiver logado, redirecionar
            if (window.location.pathname.includes('login') || window.location.pathname.includes('cadastro')) {
                const tipo = utilizador.tipo;
                switch(tipo) {
                    case 'Administrador':
                        window.location.href = '/admin/dashboard';
                        break;
                    case 'Parceiro':
                        window.location.href = '/parceiro/area';
                        break;
                    default:
                        window.location.href = '/plataforma';
                }
            }
        }
    }

    // ============================================================
    // FUNÇÃO 5 — FEEDBACK VISUAL DE CARREGAMENTO
    // ============================================================
    mostrarCarregando(estado) {
        this.isLoading = estado;
        
        const submitBtn = document.querySelector('.teca-submit-btn');
        const loader = document.getElementById('teca-loader');
        
        if (!loader && estado) {
            // Criar loader se não existir
            const novoLoader = document.createElement('div');
            novoLoader.id = 'teca-loader';
            novoLoader.className = 'teca-loader';
            novoLoader.innerHTML = '<span class="teca-loading"></span> Processando...';
            this.messageContainer.appendChild(novoLoader);
        }

        if (loader) {
            loader.style.display = estado ? 'flex' : 'none';
        }

        if (submitBtn) {
            // Guardar texto original se não estiver guardado
            if (!submitBtn.dataset.textoOriginal) {
                submitBtn.dataset.textoOriginal = submitBtn.innerHTML;
            }
            
            submitBtn.disabled = estado;
            submitBtn.innerHTML = estado 
                ? '<span class="teca-loading"></span> A processar...' 
                : this.currentMode === 'cadastro' 
                    ? '<i class="fas fa-check-circle"></i> Registrar Cadastro'
                    : '<i class="fas fa-sign-in-alt"></i> Entrar na Plataforma';
        }
    }

    // ============================================================
    // FUNÇÃO 6 — EXIBIR MENSAGEM
    // ============================================================
    exibirMensagem(tipo, texto) {
        console.log(`📢 Mensagem [${tipo}]:`, texto);
        
        // Limpar mensagens anteriores
        this.messageContainer.innerHTML = '';
        
        // Criar elemento de mensagem
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `teca-message ${tipo}`;
        
        // Ícone conforme o tipo
        const icone = tipo === 'sucesso' ? 'fa-check-circle' : 
                     tipo === 'aviso' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
        
        mensagemDiv.innerHTML = `
            <i class="fas ${icone}"></i>
            <span>${texto}</span>
        `;
        
        this.messageContainer.appendChild(mensagemDiv);
        this.messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-remover após 5 segundos (apenas mensagens de sucesso)
        if (tipo === 'sucesso') {
            setTimeout(() => {
                if (mensagemDiv.parentNode) {
                    mensagemDiv.remove();
                }
            }, 5000);
        }
    }

    // ============================================================
    // FUNÇÃO 4 — VERIFICAR EMAIL (ANTES DO CADASTRO)
    // ============================================================
    async verificarEmail(email) {
        try {
            if (!email || email.trim() === '') {
                return { sucesso: false, existe: false };
            }

            const dados = {
                acao: 'verificarEmail',
                email: email.trim()
            };

            const resultado = await this.chamarBackend(dados);
            
            if (resultado && resultado.sucesso) {
                return resultado;
            }
            
            return { sucesso: false, existe: false };
            
        } catch (erro) {
            console.error('❌ Erro ao verificar email:', erro);
            return { sucesso: false, existe: false };
        }
    }

    // ============================================================
    // FUNÇÃO UNIVERSAL DE COMUNICAÇÃO COM O BACKEND
    // ============================================================
    async chamarBackend(dadosParaEnviar) {
        try {
            console.log('📤 Enviando para backend:', dadosParaEnviar);
            
            // Configuração CORRETA para Apps Script
            const resposta = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // NÃO define Content-Type — evita erro de CORS preflight
                body: JSON.stringify(dadosParaEnviar),
                redirect: 'follow' // OBRIGATÓRIO — Apps Script redireciona
            });

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status} - ${resposta.statusText}`);
            }

            const resultado = await resposta.json();
            console.log('📥 Resposta do backend:', resultado);
            return resultado;

        } catch (erro) {
            console.error('❌ Erro na comunicação com backend:', erro);
            
            // Mensagens de erro mais amigáveis
            let mensagemErro = 'Erro de conexão com o servidor';
            
            if (erro.message.includes('Failed to fetch')) {
                mensagemErro = 'Não foi possível conectar ao servidor. Verifique sua internet.';
            } else if (erro.message.includes('HTTP')) {
                mensagemErro = 'Erro no servidor. Tente novamente mais tarde.';
            }
            
            return { 
                sucesso: false, 
                mensagem: mensagemErro,
                erro: erro.message 
            };
        }
    }

    // ============================================================
    // FUNÇÃO 2 — CADASTRAR UTILIZADOR
    // ============================================================
    async cadastrarUtilizador(dados) {
        try {
            console.log('📝 Processando cadastro:', dados);
            
            // Validações obrigatórias
            if (!dados.nome || dados.nome.trim() === '') {
                return { sucesso: false, mensagem: 'Nome é obrigatório' };
            }
            
            if (!dados.email || dados.email.trim() === '') {
                return { sucesso: false, mensagem: 'Email é obrigatório' };
            }
            
            if (!dados.telefone || dados.telefone.trim() === '') {
                return { sucesso: false, mensagem: 'Telefone é obrigatório' };
            }
            
            if (!dados.tipoUsuario) {
                return { sucesso: false, mensagem: 'Tipo de usuário é obrigatório' };
            }
            
            // Verificar email antes de cadastrar
            this.exibirMensagem('aviso', 'Verificando disponibilidade do email...');
            
            const verificacao = await this.verificarEmail(dados.email);
            
            if (verificacao.existe) {
                return { 
                    sucesso: false, 
                    mensagem: '❌ Este email já está cadastrado no sistema' 
                };
            }
            
            // Preparar dados para envio ao backend
            const dadosParaEnviar = {
                acao: 'cadastrar',  // OBRIGATÓRIO — identifica a ação no backend
                nome: dados.nome,
                dataNascimento: dados.dataNascimento || '',
                sexo: dados.sexo || '',
                pais: dados.pais || 'Angola',
                regiao: dados.regiao || '',
                email: dados.email,
                telefone: dados.telefone,
                tipoUsuario: dados.tipoUsuario,
                senha: dados.senha || '',
                valorPago: dados.valorPago || '',
                comprovativo: dados.comprovativoEnviado || 'Não',
                descricao: dados.descricao || '',
                dataExpiracao: dados.dataExpiracao || '' // Será calculada no backend
            };
            
            // Adicionar campos específicos conforme necessário
            if (dados.tipoUsuario === 'Serviços Personalizados') {
                dadosParaEnviar.senha = ''; // Serviços Personalizados não tem senha
            }
            
            const resultado = await this.chamarBackend(dadosParaEnviar);
            
            if (resultado.sucesso) {
                // Limpar formulário após sucesso
                setTimeout(() => {
                    this.currentUserType = null;
                    this.renderForm();
                }, 3000);
            }
            
            return resultado;
            
        } catch (erro) {
            console.error('❌ Erro no cadastro:', erro);
            return { 
                sucesso: false, 
                mensagem: 'Erro interno ao processar cadastro' 
            };
        }
    }

    // ============================================================
    // FUNÇÃO 1 — FAZER LOGIN
    // ============================================================
    async fazerLogin(dados) {
        try {
            console.log('🔐 Processando login:', dados);

            // Validações básicas
            if (!dados.senha || dados.senha.trim() === '') {
                return { sucesso: false, mensagem: 'Senha é obrigatória' };
            }

            // Preparar dados para login conforme o tipo
            const dadosLogin = {
                acao: 'login',  // OBRIGATÓRIO — identifica a ação no backend
                senha: dados.senha
            };

            // Adicionar campos específicos conforme o tipo
            if (this.currentUserType === 'Administrador') {
                if (!dados.id || !dados.nome) {
                    return { sucesso: false, mensagem: 'ID e Nome são obrigatórios para Administrador' };
                }
                dadosLogin.id = parseInt(dados.id);
                dadosLogin.nome = dados.nome;
                dadosLogin.tipo = 'Administrador';
            } else {
                // Para Parceiro e Usuário da Plataforma
                if (dados.email && dados.email.trim() !== '') {
                    dadosLogin.email = dados.email.trim();
                }
                if (dados.nome && dados.nome.trim() !== '') {
                    dadosLogin.nome = dados.nome;
                }
                
                // Validar se tem pelo menos um identificador
                if (!dadosLogin.email && !dadosLogin.nome) {
                    return { 
                        sucesso: false, 
                        mensagem: 'É necessário fornecer email OU nome para login' 
                    };
                }
            }

            const resultado = await this.chamarBackend(dadosLogin);

            // Se login bem-sucedido, guardar na sessão
            if (resultado.sucesso && resultado.dados) {
                // Guardar dados do utilizador no sessionStorage
                sessionStorage.setItem('utilizador', JSON.stringify(resultado.dados));
                sessionStorage.setItem('logado', 'true');
                sessionStorage.setItem('tipoUsuario', resultado.dados.tipo);
                
                this.exibirMensagem('sucesso', `✅ Bem-vindo, ${resultado.dados.nome}!`);
                
                // Redirecionar após login bem-sucedido
                setTimeout(() => {
                    const tipoUsuario = resultado.dados.tipo;
                    switch(tipoUsuario) {
                        case 'Administrador':
                            window.location.href = 'adm.html';
                            break;
                        case 'Parceiro':
                            window.location.href = '/biblioteca-audio.html';
                            break;
                        default:
                            window.location.href = 'biblioteca-audio.html';
                    }
                }, 1500);
            } else {
                // Mensagens específicas para casos de erro
                if (resultado.status === 'expirado') {
                    this.exibirMensagem('erro', '⏰ Acesso expirado. Contacte o administrador.');
                } else if (resultado.status === 'bloqueado') {
                    this.exibirMensagem('erro', '🔒 Acesso revogado. Contacte o administrador.');
                }
            }

            return resultado;

        } catch (erro) {
            console.error('❌ Erro no login:', erro);
            return { 
                sucesso: false, 
                mensagem: 'Erro interno ao processar login' 
            };
        }
    }

    // ============================================================
    // FUNÇÃO 3 — CONSULTAR DADOS (para páginas de admin)
    // ============================================================
    async consultarDados(filtro = {}) {
        try {
            console.log('📊 Consultando dados');
            
            // Verificar se está logado
            const logado = sessionStorage.getItem('logado');
            if (logado !== 'true') {
                window.location.href = '/login.html';
                return;
            }

            const dadosConsulta = {
                acao: 'consultar',
                ...filtro
            };

            const resultado = await this.chamarBackend(dadosConsulta);

            if (resultado.sucesso && resultado.dados) {
                this.exibirDadosNaTabela(resultado.dados);
            } else {
                this.exibirMensagem('erro', resultado.mensagem || 'Erro ao carregar dados');
            }

            return resultado;

        } catch (erro) {
            console.error('❌ Erro na consulta:', erro);
            this.exibirMensagem('erro', 'Erro ao consultar dados');
            return { sucesso: false, dados: [] };
        }
    }

    exibirDadosNaTabela(dados) {
        // Verificar se existe uma tabela para exibir os dados
        const tabela = document.getElementById('teca-tabela-dados');
        if (!tabela) return;

        const tbody = tabela.querySelector('tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (dados.length === 0) {
            const linha = document.createElement('tr');
            linha.innerHTML = `<td colspan="6" class="teca-sem-dados">Nenhum registo encontrado</td>`;
            tbody.appendChild(linha);
            return;
        }

        dados.forEach(item => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${item['ID'] || ''}</td>
                <td>${item['Nome do Usuário'] || ''}</td>
                <td>${item['Email'] || ''}</td>
                <td>${item['Tipo de Usuário'] || ''}</td>
                <td>${item['Valor Pago'] || ''}</td>
                <td>${item['Data de Registro'] || ''}</td>
            `;
            tbody.appendChild(linha);
        });
    }

    // ============================================================
    // MÉTODOS EXISTENTES (preservados sem alterações)
    // ============================================================

    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        this.currentMode = mode;
        this.currentUserType = null;
        this.clearMessages();
        this.renderForm();
    }

    renderForm() {
        if (this.currentMode === 'cadastro') {
            this.renderCadastroForm();
        } else {
            this.renderLoginForm();
        }
    }

    renderLoginForm() {
        const html = `
            <div class="teca-form-section">
                <div class="teca-type-selector">
                    <span class="teca-type-label"><i class="fas fa-user-tag"></i> Tipo de Usuário</span>
                    <div class="teca-type-options">
                        ${this.renderUserTypeOptions('login', ['Administrador', 'Parceiro', 'Usuário da Plataforma'])}
                    </div>
                </div>

                <form id="teca-login-form" class="teca-login-form">
                    <div id="teca-login-fields">
                        ${this.renderLoginFields()}
                    </div>

                    <button type="submit" class="teca-submit-btn" ${!this.currentUserType ? 'disabled' : ''}>
                        <i class="fas fa-sign-in-alt"></i>
                        Entrar na Plataforma
                    </button>
                </form>
            </div>
        `;
        
        this.dynamicForm.innerHTML = html;
    }

    renderLoginFields() {
        if (!this.currentUserType) {
            return '<p class="teca-info-text"><i class="fas fa-info-circle"></i> Selecione um tipo de usuário</p>';
        }

        if (this.currentUserType === 'Administrador') {
            return `
                <div class="teca-form-group">
                    <label><i class="fas fa-id-card"></i> ID</label>
                    <input type="number" name="id" id="loginId" placeholder="Digite seu ID" required>
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-user"></i> Nome</label>
                    <input type="text" name="nome" id="loginNome" placeholder="Digite seu nome" required>
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-lock"></i> Senha</label>
                    <input type="password" name="senha" id="loginSenha" placeholder="Digite sua senha" required>
                </div>
            `;
        } else {
            return `
                <div class="teca-form-group">
                    <label><i class="fas fa-user"></i> Nome de Usuário</label>
                    <input type="text" name="nome" id="loginNome" placeholder="Digite seu nome de usuário">
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="loginEmail" placeholder="Digite seu email">
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-lock"></i> Senha</label>
                    <input type="password" name="senha" id="loginSenha" placeholder="Digite sua senha" required>
                </div>
                <p class="teca-info-text"><i class="fas fa-info-circle"></i> Preencha o nome OU o email para login</p>
            `;
        }
    }

    renderCadastroForm() {
        const html = `
            <div class="teca-form-section">
                <div class="teca-type-selector">
                    <span class="teca-type-label"><i class="fas fa-user-plus"></i> Tipo de Cadastro</span>
                    <div class="teca-type-options">
                        ${this.renderUserTypeOptions('cadastro', [
                            'Parceiro',
                            'Simulador - Biblioteca',
                            'Curso Online',
                            'Formação Presencial',
                            'Serviços Personalizados'
                        ])}
                    </div>
                </div>

                <form id="teca-cadastro-form" class="teca-cadastro-form">
                    <div id="teca-cadastro-fields">
                        ${this.renderCadastroFields()}
                    </div>

                    <button type="submit" class="teca-submit-btn" ${!this.currentUserType ? 'disabled' : ''}>
                        <i class="fas fa-check-circle"></i>
                        Registrar Cadastro
                    </button>
                </form>
            </div>
        `;
        
        this.dynamicForm.innerHTML = html;
        
        if (this.currentUserType === 'Formação Presencial') {
            this.initFormacaoPresencial();
        }
    }

    initFormacaoPresencial() {
        this.updateValoresFormacao();
        
        document.querySelectorAll('#toggle-individual, #toggle-instituicao, [name="associadoParceira"]').forEach(el => {
            el.addEventListener('change', () => this.updateValoresFormacao());
        });
    }

    updateValoresFormacao() {
        const selectValores = document.getElementById('select-valores');
        if (!selectValores) return;
        
        const isInstituicao = document.getElementById('toggle-instituicao')?.classList.contains('active');
        const isAssociado = document.querySelector('[name="associadoParceira"]')?.value === 'sim';
        
        let options = '';
        
        if (isInstituicao) {
            options = `
                <option value="">Selecione o valor</option>
                <option value="150.000 Kz">150.000 Kz - Básico</option>
                <option value="250.000 Kz">250.000 Kz - Intermediário</option>
                <option value="700.000 Kz">700.000 Kz - Máximo</option>
            `;
            document.getElementById('campo-instituicao').style.display = 'block';
            document.getElementById('campo-associado').style.display = 'none';
        } else {
            if (isAssociado) {
                options = `
                    <option value="7.500 Kz">7.500 Kz - Associado (15 dias)</option>
                `;
            } else {
                options = `
                    <option value="">Selecione o valor</option>
                    <option value="20.000 Kz">20.000 Kz - Básico (90 dias)</option>
                    <option value="70.000 Kz">70.000 Kz - Avançado (90 dias)</option>
                `;
            }
            document.getElementById('campo-instituicao').style.display = 'none';
            document.getElementById('campo-associado').style.display = 'block';
        }
        
        selectValores.innerHTML = options;
    }

    renderUserTypeOptions(context, tipos) {
        return tipos.map(tipo => {
            const icon = this.getUserTypeIcon(tipo);
            return `
                <div class="teca-type-option">
                    <input type="radio" 
                           name="tipoUsuario" 
                           id="tipo-${tipo.replace(/\s+/g, '-')}" 
                           value="${tipo}"
                           ${this.currentUserType === tipo ? 'checked' : ''}>
                    <label for="tipo-${tipo.replace(/\s+/g, '-')}">
                        <i class="fas ${icon}"></i>
                        ${tipo}
                    </label>
                </div>
            `;
        }).join('');
    }

    getUserTypeIcon(tipo) {
        const icons = {
            'Administrador': 'fa-crown',
            'Parceiro': 'fa-handshake',
            'Usuário da Plataforma': 'fa-user-graduate',
            'Simulador - Biblioteca': 'fa-calculator',
            'Curso Online': 'fa-video',
            'Formação Presencial': 'fa-chalkboard-teacher',
            'Serviços Personalizados': 'fa-concierge-bell'
        };
        return icons[tipo] || 'fa-user';
    }

    renderCadastroFields() {
        if (!this.currentUserType) {
            return '<p class="teca-info-text"><i class="fas fa-info-circle"></i> Selecione um tipo de cadastro</p>';
        }

        let fields = this.renderBaseFields();

        switch (this.currentUserType) {
            case 'Parceiro':
                fields += this.renderParceiroFields();
                break;
            case 'Simulador - Biblioteca':
                fields += this.renderSimuladorBibliotecaFields();
                break;
            case 'Curso Online':
                fields += this.renderCursoOnlineFields();
                break;
            case 'Formação Presencial':
                fields += this.renderFormacaoPresencialFields();
                break;
            case 'Serviços Personalizados':
                fields += this.renderServicosPersonalizadosFields();
                break;
        }

        return fields;
    }

    renderBaseFields() {
        return `
            <div class="teca-form-grid">
                <div class="teca-form-group full-width">
                    <label><i class="fas fa-user"></i> Nome de Usuário</label>
                    <input type="text" name="nome" id="nome" placeholder="Digite seu nome completo" required>
                </div>
                
                ${this.currentUserType !== 'Serviços Personalizados' ? `
                    <div class="teca-form-group">
                        <label><i class="fas fa-calendar"></i> Data de Nascimento</label>
                        <input type="date" name="dataNascimento" id="dataNascimento" required>
                    </div>
                    
                    <div class="teca-form-group">
                        <label><i class="fas fa-venus-mars"></i> Sexo</label>
                        <select name="sexo" id="sexo" required>
                            <option value="">Selecione</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                        </select>
                    </div>
                ` : ''}
                
                <div class="teca-form-group">
                    <label><i class="fas fa-globe-africa"></i> País</label>
                    <input type="text" name="pais" id="pais" value="Angola" placeholder="País" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Região/Província</label>
                    <input type="text" name="regiao" id="regiao" placeholder="Digite sua província" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="email" placeholder="seu@email.com" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-phone-alt"></i> Telefone</label>
                    <input type="tel" name="telefone" id="telefone" placeholder="923456789" required>
                </div>
            </div>
        `;
    }

    renderParceiroFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-briefcase"></i> Função</label>
                <select name="descricao" id="descricao" required>
                    <option value="">Selecione sua função</option>
                    <option value="Líder Regional">Líder Regional</option>
                    <option value="Formador">Formador</option>
                    <option value="Assistente">Assistente</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-lock"></i> Senha de Acesso</label>
                <input type="password" name="senha" id="senha" placeholder="Crie uma senha segura" required>
            </div>
            
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Moderado | Expiração: Permanente
            </div>
        `;
    }

    renderSimuladorBibliotecaFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Valor Pago</label>
                <div class="teca-fixed-value">
                    <i class="fas fa-check-circle"></i>
                    7.500 Kz (Fixo)
                </div>
                <input type="hidden" name="valorPago" id="valorPago" value="7.500 Kz">
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim, já enviei</option>
                    <option value="Não">Não, enviarei depois</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: none;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp
                </button>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-lock"></i> Senha de Acesso</label>
                <input type="password" name="senha" id="senha" placeholder="Crie uma senha segura" required>
            </div>
            
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Restrito | Expiração: 90 dias após registro
            </div>
        `;
    }

    renderCursoOnlineFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Valor do Curso</label>
                <select name="valorPago" id="valorPago" required>
                    <option value="">Selecione o valor</option>
                    <option value="20.000 Kz">20.000 Kz - Curso Básico</option>
                    <option value="50.000 Kz">50.000 Kz - Curso Completo</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim, já enviei</option>
                    <option value="Não">Não, enviarei depois</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: none;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp
                </button>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-lock"></i> Senha de Acesso</label>
                <input type="password" name="senha" id="senha" placeholder="Crie uma senha segura" required>
            </div>
            
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Restrito | Expiração: 180 dias após registro
            </div>
        `;
    }

    renderFormacaoPresencialFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-building"></i> Tipo de Inscrição</label>
                <div class="teca-toggle-container">
                    <button type="button" class="teca-toggle-btn active" data-type="individual" id="toggle-individual">
                        <i class="fas fa-user"></i> Individual
                    </button>
                    <button type="button" class="teca-toggle-btn" data-type="instituicao" id="toggle-instituicao">
                        <i class="fas fa-building"></i> Instituição/Empresa
                    </button>
                </div>
            </div>
            
            <div class="teca-form-group full-width" id="campo-instituicao" style="display: none;">
                <label><i class="fas fa-building"></i> Nome da Instituição</label>
                <input type="text" name="nomeInstituicao" id="nomeInstituicao" placeholder="Digite o nome da instituição">
            </div>
            
            <div class="teca-form-group full-width" id="campo-associado" style="display: block;">
                <label><i class="fas fa-handshake"></i> Associado a instituição parceira?</label>
                <select name="associadoParceira" id="associadoParceira">
                    <option value="nao">Não</option>
                    <option value="sim">Sim, sou associado</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Valor</label>
                <select name="valorPago" required id="select-valores">
                    <option value="">Selecione o valor</option>
                    <option value="20.000 Kz">20.000 Kz - Básico (90 dias)</option>
                    <option value="70.000 Kz">70.000 Kz - Avançado (90 dias)</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim, já enviei</option>
                    <option value="Não">Não, enviarei depois</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: none;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp
                </button>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-lock"></i> Senha de Acesso</label>
                <input type="password" name="senha" id="senha" placeholder="Crie uma senha segura" required>
            </div>
            
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Restrito | Expiração: 15 ou 90 dias conforme valor
            </div>
        `;
    }

    renderServicosPersonalizadosFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-id-card"></i> Tipo de Cadastro</label>
                <div class="teca-toggle-container">
                    <button type="button" class="teca-toggle-btn active" data-type="singular" id="toggle-singular">
                        <i class="fas fa-user"></i> Singular (Pessoa Física)
                    </button>
                    <button type="button" class="teca-toggle-btn" data-type="empresa" id="toggle-empresa">
                        <i class="fas fa-building"></i> Empresa
                    </button>
                </div>
            </div>
            
            <div class="teca-form-group full-width" id="campo-nome-container">
                <label><i class="fas fa-user"></i> Nome</label>
                <input type="text" name="nome" id="nome" placeholder="Digite seu nome" required>
            </div>
            
            <div id="campos-pessoa-fisica">
                <div class="teca-form-grid">
                    <div class="teca-form-group">
                        <label><i class="fas fa-calendar"></i> Data de Nascimento</label>
                        <input type="date" name="dataNascimento" id="dataNascimento">
                    </div>
                    
                    <div class="teca-form-group">
                        <label><i class="fas fa-venus-mars"></i> Sexo</label>
                        <select name="sexo" id="sexo">
                            <option value="">Selecione</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="teca-form-grid">
                <div class="teca-form-group">
                    <label><i class="fas fa-globe-africa"></i> País</label>
                    <input type="text" name="pais" id="pais" value="Angola" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Região</label>
                    <input type="text" name="regiao" id="regiao" required>
                </div>
            </div>
            
            <div class="teca-form-grid">
                <div class="teca-form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="email" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-phone-alt"></i> Telefone</label>
                    <input type="tel" name="telefone" id="telefone" required>
                </div>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Proposta de Valor</label>
                <input type="text" name="valorPago" id="valorPago" placeholder="Ex: 100.000 Kz" required>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-align-left"></i> Descrição do Serviço Pretendido</label>
                <textarea name="descricao" id="descricao" rows="4" placeholder="Descreva detalhadamente o serviço personalizado que pretende..." required></textarea>
            </div>
            
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Nenhum | Este tipo não tem acesso à plataforma
            </div>
        `;
    }

    handleUserTypeChange(tipo) {
        this.currentUserType = tipo;
        if (this.currentMode === 'cadastro') {
            this.renderCadastroForm();
        } else {
            this.renderLoginForm();
        }
    }

    handleComprovativoChange(valor) {
        const container = document.getElementById('teca-whatsapp-container');
        if (container) {
            container.style.display = valor === 'Sim' ? 'block' : 'none';
        }
    }

    handleTipoPessoaToggle(tipo) {
        document.querySelectorAll('.teca-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === tipo);
        });

        if (tipo === 'singular') {
            document.getElementById('campos-pessoa-fisica').style.display = 'block';
            document.querySelector('input[name="dataNascimento"]').required = true;
            document.querySelector('select[name="sexo"]').required = true;
            
            const nomeLabel = document.querySelector('#campo-nome-container label');
            if (nomeLabel) nomeLabel.innerHTML = '<i class="fas fa-user"></i> Nome (Pessoa Física)';
        } else {
            document.getElementById('campos-pessoa-fisica').style.display = 'none';
            document.querySelector('input[name="dataNascimento"]').required = false;
            document.querySelector('select[name="sexo"]').required = false;
            
            const nomeLabel = document.querySelector('#campo-nome-container label');
            if (nomeLabel) nomeLabel.innerHTML = '<i class="fas fa-building"></i> Nome da Empresa';
        }
    }

    openWhatsApp() {
        const form = document.querySelector('form');
        const formData = new FormData(form);
        
        const nome = formData.get('nome');
        const tipo = this.currentUserType;
        const valor = formData.get('valorPago');
        const data = new Date().toLocaleDateString('pt-PT');
        
        const mensagem = `*TECA CAPITAL - COMPROVATIVO DE PAGAMENTO*%0A%0A` +
                        `👤 Nome: ${nome}%0A` +
                        `📋 Tipo: ${tipo}%0A` +
                        `📅 Data: ${data}%0A` +
                        `💰 Valor: ${valor}%0A%0A` +
                        `🔗 Segue em anexo o comprovativo de pagamento.%0A%0A` +
                        `Obrigado!`;
        
        window.open(`https://wa.me/${this.WHATSAPP_NUMBER}?text=${mensagem}`, '_blank');
    }

    async handleSubmit() {
        const form = document.querySelector('form');
        if (!form) return;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        this.mostrarCarregando(true);
        this.clearMessages();

        try {
            const formData = new FormData(form);
            const data = this.processFormData(formData);

            let resultado;
            
            if (this.currentMode === 'cadastro') {
                resultado = await this.cadastrarUtilizador(data);
            } else {
                resultado = await this.fazerLogin(data);
            }

            if (resultado && resultado.sucesso) {
                this.exibirMensagem('sucesso', resultado.mensagem || 'Operação realizada com sucesso!');
                
                if (this.currentMode === 'cadastro') {
                    setTimeout(() => {
                        this.currentUserType = null;
                        this.renderForm();
                    }, 3000);
                }
            } else {
                this.exibirMensagem('erro', resultado?.mensagem || 'Erro ao processar');
            }
        } catch (error) {
            console.error('❌ Erro no handleSubmit:', error);
            this.exibirMensagem('erro', 'Erro de comunicação com o servidor. Tente novamente.');
        } finally {
            this.mostrarCarregando(false);
        }
    }

    processFormData(formData) {
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        data.tipoUsuario = this.currentUserType;
        
        if (this.currentUserType === 'Serviços Personalizados') {
            const tipoPessoa = document.querySelector('.teca-toggle-btn.active')?.dataset.type || 'singular';
            const nomeOriginal = data.nome;
            data.nome = tipoPessoa === 'singular' ? `Singular: ${nomeOriginal}` : `Empresa: ${nomeOriginal}`;
            
            if (tipoPessoa === 'empresa') {
                delete data.dataNascimento;
                delete data.sexo;
            }
        }

        if (this.currentUserType === 'Formação Presencial') {
            const tipo = document.querySelector('#toggle-instituicao')?.classList.contains('active') ? 'instituicao' : 'individual';
            
            if (tipo === 'instituicao') {
                const instituicao = data.nomeInstituicao || '';
                data.descricao = `Associado a: ${instituicao}`;
                data.associadoParceira = 'nao';
            } else {
                const associado = data.associadoParceira === 'sim';
                if (associado) {
                    data.descricao = 'Associado a instituição parceira (individual)';
                    data.valorPago = '7.500 Kz';
                } else {
                    data.descricao = 'Não associado a nenhuma instituição';
                }
            }
        }

        if (!data.pais) data.pais = 'Angola';
        if (!data.comprovativoEnviado) data.comprovativoEnviado = 'Não';
        
        return data;
    }

    clearMessages() {
        this.messageContainer.innerHTML = '';
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    new TecaForm();
});