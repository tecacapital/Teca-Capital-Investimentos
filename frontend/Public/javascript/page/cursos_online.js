// script.js
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // 1. Formatação de preço (REGRA #8)
    function formatKwanza(amount) {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Kz';
    }

    function formatAllPrices() {
        document.querySelectorAll('.format-price').forEach(el => {
            const price = el.getAttribute('data-price');
            if (price && !el.hasAttribute('data-formatted')) {
                const formatted = formatKwanza(parseInt(price));
                if (el.tagName === 'SPAN' || el.tagName === 'TD') {
                    el.textContent = formatted;
                }
                el.setAttribute('data-formatted', 'true');
            }
        });
    }
    formatAllPrices();

    // 2. FAQ Accordion (obrigatório)
    function setupAccordion() {
        const questions = document.querySelectorAll('.faq-question');
        
        questions.forEach(question => {
            question.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Alterna estado atual
                const expanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !expanded);
                
                // Encontra e anima a resposta
                const answer = this.nextElementSibling;
                if (answer && answer.classList.contains('faq-answer')) {
                    if (!expanded) {
                        // Abrir
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                        
                        // Fechar outros (opcional - descomente se quiser apenas um aberto)
                        questions.forEach(q => {
                            if (q !== this && q.getAttribute('aria-expanded') === 'true') {
                                q.setAttribute('aria-expanded', 'false');
                                const otherAnswer = q.nextElementSibling;
                                if (otherAnswer) {
                                    otherAnswer.style.maxHeight = null;
                                }
                            }
                        });
                    } else {
                        // Fechar
                        answer.style.maxHeight = null;
                    }
                }
            });
        });
        
        // Fecha todos ao carregar (garante estado inicial)
        questions.forEach(q => {
            q.setAttribute('aria-expanded', 'false');
            const ans = q.nextElementSibling;
            if (ans) ans.style.maxHeight = null;
        });
    }
    setupAccordion();

    // 3. Efeitos hover avançados (já via CSS, mas podemos adicionar classes JS)
    const cards = document.querySelectorAll('.category-card, .benefit-card, .testimonial-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.2s ease, border-color 0.2s ease';
        });
    });

    // 4. Scroll suave para âncoras (caso existam)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 5. Destaque visual ao passar mouse sobre categorias (já no CSS)
    // 6. Tooltips opcionais (simplificado)
    const benefitIcons = document.querySelectorAll('.benefit-icon');
    benefitIcons.forEach(icon => {
        icon.setAttribute('title', icon.nextElementSibling?.textContent || 'Benefício');
    });

    // 7. Contador visual para benefícios (opcional - exemplo com números)
    const benefitCards = document.querySelectorAll('.benefit-card');
    benefitCards.forEach((card, index) => {
        card.style.setProperty('--card-index', index + 1);
    });

    // 8. Reformatar preços em mudanças de DOM (ex: após carregamento dinâmico)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                formatAllPrices();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 9. Garantir que todos os ícones estão dourados (fallback)
    const allIcons = document.querySelectorAll('i[class^="fa-"], i[class*=" fa-"]');
    allIcons.forEach(icon => {
        if (!icon.style.color) {
            icon.style.color = 'rgb(214, 174, 100)';
        }
    });

    // 10. Acessibilidade: adicionar aria-hidden em ícones decorativos
    document.querySelectorAll('i:not([aria-hidden])').forEach(icon => {
        if (!icon.classList.contains('fa-star') && !icon.parentElement?.classList.contains('stars')) {
            icon.setAttribute('aria-hidden', 'true');
        }
    });

    // 11. Tratamento de links externos (target blank)
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
    });

    // 12. Efeito de loading para preços (opcional)
    console.log('Landing Page Cursos Online Teca Capital carregada com sucesso.');
});