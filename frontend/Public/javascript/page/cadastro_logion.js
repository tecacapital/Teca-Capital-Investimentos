// ============================================================
// TECA CAPITAL EDTECH - FRONTEND JAVASCRIPT
// ============================================================
// Plataforma: Edtech Angolana
// Versão: 1.0 
// ============================================================

// Configuração Global
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeahMxXzXIDou1hTshRYLmSPeHRFx5RmQvEe5iFP717iKbvyTt1covpO-ydpzmiD_Abg/exec';
const WHATSAPP_NUMBER = '244974235284';

// Mapeamento de tipos de cadastro para tipos de usuário no backend
const TIPO_USUARIO_MAP = {
    'Parceiro': 'Parceiro',
    'Simulador - Biblioteca': 'Usuário da Plataforma',
    'Curso Online': 'Usuário da Plataforma',
    'Formação Presencial': 'Usuário da Plataforma',
    'Serviços Personalizados': 'Usuário da Plataforma',
    'Usuário Não Pago': 'Usuário da Plataforma'
};

// ============================================================
// CLASSE PRINCIPAL DO FORMULÁRIO
// ============================================================
class TecaForm {
    constructor() {
        this.APPS_SCRIPT_URL = APPS_SCRIPT_URL;
        this.WHATSAPP_NUMBER = WHATSAPP_NUMBER;
        
        this.currentMode = 'cadastro';
        this.currentUserType = null;
        this.isLoading = false;
        this.senhaTimer = null;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachGlobalEvents();
        this.renderForm();
        this.verificarSessao();
    }

    cacheElements() {
        this.dynamicForm = document.getElementById('teca-dynamic-form');
        this.messageContainer = document.getElementById('teca-message-container');
        this.navButtons = document.querySelectorAll('.teca-nav-btn');
    }

