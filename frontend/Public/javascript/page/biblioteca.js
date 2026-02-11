// =============================================
// CONTEÚDO PRINCIPAL - JAVASCRIPT ALTERNATIVO
// =============================================

(function() {
    'use strict';
    
    // CONFIGURAÇÕES GLOBAIS
    const config = {
        colors: {
            gold: 'rgb(214, 174, 100)',
            blue: '#0066cc',
            red: '#cc3333'
        },
        isMobile: window.innerWidth < 768,
        isExtraSmall: window.innerWidth < 350,
        animationsEnabled: true
    };
    
    // 1. ANIMAÇÃO DE STATS (CONTADORES)
    class AnimatedStats {
        constructor() {
            this.statNumbers = document.querySelectorAll('.stat-number[data-target]');
            this.init();
        }
        
        init() {
            if (this.statNumbers.length === 0) return;
            
            // Observar quando stats entram na viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            this.statNumbers.forEach(stat => observer.observe(stat));
        }
        
        animateCounter(element) {
            const target = parseInt(element.getAttribute('data-target'));
            const duration = 2000; // 2 segundos
            const step = target / (duration / 16); // 60fps
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                    
                    // Adicionar efeito visual ao completar
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 300);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }
    }
    
    // 2. CONTROLE DO CARROSSEL COM NAVEGAÇÃO INFERIOR
    class SimulatorsCarousel {
        constructor() {
            this.container = document.querySelector('.simulators-container');
            this.cards = document.querySelectorAll('.simulator-card');
            this.prevBtn = document.querySelector('.carousel-btn.prev');
            this.nextBtn = document.querySelector('.carousel-btn.next');
            this.currentIndex = 0;
            this.cardWidth = 280; // Largura do card + gap
            this.init();
        }
        
        init() {
            if (!this.container || this.cards.length < 2) return;
            
            // Configurar botões
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.scrollTo('prev'));
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.scrollTo('next'));
            }
            
            // Configurar swipe para mobile
            this.setupTouchEvents();
            
            // Atualizar visibilidade dos botões
            this.updateButtonStates();
        }
        
        scrollTo(direction) {
            const scrollAmount = this.cardWidth * 2; // Mover 2 cards por vez
            
            if (direction === 'next') {
                this.currentIndex = Math.min(this.currentIndex + 1, this.cards.length - 1);
                this.container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            } else {
                this.currentIndex = Math.max(this.currentIndex - 1, 0);
                this.container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
            
            // Atualizar estados dos botões
            setTimeout(() => this.updateButtonStates(), 300);
        }
        
        updateButtonStates() {
            const scrollLeft = this.container.scrollLeft;
            const maxScroll = this.container.scrollWidth - this.container.clientWidth;
            
            if (this.prevBtn) {
                this.prevBtn.disabled = scrollLeft <= 0;
                this.prevBtn.style.opacity = scrollLeft <= 0 ? '0.5' : '1';
            }
            
            if (this.nextBtn) {
                this.nextBtn.disabled = scrollLeft >= maxScroll - 10; // Margem de erro
                this.nextBtn.style.opacity = scrollLeft >= maxScroll - 10 ? '0.5' : '1';
            }
        }
        
        setupTouchEvents() {
            let startX = 0;
            let scrollLeft = 0;
            
            this.container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX;
                scrollLeft = this.container.scrollLeft;
            }, { passive: true });
            
            this.container.addEventListener('touchmove', (e) => {
                if (!startX) return;
                const x = e.touches[0].pageX;
                const walk = (x - startX) * 2;
                this.container.scrollLeft = scrollLeft - walk;
            }, { passive: true });
        }
    }
    
    // 3. EFEITOS DE BORDA ANIMADOS
    class AnimatedBorders {
        constructor() {
            this.animatedElements = document.querySelectorAll('.service-card, .differentiator-card, .simulator-card, .stat-card');
            this.init();
        }
        
        init() {
            if (this.animatedElements.length === 0 || !config.animationsEnabled) return;
            
            // Adicionar classes para animação
            this.animatedElements.forEach(element => {
                element.classList.add('animated-border');
                
                // Controlar animação baseado no viewport
                if (config.isExtraSmall) {
                    element.style.animationPlayState = 'paused';
                }
            });
            
            // Observar performance em mobile
            if (config.isMobile) {
                this.optimizeAnimationsForMobile();
            }
        }
        
        optimizeAnimationsForMobile() {
            // Reduzir qualidade da animação em mobile para performance
            document.documentElement.style.setProperty('--animation-quality', '0.5');
            
            // Pausar animações quando não visíveis
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationPlayState = 'running';
                    } else {
                        entry.target.style.animationPlayState = 'paused';
                    }
                });
            }, { threshold: 0.1 });
            
            this.animatedElements.forEach(element => observer.observe(element));
        }
    }
    
    // 4. OTIMIZADOR DE LAYOUT RESPONSIVO
    class LayoutOptimizer {
        constructor() {
            this.sections = document.querySelectorAll('main > section');
            this.init();
        }
        
        init() {
            this.optimizeLayoutForViewport();
            window.addEventListener('resize', this.debounce(() => {
                this.optimizeLayoutForViewport();
            }, 250));
        }
        
        optimizeLayoutForViewport() {
            const width = window.innerWidth;
            
            // Ajustes para telas muito pequenas
            if (width < 350) {
                this.applyExtraSmallOptimizations();
            }
            
            // Ajustar alinhamento do banner baseado na largura
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                if (width < 768) {
                    heroContent.style.textAlign = 'center';
                    heroContent.style.margin = '0 auto';
                } else {
                    heroContent.style.textAlign = 'right';
                    heroContent.style.marginLeft = 'auto';
                    heroContent.style.marginRight = '20px';
                }
            }
            
            // Ajustar largura dos vídeos
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                video.style.maxWidth = width < 768 ? '100%' : '80%';
            });
        }
        
        applyExtraSmallOptimizations() {
            // Ajustes específicos para <350px
            document.querySelectorAll('.section-title').forEach(title => {
                title.style.fontSize = '1.5rem';
                title.style.padding = '0 10px';
            });
            
            // Garantir que grids sejam de coluna única
            document.querySelectorAll('.services-grid, .differentiators-grid').forEach(grid => {
                grid.style.gridTemplateColumns = '1fr';
                grid.style.gap = '20px';
            });
            
            // Ajustar padding das seções
            this.sections.forEach(section => {
                section.style.paddingLeft = '10px';
                section.style.paddingRight = '10px';
            });
        }
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
    
    // 5. INICIALIZADOR DE VÍDEOS
    class VideoInitializer {
        constructor() {
            this.videos = document.querySelectorAll('video');
            this.init();
        }
        
        init() {
            if (this.videos.length === 0) return;
            
            this.videos.forEach(video => {
                // Garantir que vídeos nunca sejam cortados
                video.style.objectFit = 'contain';
                
                // Configurar para mobile
                if (config.isMobile) {
                    video.setAttribute('playsinline', '');
                    video.setAttribute('muted', '');
                }
                
                // Adicionar loader
                video.addEventListener('waiting', () => {
                    video.style.opacity = '0.5';
                });
                
                video.addEventListener('canplay', () => {
                    video.style.opacity = '1';
                });
            });
        }
    }
    
    // 6. SISTEMA DE INTERATIVIDADE
    class InteractivitySystem {
        constructor() {
            this.cards = document.querySelectorAll('.service-card, .differentiator-card, .simulator-card');
            this.links = document.querySelectorAll('.service-link');
            this.init();
        }
        
        init() {
            this.setupCardInteractions();
            this.setupLinkAnimations();
            this.setupFocusStates();
        }
        
        setupCardInteractions() {
            this.cards.forEach(card => {
                // Efeito hover
                card.addEventListener('mouseenter', () => {
                    if (!config.isMobile) {
                        card.style.transform = 'translateY(-8px) scale(1.02)';
                        card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0) scale(1)';
                    card.style.boxShadow = 'none';
                });
                
                // Efeito de clique
                card.addEventListener('click', (e) => {
                    if (config.isMobile) {
                        // Feedback tátil para mobile
                        card.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            card.style.transform = 'scale(1)';
                        }, 200);
                    }
                });
            });
        }
        
        setupLinkAnimations() {
            this.links.forEach(link => {
                link.addEventListener('mouseenter', () => {
                    const arrow = link.querySelector('i, svg, span:last-child');
                    if (arrow) {
                        arrow.style.transform = 'translateX(5px)';
                    }
                });
                
                link.addEventListener('mouseleave', () => {
                    const arrow = link.querySelector('i, svg, span:last-child');
                    if (arrow) {
                        arrow.style.transform = 'translateX(0)';
                    }
                });
            });
        }
        
        setupFocusStates() {
            // Melhorar acessibilidade para navegação por teclado
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.documentElement.classList.add('keyboard-navigation');
                }
            });
            
            document.addEventListener('mousedown', () => {
                document.documentElement.classList.remove('keyboard-navigation');
            });
        }
    }
    
    // INICIALIZAÇÃO PRINCIPAL
    function initializeMainContent() {
        console.log('Inicializando conteúdo principal com estilo alternativo...');
        
        // Inicializar todos os sistemas
        new AnimatedStats();
        new SimulatorsCarousel();
        new AnimatedBorders();
        new LayoutOptimizer();
        new VideoInitializer();
        new InteractivitySystem();
        
        // Adicionar classe para estilização CSS
        document.documentElement.classList.add('alternative-styling');
        
        console.log('Conteúdo principal inicializado com sucesso!');
    }
    
    // INICIALIZAR QUANDO O DOM ESTIVER PRONTO
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMainContent);
    } else {
        initializeMainContent();
    }
    
})();


