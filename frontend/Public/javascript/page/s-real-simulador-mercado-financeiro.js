// ============================================
// MÓDULO: Correção de Scroll para Mobile
// Garante que o usuário possa rolar livremente
// ============================================
(function() {
    'use strict';

    // Aplica apenas em mobile
    if (window.innerWidth > 768) return;

    console.log('📱 Módulo de correção de scroll ativado.');

    // --- 1. Salva e Restaura a Posição de Scroll de Forma Não Intrusiva ---
    let userScrollPosition = 0;
    let isManuallyScrolling = false;

    // Detecta quando o usuário está rolando manualmente
    window.addEventListener('touchstart', () => {
        isManuallyScrolling = true;
    }, { passive: true });

    window.addEventListener('touchend', () => {
        // Pequeno delay para evitar conflitos com re-renders
        setTimeout(() => {
            isManuallyScrolling = false;
        }, 300);
    });

    window.addEventListener('scroll', () => {
        if (isManuallyScrolling) {
            userScrollPosition = window.scrollY;
        }
    }, { passive: true });

    // --- 2. Hook na função principal de atualização de mercado (updateMarketPrices) ---
    // Primeiro, encontramos a função original. Como ela pode estar em diferentes escopos,
    // vamos procurar no objeto window.
    const originalUpdateMarketPrices = window.updateMarketPrices;

    if (originalUpdateMarketPrices && typeof originalUpdateMarketPrices === 'function') {
        window.updateMarketPrices = function() {
            // Se o usuário está rolando, guardamos a posição ANTES da atualização
            if (isManuallyScrolling) {
                userScrollPosition = window.scrollY;
            }

            // Executa a função original (atualiza preços, UI, etc.)
            const result = originalUpdateMarketPrices.apply(this, arguments);

            // Restaura a posição do usuário APÓS a atualização, se necessário
            if (isManuallyScrolling) {
                // Usamos requestAnimationFrame para garantir que o DOM já tenha sido pintado
                requestAnimationFrame(() => {
                    window.scrollTo(0, userScrollPosition);
                });
            }
            return result;
        };
        console.log('✅ Scroll preservado durante updateMarketPrices.');
    } else {
        console.warn('⚠️ Função updateMarketPrices não encontrada. Scroll pode não ser preservado.');
    }

    // --- 3. Hook nas funções de renderização de UI que podem causar scroll ---
    // Funções como renderAssetsUI, updatePortfolioUI podem recriar elementos
    const uiFunctions = ['renderAssetsUI', 'updatePortfolioUI', 'updateChartsUI'];

    uiFunctions.forEach(funcName => {
        const originalFunc = window[funcName];
        if (originalFunc && typeof originalFunc === 'function') {
            window[funcName] = function() {
                const currentScroll = window.scrollY;
                const result = originalFunc.apply(this, arguments);
                // Usa setTimeout para esperar o DOM atualizar
                setTimeout(() => {
                    if (isManuallyScrolling) {
                        window.scrollTo(0, currentScroll);
                    }
                }, 10);
                return result;
            };
            console.log(`✅ Scroll preservado em ${funcName}.`);
        }
    });

    // --- 4. Bloqueio de scrollIntoView APENAS para elementos que não são interativos ---
    // Isso evita que o foco automático em inputs (como no modal de compra) role a tela
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function(options) {
        // Permite o scrollIntoView apenas se o elemento for um input e o usuário não estiver no meio de um scroll manual
        if (this.tagName === 'INPUT' || this.tagName === 'BUTTON') {
            // Para inputs, usamos a versão com { block: 'nearest', inline: 'nearest' } para evitar saltos grandes
            originalScrollIntoView.call(this, { block: 'nearest', inline: 'nearest', behavior: 'auto' });
        } else {
            // Para outros elementos, bloqueia completamente se o usuário estiver rolando
            if (!isManuallyScrolling) {
                originalScrollIntoView.call(this, options);
            }
        }
    };
    console.log('✅ scrollIntoView controlado.');

    // --- 5. (Opcional) Suavizar a rolagem em contêineres com overflow ---
    // Aplica -webkit-overflow-scrolling: touch para rolagem suave em iOS
    const scrollableContainers = document.querySelectorAll('.history-table-container, .asset-tabs, .modal-content');
    scrollableContainers.forEach(container => {
        container.style.WebkitOverflowScrolling = 'touch';
    });

})();