    attachGlobalEvents() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    attachFormEvents() {
        if (!this.dynamicForm) return;

        // Evento de mudança de tipo de cadastro
        const tipoSelectors = this.dynamicForm.querySelectorAll('input[name="tipoCadastro"]');
        tipoSelectors.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleUserTypeChange(e.target.value);
            });
        });

        // Evento de mudança de tipo de login
        const loginTipoSelectors = this.dynamicForm.querySelectorAll('input[name="tipoUsuarioLogin"]');
        loginTipoSelectors.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleLoginTypeChange(e.target.value);
            });
        });

        // Evento de mudança de comprovativo
        const comprovativoSelect = this.dynamicForm.querySelector('#comprovativoEnviado');
        if (comprovativoSelect) {
            comprovativoSelect.addEventListener('change', (e) => {
                this.handleComprovativoChange(e.target.value);
            });
        }

        // Eventos de toggles
        const toggleIndividual = this.dynamicForm.querySelector('#toggle-individual');
        const toggleInstituicao = this.dynamicForm.querySelector('#toggle-instituicao');
        const toggleSingular = this.dynamicForm.querySelector('#toggle-singular');
        const toggleEmpresa = this.dynamicForm.querySelector('#toggle-empresa');
        const associadoSelect = this.dynamicForm.querySelector('#associadoParceira');

        if (toggleIndividual && toggleInstituicao) {
            toggleIndividual.addEventListener('click', () => this.handleFormacaoToggle('individual'));
            toggleInstituicao.addEventListener('click', () => this.handleFormacaoToggle('instituicao'));
        }

        if (toggleSingular && toggleEmpresa) {
            toggleSingular.addEventListener('click', () => this.handlePessoaToggle('singular'));
            toggleEmpresa.addEventListener('click', () => this.handlePessoaToggle('empresa'));
        }

        if (associadoSelect) {
            associadoSelect.addEventListener('change', () => this.updateValoresFormacao());
        }

        // Evento de submit do formulário
        const form = this.dynamicForm.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Evento de clique no botão WhatsApp
        const whatsappBtn = this.dynamicForm.querySelector('.teca-whatsapp-btn');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => this.openWhatsApp());
        }

        // Eventos de toggle de senha
        const toggleSenhaBtns = this.dynamicForm.querySelectorAll('.teca-toggle-senha');
        toggleSenhaBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                }
            });
        });

        // Toggle dos termos de uso
        const termosToggle = this.dynamicForm.querySelector('#teca-termos-toggle');
        if (termosToggle) {
            termosToggle.addEventListener('click', () => {
                const conteudo = this.dynamicForm.querySelector('#teca-termos-conteudo');
                const checkboxArea = this.dynamicForm.querySelector('#teca-termos-checkbox-area');
                const chevron = termosToggle.querySelector('.teca-termos-chevron');
                const expandido = conteudo && conteudo.style.display !== 'none';

                if (expandido) {
                    if (conteudo) conteudo.style.display = 'none';
                    if (checkboxArea) checkboxArea.style.display = 'none';
                    termosToggle.setAttribute('aria-expanded', 'false');
                    if (chevron) chevron.style.transform = 'rotate(0deg)';
                } else {
                    if (conteudo) conteudo.style.display = 'block';
                    if (checkboxArea) checkboxArea.style.display = 'block';
                    termosToggle.setAttribute('aria-expanded', 'true');
                    if (chevron) chevron.style.transform = 'rotate(180deg)';
                }
            });
        }

        // Evento de checkbox de termos
        const termosCheckbox = this.dynamicForm.querySelector('#termos-checkbox');
        const submitBtn = this.dynamicForm.querySelector('.teca-submit-btn');
        if (termosCheckbox && submitBtn) {
            termosCheckbox.addEventListener('change', () => {
                submitBtn.disabled = !termosCheckbox.checked;
            });
        }
    }

    // ============================================================
    // GERENCIAMENTO DE SESSÃO
    // ============================================================
    verificarSessao() {
        const logado = sessionStorage.getItem('teca_logado');
        if (logado === 'true') {
            const utilizador = JSON.parse(sessionStorage.getItem('teca_utilizador') || '{}');
            const path = window.location.pathname;
            if (path.includes('login') || path.includes('cadastro') || path === '/' || path === '/index.html') {
                this.redirecionarPorTipo(utilizador.tipo);
            }
        }
    }

    redirecionarPorTipo(tipo) {
        if (tipo === 'Administrador') {
            window.location.href = 'adm.html';
        } else {
            window.location.href = 'biblioteca-audio.html';
        }
    }

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
        this.attachFormEvents();
    }

    // ============================================================
    // RENDERIZAÇÃO DO LOGIN
    // ============================================================
    renderLoginForm() {
        const html = `
            <div class="teca-form-section">
                <div class="teca-type-selector">
                    <span class="teca-type-label"><i class="fas fa-user-tag"></i> Tipo de Usuário</span>
                    <div class="teca-type-options">
                        ${this.renderLoginTypeOptions(['Administrador', 'Parceiro', 'Usuário da Plataforma'])}
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

    renderLoginTypeOptions(tipos) {
        return tipos.map(tipo => {
            const icon = this.getUserTypeIcon(tipo);
            const id = `login-tipo-${tipo.replace(/\s+/g, '-')}`;
            return `
                <div class="teca-type-option">
                    <input type="radio" 
                           name="tipoUsuarioLogin" 
                           id="${id}" 
                           value="${tipo}"
                           ${this.currentUserType === tipo ? 'checked' : ''}>
                    <label for="${id}">
                        <i class="fas ${icon}"></i>
                        ${tipo}
                    </label>
                </div>
            `;
        }).join('');
    }

    handleLoginTypeChange(tipo) {
        this.currentUserType = tipo;
        this.renderLoginForm();
        this.attachFormEvents();
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
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="loginEmail" placeholder="Digite seu email" required>
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-lock"></i> Senha</label>
                    <div style="position: relative;">
                        <input type="password" name="senha" id="loginSenha" placeholder="Digite sua senha" required style="padding-right: 45px;">
                        <button type="button" class="teca-toggle-senha" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="teca-form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="loginEmail" placeholder="Digite seu email" required>
                </div>
                <div class="teca-form-group">
                    <label><i class="fas fa-lock"></i> Senha</label>
                    <div style="position: relative;">
                        <input type="password" name="senha" id="loginSenha" placeholder="Digite sua senha" required style="padding-right: 45px;">
                        <button type="button" class="teca-toggle-senha" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // ============================================================
    // RENDERIZAÇÃO DO CADASTRO
    // ============================================================
    renderCadastroForm() {
        const tiposCadastro = [
            'Parceiro',
            'Simulador - Biblioteca',
            'Curso Online',
            'Formação Presencial',
            'Serviços Personalizados',
            'Usuário Não Pago'
        ];
        
        const html = `
            <div class="teca-form-section">
                <div class="teca-type-selector">
                    <span class="teca-type-label"><i class="fas fa-user-plus"></i> Tipo de Cadastro</span>
                    <div class="teca-type-options">
                        ${this.renderCadastroTypeOptions(tiposCadastro)}
                    </div>
                </div>

                <form id="teca-cadastro-form" class="teca-cadastro-form">
                    <div id="teca-cadastro-fields">
                        ${this.renderCadastroFields()}
                    </div>
                    
                    ${this.renderTermosUso()}
                    
                    <button type="submit" class="teca-submit-btn" disabled>
                        <i class="fas fa-check-circle"></i>
                        Registrar Cadastro
                    </button>
                </form>
            </div>
        `;
        
        this.dynamicForm.innerHTML = html;
    }

    renderCadastroTypeOptions(tipos) {
        return tipos.map(tipo => {
            const icon = this.getUserTypeIcon(tipo);
            const id = `cadastro-tipo-${tipo.replace(/\s+/g, '-')}`;
            return `
                <div class="teca-type-option">
                    <input type="radio" 
                           name="tipoCadastro" 
                           id="${id}" 
                           value="${tipo}"
                           ${this.currentUserType === tipo ? 'checked' : ''}>
                    <label for="${id}">
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
            'Serviços Personalizados': 'fa-concierge-bell',
            'Usuário Não Pago': 'fa-user'
        };
        return icons[tipo] || 'fa-user';
    }

    renderTermosUso() {
        return `
            <div class="teca-termos-container">
                <button type="button" class="teca-termos-toggle" id="teca-termos-toggle" aria-expanded="false">
                    <i class="fas fa-file-contract"></i>
                    <span>Termos de Uso e Protecção de Dados</span>
                    <i class="fas fa-chevron-down teca-termos-chevron"></i>
                </button>

                <div class="teca-termos-conteudo" id="teca-termos-conteudo" style="display: none;">
                    <p>Ao se cadastrar na plataforma Teca Capital, o utilizador declara que leu e concorda com os seguintes termos:</p>
                    <ul>
                        <li>Os dados pessoais fornecidos são protegidos nos termos da <strong>Lei n.º 22/11 (Lei da Protecção de Dados Pessoais de Angola)</strong>.</li>
                        <li>A Teca Capital compromete-se a garantir a segurança, confidencialidade e integridade dos dados dos utilizadores.</li>
                        <li>Nenhuma informação será partilhada com terceiros sem consentimento do utilizador.</li>
                        <li>Os dados não serão utilizados para fins ilícitos ou que possam prejudicar o utilizador.</li>
                        <li>Os dados poderão ser utilizados para fins comerciais legítimos, incluindo:
                            <ul>
                                <li>Personalização de serviços</li>
                                <li>Envio de comunicações, ofertas e conteúdos</li>
                                <li>Contacto via e-mail, telefone ou redes sociais</li>
                            </ul>
                        </li>
                        <li>O utilizador autoriza o contacto directo e a possível inclusão em grupos ou comunidades oficiais da Teca Capital.</li>
                        <li>O utilizador pode, a qualquer momento, solicitar a alteração ou remoção dos seus dados.</li>
                    </ul>
                </div>

                <div class="teca-termos-checkbox" id="teca-termos-checkbox-area" style="display: none;">
                    <label>
                        <input type="checkbox" id="termos-checkbox" required>
                        <span><i class="fas fa-check-circle"></i> Li e concordo com os Termos de Uso e Política de Privacidade</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderCadastroFields() {
        if (!this.currentUserType) {
            return '<p class="teca-info-text"><i class="fas fa-info-circle"></i> Selecione um tipo de cadastro</p>';
        }

        let fields = '';

        switch (this.currentUserType) {
            case 'Parceiro':
                fields = this.renderBaseFields(true, true) + this.renderParceiroFields();
                break;
            case 'Simulador - Biblioteca':
                fields = this.renderBaseFields(true, true) + this.renderSimuladorBibliotecaFields();
                break;
            case 'Curso Online':
                fields = this.renderBaseFields(true, true) + this.renderCursoOnlineFields();
                break;
            case 'Formação Presencial':
                fields = this.renderBaseFields(true, true) + this.renderFormacaoPresencialFields();
                break;
            case 'Serviços Personalizados':
                fields = this.renderServicosPersonalizadosFields();
                break;
            case 'Usuário Não Pago':
                fields = this.renderBaseFields(true, true) + this.renderUsuarioNaoPagoFields();
                break;
        }

        return fields;
    }

    renderBaseFields(mostrarDataSexo, mostrarTelefone) {
        const nomePattern = "^[A-Za-zÀ-ÿ ]+$";
        
        return `
            <div class="teca-form-grid">
                <div class="teca-form-group full-width">
                    <label><i class="fas fa-user"></i> Nome de Usuário</label>
                    <input type="text" name="nome" id="nome" placeholder="Digite seu nome completo" required pattern="${nomePattern}">
                    <small class="teca-field-hint">Apenas letras (A-Z), maiúsculas ou minúsculas</small>
                </div>
                
                ${mostrarDataSexo ? `
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
                    <input type="text" name="pais" id="pais" value="Angola" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-map-marker-alt"></i> Região/Província</label>
                    <input type="text" name="regiao" id="regiao" placeholder="Digite sua província" required>
                </div>
                
                <div class="teca-form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" name="email" id="email" placeholder="seu@email.com" required>
                </div>
                
                ${mostrarTelefone ? `
                    <div class="teca-form-group">
                        <label><i class="fas fa-phone-alt"></i> Telefone</label>
                        <input type="tel" name="telefone" id="telefone" placeholder="923456789" required pattern="[0-9]{6,15}">
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderParceiroFields() {
        return `
            <div class="teca-form-group full-width">
                <label><i class="fas fa-briefcase"></i> Função</label>
                <select name="funcao" id="funcao" required>
                    <option value="">Selecione sua função</option>
                    <option value="Líder Regional">Líder Regional</option>
                    <option value="Formador">Formador</option>
                    <option value="Assistente">Assistente</option>
                    <option value="Parceiro Estratégico">Parceiro Estratégico</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Proposta de Valor (Opcional)</label>
                <input type="text" name="valorPago" id="valorPago" placeholder="Ex: 100.000 Kz">
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
                    2.000 Kz (Fixo)
                </div>
                <input type="hidden" name="valorPago" id="valorPago" value="2.000 Kz">
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: block;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp (Obrigatório)
                </button>
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
                    <option value="10.000 Kz">10.000 Kz - Curso Básico</option>
                    <option value="25.000 Kz">25.000 Kz - Curso Completo</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-clock"></i> Turma / Horário</label>
                <select name="turma" id="turma" required>
                    <option value="">Selecione a turma</option>
                    <optgroup label="Dias Úteis (Seg–Sex)">
                        <option value="Manhã 08h–10h">Manhã 08h–10h</option>
                        <option value="Tarde 14h–16h">Tarde 14h–16h</option>
                        <option value="Noite 19h–21h">Noite 19h–21h</option>
                    </optgroup>
                    <optgroup label="Fim de Semana (Sáb/Dom)">
                        <option value="Manhã 09h–11h">Manhã 09h–11h</option>
                        <option value="Tarde 14h–16h">Tarde 14h–16h</option>
                        <option value="Noite 18h–20h">Noite 18h–20h</option>
                    </optgroup>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: block;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp (Obrigatório)
                </button>
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
            
            <div class="teca-form-group full-width" id="campo-associado">
                <label><i class="fas fa-handshake"></i> Associado a instituição parceira?</label>
                <select name="associadoParceira" id="associadoParceira">
                    <option value="nao">Não</option>
                    <option value="sim">Sim, sou associado</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-tag"></i> Valor</label>
                <select name="valorPago" id="select-valores" required>
                    <option value="">Selecione o valor</option>
                    <option value="15.000 Kz">15.000 Kz - Básico (90 dias)</option>
                    <option value="30.000 Kz">30.000 Kz - Avançado (90 dias)</option>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-clock"></i> Turma / Horário</label>
                <select name="turma" id="turma" required>
                    <option value="">Selecione a turma</option>
                    <optgroup label="Dias Úteis (Seg–Sex)">
                        <option value="Manhã 08h–10h">Manhã 08h–10h</option>
                        <option value="Tarde 14h–16h">Tarde 14h–16h</option>
                        <option value="Noite 19h–21h">Noite 19h–21h</option>
                    </optgroup>
                    <optgroup label="Fim de Semana">
                        <option value="Sábado 09h–13h">Sábado 09h–13h</option>
                    </optgroup>
                </select>
            </div>
            
            <div class="teca-form-group full-width">
                <label><i class="fas fa-check-square"></i> Comprovativo Enviado</label>
                <select name="comprovativoEnviado" id="comprovativoEnviado" required>
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                </select>
            </div>
            
            <div id="teca-whatsapp-container" style="display: block;">
                <button type="button" class="teca-whatsapp-btn pulse">
                    <i class="fab fa-whatsapp"></i>
                    Enviar Comprovativo via WhatsApp (Obrigatório)
                </button>
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
                <input type="text" name="nome" id="nome" placeholder="Digite seu nome" required minlength="5" maxlength="50" pattern="[A-Za-zÀ-ÿ ]+">
                <small class="teca-field-hint">Apenas letras (A-Z), mínimo 5 e máximo 50 caracteres</small>
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
                    <input type="tel" name="telefone" id="telefone" required pattern="[0-9]{6,15}">
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

    renderUsuarioNaoPagoFields() {
        return `
            <div class="teca-info-text">
                <i class="fas fa-info-circle"></i>
                Nível de Acesso: Nenhum | Expiração: 60 dias
            </div>
        `;
    }

    // ============================================================
    // HANDLERS DE EVENTOS
    // ============================================================
    handleUserTypeChange(tipo) {
        this.currentUserType = tipo;
        this.renderCadastroForm();
        this.attachFormEvents();
    }

    handleComprovativoChange(valor) {
        if (this.currentUserType === 'Simulador - Biblioteca' || 
            this.currentUserType === 'Curso Online' || 
            this.currentUserType === 'Formação Presencial') {
            return;
        }
        
        const container = this.dynamicForm?.querySelector('#teca-whatsapp-container');
        if (container) {
            container.style.display = valor === 'Sim' ? 'block' : 'none';
        }
    }

    handleFormacaoToggle(tipo) {
        const toggleIndividual = this.dynamicForm.querySelector('#toggle-individual');
        const toggleInstituicao = this.dynamicForm.querySelector('#toggle-instituicao');
        const campoInstituicao = this.dynamicForm.querySelector('#campo-instituicao');
        const campoAssociado = this.dynamicForm.querySelector('#campo-associado');
        
        if (toggleIndividual && toggleInstituicao) {
            toggleIndividual.classList.toggle('active', tipo === 'individual');
            toggleInstituicao.classList.toggle('active', tipo === 'instituicao');
        }
        
        if (campoInstituicao && campoAssociado) {
            if (tipo === 'instituicao') {
                campoInstituicao.style.display = 'block';
                campoAssociado.style.display = 'none';
            } else {
                campoInstituicao.style.display = 'none';
                campoAssociado.style.display = 'block';
            }
        }
        
        this.updateValoresFormacao();
    }

    handlePessoaToggle(tipo) {
        const toggleSingular = this.dynamicForm.querySelector('#toggle-singular');
        const toggleEmpresa = this.dynamicForm.querySelector('#toggle-empresa');
        const camposPessoaFisica = this.dynamicForm.querySelector('#campos-pessoa-fisica');
        const campoNomeContainer = this.dynamicForm.querySelector('#campo-nome-container');
        const dataNascimento = this.dynamicForm.querySelector('#dataNascimento');
        const sexoSelect = this.dynamicForm.querySelector('#sexo');
        
        if (toggleSingular && toggleEmpresa) {
            toggleSingular.classList.toggle('active', tipo === 'singular');
            toggleEmpresa.classList.toggle('active', tipo === 'empresa');
        }
        
        if (camposPessoaFisica) {
            camposPessoaFisica.style.display = tipo === 'singular' ? 'block' : 'none';
        }
        
        if (dataNascimento) {
            dataNascimento.required = tipo === 'singular';
        }
        
        if (sexoSelect) {
            sexoSelect.required = tipo === 'singular';
        }
        
        const nomeLabel = campoNomeContainer?.querySelector('label');
        if (nomeLabel) {
            if (tipo === 'singular') {
                nomeLabel.innerHTML = '<i class="fas fa-user"></i> Nome (Pessoa Física)';
            } else {
                nomeLabel.innerHTML = '<i class="fas fa-building"></i> Nome da Empresa';
            }
        }
    }

    updateValoresFormacao() {
        const selectValores = this.dynamicForm.querySelector('#select-valores');
        const toggleInstituicao = this.dynamicForm.querySelector('#toggle-instituicao');
        const associadoSelect = this.dynamicForm.querySelector('#associadoParceira');
        
        if (!selectValores) return;
        
        const isInstituicao = toggleInstituicao?.classList.contains('active') || false;
        const isAssociado = associadoSelect?.value === 'sim';
        
        let options = '';
        
        if (isInstituicao) {
            options = `
                <option value="">Selecione o valor</option>
                <option value="150.000 Kz">150.000 Kz - Básico</option>
                <option value="250.000 Kz">250.000 Kz - Intermediário</option>
                <option value="700.000 Kz">700.000 Kz - Máximo</option>
            `;
        } else {
            if (isAssociado) {
                options = `
                    <option value="7.500 Kz">7.500 Kz - Associado (15 dias)</option>
                `;
            } else {
                options = `
                    <option value="">Selecione o valor</option>
                    <option value="15.000 Kz">15.000 Kz - Básico (90 dias)</option>
                    <option value="30.000 Kz">30.000 Kz - Avançado (90 dias)</option>
                `;
            }
        }
        
        selectValores.innerHTML = options;
    }

    // ============================================================
    // VALIDAÇÕES
    // ============================================================
    validarNome(nome, tipoCadastro) {
        if (tipoCadastro === 'Serviços Personalizados') {
            const regex = /^[A-Za-zÀ-ÿ\s]{5,50}$/;
            return regex.test(nome);
        }
        
        const regex = /^[A-Za-zÀ-ÿ\s]+$/;
        return regex.test(nome);
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validarTelefone(telefone) {
        const regex = /^[0-9]{6,15}$/;
        return regex.test(telefone);
    }

    validarDataNascimento(data) {
        if (!data) return true;
        const hoje = new Date();
        const dataNasc = new Date(data);
        return dataNasc < hoje;
    }

    sanitizarInput(valor) {
        if (!valor) return '';
        return valor
            .toString()
            .trim()
            .replace(/[<>]/g, '')
            .replace(/script/gi, '')
            .replace(/[;{}]/g, '');
    }

    // NOVO MÉTODO: Geração de senha com algoritmo baseado no nome
    gerarSenha(nome) {
        // Extrair letras do nome (apenas letras, sem espaços ou acentos)
        const letrasNome = (nome || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^A-Za-z]/g, '')
            .toUpperCase();

        const letra1 = letrasNome[0] || 'T';
        const letra2 = letrasNome[1] || 'C';

        // Dia actual com 2 dígitos
        const dia = String(new Date().getDate()).padStart(2, '0');

        // Letra aleatória (sem I, O, Q para evitar confusão visual)
        const letrasAleatorias = 'ABCDEFGHJKLMNPRSTUVWXYZ';
        const letraAleat = letrasAleatorias[Math.floor(Math.random() * letrasAleatorias.length)];

        // Número aleatório 1–9
        const numAleat = String(Math.floor(Math.random() * 9) + 1);

        return `${letra1}${letra2}${dia}${letraAleat}${numAleat}`;
    }

    // ============================================================
    // PROCESSAMENTO DE DADOS
    // ============================================================
    processFormData(formData) {
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = this.sanitizarInput(value);
        }

        const tipoCadastro = this.currentUserType;
        data.tipoUsuario = tipoCadastro;
        data.tipoCadastro = tipoCadastro;
        
        const tiposComSenhaAutomatica = ['Parceiro', 'Simulador - Biblioteca', 'Curso Online', 'Formação Presencial', 'Usuário Não Pago'];
        
        if (tiposComSenhaAutomatica.includes(tipoCadastro)) {
            const senhaGerada = this.gerarSenha(data.nome || '');
            data.senha = senhaGerada;
            data.senhaGerada = senhaGerada;
        }
        
        if (tipoCadastro === 'Serviços Personalizados') {
            const tipoPessoa = this.dynamicForm.querySelector('.teca-toggle-btn.active')?.dataset.type || 'singular';
            const nomeOriginal = data.nome;
            data.nome = tipoPessoa === 'singular' ? `Singular: ${nomeOriginal}` : `Empresa: ${nomeOriginal}`;
            
            if (tipoPessoa === 'empresa') {
                delete data.dataNascimento;
                delete data.sexo;
            }
        }

        if (tipoCadastro === 'Formação Presencial') {
            const tipo = this.dynamicForm.querySelector('#toggle-instituicao')?.classList.contains('active') ? 'instituicao' : 'individual';
            
            if (tipo === 'instituicao') {
                const instituicao = data.nomeInstituicao || '';
                data.descricao = `Instituição: ${instituicao}`;
                data.associadoParceira = 'nao';
            } else {
                const associado = data.associadoParceira === 'sim';
                if (associado) {
                    data.descricao = 'Associado a instituição parceira';
                } else {
                    data.descricao = 'Não associado a nenhuma instituição';
                }
            }
        }

        if (!data.pais) data.pais = 'Angola';
        if (!data.comprovativoEnviado) data.comprovativoEnviado = 'Não';
        
        const termosCheckbox = this.dynamicForm.querySelector('#termos-checkbox');
        data.termosAceite = termosCheckbox ? termosCheckbox.checked : false;
        data.dataConsentimento = new Date().toISOString();
        
        return data;
    }

    // ============================================================
    // VALIDAÇÃO DE COMPROVATIVO OBRIGATÓRIO
    // ============================================================
    validarComprovativoObrigatorio(tipoCadastro, comprovativo) {
        const tiposComComprovativoObrigatorio = ['Simulador - Biblioteca', 'Curso Online', 'Formação Presencial'];
        
        if (tiposComComprovativoObrigatorio.includes(tipoCadastro)) {
            if (!comprovativo || comprovativo !== 'Sim') {
                return { valido: false, mensagem: 'É obrigatório enviar o comprovativo de pagamento via WhatsApp para concluir o cadastro.' };
            }
        }
        
        return { valido: true };
    }

    // ============================================================
    // COMUNICAÇÃO COM BACKEND
    // ============================================================
    async chamarBackend(dadosParaEnviar) {
        try {
            const resposta = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(dadosParaEnviar),
                redirect: 'follow'
            });

            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }

            const resultado = await resposta.json();
            return resultado;

        } catch (erro) {
            console.error('Erro na comunicação:', erro);
            return { 
                sucesso: false, 
                mensagem: 'Erro de conexão com o servidor. Verifique sua internet.' 
            };
        }
    }

    async verificarEmail(email) {
        try {
            const dados = { acao: 'verificarEmail', email: email.trim() };
            const resultado = await this.chamarBackend(dados);
            return resultado;
        } catch (erro) {
            console.error('Erro ao verificar email:', erro);
            return { sucesso: false, existe: false };
        }
    }

    // ============================================================
    // LOGIN CORRIGIDO
    // ============================================================
    async fazerLogin(dados) {
        const dadosLogin = { acao: 'login', senha: dados.senha };

        if (this.currentUserType === 'Administrador') {
            dadosLogin.id = parseInt(dados.id);
            dadosLogin.email = dados.email;
            dadosLogin.tipo = 'Administrador';
        } else if (this.currentUserType === 'Parceiro') {
            dadosLogin.email = dados.email;
            dadosLogin.tipo = 'Parceiro';
            
            if (!dadosLogin.email) {
                return { sucesso: false, mensagem: 'Email é obrigatório para login' };
            }
        } else {
            dadosLogin.email = dados.email;
            
            if (!dadosLogin.email) {
                return { sucesso: false, mensagem: 'Email é obrigatório para login' };
            }
        }

        const resultado = await this.chamarBackend(dadosLogin);

        if (resultado.status === 'success' || resultado.sucesso) {
            const dadosUsuario = resultado.dados || resultado;
            sessionStorage.setItem('teca_utilizador', JSON.stringify(dadosUsuario));
            sessionStorage.setItem('teca_logado', 'true');
            sessionStorage.setItem('teca_tipo', dadosUsuario.tipo);
            
            this.exibirMensagem('sucesso', `Bem-vindo, ${dadosUsuario.nome}!`);
            
            setTimeout(() => this.redirecionarPorTipo(dadosUsuario.tipo), 1500);
        } else {
            // Mensagem específica para parceiros
            if (this.currentUserType === 'Parceiro') {
                this.exibirMensagem('aviso', 
                    'Parceiros: a senha de acesso é fornecida pelo administrador após aprovação do cadastro. Se ainda não recebeu as credenciais, contacte a Teca Capital.'
                );
            } else if (resultado.status === 'expirado') {
                this.exibirMensagem('erro', 'Acesso expirado. Contacte o administrador.');
            } else if (resultado.status === 'removido') {
                this.exibirMensagem('erro', 'Acesso revogado. Contacte o administrador.');
            } else {
                this.exibirMensagem('erro', resultado.mensagem || 'Credenciais inválidas');
            }
        }

        return resultado;
    }

    // ============================================================
    // CADASTRO CORRIGIDO
    // ============================================================
    async cadastrarUtilizador(dados) {
        if (!this.validarNome(dados.nome, dados.tipoCadastro)) {
            if (dados.tipoCadastro === 'Serviços Personalizados') {
                return { sucesso: false, mensagem: 'Nome deve ter entre 5 e 50 caracteres, apenas letras (A-Z)' };
            }
            return { sucesso: false, mensagem: 'Nome deve conter apenas letras (A-Z)' };
        }
        if (!this.validarEmail(dados.email)) {
            return { sucesso: false, mensagem: 'Email inválido' };
        }
        if (dados.telefone && !this.validarTelefone(dados.telefone)) {
            return { sucesso: false, mensagem: 'Telefone inválido (apenas números, 6-15 dígitos)' };
        }
        if (dados.dataNascimento && !this.validarDataNascimento(dados.dataNascimento)) {
            return { sucesso: false, mensagem: 'Data de nascimento inválida' };
        }
        
        if (!dados.termosAceite) {
            return { sucesso: false, mensagem: 'Você deve concordar com os Termos de Uso para continuar.' };
        }

        const validacaoComprovativo = this.validarComprovativoObrigatorio(dados.tipoCadastro, dados.comprovativoEnviado);
        if (!validacaoComprovativo.valido) {
            return { sucesso: false, mensagem: validacaoComprovativo.mensagem };
        }

        const verificacao = await this.verificarEmail(dados.email);
        if (verificacao.existe) {
            return { sucesso: false, mensagem: 'Este email já está cadastrado no sistema' };
        }

        const dadosParaEnviar = {
            acao: 'cadastrar',
            nome: dados.nome,
            dataNascimento: dados.dataNascimento || '',
            sexo: dados.sexo || '',
            pais: dados.pais || 'Angola',
            regiao: dados.regiao || '',
            email: dados.email,
            telefone: dados.telefone || '',
            tipoUsuario: dados.tipoUsuario,
            senha: dados.senha || '',
            valorPago: dados.valorPago || '',
            comprovativo: dados.comprovativoEnviado || 'Não',
            descricao: dados.descricao || '',
            turma: dados.turma || '',
            instituicao: dados.nomeInstituicao || '',
            funcao: dados.funcao || '',
            termosAceite: dados.termosAceite,
            dataConsentimento: dados.dataConsentimento,
            mesCorrente: new Date().toLocaleString('pt-PT', { month: 'long' })
        };

        const resultado = await this.chamarBackend(dadosParaEnviar);

        if (resultado.status === 'success' || resultado.sucesso) {
            const tiposComSenha = ['Simulador - Biblioteca', 'Curso Online', 'Formação Presencial', 'Usuário Não Pago'];
            
            if (this.currentUserType === 'Parceiro') {
                this.exibirMensagem('sucesso', 'A sua senha foi gerada com sucesso. Para ter acesso aos seus credenciais, aguarde o contacto do administrador da Teca Capital, que enviará as informações através dos canais oficiais.');
                
                // Reset após 3 segundos para parceiro
                setTimeout(() => {
                    this.currentUserType = null;
                    this.renderForm();
                    this.attachFormEvents();
                }, 3000);
            } else if (tiposComSenha.includes(this.currentUserType)) {
                if (dados.senhaGerada) {
                    this.exibirSenhaTemporaria(dados.senhaGerada, dados.email);
                }
            } else {
                this.exibirMensagem('sucesso', 'Cadastro realizado com sucesso!');
                
                setTimeout(() => {
                    this.currentUserType = null;
                    this.renderForm();
                    this.attachFormEvents();
                }, 3000);
            }
        } else {
            this.exibirMensagem('erro', resultado.mensagem || 'Erro ao cadastrar');
        }

        return resultado;
    }

    // ============================================================
    // SENHA TEMPORÁRIA MELHORADA (com botão copiar e barra de progresso)
    // ============================================================
    exibirSenhaTemporaria(senha, email) {
        // Limpar qualquer senha temporária anterior
        this.dynamicForm.querySelector('.teca-senha-temporaria')?.remove();

        let tempoRestante = 60;
        const containerSenha = document.createElement('div');
        containerSenha.className = 'teca-senha-temporaria';
        containerSenha.innerHTML = `
            <div class="teca-senha-header">
                <i class="fas fa-key"></i>
                <h4>Senha de Acesso Gerada</h4>
            </div>

            <div class="teca-senha-seguranca">
                <i class="fas fa-shield-alt"></i>
                <p>Por segurança, as senhas são geradas automaticamente para proteger os nossos servidores contra acessos maliciosos. Guarda esta senha — é a única forma de aceder à plataforma.</p>
            </div>

            <p class="teca-senha-label">A tua senha de acesso:</p>
            <div class="teca-senha-valor" id="teca-senha-display">${senha}</div>

            <button type="button" class="teca-copiar-btn" id="teca-copiar-senha">
                <i class="fas fa-copy"></i>
                <span>Copiar Senha</span>
            </button>

            <p class="teca-senha-email"><i class="fas fa-envelope"></i> Email: <strong>${email}</strong></p>

            <div class="teca-timer-wrapper">
                <div class="teca-timer-barra">
                    <div class="teca-timer-progresso" id="teca-timer-progresso"></div>
                </div>
                <div class="teca-timer">
                    <i class="fas fa-hourglass-half"></i>
                    Esta senha desaparece em <span id="teca-timer-count">60</span>s. Anota-a antes que desapareça.
                </div>
            </div>
        `;

        // Inserir DEPOIS do formulário
        const formContainer = this.dynamicForm.querySelector('form');
        if (formContainer) {
            formContainer.insertAdjacentElement('afterend', containerSenha);
        } else {
            this.dynamicForm.appendChild(containerSenha);
        }

        // Scroll suave para a senha
        containerSenha.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Botão copiar
        const btnCopiar = containerSenha.querySelector('#teca-copiar-senha');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(senha).then(() => {
                        btnCopiar.innerHTML = '<i class="fas fa-check"></i><span>Copiada!</span>';
                        btnCopiar.classList.add('copiada');
                        setTimeout(() => {
                            btnCopiar.innerHTML = '<i class="fas fa-copy"></i><span>Copiar Senha</span>';
                            btnCopiar.classList.remove('copiada');
                        }, 2000);
                    });
                } else {
                    // Fallback para browsers sem clipboard API
                    const el = document.createElement('textarea');
                    el.value = senha;
                    el.style.position = 'fixed';
                    el.style.opacity = '0';
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    btnCopiar.innerHTML = '<i class="fas fa-check"></i><span>Copiada!</span>';
                    btnCopiar.classList.add('copiada');
                    setTimeout(() => {
                        btnCopiar.innerHTML = '<i class="fas fa-copy"></i><span>Copiar Senha</span>';
                        btnCopiar.classList.remove('copiada');
                    }, 2000);
                }
            });
        }

        // Timer com barra de progresso
        const timerEl = containerSenha.querySelector('#teca-timer-count');
        const progressoEl = containerSenha.querySelector('#teca-timer-progresso');

        const interval = setInterval(() => {
            tempoRestante--;
            if (timerEl) timerEl.textContent = tempoRestante;
            if (progressoEl) {
                const pct = (tempoRestante / 60) * 100;
                progressoEl.style.width = pct + '%';
                progressoEl.style.background = tempoRestante <= 15
                    ? 'var(--red)'
                    : 'var(--gold)';
            }

            if (tempoRestante <= 0) {
                clearInterval(interval);
                containerSenha.remove();
                this.exibirMensagem('aviso', 'Se não conseguiu anotar a senha, solicita-a através dos nossos contactos (WhatsApp, telefone ou redes sociais) para recuperar o acesso.');

                // Reset do formulário após os 60 segundos
                setTimeout(() => {
                    this.currentUserType = null;
                    this.renderForm();
                    this.attachFormEvents();
                }, 4000);
            }
        }, 1000);
    }

    // ============================================================
    // SUBMIT PRINCIPAL
    // ============================================================
    async handleSubmit() {
        const form = this.dynamicForm.querySelector('form');
        if (!form) return;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        this.setCarregando(true);
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

            if (resultado && !resultado.sucesso && !(resultado.status === 'success')) {
                this.exibirMensagem('erro', resultado.mensagem || 'Erro ao processar');
            }
        } catch (error) {
            console.error('Erro no handleSubmit:', error);
            this.exibirMensagem('erro', 'Erro de comunicação com o servidor.');
        } finally {
            this.setCarregando(false);
        }
    }

    // ============================================================
    // FUNÇÕES DE UI
    // ============================================================
    setCarregando(estado) {
        this.isLoading = estado;
        
        const submitBtn = this.dynamicForm?.querySelector('.teca-submit-btn');
        if (submitBtn) {
            if (!submitBtn.dataset.textoOriginal) {
                submitBtn.dataset.textoOriginal = submitBtn.innerHTML;
            }
            
            submitBtn.disabled = estado;
            submitBtn.innerHTML = estado 
                ? '<span class="teca-loading"></span> A processar...'
                : submitBtn.dataset.textoOriginal;
        }
        
        if (estado) {
            const loader = document.createElement('div');
            loader.id = 'teca-loader-overlay';
            loader.className = 'teca-loader';
            loader.innerHTML = '<span class="teca-loading"></span> Processando...';
            this.messageContainer?.appendChild(loader);
        } else {
            const loader = document.getElementById('teca-loader-overlay');
            if (loader) loader.remove();
        }
    }

    exibirMensagem(tipo, texto) {
        this.clearMessages();
        
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `teca-message ${tipo}`;
        
        const icone = tipo === 'sucesso' ? 'fa-check-circle' : 
                     tipo === 'aviso' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle';
        
        mensagemDiv.innerHTML = `<i class="fas ${icone}"></i><span>${texto}</span>`;
        this.messageContainer?.appendChild(mensagemDiv);
        
        if (tipo === 'sucesso') {
            setTimeout(() => mensagemDiv.remove(), 10000);
        }
    }

    clearMessages() {
        if (this.messageContainer) {
            this.messageContainer.innerHTML = '';
        }
    }

    openWhatsApp() {
        const form = this.dynamicForm.querySelector('form');
        if (!form) return;
        
        const formData = new FormData(form);
        const nome = this.sanitizarInput(formData.get('nome') || '');
        const tipo = this.currentUserType;
        const valor = this.sanitizarInput(formData.get('valorPago') || '');
        const data = new Date().toLocaleDateString('pt-PT');
        const email = this.sanitizarInput(formData.get('email') || '');
        
        const mensagem = `*TECA CAPITAL - COMPROVATIVO DE PAGAMENTO*%0A%0A` +
                        `👤 Nome: ${encodeURIComponent(nome)}%0A` +
                        `📧 Email: ${encodeURIComponent(email)}%0A` +
                        `📋 Tipo: ${encodeURIComponent(tipo)}%0A` +
                        `📅 Data: ${encodeURIComponent(data)}%0A` +
                        `💰 Valor: ${encodeURIComponent(valor)}%0A%0A` +
                        `🔗 Segue em anexo o comprovativo de pagamento.%0A%0A` +
                        `Obrigado!`;
        
        window.open(`https://wa.me/${this.WHATSAPP_NUMBER}?text=${mensagem}`, '_blank');
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    new TecaForm();
});
