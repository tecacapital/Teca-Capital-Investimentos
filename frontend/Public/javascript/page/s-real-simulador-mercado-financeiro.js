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

// ============================================
// MÓDULO: CENÁRIO REAL - SIMULADOR DE MERCADO FINANCEIRO TECA CAPITAL
// VERSÃO CORRIGIDA 3.0.0 - CORREÇÃO DOS 4 ERROS CRÍTICOS
// AUTOR: TECA CAPITAL
// ============================================

(function() {
    'use strict';

    // ============================================
    // MÓDULO 1: RealTimeEngine - Única Fonte de Tempo
    // CORREÇÃO ERRO 1: Data única e exclusiva
    // ============================================
    
    const RealTimeEngine = (() => {
        const SECONDS_PER_SIM_DAY = 30; // 30 segundos reais = 1 dia simulado
        
        let _date = { currentYear: 2025, currentMonth: 1, currentDay: 1 };
        let _totalDays = 0;
        let _lastRealTime = null;
        let _speed = 1;
        let _paused = false;
        
        function _getDaysInMonth(month, year) {
            const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0))) return 29;
            return days[month - 1];
        }
        
        function _advanceDays(n) {
            for (let i = 0; i < n; i++) {
                _totalDays++;
                _date.currentDay++;
                if (_date.currentDay > _getDaysInMonth(_date.currentMonth, _date.currentYear)) {
                    _date.currentDay = 1;
                    _date.currentMonth++;
                    if (_date.currentMonth > 12) {
                        _date.currentMonth = 1;
                        _date.currentYear++;
                    }
                }
            }
        }
        
        function tick() {
            if (_paused) return { daysPassed: 0, monthChanged: false, yearChanged: false };
            
            const now = Date.now();
            if (_lastRealTime === null) {
                _lastRealTime = now;
                return { daysPassed: 0, monthChanged: false, yearChanged: false };
            }
            
            const elapsedMs = now - _lastRealTime;
            const elapsedSeconds = elapsedMs / 1000;
            const scaledSeconds = elapsedSeconds * _speed;
            const daysPassed = Math.floor(scaledSeconds / SECONDS_PER_SIM_DAY);
            
            if (daysPassed > 0) {
                const oldMonth = _date.currentMonth;
                const oldYear = _date.currentYear;
                _advanceDays(daysPassed);
                _lastRealTime = now;
                
                // CRÍTICO: Sincronizar com AppState.market.simulatedTime
                if (AppState && AppState.market && AppState.market.simulatedTime) {
                    AppState.market.simulatedTime.currentYear = _date.currentYear;
                    AppState.market.simulatedTime.currentMonth = _date.currentMonth;
                    AppState.market.simulatedTime.currentDay = _date.currentDay;
                    AppState.market.simulatedTime.totalDaysElapsed = _totalDays;
                    AppState.market.simulatedTime.lastUpdate = now;
                }
                
                return {
                    daysPassed,
                    monthChanged: _date.currentMonth !== oldMonth,
                    yearChanged: _date.currentYear !== oldYear,
                    newDate: { ..._date }
                };
            }
            return { daysPassed: 0, monthChanged: false, yearChanged: false };
        }
        
        function reset() {
            _date = { currentYear: 2025, currentMonth: 1, currentDay: 1 };
            _totalDays = 0;
            _lastRealTime = null;
            
            if (AppState && AppState.market && AppState.market.simulatedTime) {
                AppState.market.simulatedTime.currentYear = 2025;
                AppState.market.simulatedTime.currentMonth = 1;
                AppState.market.simulatedTime.currentDay = 1;
                AppState.market.simulatedTime.totalDaysElapsed = 0;
                AppState.market.simulatedTime.startTimestamp = Date.now();
                AppState.market.simulatedTime.lastUpdate = Date.now();
            }
        }
        
        function getDate() {
            return { ..._date };
        }
        
        function formatDate() {
            return `${String(_date.currentDay).padStart(2, '0')}/${String(_date.currentMonth).padStart(2, '0')}/${_date.currentYear}`;
        }
        
        function getTotalDays() {
            return _totalDays;
        }
        
        function setSpeed(s) {
            _speed = Math.max(1, Math.min(10, parseInt(s) || 1));
            return _speed;
        }
        
        function getSpeed() {
            return _speed;
        }
        
        function pause() {
            _paused = true;
        }
        
        function resume() {
            _paused = false;
            _lastRealTime = Date.now();
        }
        
        function isPaused() {
            return _paused;
        }
        
        return {
            tick,
            reset,
            getDate,
            formatDate,
            getTotalDays,
            setSpeed,
            getSpeed,
            pause,
            resume,
            isPaused
        };
    })();
    
    // ============================================
    // MÓDULO 2: Neutralização do Motor de Tempo Principal
    // CORREÇÃO ERRO 1: Ocultar data antiga e neutralizar funções
    // ============================================
    
    let _originalUpdateSimulatedTime = null;
    let _originalUpdateSimulatedDateUI = null;
    let _originalProcessTimeBasedEvents = null;
    
    function realTime_neutralizeMainEngine() {
        // 1. Ocultar o display de data simulada do simulador principal
        const simDateEl = document.getElementById('simulated-date');
        if (simDateEl) {
            const parent = simDateEl.closest('.balance-item');
            if (parent) parent.style.display = 'none';
            else simDateEl.style.display = 'none';
        }
        
        // 2. Neutralizar updateSimulatedTime
        if (!window.__realScenario_updateSimulatedTime_applied) {
            window.__realScenario_updateSimulatedTime_applied = true;
            _originalUpdateSimulatedTime = window.updateSimulatedTime;
            window.updateSimulatedTime = function() {
                if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                    // Retornar dados do RealTimeEngine sem avançar
                    const date = RealTimeEngine.getDate();
                    return {
                        currentYear: date.currentYear,
                        currentMonth: date.currentMonth,
                        currentDay: date.currentDay,
                        monthChanged: false,
                        yearChanged: false,
                        totalDaysElapsed: RealTimeEngine.getTotalDays()
                    };
                }
                return _originalUpdateSimulatedTime ? _originalUpdateSimulatedTime.apply(this, arguments) : null;
            };
        }
        
        // 3. Neutralizar updateSimulatedDateUI
        if (!window.__realScenario_updateSimulatedDateUI_applied) {
            window.__realScenario_updateSimulatedDateUI_applied = true;
            _originalUpdateSimulatedDateUI = window.updateSimulatedDateUI;
            window.updateSimulatedDateUI = function() {
                if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                    return; // Silenciar - data será atualizada pelo painel do cenário real
                }
                return _originalUpdateSimulatedDateUI ? _originalUpdateSimulatedDateUI.apply(this, arguments) : null;
            };
        }
        
        // 4. Neutralizar processTimeBasedEvents
        if (!window.__realScenario_processTimeBasedEvents_applied) {
            window.__realScenario_processTimeBasedEvents_applied = true;
            _originalProcessTimeBasedEvents = window.processTimeBasedEvents;
            window.processTimeBasedEvents = function() {
                if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                    return; // Silenciar - eventos processados pelo cenário real
                }
                return _originalProcessTimeBasedEvents ? _originalProcessTimeBasedEvents.apply(this, arguments) : null;
            };
        }
        
        // 5. Injectar display de data do cenário real
        realUI_injectRealDateDisplay();
    }
    
    function realTime_restoreMainEngine() {
        // Repor display de data do simulador principal
        const simDateEl = document.getElementById('simulated-date');
        if (simDateEl) {
            const parent = simDateEl.closest('.balance-item');
            if (parent) parent.style.display = '';
            else simDateEl.style.display = '';
        }
        
        // Remover display de data do cenário real
        const realDateWrapper = document.getElementById('real-scenario-date-display-wrapper');
        if (realDateWrapper) realDateWrapper.style.display = 'none';
        
        // As funções originais são restauradas automaticamente quando o cenário real não está ativo
        // devido à verificação no início de cada função
    }
    
    function realUI_injectRealDateDisplay() {
        const balanceInfo = document.querySelector('.balance-info');
        if (!balanceInfo) return;
        
        let realDateWrapper = document.getElementById('real-scenario-date-display-wrapper');
        if (!realDateWrapper) {
            realDateWrapper = document.createElement('div');
            realDateWrapper.id = 'real-scenario-date-display-wrapper';
            realDateWrapper.className = 'balance-item';
            realDateWrapper.innerHTML = `
                <span class="label">📅 Data do Cenário Real:</span>
                <span class="value" id="real-scenario-date-display" style="color: var(--accent-green); font-weight: 700;">01/01/2025</span>
            `;
            const items = balanceInfo.querySelectorAll('.balance-item');
            const last = items[items.length - 1];
            if (last) last.insertAdjacentElement('afterend', realDateWrapper);
            else balanceInfo.appendChild(realDateWrapper);
        }
        realDateWrapper.style.display = '';
        
        const dateEl = document.getElementById('real-scenario-date-display');
        if (dateEl) dateEl.textContent = RealTimeEngine.formatDate();
    }
    
    // ============================================
    // MÓDULO 3: Motor de Preços com Drift por Fase
    // CORREÇÃO ERRO 4: TODOS os ativos movem-se pelo cenário real
    // ============================================
    
    const PHASE_DRIFTS = {
        estabilidade: {
            acao: 0.0004, 'acao-us': 0.0005, 'us-acao': 0.0005,
            cripto: 0.0006, etf: 0.0003,
            'titulo-publico': 0.0001, 'titulo-privado': 0.0001,
            moeda: 0.0001
        },
        crescimento: {
            acao: 0.0025, 'acao-us': 0.0030, 'us-acao': 0.0030,
            cripto: 0.0050, etf: 0.0020,
            'titulo-publico': 0.0001, 'titulo-privado': 0.0002,
            moeda: -0.0003
        },
        recessao: {
            acao: -0.0018, 'acao-us': -0.0025, 'us-acao': -0.0025,
            cripto: -0.0030, etf: -0.0015,
            'titulo-publico': 0.0004, 'titulo-privado': 0.0002,
            moeda: 0.0008
        },
        crise: {
            acao: -0.0035, 'acao-us': -0.0045, 'us-acao': -0.0045,
            cripto: -0.0060, etf: -0.0030,
            'titulo-publico': 0.0008, 'titulo-privado': -0.0005,
            moeda: 0.0015
        },
        guerra: {
            acao: -0.0040, 'acao-us': -0.0030, 'us-acao': -0.0030,
            cripto: 0.0020, etf: -0.0035,
            'titulo-publico': 0.0010, 'titulo-privado': -0.0008,
            moeda: 0.0020
        },
        pandemia: {
            acao: -0.0050, 'acao-us': -0.0055, 'us-acao': -0.0055,
            cripto: -0.0040, etf: -0.0045,
            'titulo-publico': 0.0012, 'titulo-privado': -0.0010,
            moeda: 0.0018
        },
        recuperacao: {
            acao: 0.0035, 'acao-us': 0.0040, 'us-acao': 0.0040,
            cripto: 0.0045, etf: 0.0030,
            'titulo-publico': -0.0001, 'titulo-privado': 0.0002,
            moeda: -0.0005
        }
    };
    
    const PHASE_VOL_MULT = {
        estabilidade: 1.0,
        crescimento: 1.2,
        recessao: 1.8,
        crise: 2.8,
        guerra: 3.5,
        pandemia: 4.0,
        recuperacao: 1.4
    };
    
    function realMarket_applyPhaseDrift() {
        const phase = RealMarketEngine.getCurrentPhase();
        const drifts = PHASE_DRIFTS[phase] || PHASE_DRIFTS.estabilidade;
        const volMult = PHASE_VOL_MULT[phase] || 1.0;
        
        Object.values(AppState.market.assets).forEach(asset => {
            if (!asset || !asset.currentPrice) return;
            
            let assetType = asset.type || 'acao';
            if (assetType === 'acao' && asset.country === 'US') assetType = 'acao-us';
            if (assetType === 'us-acao') assetType = 'acao-us';
            
            const drift = drifts[assetType] ?? drifts.acao;
            const vol = (asset.volatility || 0.015) * volMult;
            
            // Movimento aleatório com distribuição normal (Box-Muller)
            const u1 = Math.random(), u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
            const changePct = drift + z * vol;
            
            let newPrice = asset.currentPrice * (1 + changePct);
            newPrice = Math.max(asset.initialPrice * 0.01, newPrice);
            
            asset.previousPrice = asset.currentPrice;
            asset.currentPrice = assetType === 'cripto'
                ? parseFloat(newPrice.toFixed(asset.decimals || 8))
                : parseFloat(newPrice.toFixed(2));
            
            asset.priceHistory = asset.priceHistory || [];
            asset.priceHistory.push(asset.currentPrice);
            if (asset.priceHistory.length > 100) asset.priceHistory.shift();
        });
    }
    
    // Hook em updateMarketPrices
    function realMarket_hookUpdateMarketPrices() {
        if (window.__realScenario_updateMarketPrices_applied) return;
        window.__realScenario_updateMarketPrices_applied = true;
        
        const _orig = window.updateMarketPrices;
        window.updateMarketPrices = function() {
            if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                realMarket_applyPhaseDrift();
                if (typeof window.updateAssetsUI === 'function') window.updateAssetsUI();
                if (typeof window.updatePortfolioUI === 'function') window.updatePortfolioUI();
                if (typeof window.updateChartsUI === 'function') window.updateChartsUI();
                AppState.market.lastUpdate = Date.now();
                return;
            }
            return _orig ? _orig.apply(this, arguments) : null;
        };
    }
    
    // ============================================
    // MÓDULO 4: Sistema de Dividendos Corrigido
    // CORREÇÃO ERRO 2: Datas corretas e histórico limpo
    // ============================================
    
    function realDividend_clearWrongHistory() {
        // Remover registos sem source 'real_scenario'
        if (AppState.portfolio.dividendHistory) {
            AppState.portfolio.dividendHistory = AppState.portfolio.dividendHistory.filter(
                d => d.source === 'real_scenario'
            );
        }
        // Resetar lastPayment de todos os ativos
        Object.values(AppState.market.assets).forEach(asset => {
            if (asset.dividendInfo) {
                asset.dividendInfo.lastPayment = null;
                if (asset.dividendInfo.history) {
                    asset.dividendInfo.history = asset.dividendInfo.history.filter(h => h.source === 'real_scenario');
                }
            }
        });
        console.log('🧹 Histórico de dividendos com datas erradas limpo.');
    }
    
    function realDividend_process() {
        const date = RealTimeEngine.getDate();
        const dateStr = RealTimeEngine.formatDate();
        
        // Pagamento apenas em Junho ou Dezembro do CENÁRIO REAL
        if (date.currentMonth !== 6 && date.currentMonth !== 12) {
            return { totalDividendsPaid: 0, companiesPaid: 0 };
        }
        
        let totalDividendsPaid = 0;
        let companiesPaid = 0;
        const newRecords = [];
        
        AppState.portfolio.positions.forEach(position => {
            if (position.type !== 'acao') return;
            
            const asset = AppState.market.assets[position.assetId];
            if (!asset || !asset.dividendInfo || !asset.dividendInfo.enabled) return;
            if (!asset.dividendInfo.isPayingThisYear) return;
            
            const lp = asset.dividendInfo.lastPayment;
            if (lp && lp.year === date.currentYear && lp.month === date.currentMonth) return;
            
            const dividendPerShare = asset.currentPrice * (asset.dividendInfo.yield || 0.15);
            const total = dividendPerShare * position.quantity;
            
            AppState.user.availableBalance += total;
            totalDividendsPaid += total;
            companiesPaid++;
            
            const record = {
                id: `div_real_${Date.now()}_${asset.id}_${Math.random().toString(36).substr(2, 6)}`,
                date: dateStr,
                simulatedDate: dateStr,
                timestamp: Date.now(),
                assetName: asset.name,
                ticker: asset.ticker,
                perShare: dividendPerShare,
                dividendYield: (asset.dividendInfo.yield * 100).toFixed(2),
                quantity: position.quantity,
                total: total,
                status: 'Pago',
                source: 'real_scenario'
            };
            
            newRecords.push(record);
            
            asset.dividendInfo.lastPayment = { year: date.currentYear, month: date.currentMonth };
            if (!asset.dividendInfo.history) asset.dividendInfo.history = [];
            asset.dividendInfo.history.push(record);
            
            if (typeof showNotification === 'function') {
                showNotification(`💰 Dividendo ${asset.ticker}: ${formatCurrency(total)} (${dateStr})`, 'success');
            }
        });
        
        if (!AppState.portfolio.dividendHistory) AppState.portfolio.dividendHistory = [];
        AppState.portfolio.dividendHistory.push(...newRecords);
        
        if (newRecords.length > 0) {
            realDividend_renderTable();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        }
        
        return { totalDividendsPaid, companiesPaid };
    }
    
    function realDividend_renderTable() {
        const tbody = document.getElementById('ext-dividends-body-permanent');
        if (!tbody) return;
        
        const history = AppState.portfolio.dividendHistory || [];
        
        if (history.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="7" class="empty-state">
                    <div style="padding: 25px; text-align: center;">
                        <div style="font-size: 2.5rem; margin-bottom: 10px;">💰</div>
                        <p>Nenhum dividendo recebido ainda</p>
                        <p style="font-size: 0.8rem; opacity: 0.6;">Pagamentos em Junho e Dezembro do calendário do cenário real</p>
                    </div>
                </td></tr>`;
            return;
        }
        
        const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
        tbody.innerHTML = sorted.map((rec, i) => `
            <tr style="animation: fadeIn 0.3s ease ${i * 0.04}s both;">
                <td>${rec.date || rec.simulatedDate || '—'}</td>
                <td><strong>${rec.ticker}</strong><br><small style="opacity: 0.7;">${rec.assetName}</small></td>
                <td>${formatCurrency(rec.perShare)}</td>
                <td class="positive">${parseFloat(rec.dividendYield || 0).toFixed(2)}%</td>
                <td>${(rec.quantity || 0).toLocaleString('pt-AO')}</td>
                <td class="positive"><strong>${formatCurrency(rec.total)}</strong></td>
                <td><span class="badge buy">${rec.status || 'Pago'}</span></td>
            </tr>
        `).join('');
    }
    
    function realDividend_hookProcessDividends() {
        if (window.__realScenario_processDividends_applied) return;
        window.__realScenario_processDividends_applied = true;
        
        const _orig = window.processDividends;
        window.processDividends = function() {
            if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                return realDividend_process();
            }
            return _orig ? _orig.apply(this, arguments) : null;
        };
    }
    
    // ============================================
    // MÓDULO 5: Sistema de Títulos Corrigido
    // CORREÇÃO ERRO 3: Devolve 100% do principal no vencimento
    // ============================================
    
    function realBond_initBondInfo(position, asset) {
        const purchaseDate = RealTimeEngine.getDate();
        const maturityYears = asset.maturity || 1;
        
        // CRÍTICO: principalAmount = preço unitário × quantidade (valor total investido)
        const principalAmount = asset.initialPrice * position.quantity;
        
        position.bondInfo = {
            purchaseDate: { ...purchaseDate },
            maturityDate: {
                currentYear: purchaseDate.currentYear + maturityYears,
                currentMonth: purchaseDate.currentMonth,
                currentDay: purchaseDate.currentDay
            },
            totalPayments: maturityYears * 2,
            paymentsMade: 0,
            nextPaymentDate: realBond_addMonths(purchaseDate, 6),
            principalAmount: principalAmount,
            initialized: true,
            matured: false,
            lastPaymentIndex: 0
        };
        
        if (typeof console !== 'undefined') {
            console.log(`✅ bondInfo: ${asset.ticker} | principal=${formatCurrency(principalAmount)} | qty=${position.quantity}`);
        }
    }
    
    function realBond_addMonths(date, months) {
        let newMonth = date.currentMonth + months;
        let newYear = date.currentYear;
        
        while (newMonth > 12) {
            newMonth -= 12;
            newYear++;
        }
        
        return {
            currentYear: newYear,
            currentMonth: newMonth,
            currentDay: date.currentDay
        };
    }
    
    function realBond_isDateReached(current, target) {
        if (!current || !target) return false;
        if (current.currentYear > target.currentYear) return true;
        if (current.currentYear === target.currentYear && current.currentMonth > target.currentMonth) return true;
        if (current.currentYear === target.currentYear &&
            current.currentMonth === target.currentMonth &&
            current.currentDay >= target.currentDay) return true;
        return false;
    }
    
    function realBond_canRedeem(position) {
        if (!position || !position.bondInfo || !position.bondInfo.maturityDate) return false;
        return realBond_isDateReached(RealTimeEngine.getDate(), position.bondInfo.maturityDate);
    }
    
    function realBond_processInterest() {
        const date = RealTimeEngine.getDate();
        const dateStr = RealTimeEngine.formatDate();
        let totalPaid = 0;
        let count = 0;
        
        if (!AppState || !AppState.portfolio || !AppState.portfolio.positions) return { totalPaid, count };
        
        AppState.portfolio.positions.forEach(position => {
            if (!position.type || !position.type.includes('titulo')) return;
            if (!position.bondInfo) return;
            if (position.bondInfo.matured) return;
            if (position.bondInfo.paymentsMade >= position.bondInfo.totalPayments) return;
            
            const nextPay = position.bondInfo.nextPaymentDate;
            if (!nextPay) return;
            
            if (!realBond_isDateReached(date, nextPay)) return;
            
            const asset = AppState.market.assets[position.assetId];
            if (!asset) return;
            
            const grossInterest = (asset.couponRate / 2) * position.bondInfo.principalAmount;
            
            let tax = 0;
            let netInterest = grossInterest;
            if (asset.type === 'titulo-privado') {
                tax = grossInterest * 0.10;
                netInterest = grossInterest - tax;
            }
            
            AppState.user.availableBalance += netInterest;
            totalPaid += netInterest;
            count++;
            
            position.bondInfo.paymentsMade++;
            position.bondInfo.lastPaymentIndex = position.bondInfo.paymentsMade;
            position.bondInfo.nextPaymentDate = realBond_addMonths(position.bondInfo.nextPaymentDate, 6);
            
            const record = {
                id: `bond_int_${Date.now()}_${asset.id}_${position.bondInfo.paymentsMade}`,
                timestamp: new Date().toISOString(),
                date: dateStr,
                simulatedDate: dateStr,
                bondId: asset.id,
                bondName: asset.name,
                ticker: asset.ticker,
                type: 'interest',
                paymentNumber: position.bondInfo.paymentsMade,
                totalPayments: position.bondInfo.totalPayments,
                interestAmount: grossInterest,
                netInterestAmount: netInterest,
                taxAmount: tax,
                principalRemaining: position.bondInfo.principalAmount,
                status: 'Pago',
                isPublic: asset.type === 'titulo-publico',
                source: 'real_scenario'
            };
            
            if (!AppState.portfolio.bondInterestHistory) AppState.portfolio.bondInterestHistory = [];
            AppState.portfolio.bondInterestHistory.push(record);
            
            const taxInfo = tax > 0 ? ` (IAC: -${formatCurrency(tax)})` : ' (isento de IAC)';
            if (typeof showNotification === 'function') {
                showNotification(
                    `💵 Juro ${asset.ticker}: ${formatCurrency(netInterest)}${taxInfo} | ${position.bondInfo.paymentsMade}/${position.bondInfo.totalPayments}`,
                    'success'
                );
            }
        });
        
        if (count > 0) {
            realBond_renderInterestTable();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        }
        
        return { totalPaid, count };
    }
    
    function realBond_processMaturity() {
        const date = RealTimeEngine.getDate();
        let processedCount = 0;
        let totalReturned = 0;
        
        if (!AppState || !AppState.portfolio || !AppState.portfolio.positions) return { processedCount, totalReturned };
        
        for (let i = AppState.portfolio.positions.length - 1; i >= 0; i--) {
            const position = AppState.portfolio.positions[i];
            if (!position.type || !position.type.includes('titulo')) continue;
            if (!position.bondInfo) continue;
            if (position.bondInfo.matured) continue;
            
            const maturity = position.bondInfo.maturityDate;
            if (!maturity) continue;
            
            if (!realBond_isDateReached(date, maturity)) continue;
            
            // CRÍTICO: Devolver 100% do principalAmount (valor total investido)
            const valorTotal = position.bondInfo.principalAmount;
            
            AppState.user.availableBalance += valorTotal;
            totalReturned += valorTotal;
            
            position.bondInfo.matured = true;
            
            const removedPosition = AppState.portfolio.positions.splice(i, 1)[0];
            processedCount++;
            
            AppState.portfolio.transactions.push({
                timestamp: new Date().toISOString(),
                assetId: position.assetId,
                assetName: position.name,
                type: 'maturity',
                quantity: position.quantity,
                price: position.avgPrice,
                total: valorTotal,
                pnl: 0,
                details: `Vencimento: ${formatCurrency(valorTotal)} devolvidos (100% do capital)`
            });
            
            if (typeof showNotification === 'function') {
                showNotification(
                    `🏛️ TÍTULO VENCIDO: ${position.ticker} — ${formatCurrency(valorTotal)} devolvidos (100%)`,
                    'success'
                );
            }
        }
        
        if (processedCount > 0) {
            if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            if (typeof updateTransactionsUI === 'function') updateTransactionsUI();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        }
        
        return { processedCount, totalReturned };
    }
    
    function realBond_updateCountdowns() {
        const date = RealTimeEngine.getDate();
        
        function toDays(d) {
            return d.currentYear * 365 + (d.currentMonth - 1) * 30 + d.currentDay;
        }
        
        AppState.portfolio.positions.forEach(position => {
            if (!position.type || !position.type.includes('titulo')) return;
            if (!position.bondInfo) return;
            
            const maturity = position.bondInfo.maturityDate;
            const nextPay = position.bondInfo.nextPaymentDate;
            
            position.countdown = {
                daysToMaturity: Math.max(0, toDays(maturity) - toDays(date)),
                daysToNextPayment: Math.max(0, toDays(nextPay) - toDays(date)),
                progressPercent: Math.round((position.bondInfo.paymentsMade / position.bondInfo.totalPayments) * 100),
                paymentsMade: position.bondInfo.paymentsMade,
                totalPayments: position.bondInfo.totalPayments,
                maturityFormatted: realBond_formatDate(maturity),
                nextPayFormatted: realBond_formatDate(nextPay),
                canRedeem: realBond_canRedeem(position)
            };
        });
    }
    
    function realBond_formatDate(d) {
        return `${String(d.currentDay).padStart(2, '0')}/${String(d.currentMonth).padStart(2, '0')}/${d.currentYear}`;
    }
    
    function realBond_renderInterestTable() {
        let tbody = document.getElementById('bond-interest-body');
        if (!tbody) {
            realBond_createInterestTableHTML();
            tbody = document.getElementById('bond-interest-body');
        }
        if (!tbody) return;
        
        const history = AppState.portfolio.bondInterestHistory || [];
        
        if (history.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="empty-state">
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 2.5rem;">💵</div>
                        <p>Nenhum juro recebido ainda</p>
                        <p style="font-size: 0.8rem; opacity: 0.6;">Pagamentos semestrais — a cada 6 meses do cenário real</p>
                    </div>
                </td></tr>`;
            return;
        }
        
        const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        tbody.innerHTML = sorted.map((rec, i) => {
            const taxInfo = rec.taxAmount > 0
                ? `<br><small style="color: var(--danger);">IAC: -${formatCurrency(rec.taxAmount)}</small>`
                : '<br><small style="color: var(--success);">Isento de IAC</small>';
            return `
                <tr style="animation: fadeIn 0.3s ease ${i * 0.04}s both;">
                    <td>${rec.date || rec.simulatedDate || '—'}</td>
                    <td><strong>${rec.ticker}</strong><br><small style="opacity: 0.7;">${rec.bondName}</small></td>
                    <td style="text-align: center;"><strong>${rec.paymentNumber}/${rec.totalPayments}</strong></td>
                    <td style="text-align: right;">${formatCurrency(rec.interestAmount)}${taxInfo}</td>
                    <td style="text-align: right;" class="positive"><strong>${formatCurrency(rec.netInterestAmount || rec.interestAmount)}</strong></td>
                    <td style="text-align: right;">${formatCurrency(rec.principalRemaining)}</td>
                </tr>
            `;
        }).join('');
    }
    
    function realBond_createInterestTableHTML() {
        if (document.getElementById('bond-interest-body')) return;
        const ref = document.querySelector('.transaction-history');
        if (!ref) return;
        
        const section = document.createElement('div');
        section.className = 'transaction-history';
        section.style.marginTop = '30px';
        section.innerHTML = `
            <h3>💵 Histórico de Pagamentos de Juros</h3>
            <div class="history-table-container">
                <table id="bond-interest-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Título</th>
                            <th style="text-align: center;">Pagamento</th>
                            <th style="text-align: right;">Valor Bruto</th>
                            <th style="text-align: right;">Valor Líquido</th>
                            <th style="text-align: right;">Principal</th>
                        </tr>
                    </thead>
                    <tbody id="bond-interest-body">
                        <tr><td colspan="6" class="empty-state">Nenhum juro recebido ainda.</td></tr>
                    </tbody>
                </table>
            </div>`;
        ref.insertAdjacentElement('afterend', section);
    }
    
    function realBond_renderCountdownsUI() {
        const positionItems = document.querySelectorAll('.position-item');
        
        positionItems.forEach(item => {
            const tickerEl = item.querySelector('strong');
            if (!tickerEl) return;
            
            const position = AppState.portfolio.positions.find(p => p.ticker === tickerEl.textContent.trim());
            if (!position || !position.type || !position.type.includes('titulo')) return;
            if (!position.countdown) return;
            
            const cd = position.countdown;
            
            const old = item.querySelector('.bond-countdown');
            if (old) old.remove();
            
            const div = document.createElement('div');
            div.className = 'bond-countdown';
            div.style.cssText = `
                margin-top: 8px; padding: 10px;
                background: rgba(214, 174, 100, 0.1); border-radius: 8px;
                font-size: 0.85rem; border-left: 3px solid ${cd.canRedeem ? 'var(--success)' : 'var(--accent-green)'};
            `;
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span>${cd.canRedeem ? '✅ Vencido — Pronto para resgate' : `⏳ Vence em: <strong>${cd.daysToMaturity} dias</strong>`}</span>
                    <span>${cd.progressPercent}%</span>
                </div>
                <div style="height: 6px; background: var(--gray-medium); border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
                    <div style="height: 100%; width: ${cd.progressPercent}%; background: ${cd.canRedeem ? 'var(--success)' : 'var(--accent-green)'}; transition: width 0.3s;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: rgba(255, 255, 255, 0.8);">
                    <span>Juros: ${cd.paymentsMade}/${cd.totalPayments} pagos</span>
                    <span>${cd.canRedeem ? 'Resgate disponível' : `Próximo juro: ${cd.daysToNextPayment} dias`}</span>
                </div>
                <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); margin-top: 4px;">
                    Próximo juro: ${cd.nextPayFormatted} → Vencimento: ${cd.maturityFormatted}
                </div>
            `;
            
            const sellBtn = item.querySelector('.btn-sell-small');
            if (sellBtn) {
                sellBtn.textContent = cd.canRedeem ? '💰 Resgatar Título' : '🔒 Aguardar Vencimento';
                sellBtn.style.opacity = cd.canRedeem ? '1' : '0.5';
                sellBtn.style.cursor = cd.canRedeem ? 'pointer' : 'not-allowed';
                sellBtn.disabled = !cd.canRedeem;
                sellBtn.onclick = cd.canRedeem
                    ? () => openTradeModal(position.assetId, 'sell')
                    : () => showNotification(`⏳ ${position.ticker} vence em ${cd.maturityFormatted}. Aguarde.`, 'warning');
                sellBtn.insertAdjacentElement('beforebegin', div);
            }
        });
    }
    
    function realBond_hookBuyAsset() {
        if (window.__realScenario_buyAsset_applied) return;
        window.__realScenario_buyAsset_applied = true;
        
        const _orig = window.buyAsset;
        window.buyAsset = function(assetId, quantity) {
            const result = _orig ? _orig.apply(this, arguments) : { success: false, message: 'buyAsset não disponível' };
            
            if (result && result.success && window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                const asset = AppState.market.assets[assetId];
                if (asset && asset.type && asset.type.includes('titulo')) {
                    const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
                    if (position && (!position.bondInfo || !position.bondInfo.initialized)) {
                        realBond_initBondInfo(position, asset);
                        setTimeout(() => {
                            realBond_updateCountdowns();
                            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
                            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
                        }, 300);
                    }
                }
            }
            
            return result;
        };
    }
    
    function realBond_hookSellAsset() {
        if (window.__realScenario_sellAsset_applied) return;
        window.__realScenario_sellAsset_applied = true;
        
        const _orig = window.sellAsset;
        window.sellAsset = function(assetId, quantity) {
            if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                const asset = AppState.market.assets[assetId];
                if (asset && asset.type && asset.type.includes('titulo')) {
                    const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
                    if (position && !realBond_canRedeem(position)) {
                        const maturity = position.bondInfo?.maturityDate;
                        const matStr = maturity ? realBond_formatDate(maturity) : 'data desconhecida';
                        if (typeof showNotification === 'function') {
                            showNotification(`⏳ Resgate bloqueado. ${asset.ticker} vence em ${matStr}. Aguarde.`, 'warning');
                        }
                        return { success: false, message: `Título vence em ${matStr}. Aguarde o vencimento.` };
                    }
                    
                    if (position && realBond_canRedeem(position)) {
                        const principal = position.bondInfo.principalAmount;
                        AppState.user.availableBalance += principal;
                        AppState.portfolio.positions = AppState.portfolio.positions.filter(p => p.assetId !== assetId);
                        
                        AppState.portfolio.transactions.push({
                            timestamp: new Date().toISOString(),
                            assetId,
                            assetName: asset.name,
                            type: 'maturity',
                            quantity: position.quantity,
                            price: position.avgPrice,
                            total: principal,
                            pnl: 0,
                            details: `Resgate: ${formatCurrency(principal)} (100%)`
                        });
                        
                        if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
                        if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
                        if (typeof updateTransactionsUI === 'function') updateTransactionsUI();
                        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
                        
                        return {
                            success: true,
                            message: `✅ Título resgatado: ${asset.ticker} — ${formatCurrency(principal)} creditados (100%)`
                        };
                    }
                }
            }
            
            return _orig ? _orig.apply(this, arguments) : { success: false, message: 'sellAsset não disponível' };
        };
    }
    
    function realBond_hookPortfolioUI() {
        if (window.__realScenario_portfolioUI_applied) return;
        window.__realScenario_portfolioUI_applied = true;
        
        const _orig = window.updatePortfolioUI;
        window.updatePortfolioUI = function() {
            const result = _orig ? _orig.apply(this, arguments) : null;
            
            if (window.RealScenarioSystem && window.RealScenarioSystem.isActive && window.RealScenarioSystem.isActive()) {
                realBond_updateCountdowns();
                setTimeout(realBond_renderCountdownsUI, 120);
            }
            
            return result;
        };
    }
    
    // ============================================
    // MÓDULO 6: Ciclos Económicos
    // ============================================
    
    const RealMarketEngine = (() => {
        const PHASES = ['estabilidade', 'crescimento', 'recessao', 'crise', 'guerra', 'pandemia', 'recuperacao'];
        
        const DURATIONS = {
            estabilidade: [60, 180],
            crescimento: [90, 365],
            recessao: [90, 365],
            crise: [180, 730],
            guerra: [180, 540],
            pandemia: [365, 1095],
            recuperacao: [90, 270]
        };
        
        const TRANSITIONS = {
            estabilidade: [{ p: 'crescimento', w: 40 }, { p: 'estabilidade', w: 40 }, { p: 'recessao', w: 20 }],
            crescimento: [{ p: 'crescimento', w: 50 }, { p: 'estabilidade', w: 30 }, { p: 'crise', w: 20 }],
            recessao: [{ p: 'recessao', w: 50 }, { p: 'crise', w: 30 }, { p: 'recuperacao', w: 20 }],
            crise: [{ p: 'crise', w: 50 }, { p: 'recuperacao', w: 30 }, { p: 'recessao', w: 20 }],
            guerra: [{ p: 'guerra', w: 40 }, { p: 'recessao', w: 30 }, { p: 'crise', w: 20 }, { p: 'recuperacao', w: 10 }],
            pandemia: [{ p: 'pandemia', w: 50 }, { p: 'recessao', w: 30 }, { p: 'recuperacao', w: 20 }],
            recuperacao: [{ p: 'recuperacao', w: 50 }, { p: 'estabilidade', w: 30 }, { p: 'crescimento', w: 20 }]
        };
        
        const DISPLAY = {
            estabilidade: '📊 Estabilidade',
            crescimento: '📈 Crescimento',
            recessao: '📉 Recessão',
            crise: '⚠️ Crise',
            guerra: '⚔️ Guerra',
            pandemia: '🦠 Pandemia',
            recuperacao: '🌱 Recuperação'
        };
        
        const COLORS = {
            estabilidade: 'var(--accent-green)',
            crescimento: 'var(--success)',
            recessao: 'var(--warning)',
            crise: 'var(--danger)',
            guerra: '#ff6b6b',
            pandemia: '#c44569',
            recuperacao: '#4cd964'
        };
        
        let _phase = 'estabilidade';
        let _remaining = 90;
        let _startDay = 0;
        let _nextPhase = null;
        let _transitionDays = 0;
        
        function _rand(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
        
        function _pickNext(current) {
            const opts = TRANSITIONS[current] || [{ p: current, w: 100 }];
            const total = opts.reduce((s, o) => s + o.w, 0);
            let r = Math.random() * total;
            for (const o of opts) {
                r -= o.w;
                if (r <= 0) return o.p;
            }
            return current;
        }
        
        function tick(daysPassed) {
            _remaining -= daysPassed;
            
            if (_transitionDays > 0) {
                _transitionDays -= daysPassed;
                if (_transitionDays <= 0 && _nextPhase) {
                    _phase = _nextPhase;
                    _nextPhase = null;
                    _transitionDays = 0;
                    _remaining = _rand(...DURATIONS[_phase]);
                    _startDay = RealTimeEngine.getTotalDays();
                }
                return;
            }
            
            if (_remaining <= 0) {
                const next = _pickNext(_phase);
                if (next !== _phase) {
                    _nextPhase = next;
                    _transitionDays = _rand(10, 20);
                    if (typeof showNotification === 'function') {
                        showNotification(`🔄 Transição económica: ${DISPLAY[_phase]} → ${DISPLAY[next]}`, 'info');
                    }
                } else {
                    _remaining = _rand(...DURATIONS[_phase]);
                }
            }
        }
        
        function reset() {
            _phase = 'estabilidade';
            _remaining = 90;
            _startDay = 0;
            _nextPhase = null;
            _transitionDays = 0;
        }
        
        function getCurrentPhase() {
            return _phase;
        }
        
        function getPhaseInfo() {
            return {
                name: _phase,
                displayName: DISPLAY[_phase],
                color: COLORS[_phase]
            };
        }
        
        function getProgress() {
            const dur = DURATIONS[_phase];
            const total = dur ? (dur[0] + dur[1]) / 2 : 90;
            const elapsed = RealTimeEngine.getTotalDays() - _startDay;
            return Math.min(1, elapsed / total);
        }
        
        function isTransitioning() {
            return _transitionDays > 0 && _nextPhase !== null;
        }
        
        function getNextPhaseInfo() {
            if (!_nextPhase) return null;
            return {
                name: _nextPhase,
                displayName: DISPLAY[_nextPhase],
                color: COLORS[_nextPhase]
            };
        }
        
        return {
            tick,
            reset,
            getCurrentPhase,
            getPhaseInfo,
            getProgress,
            isTransitioning,
            getNextPhaseInfo
        };
    })();
    
    // ============================================
    // MÓDULO 7: Eventos Extremos
    // ============================================
    
    const RealEventEngine = (() => {
        let _log = [];
        let _lastEventDay = -1;
        
        const PROB = {
            estabilidade: 0.004,
            crescimento: 0.015,
            recessao: 0.012,
            crise: 0.025,
            guerra: 0.030,
            pandemia: 0.020,
            recuperacao: 0.008
        };
        
        const EVENTS = ['flash_crash', 'market_rally', 'black_swan', 'bubble_burst', 'sector_collapse'];
        
        const EVENT_NAMES = {
            flash_crash: '💥 Flash Crash',
            market_rally: '🚀 Market Rally',
            black_swan: '🦢 Cisne Negro',
            bubble_burst: '💣 Estouro de Bolha',
            sector_collapse: '🏭 Colapso Setorial'
        };
        
        function maybeFireEvent() {
            const day = RealTimeEngine.getTotalDays();
            if (day === _lastEventDay) return null;
            
            const phase = RealMarketEngine.getCurrentPhase();
            if (Math.random() > (PROB[phase] || 0.01)) return null;
            
            const type = EVENTS[Math.floor(Math.random() * EVENTS.length)];
            const assets = Object.values(AppState.market.assets);
            
            let magnitude = 0;
            switch (type) {
                case 'flash_crash': magnitude = -(0.08 + Math.random() * 0.07); break;
                case 'market_rally': magnitude = +(0.05 + Math.random() * 0.10); break;
                case 'black_swan': magnitude = -(0.10 + Math.random() * 0.10); break;
                case 'bubble_burst': magnitude = -(0.15 + Math.random() * 0.15); break;
                case 'sector_collapse': magnitude = -(0.20 + Math.random() * 0.20); break;
            }
            
            const count = Math.floor(assets.length * (0.3 + Math.random() * 0.4));
            const affected = assets.sort(() => Math.random() - 0.5).slice(0, count);
            
            affected.forEach(a => {
                if (a && a.currentPrice) {
                    a.currentPrice = Math.max(0.01, a.currentPrice * (1 + magnitude));
                }
            });
            
            _lastEventDay = day;
            const info = {
                type,
                name: EVENT_NAMES[type],
                magnitude,
                affectedCount: count,
                date: RealTimeEngine.formatDate(),
                day
            };
            _log.unshift(info);
            if (_log.length > 30) _log.pop();
            
            if (typeof showNotification === 'function') {
                showNotification(`${EVENT_NAMES[type]}: ${(magnitude * 100).toFixed(1)}% em ${count} ativos`,
                    magnitude > 0 ? 'success' : 'error');
            }
            
            return info;
        }
        
        function reset() {
            _log = [];
            _lastEventDay = -1;
        }
        
        function getStats() {
            return {
                total: _log.length,
                extreme: _log.filter(e => e.magnitude < -0.10).length,
                log: _log.slice(0, 10)
            };
        }
        
        return {
            maybeFireEvent,
            reset,
            getStats
        };
    })();
    
    // ============================================
    // MÓDULO 8: Painel de Controlo do Cenário Real
    // ============================================
    
    let _panelElement = null;
    
    function realUI_injectPanel() {
        if (_panelElement) return _panelElement;
        
        const target = document.querySelector('.portfolio-summary .summary-card');
        if (!target) return null;
        
        _panelElement = document.createElement('div');
        _panelElement.id = 'real-scenario-panel';
        _panelElement.style.cssText = `
            background: var(--gray-dark);
            border: 2px solid var(--accent-green);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            display: none;
        `;
        _panelElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: var(--accent-green); margin: 0; font-size: 1rem;">🌍 Cenário Real</h4>
                <div id="real-speed-btns" style="display: flex; gap: 5px;">
                    ${[1, 2, 5, 10].map(s => `
                        <button data-speed="${s}" class="real-spd-btn"
                            style="background: var(--gray-medium); border: none; color: var(--text-white);
                            padding: 3px 9px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                            ${s}×
                        </button>
                    `).join('')}
                </div>
            </div>
            <div style="text-align: center; margin-bottom: 12px;">
                <div id="real-panel-date" style="font-size: 1.5rem; font-weight: 700; color: var(--accent-green); font-family: monospace;">01/01/2025</div>
                <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.5);">Dia <span id="real-panel-days">0</span> | Velocidade: <span id="real-panel-speed">1</span>×</div>
            </div>
            <div style="background: var(--gray-medium); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 0.8rem; opacity: 0.7;">Fase Económica</span>
                    <span id="real-panel-phase" style="font-weight: 700; font-size: 0.9rem; color: var(--accent-green);">📊 Estabilidade</span>
                </div>
                <div style="height: 6px; background: rgba(255, 255, 255, 0.2); border-radius: 3px; overflow: hidden;">
                    <div id="real-panel-progress" style="height: 100%; width: 0%; background: var(--accent-green); transition: width 0.5s;"></div>
                </div>
                <div id="real-panel-transition" style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); margin-top: 4px; display: none;"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div style="background: var(--gray-medium); padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.65rem; opacity: 0.6;">Próx. Juro</div>
                    <div id="real-panel-nextint" style="font-size: 0.85rem; font-weight: 700; color: var(--accent-green);">—</div>
                </div>
                <div style="background: var(--gray-medium); padding: 8px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.65rem; opacity: 0.6;">Eventos</div>
                    <div id="real-panel-events" style="font-size: 0.85rem; font-weight: 700;">0</div>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="real-btn-pause" style="flex: 1; background: var(--gray-medium); border: none;
                    color: var(--text-white); padding: 9px; border-radius: 7px; cursor: pointer; font-size: 0.85rem;">⏸️ Pausar</button>
                <button id="real-btn-resume" style="flex: 1; background: var(--accent-green); border: none;
                    color: #000; padding: 9px; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 0.85rem; opacity: 0.5;">▶️ Retomar</button>
            </div>
        `;
        
        target.insertAdjacentElement('afterend', _panelElement);
        realUI_setupPanelEvents();
        
        return _panelElement;
    }
    
    function realUI_setupPanelEvents() {
        if (!_panelElement) return;
        
        _panelElement.querySelectorAll('.real-spd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = parseInt(btn.dataset.speed, 10);
                RealTimeEngine.setSpeed(s);
                _panelElement.querySelectorAll('.real-spd-btn').forEach(b => {
                    const active = parseInt(b.dataset.speed, 10) === s;
                    b.style.background = active ? 'var(--accent-green)' : 'var(--gray-medium)';
                    b.style.color = active ? '#000' : 'var(--text-white)';
                });
                const speedSpan = document.getElementById('real-panel-speed');
                if (speedSpan) speedSpan.textContent = s;
            });
        });
        
        const pauseBtn = _panelElement.querySelector('#real-btn-pause');
        const resumeBtn = _panelElement.querySelector('#real-btn-resume');
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                RealTimeEngine.pause();
                pauseBtn.style.opacity = '0.5';
                if (resumeBtn) resumeBtn.style.opacity = '1';
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                RealTimeEngine.resume();
                if (pauseBtn) pauseBtn.style.opacity = '1';
                resumeBtn.style.opacity = '0.5';
            });
        }
        
        const speed1Btn = _panelElement.querySelector('[data-speed="1"]');
        if (speed1Btn) speed1Btn.click();
    }
    
    function realUI_updatePanel() {
        if (!_panelElement) return;
        
        const dateEl = document.getElementById('real-panel-date');
        if (dateEl) dateEl.textContent = RealTimeEngine.formatDate();
        
        const daysEl = document.getElementById('real-panel-days');
        if (daysEl) daysEl.textContent = RealTimeEngine.getTotalDays();
        
        const phaseInfo = RealMarketEngine.getPhaseInfo();
        const phaseEl = document.getElementById('real-panel-phase');
        if (phaseEl) {
            phaseEl.textContent = phaseInfo.displayName;
            phaseEl.style.color = phaseInfo.color;
        }
        
        const progEl = document.getElementById('real-panel-progress');
        if (progEl) {
            progEl.style.width = `${Math.round(RealMarketEngine.getProgress() * 100)}%`;
            progEl.style.background = phaseInfo.color;
        }
        
        const transEl = document.getElementById('real-panel-transition');
        if (transEl) {
            if (RealMarketEngine.isTransitioning()) {
                const np = RealMarketEngine.getNextPhaseInfo();
                transEl.textContent = np ? `🔄 → ${np.displayName}` : '';
                transEl.style.display = 'block';
            } else {
                transEl.style.display = 'none';
            }
        }
        
        const realDateDisplayEl = document.getElementById('real-scenario-date-display');
        if (realDateDisplayEl) realDateDisplayEl.textContent = RealTimeEngine.formatDate();
        
        const nextIntEl = document.getElementById('real-panel-nextint');
        if (nextIntEl) {
            const bonds = AppState.portfolio.positions.filter(p => p.type && p.type.includes('titulo') && p.bondInfo && !p.bondInfo.matured);
            if (bonds.length > 0) {
                const nearest = bonds.map(p => ({ t: p.ticker, d: p.countdown?.daysToNextPayment ?? 9999 }))
                    .sort((a, b) => a.d - b.d)[0];
                nextIntEl.textContent = `${nearest.t}: ${nearest.d}d`;
            } else {
                nextIntEl.textContent = '—';
            }
        }
        
        const evEl = document.getElementById('real-panel-events');
        if (evEl) evEl.textContent = RealEventEngine.getStats().total;
    }
    
    function realUI_injectScenarioCard() {
        const cards = document.querySelector('.scenario-cards');
        if (!cards || cards.querySelector('[data-scenario="cenario-real"]')) return;
        
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.setAttribute('data-scenario', 'cenario-real');
        card.innerHTML = `
            <span class="icon">🌍</span>
            <h3>Cenário Real</h3>
            <p>Mercado com ciclos económicos reais: estabilidade, crescimento, recessão, crise, guerra, pandemia e recuperação. Motor de tempo próprio. Títulos com juros semestrais e vencimento real.</p>
        `;
        cards.appendChild(card);
    }
    
    // ============================================
    // MÓDULO 9: Loop Principal e Estado Global
    // ============================================
    
    let _isActive = false;
    let _tickId = null;
    
    function realScenario_isActive() {
        return _isActive;
    }
    
    function realScenario_mainTick() {
        if (!_isActive) return;
        
        const timeResult = RealTimeEngine.tick();
        
        if (timeResult.daysPassed > 0) {
            // 1. Motor de preços (drift de fase para TODOS os ativos)
            realMarket_applyPhaseDrift();
            
            // 2. Tick do ciclo económico
            RealMarketEngine.tick(timeResult.daysPassed);
            
            // 3. Verificar eventos extremos
            RealEventEngine.maybeFireEvent();
            
            // 4. Processar juros de títulos
            realBond_processInterest();
            
            // 5. Processar vencimentos de títulos
            realBond_processMaturity();
            
            // 6. Processar dividendos (só em Junho e Dezembro)
            realDividend_process();
            
            // 7. Atualizar contagens regressivas
            realBond_updateCountdowns();
            
            // 8. Atualizar UIs
            if (typeof window.updateAssetsUI === 'function') window.updateAssetsUI();
            if (typeof window.updatePortfolioUI === 'function') updatePortfolioUI();
            realBond_renderInterestTable();
            realDividend_renderTable();
        }
        
        // Atualizar painel sempre
        realUI_updatePanel();
    }
    
    function realScenario_start() {
        if (_isActive) return;
        
        console.log('🌍 Activando Cenário Real...');
        _isActive = true;
        
        // Resetar motores
        RealTimeEngine.reset();
        RealMarketEngine.reset();
        RealEventEngine.reset();
        
        // Neutralizar motor de tempo principal (CORREÇÃO ERRO 1)
        realTime_neutralizeMainEngine();
        
        // Inicializar bondInfo em títulos já existentes
        if (AppState && AppState.portfolio && AppState.portfolio.positions) {
            AppState.portfolio.positions.forEach(pos => {
                if (pos.type && pos.type.includes('titulo') && (!pos.bondInfo || !pos.bondInfo.initialized)) {
                    const asset = AppState.market.assets[pos.assetId];
                    if (asset) realBond_initBondInfo(pos, asset);
                }
            });
        }
        
        // Limpar histórico de dividendos com datas erradas (CORREÇÃO ERRO 2)
        realDividend_clearWrongHistory();
        
        // Criar tabela de juros se não existir
        realBond_createInterestTableHTML();
        
        // Injectar e mostrar painel
        realUI_injectPanel();
        if (_panelElement) _panelElement.style.display = 'block';
        
        // Iniciar ticker próprio (30 segundos, fixo) (CORREÇÃO ERRO 4)
        if (_tickId) clearInterval(_tickId);
        _tickId = setInterval(realScenario_mainTick, 30000);
        
        if (typeof showNotification === 'function') {
            showNotification('🌍 Cenário Real activado! Motor de tempo próprio a controlar todos os ativos.', 'success');
        }
        
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    }
    
    function realScenario_stop() {
        if (!_isActive) return;
        
        console.log('🔄 Desactivando Cenário Real...');
        _isActive = false;
        
        if (_tickId) {
            clearInterval(_tickId);
            _tickId = null;
        }
        
        // Restaurar motor de tempo principal
        realTime_restoreMainEngine();
        
        if (_panelElement) _panelElement.style.display = 'none';
        
        if (typeof showNotification === 'function') {
            showNotification('Cenário Real desactivado.', 'info');
        }
    }
    
    // ============================================
    // MÓDULO 10: Inicialização e Detecção Automática
    // ============================================
    
    function realScenario_init() {
        console.log('🌍 Inicializando módulo Cenário Real...');
        
        // Aplicar hooks
        realBond_hookBuyAsset();
        realBond_hookSellAsset();
        realBond_hookPortfolioUI();
        realDividend_hookProcessDividends();
        realMarket_hookUpdateMarketPrices();
        
        // Injectar card no onboarding
        realUI_injectScenarioCard();
        
        // Detecção automática de activação/desactivação
        setInterval(() => {
            const scenario = AppState && AppState.user ? AppState.user.scenario : null;
            const dashVisible = document.getElementById('dashboard') && document.getElementById('dashboard').style.display !== 'none';
            const shouldBeActive = scenario === 'cenario-real' && dashVisible;
            
            if (shouldBeActive && !_isActive) realScenario_start();
            if (!shouldBeActive && _isActive) realScenario_stop();
        }, 1500);
        
        // Listener de reset
        const resetBtn = document.getElementById('reset-simulation');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (_isActive) realScenario_stop();
            });
        }
        
        console.log('✅ Módulo Cenário Real inicializado.');
    }
    
    // ============================================
    // Inicialização
    // ============================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', realScenario_init);
    } else {
        setTimeout(realScenario_init, 1000);
    }
    
    // ============================================
    // Exposição Global
    // ============================================
    
    window.RealScenarioSystem = {
        isActive: realScenario_isActive,
        start: realScenario_start,
        stop: realScenario_stop,
        getTimeEngine: () => RealTimeEngine,
        getMarketEngine: () => RealMarketEngine,
        getEventEngine: () => RealEventEngine,
        processBondInterest: realBond_processInterest,
        processBondMaturity: realBond_processMaturity,
        processMaturity: realBond_processMaturity,
        updateCountdowns: realBond_updateCountdowns,
        renderInterestTable: realBond_renderInterestTable,
        processDividends: realDividend_process
    };
    
    // ============================================
    // Funções auxiliares (fallback)
    // ============================================
    
    function formatCurrency(value) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(value);
        }
        return `${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
    }
    
    function showNotification(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    function updatePortfolioUI() {
        if (typeof window.updatePortfolioUI === 'function') {
            window.updatePortfolioUI();
        }
    }
    
    function updatePortfolioMetrics() {
        if (typeof window.updatePortfolioMetrics === 'function') {
            window.updatePortfolioMetrics();
        }
    }
    
    function updateTransactionsUI() {
        if (typeof window.updateTransactionsUI === 'function') {
            window.updateTransactionsUI();
        }
    }
    
    function saveToLocalStorage() {
        if (typeof window.saveToLocalStorage === 'function') {
            window.saveToLocalStorage();
        }
    }
    
    function openTradeModal(assetId, type) {
        if (typeof window.openTradeModal === 'function') {
            window.openTradeModal(assetId, type);
        }
    }
    
})();

// ============================================
// PLUGIN 1 — TOP 10 MARKET CAP NO CENÁRIO REAL
// PROBLEMA: ext_renderMarketCapRanking() nunca é chamada no loop
//           do Cenário Real, deixando o ranking estagnado.
// ONDE INTEGRAR: Carregar este ficheiro APÓS o módulo do Cenário Real
//                (s-real-simulador-mercado-financeiro.js)
// ============================================

(function() {
    'use strict';

    // --------------------------------------------
    // Aguarda que RealScenarioSystem esteja disponível
    // --------------------------------------------
    function waitForRealScenario(callback) {
        if (window.RealScenarioSystem && window.RealScenarioSystem.isActive) {
            callback();
        } else {
            setTimeout(() => waitForRealScenario(callback), 300);
        }
    }

    // --------------------------------------------
    // Função principal: actualizar ranking
    // Usa ext_renderMarketCapRanking se existir,
    // senão usa implementação própria compatível.
    // --------------------------------------------
    function updateMarketCapRanking() {
        // Tentar usar função nativa do simulador principal
        if (typeof window.ext_renderMarketCapRanking === 'function') {
            const container = document.getElementById('ext-top-market-cap-list');
            if (container) {
                window.ext_renderMarketCapRanking();
                return;
            }
        }

        if (typeof window.ext_updateAllMarketCaps === 'function') {
            window.ext_updateAllMarketCaps();
            return;
        }

        // Implementação própria como fallback
        renderMarketCapFallback();
    }

    // --------------------------------------------
    // Fallback: renderiza o Top 10 directamente
    // caso as funções do simulador não estejam
    // disponíveis (compatível com stockInfo).
    // --------------------------------------------
    function renderMarketCapFallback() {
        const container = document.getElementById('ext-top-market-cap-list');
        if (!container) return;

        if (!AppState || !AppState.market || !AppState.market.assets) return;

        // Filtrar acções com stockInfo
        const stocks = Object.values(AppState.market.assets).filter(a =>
            a && a.type === 'acao' && a.stockInfo && a.stockInfo.sharesIssued
        );

        if (stocks.length === 0) return;

        // Calcular market cap e ordenar
        const ranked = stocks
            .map(stock => ({
                ticker:      stock.ticker || stock.id,
                name:        stock.name || stock.ticker,
                marketCap:   (stock.currentPrice || stock.initialPrice) * stock.stockInfo.sharesIssued,
                priceChange: stock.previousPrice
                    ? ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100
                    : 0
            }))
            .sort((a, b) => b.marketCap - a.marketCap)
            .slice(0, 10);

        // Formatar market cap legível
        function fmtCap(v) {
            if (v >= 1e9)  return (v / 1e9).toFixed(2)  + ' B Kz';
            if (v >= 1e6)  return (v / 1e6).toFixed(2)  + ' M Kz';
            if (v >= 1e3)  return (v / 1e3).toFixed(2)  + ' K Kz';
            return v.toFixed(2) + ' Kz';
        }

        const badges = ['🥇', '🥈', '🥉'];

        container.innerHTML = ranked.map((s, i) => {
            const pos      = i + 1;
            const badge    = badges[i] || '';
            const chgClass = s.priceChange >= 0 ? 'positive' : 'negative';
            const chgIcon  = s.priceChange >= 0 ? '📈' : '📉';
            const chgSign  = s.priceChange >= 0 ? '+' : '';

            return `
                <div class="ext-ranking-item" data-position="${pos}"
                     style="display:flex;align-items:center;gap:12px;padding:12px;
                            background:var(--gray-medium);border-radius:8px;
                            margin-bottom:8px;border-left:3px solid ${
                                pos === 1 ? 'gold' : pos === 2 ? 'silver' : pos === 3 ? '#cd7f32' : 'transparent'
                            };">
                    <span style="font-weight:700;color:var(--accent-green);
                                 min-width:35px;text-align:center;font-size:1.1rem;">
                        ${badge || pos + 'º'}
                    </span>
                    <div style="flex:1;">
                        <div style="font-weight:700;color:var(--text-white);font-size:0.95rem;">
                            ${s.ticker} — ${s.name}
                        </div>
                        <div style="color:rgba(255,255,255,0.7);font-size:0.85rem;margin-top:2px;">
                            ${fmtCap(s.marketCap)}
                        </div>
                    </div>
                    <span class="${chgClass}" style="font-weight:700;font-size:0.9rem;">
                        ${chgIcon} ${chgSign}${s.priceChange.toFixed(2)}%
                    </span>
                </div>`;
        }).join('');
    }

    // --------------------------------------------
    // Garante que o container HTML do ranking
    // existe na sidebar antes de renderizar.
    // Reutiliza o container criado por ext_injectHTML()
    // se já existir.
    // --------------------------------------------
    function ensureRankingContainerExists() {
        if (document.getElementById('ext-top-market-cap-list')) return true;

        // Criar container se não existir
        const sidebar = document.querySelector('.portfolio-summary');
        if (!sidebar) return false;

        let wrapper = document.querySelector('.ext-market-cap-ranking');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'ext-market-cap-ranking';
            wrapper.style.cssText = `
                background: var(--gray-dark);
                border: 2px solid var(--gray-medium);
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
            `;
            wrapper.innerHTML = `
                <h4 style="color:var(--accent-green);font-size:1.1rem;margin-bottom:5px;">
                    📊 Top 10 Maiores Empresas
                </h4>
                <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-bottom:15px;">
                    Por capitalização de mercado
                </p>
                <div id="ext-top-market-cap-list"></div>
            `;

            // Inserir após o painel do Cenário Real se existir, senão no fim da sidebar
            const realPanel = document.getElementById('real-scenario-panel');
            if (realPanel) {
                realPanel.insertAdjacentElement('afterend', wrapper);
            } else {
                const summaryCard = sidebar.querySelector('.summary-card');
                if (summaryCard) summaryCard.insertAdjacentElement('afterend', wrapper);
                else sidebar.appendChild(wrapper);
            }
        }

        return !!document.getElementById('ext-top-market-cap-list');
    }

    // --------------------------------------------
    // Patch principal: estende o mainTick do
    // Cenário Real para chamar updateMarketCapRanking
    // a cada tick com dias passados.
    // Usa polling para aguardar o módulo carregar.
    // --------------------------------------------
    function applyPatch() {
        // Guardar referência ao ticker original
        const _origStart = window.RealScenarioSystem.start;

        window.RealScenarioSystem.start = function() {
            _origStart.apply(this, arguments);

            // Render inicial após 600ms (tempo para DOM injectar painel)
            setTimeout(() => {
                ensureRankingContainerExists();
                updateMarketCapRanking();
            }, 600);
        };

        // Expor função de update externamente
        window.RealScenarioSystem.updateMarketCapRanking = function() {
            if (ensureRankingContainerExists()) {
                updateMarketCapRanking();
            }
        };

        // Intervalo de actualização sincronizado com o ticker do Cenário Real (30s)
        // Activa apenas quando o cenário está activo
        setInterval(() => {
            if (!window.RealScenarioSystem.isActive()) return;
            if (!ensureRankingContainerExists()) return;
            updateMarketCapRanking();
        }, 30000);

        // Actualização extra a cada 5 segundos para reflectir mudanças
        // de posição no ranking sem esperar 30s
        setInterval(() => {
            if (!window.RealScenarioSystem.isActive()) return;
            const container = document.getElementById('ext-top-market-cap-list');
            if (!container) return;
            updateMarketCapRanking();
        }, 5000);

        console.log('✅ Plugin 1 aplicado: Top 10 Market Cap no Cenário Real activado.');
    }

    // --------------------------------------------
    // Inicialização
    // --------------------------------------------
    waitForRealScenario(applyPatch);

})();

// ============================================
// PLUGIN 3 — ACUMULADO P&L COM DIVIDENDOS E JUROS
// PROBLEMA: AccumulatedPnL.calculateAll() ignora
//           AppState.portfolio.dividendHistory e
//           AppState.portfolio.bondInterestHistory.
//           O gráfico não reflecte estes ganhos.
// ONDE INTEGRAR: Carregar APÓS o módulo do Cenário Real
//                e APÓS o bloco AccumulatedPnL do simulador
// ============================================

(function() {
    'use strict';

    // --------------------------------------------
    // Aguarda AccumulatedPnL e RealScenarioSystem
    // --------------------------------------------
    function waitForDeps(callback) {
        const ready =
            window.AccumulatedPnL &&
            typeof window.AccumulatedPnL.calculateAll === 'function' &&
            window.RealScenarioSystem &&
            window.RealScenarioSystem.isActive;

        if (ready) {
            callback();
        } else {
            setTimeout(() => waitForDeps(callback), 400);
        }
    }

    // --------------------------------------------
    // Calcular totais de dividendos e juros
    // directamente dos históricos do Cenário Real
    // --------------------------------------------
    function calcDividendsTotal() {
        const history = (AppState && AppState.portfolio && AppState.portfolio.dividendHistory) || [];
        return history.reduce((sum, rec) => sum + (parseFloat(rec.total) || 0), 0);
    }

    function calcInterestTotal() {
        const history = (AppState && AppState.portfolio && AppState.portfolio.bondInterestHistory) || [];
        return history.reduce((sum, rec) => {
            const amount = parseFloat(rec.netInterestAmount || rec.interestAmount) || 0;
            return sum + amount;
        }, 0);
    }

    // --------------------------------------------
    // Garante que a categoria 'titulos' e 'acoes'
    // existem no state do AccumulatedPnL
    // --------------------------------------------
    function ensureCategories() {
        if (!AccumulatedPnL.state || !AccumulatedPnL.state.byCategory) return;

        ['acoes', 'titulos'].forEach(cat => {
            if (!AccumulatedPnL.state.byCategory[cat]) {
                AccumulatedPnL.state.byCategory[cat] = {
                    gains: 0, losses: 0, net: 0, operations: 0
                };
            }
        });
    }

    // --------------------------------------------
    // Injectar subcategorias visuais no painel P&L
    // Adiciona "Ganhos com Dividendos" e
    // "Ganhos com Juros" como linhas separadas.
    // --------------------------------------------
    function injectSubcategoryDisplay() {
        const container = document.getElementById('ext-pnl-by-type');
        if (!container) return;

        // Remover cards de subcategoria anteriores para evitar duplicação
        container.querySelectorAll('.pnl-real-subcat').forEach(el => el.remove());

        const divTotal  = calcDividendsTotal();
        const intTotal  = calcInterestTotal();

        if (divTotal <= 0 && intTotal <= 0) return;

        function fmtCurrency(v) {
            if (typeof window.formatCurrency === 'function') return window.formatCurrency(v);
            return v.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kz';
        }

        if (divTotal > 0) {
            const divCard = document.createElement('div');
            divCard.className = 'pnl-real-subcat ext-pnl-type-card';
            divCard.style.cssText = `
                background: var(--gray-medium);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid var(--success);
                margin-bottom: 10px;
            `;
            divCard.innerHTML = `
                <h5 style="color:var(--success);font-size:0.95rem;margin:0 0 10px 0;">
                    💰 Ganhos com Dividendos
                </h5>
                <div style="font-size:1.2rem;font-weight:700;color:var(--success);">
                    +${fmtCurrency(divTotal)}
                </div>
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:5px;">
                    ${(AppState.portfolio.dividendHistory || []).length} pagamento(s) recebido(s)
                </div>
            `;
            container.appendChild(divCard);
        }

        if (intTotal > 0) {
            const intCard = document.createElement('div');
            intCard.className = 'pnl-real-subcat ext-pnl-type-card';
            intCard.style.cssText = `
                background: var(--gray-medium);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid var(--accent-green);
                margin-bottom: 10px;
            `;
            intCard.innerHTML = `
                <h5 style="color:var(--accent-green);font-size:0.95rem;margin:0 0 10px 0;">
                    💵 Ganhos com Juros (Títulos)
                </h5>
                <div style="font-size:1.2rem;font-weight:700;color:var(--accent-green);">
                    +${fmtCurrency(intTotal)}
                </div>
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-top:5px;">
                    ${(AppState.portfolio.bondInterestHistory || []).length} pagamento(s) recebido(s)
                </div>
            `;
            container.appendChild(intCard);
        }
    }

    // --------------------------------------------
    // Construir array unificado de eventos para
    // o gráfico (sell + dividendos + juros),
    // ordenado por timestamp crescente.
    // --------------------------------------------
    function buildUnifiedEventTimeline() {
        const events = [];

        // 1. Transacções de venda
        const txs = (AppState && AppState.portfolio && AppState.portfolio.transactions) || [];
        txs.forEach(tx => {
            if ((tx.type === 'sell' || tx.type === 'maturity') && tx.pnl !== undefined) {
                events.push({
                    ts:     new Date(tx.timestamp).getTime() || 0,
                    pnl:    parseFloat(tx.pnl) || 0,
                    type:   'sell',
                    label:  tx.assetName || tx.assetId || 'Venda'
                });
            }
        });

        // 2. Dividendos
        const dividends = (AppState && AppState.portfolio && AppState.portfolio.dividendHistory) || [];
        dividends.forEach(rec => {
            const total = parseFloat(rec.total) || 0;
            if (total > 0) {
                events.push({
                    ts:     rec.timestamp || 0,
                    pnl:    total,
                    type:   'dividend',
                    label:  rec.ticker || 'Dividendo'
                });
            }
        });

        // 3. Juros de títulos
        const interests = (AppState && AppState.portfolio && AppState.portfolio.bondInterestHistory) || [];
        interests.forEach(rec => {
            const amount = parseFloat(rec.netInterestAmount || rec.interestAmount) || 0;
            if (amount > 0) {
                events.push({
                    ts:     new Date(rec.timestamp || 0).getTime() || 0,
                    pnl:    amount,
                    type:   'interest',
                    label:  rec.ticker || 'Juro'
                });
            }
        });

        // Ordenar por timestamp crescente
        events.sort((a, b) => a.ts - b.ts);

        return events;
    }

    // --------------------------------------------
    // Redesenhar o gráfico de evolução P&L
    // incluindo dividendos e juros na curva.
    // Sobrepõe drawChart() do AccumulatedPnL.
    // --------------------------------------------
    function patchDrawChart() {
        if (!window.AccumulatedPnL || typeof window.AccumulatedPnL.drawChart !== 'function') return;

        const _origDrawChart = window.AccumulatedPnL.drawChart.bind(window.AccumulatedPnL);

        window.AccumulatedPnL.drawChart = function() {
            const canvas = document.getElementById('ext-pnl-chart');
            if (!canvas) return;

            const events = buildUnifiedEventTimeline();

            // Se não há eventos com mix de tipos, usar gráfico original
            const hasRealEvents = events.some(e => e.type === 'dividend' || e.type === 'interest');
            if (!hasRealEvents || events.length < 2) {
                return _origDrawChart();
            }

            const ctx    = canvas.getContext('2d');
            const width  = canvas.width  = canvas.parentElement?.offsetWidth || 400;
            const height = canvas.height = 150;

            ctx.clearRect(0, 0, width, height);

            // Construir curva acumulada
            let cumulative = 0;
            const dataPoints = events.map(e => {
                cumulative += e.pnl;
                return { value: cumulative, type: e.type };
            });

            const values = dataPoints.map(d => d.value);
            const min    = Math.min(...values, 0);
            const max    = Math.max(...values, 0);
            const range  = max - min || 1;

            const pad    = 20;
            const usableW = width  - pad * 2;
            const usableH = height - pad * 2;

            // Linha de zero
            const zeroY = height - pad - ((-min) / range) * usableH;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth   = 1;
            ctx.setLineDash([4, 4]);
            ctx.moveTo(pad, zeroY);
            ctx.lineTo(width - pad, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Linha da curva
            ctx.beginPath();
            ctx.lineWidth = 2;

            dataPoints.forEach((point, i) => {
                const x = pad + (i / (dataPoints.length - 1)) * usableW;
                const y = height - pad - ((point.value - min) / range) * usableH;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            const lastVal = dataPoints[dataPoints.length - 1]?.value || 0;
            ctx.strokeStyle = lastVal >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
            ctx.stroke();

            // Área sob a curva
            ctx.lineTo(width - pad, height - pad);
            ctx.lineTo(pad, height - pad);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            if (lastVal >= 0) {
                grad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
                grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            } else {
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
                grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            ctx.fillStyle = grad;
            ctx.fill();

            // Pontos destacados: dividendos (verde) e juros (dourado)
            dataPoints.forEach((point, i) => {
                if (point.type !== 'dividend' && point.type !== 'interest') return;
                const x = pad + (i / (dataPoints.length - 1)) * usableW;
                const y = height - pad - ((point.value - min) / range) * usableH;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = point.type === 'dividend'
                    ? 'rgb(34, 197, 94)'
                    : 'rgb(214, 174, 100)';
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Legenda
            ctx.font      = 'bold 11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = lastVal >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

            const fmtCurrency = typeof window.formatCurrency === 'function'
                ? window.formatCurrency
                : v => v.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' Kz';

            ctx.fillText(fmtCurrency(lastVal), width - pad, pad - 4);

            // Legenda de ícones
            ctx.textAlign  = 'left';
            ctx.font       = '10px sans-serif';
            ctx.fillStyle  = 'rgba(255,255,255,0.5)';
            ctx.fillText('● Dividendos', pad, height - 4);

            ctx.fillStyle  = 'rgba(214,174,100,0.8)';
            ctx.fillText('● Juros', pad + 85, height - 4);
        };
    }

    // --------------------------------------------
    // Patch principal: estender calculateAll()
    // para incluir dividendos e juros
    // --------------------------------------------
    function patchCalculateAll() {
        const _origCalculateAll = window.AccumulatedPnL.calculateAll.bind(window.AccumulatedPnL);

        window.AccumulatedPnL.calculateAll = function() {
            // Executar cálculo original primeiro
            const result = _origCalculateAll();

            ensureCategories();

            // Somar dividendos do Cenário Real
            const dividendHistory = (AppState && AppState.portfolio && AppState.portfolio.dividendHistory) || [];
            dividendHistory.forEach(rec => {
                const total = parseFloat(rec.total) || 0;
                if (total > 0) {
                    AccumulatedPnL.state.totalGains += total;
                    AccumulatedPnL.state.byCategory['acoes'].gains += total;
                    AccumulatedPnL.state.byCategory['acoes'].net   += total;
                    AccumulatedPnL.state.netTotal += total;
                }
            });

            // Somar juros de títulos do Cenário Real
            const bondInterestHistory = (AppState && AppState.portfolio && AppState.portfolio.bondInterestHistory) || [];
            bondInterestHistory.forEach(rec => {
                const amount = parseFloat(rec.netInterestAmount || rec.interestAmount) || 0;
                if (amount > 0) {
                    AccumulatedPnL.state.totalGains += amount;
                    AccumulatedPnL.state.byCategory['titulos'].gains += amount;
                    AccumulatedPnL.state.byCategory['titulos'].net   += amount;
                    AccumulatedPnL.state.netTotal += amount;
                }
            });

            // Actualizar painel (updateUI e updateAppState existem no AccumulatedPnL original)
            if (typeof AccumulatedPnL.updateUI      === 'function') AccumulatedPnL.updateUI();
            if (typeof AccumulatedPnL.updateAppState === 'function') AccumulatedPnL.updateAppState();

            // Injectar subcategorias visuais
            injectSubcategoryDisplay();

            return result;
        };
    }

    // --------------------------------------------
    // Hook nas funções do Cenário Real que pagam:
    // chamar calculateAll() após cada pagamento.
    // Usa polling para aguardar que o módulo carregue
    // e depois estende via window.RealScenarioSystem.
    // --------------------------------------------
    function hookRealScenarioPayments() {
        const _origProcessDividends = window.RealScenarioSystem.processDividends;
        if (typeof _origProcessDividends === 'function') {
            window.RealScenarioSystem.processDividends = function() {
                const result = _origProcessDividends.apply(this, arguments);
                setTimeout(() => {
                    if (typeof window.AccumulatedPnL !== 'undefined' &&
                        typeof window.AccumulatedPnL.calculateAll === 'function') {
                        window.AccumulatedPnL.calculateAll();
                    }
                }, 200);
                return result;
            };
        }

        const _origProcessInterest = window.RealScenarioSystem.processBondInterest;
        if (typeof _origProcessInterest === 'function') {
            window.RealScenarioSystem.processBondInterest = function() {
                const result = _origProcessInterest.apply(this, arguments);
                setTimeout(() => {
                    if (typeof window.AccumulatedPnL !== 'undefined' &&
                        typeof window.AccumulatedPnL.calculateAll === 'function') {
                        window.AccumulatedPnL.calculateAll();
                    }
                }, 200);
                return result;
            };
        }
    }

    // --------------------------------------------
    // Reset: quando a simulação é reiniciada,
    // limpar e recalcular
    // --------------------------------------------
    function hookReset() {
        const resetBtn = document.getElementById('reset-simulation');
        if (!resetBtn) return;

        resetBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (window.AccumulatedPnL && typeof window.AccumulatedPnL.reset === 'function') {
                    window.AccumulatedPnL.reset();
                }
                // Remover subcards visuais
                document.querySelectorAll('.pnl-real-subcat').forEach(el => el.remove());
            }, 500);
        });
    }

    // --------------------------------------------
    // Aplicar todos os patches
    // --------------------------------------------
    function applyPatch() {
        patchCalculateAll();
        patchDrawChart();
        hookRealScenarioPayments();
        hookReset();

        // Recalcular imediatamente para apanhar histórico já existente
        if (typeof window.AccumulatedPnL.calculateAll === 'function') {
            setTimeout(() => window.AccumulatedPnL.calculateAll(), 300);
        }

        // Recalcular periodicamente (a cada 60s)
        setInterval(() => {
            if (!window.RealScenarioSystem.isActive()) return;
            if (typeof window.AccumulatedPnL.calculateAll === 'function') {
                window.AccumulatedPnL.calculateAll();
            }
        }, 60000);

        console.log('✅ Plugin 3 aplicado: Acumulado P&L inclui Dividendos e Juros do Cenário Real.');
    }

    waitForDeps(applyPatch);

})();

// ============================================
// PLUGIN 2 v2 — ESTATÍSTICAS DE MERCADO NO CENÁRIO REAL
// REESCRITO: abordagem directa, sem depender de
// EXT_MARKET_SIMULATION nem de patchar start().
//
// PROBLEMA ORIGINAL: waitForDeps bloqueava porque
// EXT_MARKET_SIMULATION pode nunca existir, e o
// patch em start() não corria se o cenário já
// tivesse arrancado. Os setIntervals nunca chegavam
// a executar.
//
// SOLUÇÃO: estado próprio isolado, injecção do HTML
// logo que o DOM estiver pronto, loop próprio de
// 3 segundos completamente independente do resto.
// ============================================

(function() {
    'use strict';

    // ============================================
    // ESTADO PRÓPRIO — não depende de EXT_MARKET_SIMULATION
    // ============================================
    const STATS = {
        totalInvestors:    20000000,
        currentBuyOrders:  5000,
        currentSellOrders: 4800,
        totalVolume:       0,  // acumulado total exibido (mercado + utilizador)
        _accMarketVolume:  0,  // volume de mercado simulado acumulado (cresce a cada tick)
        _userVolume:       0,  // volume real das transacções do utilizador
        _countedTxKeys:    new Set()
    };

    // ============================================
    // COMPORTAMENTO POR FASE ECONÓMICA
    // ============================================
    const PHASE_BEHAVIOUR = {
        estabilidade: { buyRatio: 0.52, actMult: 1.0,  volMult: 1.0  },
        crescimento:  { buyRatio: 0.72, actMult: 1.8,  volMult: 2.0  },
        recessao:     { buyRatio: 0.42, actMult: 1.3,  volMult: 1.2  },
        crise:        { buyRatio: 0.28, actMult: 2.2,  volMult: 1.8  },
        guerra:       { buyRatio: 0.25, actMult: 2.5,  volMult: 2.0  },
        pandemia:     { buyRatio: 0.22, actMult: 2.8,  volMult: 2.2  },
        recuperacao:  { buyRatio: 0.65, actMult: 1.5,  volMult: 1.6  }
    };

    // ============================================
    // OBTER FASE ACTUAL DO CENÁRIO REAL
    // ============================================
    function getCurrentPhase() {
        try {
            if (window.RealScenarioSystem &&
                window.RealScenarioSystem.getMarketEngine) {
                const eng = window.RealScenarioSystem.getMarketEngine();
                if (eng && typeof eng.getCurrentPhase === 'function') {
                    return eng.getCurrentPhase();
                }
            }
        } catch(e) { /* silencioso */ }
        return 'estabilidade';
    }

    // ============================================
    // VERIFICAR SE O CENÁRIO REAL ESTÁ ACTIVO
    // ============================================
    function isRealScenarioActive() {
        try {
            return window.RealScenarioSystem &&
                   typeof window.RealScenarioSystem.isActive === 'function' &&
                   window.RealScenarioSystem.isActive();
        } catch(e) {
            return false;
        }
    }

    // ============================================
    // FORMATAR MOEDA
    // ============================================
    function fmt(v) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(v);
        }
        return v.toLocaleString('pt-AO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Kz';
    }

    // ============================================
    // INJECTAR HTML DAS ESTATÍSTICAS
    // Cria os elementos na sidebar se não existirem.
    // Reutiliza os mesmos IDs do simulador principal
    // para compatibilidade total.
    // ============================================
    function injectStatsHTML() {
        // Se os elementos já existem (criados pelo simulador principal), não criar de novo
        if (document.getElementById('ext-total-investors')) {
            return true;
        }

        const sidebar = document.querySelector('.portfolio-summary');
        if (!sidebar) return false;

        const div = document.createElement('div');
        div.id = 'plugin2-market-stats';
        div.style.cssText = [
            'background:var(--gray-dark)',
            'border:2px solid var(--gray-medium)',
            'border-radius:12px',
            'padding:20px',
            'margin-top:20px'
        ].join(';');

        div.innerHTML = `
            <h4 style="color:var(--accent-green);font-size:1.1rem;
                       margin:0 0 15px 0;display:flex;align-items:center;gap:8px;">
                📊 Estatísticas do Mercado
                <span id="plugin2-phase-badge" style="
                    font-size:0.75rem;padding:2px 8px;border-radius:10px;
                    background:rgba(214,174,100,0.2);color:var(--accent-green);
                    font-weight:600;">
                    —
                </span>
            </h4>

            <div style="display:flex;flex-direction:column;gap:0;">

                <div style="display:flex;justify-content:space-between;
                            align-items:center;padding:10px 0;
                            border-bottom:1px solid var(--gray-medium);">
                    <span style="color:rgba(255,255,255,0.7);font-size:0.9rem;">
                        👥 Investidores Ativos:
                    </span>
                    <span id="ext-total-investors"
                          style="font-weight:700;color:var(--text-white);">
                        20.000.000
                    </span>
                </div>

                <div style="display:flex;justify-content:space-between;
                            align-items:center;padding:10px 0;
                            border-bottom:1px solid var(--gray-medium);">
                    <span style="color:rgba(255,255,255,0.7);font-size:0.9rem;">
                        💰 Volume Transacionado:
                    </span>
                    <span id="ext-total-volume"
                          style="font-weight:700;color:var(--text-white);">
                        0 Kz
                    </span>
                </div>

                <div style="display:flex;justify-content:space-between;
                            align-items:center;padding:10px 0;
                            border-bottom:1px solid var(--gray-medium);">
                    <span style="color:rgba(255,255,255,0.7);font-size:0.9rem;">
                        📈 Ordens de Compra:
                    </span>
                    <span id="ext-buy-orders"
                          style="font-weight:700;color:var(--success);">
                        0
                    </span>
                </div>

                <div style="display:flex;justify-content:space-between;
                            align-items:center;padding:10px 0;">
                    <span style="color:rgba(255,255,255,0.7);font-size:0.9rem;">
                        📉 Ordens de Venda:
                    </span>
                    <span id="ext-sell-orders"
                          style="font-weight:700;color:var(--danger);">
                        0
                    </span>
                </div>

            </div>

            <div style="margin-top:15px;padding:15px;
                        background:rgba(214,174,100,0.08);
                        border-radius:8px;border:1px solid var(--accent-green);">
                <div style="color:var(--accent-green);font-weight:600;
                            margin-bottom:10px;text-align:center;font-size:0.85rem;">
                    Sentimento do Mercado
                </div>
                <div style="width:100%;height:22px;background:var(--gray-medium);
                            border-radius:11px;overflow:hidden;margin-bottom:8px;">
                    <div id="ext-sentiment-fill"
                         style="height:100%;width:52%;
                                background:linear-gradient(90deg,var(--accent-green),rgb(194,154,80));
                                transition:width 0.8s ease,background 0.5s ease;">
                    </div>
                </div>
                <div id="ext-sentiment-text"
                     style="text-align:center;font-weight:700;
                            font-size:0.9rem;color:var(--accent-green);">
                    ➡️ Neutro (52.0% Compradores)
                </div>
            </div>
        `;

        // Inserir no lugar certo dentro da sidebar
        const positions = document.getElementById('real-scenario-panel') ||
                          document.querySelector('.positions-list') ||
                          sidebar.lastElementChild;

        if (positions && positions !== sidebar.lastElementChild) {
            positions.insertAdjacentElement('afterend', div);
        } else {
            sidebar.appendChild(div);
        }

        console.log('[Plugin2] HTML das estatísticas injectado.');
        return true;
    }

    // ============================================
    // ACUMULAR VOLUME DAS TRANSACÇÕES DO UTILIZADOR
    // Percorre transacções, dividendos e juros novos
    // e soma ao _userVolume. Nunca conta a mesma vez.
    // ============================================
    function accumulateUserVolume() {
        if (!window.AppState || !AppState.portfolio) return;

        // 1. Transacções de compra/venda
        (AppState.portfolio.transactions || []).forEach(tx => {
            const key = 'tx_' + (tx.timestamp || '') + '_' +
                        (tx.assetId || '') + '_' + (tx.total || 0);
            if (STATS._countedTxKeys.has(key)) return;
            STATS._countedTxKeys.add(key);
            const total = parseFloat(tx.total) || 0;
            if (total > 0) STATS._userVolume += total;
        });

        // 2. Dividendos recebidos
        (AppState.portfolio.dividendHistory || []).forEach(rec => {
            const key = 'div_' + (rec.id || rec.timestamp || '') + '_' + (rec.total || 0);
            if (STATS._countedTxKeys.has(key)) return;
            STATS._countedTxKeys.add(key);
            const total = parseFloat(rec.total) || 0;
            if (total > 0) STATS._userVolume += total;
        });

        // 3. Juros de títulos recebidos
        (AppState.portfolio.bondInterestHistory || []).forEach(rec => {
            const amount = parseFloat(rec.netInterestAmount || rec.interestAmount) || 0;
            const key = 'int_' + (rec.id || rec.timestamp || '') + '_' + amount;
            if (STATS._countedTxKeys.has(key)) return;
            STATS._countedTxKeys.add(key);
            if (amount > 0) STATS._userVolume += amount;
        });
    }

    // ============================================
    // CALCULAR ORDENS E VOLUME COM BASE NA FASE E NOS PREÇOS
    // ============================================
    function computeOrders() {
        const phase  = getCurrentPhase();
        const bhv    = PHASE_BEHAVIOUR[phase] || PHASE_BEHAVIOUR.estabilidade;
        const assets = (window.AppState && AppState.market)
                       ? Object.values(AppState.market.assets)
                       : [];

        let rawBuy        = 0;
        let rawSell       = 0;
        let volumeThisTick = 0;

        assets.forEach(asset => {
            if (!asset || !asset.currentPrice) return;

            const type = asset.type || '';
            const isTraded = (
                type === 'acao'     || type === 'cripto' ||
                type === 'acao-us'  || type === 'us-acao' ||
                type === 'etf'      || type === 'moeda'
            );
            if (!isTraded) return;

            const prev   = asset.previousPrice || asset.initialPrice || asset.currentPrice;
            const curr   = asset.currentPrice;

            // Variação percentual absoluta deste tick
            const changePct = Math.abs((curr - prev) / (prev || 1));

            // Ordens: base proporcional à variação e à fase
            const base = Math.floor(changePct * 8000 * bhv.actMult + 150);
            const rnd  = 0.75 + Math.random() * 0.5;

            const buyThisAsset  = Math.floor(base * bhv.buyRatio        * rnd);
            const sellThisAsset = Math.floor(base * (1 - bhv.buyRatio)  * rnd);

            rawBuy  += buyThisAsset;
            rawSell += sellThisAsset;

            // VOLUME DESTE TICK:
            // Cada ordem movimenta em média 1 a 10 unidades do activo.
            // Volume = (ordens compra + venda) × preço actual × unidades médias × volMult da fase.
            // Sem factor de escala — os valores devem ser reais e visíveis.
            const unidadesMedias = 1 + Math.random() * 9;
            volumeThisTick += (buyThisAsset + sellThisAsset) * curr * unidadesMedias * bhv.volMult;
        });

        // Acumular volume de mercado simulado.
        // volumeThisTick já está em Kz (preço × unidades × volMult).
        // Acumula continuamente — nunca reseta (como volume real de bolsa).
        STATS._accMarketVolume += volumeThisTick;

        // Total exibido = volume das transacções reais do utilizador
        //               + volume simulado do mercado acumulado
        STATS.totalVolume = STATS._userVolume + STATS._accMarketVolume;

        // Blend suave nas ordens (evitar saltos bruscos)
        const newTotal = Math.max(500, rawBuy + rawSell);

        STATS.currentBuyOrders  = Math.floor(
            STATS.currentBuyOrders  * 0.4 + newTotal * bhv.buyRatio       * 0.6
        );
        STATS.currentSellOrders = Math.floor(
            STATS.currentSellOrders * 0.4 + newTotal * (1 - bhv.buyRatio) * 0.6
        );

        // Mínimos realistas
        if (STATS.currentBuyOrders  < 100) STATS.currentBuyOrders  = 100 + Math.floor(Math.random() * 200);
        if (STATS.currentSellOrders < 100) STATS.currentSellOrders = 100 + Math.floor(Math.random() * 200);

        // Micro-variação para parecer vivo
        STATS.currentBuyOrders  += Math.floor((Math.random() - 0.5) * 100);
        STATS.currentSellOrders += Math.floor((Math.random() - 0.5) * 100);

        if (STATS.currentBuyOrders  < 0) STATS.currentBuyOrders  = 0;
        if (STATS.currentSellOrders < 0) STATS.currentSellOrders = 0;
    }

    // ============================================
    // ACTUALIZAR O DOM
    // ============================================
    function updateDOM() {
        const phase = getCurrentPhase();
        const bhv   = PHASE_BEHAVIOUR[phase] || PHASE_BEHAVIOUR.estabilidade;

        // Badge da fase no título
        const badge = document.getElementById('plugin2-phase-badge');
        if (badge) {
            const phaseNames = {
                estabilidade: '📊 Estabilidade',
                crescimento:  '📈 Crescimento',
                recessao:     '📉 Recessão',
                crise:        '⚠️ Crise',
                guerra:       '⚔️ Guerra',
                pandemia:     '🦠 Pandemia',
                recuperacao:  '🌱 Recuperação'
            };
            badge.textContent = phaseNames[phase] || phase;
        }

        // Investidores (flutua levemente)
        const invEl = document.getElementById('ext-total-investors');
        if (invEl) {
            const variation = Math.floor((Math.random() - 0.5) * 50000);
            STATS.totalInvestors = Math.max(19000000,
                Math.min(21000000, STATS.totalInvestors + variation));
            invEl.textContent = STATS.totalInvestors.toLocaleString('pt-AO');
        }

        // Volume
        const volEl = document.getElementById('ext-total-volume');
        if (volEl) volEl.textContent = fmt(STATS.totalVolume);

        // Ordens
        const buyEl  = document.getElementById('ext-buy-orders');
        const sellEl = document.getElementById('ext-sell-orders');
        if (buyEl)  buyEl.textContent  = STATS.currentBuyOrders.toLocaleString('pt-AO');
        if (sellEl) sellEl.textContent = STATS.currentSellOrders.toLocaleString('pt-AO');

        // Sentimento
        const fillEl = document.getElementById('ext-sentiment-fill');
        const textEl = document.getElementById('ext-sentiment-text');
        if (!fillEl || !textEl) return;

        const total  = STATS.currentBuyOrders + STATS.currentSellOrders || 1;
        const buyPct = (STATS.currentBuyOrders / total) * 100;

        fillEl.style.width = buyPct.toFixed(1) + '%';

        if (buyPct >= 60) {
            fillEl.style.background =
                'linear-gradient(90deg, var(--success), rgb(25,175,75))';
            textEl.textContent = `📈 Otimista (${buyPct.toFixed(1)}% Compradores)`;
            textEl.style.color = 'var(--success)';
        } else if (buyPct >= 45) {
            fillEl.style.background =
                'linear-gradient(90deg, var(--accent-green), rgb(194,154,80))';
            textEl.textContent = `➡️ Neutro (${buyPct.toFixed(1)}% Compradores)`;
            textEl.style.color = 'var(--accent-green)';
        } else {
            fillEl.style.background =
                'linear-gradient(90deg, var(--danger), rgb(220,50,50))';
            textEl.textContent = `📉 Pessimista (${buyPct.toFixed(1)}% Compradores)`;
            textEl.style.color = 'var(--danger)';
        }
    }

    // ============================================
    // TICK COMPLETO: calcular + acumular + renderizar
    // ============================================
    function tick() {
        // Só actualiza se o cenário real estiver activo
        if (!isRealScenarioActive()) return;

        // Garantir que o HTML existe
        if (!injectStatsHTML()) return;

        // Ordem correcta:
        // 1. acumular transacções do utilizador em _userVolume
        // 2. calcular ordens + volume de mercado (usa _userVolume no total)
        // 3. renderizar
        accumulateUserVolume();
        computeOrders();
        updateDOM();
    }

    // ============================================
    // ARRANQUE: tentar injectar HTML logo que o
    // dashboard apareça, e iniciar o loop próprio.
    // Não depende de EXT_MARKET_SIMULATION nem de
    // patchar start(). Usa um polling simples.
    // ============================================
    function boot() {
        // Verificar se o dashboard está visível
        const dashboard = document.getElementById('dashboard');
        if (!dashboard || dashboard.style.display === 'none') {
            setTimeout(boot, 500);
            return;
        }

        // Tentar injectar HTML (pode falhar se a sidebar ainda não existir)
        injectStatsHTML();

        // Loop principal: 3 segundos para visualização fluida
        setInterval(tick, 3000);

        // Expor para uso externo e debug
        window.RealMarketStats = {
            tick,
            getStats: () => ({ ...STATS }),
            forceUpdate: () => { computeOrders(); accumulateUserVolume(); updateDOM(); }
        };

        // Se RealScenarioSystem existir, expor também aí
        if (window.RealScenarioSystem) {
            window.RealScenarioSystem.updateMarketStats = () => {
                computeOrders();
                accumulateUserVolume();
                updateDOM();
            };
        }

        console.log('[Plugin2 v2] Estatísticas de Mercado activas. Loop a cada 3s.');
    }

    // ============================================
    // INICIAR: esperar DOM pronto
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        // DOM já pronto — esperar um pouco para o simulador inicializar
        setTimeout(boot, 1500);
    }

})();

// ============================================
// PLUGIN: VOLUME TOTAL TRANSACIONADO
// Resolve o problema do volume não actualizar
// no Cenário Real.
//
// CAUSA DO PROBLEMA ANTERIOR:
// O volume dependia de (changePct × ordens × preço).
// Quando changePct ≈ 0 (activos quase estáticos),
// o volume por tick era quase zero — invisível no
// display. O acumulado crescia mas tão devagar que
// parecia estático.
//
// SOLUÇÃO:
// Volume base garantido por tick, escalado pela
// fase económica e pelos preços actuais dos activos.
// Cresce de forma visível e contínua.
// Inclui transacções reais do utilizador.
//
// ONDE CARREGAR: após plugin2_market_stats_v2.js
// ============================================

(function() {
    'use strict';

    // ============================================
    // VOLUME BASE POR FASE (em Kz por tick de 3s)
    // Valores calibrados para serem visíveis
    // e realistas relativamente ao saldo inicial
    // ============================================
    const VOLUME_BASE_POR_FASE = {
        estabilidade: 8_000_000,
        crescimento:  25_000_000,
        recessao:     12_000_000,
        crise:        35_000_000,
        guerra:       40_000_000,
        pandemia:     45_000_000,
        recuperacao:  18_000_000
    };

    // Volume mínimo garantido por tick (independente da fase)
    const VOLUME_MINIMO_POR_TICK = 5_000_000;

    // Acumulador de volume de mercado — cresce continuamente
    let _volumeMercado   = 0;
    // Volume das transacções reais do utilizador
    let _volumeUtilizador = 0;
    // Chaves já contadas para não duplicar
    const _jaContados    = new Set();
    // Valor exibido no display (actualiza suavemente)
    let _volumeDisplay   = 0;

    // ============================================
    // OBTER FASE ACTUAL
    // ============================================
    function getFase() {
        try {
            if (window.RealScenarioSystem &&
                window.RealScenarioSystem.getMarketEngine) {
                const eng = window.RealScenarioSystem.getMarketEngine();
                if (eng && typeof eng.getCurrentPhase === 'function') {
                    return eng.getCurrentPhase();
                }
            }
        } catch (e) {}
        return 'estabilidade';
    }

    // ============================================
    // VERIFICAR SE CENÁRIO REAL ESTÁ ACTIVO
    // ============================================
    function cenarioActivo() {
        try {
            return !!(window.RealScenarioSystem &&
                      typeof window.RealScenarioSystem.isActive === 'function' &&
                      window.RealScenarioSystem.isActive());
        } catch (e) {
            return false;
        }
    }

    // ============================================
    // CALCULAR MULTIPLICADOR DE PREÇOS
    // Usa a média dos preços actuais dos activos
    // para escalar o volume proporcionalmente.
    // Se os activos valem mais, o volume é maior.
    // ============================================
    function getMultiplicadorPrecos() {
        if (!window.AppState || !AppState.market || !AppState.market.assets) {
            return 1;
        }

        const assets = Object.values(AppState.market.assets);
        let soma = 0;
        let count = 0;

        assets.forEach(asset => {
            if (!asset || !asset.currentPrice) return;
            const tipo = asset.type || '';
            if (tipo === 'acao' || tipo === 'cripto' || tipo === 'etf') {
                soma  += asset.currentPrice;
                count++;
            }
        });

        if (count === 0) return 1;

        const mediaPreco = soma / count;

        // Normalizar: preço médio de 1000 Kz → multiplicador 1.0
        // preço médio de 10.000 Kz → multiplicador ~3
        // preço médio de 100 Kz   → multiplicador ~0.5
        return Math.max(0.3, Math.min(10, Math.log10(mediaPreco / 100 + 1) + 0.5));
    }

    // ============================================
    // ACUMULAR TRANSACÇÕES REAIS DO UTILIZADOR
    // Conta compras, vendas, dividendos e juros
    // ============================================
    function acumularVolumeutilizador() {
        if (!window.AppState || !AppState.portfolio) return;

        // Compras e vendas
        (AppState.portfolio.transactions || []).forEach(tx => {
            const chave = 'tx|' + (tx.timestamp || '') + '|' + (tx.assetId || '') + '|' + (tx.total || 0);
            if (_jaContados.has(chave)) return;
            _jaContados.add(chave);
            const val = parseFloat(tx.total) || 0;
            if (val > 0) _volumeUtilizador += val;
        });

        // Dividendos
        (AppState.portfolio.dividendHistory || []).forEach(rec => {
            const chave = 'div|' + (rec.id || rec.timestamp || '') + '|' + (rec.total || 0);
            if (_jaContados.has(chave)) return;
            _jaContados.add(chave);
            const val = parseFloat(rec.total) || 0;
            if (val > 0) _volumeUtilizador += val;
        });

        // Juros de títulos
        (AppState.portfolio.bondInterestHistory || []).forEach(rec => {
            const val   = parseFloat(rec.netInterestAmount || rec.interestAmount) || 0;
            const chave = 'juro|' + (rec.id || rec.timestamp || '') + '|' + val;
            if (_jaContados.has(chave)) return;
            _jaContados.add(chave);
            if (val > 0) _volumeUtilizador += val;
        });
    }

    // ============================================
    // CALCULAR VOLUME DE MERCADO DESTE TICK
    // Volume = base da fase × multiplicador de preços
    //        × variação aleatória realista
    // ============================================
    function calcularVolumeTick() {
        const fase   = getFase();
        const base   = VOLUME_BASE_POR_FASE[fase] || VOLUME_BASE_POR_FASE.estabilidade;
        const multP  = getMultiplicadorPrecos();

        // Variação aleatória: ±40% do base para parecer orgânico
        const variacao = 0.6 + Math.random() * 0.8;

        // Volume garantido mínimo + base escalado
        const volumeTick = Math.max(
            VOLUME_MINIMO_POR_TICK,
            base * multP * variacao
        );

        return volumeTick;
    }

    // ============================================
    // FORMATAR VOLUME PARA DISPLAY
    // Usa formatCurrency do simulador ou fallback
    // ============================================
    function formatarVolume(v) {
        if (typeof window.formatCurrency === 'function') {
            return window.formatCurrency(v);
        }
        // Fallback com abreviação para valores grandes
        if (v >= 1_000_000_000) {
            return (v / 1_000_000_000).toFixed(2) + ' B Kz';
        }
        if (v >= 1_000_000) {
            return (v / 1_000_000).toFixed(2) + ' M Kz';
        }
        if (v >= 1_000) {
            return (v / 1_000).toFixed(2) + ' K Kz';
        }
        return v.toLocaleString('pt-AO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' Kz';
    }

    // ============================================
    // ACTUALIZAR O ELEMENTO #ext-total-volume
    // Aplica transição suave no valor exibido
    // ============================================
    function actualizarDisplay() {
        const el = document.getElementById('ext-total-volume');
        if (!el) return;

        const totalReal = _volumeMercado + _volumeUtilizador;

        // Transição suave: 30% do valor actual + 70% do alvo
        // Evita saltos bruscos no display
        _volumeDisplay = _volumeDisplay * 0.3 + totalReal * 0.7;

        el.textContent = formatarVolume(_volumeDisplay);

        // Efeito visual: highlight breve quando o valor muda
        el.style.transition = 'color 0.3s ease';
        el.style.color = 'var(--accent-green)';
        setTimeout(() => {
            if (el) el.style.color = 'var(--text-white)';
        }, 600);
    }

    // ============================================
    // TICK PRINCIPAL
    // Chamado a cada 3 segundos
    // ============================================
    function tick() {
        if (!cenarioActivo()) return;

        // 1. Acumular transacções reais do utilizador
        acumularVolumeutilizador();

        // 2. Calcular e acumular volume de mercado deste tick
        const volumeTick = calcularVolumeTick();
        _volumeMercado += volumeTick;

        // 3. Actualizar display
        actualizarDisplay();
    }

    // ============================================
    // SINCRONIZAR COM PLUGIN2 (se existir)
    // Actualiza STATS._accMarketVolume e
    // STATS._userVolume do plugin2 para consistência
    // ============================================
    function sincronizarComPlugin2() {
        // Aceder ao STATS do plugin2 via window se exposto
        // (o plugin2 expõe window.RealMarketStats)
        if (window.RealMarketStats && typeof window.RealMarketStats.forceUpdate === 'function') {
            // Plugin2 existe — sincronizar valores
            // O plugin2 irá recalcular o seu próprio volume
            // Este plugin sobrepõe apenas o elemento #ext-total-volume
        }
    }

    // ============================================
    // RESET: quando a simulação reinicia
    // ============================================
    function reset() {
        _volumeMercado    = 0;
        _volumeUtilizador = 0;
        _volumeDisplay    = 0;
        _jaContados.clear();

        const el = document.getElementById('ext-total-volume');
        if (el) el.textContent = formatarVolume(0);
    }

    // ============================================
    // ARRANQUE
    // ============================================
    function boot() {
        // Loop a cada 3 segundos — mesma cadência do plugin2
        setInterval(tick, 3000);

        // Tick imediato ao arrancar (para não esperar 3s)
        setTimeout(tick, 800);

        // Listener de reset da simulação
        const resetBtn = document.getElementById('reset-simulation');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                setTimeout(reset, 300);
            });
        }

        // Expor para debug e integração
        window.VolumePlugin = {
            getVolumeMercado:    () => _volumeMercado,
            getVolumeUtilizador: () => _volumeUtilizador,
            getVolumeTotal:      () => _volumeMercado + _volumeUtilizador,
            reset,
            tick,
            forceTick: () => {
                acumularVolumeutilizador();
                _volumeMercado += calcularVolumeTick();
                actualizarDisplay();
            }
        };

        console.log('[VolumePlugin] Activo. Volume actualiza a cada 3s com base no Cenário Real.');
    }

    // Esperar DOM pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1200));
    } else {
        setTimeout(boot, 1200);
    }

})();

// FIM DO MÓDULO CENÁRIO REAL

// ============================================
// PLUGIN BUG 3: INDICADORES AVANÇADOS PERSISTENTES
// ============================================
// PROBLEMA: Beta, Sharpe Ratio e Max Drawdown resetam quando não há posições abertas
// SOLUÇÃO: Motor persistente baseado em histórico de retornos acumulados
// ONDE INSERIR: Após a definição do módulo AdvancedIndicators, antes de sua inicialização
// ============================================

(function() {
    'use strict';
    
    // Histórico persistente de retornos
    let _returnsHistory = [];
    let _valueHistory = []; // Para drawdown
    let _lastCalculatedIndicators = {
        beta: null,
        sharpeRatio: null,
        maxDrawdown: null,
        lastUpdate: null,
        hasSufficientData: false
    };
    
    // Taxa livre de risco (título público 10% ao ano)
    const RISK_FREE_RATE = 0.10;
    
    // Função para registrar retorno de uma operação
    function recordReturn(amount, costBasis, type, timestamp) {
        if (costBasis <= 0) return;
        
        const returnRate = amount / costBasis;
        _returnsHistory.push({
            timestamp: timestamp || Date.now(),
            returnRate: returnRate,
            amount: amount,
            costBasis: costBasis,
            type: type
        });
        
        // Manter últimos 200 retornos para performance
        if (_returnsHistory.length > 200) {
            _returnsHistory = _returnsHistory.slice(-200);
        }
        
        // Atualizar valor histórico
        _updateValueHistory();
        
        // Recalcular indicadores
        _recalculateIndicators();
        
        // Salvar no AppState para persistência
        _saveToAppState();
    }
    
    // Função para registrar dividendo como retorno
    function recordDividend(amount, positionValue) {
        if (amount <= 0) return;
        recordReturn(amount, positionValue || amount, 'dividend');
    }
    
    // Função para registrar juro como retorno
    function recordInterest(amount, principalValue) {
        if (amount <= 0) return;
        recordReturn(amount, principalValue || amount, 'interest');
    }
    
    // Atualizar histórico de valor da carteira
    function _updateValueHistory() {
        const currentValue = AppState?.portfolio?.currentValue || AppState?.user?.availableBalance || 0;
        _valueHistory.push({
            timestamp: Date.now(),
            value: currentValue
        });
        
        // Manter últimos 500 pontos
        if (_valueHistory.length > 500) {
            _valueHistory = _valueHistory.slice(-500);
        }
    }
    
    // Calcular Beta (volatilidade vs mercado)
    function _calculateBeta() {
        if (_returnsHistory.length < 10) return null;
        
        // Usar retornos do portfólio
        const portfolioReturns = _returnsHistory.map(r => r.returnRate);
        
        // Simular retorno de mercado baseado na média dos retornos
        const marketReturns = [];
        for (let i = 5; i < portfolioReturns.length; i++) {
            const slice = portfolioReturns.slice(i - 5, i);
            marketReturns.push(slice.reduce((a, b) => a + b, 0) / slice.length);
        }
        
        const recentReturns = portfolioReturns.slice(-marketReturns.length);
        
        const meanPortfolio = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
        const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;
        
        let covariance = 0, variance = 0;
        for (let i = 0; i < recentReturns.length; i++) {
            covariance += (recentReturns[i] - meanPortfolio) * (marketReturns[i] - meanMarket);
            variance += Math.pow(marketReturns[i] - meanMarket, 2);
        }
        
        const beta = variance > 0 ? covariance / variance : 1;
        return Math.min(3, Math.max(0.5, beta));
    }
    
    // Calcular Sharpe Ratio
    function _calculateSharpeRatio() {
        if (_returnsHistory.length < 5) return null;
        
        const returns = _returnsHistory.map(r => r.returnRate);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        
        const variance = returns.reduce((sq, r) => sq + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance) || 0.01;
        
        // Retorno anualizado (assumindo 252 dias úteis)
        const annualizedReturn = Math.pow(1 + avgReturn, 252) - 1;
        const sharpe = (annualizedReturn - RISK_FREE_RATE) / (stdDev * Math.sqrt(252));
        
        return Math.max(-2, Math.min(3, sharpe));
    }
    
    // Calcular Max Drawdown real
    function _calculateMaxDrawdown() {
        if (_valueHistory.length < 10) return null;
        
        let peak = _valueHistory[0].value;
        let maxDrawdown = 0;
        
        for (let i = 1; i < _valueHistory.length; i++) {
            const currentValue = _valueHistory[i].value;
            if (currentValue > peak) peak = currentValue;
            const drawdown = (peak - currentValue) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        
        return maxDrawdown * 100;
    }
    
    // Recalcular todos os indicadores
    function _recalculateIndicators() {
        const hasSufficientData = _returnsHistory.length >= 5 && _valueHistory.length >= 10;
        
        _lastCalculatedIndicators = {
            beta: hasSufficientData ? _calculateBeta() : null,
            sharpeRatio: hasSufficientData ? _calculateSharpeRatio() : null,
            maxDrawdown: hasSufficientData ? _calculateMaxDrawdown() : null,
            lastUpdate: Date.now(),
            hasSufficientData: hasSufficientData,
            dataPoints: _returnsHistory.length
        };
        
        // Atualizar display
        _updateDisplay();
    }
    
    // Atualizar display no painel AdvancedIndicators
    function _updateDisplay() {
        // Encontrar elementos no painel
        const indicatorItems = document.querySelectorAll('.ext-indicator-item');
        if (indicatorItems.length === 0) return;
        
        // Mapear indicadores
        const indicators = {
            beta: indicatorItems[0],
            sharpe: indicatorItems[1],
            drawdown: indicatorItems[2]
        };
        
        if (!_lastCalculatedIndicators.hasSufficientData) {
            // Mostrar mensagem de dados insuficientes
            if (indicators.beta) {
                const valueEl = indicators.beta.querySelector('.value');
                if (valueEl) valueEl.textContent = '---';
                const interpretEl = indicators.beta.querySelector('.interpretation');
                if (interpretEl) interpretEl.textContent = 'Aguardando dados';
            }
            if (indicators.sharpe) {
                const valueEl = indicators.sharpe.querySelector('.value');
                if (valueEl) valueEl.textContent = '---';
                const interpretEl = indicators.sharpe.querySelector('.interpretation');
                if (interpretEl) interpretEl.textContent = `Precisa de ${5 - _returnsHistory.length} operações`;
            }
            if (indicators.drawdown) {
                const valueEl = indicators.drawdown.querySelector('.value');
                if (valueEl) valueEl.textContent = '---';
                const interpretEl = indicators.drawdown.querySelector('.interpretation');
                if (interpretEl) interpretEl.textContent = `Precisa de ${10 - _valueHistory.length} ticks`;
            }
            return;
        }
        
        // Atualizar Beta
        if (indicators.beta && _lastCalculatedIndicators.beta !== null) {
            const beta = _lastCalculatedIndicators.beta;
            const valueEl = indicators.beta.querySelector('.value');
            if (valueEl) valueEl.textContent = beta.toFixed(2);
            
            const interpretEl = indicators.beta.querySelector('.interpretation');
            if (interpretEl) {
                if (beta > 1.2) interpretEl.textContent = 'Alta volatilidade';
                else if (beta < 0.8) interpretEl.textContent = 'Baixa volatilidade';
                else interpretEl.textContent = 'Volatilidade média';
            }
            
            const classEl = indicators.beta;
            if (beta > 1.2) classEl.classList.add('danger');
            else if (beta < 0.8) classEl.classList.add('good');
            else classEl.classList.add('neutral');
        }
        
        // Atualizar Sharpe Ratio
        if (indicators.sharpe && _lastCalculatedIndicators.sharpeRatio !== null) {
            const sharpe = _lastCalculatedIndicators.sharpeRatio;
            const valueEl = indicators.sharpe.querySelector('.value');
            if (valueEl) valueEl.textContent = sharpe.toFixed(2);
            
            const interpretEl = indicators.sharpe.querySelector('.interpretation');
            if (interpretEl) {
                if (sharpe > 1) interpretEl.textContent = 'Excelente retorno ajustado';
                else if (sharpe > 0) interpretEl.textContent = 'Retorno positivo';
                else interpretEl.textContent = 'Retorno abaixo do risco';
            }
            
            const classEl = indicators.sharpe;
            if (sharpe > 1) classEl.classList.add('good');
            else if (sharpe > 0) classEl.classList.add('neutral');
            else classEl.classList.add('danger');
        }
        
        // Atualizar Max Drawdown
        if (indicators.drawdown && _lastCalculatedIndicators.maxDrawdown !== null) {
            const drawdown = _lastCalculatedIndicators.maxDrawdown;
            const valueEl = indicators.drawdown.querySelector('.value');
            if (valueEl) valueEl.textContent = `${drawdown.toFixed(1)}%`;
            
            const interpretEl = indicators.drawdown.querySelector('.interpretation');
            if (interpretEl) {
                if (drawdown > 20) interpretEl.textContent = 'Alto risco';
                else if (drawdown > 10) interpretEl.textContent = 'Risco moderado';
                else interpretEl.textContent = 'Risco controlado';
            }
            
            const classEl = indicators.drawdown;
            if (drawdown > 20) classEl.classList.add('danger');
            else if (drawdown > 10) classEl.classList.add('warning');
            else classEl.classList.add('good');
        }
    }
    
    // Salvar no AppState para persistência
    function _saveToAppState() {
        if (!AppState || !AppState.portfolio) return;
        
        if (!AppState.portfolio.persistentIndicators) {
            AppState.portfolio.persistentIndicators = {};
        }
        
        AppState.portfolio.persistentIndicators = {
            returnsHistory: _returnsHistory.slice(-100),
            valueHistory: _valueHistory.slice(-100),
            lastCalculated: { ..._lastCalculatedIndicators }
        };
    }
    
    // Carregar estado persistente
    function _loadPersistentState() {
        if (AppState?.portfolio?.persistentIndicators) {
            const saved = AppState.portfolio.persistentIndicators;
            if (saved.returnsHistory) _returnsHistory = saved.returnsHistory;
            if (saved.valueHistory) _valueHistory = saved.valueHistory;
            if (saved.lastCalculated) _lastCalculatedIndicators = saved.lastCalculated;
        }
        
        // Se não houver histórico, inicializar com valor inicial
        if (_valueHistory.length === 0 && AppState?.user?.initialBalance) {
            _valueHistory.push({
                timestamp: Date.now(),
                value: AppState.user.initialBalance
            });
        }
        
        _recalculateIndicators();
    }
    
    // Resetar indicadores (apenas quando reiniciar simulação)
    function reset() {
        _returnsHistory = [];
        _valueHistory = [];
        _lastCalculatedIndicators = {
            beta: null,
            sharpeRatio: null,
            maxDrawdown: null,
            lastUpdate: null,
            hasSufficientData: false
        };
        
        // Inicializar com valor inicial
        if (AppState?.user?.initialBalance) {
            _valueHistory.push({
                timestamp: Date.now(),
                value: AppState.user.initialBalance
            });
        }
        
        _recalculateIndicators();
        _saveToAppState();
    }
    
    // Setup hooks nas operações
    function _setupHooks() {
        // Vendas
        const _originalSell = window.sellAsset;
        if (_originalSell) {
            window.sellAsset = function() {
                const result = _originalSell.apply(this, arguments);
                if (result && result.success && result.pnl !== undefined) {
                    const costBasis = result.transaction?.costBasis || result.costBasis;
                    if (costBasis && costBasis > 0) {
                        recordReturn(result.pnl, costBasis, 'sell');
                    }
                }
                return result;
            };
        }
        
        // Dividendos
        const _originalProcessDividends = window.processDividends;
        if (_originalProcessDividends) {
            window.processDividends = function() {
                const result = _originalProcessDividends.apply(this, arguments);
                if (result && result.totalDividendsPaid > 0) {
                    recordDividend(result.totalDividendsPaid, result.totalDividendsPaid / 0.15);
                }
                return result;
            };
        }
        
        // Juros
        const _originalProcessInterest = window.processBondInterestPayments || window.realBond_processInterest;
        if (_originalProcessInterest) {
            window.processBondInterestPayments = function() {
                const result = _originalProcessInterest.apply(this, arguments);
                if (result && result.totalPaid > 0) {
                    recordInterest(result.totalPaid, result.totalPaid / 0.10);
                }
                return result;
            };
        }
        
        // Atualizar valor do portfólio a cada tick
        const _originalUpdateMetrics = window.updatePortfolioMetrics;
        if (_originalUpdateMetrics) {
            window.updatePortfolioMetrics = function() {
                const result = _originalUpdateMetrics.apply(this, arguments);
                _updateValueHistory();
                return result;
            };
        }
    }
    
    // Expor funções globalmente
    window.PersistentIndicators = {
        recordReturn: recordReturn,
        recordDividend: recordDividend,
        recordInterest: recordInterest,
        getIndicators: () => ({ ..._lastCalculatedIndicators }),
        getHistory: () => ({ returns: [..._returnsHistory], values: [..._valueHistory] }),
        reset: reset,
        update: _recalculateIndicators,
        init: function() {
            _loadPersistentState();
            _setupHooks();
            
            // Atualização periódica
            setInterval(() => {
                _updateValueHistory();
                _recalculateIndicators();
            }, 30000);
            
            // Hook no reset da simulação
            const resetBtn = document.getElementById('reset-simulation');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    setTimeout(reset, 100);
                });
            }
            
            console.log('✅ Indicadores persistentes inicializados');
        }
    };
    
    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.PersistentIndicators.init());
    } else {
        setTimeout(() => window.PersistentIndicators.init(), 1000);
    }
    
    console.log('✅ Plugin BUG 3: Indicadores Avançados Persistentes carregado');
})();
