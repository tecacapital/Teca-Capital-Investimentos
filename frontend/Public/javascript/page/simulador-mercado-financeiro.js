/**
 * TECA CAPITAL – LANDING PAGE SIMULADOR MERCADO FINANCEIRO
 * FUNCIONALIDADES: FAQ ACCORDION, FORMATAÇÃO KZ, SCROLL SUAVE, DETECÇÃO DEVICE
 * SEM HEADER/FOOTER – APENAS CONTEÚDO DA TAG <main>
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // -------------------------------------------------------------
    // 1. FAQ ACCORDION – 10 perguntas (dados inline via JS)
    // -------------------------------------------------------------
    const faqData = [
        {
            question: "O simulador é gratuito?",
            answer: "Não. O acesso ao simulador e à biblioteca de conteúdo é pago. Oferecemos planos acessíveis para pessoas singulares (5.000 Kz/3 meses) e formações presenciais para empresas."
        },
        {
            question: "Como recebo o acesso após o pagamento?",
            answer: "Após a confirmação do pagamento, enviamos a senha de acesso por e-mail e WhatsApp em até 1 hora útil. Verifique sua caixa de spam."
        },
        {
            question: "Posso compartilhar minha senha com outras pessoas?",
            answer: "Não. O acesso é individual e intransferível. Compartilhamento de senha resulta em bloqueio permanente sem reembolso."
        },
        {
            question: "Empresas podem adquirir o plano individual para vários funcionários?",
            answer: "Não. Para empresas, oferecemos exclusivamente formações presenciais. Consulte nossos pacotes corporativos na seção de planos."
        },
        {
            question: "Os dados da BODIVA são atualizados em tempo real?",
            answer: "Nosso simulador utiliza dados históricos e cenários realistas baseados no mercado angolano. Para cotações em tempo real, recomendamos consultar diretamente o site da BODIVA."
        },
        {
            question: "Preciso ter conhecimento prévio para usar o simulador?",
            answer: "Não. O simulador possui níveis iniciante, intermediário e avançado. Você começa com cenários guiados e progride no seu ritmo."
        },
        {
            question: "O simulador funciona no celular?",
            answer: "Sim. A plataforma é totalmente responsiva e otimizada para dispositivos móveis, incluindo smartphones e tablets."
        },
        {
            question: "Posso usar o simulador para tomar decisões de investimento reais?",
            answer: "Não. O simulador é uma ferramenta educacional. Decisões de investimento reais devem ser baseadas em análise própria, consulta a profissionais e instituições oficiais."
        },
        {
            question: "Há desconto para estudantes?",
            answer: "Consulte nossa página de promoções ou entre em contato pelo WhatsApp. Oferecemos condições especiais para instituições de ensino parceiras."
        },
        {
            question: "Qual a diferença entre os dois simuladores?",
            answer: "O simulador 'Como Investidor' foca na compra e venda de ativos, gestão de carteira e estratégias pessoais. O simulador 'Minha Empresa na Bolsa' simula o processo de abertura de capital, valuation e relações com investidores."
        }
    ];

    const faqContainer = document.querySelector('.faq-container');
    
    if (faqContainer) {
        function renderFaq() {
            faqContainer.innerHTML = '';
            
            faqData.forEach((item) => {
                const faqItem = document.createElement('div');
                faqItem.className = 'faq-item';
                
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
    }

    // -------------------------------------------------------------
    // 2. FORMATAÇÃO DE MOEDA EM KWANZA (AOA)
    // -------------------------------------------------------------
    function formatKwanza(valor) {
        return new Intl.NumberFormat('pt-AO', {
            style: 'currency',
            currency: 'AOA',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor).replace('AOA', 'Kz').trim();
    }

    // Formatar todos os elementos com classe .currency-aoa
    document.querySelectorAll('.currency-aoa').forEach(el => {
        const text = el.textContent;
        const match = text.match(/([\d\.]+)\s*Kz/);
        if (match) {
            const numStr = match[1].replace(/\./g, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
                el.textContent = formatKwanza(num);
            }
        }
    });

    // Formatar preços dinamicamente (valores fixos nos cards)
    const priceValues = document.querySelectorAll('.price-value');
    priceValues.forEach(el => {
        const rawValue = el.textContent.replace(/\D/g, '');
        if (rawValue) {
            const num = parseInt(rawValue, 10);
            el.textContent = formatKwanza(num).replace('Kz', '').trim();
        }
    });

    // -------------------------------------------------------------
    // 3. SCROLL SUAVE PARA ÂNCORAS
    // -------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
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
    // 4. DETECÇÃO DE DISPOSITIVO (RESOLUÇÕES PRIORITÁRIAS)
    // -------------------------------------------------------------
    function detectDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const deviceInfo = {
            width,
            height,
            isIphone12Pro: (width === 393 && height === 852) || (width <= 393 && height >= 852),
            isIphone15Pro: (width === 430 && height === 932) || (width <= 430 && height >= 932),
            isPixel5: (width === 480 && height === 1040) || (width <= 480 && height >= 1040)
        };
        
        // Adicionar classes para ajustes finos
        if (deviceInfo.isIphone12Pro) {
            document.body.classList.add('device-iphone-12-pro');
        }
        if (deviceInfo.isIphone15Pro) {
            document.body.classList.add('device-iphone-15-pro');
        }
        if (deviceInfo.isPixel5) {
            document.body.classList.add('device-pixel-5');
        }
        
        console.log(`📱 Dispositivo detectado: ${width}x${height}`);
        return deviceInfo;
    }

    detectDevice();
    
    // Re-detectar em resize (com debounce)
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            detectDevice();
        }, 250);
    });

    // -------------------------------------------------------------
    // 5. DESTAQUE NOS CARDS DE PREÇO (HOVER)
    // -------------------------------------------------------------
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // -------------------------------------------------------------
    // 6. ANIMAÇÃO DO CTA (PULSO SUTIL)
    // -------------------------------------------------------------
    const ctaButtons = document.querySelectorAll('.cta-buttons-grid .btn');
    ctaButtons.forEach((btn, index) => {
        btn.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 20px rgba(214,174,100,0.3)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
        });
    });

    // -------------------------------------------------------------
    // 7. VALIDAÇÃO DE LINKS EXTERNOS (console)
    // -------------------------------------------------------------
    const externalLinks = [
        'https://www.bodiva.ao/',
        'https://coinmarketcap.com/',
        'https://br.investing.com/',
        'https://www.bna.ao/',
        'https://www.ceicdata.com/pt/country/angola'
    ];
    
    externalLinks.forEach(link => {
        console.log(`🔗 Link externo configurado: ${link}`);
    });

    console.log('✅ Landing Page Simulador Mercado Financeiro carregada com sucesso • Teca Capital 🇦🇴');
});