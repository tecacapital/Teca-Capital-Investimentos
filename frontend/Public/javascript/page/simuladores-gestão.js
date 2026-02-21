class SimuladorGestaoPage {
    constructor() {
        this.init();
    }

    init() {
        this.formatPrices();
        this.initTestimonialsCarousel();
        this.initSmoothScroll();
        this.initHoverEffects();
        this.initTouchOptimization();
        this.animateCounters();
        console.log('✅ Simulador de Gestão inicializado com ícones dourados');
    }

    /**
     * REGRA #8: Formatação de moeda para Kz
     */
    formatKwanza(value) {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value).replace('AOA', '').trim() + ' Kz';
    }

    formatPrices() {
        // Formata o preço no CTA
        const priceElement = document.getElementById('priceAmount');
        if (priceElement) {
            priceElement.textContent = '7.500 Kz';
        }

        // Formata qualquer outro preço que apareça
        document.querySelectorAll('.price-value').forEach(el => {
            const value = parseInt(el.dataset.value || '7500');
            el.textContent = this.formatKwanza(value);
        });
    }

    /**
     * Carrossel manual para os feedbacks
     */
    initTestimonialsCarousel() {
        const container = document.getElementById('testimonialsContainer');
        const dots = document.querySelectorAll('.dot');
        const cards = document.querySelectorAll('.testimonial-card');

        if (!container || !dots.length) return;

        // Função para rolar até o slide
        const goToSlide = (index) => {
            const card = cards[index];
            if (card) {
                card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'start'
                });
            }

            // Atualiza dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        // Adiciona evento aos dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                goToSlide(index);
            });

            // Touch target size
            dot.style.minWidth = '44px';
            dot.style.minHeight = '44px';
        });

        // Detecta qual slide está visível no scroll
        const observerOptions = {
            root: container,
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.dataset.index || '0');
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === index);
                    });
                }
            });
        }, observerOptions);

        cards.forEach(card => observer.observe(card));
    }

    /**
     * Scroll suave para âncoras
     */
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Efeitos hover avançados nos cards
     */
    initHoverEffects() {
        // Efeito de brilho nos cards com borda animada
        const cards = document.querySelectorAll('.animated-border');
        
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                if (window.innerWidth <= 768) return;

                // Efeito de brilho seguindo o mouse
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                
                // Acelera a animação no hover
                card.style.animation = 'borderRotate 3s ease infinite';
            });

            card.addEventListener('mouseleave', () => {
                card.style.animation = 'borderRotate 6s ease infinite';
            });
        });

        // Efeito de rotação suave nos ícones ao hover
        document.querySelectorAll('.icon-wrapper, .icon-wrapper-large').forEach(wrapper => {
            wrapper.addEventListener('mouseenter', () => {
                const icon = wrapper.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                }
            });

            wrapper.addEventListener('mouseleave', () => {
                const icon = wrapper.querySelector('i');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0)';
                }
            });
        });
    }

    /**
     * Otimização para touch devices
     */
    initTouchOptimization() {
        if ('ontouchstart' in window) {
            // Ajusta para dispositivos touch
            document.querySelectorAll('.btn-primary, .dot, a').forEach(el => {
                el.style.cursor = 'pointer';
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                }, { passive: true });
            });
        }
    }

    /**
     * Anima contadores visuais (opcional)
     */
    animateCounters() {
        // Destaca os 90 dias com uma pequena animação
        const daysElements = document.querySelectorAll('.hero-price-info .gold-text, .price-period');
        
        daysElements.forEach(el => {
            if (el.textContent.includes('90 dias')) {
                setInterval(() => {
                    el.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        el.style.transform = 'scale(1)';
                    }, 200);
                }, 5000);
            }
        });
    }

    /**
     * Tooltips para informações complementares (opcional)
     */
    initTooltips() {
        // Pode ser expandido conforme necessidade
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltipText = el.dataset.tooltip;
                if (!tooltipText) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = tooltipText;
                tooltip.style.cssText = `
                    position: absolute;
                    background: var(--primary-gold);
                    color: var(--primary-black);
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 0.85rem;
                    z-index: 1000;
                    pointer-events: none;
                `;

                document.body.appendChild(tooltip);
                
                const rect = el.getBoundingClientRect();
                tooltip.style.top = `${rect.top - 30}px`;
                tooltip.style.left = `${rect.left}px`;

                el.addEventListener('mouseleave', () => {
                    tooltip.remove();
                }, { once: true });
            });
        });
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new SimuladorGestaoPage();
});
