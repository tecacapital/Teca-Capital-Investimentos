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


// FIM DO MÓDULO CENÁRIO REAL