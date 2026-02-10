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