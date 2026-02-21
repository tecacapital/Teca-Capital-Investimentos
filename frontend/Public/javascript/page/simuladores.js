/**
 * TECA CAPITAL – LANDING PAGE SIMULADORES
 * JAVASCRIPT: FAQ ACCORDION, CONTADORES ANIMADOS (INTERSECTION OBSERVER)
 * SCROLL SUAVE, FORMATAÇÃO MOEDA AOA, DETECÇÃO DE RESOLUÇÃO
 * SEM HEADER/FOOTER – APENAS FUNCIONALIDADES DA PÁGINA
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // -------------------------------------------------------------
    // 1. FAQ ACCORDION – 8+ perguntas (dados inline via JS)
    // -------------------------------------------------------------
    const faqData = [
        { question: "Preciso ter conhecimento prévio para usar os simuladores?", answer: "Não. Os simuladores Teca Capital foram desenvolvidos com níveis progressivos de complexidade. Iniciantes encontram tutoriais e cenários guiados, enquanto usuários avançados podem personalizar parâmetros e explorar simulações mais complexas.", category: "geral" },
        { question: "Os simuladores são gratuitos?", answer: "Sim! Atualmente todos os simuladores estão disponíveis gratuitamente como parte da missão educacional da Teca Capital. Nosso objetivo é democratizar o acesso à educação prática em finanças, gestão e economia.", category: "geral" },
        { question: "Os dados utilizados são baseados na economia angolana?", answer: "Sim! Nossos simuladores utilizam dados reais da BODIVA, BNA (Banco Nacional de Angola), INE e ministérios. Combinamos esses dados com cenários globais para criar uma experiência completa que prepara o usuário tanto para o mercado local quanto internacional.", category: "financas" },
        { question: "Como os simuladores podem me ajudar no mercado de trabalho?", answer: "Os simuladores desenvolvem habilidades práticas altamente valorizadas: análise de dados, tomada de decisão, gestão de risco e visão estratégica. Alunos e profissionais que utilizam nossos simuladores relatam maior confiança em entrevistas e melhor performance em estágios e posições iniciais.", category: "carreira" },
        { question: "Os cenários incluem a BODIVA e outros ativos angolanos?", answer: "Sim. O Simulador do Mercado Financeiro inclui dados históricos e em tempo real da BODIVA, títulos da dívida pública angolana, ações de empresas listadas e fundos de investimento disponíveis no mercado angolano.", category: "financas" },
        { question: "É possível simular políticas econômicas para Angola?", answer: "Sim. O Simulador Econômico permite definir taxa de juros (BNA), gastos públicos, tributação e investimentos em setores estratégicos como petróleo, diamantes, agricultura e telecomunicações. Os resultados são projetados com base em modelos econômicos validados.", category: "economia" },
        { question: "Há certificado ao concluir as simulações?", answer: "Em breve! Estamos desenvolvendo um sistema de certificação por competências. Atualmente, você pode exportar seus relatórios de simulação e resultados como portfólio para apresentar a recrutadores e instituições de ensino.", category: "geral" },
        { question: "Posso acessar os simuladores pelo celular?", answer: "Sim! Todos os simuladores são totalmente responsivos e otimizados para dispositivos móveis, incluindo smartphones e tablets. Você pode simular de qualquer lugar, a qualquer momento.", category: "tecnico" },
        { question: "Os simuladores funcionam offline?", answer: "Não, atualmente os simuladores requerem conexão com a internet para carregar dados atualizados de mercado (BODIVA, câmbio, etc.) e garantir a experiência completa. Estamos a trabalhar numa versão com dados em cache.", category: "tecnico" }
    ];

    const faqContainer = document.querySelector('.faq-container');
    
    function renderFaq() {
        if (!faqContainer) return;
        faqContainer.innerHTML = '';
        
        faqData.forEach((item, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.setAttribute('data-category', item.category);
            
            const questionDiv = document.createElement('div');
            questionDiv.className = 'faq-question';
            questionDiv.innerHTML = `
                <span>${item.question}</span>
                <i class="fas fa-chevron-down"></i>
            `;
            
            const answerDiv = document.createElement('div');
            answerDiv.className = 'faq-answer';
            answerDiv.innerHTML = `<p>${item.answer}</p>`;
            
            faqItem.appendChild(questionDiv);
            faqItem.appendChild(answerDiv);
            faqContainer.appendChild(faqItem);
        });
    }
    
    renderFaq();

    // Accordion toggle (apenas um aberto por vez)
    const faqItems = document.querySelectorAll('.faq-item');
    
    function closeAllFaq(except = null) {
        faqItems.forEach(item => {
            if (item !== except) {
                item.classList.remove('active');
            }
        });
    }

    function initAccordion() {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', function(e) {
                e.preventDefault();
                // se já estiver ativo, apenas fecha
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                } else {
                    closeAllFaq(item);
                    item.classList.add('active');
                }
            });
        });
    }
    
    initAccordion();

    // -------------------------------------------------------------
    // 2. CONTADORES ANIMADOS (INTERSECTION OBSERVER)
    // -------------------------------------------------------------
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Formatar números com pontos de milhar (ex: 2.500)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    function animateNumber(element, target) {
        let current = 0;
        const increment = target > 100 ? Math.ceil(target / 60) : 1; // 60fps * 2s = 120 quadros
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = formatNumber(target);
                clearInterval(timer);
            } else {
                element.textContent = formatNumber(current);
            }
        }, 16); // ~60fps
    }

    // Intersection Observer para stats
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statEl = entry.target;
                const target = parseInt(statEl.getAttribute('data-target'), 10);
                if (target && statEl.textContent.trim() === '0') {
                    animateNumber(statEl, target);
                }
                observer.unobserve(statEl);
            }
        });
    }, observerOptions);

    statNumbers.forEach(stat => {
        statsObserver.observe(stat);
    });

    // -------------------------------------------------------------
    // 3. SCROLL SUAVE PARA ÂNCORAS (sem header fixo, apenas offset)
    // -------------------------------------------------------------
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                // offset de 30px para compensar visual
                const offset = 30;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: elementPosition - offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // -------------------------------------------------------------
    // 4. FORMATAÇÃO DE MOEDA EM KWANZA (AOA) – elementos com classe .currency-aoa
    // -------------------------------------------------------------
    function formatCurrencyAOA(element) {
        let text = element.textContent;
        // Extrai número: ex "500.000 Kz" ou "10.000.000 Kz"
        const match = text.match(/([\d\.]+)\s*Kz/);
        if (match) {
            const numStr = match[1].replace(/\./g, ''); // remove pontos
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
                const formatted = num.toLocaleString('pt-AO').replace(/,/g, '.') + ' Kz';
                element.textContent = formatted;
            }
        }
    }

    document.querySelectorAll('.currency-aoa').forEach(el => {
        formatCurrencyAOA(el);
    });

    // -------------------------------------------------------------
    // 5. DETECÇÃO DE DISPOSITIVO / RESOLUÇÃO (ajustes finos se necessário)
    // -------------------------------------------------------------
    function detectDeviceAndApplyFixes() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Log para debug (pode ser removido em produção)
        console.log(`📱 Resolução: ${width}x${height}`);
        
        // Ajustes específicos para resoluções críticas (ex: iPhone SE)
        if (width === 375 && height === 667) {
            document.body.classList.add('device-iphone-se');
        }
        if (width === 393 && height === 852) {
            document.body.classList.add('device-iphone-12-pro');
        }
        if (width === 430 && height === 932) {
            document.body.classList.add('device-iphone-15-pro');
        }
        if (width === 480 && height === 1040) {
            document.body.classList.add('device-pixel5');
        }
        
        // Exemplo de ajuste: diminuir fonte do título em devices muito pequenos
        if (width <= 360) {
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                heroTitle.style.fontSize = '1.9rem';
            }
        }
    }

    detectDeviceAndApplyFixes();
    
    // Reaplica em resize (opcional, mas útil)
    window.addEventListener('resize', function() {
        // não reaplica classes para não poluir, mas pode ajustar algo pontual
    });

    // -------------------------------------------------------------
    // 6. EFEITOS DE HOVER NOS CARDS (rastreamento de clique nos CTAs)
    // -------------------------------------------------------------
    const ctaButtons = document.querySelectorAll('.card-btn, .hero-cta a, .cta-buttons a');
    
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const link = this.href || this.getAttribute('href');
            console.log(`🔗 CTA clicado: ${link} — simulador/rótulo: ${this.innerText.trim()}`);
            // Não previne padrão — o link real será seguido
        });
        
        // Feedback hover adicional além do CSS (pequeno brilho)
        btn.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 15px rgba(214,174,100,0.3)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });

    // -------------------------------------------------------------
    // 7. GARANTIR QUE CONTADORES RESETAM SE SAIR E VOLTAR (re-observe)
    // -------------------------------------------------------------
    // já implementado no IntersectionObserver

    // -------------------------------------------------------------
    // 8. PEQUENA ANIMAÇÃO PARA BOTÕES E LINKS
    // -------------------------------------------------------------
    console.log('✅ Teca Capital • Landing page simuladores carregada com sucesso (Angola 🇦🇴)');
});