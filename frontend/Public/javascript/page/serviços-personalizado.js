/**
 * SERVIÇOS PERSONALIZADOS - TECA CAPITAL
 * JavaScript para Landing Page
 * Funcionalidades: FAQ Accordion, Scroll Suave, Animações, Formatação de Moeda
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // ============================================
    // 1. FAQ ACCORDION
    // ============================================
    function initFaqAccordion() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        if (!faqQuestions.length) return;

        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                // Fecha todos os outros itens (opcional - comentar se quiser múltiplos abertos)
                faqQuestions.forEach(q => {
                    if (q !== this && q.classList.contains('active')) {
                        q.classList.remove('active');
                        const answer = q.nextElementSibling;
                        if (answer) {
                            answer.classList.remove('show');
                        }
                    }
                });

                // Toggle do item atual
                this.classList.toggle('active');
                const answer = this.nextElementSibling;
                
                if (answer) {
                    answer.classList.toggle('show');
                    
                    // Ajusta a altura máxima para animação suave
                    if (answer.classList.contains('show')) {
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                    } else {
                        answer.style.maxHeight = '0';
                    }
                }
            });
        });
    }

    // ============================================
    // 2. SCROLL SUAVE PARA ÂNCORAS
    // ============================================
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Ignora links vazios ou apenas '#'
                if (href === '#' || href === '') return;
                
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    e.preventDefault();
                    
                    // Offset de 80px para compensar header fixo (se houver)
                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Atualiza URL sem causar scroll
                    history.pushState(null, null, href);
                }
            });
        });
    }

    // ============================================
    // 3. ANIMAÇÕES DE ENTRADA (INTERSECTION OBSERVER)
    // ============================================
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.fade-in');
        
        if (!animatedElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Opcional: para de observar após animar
                    // observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // ============================================
    // 4. FORMATAÇÃO DE MOEDA (KWANZA - AOA)
    // ============================================
    function formatCurrency() {
        // Elementos que contêm valores em Kwanza
        const currencyElements = document.querySelectorAll('.investment-amount, .cta-note strong, [data-currency]');
        
        currencyElements.forEach(element => {
            // Pega o texto original
            let text = element.textContent || element.innerText;
            
            // Se o texto já contém 'milhões', mantém como está (já está formatado no HTML)
            // Esta função serve para garantir que números sejam formatados corretamente
            // se forem inseridos dinamicamente
            if (text.includes('milhões')) return;
            
            // Extrai números do texto (ex: "4 a 5 milhões" já está formatado)
            // Para uso futuro se necessário
        });
    }

    // ============================================
    // 5. EFEITO DE HOVER NOS CARDS
    // ============================================
    function initCardEffects() {
        const cards = document.querySelectorAll('.card-animated');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
                this.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }

    // ============================================
    // 6. VALIDAÇÃO DE TOUCH PARA MOBILE
    // ============================================
    function initTouchOptimization() {
        // Detecta se é dispositivo touch
        const isTouchDevice = ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0) || 
                             (navigator.msMaxTouchPoints > 0);
        
        if (isTouchDevice) {
            // Adiciona classe para estilos específicos de touch
            document.body.classList.add('touch-device');
            
            // Remove efeitos de hover que podem causar problemas em mobile
            const cards = document.querySelectorAll('.card-animated');
            cards.forEach(card => {
                card.addEventListener('touchstart', function() {
                    // Apenas para garantir feedback tátil
                    this.style.transform = 'scale(1.02)';
                });
                
                card.addEventListener('touchend', function() {
                    this.style.transform = 'scale(1)';
                });
            });
        }
    }

    // ============================================
    // 7. RESPONSIVIDADE DINÂMICA
    // ============================================
    function initResponsiveAdjustments() {
        function adjustForScreenSize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // Ajustes específicos para as dimensões solicitadas
            if (width <= 393) {
                document.body.classList.add('screen-393');
            } else if (width <= 430) {
                document.body.classList.add('screen-430');
            } else if (width <= 480) {
                document.body.classList.add('screen-480');
            } else {
                document.body.classList.remove('screen-393', 'screen-430', 'screen-480');
            }
            
            // Ajusta altura máxima dos FAQs se estiverem abertos
            const openFaqs = document.querySelectorAll('.faq-answer.show');
            openFaqs.forEach(faq => {
                faq.style.maxHeight = faq.scrollHeight + 'px';
            });
        }
        
        // Executa ao carregar e ao redimensionar
        window.addEventListener('load', adjustForScreenSize);
        window.addEventListener('resize', adjustForScreenSize);
    }

    // ============================================
    // 8. INICIALIZAÇÃO DE PARTÍCULAS (OPCIONAL)
    // ============================================
    function initParticles() {
        const particlesContainer = document.querySelector('.hero-particles');
        
        if (!particlesContainer) return;
        
        // Cria partículas dinâmicas simples
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'absolute';
            particle.style.width = Math.random() * 4 + 1 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = `rgba(214, 174, 100, ${Math.random() * 0.3})`;
            particle.style.borderRadius = '50%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animation = `floatParticle ${Math.random() * 10 + 10}s linear infinite`;
            particle.style.opacity = Math.random() * 0.5;
            
            particlesContainer.appendChild(particle);
        }
        
        // Adiciona keyframes para animação das partículas se não existirem
        if (!document.querySelector('#particle-keyframes')) {
            const style = document.createElement('style');
            style.id = 'particle-keyframes';
            style.textContent = `
                @keyframes floatParticle {
                    0% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(0) translateX(20px); }
                    75% { transform: translateY(20px) translateX(10px); }
                    100% { transform: translateY(0) translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============================================
    // INICIALIZAR TODAS AS FUNÇÕES
    // ============================================
    function init() {
        initFaqAccordion();
        initSmoothScroll();
        initScrollAnimations();
        formatCurrency();
        initCardEffects();
        initTouchOptimization();
        initResponsiveAdjustments();
        initParticles();
        
        console.log('Landing Page de Serviços Personalizados inicializada com sucesso!');
    }

    // Executa após carregamento completo da página
    init();

    // Reajusta alturas do FAQ após carregamento de imagens
    window.addEventListener('load', function() {
        const openFaqs = document.querySelectorAll('.faq-answer.show');
        openFaqs.forEach(faq => {
            faq.style.maxHeight = faq.scrollHeight + 'px';
        });
    });
});

/**
 * NOTAS DE DESENVOLVIMENTO:
 * 
 * 1. FAQ Accordion: Permite apenas um item aberto por vez (comportamento padrão).
 *    Para permitir múltiplos abertos, comente as linhas 29-36.
 * 
 * 2. Scroll Suave: Offset de 80px para compensar header fixo.
 *    Ajuste conforme necessidade.
 * 
 * 3. Animações: Usa Intersection Observer com threshold 0.1.
 *    Elementos com classe 'fade-in' são animados ao entrar na viewport.
 * 
 * 4. Formatação de Moeda: Atualmente mantém o HTML estático.
 *    Para uso dinâmico, implemente lógica de formatação adicional.
 * 
 * 5. Responsividade: Detecta dimensões específicas e aplica classes.
 * 
 * 6. Touch: Otimiza para dispositivos móveis.
 */