// ===================================================
// BIBLIOTECA - JAVASCRIPT EXTRA PARA BUSCA E FILTRAGEM
// ===================================================

(function() {
    'use strict';
    
    // CONFIGURAÇÃO GLOBAL
    const CONFIG = {
        searchDelay: 300,
        fadeInDuration: 500,
        animationStep: 100,
        filters: {
            categoria: 'todos',
            tipo: 'todos',
            nivel: 'todos',
            autor: 'todos',
            searchTerm: ''
        }
    };
    
    // 1. SISTEMA DE BUSCA INTELIGENTE
    class SmartSearchEngine {
        constructor() {
            this.resources = this.extractResources();
            this.searchInput = document.getElementById('search-input');
            this.searchBtn = document.getElementById('search-btn');
            this.resultsCount = document.getElementById('results-count');
            this.resourcesContainer = document.getElementById('resources-container');
            this.quickFilters = document.querySelectorAll('.filter-btn[data-filter]');
            
            this.init();
        }
        
        init() {
            this.setupEventListeners();
            this.renderAllResources();
            this.setupQuickFilters();
        }
        
        extractResources() {
            const resources = [];
            const resourceElements = document.querySelectorAll('#resources-container > div[id]');
            
            resourceElements.forEach(element => {
                const resource = {
                    id: element.id,
                    element: element,
                    html: element.outerHTML,
                    data: this.extractResourceData(element)
                };
                resources.push(resource);
            });
            
            return resources;
        }
        
        extractResourceData(element) {
            const data = {
                id: element.id,
                categoria: '',
                tipo: '',
                titulo: '',
                resumo: '',
                autor: '',
                nivel: '',
                tags: []
            };
            
            // Extrair informações do HTML
            const h1 = element.querySelector('h1');
            const paragraphs = element.querySelectorAll('p');
            
            if (h1) {
                const categoriaMatch = h1.textContent.match(/Categoria:\s*(.+)/);
                if (categoriaMatch) {
                    data.categoria = categoriaMatch[1].toLowerCase().trim();
                }
            }
            
            paragraphs.forEach(p => {
                const text = p.textContent.trim();
                
                // Extrair tipo
                if (text.startsWith('Tipo:')) {
                    data.tipo = text.replace('Tipo:', '').trim().toLowerCase();
                }
                
                // Extrair resumo
                else if (text.startsWith('Resumo') || text.startsWith('Informação')) {
                    data.resumo = text.replace(/^(Resumo|Informação)[^:]*:\s*/, '').trim();
                    data.titulo = data.resumo;
                }
                
                // Extrair autor
                else if (text.startsWith('Autor:')) {
                    data.autor = text.replace('Autor:', '').trim();
                }
                
                // Extrair nível
                else if (text.startsWith('Nível:')) {
                    data.nivel = text.replace('Nível:', '').trim().toLowerCase();
                }
            });
            
            // Extrair tags adicionais
            data.tags = [
                data.categoria,
                data.tipo,
                data.nivel,
                data.autor.toLowerCase()
            ].filter(tag => tag && tag !== '');
            
            return data;
        }
        
        setupEventListeners() {
            // Busca por botão
            if (this.searchBtn) {
                this.searchBtn.addEventListener('click', () => this.performSearch());
            }
            
            // Busca por Enter
            if (this.searchInput) {
                this.searchInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.performSearch();
                    }
                });
                
                // Busca em tempo real com debounce
                let timeout;
                this.searchInput.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.performSearch();
                    }, CONFIG.searchDelay);
                });
            }
        }
        
        setupQuickFilters() {
            this.quickFilters.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;
                    this.applyQuickFilter(filter);
                });
            });
        }
        
        applyQuickFilter(filter) {
            // Atualizar botões ativos
            this.quickFilters.forEach(btn => {
                if (btn.dataset.filter === filter) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Aplicar filtro
            CONFIG.filters.categoria = filter;
            this.performSearch();
        }
        
        performSearch() {
            const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
            CONFIG.filters.searchTerm = searchTerm;
            
            // Filtrar recursos
            const filteredResources = this.filterResources();
            
            // Atualizar resultados
            this.renderResults(filteredResources);
            
            // Atualizar contador
            this.updateResultsCount(filteredResources.length);
            
            // Animar resultados
            this.animateResults(filteredResources);
        }
        
        filterResources() {
            return this.resources.filter(resource => {
                const data = resource.data;
                
                // Filtrar por categoria
                if (CONFIG.filters.categoria !== 'todos' && 
                    data.categoria !== CONFIG.filters.categoria) {
                    return false;
                }
                
                // Filtrar por termo de busca
                if (CONFIG.filters.searchTerm) {
                    const searchableText = [
                        data.categoria,
                        data.tipo,
                        data.titulo,
                        data.resumo,
                        data.autor,
                        data.nivel,
                        ...data.tags
                    ].join(' ').toLowerCase();
                    
                    if (!searchableText.includes(CONFIG.filters.searchTerm)) {
                        return false;
                    }
                }
                
                return true;
            });
        }
        
        renderResults(resources) {
            if (!this.resourcesContainer) return;
            
            // Limpar container
            this.resourcesContainer.innerHTML = '';
            
            if (resources.length === 0) {
                this.showNoResultsMessage();
                return;
            }
            
            // Renderizar recursos
            resources.forEach(resource => {
                this.renderResource(resource);
            });
        }
        
        renderResource(resource) {
            // Criar card estilizado
            const card = this.createStyledCard(resource);
            this.resourcesContainer.appendChild(card);
        }
        
        createStyledCard(resource) {
            const card = document.createElement('div');
            card.className = 'resource-highlight fade-in';
            card.id = resource.id;
            
            // Determinar cor da badge baseado na categoria
            const badgeClass = this.getBadgeClass(resource.data.categoria);
            const nivelClass = this.getLevelClass(resource.data.nivel);
            
            // Construir conteúdo do card
            card.innerHTML = `
                <div class="resource-header">
                    <div class="resource-id">${resource.id}</div>
                    <span class="resource-badge ${badgeClass}">${resource.data.categoria}</span>
                </div>
                
                <div class="resource-content">
                    <h1>${this.capitalizeFirst(resource.data.categoria)}: ${resource.data.titulo}</h1>
                    
                    <p><strong>Tipo:</strong> ${this.capitalizeFirst(resource.data.tipo)}</p>
                    <p><strong>Resumo:</strong> ${resource.data.resumo}</p>
                    <p><strong>Autor:</strong> ${resource.data.autor}</p>
                    <p><strong>Nível:</strong> <span class="${nivelClass}">${this.capitalizeFirst(resource.data.nivel)}</span></p>
                    
                    <div class="media-container">
                        ${this.extractMediaHTML(resource.element)}
                    </div>
                    
                    <div class="resource-tags">
                        ${this.generateTags(resource.data)}
                    </div>
                    
                    ${this.generateActionButtons(resource)}
                </div>
            `;
            
            // Adicionar evento de clique para modal
            this.addCardInteractions(card, resource);
            
            return card;
        }
        
        extractMediaHTML(element) {
            const mediaElement = element.querySelector('audio, video, img, a');
            if (!mediaElement) return '';
            
            if (mediaElement.tagName === 'A') {
                return `<a href="${mediaElement.href}" target="_blank" class="resource-link">📖 Ver E-book Completo</a>`;
            } else {
                return mediaElement.outerHTML;
            }
        }
        
        generateTags(data) {
            const tags = [
                data.categoria,
                data.tipo,
                data.nivel
            ];
            
            return tags
                .filter(tag => tag && tag !== '')
                .map(tag => `<span class="resource-tag">${this.capitalizeFirst(tag)}</span>`)
                .join('');
        }
        
        generateActionButtons(resource) {
            const buttons = [];
            
            // Botão para expandir
            buttons.push(`
                <button class="btn-expand" data-resource="${resource.id}">
                    <i class="fas fa-expand-alt"></i> Expandir
                </button>
            `);
            
            // Botão para reproduzir/visualizar
            const mediaElement = resource.element.querySelector('audio, video, img, a');
            if (mediaElement) {
                if (mediaElement.tagName === 'AUDIO' || mediaElement.tagName === 'VIDEO') {
                    buttons.push(`
                        <button class="btn-play" data-resource="${resource.id}">
                            <i class="fas fa-play"></i> Reproduzir
                        </button>
                    `);
                } else if (mediaElement.tagName === 'A') {
                    buttons.push(`
                        <a href="${mediaElement.href}" target="_blank" class="resource-link">
                            <i class="fas fa-external-link-alt"></i> Abrir E-book
                        </a>
                    `);
                }
            }
            
            return `
                <div class="resource-actions">
                    ${buttons.join('')}
                </div>
            `;
        }
        
        addCardInteractions(card, resource) {
            // Botão expandir
            const expandBtn = card.querySelector('.btn-expand');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    this.showResourceModal(resource);
                });
            }
            
            // Botão reproduzir
            const playBtn = card.querySelector('.btn-play');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    this.playMedia(resource);
                });
            }
        }
        
        getBadgeClass(categoria) {
            const classes = {
                'áudio': 'badge-audio',
                'aúdio': 'badge-audio',
                'ebook': 'badge-ebook',
                'e-book': 'badge-ebook',
                'vídeo': 'badge-video',
                'video': 'badge-video',
                'imagem': 'badge-imagem'
            };
            
            return classes[categoria] || 'badge-audio';
        }
        
        getLevelClass(nivel) {
            const classes = {
                'básico': 'level-basico',
                'intermediário': 'level-intermediario',
                'avançado': 'level-avancado'
            };
            
            return classes[nivel] || '';
        }
        
        capitalizeFirst(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        
        renderAllResources() {
            this.renderResults(this.resources);
            this.updateResultsCount(this.resources.length);
        }
        
        updateResultsCount(count) {
            if (this.resultsCount) {
                this.resultsCount.textContent = `Mostrando ${count} recurso${count !== 1 ? 's' : ''}`;
                
                // Animar contador
                this.resultsCount.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    this.resultsCount.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        showNoResultsMessage() {
            this.resourcesContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; color: rgb(214, 174, 100); margin-bottom: 20px;">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 style="color: #FFFFFF; margin-bottom: 10px; font-size: 1.5rem;">
                        Nenhum recurso encontrado
                    </h3>
                    <p style="color: #CCCCCC; max-width: 400px; margin: 0 auto; line-height: 1.6;">
                        Não encontramos recursos correspondentes à sua busca.
                        Tente usar termos diferentes ou remova alguns filtros.
                    </p>
                    <button id="reset-search" style="margin-top: 30px; padding: 12px 24px; background: rgb(214, 174, 100); color: #000000; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                        <i class="fas fa-redo"></i> Limpar Busca
                    </button>
                </div>
            `;
            
            // Adicionar evento ao botão de reset
            const resetBtn = document.getElementById('reset-search');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetSearch();
                });
            }
        }
        
        resetSearch() {
            // Resetar filtros
            CONFIG.filters = {
                categoria: 'todos',
                tipo: 'todos',
                nivel: 'todos',
                autor: 'todos',
                searchTerm: ''
            };
            
            // Resetar UI
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            
            this.quickFilters.forEach(btn => {
                if (btn.dataset.filter === 'todos') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Renderizar todos os recursos
            this.renderAllResources();
        }
        
        animateResults(resources) {
            const cards = this.resourcesContainer.querySelectorAll('.resource-highlight');
            cards.forEach((card, index) => {
                card.style.animationDelay = `${index * CONFIG.animationStep}ms`;
                card.classList.add('fade-in');
            });
        }
        
        showResourceModal(resource) {
            // Criar modal
            const modal = document.createElement('div');
            modal.className = 'resource-modal';
            modal.id = `modal-${resource.id}`;
            
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="resource-header">
                        <div class="resource-id">${resource.id}</div>
                        <span class="resource-badge ${this.getBadgeClass(resource.data.categoria)}">
                            ${resource.data.categoria}
                        </span>
                    </div>
                    
                    <h1 style="color: rgb(214, 174, 100); margin: 20px 0;">
                        ${this.capitalizeFirst(resource.data.categoria)}: ${resource.data.titulo}
                    </h1>
                    
                    <div style="color: #FFFFFF; margin-bottom: 20px;">
                        <p><strong>Tipo:</strong> ${this.capitalizeFirst(resource.data.tipo)}</p>
                        <p><strong>Autor:</strong> ${resource.data.autor}</p>
                        <p><strong>Nível:</strong> <span class="${this.getLevelClass(resource.data.nivel)}">
                            ${this.capitalizeFirst(resource.data.nivel)}
                        </span></p>
                        <p><strong>Resumo:</strong> ${resource.data.resumo}</p>
                    </div>
                    
                    <div class="modal-media">
                        ${this.extractMediaHTML(resource.element)}
                    </div>
                    
                    <div style="margin-top: 30px; color: #CCCCCC; font-size: 0.9rem;">
                        <p><i class="fas fa-info-circle"></i> Clique fora da janela ou no botão X para fechar</p>
                    </div>
                </div>
            `;
            
            // Adicionar ao DOM
            document.body.appendChild(modal);
            
            // Mostrar modal com animação
            setTimeout(() => {
                modal.style.display = 'flex';
                modal.style.opacity = '1';
            }, 10);
            
            // Configurar eventos do modal
            this.setupModalEvents(modal);
        }
        
        setupModalEvents(modal) {
            // Botão fechar
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modal);
                });
            }
            
            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
            
            // Fechar com ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeModal(modal);
                }
            });
        }
        
        closeModal(modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
        
        playMedia(resource) {
            const mediaElement = resource.element.querySelector('audio, video');
            if (mediaElement) {
                // Criar player flutuante
                this.createFloatingPlayer(mediaElement.cloneNode(true), resource.data);
            }
        }
        
        createFloatingPlayer(mediaElement, data) {
            // Remover player existente
            const existingPlayer = document.querySelector('.floating-player');
            if (existingPlayer) {
                existingPlayer.remove();
            }
            
            // Criar novo player
            const player = document.createElement('div');
            player.className = 'floating-player';
            
            player.innerHTML = `
                <div class="player-header">
                    <span class="player-title">${data.titulo}</span>
                    <button class="player-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="player-body">
                    ${mediaElement.outerHTML}
                </div>
                <div class="player-footer">
                    <span class="player-info">${data.autor} • ${data.categoria}</span>
                </div>
            `;
            
            // Adicionar ao DOM
            document.body.appendChild(player);
            
            // Estilizar player
            Object.assign(player.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '300px',
                background: '#000000',
                border: `2px solid ${this.getBadgeColor(data.categoria)}`,
                borderRadius: '8px',
                zIndex: '1000',
                boxShadow: '0 5px 20px rgba(0,0,0,0.5)'
            });
            
            // Configurar eventos
            const closeBtn = player.querySelector('.player-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    player.remove();
                });
            }
            
            // Reproduzir automaticamente
            const media = player.querySelector('audio, video');
            if (media) {
                media.play().catch(e => {
                    console.log('Reprodução automática bloqueada:', e);
                });
            }
        }
        
        getBadgeColor(categoria) {
            const colors = {
                'áudio': '#0066cc',
                'aúdio': '#0066cc',
                'ebook': '#00cc66',
                'e-book': '#00cc66',
                'vídeo': '#cc3333',
                'video': '#cc3333',
                'imagem': '#9966cc'
            };
            
            return colors[categoria] || '#0066cc';
        }
    }
    
    // 2. SISTEMA DE FILTROS AVANÇADOS
    class AdvancedFilterSystem {
        constructor() {
            this.filterToggle = document.getElementById('filter-toggle');
            this.filterContent = document.getElementById('filter-content');
            this.applyBtn = document.getElementById('apply-filters');
            this.clearBtn = document.getElementById('clear-filters');
            this.filterOptions = document.querySelectorAll('.filter-option');
            
            this.activeFilters = {
                type: 'todos',
                category: 'todos',
                level: 'todos'
            };
            
            this.init();
        }
        
        init() {
            this.setupEventListeners();
            this.loadSavedFilters();
        }
        
        setupEventListeners() {
            // Toggle do painel de filtros
            if (this.filterToggle) {
                this.filterToggle.addEventListener('click', () => this.toggleFilters());
            }
            
            // Opções de filtro
            this.filterOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    this.selectFilterOption(e.target);
                });
            });
            
            // Botões de ação
            if (this.applyBtn) {
                this.applyBtn.addEventListener('click', () => this.applyAdvancedFilters());
            }
            
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clearAdvancedFilters());
            }
        }
        
        toggleFilters() {
            if (this.filterContent.classList.contains('active')) {
                this.closeFilters();
            } else {
                this.openFilters();
            }
        }
        
        openFilters() {
            this.filterContent.classList.add('active');
            this.filterContent.style.maxHeight = this.filterContent.scrollHeight + 'px';
            
            const icon = this.filterToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-chevron-up';
            }
        }
        
        closeFilters() {
            this.filterContent.classList.remove('active');
            this.filterContent.style.maxHeight = '0';
            
            const icon = this.filterToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-chevron-down';
            }
        }
        
        selectFilterOption(option) {
            const filterGroup = option.closest('.filter-options');
            const filterName = filterGroup.id.replace('filter-', '');
            
            // Remover seleção anterior
            filterGroup.querySelectorAll('.filter-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Selecionar nova opção
            option.classList.add('selected');
            
            // Atualizar filtro
            this.activeFilters[filterName] = option.dataset.value;
            
            // Feedback visual
            option.style.transform = 'scale(0.9)';
            setTimeout(() => {
                option.style.transform = 'scale(1)';
            }, 150);
        }
        
        applyAdvancedFilters() {
            // Fechar painel
            this.closeFilters();
            
            // Salvar filtros
            this.saveFilters();
            
            // Disparar evento
            this.dispatchFilterEvent();
            
            // Feedback visual
            if (this.applyBtn) {
                const originalText = this.applyBtn.textContent;
                this.applyBtn.textContent = '✓ Aplicado!';
                this.applyBtn.style.background = '#00cc66';
                
                setTimeout(() => {
                    this.applyBtn.textContent = originalText;
                    this.applyBtn.style.background = '';
                }, 1500);
            }
        }
        
        clearAdvancedFilters() {
            // Resetar filtros
            this.activeFilters = {
                type: 'todos',
                category: 'todos',
                level: 'todos'
            };
            
            // Resetar UI
            this.filterOptions.forEach(option => {
                if (option.dataset.value === 'todos') {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
            
            // Salvar filtros limpos
            this.saveFilters();
            
            // Disparar evento
            this.dispatchFilterEvent();
            
            // Feedback visual
            if (this.clearBtn) {
                this.clearBtn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    this.clearBtn.style.transform = 'scale(1)';
                }, 150);
            }
        }
        
        saveFilters() {
            try {
                localStorage.setItem('advancedFilters', JSON.stringify(this.activeFilters));
            } catch (e) {
                console.log('Não foi possível salvar filtros:', e);
            }
        }
        
        loadSavedFilters() {
            try {
                const saved = localStorage.getItem('advancedFilters');
                if (saved) {
                    this.activeFilters = JSON.parse(saved);
                    
                    // Aplicar à UI
                    Object.keys(this.activeFilters).forEach(filterName => {
                        const value = this.activeFilters[filterName];
                        const options = document.querySelectorAll(`#filter-${filterName} .filter-option`);
                        options.forEach(option => {
                            if (option.dataset.value === value) {
                                option.classList.add('selected');
                            } else {
                                option.classList.remove('selected');
                            }
                        });
                    });
                }
            } catch (e) {
                console.log('Não foi possível carregar filtros:', e);
            }
        }
        
        dispatchFilterEvent() {
            const event = new CustomEvent('advancedFiltersChanged', {
                detail: this.activeFilters
            });
            document.dispatchEvent(event);
        }
    }
    
    // 3. SISTEMA DE PERSISTÊNCIA E HISTÓRICO
    class LibraryPersistence {
        constructor() {
            this.init();
        }
        
        init() {
            this.setupHistory();
            this.setupBookmarks();
            this.setupLastViewed();
        }
        
        setupHistory() {
            // Salvar pesquisas recentes
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('blur', () => {
                    const term = searchInput.value.trim();
                    if (term) {
                        this.saveSearchHistory(term);
                    }
                });
            }
        }
        
        saveSearchHistory(term) {
            try {
                let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                
                // Remover se já existir
                history = history.filter(item => item !== term);
                
                // Adicionar no início
                history.unshift(term);
                
                // Manter apenas os 10 últimos
                history = history.slice(0, 10);
                
                localStorage.setItem('searchHistory', JSON.stringify(history));
            } catch (e) {
                console.log('Não foi possível salvar histórico:', e);
            }
        }
        
        setupBookmarks() {
            // Sistema de favoritos
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-bookmark') || 
                    e.target.closest('.btn-bookmark')) {
                    const resourceId = e.target.dataset.resource || 
                                     e.target.closest('.btn-bookmark').dataset.resource;
                    this.toggleBookmark(resourceId);
                }
            });
        }
        
        toggleBookmark(resourceId) {
            try {
                let bookmarks = JSON.parse(localStorage.getItem('libraryBookmarks') || '[]');
                
                if (bookmarks.includes(resourceId)) {
                    // Remover bookmark
                    bookmarks = bookmarks.filter(id => id !== resourceId);
                    this.showToast('❌ Removido dos favoritos');
                } else {
                    // Adicionar bookmark
                    bookmarks.push(resourceId);
                    this.showToast('✅ Adicionado aos favoritos');
                }
                
                localStorage.setItem('libraryBookmarks', JSON.stringify(bookmarks));
                
                // Atualizar UI
                this.updateBookmarkUI(resourceId, bookmarks.includes(resourceId));
                
            } catch (e) {
                console.log('Erro ao manipular favoritos:', e);
            }
        }
        
        updateBookmarkUI(resourceId, isBookmarked) {
            const resourceElement = document.getElementById(resourceId);
            if (resourceElement) {
                const bookmarkBtn = resourceElement.querySelector('.btn-bookmark');
                if (bookmarkBtn) {
                    if (isBookmarked) {
                        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Salvo';
                        bookmarkBtn.style.color = 'rgb(214, 174, 100)';
                    } else {
                        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Salvar';
                        bookmarkBtn.style.color = '';
                    }
                }
            }
        }
        
        setupLastViewed() {
            // Salvar último recurso visualizado
            document.addEventListener('click', (e) => {
                const resourceCard = e.target.closest('.resource-highlight');
                if (resourceCard) {
                    const resourceId = resourceCard.id;
                    this.saveLastViewed(resourceId);
                }
            });
        }
        
        saveLastViewed(resourceId) {
            try {
                let lastViewed = JSON.parse(localStorage.getItem('lastViewed') || '[]');
                
                // Remover se já existir
                lastViewed = lastViewed.filter(id => id !== resourceId);
                
                // Adicionar no início
                lastViewed.unshift(resourceId);
                
                // Manter apenas os 5 últimos
                lastViewed = lastViewed.slice(0, 5);
                
                localStorage.setItem('lastViewed', JSON.stringify(lastViewed));
            } catch (e) {
                console.log('Não foi possível salvar último visualizado:', e);
            }
        }
        
        showToast(message) {
            // Remover toast existente
            const existingToast = document.querySelector('.library-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            // Criar novo toast
            const toast = document.createElement('div');
            toast.className = 'library-toast';
            toast.textContent = message;
            
            // Estilizar toast
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '2px solid rgb(214, 174, 100)',
                zIndex: '1001',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            });
            
            // Adicionar ao DOM
            document.body.appendChild(toast);
            
            // Remover após 3 segundos
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    // 4. INICIALIZAÇÃO COMPLETA
    function initializeLibraryExtra() {
        console.log('🔍 Inicializando sistema extra da biblioteca...');
        
        try {
            // Inicializar sistemas
            const searchEngine = new SmartSearchEngine();
            const filterSystem = new AdvancedFilterSystem();
            const persistence = new LibraryPersistence();
            
            // Adicionar CSS adicional para interações
            if (!document.querySelector('#library-extra-styles')) {
                const styles = document.createElement('style');
                styles.id = 'library-extra-styles';
                styles.textContent = `
                    /* Botões de ação */
                    .resource-actions {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                        flex-wrap: wrap;
                    }
                    
                    .btn-expand, .btn-play, .btn-bookmark {
                        padding: 10px 16px;
                        border: none;
                        border-radius: 4px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 0.9rem;
                    }
                    
                    .btn-expand {
                        background: rgba(214, 174, 100, 0.1);
                        color: rgb(214, 174, 100);
                    }
                    
                    .btn-expand:hover {
                        background: rgb(214, 174, 100);
                        color: #000000;
                        transform: translateY(-2px);
                    }
                    
                    .btn-play {
                        background: rgba(0, 102, 204, 0.1);
                        color: #0066cc;
                    }
                    
                    .btn-play:hover {
                        background: #0066cc;
                        color: #FFFFFF;
                        transform: translateY(-2px);
                    }
                    
                    .btn-bookmark {
                        background: rgba(255, 255, 255, 0.05);
                        color: #CCCCCC;
                    }
                    
                    .btn-bookmark:hover {
                        background: rgba(214, 174, 100, 0.2);
                        color: rgb(214, 174, 100);
                    }
                    
                    /* Floating player */
                    .floating-player {
                        animation: slideIn 0.3s ease;
                    }
                    
                    .player-header {
                        padding: 12px 15px;
                        background: rgba(0, 0, 0, 0.8);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .player-title {
                        color: #FFFFFF;
                        font-weight: 600;
                        font-size: 0.9rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    
                    .player-close {
                        background: transparent;
                        border: none;
                        color: #CCCCCC;
                        cursor: pointer;
                        font-size: 1rem;
                    }
                    
                    .player-close:hover {
                        color: #FFFFFF;
                    }
                    
                    .player-body {
                        padding: 15px;
                    }
                    
                    .player-footer {
                        padding: 8px 15px;
                        background: rgba(0, 0, 0, 0.8);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 0.8rem;
                        color: #888;
                    }
                    
                    /* Animações */
                    @keyframes slideIn {
                        from {
                            transform: translateY(100px) scale(0.9);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0) scale(1);
                            opacity: 1;
                        }
                    }
                    
                    /* No results */
                    .no-results {
                        animation: fadeIn 0.5s ease;
                    }
                    
                    /* Modal animations */
                    .resource-modal {
                        animation: fadeInModal 0.3s ease;
                    }
                    
                    @keyframes fadeInModal {
                        from {
                            opacity: 0;
                            backdrop-filter: blur(0px);
                        }
                        to {
                            opacity: 1;
                            backdrop-filter: blur(5px);
                        }
                    }
                    
                    /* Responsividade extra */
                    @media (max-width: 768px) {
                        .resource-actions {
                            flex-direction: column;
                        }
                        
                        .btn-expand, .btn-play, .btn-bookmark {
                            width: 100%;
                            justify-content: center;
                        }
                        
                        .floating-player {
                            width: calc(100% - 40px) !important;
                            right: 20px;
                            left: 20px;
                            bottom: 20px;
                        }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            // Adicionar botão de bookmark a todos os recursos
            setTimeout(() => {
                document.querySelectorAll('.resource-highlight').forEach(card => {
                    const actionsDiv = card.querySelector('.resource-actions');
                    if (actionsDiv) {
                        const bookmarkBtn = document.createElement('button');
                        bookmarkBtn.className = 'btn-bookmark';
                        bookmarkBtn.dataset.resource = card.id;
                        bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Salvar';
                        actionsDiv.appendChild(bookmarkBtn);
                    }
                });
            }, 500);
            
            // Configurar integração entre sistemas
            document.addEventListener('advancedFiltersChanged', (e) => {
                console.log('Filtros avançados atualizados:', e.detail);
                // Aqui você pode integrar com o sistema de busca
                if (window.TecaLibrary) {
                    // Integração com o sistema principal se existir
                }
            });
            
            console.log('✅ Sistema extra da biblioteca inicializado com sucesso!');
            
            return {
                searchEngine,
                filterSystem,
                persistence
            };
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema extra:', error);
            return null;
        }
    }
    
    // 5. INICIALIZAR QUANDO O DOM ESTIVER PRONTO
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLibraryExtra);
    } else {
        setTimeout(initializeLibraryExtra, 100);
    }
    
    // 6. EXPORTAR PARA USO GLOBAL
    window.TecaLibraryExtra = {
        SmartSearchEngine,
        AdvancedFilterSystem,
        LibraryPersistence,
        initializeLibraryExtra,
        CONFIG
    };
    
})();