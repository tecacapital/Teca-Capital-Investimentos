// ===================================================
// CONTEÚDO PRINCIPAL - JAVASCRIPT ALTERNATIVO
// ===================================================

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
        animationsEnabled: true,
        carouselAutoScroll: false,
        autoScrollInterval: 5000
    };
    
    // 1. ANIMAÇÃO DE STATS (CONTADORES)
    class AnimatedStats {
        constructor() {
            this.statNumbers = document.querySelectorAll('.stat-number[data-target]');
            this.statsAnimated = false;
            this.init();
        }
        
        init() {
            if (this.statNumbers.length === 0) return;
            
            // Observar quando stats entram na viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.statsAnimated) {
                        this.statsAnimated = true;
                        this.animateAllCounters();
                    }
                });
            }, { 
                threshold: 0.3,
                rootMargin: '0px 0px -50px 0px'
            });
            
            // Observar o container dos stats
            const statsContainer = document.querySelector('.stats-container');
            if (statsContainer) {
                observer.observe(statsContainer);
            }
        }
        
        animateAllCounters() {
            this.statNumbers.forEach((stat, index) => {
                setTimeout(() => {
                    this.animateCounter(stat);
                }, index * 200); // Delay entre cada contador
            });
        }
        
        animateCounter(element) {
            const target = parseInt(element.getAttribute('data-target'));
            const duration = 1500; // 1.5 segundos
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function para movimento suave
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                const currentValue = Math.floor(target * easedProgress);
                element.textContent = currentValue;
                
                // Adicionar efeito visual durante a animação
                if (progress < 1) {
                    element.style.transform = `scale(${1 + 0.1 * easedProgress})`;
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = target;
                    element.style.transform = 'scale(1)';
                    
                    // Efeito final
                    element.classList.add('animated');
                    setTimeout(() => {
                        element.classList.remove('animated');
                    }, 500);
                }
            };
            
            requestAnimationFrame(animate);
        }
    }
    
    // 2. CONTROLE DO CARROSSEL COM NAVEGAÇÃO INFERIOR
    class SimulatorsCarousel {
        constructor() {
            this.container = document.querySelector('.simulators-container');
            this.cards = document.querySelectorAll('.simulator-card');
            this.prevBtn = document.querySelector('#prev-btn') || document.querySelector('.carousel-btn:first-child');
            this.nextBtn = document.querySelector('#next-btn') || document.querySelector('.carousel-btn:last-child');
            this.currentIndex = 0;
            this.cardWidth = 280; // Largura do card
            this.gap = 25; // Gap entre cards
            this.isDragging = false;
            this.startX = 0;
            this.scrollLeft = 0;
            
            if (this.container && this.cards.length > 0) {
                this.init();
            }
        }
        
        init() {
            // Configurar botões de navegação
            this.setupNavigationButtons();
            
            // Configurar arrasto para desktop e touch para mobile
            this.setupDragAndTouch();
            
            // Configurar auto-scroll se ativado
            if (config.carouselAutoScroll && !config.isMobile) {
                this.setupAutoScroll();
            }
            
            // Inicializar estado dos botões
            this.updateButtonStates();
            
            // Atualizar estados quando scrollar
            this.container.addEventListener('scroll', () => {
                this.updateButtonStates();
            });
        }
        
        setupNavigationButtons() {
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollTo('prev');
                });
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollTo('next');
                });
            }
        }
        
        scrollTo(direction) {
            const scrollAmount = (this.cardWidth + this.gap) * 2; // Mover 2 cards por vez
            
            if (direction === 'next') {
                this.container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            } else {
                this.container.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            }
            
            // Atualizar índice atual
            setTimeout(() => {
                this.updateCurrentIndex();
                this.updateButtonStates();
            }, 300);
        }
        
        setupDragAndTouch() {
            // Eventos de mouse para desktop
            this.container.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.startX = e.pageX - this.container.offsetLeft;
                this.scrollLeft = this.container.scrollLeft;
                this.container.style.cursor = 'grabbing';
            });
            
            this.container.addEventListener('mouseleave', () => {
                this.isDragging = false;
                this.container.style.cursor = 'grab';
            });
            
            this.container.addEventListener('mouseup', () => {
                this.isDragging = false;
                this.container.style.cursor = 'grab';
                this.updateCurrentIndex();
            });
            
            this.container.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                e.preventDefault();
                const x = e.pageX - this.container.offsetLeft;
                const walk = (x - this.startX) * 2;
                this.container.scrollLeft = this.scrollLeft - walk;
            });
            
            // Eventos de touch para mobile
            this.container.addEventListener('touchstart', (e) => {
                this.startX = e.touches[0].pageX - this.container.offsetLeft;
                this.scrollLeft = this.container.scrollLeft;
            }, { passive: true });
            
            this.container.addEventListener('touchmove', (e) => {
                const x = e.touches[0].pageX - this.container.offsetLeft;
                const walk = (x - this.startX) * 2;
                this.container.scrollLeft = this.scrollLeft - walk;
            }, { passive: true });
            
            this.container.addEventListener('touchend', () => {
                this.updateCurrentIndex();
            });
        }
        
        updateCurrentIndex() {
            const scrollPosition = this.container.scrollLeft;
            this.currentIndex = Math.round(scrollPosition / (this.cardWidth + this.gap));
        }
        
        updateButtonStates() {
            const scrollLeft = this.container.scrollLeft;
            const maxScroll = this.container.scrollWidth - this.container.clientWidth;
            
            if (this.prevBtn) {
                this.prevBtn.disabled = scrollLeft <= 10; // Margem de erro
                this.prevBtn.style.opacity = scrollLeft <= 10 ? '0.5' : '1';
                this.prevBtn.style.cursor = scrollLeft <= 10 ? 'not-allowed' : 'pointer';
            }
            
            if (this.nextBtn) {
                this.nextBtn.disabled = scrollLeft >= maxScroll - 10;
                this.nextBtn.style.opacity = scrollLeft >= maxScroll - 10 ? '0.5' : '1';
                this.nextBtn.style.cursor = scrollLeft >= maxScroll - 10 ? 'not-allowed' : 'pointer';
            }
        }
        
        setupAutoScroll() {
            let autoScrollInterval;
            
            const startAutoScroll = () => {
                autoScrollInterval = setInterval(() => {
                    if (this.currentIndex < this.cards.length - 2) {
                        this.scrollTo('next');
                    } else {
                        // Voltar ao início
                        this.container.scrollTo({
                            left: 0,
                            behavior: 'smooth'
                        });
                        this.currentIndex = 0;
                    }
                }, config.autoScrollInterval);
            };
            
            // Pausar auto-scroll quando o usuário interagir
            this.container.addEventListener('mouseenter', () => {
                if (autoScrollInterval) {
                    clearInterval(autoScrollInterval);
                }
            });
            
            this.container.addEventListener('mouseleave', () => {
                startAutoScroll();
            });
            
            // Iniciar auto-scroll
            startAutoScroll();
        }
    }
    
    // 3. SISTEMA DE BORDAS ANIMADAS
    class AnimatedBorders {
        constructor() {
            this.animatedElements = document.querySelectorAll('.service-card, .differentiator-card, .simulator-card, .stat-card');
            this.init();
        }
        
        init() {
            if (this.animatedElements.length === 0 || !config.animationsEnabled) return;
            
            // Otimizar para dispositivos móveis
            if (config.isMobile) {
                this.optimizeForMobile();
            }
            
            // Adicionar eventos de hover
            this.setupHoverEffects();
            
            // Controlar animações baseado na visibilidade
            this.setupVisibilityControl();
        }
        
        optimizeForMobile() {
            // Reduzir a qualidade da animação para melhor performance
            this.animatedElements.forEach(element => {
                const pseudoElement = element;
                if (pseudoElement.style) {
                    pseudoElement.style.animationDuration = '6s';
                }
            });
            
            // Pausar animações quando fora da tela
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.style.animationPlayState = 'running';
                        } else {
                            entry.target.style.animationPlayState = 'paused';
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '50px'
                });
                
                this.animatedElements.forEach(element => {
                    observer.observe(element);
                });
            }
        }
        
        setupHoverEffects() {
            this.animatedElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                    if (!config.isMobile) {
                        element.style.setProperty('--animation-speed', '1.5s');
                        
                        // Destacar elemento
                        element.style.zIndex = '10';
                        element.style.boxShadow = '0 20px 40px rgba(214, 174, 100, 0.3)';
                    }
                });
                
                element.addEventListener('mouseleave', () => {
                    element.style.setProperty('--animation-speed', '3s');
                    element.style.zIndex = '';
                    element.style.boxShadow = '';
                });
            });
        }
        
        setupVisibilityControl() {
            // Em telas muito pequenas, desativar animações complexas
            if (config.isExtraSmall) {
                this.animatedElements.forEach(element => {
                    element.style.animation = 'none';
                });
            }
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
            this.setupResizeListener();
            this.setupHeroAlignment();
        }
        
        setupResizeListener() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    config.isMobile = window.innerWidth < 768;
                    config.isExtraSmall = window.innerWidth < 350;
                    this.optimizeLayoutForViewport();
                }, 250);
            });
        }
        
        optimizeLayoutForViewport() {
            const width = window.innerWidth;
            
            // Ajustar alinhamento do banner
            this.adjustHeroAlignment(width);
            
            // Ajustes para telas muito pequenas
            if (width < 350) {
                this.applyExtraSmallOptimizations();
            } else {
                this.removeExtraSmallOptimizations();
            }
            
            // Ajustar largura dos vídeos
            this.adjustVideoSizes(width);
            
            // Otimizar animações
            this.optimizeAnimations(width);
        }
        
        adjustHeroAlignment(width) {
            const heroContent = document.querySelector('.hero-content');
            if (!heroContent) return;
            
            if (width < 768) {
                // Mobile: centralizar
                heroContent.style.textAlign = 'center';
                heroContent.style.marginLeft = 'auto';
                heroContent.style.marginRight = 'auto';
                heroContent.style.maxWidth = '100%';
                heroContent.style.padding = '0 20px';
                
                // Ajustar botões
                const heroButtons = document.querySelector('.hero-buttons');
                if (heroButtons) {
                    heroButtons.style.justifyContent = 'center';
                }
            } else {
                // Desktop: alinhar à direita
                heroContent.style.textAlign = 'right';
                heroContent.style.marginLeft = 'auto';
                heroContent.style.marginRight = '20px';
                heroContent.style.maxWidth = '600px';
                heroContent.style.padding = '0';
                
                // Ajustar botões
                const heroButtons = document.querySelector('.hero-buttons');
                if (heroButtons) {
                    heroButtons.style.justifyContent = 'flex-end';
                }
            }
        }
        
        applyExtraSmallOptimizations() {
            // Ajustes específicos para <350px
            this.sections.forEach(section => {
                section.style.paddingLeft = '10px';
                section.style.paddingRight = '10px';
            });
            
            // Reduzir tamanhos de fonte
            document.querySelectorAll('.section-title').forEach(title => {
                title.style.fontSize = '1.5rem';
            });
            
            document.querySelectorAll('.section-subtitle').forEach(subtitle => {
                subtitle.style.fontSize = '0.9rem';
            });
            
            // Garantir que grids sejam de coluna única
            document.querySelectorAll('.services-grid, .differentiators-grid').forEach(grid => {
                grid.style.gridTemplateColumns = '1fr';
                grid.style.gap = '15px';
            });
            
            // Ajustar cards
            document.querySelectorAll('.service-card, .differentiator-card').forEach(card => {
                card.style.padding = '20px 15px';
            });
            
            // Ajustar stats
            const statsContainer = document.querySelector('.stats-container');
            if (statsContainer) {
                statsContainer.style.gridTemplateColumns = '1fr';
                statsContainer.style.gap = '10px';
            }
        }
        
        removeExtraSmallOptimizations() {
            // Remover estilos inline para permitir que o CSS controle
            const elements = document.querySelectorAll('[style*="font-size"], [style*="padding"], [style*="grid-template-columns"]');
            elements.forEach(el => {
                if (el.classList.contains('section-title') || 
                    el.classList.contains('section-subtitle') ||
                    el.classList.contains('services-grid') ||
                    el.classList.contains('differentiators-grid') ||
                    el.classList.contains('service-card') ||
                    el.classList.contains('differentiator-card')) {
                    el.style.cssText = el.style.cssText
                        .replace(/font-size[^;]+;?/g, '')
                        .replace(/padding[^;]+;?/g, '')
                        .replace(/grid-template-columns[^;]+;?/g, '')
                        .replace(/gap[^;]+;?/g, '');
                }
            });
            
            this.sections.forEach(section => {
                section.style.paddingLeft = '';
                section.style.paddingRight = '';
            });
        }
        
        adjustVideoSizes(width) {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
                if (width < 768) {
                    video.style.maxWidth = '100%';
                } else {
                    video.style.maxWidth = '80%';
                }
            });
        }
        
        optimizeAnimations(width) {
            if (width < 768) {
                document.documentElement.style.setProperty('--animation-quality', '0.5');
            } else {
                document.documentElement.style.setProperty('--animation-quality', '1');
            }
        }
        
        setupHeroAlignment() {
            // Forçar alinhamento inicial
            setTimeout(() => {
                this.adjustHeroAlignment(window.innerWidth);
            }, 100);
        }
    }
    
    // 5. INICIALIZADOR E CONTROLE DE VÍDEOS
    class VideoController {
        constructor() {
            this.videos = document.querySelectorAll('video');
            this.init();
        }
        
        init() {
            if (this.videos.length === 0) return;
            
            this.ensureVideoVisibility();
            this.setupVideoPlayback();
            this.setupResponsiveBehavior();
        }
        
        ensureVideoVisibility() {
            this.videos.forEach(video => {
                // Garantir que vídeos nunca sejam cortados
                video.style.objectFit = 'contain';
                video.style.maxHeight = '100vh';
                
                // Forçar redimensionamento inicial
                this.adjustVideoSize(video);
            });
        }
        
        adjustVideoSize(video) {
            const container = video.parentElement;
            if (!container) return;
            
            const updateSize = () => {
                const containerWidth = container.clientWidth;
                const containerHeight = container.clientHeight;
                
                // Se o container tem dimensões específicas, ajustar proporcionalmente
                if (containerWidth > 0 && containerHeight > 0) {
                    const containerRatio = containerWidth / containerHeight;
                    
                    // Usar o aspect ratio natural do vídeo se disponível
                    const videoRatio = video.videoWidth > 0 ? 
                        video.videoWidth / video.videoHeight : 
                        16/9; // Fallback
                    
                    if (containerRatio > videoRatio) {
                        video.style.width = '100%';
                        video.style.height = 'auto';
                    } else {
                        video.style.width = 'auto';
                        video.style.height = '100%';
                    }
                }
            };
            
            // Atualizar quando o vídeo estiver carregado
            if (video.readyState >= 1) {
                updateSize();
            } else {
                video.addEventListener('loadedmetadata', updateSize);
            }
            
            // Atualizar quando a janela for redimensionada
            window.addEventListener('resize', updateSize);
        }
        
        setupVideoPlayback() {
            this.videos.forEach(video => {
                // Configurar para mobile
                video.setAttribute('playsinline', '');
                video.setAttribute('muted', '');
                video.setAttribute('loop', '');
                
                // Tentar reproduzir automaticamente
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Auto-play bloqueado:', error);
                        // Fallback: reproduzir quando o usuário interagir
                        const playOnInteraction = () => {
                            video.play();
                            document.removeEventListener('click', playOnInteraction);
                            document.removeEventListener('touchstart', playOnInteraction);
                        };
                        
                        document.addEventListener('click', playOnInteraction);
                        document.addEventListener('touchstart', playOnInteraction);
                    });
                }
            });
        }
        
        setupResponsiveBehavior() {
            // Ajustar vídeos em redimensionamentos
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.videos.forEach(video => {
                        this.adjustVideoSize(video);
                    });
                }, 250);
            });
        }
    }
    
    // 6. SISTEMA DE INTERATIVIDADE AVANÇADA
    class InteractivitySystem {
        constructor() {
            this.cards = document.querySelectorAll('.service-card, .differentiator-card, .simulator-card');
            this.links = document.querySelectorAll('.service-link');
            this.init();
        }
        
        init() {
            this.setupCardInteractions();
            this.setupLinkAnimations();
            this.setupKeyboardNavigation();
            this.setupTouchFeedback();
        }
        
        setupCardInteractions() {
            this.cards.forEach(card => {
                // Efeito hover para desktop
                if (!config.isMobile) {
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-8px) scale(1.02)';
                        card.style.boxShadow = '0 15px 30px rgba(214, 174, 100, 0.3)';
                        card.style.zIndex = '5';
                        
                        // Acelerar animação da borda
                        card.style.setProperty('--animation-speed', '1s');
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0) scale(1)';
                        card.style.boxShadow = 'none';
                        card.style.zIndex = '';
                        card.style.setProperty('--animation-speed', '3s');
                    });
                }
                
                // Efeito de clique
                card.addEventListener('click', (e) => {
                    // Não interferir com links dentro do card
                    if (e.target.tagName === 'A' || e.target.closest('a')) {
                        return;
                    }
                    
                    // Feedback visual de clique
                    if (config.isMobile) {
                        // Feedback tátil para mobile
                        card.style.transform = 'scale(0.95)';
                        card.style.transition = 'transform 0.1s ease';
                        
                        setTimeout(() => {
                            card.style.transform = '';
                            card.style.transition = '';
                        }, 100);
                    } else {
                        // Efeito de onda para desktop
                        this.createRippleEffect(e, card);
                    }
                });
            });
        }
        
        createRippleEffect(event, element) {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(214, 174, 100, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                top: ${y}px;
                left: ${x}px;
                pointer-events: none;
                z-index: 0;
            `;
            
            element.style.position = 'relative';
            element.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }
        
        setupLinkAnimations() {
            this.links.forEach(link => {
                const arrow = link.querySelector('i, svg, .fa-arrow-right');
                if (arrow) {
                    link.addEventListener('mouseenter', () => {
                        arrow.style.transform = 'translateX(5px)';
                        arrow.style.transition = 'transform 0.3s ease';
                    });
                    
                    link.addEventListener('mouseleave', () => {
                        arrow.style.transform = 'translateX(0)';
                    });
                }
                
                // Efeito de clique para links
                link.addEventListener('click', (e) => {
                    if (config.isMobile) {
                        e.preventDefault();
                        const href = link.getAttribute('href');
                        
                        // Feedback visual
                        link.style.opacity = '0.7';
                        setTimeout(() => {
                            link.style.opacity = '';
                            if (href) {
                                window.location.href = href;
                            }
                        }, 200);
                    }
                });
            });
        }
        
        setupKeyboardNavigation() {
            // Melhorar acessibilidade para navegação por teclado
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.documentElement.classList.add('keyboard-navigation');
                    
                    // Adicionar foco visível para elementos focáveis
                    const focusableElements = document.querySelectorAll('a, button, [tabindex]');
                    focusableElements.forEach(el => {
                        el.addEventListener('focus', () => {
                            el.style.outline = '2px solid rgb(214, 174, 100)';
                            el.style.outlineOffset = '2px';
                        });
                        
                        el.addEventListener('blur', () => {
                            el.style.outline = '';
                        });
                    });
                }
            });
            
            document.addEventListener('mousedown', () => {
                document.documentElement.classList.remove('keyboard-navigation');
            });
        }
        
        setupTouchFeedback() {
            if (config.isMobile) {
                // Adicionar feedback visual para toques
                document.addEventListener('touchstart', (e) => {
                    const target = e.target;
                    if (target.classList.contains('btn') || 
                        target.closest('.btn') || 
                        target.classList.contains('service-card') ||
                        target.closest('.service-card')) {
                        target.style.opacity = '0.8';
                    }
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    const target = e.target;
                    if (target.classList.contains('btn') || 
                        target.closest('.btn') || 
                        target.classList.contains('service-card') ||
                        target.closest('.service-card')) {
                        target.style.opacity = '';
                    }
                }, { passive: true });
            }
        }
    }
    
    // 7. INICIALIZAÇÃO PRINCIPAL
    function initializeMainContent() {
        console.log('🚀 Inicializando conteúdo principal com estilo alternativo...');
        
        try {
            // Inicializar todos os sistemas
            const systems = [
                new AnimatedStats(),
                new SimulatorsCarousel(),
                new AnimatedBorders(),
                new LayoutOptimizer(),
                new VideoController(),
                new InteractivitySystem()
            ];
            
            // Adicionar classe para estilização CSS
            document.documentElement.classList.add('alternative-styling');
            
            // Adicionar animação de ripple ao CSS
            if (!document.querySelector('#ripple-animation')) {
                const style = document.createElement('style');
                style.id = 'ripple-animation';
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            console.log('✅ Conteúdo principal inicializado com sucesso!');
            console.log(`📱 Dispositivo: ${config.isMobile ? 'Mobile' : 'Desktop'} ${config.isExtraSmall ? '(Extra Pequeno)' : ''}`);
            
            return systems;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar conteúdo principal:', error);
            return null;
        }
    }
    
    // 8. INICIALIZAR QUANDO O DOM ESTIVER PRONTO
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMainContent);
    } else {
        // DOM já carregado, inicializar imediatamente
        setTimeout(initializeMainContent, 100);
    }
    
    // 9. EXPORTAR PARA USO GLOBAL (opcional)
    window.TecaAlternativeContent = {
        AnimatedStats,
        SimulatorsCarousel,
        AnimatedBorders,
        LayoutOptimizer,
        VideoController,
        InteractivitySystem,
        initializeMainContent,
        config
    };
    
})();