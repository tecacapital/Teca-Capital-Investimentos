// ========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ========================================

        // ========================================
        // SISTEMA DE MARKET CAP E RANKING
        // ========================================

        // Inicializar dados de Market Cap para todas as ações
        function ext_initializeMarketCapData() {
            console.log('Inicializando dados de Market Cap...');
            
            ASSETS_DATABASE.acoes.forEach(asset => {
                // Gerar dados aleatórios realistas para cada ação
                const sharesIssued = Math.floor(Math.random() * (1000000000 - 10000000 + 1)) + 10000000; // 10M a 1B
                const outstandingPercentage = Math.random() * 0.05 + 0.90; // 90-95%
                const freeFloatPercentage = Math.random() * 0.5 + 0.30; // 30-80%
                
                asset.stockInfo = {
                    sharesIssued: sharesIssued,
                    sharesOutstanding: Math.floor(sharesIssued * outstandingPercentage),
                    freeFloat: Math.floor(sharesIssued * outstandingPercentage * freeFloatPercentage),
                    lockedShares: Math.floor(sharesIssued * (1 - outstandingPercentage))
                };
                
                console.log(`Dados de ${asset.ticker}:`, asset.stockInfo);
            });
        }

        // Calcular Market Cap para um ativo específico
        function ext_calculateMarketCap(asset) {
            if (!asset || !asset.stockInfo || !asset.stockInfo.sharesIssued) {
                console.warn(`Ativo ${asset?.ticker || 'desconhecido'} não tem dados de Market Cap`);
                return {
                    marketCapKz: 0,
                    marketCapFormatted: 'N/A',
                    pricePerShare: 0
                };
            }
            
            const price = asset.currentPrice || asset.initialPrice;
            const marketCap = price * asset.stockInfo.sharesIssued;
            
            return {
                marketCapKz: marketCap,
                marketCapFormatted: formatMarketCap(marketCap),
                pricePerShare: price,
                sharesIssued: asset.stockInfo.sharesIssued,
                sharesOutstanding: asset.stockInfo.sharesOutstanding,
                outstandingPercentage: (asset.stockInfo.sharesOutstanding / asset.stockInfo.sharesIssued * 100).toFixed(1)
            };
        }

        // Formatar Market Cap para exibição legível
        function formatMarketCap(value) {
            if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(2)} B Kz`;
            }
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(2)} M Kz`;
            }
            if (value >= 1000) {
                return `${(value / 1000).toFixed(2)} K Kz`;
            }
            return `${value.toFixed(2)} Kz`;
        }

        // Formatar quantidade de ações
        function formatShares(value) {
            if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(2)} B`;
            }
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(2)} M`;
            }
            if (value >= 1000) {
                return `${(value / 1000).toFixed(2)} K`;
            }
            return value.toLocaleString('pt-AO');
        }

        // Adicionar informações de Market Cap aos cards de ações
        function ext_addMarketCapToCards(assetsList, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const assetCards = container.querySelectorAll('.asset-card');
            
            assetCards.forEach((card, index) => {
                const assetId = assetsList[index]?.id;
                if (!assetId) return;
                
                const asset = AppState.market.assets[assetId];
                if (!asset || asset.type !== 'acao') return;
                
                // Verificar se já existe a seção de Market Cap
                let marketCapSection = card.querySelector('.ext-market-cap-info');
                if (marketCapSection) {
                    marketCapSection.remove(); // Remover se já existir para recriar
                }
                
                // Calcular dados de Market Cap
                const marketCapData = ext_calculateMarketCap(asset);
                
                // Criar nova seção de Market Cap
                marketCapSection = document.createElement('div');
                marketCapSection.className = 'ext-market-cap-info';
                marketCapSection.innerHTML = `
                    <div class="ext-info-row">
                        <span class="ext-label">📈 Ações Emitidas:</span>
                        <span class="ext-value">${formatShares(marketCapData.sharesIssued)}</span>
                    </div>
                    <div class="ext-info-row">
                        <span class="ext-label">💹 Ações em Circulação:</span>
                        <span class="ext-value">${formatShares(marketCapData.sharesOutstanding)} (${marketCapData.outstandingPercentage}%)</span>
                    </div>
                    <div class="ext-info-row highlight">
                        <span class="ext-label">📊 Valor de Mercado:</span>
                        <span class="ext-value ext-market-cap">${marketCapData.marketCapFormatted}</span>
                    </div>
                `;
                
                // Inserir após as informações de preço
                const priceElement = card.querySelector('.asset-price');
                if (priceElement) {
                    priceElement.insertAdjacentElement('afterend', marketCapSection);
                }
            });
        }


        // Renderizar ranking das 10 maiores empresas por Market Cap
        function ext_renderMarketCapRanking() {
            const container = document.querySelector('.ext-market-cap-ranking');
            if (!container) {
                console.warn('Container .ext-market-cap-ranking não encontrado');
                return;
            }
            
            // Filtrar apenas ações
            const allStocks = Object.values(AppState.market.assets).filter(asset => 
                asset.type === 'acao'
            );
            
            if (allStocks.length === 0) {
                container.innerHTML = `
                    <h4>📊 Top 10 Maiores Empresas</h4>
                    <p class="ext-ranking-subtitle">Por capitalização de mercado</p>
                    <p class="empty-state">Nenhuma ação disponível</p>
                `;
                return;
            }
            
            // Calcular Market Cap e ordenar
            const stocksWithMarketCap = allStocks.map(stock => {
                const marketCapData = ext_calculateMarketCap(stock);
                return {
                    ...stock,
                    marketCapKz: marketCapData.marketCapKz,
                    marketCapFormatted: marketCapData.marketCapFormatted
                };
            });
            
            // Ordenar por Market Cap (maior → menor)
            stocksWithMarketCap.sort((a, b) => b.marketCapKz - a.marketCapKz);
            
            // Pegar top 10
            const top10 = stocksWithMarketCap.slice(0, 10);
            
            // Renderizar ranking
            container.innerHTML = `
                <h4>📊 Top 10 Maiores Empresas</h4>
                <p class="ext-ranking-subtitle">Por capitalização de mercado</p>
                <div id="ext-top-market-cap-list">
                    ${top10.map((stock, index) => {
                        const position = index + 1;
                        const change = ((stock.currentPrice - stock.previousPrice) / stock.previousPrice * 100) || 0;
                        const changeClass = change >= 0 ? 'positive' : 'negative';
                        const changeIcon = change >= 0 ? '📈' : '📉';
                        
                        // Badges para os 3 primeiros
                        let badge = '';
                        if (position === 1) badge = '🥇';
                        else if (position === 2) badge = '🥈';
                        else if (position === 3) badge = '🥉';
                        
                        return `
                            <div class="ext-ranking-item" data-position="${position}">
                                <span class="ext-rank-position">${badge} ${position}º</span>
                                <div class="ext-rank-info">
                                    <div class="ext-rank-ticker">${stock.ticker} - ${stock.name}</div>
                                    <div class="ext-rank-market-cap">${stock.marketCapFormatted}</div>
                                </div>
                                <span class="ext-rank-change ${changeClass}">
                                    ${changeIcon} ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            console.log('Ranking de Market Cap atualizado com', top10.length, 'empresas');
        }

        // Atualizar Market Cap de todas as ações (chamado quando preços mudam)
        function ext_updateAllMarketCaps() {
            console.log('Atualizando Market Caps...');
            
            // Atualizar ranking
            ext_renderMarketCapRanking();
            
            // Atualizar cards visíveis
            const activeTab = document.querySelector('.asset-tabs .tab.active');
            if (activeTab && activeTab.dataset.category === 'acoes') {
                const assets = ASSETS_DATABASE.acoes;
                ext_addMarketCapToCards(assets, 'assets-list');
            }
        }

        // ========================================
        // HOOKS DE INTEGRAÇÃO COM SISTEMA EXISTENTE
        // ========================================

        // Modificar a função initializeMarket() para inicializar Market Cap
        const originalInitializeMarket = initializeMarket;
        initializeMarket = function() {
            originalInitializeMarket();
            ext_initializeMarketCapData();
            
            // Garantir que todos os assets no market tenham stockInfo
            ASSETS_DATABASE.acoes.forEach(asset => {
                if (AppState.market.assets[asset.id] && asset.stockInfo) {
                    AppState.market.assets[asset.id].stockInfo = asset.stockInfo;
                }
            });
            
            // Renderizar ranking inicial
            setTimeout(() => ext_renderMarketCapRanking(), 100);
        };

        // Adicionar função para criar o container de ranking se não existir
        function ext_createMarketCapRankingContainer() {
            const sidebar = document.querySelector('.portfolio-summary');
            if (!sidebar) return;
            
            // Verificar se já existe
            let rankingContainer = document.querySelector('.ext-market-cap-ranking');
            if (!rankingContainer) {
                rankingContainer = document.createElement('div');
                rankingContainer.className = 'ext-market-cap-ranking';
                rankingContainer.style.marginTop = '20px';
                
                // Inserir após o card de resumo
                const summaryCard = document.querySelector('.summary-card');
                if (summaryCard) {
                    summaryCard.insertAdjacentElement('afterend', rankingContainer);
                } else {
                    sidebar.insertAdjacentElement('afterbegin', rankingContainer);
                }
            }
        }


        // ========================================
        // TESTE RÁPIDO
        // ========================================

        // Função para verificar se tudo está funcionando
        function ext_testMarketCapSystem() {
            console.log('=== TESTE DO SISTEMA MARKET CAP ===');
            
            // Verificar se todas as ações têm stockInfo
            const stocks = ASSETS_DATABASE.acoes;
            console.log(`Total de ações: ${stocks.length}`);
            
            stocks.forEach((stock, index) => {
                const marketCapData = ext_calculateMarketCap(stock);
                console.log(`${index + 1}. ${stock.ticker}: ${marketCapData.marketCapFormatted}`);
            });
            
            // Testar formatação
            console.log('Formatação 1.5B Kz:', formatMarketCap(1500000000));
            console.log('Formatação 25M Kz:', formatMarketCap(25000000));
            console.log('Formatação 1.2M ações:', formatShares(1200000));
            
            console.log('=== FIM DO TESTE ===');
        }

        // Adicionar CSS adicional para melhorar a aparência
        const additionalCSS = `
        .ext-market-cap-ranking {
            background: var(--gray-dark);
            border: 2px solid var(--gray-medium);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
        }

        .ext-market-cap-ranking h4 {
            color: var(--accent-green);
            font-size: 1.1rem;
            margin-bottom: 5px;
        }

        .ext-ranking-subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.85rem;
            margin-bottom: 15px;
        }

        .ext-ranking-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--gray-medium);
            border-radius: 8px;
            margin-bottom: 8px;
            transition: var(--transition);
            border-left: 3px solid transparent;
        }

        .ext-ranking-item:hover {
            background: var(--gray-light);
            transform: translateX(5px);
        }

        .ext-ranking-item[data-position="1"] {
            border-left-color: gold;
            background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), var(--gray-medium));
        }

        .ext-ranking-item[data-position="2"] {
            border-left-color: silver;
            background: linear-gradient(90deg, rgba(192, 192, 192, 0.15), var(--gray-medium));
        }

        .ext-ranking-item[data-position="3"] {
            border-left-color: #cd7f32;
            background: linear-gradient(90deg, rgba(205, 127, 50, 0.15), var(--gray-medium));
        }

        .ext-rank-position {
            font-weight: 700;
            color: var(--accent-green);
            min-width: 35px;
            text-align: center;
            font-size: 1.1rem;
        }

        .ext-rank-info {
            flex: 1;
        }

        .ext-rank-ticker {
            font-weight: 700;
            color: var(--text-white);
            font-size: 0.95rem;
        }

        .ext-rank-market-cap {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            margin-top: 2px;
        }

        .ext-rank-change {
            font-weight: 700;
            font-size: 0.9rem;
        }

        .ext-rank-change.positive {
            color: var(--success);
        }

        .ext-rank-change.negative {
            color: var(--danger);
        }
        `;

        // Adicionar CSS à página
        document.addEventListener('DOMContentLoaded', function() {
            const style = document.createElement('style');
            style.textContent = additionalCSS;
            document.head.appendChild(style);
            
            // Executar teste de verificação
            setTimeout(() => ext_testMarketCapSystem(), 1000);
        });

            const AppState = {
                user: {
                    name: '',
                    region: '',
                    gender: '',
                    profile: '',
                    scenario: '',
                    initialBalance: 0,
                    availableBalance: 0,
                    tickInterval: 60000
                },
                
                portfolio: {
                    positions: [],
                    transactions: [],
                    totalInvested: 0,
                    currentValue: 0,
                    totalPnL: 0
                },
                
                market: {
                    assets: {},
                    lastUpdate: null,
                    intervalId: null
                }
            };

            // ========================================
            // BASE DE DADOS DE ATIVOS ATUALIZADA
            // ========================================
            const ASSETS_DATABASE = {
                acoes: [
                    {
                        id: 'B-SA',
                        name: 'Bernal S.A',
                        ticker: 'B-SA',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 1200,
                        volatility: 0.015,
                        icon: '🏦'
                    },
                    {
                        id: 'AX-I',
                        name: 'AX-Internacional',
                        ticker: 'AX-I',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 950,
                        volatility: 0.012,
                        icon: '🏦'
                    },
                    {
                        id: 'SNG',
                        name: 'Sonango E.P',
                        ticker: 'SNG',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 880,
                        volatility: 0.013,
                        icon: '🏦'
                    },
                    {
                        id: 'BVA',
                        name: 'Boiva Angola',
                        ticker: 'BVA',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 45,
                        volatility: 0.02,
                        icon: '📊'
                    },
                    {
                        id: 'TGT',
                        name: 'Teca Global Company',
                        ticker: 'TGT',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 520,
                        volatility: 0.018,
                        icon: '🛡️'
                    },
                    {
                        id: 'SPT',
                        name: 'Swuaa Para Todos S.A',
                        ticker: 'SPT',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 1500,
                        volatility: 0.014,
                        icon: '⛽'
                    },
                    {
                        id: 'Unidal',
                        name: 'Unidal S.A.',
                        ticker: 'UNDAL',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 380,
                        volatility: 0.025,
                        icon: '✈️'
                    },
                    {
                        id: 'TCI',
                        name: 'Teca Capital Investimentos',
                        ticker: 'TCI',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 720,
                        volatility: 0.016,
                        icon: '📱'
                    },
                    {
                        id: 'BAIO',
                        name: 'Baino Corporation',
                        ticker: 'BAIO',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 650,
                        volatility: 0.011,
                        icon: '🏦'
                    },
                    {
                        id: 'ABI',
                        name: 'AB Imperio S.A.',
                        ticker: 'ABI',
                        type: 'acao',
                        country: 'AO',
                        exchange: 'BODIVA',
                        initialPrice: 590,
                        volatility: 0.014,
                        icon: '🏦'
                    }
                ],
                
                etfs: [
                    {
                        id: 'ETF_ANGOLA_INDEX',
                        name: 'ETF BODIVA Index',
                        ticker: 'BODIVA-ETF',
                        type: 'etf',
                        description: 'Acompanha as principais empresas da BODIVA',
                        initialPrice: 85,
                        volatility: 0.010,
                        icon: '📦'
                    },
                    {
                        id: 'ETF_BTC',
                        name: 'Bitcoin ETF',
                        ticker: 'BTC-ETF',
                        type: 'etf',
                        description: 'Acompanha o preço do Bitcoin',
                        initialPrice: 120,
                        currency: 'USD',
                        volatility: 0.045,
                        icon: '₿'
                    },
                    {
                        id: 'ETF_ETH',
                        name: 'Ethereum ETF',
                        ticker: 'ETH-ETF',
                        type: 'etf',
                        description: 'Acompanha o preço do Ethereum',
                        initialPrice: 95,
                        currency: 'USD',
                        volatility: 0.040,
                        icon: 'Ξ'
                    },
                    {
                        id: 'ETF_CRYPTO_COMBO',
                        name: 'Crypto Combo ETF',
                        ticker: 'CRYPTO-COMBO',
                        type: 'etf',
                        description: 'Combina BTC (70%) + ETH (30%)',
                        initialPrice: 50,
                        currency: 'USD',
                        volatility: 0.048,
                        icon: '💎'
                    }
                ],
                
                cripto: [
                    {
                        id: 'BTC',
                        name: 'Bitcoin',
                        ticker: 'BTC',
                        type: 'cripto',
                        initialPrice: 95000,
                        currency: 'USDT',
                        supplyMax: 21000000,
                        supplyCirc: 19800000,
                        volatility: 0.06,
                        icon: '₿',
                        minPurchaseUnit: 0.00000001,
                        unitName: 'BTC',
                        fractionName: 'Satoshi',
                        satoshisPerBTC: 100000000,
                        decimals: 8
                    },
                    {
                        id: 'ETH',
                        name: 'Ethereum',
                        ticker: 'ETH',
                        type: 'cripto',
                        initialPrice: 3500,
                        currency: 'USDT',
                        supplyMax: null,
                        supplyCirc: 120000000,
                        volatility: 0.05,
                        icon: 'Ξ',
                        minPurchaseUnit: 0.000000000000000001,
                        unitName: 'ETH',
                        fractionName: 'Wei',
                        weiPerETH: 1000000000000000000,
                        decimals: 18
                    },
                    {
                        id: 'BNB',
                        name: 'Binance Coin',
                        ticker: 'BNB',
                        type: 'cripto',
                        initialPrice: 650,
                        currency: 'USDT',
                        supplyMax: 200000000,
                        supplyCirc: 155000000,
                        volatility: 0.045,
                        icon: '🔶',
                        minPurchaseUnit: 0.00000001,
                        unitName: 'BNB',
                        fractionName: 'Jager',
                        decimals: 8
                    },
                    {
                        id: 'SOL',
                        name: 'Solana',
                        ticker: 'SOL',
                        type: 'cripto',
                        initialPrice: 230,
                        currency: 'USDT',
                        supplyMax: null,
                        supplyCirc: 470000000,
                        volatility: 0.08,
                        icon: '◎',
                        minPurchaseUnit: 0.00000001,
                        unitName: 'SOL',
                        fractionName: 'Lamport',
                        decimals: 9
                    },
                    {
                        id: 'XRP',
                        name: 'Ripple',
                        ticker: 'XRP',
                        type: 'cripto',
                        initialPrice: 2.5,
                        currency: 'USDT',
                        supplyMax: 100000000000,
                        supplyCirc: 57000000000,
                        volatility: 0.055,
                        icon: '◈',
                        minPurchaseUnit: 0.000001,
                        unitName: 'XRP',
                        fractionName: 'Drop',
                        decimals: 6
                    },
                    {
                        id: 'ADA',
                        name: 'Cardano',
                        ticker: 'ADA',
                        type: 'cripto',
                        initialPrice: 1.1,
                        currency: 'USDT',
                        supplyMax: 45000000000,
                        supplyCirc: 36000000000,
                        volatility: 0.05,
                        icon: '₳',
                        minPurchaseUnit: 0.000001,
                        unitName: 'ADA',
                        fractionName: 'Lovelace',
                        decimals: 6
                    },
                    {
                        id: 'DOGE',
                        name: 'Dogecoin',
                        ticker: 'DOGE',
                        type: 'cripto',
                        initialPrice: 0.38,
                        currency: 'USDT',
                        supplyMax: null,
                        supplyCirc: 147000000000,
                        volatility: 0.09,
                        icon: '🐕',
                        minPurchaseUnit: 0.01,
                        unitName: 'DOGE',
                        fractionName: 'Dogetoshi',
                        decimals: 2
                    },
                    {
                        id: 'MATIC',
                        name: 'Polygon',
                        ticker: 'MATIC',
                        type: 'cripto',
                        initialPrice: 0.95,
                        currency: 'USDT',
                        supplyMax: 10000000000,
                        supplyCirc: 9400000000,
                        volatility: 0.065,
                        icon: '⬡',
                        minPurchaseUnit: 0.000001,
                        unitName: 'MATIC',
                        fractionName: 'Wei',
                        decimals: 18
                    },
                    {
                        id: 'DOT',
                        name: 'Polkadot',
                        ticker: 'DOT',
                        type: 'cripto',
                        initialPrice: 8.5,
                        currency: 'USDT',
                        supplyMax: null,
                        supplyCirc: 1400000000,
                        volatility: 0.058,
                        icon: '●',
                        minPurchaseUnit: 0.00000001,
                        unitName: 'DOT',
                        fractionName: 'Planck',
                        decimals: 10
                    },
                    {
                        id: 'AVAX',
                        name: 'Avalanche',
                        ticker: 'AVAX',
                        type: 'cripto',
                        initialPrice: 42,
                        currency: 'USDT',
                        supplyMax: 720000000,
                        supplyCirc: 450000000,
                        volatility: 0.07,
                        icon: '🔺',
                        minPurchaseUnit: 0.00000001,
                        unitName: 'AVAX',
                        fractionName: 'Nano AVAX',
                        decimals: 9
                    }
                ],
                
                titulosPublicos: [
                    {
                        id: 'OT_2Y',
                        name: 'Obrigação do Tesouro 2 Anos',
                        ticker: 'OT-2Y',
                        type: 'titulo-publico',
                        maturity: 2,
                        couponRate: 0.17,
                        initialPrice: 100000,
                        volatility: 0.002,
                        icon: '🏛️'
                    },
                    {
                        id: 'OT_3Y',
                        name: 'Obrigação do Tesouro 3 Anos',
                        ticker: 'OT-3Y',
                        type: 'titulo-publico',
                        maturity: 3,
                        couponRate: 0.18,
                        initialPrice: 100000,
                        volatility: 0.002,
                        icon: '🏛️'
                    },
                    {
                        id: 'OT_5Y',
                        name: 'Obrigação do Tesouro 5 Anos',
                        ticker: 'OT-5Y',
                        type: 'titulo-publico',
                        maturity: 5,
                        couponRate: 0.20,
                        initialPrice: 100000,
                        volatility: 0.002,
                        icon: '🏛️'
                    },
                    {
                        id: 'OT_7Y',
                        name: 'Obrigação do Tesouro 7 Anos',
                        ticker: 'OT-7Y',
                        type: 'titulo-publico',
                        maturity: 7,
                        couponRate: 0.22,
                        initialPrice: 100000,
                        volatility: 0.002,
                        icon: '🏛️'
                    },
                    {
                        id: 'OT_10Y',
                        name: 'Obrigação do Tesouro 10 Anos',
                        ticker: 'OT-10Y',
                        type: 'titulo-publico',
                        maturity: 10,
                        couponRate: 0.24,
                        initialPrice: 100000,
                        volatility: 0.002,
                        icon: '🏛️'
                    },
                    {
                        id: 'BT_1Y',
                        name: 'Bilhete do Tesouro 1 Ano',
                        ticker: 'BT-1Y',
                        type: 'titulo-publico',
                        maturity: 1,
                        couponRate: 0.16,
                        initialPrice: 50000,
                        volatility: 0.001,
                        icon: '📄'
                    }
                ],
                
                titulosPrivados: [
                    {
                        id: 'OP_BAID_3Y',
                        name: 'Obrigação Privada BAID 3 Anos',
                        ticker: 'OP-BAID-3Y',
                        type: 'titulo-privado',
                        issuer: 'BAID',
                        maturity: 3,
                        couponRate: 0.15,
                        initialPrice: 75000,
                        volatility: 0.005,
                        icon: '🏦'
                    },
                    {
                        id: 'OP_UNITAL_2Y',
                        name: 'Obrigação Privada Unital 2 Anos',
                        ticker: 'OP-UNTL-2Y',
                        type: 'titulo-privado',
                        issuer: 'Unital',
                        maturity: 2,
                        couponRate: 0.14,
                        initialPrice: 50000,
                        volatility: 0.006,
                        icon: '📱'
                    }
                ]
            };

            
            // Explicações Educacionais
            const ASSET_EXPLANATIONS = {
                acoes: {
                    title: "🏢 O que são Ações?",
                    content: "Ações são pequenas partes de uma empresa. Ao comprar ações, você se torna sócio e pode lucrar com a valorização da empresa ou receber dividendos. O preço varia conforme oferta e demanda no mercado. Ao adicionar ações na sua carteira, você está investindo em renda variável - o valor pode subir ou descer diariamente."
                },
                etfs: {
                    title: "📦 O que são ETFs?",
                    content: "ETFs (Exchange Traded Funds) são fundos que agrupam vários ativos. Permitem investir em múltiplas empresas ou criptomoedas de uma vez, com menor custo e maior diversificação. São negociados como ações e oferecem exposição a diversos mercados simultaneamente."
                },
                cripto: {
                    title: "₿ O que são Criptomoedas?",
                    content: "Criptomoedas são moedas digitais descentralizadas baseadas em blockchain. Exemplos: Bitcoin (BTC), Ethereum (ETH). São altamente voláteis e podem valorizar ou desvalorizar rapidamente. Você pode comprar frações (Satoshis para BTC, Wei para ETH) sem precisar comprar a moeda inteira."
                },
                titulosPublicos: {
                    title: "🏛️ O que são Títulos Públicos?",
                    content: "São dívidas do governo. Você empresta dinheiro ao Estado e recebe juros fixos no vencimento. São considerados investimentos de baixo risco e renda previsível. Ao adicionar na carteira, você verá o valor final que receberá na data de vencimento."
                },
                titulosPrivados: {
                    title: "🏦 O que são Títulos Privados?",
                    content: "Similares aos públicos, mas emitidos por empresas privadas. Oferecem juros fixos, mas com risco ligeiramente maior que títulos públicos. Retorno previsível no vencimento. Ideais para diversificar entre renda fixa pública e privada."
                }
            };

            // Taxa de câmbio fixa
            const USD_TO_KZ = 830;

            // ========================================
            // FUNÇÕES UTILITÁRIAS
            // ========================================
            function formatCurrency(value) {
                return `${value.toLocaleString('pt-AO', {minimumFractionDigits: 2, maximumFractionDigits: 2})} Kz`;
            }

            function getScenarioLabel(scenario) {
                const labels = {
                    'estavel': '📈 Estável',
                    'crise': '📉 Crise/Instável',
                    'crescimento': '🔥 Crescimento',
                    'angola-especial': '🇦🇴 Angola Especial'
                };
                return labels[scenario] || scenario;
            }

            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.classList.add('show');
                }, 100);
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 4000);
            }

            function randomNormal(mean = 0, stdDev = 1) {
                const u1 = Math.random();
                const u2 = Math.random();
                const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return mean + z0 * stdDev;
            }

            function convertCryptoUnits(asset, quantity, fromUnit) {
                if (asset.type !== 'cripto') return quantity;
                
                if (fromUnit === 'fraction') {
                    // Converter de fração para unidade completa
                    if (asset.id === 'BTC') {
                        return quantity / asset.satoshisPerBTC;
                    } else if (asset.id === 'ETH') {
                        return quantity / asset.weiPerETH;
                    }
                    // Para outras criptos, usar minPurchaseUnit como divisor
                    return quantity * asset.minPurchaseUnit;
                }
                
                return quantity;
            }

            function calculateDiversificationScore() {
                const positions = AppState.portfolio.positions.length;
                
                if (positions === 0) return { score: 0, label: 'Sem investimentos', color: 'gray' };
                if (positions === 1) return { score: 1, label: 'Não diversificado', color: 'danger' };
                if (positions <= 3) return { score: 2, label: 'Baixa diversificação', color: 'warning' };
                if (positions <= 6) return { score: 3, label: 'Diversificação moderada', color: 'accent-green' };
                if (positions <= 10) return { score: 4, label: 'Bem diversificado', color: 'success' };
                return { score: 5, label: 'Altamente diversificado', color: 'success' };
            }

            // ========================================
            // ENGINE DE MERCADO
            // ========================================
            function calculateNextPrice(asset, scenario) {
                const current = asset.currentPrice || asset.initialPrice;
                let vol = asset.volatility;
                let drift = 0;
                
                switch(scenario) {
                    case 'estavel':
                        break;
                        
                    case 'crise':
                        if (asset.type === 'acao' || asset.type === 'etf') {
                            vol *= 2.5;
                            drift = -0.015;
                        } else if (asset.type.includes('titulo')) {
                            drift = 0.005;
                        } else if (asset.type === 'cripto') {
                            vol *= 1.8;
                            drift = -0.01;
                        }
                        break;
                        
                    case 'crescimento':
                        if (asset.type === 'acao' || asset.type === 'etf' || asset.type === 'cripto') {
                            drift = 0.02;
                            vol *= 1.2;
                        }
                        break;
                        
                    case 'angola-especial':
                        if (asset.country === 'AO' && asset.type === 'acao') {
                            drift = 0.025;
                            vol *= 0.8;
                        } else if (asset.type.includes('titulo')) {
                            drift = 0.008;
                        } else if (asset.type === 'cripto') {
                            vol *= 1.5;
                        }
                        break;
                }
                
                const changePct = drift + randomNormal(0, vol);
                let newPrice = current * (1 + changePct);
                
                const minPrice = asset.initialPrice * 0.01;
                const maxPrice = asset.initialPrice * 50;
                newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
                
                if (asset.type === 'cripto') {
                    const decimals = asset.decimals || 8;
                    return parseFloat(newPrice.toFixed(decimals));
                } else {
                    return parseFloat(newPrice.toFixed(2));
                }
            }

            function initializeMarket() {
                Object.keys(ASSETS_DATABASE).forEach(category => {
                    ASSETS_DATABASE[category].forEach(asset => {
                        AppState.market.assets[asset.id] = {
                            ...asset,
                            currentPrice: asset.initialPrice,
                            previousPrice: asset.initialPrice,
                            priceHistory: [asset.initialPrice],
                            timestamp: Date.now()
                        };
                    });
                });
            }

            function updateMarketPrices() {
                const scenario = AppState.user.scenario;
                
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    asset.previousPrice = asset.currentPrice;
                    asset.currentPrice = calculateNextPrice(asset, scenario);
                    
                    asset.priceHistory.push(asset.currentPrice);
                    if (asset.priceHistory.length > 100) {
                        asset.priceHistory.shift();
                    }
                    
                    asset.timestamp = Date.now();
                });
                
                AppState.market.lastUpdate = Date.now();
                
                updateAssetsUI();
                updatePortfolioUI();
                updateChartsUI();
            }

            function startMarketUpdates() {
                if (AppState.market.intervalId) {
                    clearInterval(AppState.market.intervalId);
                }
                
                AppState.market.intervalId = setInterval(() => {
                    updateMarketPrices();
                }, AppState.user.tickInterval);
            }

            function stopMarketUpdates() {
                if (AppState.market.intervalId) {
                    clearInterval(AppState.market.intervalId);
                    AppState.market.intervalId = null;
                }
            }

            // ========================================
            // SISTEMA DE COMPRA E VENDA
            // ========================================
            function buyAsset(assetId, quantity) {
                const asset = AppState.market.assets[assetId];
                if (!asset) return { success: false, message: 'Ativo não encontrado' };
                
                // Verificar se é compra fracionada de cripto
                const purchaseType = document.querySelector('input[name="purchase-type"]:checked')?.value || 'full';
                let actualQuantity = quantity;
                
                if (asset.type === 'cripto' && purchaseType === 'fraction') {
                    actualQuantity = convertCryptoUnits(asset, quantity, 'fraction');
                }
                
                const price = asset.currentPrice;
                let total = price * actualQuantity;
                
                if (asset.currency === 'USD' || asset.currency === 'USDT') {
                    total *= USD_TO_KZ;
                }
                
                if (total > AppState.user.availableBalance) {
                    return { 
                        success: false, 
                        message: '⚠️ Saldo insuficiente para esta operação' 
                    };
                }
                
                AppState.user.availableBalance -= total;
                
                const existingPosition = AppState.portfolio.positions.find(p => p.assetId === assetId);
                
                if (existingPosition) {
                    const totalQuantity = existingPosition.quantity + actualQuantity;
                    const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + total;
                    existingPosition.avgPrice = totalCost / totalQuantity;
                    existingPosition.quantity = totalQuantity;
                } else {
                    AppState.portfolio.positions.push({
                        assetId,
                        name: asset.name,
                        ticker: asset.ticker,
                        type: asset.type,
                        quantity: actualQuantity,
                        avgPrice: total / actualQuantity,
                        purchasePrice: price,
                        currentPrice: price,
                        pnl: 0,
                        pnlPercent: 0
                    });
                }
                
                AppState.portfolio.transactions.push({
                    timestamp: new Date().toISOString(),
                    assetId,
                    assetName: asset.name,
                    type: 'buy',
                    quantity: actualQuantity,
                    price,
                    total,
                    pnl: 0
                });
                
                updatePortfolioMetrics();
                saveToLocalStorage();
                
                const displayQuantity = asset.type === 'cripto' && purchaseType === 'fraction' ? 
                    `${quantity} ${asset.fractionName}` : 
                    `${actualQuantity} ${asset.ticker}`;
                    
                return { 
                    success: true, 
                    message: `✅ Compra realizada: ${displayQuantity} por ${formatCurrency(total)}` 
                };
            }

            function sellAsset(assetId, quantity) {
                const asset = AppState.market.assets[assetId];
                if (!asset) return { success: false, message: 'Ativo não encontrado' };
                
                const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
                if (!position) {
                    return { success: false, message: 'Você não possui este ativo' };
                }
                
                if (quantity > position.quantity) {
                    return { success: false, message: 'Quantidade insuficiente para venda' };
                }
                
                const price = asset.currentPrice;
                let total = price * quantity;
                
                if (asset.currency === 'USD' || asset.currency === 'USDT') {
                    total *= USD_TO_KZ;
                }
                
                const costBasis = position.avgPrice * quantity;
                const grossPnL = total - costBasis;
                
                let tax = 0;
                if (grossPnL > 0) {
                    tax = grossPnL * 0.10;
                }
                
                const netPnL = grossPnL - tax;
                const netTotal = total - tax;
                
                AppState.user.availableBalance += netTotal;
                
                position.quantity -= quantity;
                
                if (position.quantity === 0) {
                    const index = AppState.portfolio.positions.indexOf(position);
                    AppState.portfolio.positions.splice(index, 1);
                }
                
                AppState.portfolio.transactions.push({
                    timestamp: new Date().toISOString(),
                    assetId,
                    assetName: asset.name,
                    type: 'sell',
                    quantity,
                    price,
                    total: netTotal,
                    grossPnL,
                    tax,
                    pnl: netPnL
                });
                
                updatePortfolioMetrics();
                saveToLocalStorage();
                
                return { 
                    success: true, 
                    message: `✅ Venda realizada: ${quantity}x ${asset.ticker} | P&L: ${formatCurrency(netPnL)} (após IAC: ${formatCurrency(tax)})` 
                };
            }
            

            function updatePortfolioMetrics() {
            let totalInvested = 0;
            let currentValue = 0;
            
            // ✅ CORREÇÃO: Filtrar posições ativas (não vencidas)
            const activePositions = AppState.portfolio.positions.filter(position => {
                // Para títulos, verificar se não estão vencidos
                if (position.type.includes('titulo') && position.bondInfo) {
                    return !position.bondInfo.matured;
                }
                return true; // Para outros ativos, sempre ativo
            });
            
            // Usar apenas posições ativas para cálculos
            activePositions.forEach(position => {
                const asset = AppState.market.assets[position.assetId];
                const currentPrice = asset?.currentPrice || position.currentPrice;
                
                let priceInKz = currentPrice;
                if (asset?.currency === 'USD' || asset?.currency === 'USDT') {
                    priceInKz *= USD_TO_KZ;
                }
                
                position.currentPrice = priceInKz;
                
                const invested = position.avgPrice * position.quantity;
                const current = priceInKz * position.quantity;
                
                position.pnl = current - invested;
                position.pnlPercent = invested > 0 ? ((current - invested) / invested) * 100 : 0;
                
                totalInvested += invested;
                currentValue += current;
            });
            
            // ✅ CORREÇÃO: Atualizar métricas globais
            AppState.portfolio.totalInvested = totalInvested;
            AppState.portfolio.currentValue = currentValue;
            AppState.portfolio.totalPnL = currentValue - totalInvested;
            
            console.log(`📊 Métricas atualizadas: Investido=${formatCurrency(totalInvested)}, ` +
                        `Valor Atual=${formatCurrency(currentValue)}, ` +
                        `Posições Ativas=${activePositions.length}`);
        }

            // ========================================
            // INTERFACE DO USUÁRIO
            // ========================================
            function renderAssetsUI(category) {
                const container = document.getElementById('assets-list');
                const assets = ASSETS_DATABASE[category] || [];
                
                container.innerHTML = '';
                
                assets.forEach(assetData => {
                    const asset = AppState.market.assets[assetData.id];
                    if (!asset) return;
                    
                    const priceChange = asset.currentPrice - asset.previousPrice;
                    const priceChangePct = (priceChange / asset.previousPrice) * 100;
                    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
                    const changeIcon = priceChange >= 0 ? '📈' : '📉';
                    
                    let priceDisplay;
                    if (asset.currency === 'USD' || asset.currency === 'USDT') {
                        priceDisplay = `$${asset.currentPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
                    } else {
                        priceDisplay = `${asset.currentPrice.toLocaleString('pt-AO')} Kz`;
                    }
                    
                    const card = document.createElement('div');
                    card.className = 'asset-card';
                    card.innerHTML = `
                        <div class="asset-header">
                            <span class="asset-icon">${asset.icon}</span>
                            <div class="asset-info">
                                <h4>${asset.name}</h4>
                                <span class="ticker">${asset.ticker}</span>
                            </div>
                        </div>
                        
                        <div class="asset-price">
                            <span class="price-value">${priceDisplay}</span>
                            <span class="price-change ${changeClass}">
                                ${changeIcon} ${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(2)}%
                            </span>
                        </div>
                        
                        ${asset.type === 'cripto' ? `
                            <div class="crypto-info">
                                <p class="supply-item">
                                    <span class="label">🔢 Supply Máximo:</span>
                                    <span class="value">${asset.supplyMax ? asset.supplyMax.toLocaleString() : '∞ (Ilimitado)'}</span>
                                </p>
                                <p class="supply-item">
                                    <span class="label">💎 Em Circulação:</span>
                                    <span class="value">${asset.supplyCirc.toLocaleString()}</span>
                                </p>
                                <p class="supply-item">
                                    <span class="label">📊 % Circulação:</span>
                                    <span class="value">${asset.supplyMax ? ((asset.supplyCirc / asset.supplyMax) * 100).toFixed(2) + '%' : 'N/A'}</span>
                                </p>
                            </div>
                        ` : ''}
                        
                        ${asset.type.includes('titulo') ? `
                            <div class="bond-info">
                                <p>Maturidade: ${asset.maturity} ano(s)</p>
                                <p>Taxa: ${(asset.couponRate * 100).toFixed(1)}% a.a.</p>
                                <p>Retorno previsto: ${formatCurrency(asset.initialPrice * (1 + asset.couponRate * asset.maturity))}</p>
                            </div>
                        ` : ''}
                        
                        <div class="asset-chart-mini">
                            <canvas id="chart-${asset.id}" width="300" height="100"></canvas>
                        </div>
                        
                        <div class="asset-actions">
                            <button class="btn-buy" onclick="openTradeModal('${asset.id}', 'buy')">
                                🛒 Comprar
                            </button>
                            <button class="btn-sell" onclick="openTradeModal('${asset.id}', 'sell')">
                                💰 Vender
                            </button>
                        </div>
                    `;
                    
                    container.appendChild(card);
                    renderMiniChart(asset.id, asset.priceHistory);
                });
            }

            function renderMiniChart(assetId, history) {
                const canvas = document.getElementById(`chart-${assetId}`);
                if (!canvas || history.length < 2) return;
                
                // Ajustar tamanho para preencher container
                const parent = canvas.parentElement;
                canvas.width = parent.offsetWidth;
                canvas.height = 100;
                
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                
                ctx.clearRect(0, 0, width, height);
                
                const min = Math.min(...history);
                const max = Math.max(...history);
                const range = max - min || 1;
                
                ctx.beginPath();
                ctx.strokeStyle = 'rgb(214, 174, 100)';
                ctx.lineWidth = 2;
                
                history.forEach((price, index) => {
                    const x = (index / (history.length - 1)) * width;
                    const y = height - ((price - min) / range) * height;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, 'rgba(214, 174, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(214, 174, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            function updatePortfolioUI() {
                // 1. Atualizar saldos
                document.getElementById('available-balance').textContent = formatCurrency(AppState.user.availableBalance);
                document.getElementById('invested-amount').textContent = formatCurrency(AppState.portfolio.totalInvested);
                document.getElementById('current-value').textContent = formatCurrency(AppState.portfolio.currentValue);
                
                // 2. Atualizar P&L total
                const pnlElement = document.getElementById('total-pnl');
                const pnl = AppState.portfolio.totalPnL;
                const pnlPct = AppState.portfolio.totalInvested > 0 
                    ? (pnl / AppState.portfolio.totalInvested) * 100 
                    : 0;
                
                pnlElement.textContent = `${formatCurrency(pnl)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`;
                pnlElement.className = `value pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
                
                // 3. Atualizar posições abertas
                const positionsContainer = document.getElementById('open-positions');
                if (AppState.portfolio.positions.length === 0) {
                    positionsContainer.innerHTML = '<p class="empty-state">Nenhuma posição aberta ainda.</p>';
                } else {
                    positionsContainer.innerHTML = AppState.portfolio.positions.map(position => {
                        const pnlClass = position.pnl >= 0 ? 'positive' : 'negative';
                        return `
                            <div class="position-item">
                                <div class="position-header">
                                    <strong>${position.ticker}</strong>
                                    <span class="quantity">${position.quantity}x</span>
                                </div>
                                <div class="position-details">
                                    <p>Preço médio: ${formatCurrency(position.avgPrice)}</p>
                                    <p>Atual: ${formatCurrency(position.currentPrice)}</p>
                                    <p class="${pnlClass}">
                                        P&L: ${formatCurrency(position.pnl)} (${position.pnlPercent >= 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%)
                                    </p>
                                </div>
                                <button class="btn-sell-small" onclick="openTradeModal('${position.assetId}', 'sell')">
                                    Vender
                                </button>
                            </div>
                        `;
                    }).join('');
                }
                
                // 4. Atualizar gráfico de alocação (pizza)
                renderAllocationChart();
                
                // 5. Atualizar detalhes de alocação por ativo
                updateAllocationDetails();
                
                // 6. Atualizar badge de diversificação
                updateDiversificationBadge();
                
                // 7. Atualizar ranking de desempenho
                updatePerformanceRanking();
                
                // 8. Salvar estado
                saveToLocalStorage();
            }

            function updateAllocationDetails() {
                const container = document.getElementById('allocation-list');
                
                if (AppState.portfolio.positions.length === 0) {
                    container.innerHTML = '<p class="empty-state">Nenhum ativo na carteira</p>';
                    return;
                }
                
                const totalValue = AppState.portfolio.currentValue || 1;
                
                const allocations = AppState.portfolio.positions.map(position => {
                    const asset = AppState.market.assets[position.assetId];
                    let currentPrice = asset.currentPrice;
                    
                    if (asset.currency === 'USD' || asset.currency === 'USDT') {
                        currentPrice *= USD_TO_KZ;
                    }
                    
                    const positionValue = currentPrice * position.quantity;
                    const percentage = (positionValue / totalValue) * 100;
                    
                    return {
                        name: position.name,
                        ticker: position.ticker,
                        value: positionValue,
                        percentage: percentage,
                        pnl: position.pnl,
                        pnlPercent: position.pnlPercent,
                        quantity: position.quantity,
                        avgPrice: position.avgPrice
                    };
                });
                
                allocations.sort((a, b) => b.percentage - a.percentage);
                
                container.innerHTML = allocations.map(alloc => {
                    const pnlClass = alloc.pnl >= 0 ? 'positive' : 'negative';
                    const barWidth = Math.min(alloc.percentage, 100);
                    
                    return `
                        <div class="allocation-item" 
                            title="Quantidade: ${alloc.quantity} | Preço médio: ${formatCurrency(alloc.avgPrice)} | Valor total: ${formatCurrency(alloc.value)}">
                            <div class="allocation-header">
                                <span class="allocation-name">${alloc.ticker}</span>
                                <span class="allocation-percent">${alloc.percentage.toFixed(2)}%</span>
                            </div>
                            <div class="allocation-bar-container">
                                <div class="allocation-bar" style="width: ${barWidth}%"></div>
                            </div>
                            <div class="allocation-details">
                                <span class="allocation-value">${formatCurrency(alloc.value)}</span>
                                <span class="allocation-pnl ${pnlClass}">
                                    ${alloc.pnl >= 0 ? '+' : ''}${alloc.pnlPercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            function updateDiversificationBadge() {
                const container = document.getElementById('diversification-badge');
                const diversification = calculateDiversificationScore();
                
                container.innerHTML = `
                    <div class="diversification-badge ${diversification.color}">
                        <span class="badge-icon">📊</span>
                        <span class="badge-label">${diversification.label}</span>
                    </div>
                `;
            }

            function updatePerformanceRanking() {
                const topContainer = document.getElementById('top-performers');
                const worstContainer = document.getElementById('worst-performers');
                
                if (AppState.portfolio.positions.length === 0) {
                    topContainer.innerHTML = '<p class="empty-state">-</p>';
                    worstContainer.innerHTML = '<p class="empty-state">-</p>';
                    return;
                }
                
                // Criar cópia e ordenar por P&L percentual
                const sortedPositions = [...AppState.portfolio.positions].sort((a, b) => {
                    return b.pnlPercent - a.pnlPercent;
                });
                
                // Top 3 ganhadores
                const topPerformers = sortedPositions.slice(0, 3).filter(p => p.pnl > 0);
                
                if (topPerformers.length === 0) {
                    topContainer.innerHTML = '<p class="empty-state">Nenhum ativo em ganho</p>';
                } else {
                    topContainer.innerHTML = topPerformers.map((position, index) => {
                        const pnlClass = 'positive';
                        return `
                            <div class="ranking-item">
                                <span class="ranking-position">${index + 1}º</span>
                                <span class="ranking-ticker">${position.ticker}</span>
                                <span class="ranking-value ${pnlClass}">
                                    +${position.pnlPercent.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    }).join('');
                }
                
                // Top 3 perdedores
                const worstPerformers = sortedPositions.slice().reverse().slice(0, 3).filter(p => p.pnl < 0);
                
                if (worstPerformers.length === 0) {
                    worstContainer.innerHTML = '<p class="empty-state">Nenhum ativo em perda</p>';
                } else {
                    worstContainer.innerHTML = worstPerformers.map((position, index) => {
                        const pnlClass = 'negative';
                        return `
                            <div class="ranking-item">
                                <span class="ranking-position">${index + 1}º</span>
                                <span class="ranking-ticker">${position.ticker}</span>
                                <span class="ranking-value ${pnlClass}">
                                    ${position.pnlPercent.toFixed(2)}%
                                </span>
                            </div>
                        `;
                    }).join('');
                }
            }

            function renderAllocationChart() {
                const canvas = document.getElementById('allocation-pie');
                if (!canvas) return;
                
                const ctx = canvas.getContext('2d');
                const width = canvas.width = 200;
                const height = canvas.height = 200;
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) / 2 - 10;
                
                ctx.clearRect(0, 0, width, height);
                
                if (AppState.portfolio.positions.length === 0) {
                    ctx.fillStyle = 'rgba(214, 174, 100, 0.3)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('Sem posições', centerX, centerY);
                    return;
                }
                
                const total = AppState.portfolio.currentValue || 1;
                const colors = [
                    'rgb(214, 174, 100)',
                    'rgb(100, 150, 200)',
                    'rgb(255, 200, 100)',
                    'rgb(255, 100, 150)',
                    'rgb(150, 100, 255)'
                ];
                
                let startAngle = -Math.PI / 2;
                
                AppState.portfolio.positions.forEach((position, index) => {
                    let value = position.currentPrice * position.quantity;
                    
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    
                    ctx.fillStyle = colors[index % colors.length];
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    startAngle += sliceAngle;
                });
            }

            function updateTransactionsUI() {
                const tbody = document.getElementById('transactions-body');
                
                if (AppState.portfolio.transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhuma transação ainda.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = AppState.portfolio.transactions
                    .slice()
                    .reverse()
                    .map(tx => {
                        const typeLabel = tx.type === 'buy' ? '🛒 Compra' : '💰 Venda';
                        const typeClass = tx.type === 'buy' ? 'buy' : 'sell';
                        const pnlClass = tx.pnl >= 0 ? 'positive' : 'negative';
                        
                        return `
                            <tr>
                                <td>${new Date(tx.timestamp).toLocaleString('pt-AO')}</td>
                                <td><strong>${tx.assetName}</strong></td>
                                <td><span class="badge ${typeClass}">${typeLabel}</span></td>
                                <td>${tx.quantity}</td>
                                <td>${formatCurrency(tx.price)}</td>
                                <td>${formatCurrency(tx.total)}</td>
                                <td class="${pnlClass}">
                                    ${tx.type === 'sell' ? formatCurrency(tx.pnl) : '-'}
                                </td>
                            </tr>
                        `;
                    }).join('');
            }

            function openTradeModal(assetId, type) {
                const modal = document.getElementById('trade-modal');
                const asset = AppState.market.assets[assetId];
                
                document.getElementById('modal-title').textContent = type === 'buy' ? '🛒 Comprar Ativo' : '💰 Vender Ativo';
                document.getElementById('modal-asset-name').textContent = asset.name;
                
                let priceDisplay;
                if (asset.currency === 'USD' || asset.currency === 'USDT') {
                    priceDisplay = `$${asset.currentPrice.toFixed(2)} (≈ ${formatCurrency(asset.currentPrice * USD_TO_KZ)})`;
                } else {
                    priceDisplay = formatCurrency(asset.currentPrice);
                }
                
                document.getElementById('modal-price').textContent = priceDisplay;
                
                // Configurar opções de compra fracionada para cripto
                const cryptoOptions = document.getElementById('crypto-purchase-options');
                const quantityInput = document.getElementById('trade-quantity');
                
                if (asset.type === 'cripto' && type === 'buy') {
                    cryptoOptions.style.display = 'block';
                    document.getElementById('unit-name').textContent = asset.unitName;
                    document.getElementById('fraction-name').textContent = asset.fractionName;
                    
                    // Configurar input baseado no tipo de compra
                    quantityInput.min = asset.minPurchaseUnit;
                    quantityInput.step = asset.minPurchaseUnit;
                    quantityInput.placeholder = `Ex: 0.005 ${asset.unitName} ou 500000 ${asset.fractionName}`;
                } else {
                    cryptoOptions.style.display = 'none';
                    quantityInput.min = 1;
                    quantityInput.step = 1;
                    quantityInput.placeholder = 'Ex: 10';
                }
                
                let extraInfo = '';
                if (type === 'sell') {
                    const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
                    if (position) {
                        extraInfo = `Quantidade disponível: ${position.quantity}`;
                    } else {
                        extraInfo = 'Você não possui este ativo';
                    }
                }
                document.getElementById('modal-extra-info').textContent = extraInfo;
                
                modal.style.display = 'block';
                modal.dataset.assetId = assetId;
                modal.dataset.type = type;
                
                quantityInput.value = '';
                quantityInput.oninput = () => calculateTradeTotal(assetId, type);
            }

            function calculateTradeTotal(assetId, type) {
                const asset = AppState.market.assets[assetId];
                const quantity = parseFloat(document.getElementById('trade-quantity').value) || 0;
                
                if (quantity <= 0) {
                    document.getElementById('trade-total').textContent = '0 Kz';
                    document.getElementById('insufficient-funds').style.display = 'none';
                    document.getElementById('confirm-trade').disabled = true;
                    return;
                }
                
                let total = 0;
                
                if (asset.type === 'cripto' && type === 'buy') {
                    const purchaseType = document.querySelector('input[name="purchase-type"]:checked')?.value || 'full';
                    let actualQuantity = quantity;
                    
                    if (purchaseType === 'fraction') {
                        actualQuantity = convertCryptoUnits(asset, quantity, 'fraction');
                    }
                    
                    total = asset.currentPrice * actualQuantity;
                } else {
                    total = asset.currentPrice * quantity;
                }
                
                if (asset.currency === 'USD' || asset.currency === 'USDT') {
                    total *= USD_TO_KZ;
                }
                
                document.getElementById('trade-total').textContent = formatCurrency(total);
                
                const warning = document.getElementById('insufficient-funds');
                if (type === 'buy' && total > AppState.user.availableBalance) {
                    warning.style.display = 'block';
                    document.getElementById('confirm-trade').disabled = true;
                } else {
                    warning.style.display = 'none';
                    document.getElementById('confirm-trade').disabled = false;
                }
            }

            function closeTradeModal() {
                document.getElementById('trade-modal').style.display = 'none';
            }

            function updateChartsUI() {
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    const canvas = document.getElementById(`chart-${assetId}`);
                    if (canvas) {
                        renderMiniChart(assetId, asset.priceHistory);
                    }
                });
                
                renderAllocationChart();
            }

            function updateAssetsUI() {
                const activeTab = document.querySelector('.asset-tabs .tab.active');
                if (activeTab) {
                    const category = activeTab.dataset.category;
                    renderAssetsUI(category);
                }
            }

            function showExplanation() {
                const box = document.getElementById('explanation-content');
                const activeTab = document.querySelector('.asset-tabs .tab.active');
                
                if (!activeTab) return;
                
                const category = activeTab.dataset.category;
                const explanation = ASSET_EXPLANATIONS[category];
                
                if (box.style.display === 'none') {
                    box.innerHTML = `
                        <h4>${explanation.title}</h4>
                        <p>${explanation.content}</p>
                    `;
                    box.style.display = 'block';
                } else {
                    box.style.display = 'none';
                }

                        function updatePortfolioUI() {
                    // ✅ CORREÇÃO: Primeiro limpar títulos vencidos
                    cleanupMaturedBonds();
                    
                    // 1. Atualizar saldos
                    document.getElementById('available-balance').textContent = formatCurrency(AppState.user.availableBalance);
                    document.getElementById('invested-amount').textContent = formatCurrency(AppState.portfolio.totalInvested);
                    document.getElementById('current-value').textContent = formatCurrency(AppState.portfolio.currentValue);
                    
                    // 2. Atualizar P&L total
                    const pnlElement = document.getElementById('total-pnl');
                    const pnl = AppState.portfolio.totalPnL;
                    const pnlPct = AppState.portfolio.totalInvested > 0 
                        ? (pnl / AppState.portfolio.totalInvested) * 100 
                        : 0;
                    
                    pnlElement.textContent = `${formatCurrency(pnl)} (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`;
                    pnlElement.className = `value pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
                    
                    // ✅ CORREÇÃO: Adicionar contador de títulos vencidos
                    const bondCount = AppState.portfolio.positions.filter(p => p.type.includes('titulo')).length;
                    const maturedBonds = AppState.portfolio.positions.filter(p => 
                        p.type.includes('titulo') && p.bondInfo && p.bondInfo.matured
                    ).length;
                    
                    if (bondCount > 0) {
                        console.log(`📌 Títulos ativos: ${bondCount}, Vencidos: ${maturedBonds}`);
                    }
                    
                    // ... resto da função permanece igual ...
                }

            }

            // ========================================
            // PERSISTÊNCIA E EXPORTAÇÃO
            // ========================================
            function saveToLocalStorage() {
                const state = {
                    user: AppState.user,
                    portfolio: AppState.portfolio,
                    market: {
                        assets: AppState.market.assets,
                        lastUpdate: AppState.market.lastUpdate
                    },
                    version: '1.1'
                };
                localStorage.setItem('teca_simulator_v1', JSON.stringify(state));
            }

            function loadFromLocalStorage() {
                const saved = localStorage.getItem('teca_simulator_v1');
                if (!saved) return false;
                
                try {
                    const state = JSON.parse(saved);
                    
                    if (!state.version || state.version < '1.1') {
                        console.warn('Versão incompatível, reiniciando simulação');
                        return false;
                    }
                    
                    AppState.user = state.user;
                    AppState.portfolio = state.portfolio;
                    AppState.market.assets = state.market.assets;
                    AppState.market.lastUpdate = state.market.lastUpdate;
                    
                    return true;
                } catch (error) {
                    console.error('Erro ao carregar estado:', error);
                    return false;
                }
            }

            function clearLocalStorage() {
                localStorage.removeItem('teca_simulator_v1');
            }

            async function exportPortfolioAsImage() {
                showNotification('📸 Exportando carteira...', 'info');
                
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 800, 600);
                
                ctx.fillStyle = 'rgb(214, 174, 100)';
                ctx.font = 'bold 32px sans-serif';
                ctx.fillText('TECA CAPITAL INVESTIMENTOS', 50, 60);
                
                ctx.fillStyle = '#fff';
                ctx.font = '20px sans-serif';
                ctx.fillText(`Carteira de ${AppState.user.name}`, 50, 100);
                
                ctx.font = '18px sans-serif';
                let y = 150;
                ctx.fillText(`Saldo Disponível: ${formatCurrency(AppState.user.availableBalance)}`, 50, y);
                y += 30;
                ctx.fillText(`Investido: ${formatCurrency(AppState.portfolio.totalInvested)}`, 50, y);
                y += 30;
                ctx.fillText(`Valor Atual: ${formatCurrency(AppState.portfolio.currentValue)}`, 50, y);
                y += 30;
                
                const pnlColor = AppState.portfolio.totalPnL >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
                ctx.fillStyle = pnlColor;
                ctx.fillText(`P&L: ${formatCurrency(AppState.portfolio.totalPnL)}`, 50, y);
                
                ctx.fillStyle = '#fff';
                y += 50;
                ctx.fillText('Posições Abertas:', 50, y);
                y += 30;
                
                AppState.portfolio.positions.forEach(position => {
                    ctx.font = '16px sans-serif';
                    ctx.fillText(`${position.ticker}: ${position.quantity}x @ ${formatCurrency(position.avgPrice)}`, 70, y);
                    y += 25;
                });
                
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `carteira_${AppState.user.name}_${Date.now()}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showNotification('✅ Carteira exportada com sucesso!', 'success');
                });
            }

            function exportPortfolioAsExcel() {
                let csv = 'TECA CAPITAL INVESTIMENTOS - Carteira de Investimentos\n\n';
                csv += `Investidor:,${AppState.user.name}\n`;
                csv += `Data:,${new Date().toLocaleDateString('pt-AO')}\n`;
                csv += `Cenário:,${AppState.user.scenario}\n\n`;
                
                csv += 'RESUMO\n';
                csv += `Saldo Disponível:,${AppState.user.availableBalance}\n`;
                csv += `Investido:,${AppState.portfolio.totalInvested}\n`;
                csv += `Valor Atual:,${AppState.portfolio.currentValue}\n`;
                csv += `P&L Total:,${AppState.portfolio.totalPnL}\n\n`;
                
                csv += 'POSIÇÕES\n';
                csv += 'Ativo,Ticker,Quantidade,Preço Médio,Preço Atual,P&L,P&L %\n';
                AppState.portfolio.positions.forEach(p => {
                    csv += `${p.name},${p.ticker},${p.quantity},${p.avgPrice},${p.currentPrice},${p.pnl},${p.pnlPercent}\n`;
                });
                
                csv += '\nTRANSAÇÕES\n';
                csv += 'Data/Hora,Ativo,Tipo,Quantidade,Preço,Total,P&L\n';
                AppState.portfolio.transactions.forEach(tx => {
                    csv += `${tx.timestamp},${tx.assetName},${tx.type},${tx.quantity},${tx.price},${tx.total},${tx.pnl || 0}\n`;
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `carteira_${AppState.user.name}_${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                showNotification('✅ Dados exportados em CSV/Excel!', 'success');
            }

            // ========================================
            // INICIALIZAÇÃO DA APLICAÇÃO
            // ========================================
            function setupOnboarding() {
                const form = document.getElementById('user-setup');
                
                document.querySelectorAll('.profile-card').forEach(card => {
                    card.onclick = function() {
                        document.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
                        this.classList.add('selected');
                        AppState.user.profile = this.dataset.profile;
                    };
                });
                
                document.querySelectorAll('.scenario-card').forEach(card => {
                    card.onclick = function() {
                        document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
                        this.classList.add('selected');
                        AppState.user.scenario = this.dataset.scenario;
                    };
                });
                
                document.querySelectorAll('.balance-options button').forEach(btn => {
                    btn.onclick = function() {
                        document.querySelectorAll('.balance-options button').forEach(b => b.classList.remove('selected'));
                        this.classList.add('selected');
                        AppState.user.initialBalance = parseInt(this.dataset.balance);
                        AppState.user.availableBalance = parseInt(this.dataset.balance);
                    };
                });
                
                form.onsubmit = function(e) {
                    e.preventDefault();
                    
                    AppState.user.name = document.getElementById('investor-name').value.trim();
                    AppState.user.region = document.getElementById('region').value;
                    AppState.user.gender = document.getElementById('gender').value;
                    AppState.user.tickInterval = parseInt(document.getElementById('tick-interval').value);
                    
                    if (!AppState.user.name) {
                        showNotification('⚠️ Por favor, insira seu nome', 'error');
                        return;
                    }
                    
                    if (!AppState.user.profile) {
                        showNotification('⚠️ Por favor, selecione seu perfil de investidor', 'error');
                        return;
                    }
                    
                    if (!AppState.user.scenario) {
                        showNotification('⚠️ Por favor, selecione o cenário econômico', 'error');
                        return;
                    }
                    
                    if (!AppState.user.initialBalance) {
                        showNotification('⚠️ Por favor, selecione o saldo inicial', 'error');
                        return;
                    }
                    
                    initializeSimulation();
                };
            }

            function initializeSimulation() {
                showNotification('🚀 Iniciando simulação...', 'info');
                
                initializeMarket();
                showDashboard();
                startMarketUpdates();
                saveToLocalStorage();
            }

            function showDashboard() {
                document.getElementById('onboarding').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                
                document.getElementById('user-name-display').textContent = AppState.user.name;
                document.getElementById('scenario-display').textContent = getScenarioLabel(AppState.user.scenario);
                
                renderAssetsUI('acoes');
                updatePortfolioUI();
                updateTransactionsUI();
                setupAssetTabs();
                
                // Configurar botão de explicação
                document.getElementById('info-btn').onclick = showExplanation;
            }

            function setupAssetTabs() {
                document.querySelectorAll('.asset-tabs .tab').forEach(tab => {
                    tab.onclick = function() {
                        document.querySelectorAll('.asset-tabs .tab').forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                        const category = this.dataset.category;
                        renderAssetsUI(category);
                        
                        // Fechar explicação quando mudar de tab
                        document.getElementById('explanation-content').style.display = 'none';
                    };
                });
            }

            // ========================================
            // EVENT LISTENERS
            // ========================================
            document.addEventListener('DOMContentLoaded', function() {
                const hasSavedState = loadFromLocalStorage();
                
                if (hasSavedState) {
                    if (confirm('Detectamos uma simulação em andamento. Deseja continuar?')) {
                        showDashboard();
                        startMarketUpdates();
                        return;
                    } else {
                        clearLocalStorage();
                    }
                }
                
                setupOnboarding();
            });

            // Modal handlers
            document.getElementById('confirm-trade').onclick = function() {
                const modal = document.getElementById('trade-modal');
                const assetId = modal.dataset.assetId;
                const type = modal.dataset.type;
                const quantityInput = document.getElementById('trade-quantity');
                const quantity = parseFloat(quantityInput.value);
                
                if (!quantity || quantity <= 0) {
                    alert('⚠️ Quantidade inválida');
                    return;
                }
                
                // Validar quantidade mínima para cripto
                const asset = AppState.market.assets[assetId];
                if (asset.type === 'cripto') {
                    const purchaseType = document.querySelector('input[name="purchase-type"]:checked')?.value || 'full';
                    if (purchaseType === 'full' && quantity < asset.minPurchaseUnit) {
                        alert(`⚠️ Quantidade mínima é ${asset.minPurchaseUnit} ${asset.unitName}`);
                        return;
                    }
                }
                
                let result;
                if (type === 'buy') {
                    result = buyAsset(assetId, quantity);
                } else {
                    result = sellAsset(assetId, quantity);
                }
                
                if (result.success) {
                    showNotification(result.message, 'success');
                    closeTradeModal();
                    updatePortfolioUI();
                    updateTransactionsUI();
                } else {
                    showNotification(result.message, 'error');
                }
            };

            document.getElementById('cancel-trade').onclick = closeTradeModal;
            document.querySelector('.modal .close').onclick = closeTradeModal;

            // Export handlers
            document.getElementById('export-portfolio').onclick = exportPortfolioAsImage;
            document.getElementById('export-excel').onclick = exportPortfolioAsExcel;

            // Reset handler
            document.getElementById('reset-simulation').onclick = function() {
                if (confirm('⚠️ Tem certeza que deseja reiniciar a simulação? Todos os dados serão perdidos.')) {
                    stopMarketUpdates();
                    clearLocalStorage();
                    location.reload();
                }
            };

            // Configurar opções de compra fracionada
            document.addEventListener('change', function(e) {
                if (e.target.name === 'purchase-type') {
                    const assetId = document.getElementById('trade-modal').dataset.assetId;
                    const type = document.getElementById('trade-modal').dataset.type;
                    if (assetId && type === 'buy') {
                        calculateTradeTotal(assetId, type);
                    }
                }
            });

            // Global functions para onclick handlers
            window.openTradeModal = openTradeModal;

            // ========================================
        // GESTÃO DE ESTADO DA SIMULAÇÃO (MOBILE + DESKTOP)
        // ========================================

        function setSimulationState(active) {
            if (active) {
                document.body.classList.add('simulation-active');
                document.body.classList.remove('simulation-inactive');
            } else {
                document.body.classList.remove('simulation-active');
                document.body.classList.add('simulation-inactive');
            }
            
            // Para debug (opcional)
            console.log(`Simulation state: ${active ? 'ACTIVE' : 'INACTIVE'}`);
        }

        // MODIFIQUE esta função no código existente:
        function showDashboard() {
            showNotification('🚀 Iniciando simulação...', 'info');
            
            // CRÍTICO: Definir estado da simulação
            setSimulationState(true);
            
            initializeMarket();
            
            // Ocultar onboarding, mostrar dashboard
            document.getElementById('onboarding').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            // Resto do código existente...
            document.getElementById('user-name-display').textContent = AppState.user.name;
            document.getElementById('scenario-display').textContent = getScenarioLabel(AppState.user.scenario);
            
            renderAssetsUI('acoes');
            updatePortfolioUI();
            updateTransactionsUI();
            setupAssetTabs();
            
            // Configurar botão de explicação
            document.getElementById('info-btn').onclick = showExplanation;
            
            startMarketUpdates();
            saveToLocalStorage();
        }

        // MODIFIQUE a função de reset:
        document.getElementById('reset-simulation').onclick = function() {
            if (confirm('⚠️ Tem certeza que deseja reiniciar a simulação? Todos os dados serão perdidos.')) {
                stopMarketUpdates();
                setSimulationState(false); // CRÍTICO: Resetar estado
                clearLocalStorage();
                location.reload();
            }
        };

        (function() {
            'use strict';
            
            // ===== CONFIGURAÇÕES GLOBAIS =====
            const EXT_CONFIG = {
                dividendFrequencies: ['monthly', 'quarterly', 'semiannual', 'annual'],
                sectors: ['Tecnologia', 'Financeiro', 'Varejo', 'Energia', 'Saúde', 'Telecomunicações', 'Indústria', 'Transporte'],
                cryptoCategories: ['Payment', 'DeFi', 'Smart Contract Platform', 'Layer 1', 'Layer 2', 'Meme Coin', 'Oracle', 'Storage'],
                consensusAlgorithms: ['PoW', 'PoS', 'DPoS', 'PoA', 'BFT', 'PoH'],
                bondRatings: ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'],
                ceoNames: ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira', 'Pedro Costa', 'Luísa Fernandes', 'Miguel Rodrigues', 'Sofia Martins']
            };
            
            // ===== ESTRUTURAS DE DADOS GLOBAIS =====
            let EXT_STATE = {
                initialized: false,
                dividendHistory: [],
                lastDividendCheck: Date.now(),
                cryptoTotalMarketCap: 0
            };
            
            // ===== INICIALIZAÇÃO DOS DADOS COMPLEMENTARES =====
            function ext_initializeAdditionalData() {
                if (EXT_STATE.initialized) return;
                
                console.log('🔧 Inicializando dados complementares...');
                
                // Expandir cada ativo com novos dados
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    
                    // Adicionar dados específicos por tipo
                    switch(asset.type) {
                        case 'acao':
                            ext_addDividendsData(asset);
                            ext_addFundamentalsData(asset);
                            ext_addCorporateInfo(asset);
                            break;
                            
                        case 'cripto':
                            ext_addCryptoDetails(asset);
                            break;
                            
                        case 'titulo-publico':
                        case 'titulo-privado':
                            ext_addBondDetails(asset);
                            break;
                            
                        case 'etf':
                            ext_addETFDetails(asset);
                            break;
                    }
                    
                    // Calcular indicadores iniciais
                    ext_calculateAssetIndicators(asset);
                });
                
                // Inicializar market cap total cripto
                ext_calculateTotalCryptoMarketCap();
                
                // Renderizar painéis
                ext_renderDividendsTable();
                ext_renderIndicatorsTable();
                
                EXT_STATE.initialized = true;
                console.log('✅ Dados complementares inicializados!');
            }
            
            // ===== SISTEMA DE DIVIDENDOS =====
            function ext_addDividendsData(asset) {
                // 70% das empresas pagam dividendos
                const paysDividends = Math.random() > 0.3;
                
                if (!paysDividends) {
                    asset.ext_dividends = { enabled: false };
                    return;
                }
                
                const frequency = EXT_CONFIG.dividendFrequencies[Math.floor(Math.random() * EXT_CONFIG.dividendFrequencies.length)];
                const yieldValue = (Math.random() * 0.07 + 0.01); // 1% a 8%
                
                // Calcular próxima data de pagamento baseado na frequência
                const now = new Date();
                let nextPayment = new Date(now);
                
                switch(frequency) {
                    case 'monthly':
                        nextPayment.setMonth(nextPayment.getMonth() + 1);
                        break;
                    case 'quarterly':
                        nextPayment.setMonth(nextPayment.getMonth() + 3);
                        break;
                    case 'semiannual':
                        nextPayment.setMonth(nextPayment.getMonth() + 6);
                        break;
                    case 'annual':
                        nextPayment.setFullYear(nextPayment.getFullYear() + 1);
                        break;
                }
                
                asset.ext_dividends = {
                    enabled: true,
                    frequency: frequency,
                    yield: yieldValue,
                    history: [],
                    nextPayment: nextPayment.toISOString(),
                    lastPayment: null
                };
            }
            
            function ext_processDividends() {
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;
                
                // Verificar dividendos apenas uma vez por dia (em tempo simulado)
                if (now - EXT_STATE.lastDividendCheck < oneDay) return;
                
                EXT_STATE.lastDividendCheck = now;
                
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    
                    if (asset.type !== 'acao' || !asset.ext_dividends?.enabled) return;
                    
                    const dividends = asset.ext_dividends;
                    const nextPayment = new Date(dividends.nextPayment);
                    
                    // Verificar se é dia de pagamento
                    if (now >= nextPayment.getTime()) {
                        ext_payDividends(asset);
                    }
                });
            }
            
            function ext_payDividends(asset) {
                const dividends = asset.ext_dividends;
                const dividendPerShare = asset.currentPrice * dividends.yield;
                
                // Verificar posições do usuário nesta ação
                const userPosition = AppState.portfolio.positions.find(p => p.assetId === asset.id);
                
                if (userPosition && userPosition.quantity > 0) {
                    const totalDividend = dividendPerShare * userPosition.quantity;
                    
                    // Creditar no saldo disponível
                    AppState.user.availableBalance += totalDividend;
                    
                    // Registrar no histórico
                    const dividendRecord = {
                        date: new Date().toISOString(),
                        assetId: asset.id,
                        assetName: asset.name,
                        ticker: asset.ticker,
                        valuePerShare: dividendPerShare,
                        yield: dividends.yield,
                        quantity: userPosition.quantity,
                        total: totalDividend,
                        status: 'Pago'
                    };
                    
                    EXT_STATE.dividendHistory.push(dividendRecord);
                    dividends.history.push(dividendRecord);
                    
                    // Mostrar notificação
                    showNotification(`💰 Dividendos recebidos de ${asset.ticker}: ${formatCurrency(totalDividend)}`, 'success');
                    
                    // Atualizar UI
                    updatePortfolioUI();
                    ext_renderDividendsTable();
                }
                
                // Calcular próxima data de pagamento
                const nextPayment = new Date(dividends.nextPayment);
                switch(dividends.frequency) {
                    case 'monthly':
                        nextPayment.setMonth(nextPayment.getMonth() + 1);
                        break;
                    case 'quarterly':
                        nextPayment.setMonth(nextPayment.getMonth() + 3);
                        break;
                    case 'semiannual':
                        nextPayment.setMonth(nextPayment.getMonth() + 6);
                        break;
                    case 'annual':
                        nextPayment.setFullYear(nextPayment.getFullYear() + 1);
                        break;
                }
                
                dividends.lastPayment = dividends.nextPayment;
                dividends.nextPayment = nextPayment.toISOString();
                
                // Salvar estado
                saveToLocalStorage();
            }
            
            function ext_renderDividendsTable() {
                const tbody = document.getElementById('ext-dividends-body');
                
                if (!tbody) return;
                
                if (EXT_STATE.dividendHistory.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum dividendo recebido ainda.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = EXT_STATE.dividendHistory
                    .slice()
                    .reverse()
                    .map(dividend => `
                        <tr>
                            <td>${new Date(dividend.date).toLocaleDateString('pt-AO')}</td>
                            <td><strong>${dividend.ticker}</strong><br><small>${dividend.assetName}</small></td>
                            <td>${formatCurrency(dividend.valuePerShare)}</td>
                            <td>${(dividend.yield * 100).toFixed(2)}%</td>
                            <td>${dividend.quantity.toLocaleString()}</td>
                            <td class="positive"><strong>${formatCurrency(dividend.total)}</strong></td>
                            <td><span class="badge buy">${dividend.status}</span></td>
                        </tr>
                    `).join('');
            }
            
            // ===== DEMONSTRAÇÕES FINANCEIRAS =====
            function ext_addFundamentalsData(asset) {
                // Geração de valores coerentes e realistas
                const sharesIssued = asset.ext_corporateInfo?.sharesIssued || 
                                Math.floor(Math.random() * 990000000) + 10000000; // 10M a 1B
                
                // Receita aleatória proporcional ao preço
                const revenueBase = asset.initialPrice * 1000000; // Multiplicador base
                const revenue = revenueBase * (Math.random() * 2 + 0.5); // 0.5x a 2.5x
                
                // Custo dos Produtos Vendidos (40-70% da receita)
                const cogs = revenue * (Math.random() * 0.3 + 0.4);
                const grossProfit = revenue - cogs;
                
                // Despesas Operacionais (20-40% do lucro bruto)
                const opex = grossProfit * (Math.random() * 0.2 + 0.2);
                const ebitda = grossProfit - opex;
                
                // Depreciação e Amortização (5-15% do EBITDA)
                const depreciation = ebitda * (Math.random() * 0.1 + 0.05);
                const ebit = ebitda - depreciation;
                
                // Despesas Financeiras (5-20% do EBIT)
                const financialExpenses = ebit * (Math.random() * 0.15 + 0.05);
                const profitBeforeTax = ebit - financialExpenses;
                
                // Impostos (15-35% do lucro antes dos impostos)
                const taxRate = Math.random() * 0.2 + 0.15;
                const taxes = profitBeforeTax * taxRate;
                const netIncome = profitBeforeTax - taxes;
                
                // Balanço Patrimonial (coerente com DRE)
                const currentAssets = revenue * 0.3; // 30% da receita
                const nonCurrentAssets = revenue * 0.8; // 80% da receita
                const totalAssets = currentAssets + nonCurrentAssets;
                
                // Patrimônio Líquido (baseado no lucro acumulado)
                const equity = totalAssets * (Math.random() * 0.3 + 0.3); // 30-60% do ativo
                const currentLiabilities = totalAssets * (Math.random() * 0.2 + 0.1); // 10-30%
                const nonCurrentLiabilities = totalAssets - equity - currentLiabilities;
                const totalLiabilities = currentLiabilities + nonCurrentLiabilities;
                
                // Fluxo de Caixa (coerente com lucro líquido)
                const operatingCashFlow = netIncome * (Math.random() * 0.5 + 0.8); // 80-130% do lucro
                const investingCashFlow = -nonCurrentAssets * 0.1; // Investimento negativo
                const financingCashFlow = -financialExpenses * 2; // Financiamento negativo
                const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
                const beginningCash = currentAssets * 0.3;
                const endingCash = beginningCash + netCashFlow;
                
                asset.ext_fundamentals = {
                    balanceSheet: {
                        assets: {
                            current: currentAssets,
                            nonCurrent: nonCurrentAssets,
                            total: totalAssets
                        },
                        liabilities: {
                            current: currentLiabilities,
                            nonCurrent: nonCurrentLiabilities,
                            equity: equity,
                            total: totalLiabilities + equity
                        }
                    },
                    incomeStatement: {
                        revenue: revenue,
                        cogs: cogs,
                        grossProfit: grossProfit,
                        opex: opex,
                        ebitda: ebitda,
                        depreciation: depreciation,
                        ebit: ebit,
                        financialExpenses: financialExpenses,
                        profitBeforeTax: profitBeforeTax,
                        taxes: taxes,
                        netIncome: netIncome
                    },
                    cashFlow: {
                        operating: operatingCashFlow,
                        investing: investingCashFlow,
                        financing: financingCashFlow,
                        netChange: netCashFlow,
                        beginningCash: beginningCash,
                        endingCash: endingCash
                    }
                };
            }
            
            function ext_renderFinancials(assetId) {
                const asset = AppState.market.assets[assetId];
                if (!asset || !asset.ext_fundamentals) return;
                
                const fundamentals = asset.ext_fundamentals;
                const title = `Demonstrações Financeiras - ${asset.name} (${asset.ticker})`;
                
                document.getElementById('ext-financials-title').textContent = title;
                document.getElementById('ext-financials-modal').style.display = 'block';
                
                // Renderizar balanço patrimonial por padrão
                ext_renderBalanceSheet(fundamentals.balanceSheet);
                
                // Configurar tabs
                document.querySelectorAll('.ext-financials-tabs .tab').forEach(tab => {
                    tab.onclick = function() {
                        document.querySelectorAll('.ext-financials-tabs .tab').forEach(t => t.classList.remove('active'));
                        this.classList.add('active');
                        
                        const statement = this.dataset.statement;
                        switch(statement) {
                            case 'balance':
                                ext_renderBalanceSheet(fundamentals.balanceSheet);
                                break;
                            case 'income':
                                ext_renderIncomeStatement(fundamentals.incomeStatement);
                                break;
                            case 'cashflow':
                                ext_renderCashFlow(fundamentals.cashFlow);
                                break;
                            case 'indicators':
                                ext_renderAssetIndicators(asset);
                                break;
                        }
                    };
                });
            }
            
            function ext_renderBalanceSheet(balanceSheet) {
                const container = document.querySelector('.ext-statement-container');
                if (!container) return;
                
                const bs = balanceSheet;
                
                container.innerHTML = `
                    <table class="ext-statement-table">
                        <thead>
                            <tr>
                                <th>ATIVO</th>
                                <th style="text-align: right;">Valor (Kz)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Circulante</strong></td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.current)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Caixa e Equivalentes</td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.current * 0.3)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Contas a Receber</td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.current * 0.4)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Estoques</td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.current * 0.3)}</td>
                            </tr>
                            <tr>
                                <td><strong>Não Circulante</strong></td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.nonCurrent)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Imobilizado</td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.nonCurrent * 0.7)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Investimentos</td>
                                <td style="text-align: right;">${formatCurrency(bs.assets.nonCurrent * 0.3)}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>TOTAL DO ATIVO</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(bs.assets.total)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <table class="ext-statement-table" style="margin-top: 30px;">
                        <thead>
                            <tr>
                                <th>PASSIVO + PATRIMÔNIO LÍQUIDO</th>
                                <th style="text-align: right;">Valor (Kz)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Circulante</strong></td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.current)}</td>
                            </tr>
                            <tr>
                                <td><strong>Não Circulante</strong></td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.nonCurrent)}</td>
                            </tr>
                            <tr>
                                <td><strong>Patrimônio Líquido</strong></td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.equity)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Capital Social</td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.equity * 0.6)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Reservas</td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.equity * 0.3)}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">• Lucros Acumulados</td>
                                <td style="text-align: right;">${formatCurrency(bs.liabilities.equity * 0.1)}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>TOTAL DO PASSIVO + PL</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(bs.liabilities.total)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }
            
            function ext_renderIncomeStatement(incomeStatement) {
                const container = document.querySelector('.ext-statement-container');
                if (!container) return;
                
                const is = incomeStatement;
                
                container.innerHTML = `
                    <table class="ext-statement-table">
                        <thead>
                            <tr>
                                <th>DEMONSTRAÇÃO DO RESULTADO</th>
                                <th style="text-align: right;">Valor (Kz)</th>
                                <th style="text-align: right;">% Receita</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Receita Operacional Líquida</strong></td>
                                <td style="text-align: right;">${formatCurrency(is.revenue)}</td>
                                <td style="text-align: right;">100.0%</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">(-) Custo dos Produtos Vendidos</td>
                                <td style="text-align: right;">${formatCurrency(is.cogs)}</td>
                                <td style="text-align: right;">${((is.cogs/is.revenue)*100).toFixed(1)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= Lucro Bruto</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(is.grossProfit)}</strong></td>
                                <td style="text-align: right;"><strong>${((is.grossProfit/is.revenue)*100).toFixed(1)}%</strong></td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">(-) Despesas Operacionais</td>
                                <td style="text-align: right;">${formatCurrency(is.opex)}</td>
                                <td style="text-align: right;">${((is.opex/is.revenue)*100).toFixed(1)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= EBITDA</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(is.ebitda)}</strong></td>
                                <td style="text-align: right;"><strong>${((is.ebitda/is.revenue)*100).toFixed(1)}%</strong></td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">(-) Depreciação e Amortização</td>
                                <td style="text-align: right;">${formatCurrency(is.depreciation)}</td>
                                <td style="text-align: right;">${((is.depreciation/is.revenue)*100).toFixed(1)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= EBIT (Lucro Operacional)</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(is.ebit)}</strong></td>
                                <td style="text-align: right;"><strong>${((is.ebit/is.revenue)*100).toFixed(1)}%</strong></td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">(-) Despesas Financeiras</td>
                                <td style="text-align: right;">${formatCurrency(is.financialExpenses)}</td>
                                <td style="text-align: right;">${((is.financialExpenses/is.revenue)*100).toFixed(1)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= Lucro Antes dos Impostos</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(is.profitBeforeTax)}</strong></td>
                                <td style="text-align: right;"><strong>${((is.profitBeforeTax/is.revenue)*100).toFixed(1)}%</strong></td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">(-) Impostos</td>
                                <td style="text-align: right;">${formatCurrency(is.taxes)}</td>
                                <td style="text-align: right;">${((is.taxes/is.revenue)*100).toFixed(1)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= LUCRO LÍQUIDO</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(is.netIncome)}</strong></td>
                                <td style="text-align: right;"><strong>${((is.netIncome/is.revenue)*100).toFixed(1)}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }
            
            function ext_renderCashFlow(cashFlow) {
                const container = document.querySelector('.ext-statement-container');
                if (!container) return;
                
                const cf = cashFlow;
                
                container.innerHTML = `
                    <table class="ext-statement-table">
                        <thead>
                            <tr>
                                <th>FLUXO DE CAIXA</th>
                                <th style="text-align: right;">Valor (Kz)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Atividades Operacionais</strong></td>
                                <td style="text-align: right;" class="${cf.operating >= 0 ? 'positive' : 'negative'}">${formatCurrency(cf.operating)}</td>
                            </tr>
                            <tr>
                                <td><strong>Atividades de Investimento</strong></td>
                                <td style="text-align: right;" class="${cf.investing >= 0 ? 'positive' : 'negative'}">${formatCurrency(cf.investing)}</td>
                            </tr>
                            <tr>
                                <td><strong>Atividades de Financiamento</strong></td>
                                <td style="text-align: right;" class="${cf.financing >= 0 ? 'positive' : 'negative'}">${formatCurrency(cf.financing)}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= Variação de Caixa</strong></td>
                                <td style="text-align: right;" class="${cf.netChange >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(cf.netChange)}</strong></td>
                            </tr>
                            <tr>
                                <td>Saldo Inicial de Caixa</td>
                                <td style="text-align: right;">${formatCurrency(cf.beginningCash)}</td>
                            </tr>
                            <tr class="total-row">
                                <td><strong>= Saldo Final de Caixa</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(cf.endingCash)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }
            
            // ===== INDICADORES FUNDAMENTALISTAS =====
            function ext_calculateAssetIndicators(asset) {
                if (asset.type !== 'acao') return;
                
                const fundamentals = asset.ext_fundamentals;
                const corporateInfo = asset.ext_corporateInfo;
                
                if (!fundamentals || !corporateInfo) return;
                
                const income = fundamentals.incomeStatement;
                const balance = fundamentals.balanceSheet;
                const shares = corporateInfo.sharesIssued;
                const price = asset.currentPrice;
                
                // Cálculo do EPS (Lucro por Ação)
                const eps = income.netIncome / shares;
                
                // P/L Ratio
                const peRatio = eps > 0 ? price / eps : 0;
                
                // P/VPA (Price to Book)
                const bookValuePerShare = balance.liabilities.equity / shares;
                const pbRatio = bookValuePerShare > 0 ? price / bookValuePerShare : 0;
                
                // ROE (Return on Equity)
                const roe = balance.liabilities.equity > 0 ? (income.netIncome / balance.liabilities.equity) * 100 : 0;
                
                // ROA (Return on Assets)
                const roa = balance.assets.total > 0 ? (income.netIncome / balance.assets.total) * 100 : 0;
                
                // Margem Líquida
                const netMargin = income.revenue > 0 ? (income.netIncome / income.revenue) * 100 : 0;
                
                // Margem EBITDA
                const ebitdaMargin = income.revenue > 0 ? (income.ebitda / income.revenue) * 100 : 0;
                
                // Dividend Yield
                const dividendYield = asset.ext_dividends?.enabled ? asset.ext_dividends.yield * 100 : 0;
                
                // Payout Ratio
                const dividendPerShare = price * (dividendYield / 100);
                const payoutRatio = eps > 0 ? (dividendPerShare / eps) * 100 : 0;
                
                // Liquidez Corrente
                const currentRatio = balance.liabilities.current > 0 ? balance.assets.current / balance.liabilities.current : 0;
                
                // Market Cap
                const marketCap = price * shares;
                corporateInfo.marketCap = marketCap;
                
                asset.ext_indicators = {
                    eps: eps,
                    peRatio: peRatio,
                    pbRatio: pbRatio,
                    roe: roe,
                    roa: roa,
                    netMargin: netMargin,
                    ebitdaMargin: ebitdaMargin,
                    dividendYield: dividendYield,
                    payoutRatio: payoutRatio,
                    currentRatio: currentRatio,
                    marketCap: marketCap
                };
                
                return asset.ext_indicators;
            }
            
            function ext_renderAssetIndicators(asset) {
                const container = document.querySelector('.ext-statement-container');
                if (!container || !asset.ext_indicators) return;
                
                const indicators = asset.ext_indicators;
                
                container.innerHTML = `
                    <table class="ext-statement-table">
                        <thead>
                            <tr>
                                <th>INDICADOR</th>
                                <th style="text-align: right;">VALOR</th>
                                <th style="text-align: center;">INTERPRETAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>P/L (Price to Earnings)</strong></td>
                                <td style="text-align: right;">${indicators.peRatio.toFixed(2)}</td>
                                <td style="text-align: center;">${ext_interpretPERatio(indicators.peRatio)}</td>
                            </tr>
                            <tr>
                                <td><strong>P/VPA (Price to Book)</strong></td>
                                <td style="text-align: right;">${indicators.pbRatio.toFixed(2)}</td>
                                <td style="text-align: center;">${ext_interpretPBRatio(indicators.pbRatio)}</td>
                            </tr>
                            <tr>
                                <td><strong>ROE (Return on Equity)</strong></td>
                                <td style="text-align: right;">${indicators.roe.toFixed(2)}%</td>
                                <td style="text-align: center;">${ext_interpretROE(indicators.roe)}</td>
                            </tr>
                            <tr>
                                <td><strong>ROA (Return on Assets)</strong></td>
                                <td style="text-align: right;">${indicators.roa.toFixed(2)}%</td>
                                <td style="text-align: center;">${ext_interpretROA(indicators.roa)}</td>
                            </tr>
                            <tr>
                                <td><strong>Margem Líquida</strong></td>
                                <td style="text-align: right;">${indicators.netMargin.toFixed(2)}%</td>
                                <td style="text-align: center;">${ext_interpretMargin(indicators.netMargin)}</td>
                            </tr>
                            <tr>
                                <td><strong>Dividend Yield</strong></td>
                                <td style="text-align: right;">${indicators.dividendYield.toFixed(2)}%</td>
                                <td style="text-align: center;">${ext_interpretDividendYield(indicators.dividendYield)}</td>
                            </tr>
                            <tr>
                                <td><strong>Payout Ratio</strong></td>
                                <td style="text-align: right;">${indicators.payoutRatio.toFixed(2)}%</td>
                                <td style="text-align: center;">${ext_interpretPayoutRatio(indicators.payoutRatio)}</td>
                            </tr>
                            <tr>
                                <td><strong>Liquidez Corrente</strong></td>
                                <td style="text-align: right;">${indicators.currentRatio.toFixed(2)}</td>
                                <td style="text-align: center;">${ext_interpretCurrentRatio(indicators.currentRatio)}</td>
                            </tr>
                            <tr>
                                <td><strong>Market Cap</strong></td>
                                <td style="text-align: right;">${formatCurrency(indicators.marketCap)}</td>
                                <td style="text-align: center;">${ext_interpretMarketCap(indicators.marketCap)}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }
            
            function ext_interpretPERatio(pe) {
                if (pe <= 0) return 'Prejuízo';
                if (pe < 10) return '📉 Subvalorizado';
                if (pe < 20) return '⚖️ Justo';
                if (pe < 30) return '📈 Sobrevalorizado';
                return '🚀 Muito Sobrevalorizado';
            }
            
            function ext_interpretPBRatio(pb) {
                if (pb < 1) return '📉 Subvalorizado';
                if (pb < 2) return '⚖️ Justo';
                if (pb < 4) return '📈 Sobrevalorizado';
                return '🚀 Muito Sobrevalorizado';
            }
            
            function ext_interpretROE(roe) {
                if (roe < 5) return '📉 Fraco';
                if (roe < 15) return '⚖️ Médio';
                if (roe < 25) return '📈 Bom';
                return '🚀 Excelente';
            }
            
            function ext_interpretMargin(margin) {
                if (margin < 5) return '📉 Baixa';
                if (margin < 15) return '⚖️ Média';
                if (margin < 25) return '📈 Alta';
                return '🚀 Muito Alta';
            }
            
            function ext_interpretDividendYield(dy) {
                if (dy === 0) return '📭 Não paga';
                if (dy < 2) return '📈 Baixo';
                if (dy < 5) return '⚖️ Médio';
                if (dy < 8) return '💰 Alto';
                return '💎 Muito Alto';
            }
            
            // ===== INFORMAÇÕES CORPORATIVAS =====
            function ext_addCorporateInfo(asset) {
                const sector = EXT_CONFIG.sectors[Math.floor(Math.random() * EXT_CONFIG.sectors.length)];
                const sharesIssued = Math.floor(Math.random() * 990000000) + 10000000; // 10M a 1B
                const freeFloat = Math.random() * 0.5 + 0.3; // 30% a 80%
                const founded = Math.floor(Math.random() * 41) + 1980; // 1980 a 2020
                const ceo = EXT_CONFIG.ceoNames[Math.floor(Math.random() * EXT_CONFIG.ceoNames.length)];
                
                asset.ext_corporateInfo = {
                    sector: sector,
                    sharesIssued: sharesIssued,
                    freeFloat: freeFloat,
                    founded: founded,
                    ceo: ceo,
                    marketCap: 0 // Será calculado depois
                };
            }
            
            function ext_renderIndicatorsTable() {
                const tbody = document.getElementById('ext-indicators-body');
                if (!tbody) return;
                
                // Filtrar apenas ações
                const stocks = Object.values(AppState.market.assets)
                    .filter(asset => asset.type === 'acao' && asset.ext_indicators)
                    .sort((a, b) => (b.ext_indicators?.marketCap || 0) - (a.ext_indicators?.marketCap || 0));
                
                if (stocks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma ação com indicadores disponíveis.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = stocks.map(asset => {
                    const indicators = asset.ext_indicators;
                    const corporate = asset.ext_corporateInfo;
                    
                    return `
                        <tr>
                            <td><strong>${asset.ticker}</strong><br><small>${asset.name}</small></td>
                            <td>${corporate?.sector || '-'}</td>
                            <td class="${indicators.peRatio < 15 ? 'positive' : indicators.peRatio > 25 ? 'negative' : ''}">
                                ${indicators.peRatio.toFixed(1)}
                            </td>
                            <td class="${indicators.pbRatio < 1 ? 'positive' : indicators.pbRatio > 3 ? 'negative' : ''}">
                                ${indicators.pbRatio.toFixed(1)}
                            </td>
                            <td class="${indicators.roe > 15 ? 'positive' : indicators.roe < 5 ? 'negative' : ''}">
                                ${indicators.roe.toFixed(1)}%
                            </td>
                            <td class="${indicators.dividendYield > 4 ? 'positive' : ''}">
                                ${indicators.dividendYield.toFixed(2)}%
                            </td>
                            <td class="${indicators.netMargin > 15 ? 'positive' : indicators.netMargin < 5 ? 'negative' : ''}">
                                ${indicators.netMargin.toFixed(1)}%
                            </td>
                            <td>${formatCurrency(indicators.marketCap)}</td>
                        </tr>
                    `;
                }).join('');
            }
            
            // ===== DETALHES DE TÍTULOS =====
            function ext_addBondDetails(asset) {
                const isPublic = asset.type === 'titulo-publico';
                const issuer = isPublic ? 'Governo de Angola' : asset.issuer || 'Emissor Privado';
                const rating = isPublic ? 'AAA' : EXT_CONFIG.bondRatings[Math.floor(Math.random() * 5) + 5]; // BBB para privados
                
                // Valor nominal padrão
                const nominalValue = asset.initialPrice >= 50000 ? 100000 : 50000;
                
                // Frequência de pagamento (semestral para >1 ano, anual para <=1 ano)
                const paymentFrequency = asset.maturity > 1 ? 'semiannual' : 'annual';
                
                asset.ext_bondDetails = {
                    issuer: issuer,
                    nominalValue: nominalValue,
                    paymentFrequency: paymentFrequency,
                    rating: rating,
                    issueDate: new Date(Date.now() - (asset.maturity * 365 * 24 * 60 * 60 * 1000)).toISOString(),
                    maturityDate: new Date(Date.now() + (asset.maturity * 365 * 24 * 60 * 60 * 1000)).toISOString()
                };
            }
            
            function ext_openBondDetails(assetId) {
                const asset = AppState.market.assets[assetId];
                if (!asset || !asset.ext_bondDetails) return;
                
                const details = asset.ext_bondDetails;
                const couponRate = asset.couponRate || 0;
                const maturity = asset.maturity || 1;
                const currentPrice = asset.currentPrice || details.nominalValue;
                
                // Calcular YTM (Yield to Maturity)
                const ytm = ext_calculateYTM(details.nominalValue, currentPrice, couponRate, maturity);
                
                // Preencher modal
                document.getElementById('ext-bond-title').textContent = `Detalhes do Título - ${asset.name}`;
                document.getElementById('ext-bond-name').textContent = asset.name;
                document.getElementById('ext-bond-issuer').textContent = details.issuer;
                document.getElementById('ext-bond-maturity').textContent = `${maturity} ano(s) - até ${new Date(details.maturityDate).toLocaleDateString('pt-AO')}`;
                document.getElementById('ext-bond-rate').textContent = `${(couponRate * 100).toFixed(2)}% a.a.`;
                document.getElementById('ext-bond-rating').textContent = details.rating;
                document.getElementById('ext-bond-nominal').textContent = formatCurrency(details.nominalValue);
                document.getElementById('ext-bond-ytm').textContent = `${ytm.toFixed(2)}%`;
                
                // Gerar cronograma de pagamentos
                const schedule = ext_generateBondSchedule(asset);
                const tbody = document.getElementById('ext-bond-schedule-body');
                
                if (schedule.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Sem pagamentos futuros.</td></tr>';
                } else {
                    tbody.innerHTML = schedule.map(payment => `
                        <tr>
                            <td>${payment.paymentNumber}</td>
                            <td>${payment.date}</td>
                            <td>${payment.type}</td>
                            <td>${formatCurrency(payment.value)}</td>
                        </tr>
                    `).join('');
                }
                
                // Mostrar modal
                document.getElementById('ext-bond-details-modal').style.display = 'block';
            }
            
            function ext_calculateYTM(nominal, price, couponRate, years) {
                // Cálculo simplificado do YTM
                const annualCoupon = nominal * couponRate;
                const totalCoupons = annualCoupon * years;
                const capitalGain = nominal - price;
                
                return ((totalCoupons + capitalGain) / price / years) * 100;
            }
            
            function ext_generateBondSchedule(asset) {
                const details = asset.ext_bondDetails;
                if (!details) return [];
                
                const schedule = [];
                const couponRate = asset.couponRate || 0;
                const maturity = asset.maturity || 1;
                const nominalValue = details.nominalValue;
                const frequency = details.paymentFrequency;
                const paymentsPerYear = frequency === 'semiannual' ? 2 : 1;
                const totalPayments = maturity * paymentsPerYear;
                const couponPayment = nominalValue * couponRate / paymentsPerYear;
                
                let currentDate = new Date();
                
                for (let i = 1; i <= totalPayments; i++) {
                    const paymentDate = new Date(currentDate);
                    
                    if (frequency === 'semiannual') {
                        paymentDate.setMonth(paymentDate.getMonth() + 6);
                    } else {
                        paymentDate.setFullYear(paymentDate.getFullYear() + 1);
                    }
                    
                    const isFinalPayment = i === totalPayments;
                    const paymentValue = isFinalPayment ? nominalValue + couponPayment : couponPayment;
                    
                    schedule.push({
                        paymentNumber: i,
                        date: paymentDate.toLocaleDateString('pt-AO'),
                        type: isFinalPayment ? 'Principal + Cupom' : 'Cupom',
                        value: paymentValue
                    });
                    
                    currentDate = paymentDate;
                }
                
                return schedule;
            }
            
            // ===== DETALHES DE CRIPTOMOEDAS =====
            function ext_addCryptoDetails(asset) {
                const category = EXT_CONFIG.cryptoCategories[Math.floor(Math.random() * EXT_CONFIG.cryptoCategories.length)];
                const consensus = EXT_CONFIG.consensusAlgorithms[Math.floor(Math.random() * EXT_CONFIG.consensusAlgorithms.length)];
                
                // Gerar ATH histórico (1.5x a 3x do preço inicial)
                const athMultiplier = Math.random() * 1.5 + 1.5;
                const ath = asset.initialPrice * athMultiplier;
                const athDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString();
                
                asset.ext_cryptoDetails = {
                    category: category,
                    consensus: consensus,
                    website: `https://${asset.ticker.toLowerCase()}.org`,
                    whitepaper: `https://${asset.ticker.toLowerCase()}.org/whitepaper`,
                    ath: ath,
                    athDate: athDate,
                    volume24h: 0, // Será calculado
                    dominance: 0  // Será calculado
                };
            }
            
            function ext_calculateCryptoMetrics(crypto) {
                if (!crypto.ext_cryptoDetails) return;
                
                const details = crypto.ext_cryptoDetails;
                const supplyCirc = crypto.supplyCirc || 0;
                const currentPrice = crypto.currentPrice || 0;
                
                // Market Cap em USD
                const marketCap = currentPrice * supplyCirc;
                
                // Volume 24h (5-20% do market cap)
                const volume24h = marketCap * (Math.random() * 0.15 + 0.05);
                details.volume24h = volume24h;
                
                // Calcular variações percentuais
                const history = crypto.priceHistory || [];
                if (history.length > 1) {
                    const current = history[history.length - 1];
                    const prev24h = history[Math.max(0, history.length - Math.min(24, history.length))] || current;
                    const prev7d = history[Math.max(0, history.length - Math.min(168, history.length))] || current;
                    const prev30d = history[0] || current;
                    
                    details.change24h = ((current - prev24h) / prev24h) * 100;
                    details.change7d = ((current - prev7d) / prev7d) * 100;
                    details.change30d = ((current - prev30d) / prev30d) * 100;
                }
                
                // Distância do ATH
                details.athDistance = ((currentPrice - details.ath) / details.ath) * 100;
                
                return details;
            }
            
            function ext_calculateTotalCryptoMarketCap() {
                let totalMarketCap = 0;
                
                Object.values(AppState.market.assets).forEach(asset => {
                    if (asset.type === 'cripto') {
                        const supplyCirc = asset.supplyCirc || 0;
                        const currentPrice = asset.currentPrice || 0;
                        totalMarketCap += currentPrice * supplyCirc;
                    }
                });
                
                EXT_STATE.cryptoTotalMarketCap = totalMarketCap;
                
                // Calcular dominância para cada cripto
                Object.values(AppState.market.assets).forEach(asset => {
                    if (asset.type === 'cripto' && asset.ext_cryptoDetails) {
                        const supplyCirc = asset.supplyCirc || 0;
                        const currentPrice = asset.currentPrice || 0;
                        const marketCap = currentPrice * supplyCirc;
                        
                        asset.ext_cryptoDetails.dominance = totalMarketCap > 0 ? 
                            (marketCap / totalMarketCap) * 100 : 0;
                    }
                });
            }
            
            function ext_openCryptoDetails(assetId) {
                const asset = AppState.market.assets[assetId];
                if (!asset || asset.type !== 'cripto' || !asset.ext_cryptoDetails) return;
                
                const details = ext_calculateCryptoMetrics(asset);
                if (!details) return;
                
                // Preencher modal
                document.getElementById('ext-crypto-title').textContent = `Detalhes - ${asset.name} (${asset.ticker})`;
                document.getElementById('ext-crypto-marketcap').textContent = `$${(asset.currentPrice * asset.supplyCirc).toLocaleString('en-US', {maximumFractionDigits: 0})}`;
                document.getElementById('ext-crypto-volume24h').textContent = `$${details.volume24h.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
                document.getElementById('ext-crypto-dominance').textContent = `${details.dominance.toFixed(2)}%`;
                document.getElementById('ext-crypto-ath').textContent = `$${details.ath.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                document.getElementById('ext-crypto-ath-distance').textContent = `${details.athDistance.toFixed(2)}%`;
                document.getElementById('ext-crypto-category').textContent = details.category;
                document.getElementById('ext-crypto-consensus').textContent = details.consensus;
                
                // Performance
                document.getElementById('ext-crypto-change24h').textContent = `${details.change24h >= 0 ? '+' : ''}${details.change24h?.toFixed(2) || '0.00'}%`;
                document.getElementById('ext-crypto-change24h').className = `ext-performance-value ${details.change24h >= 0 ? 'positive' : 'negative'}`;
                
                document.getElementById('ext-crypto-change7d').textContent = `${details.change7d >= 0 ? '+' : ''}${details.change7d?.toFixed(2) || '0.00'}%`;
                document.getElementById('ext-crypto-change7d').className = `ext-performance-value ${details.change7d >= 0 ? 'positive' : 'negative'}`;
                
                document.getElementById('ext-crypto-change30d').textContent = `${details.change30d >= 0 ? '+' : ''}${details.change30d?.toFixed(2) || '0.00'}%`;
                document.getElementById('ext-crypto-change30d').className = `ext-performance-value ${details.change30d >= 0 ? 'positive' : 'negative'}`;
                
                // Mostrar modal
                document.getElementById('ext-crypto-details-modal').style.display = 'block';
            }
            
            // ===== DETALHES DE ETFs =====
            function ext_addETFDetails(asset) {
                const manager = 'Teca Asset Management';
                const holdings = [];
                
                // Gerar holdings fictícios baseado no tipo de ETF
                if (asset.ticker.includes('BODIVA')) {
                    // ETF de ações Angolanas
                    const angolanStocks = Object.values(AppState.market.assets)
                        .filter(a => a.type === 'acao' && a.country === 'AO')
                        .slice(0, 8);
                    
                    let remainingWeight = 100;
                    angolanStocks.forEach((stock, index) => {
                        const weight = index === angolanStocks.length - 1 ? 
                            remainingWeight : 
                            Math.random() * (remainingWeight / 2) + 5;
                        
                        holdings.push({
                            ticker: stock.ticker,
                            name: stock.name,
                            weight: weight
                        });
                        
                        remainingWeight -= weight;
                    });
                } else if (asset.ticker.includes('CRYPTO')) {
                    // ETF de cripto
                    holdings.push({ ticker: 'BTC', name: 'Bitcoin', weight: 70 });
                    holdings.push({ ticker: 'ETH', name: 'Ethereum', weight: 30 });
                } else {
                    // ETF genérico
                    holdings.push({ ticker: 'AAPL', name: 'Apple Inc.', weight: 25 });
                    holdings.push({ ticker: 'MSFT', name: 'Microsoft', weight: 20 });
                    holdings.push({ ticker: 'GOOGL', name: 'Alphabet', weight: 15 });
                    holdings.push({ ticker: 'AMZN', name: 'Amazon', weight: 15 });
                    holdings.push({ ticker: 'META', name: 'Meta Platforms', weight: 10 });
                    holdings.push({ ticker: 'TSLA', name: 'Tesla', weight: 10 });
                    holdings.push({ ticker: 'NVDA', name: 'NVIDIA', weight: 5 });
                }
                
                // Ajustar pesos para somar 100%
                const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
                if (totalWeight !== 100) {
                    const factor = 100 / totalWeight;
                    holdings.forEach(h => h.weight *= factor);
                }
                
                asset.ext_etfDetails = {
                    manager: manager,
                    benchmark: asset.ticker.includes('BODIVA') ? 'BODIVA Index' : 'S&P 500',
                    holdings: holdings,
                    expenseRatio: Math.random() * 0.015 + 0.005, // 0.5% a 2%
                    aum: Math.random() * 5000000000 + 1000000000, // 1B a 6B Kz
                    dividendYield: Math.random() * 0.03, // 0% a 3%
                    shareholders: Math.floor(Math.random() * 90000) + 10000 // 10k a 100k
                };
            }
            
            // ===== INTEGRAÇÃO COM LOOP PRINCIPAL =====
            function ext_updateAllData() {
                // Processar dividendos
                ext_processDividends();
                
                // Atualizar indicadores para todos os ativos
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    
                    // Recalcular indicadores para ações
                    if (asset.type === 'acao') {
                        ext_calculateAssetIndicators(asset);
                        
                        // Atualizar market cap
                        if (asset.ext_corporateInfo && asset.ext_indicators) {
                            const shares = asset.ext_corporateInfo.sharesIssued;
                            asset.ext_indicators.marketCap = asset.currentPrice * shares;
                            asset.ext_corporateInfo.marketCap = asset.currentPrice * shares;
                        }
                    }
                    
                    // Atualizar métricas de cripto
                    if (asset.type === 'cripto') {
                        ext_calculateCryptoMetrics(asset);
                    }
                    
                    // Atualizar preço de títulos (pode variar levemente do nominal)
                    if (asset.type.includes('titulo')) {
                        // Manter preço próximo ao nominal com pequenas variações
                        const nominal = asset.ext_bondDetails?.nominalValue || asset.initialPrice;
                        const variation = (Math.random() - 0.5) * 0.02; // ±1%
                        asset.currentPrice = nominal * (1 + variation);
                    }
                });
                
                // Atualizar market cap total cripto
                ext_calculateTotalCryptoMarketCap();
                
                // Atualizar tabelas de UI
                ext_renderDividendsTable();
                ext_renderIndicatorsTable();
            }
            
            // ===== HOOK NO SISTEMA EXISTENTE =====
            // Integrar com updateMarketPrices existente
            const originalUpdateMarketPrices = updateMarketPrices;
            window.updateMarketPrices = function() {
                originalUpdateMarketPrices();
                ext_updateAllData();
            };
            
            // Expandir renderAssetsUI para mostrar indicadores
            const originalRenderAssetsUI = window.renderAssetsUI;
            window.renderAssetsUI = function(category) {
                originalRenderAssetsUI(category);
                ext_addIndicatorsToAssetCards();
            };
            
            function ext_addIndicatorsToAssetCards() {
                // Adicionar indicadores e botões extras aos cards
                document.querySelectorAll('.asset-card').forEach(card => {
                    const tickerElement = card.querySelector('.ticker');
                    if (!tickerElement) return;
                    
                    const ticker = tickerElement.textContent;
                    const asset = Object.values(AppState.market.assets).find(a => a.ticker === ticker);
                    if (!asset) return;
                    
                    // Remover qualquer conteúdo adicional existente
                    const existingExtActions = card.querySelector('.ext-asset-actions');
                    const existingMiniIndicators = card.querySelector('.ext-mini-indicators');
                    if (existingExtActions) existingExtActions.remove();
                    if (existingMiniIndicators) existingMiniIndicators.remove();
                    
                    // Adicionar botões extras baseado no tipo
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'ext-asset-actions';
                    
                    switch(asset.type) {
                        case 'acao':
                            if (asset.ext_fundamentals) {
                                actionsDiv.innerHTML += `
                                    <button class="ext-btn-info" onclick="window.EXT_MODULE.openFinancials('${asset.id}')">
                                        📊 Demonstrações
                                    </button>
                                `;
                            }
                            
                            if (asset.ext_dividends?.enabled) {
                                const nextPayment = new Date(asset.ext_dividends.nextPayment);
                                const daysUntil = Math.ceil((nextPayment - Date.now()) / (1000 * 60 * 60 * 24));
                                
                                actionsDiv.innerHTML += `
                                    <button class="ext-btn-info" style="background: rgba(34, 197, 94, 0.2); border-color: var(--success); color: var(--success);">
                                        💰 DY: ${(asset.ext_dividends.yield * 100).toFixed(2)}%
                                    </button>
                                `;
                            }
                            break;
                            
                        case 'cripto':
                            actionsDiv.innerHTML += `
                                <button class="ext-btn-info" onclick="window.EXT_MODULE.openCryptoDetails('${asset.id}')">
                                    📈 Detalhes
                                </button>
                            `;
                            break;
                            
                        case 'titulo-publico':
                        case 'titulo-privado':
                            actionsDiv.innerHTML += `
                                <button class="ext-btn-info" onclick="window.EXT_MODULE.openBondDetails('${asset.id}')">
                                    📅 Cronograma
                                </button>
                            `;
                            break;
                    }
                    
                    // Adicionar mini-indicadores para ações
                    if (asset.type === 'acao' && asset.ext_indicators) {
                        const indicators = asset.ext_indicators;
                        const indicatorsDiv = document.createElement('div');
                        indicatorsDiv.className = 'ext-mini-indicators';
                        
                        indicatorsDiv.innerHTML = `
                            <div class="ext-indicator-item">
                                <span class="ext-indicator-label">P/L</span>
                                <span class="ext-indicator-value ${indicators.peRatio < 15 ? 'positive' : indicators.peRatio > 25 ? 'negative' : ''}">
                                    ${indicators.peRatio.toFixed(1)}
                                </span>
                            </div>
                            <div class="ext-indicator-item">
                                <span class="ext-indicator-label">ROE</span>
                                <span class="ext-indicator-value ${indicators.roe > 15 ? 'positive' : indicators.roe < 5 ? 'negative' : ''}">
                                    ${indicators.roe.toFixed(1)}%
                                </span>
                            </div>
                            <div class="ext-indicator-item">
                                <span class="ext-indicator-label">DY</span>
                                <span class="ext-indicator-value ${indicators.dividendYield > 4 ? 'positive' : ''}">
                                    ${indicators.dividendYield.toFixed(2)}%
                                </span>
                            </div>
                            <div class="ext-indicator-item">
                                <span class="ext-indicator-label">Margem</span>
                                <span class="ext-indicator-value ${indicators.netMargin > 15 ? 'positive' : indicators.netMargin < 5 ? 'negative' : ''}">
                                    ${indicators.netMargin.toFixed(1)}%
                                </span>
                            </div>
                        `;
                        
                        card.insertBefore(indicatorsDiv, card.querySelector('.asset-actions'));
                    }
                    
                    card.insertBefore(actionsDiv, card.querySelector('.asset-actions'));
                });
            }
            
            // ===== INTEGRAÇÃO COM INTERFACE EXISTENTE =====
            function ext_addNavigationButtons() {
                // Adicionar botões de navegação para novas seções
                const headerActions = document.querySelector('.header-actions');
                if (!headerActions) return;
                
                dividendsBtn.onclick = function() {
            // Scroll suave até a tabela
            const panel = document.querySelector('.ext-dividends-panel');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
                // Destacar temporariamente
                panel.style.border = '3px solid var(--accent-green)';
                setTimeout(() => {
                    panel.style.border = '2px solid var(--gray-medium)';
                }, 2000);
            }
            
            // Atualizar dados
            ext_renderDividendsTable();
        };
                
                const fundamentalsBtn = document.createElement('button');
                fundamentalsBtn.className = 'btn-secondary';
                fundamentalsBtn.innerHTML = '📊 Indicadores';
                fundamentalsBtn.onclick = function() {
                    const panel = document.querySelector('.ext-fundamentals-panel');
                    const dividendsPanel = document.querySelector('.ext-dividends-panel');
                    
                    if (panel.style.display === 'none') {
                        panel.style.display = 'block';
                        if (dividendsPanel) dividendsPanel.style.display = 'none';
                        ext_renderIndicatorsTable();
                    } else {
                        panel.style.display = 'none';
                    }
                };
                
                headerActions.appendChild(dividendsBtn);
                headerActions.appendChild(fundamentalsBtn);
            }
            
            // ===== MANIPULAÇÃO DE MODAIS =====
            function ext_setupModalHandlers() {
                // Fechar modais
                document.querySelectorAll('.ext-modal-close').forEach(closeBtn => {
                    closeBtn.onclick = function() {
                        this.closest('.modal').style.display = 'none';
                    };
                });
                
                // Fechar modal ao clicar fora
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.onclick = function(event) {
                        if (event.target === this) {
                            this.style.display = 'none';
                        }
                    };
                });
            }
            
            // ===== INICIALIZAÇÃO =====
            function ext_initialize() {
                // Aguardar inicialização do simulador principal
                const checkInterval = setInterval(() => {
                    if (AppState.user.name && AppState.market.assets) {
                        clearInterval(checkInterval);
                        
                        // Inicializar dados complementares
                        ext_initializeAdditionalData();
                        
                        // Adicionar navegação
                        ext_addNavigationButtons();
                        
                        // Configurar handlers de modais
                        ext_setupModalHandlers();
                        
                        // Mostrar painéis inicialmente ocultos
                        setTimeout(() => {
                            ext_renderDividendsTable();
                            ext_renderIndicatorsTable();
                        }, 1000);
                        
                        console.log('✅ Módulo complementar totalmente inicializado!');
                    }
                }, 500);
            }
            
            // Corrigir fechamento de todos os modais
        function fixModalCloseButtons() {
            // Fechar modal padrão (trade-modal)
            const closeButtons = document.querySelectorAll('.close');
            const extCloseButtons = document.querySelectorAll('.ext-modal-close');
            
            // Função para fechar qualquer modal
            function closeModal(modal) {
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
            
            // Adicionar eventos aos botões .close padrão
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    closeModal(modal);
                });
            });
            
            // Adicionar eventos aos botões .ext-modal-close
            extCloseButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    closeModal(modal);
                });
            });
            
            // Fechar modal clicando fora (para todos os modais)
            document.addEventListener('click', function(event) {
                if (event.target.classList.contains('modal')) {
                    closeModal(event.target);
                }
            });
            
            // Fechar com ESC key
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    const openModals = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display:block"]');
                    openModals.forEach(modal => closeModal(modal));
                }
            });
        }

        // Chamar após o DOM carregar
        document.addEventListener('DOMContentLoaded', fixModalCloseButtons);

            // ===== INTEGRAÇÃO COM PERSISTÊNCIA EXISTENTE =====
            // Salvar dados complementares
            const originalSaveToLocalStorage = saveToLocalStorage;
            window.saveToLocalStorage = function() {
                // Adicionar dados complementares ao estado salvo
                const stateToSave = JSON.parse(localStorage.getItem('teca_simulator_v1') || '{}');
                stateToSave.ext_data = {
                    dividendHistory: EXT_STATE.dividendHistory,
                    cryptoTotalMarketCap: EXT_STATE.cryptoTotalMarketCap,
                    lastDividendCheck: EXT_STATE.lastDividendCheck
                };
                
                localStorage.setItem('teca_simulator_v1', JSON.stringify(stateToSave));
                originalSaveToLocalStorage();
            };
            
            // Carregar dados complementares
            const originalLoadFromLocalStorage = loadFromLocalStorage;
            window.loadFromLocalStorage = function() {
                const success = originalLoadFromLocalStorage();
                
                if (success) {
                    const savedState = JSON.parse(localStorage.getItem('teca_simulator_v1') || '{}');
                    if (savedState.ext_data) {
                        EXT_STATE.dividendHistory = savedState.ext_data.dividendHistory || [];
                        EXT_STATE.cryptoTotalMarketCap = savedState.ext_data.cryptoTotalMarketCap || 0;
                        EXT_STATE.lastDividendCheck = savedState.ext_data.lastDividendCheck || Date.now();
                    }
                }
                
                return success;
            };
            
            // ===== EXPOSIÇÃO GLOBAL PARA DEBUG E INTEGRAÇÃO =====
            window.EXT_MODULE = {
                // Inicialização
                initialize: ext_initialize,
                initializeAdditionalData: ext_initializeAdditionalData,
                
                // Dividendos
                processDividends: ext_processDividends,
                renderDividendsTable: ext_renderDividendsTable,
                
                // Demonstrações Financeiras
                openFinancials: ext_renderFinancials,
                calculateIndicators: ext_calculateAssetIndicators,
                
                // Títulos
                openBondDetails: ext_openBondDetails,
                calculateYTM: ext_calculateYTM,
                generateBondSchedule: ext_generateBondSchedule,
                
                // Criptomoedas
                openCryptoDetails: ext_openCryptoDetails,
                calculateCryptoMetrics: ext_calculateCryptoMetrics,
                
                // Atualização geral
                updateAllData: ext_updateAllData,
                
                // Estado
                getState: () => EXT_STATE,
                getConfig: () => EXT_CONFIG
            };
            
            // ===== INICIAR QUANDO O DOM ESTIVER PRONTO =====
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ext_initialize);
            } else {
                ext_initialize();
            }
            
        })();

        // ===== Capital de Mercado e outras alterações =====

        (function() {
            'use strict';
            
            // ===== INICIALIZAÇÃO DE DADOS COMPLEMENTARES =====
            
            function ext_initializeMarketCapData() {
                Object.keys(AppState.market.assets).forEach(assetId => {
                    const asset = AppState.market.assets[assetId];
                    
                    if (asset.type === 'acao') {
                        // Gerar dados de ações
                        const sharesIssued = Math.floor(Math.random() * 990000000) + 10000000; // 10M - 1B
                        const freeFloatPercent = Math.random() * 0.5 + 0.3; // 30-80%
                        const sharesOutstanding = Math.floor(sharesIssued * (0.9 + Math.random() * 0.05)); // 90-95%
                        
                        asset.stockInfo = {
                            sharesIssued: sharesIssued,
                            sharesOutstanding: sharesOutstanding,
                            freeFloat: freeFloatPercent,
                            lockedShares: sharesIssued - sharesOutstanding
                        };
                    }
                });
            }
            
            // ===== FUNÇÕES DE FORMATAÇÃO =====
            
            function formatMarketCap(value) {
                if (value >= 1000000000) {
                    return `${(value / 1000000000).toFixed(2)} B Kz`;
                } else if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(2)} M Kz`;
                } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(2)} K Kz`;
                }
                return `${value.toFixed(2)} Kz`;
            }
            
            function formatShares(value) {
                if (value >= 1000000000) {
                    return `${(value / 1000000000).toFixed(2)} B`;
                } else if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(2)} M`;
                } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(2)} K`;
                }
                return value.toLocaleString('pt-AO');
            }
            
            // ===== CÁLCULO DE MARKET CAP =====
            
            function ext_calculateMarketCap(asset) {
                if (!asset.stockInfo) return null;
                
                const marketCap = asset.currentPrice * asset.stockInfo.sharesIssued;
                
                return {
                    marketCapKz: marketCap,
                    marketCapFormatted: formatMarketCap(marketCap),
                    pricePerShare: asset.currentPrice,
                    sharesIssued: asset.stockInfo.sharesIssued,
                    sharesOutstanding: asset.stockInfo.sharesOutstanding,
                    freeFloatPercent: (asset.stockInfo.freeFloat * 100).toFixed(1)
                };
            }
            
            // ===== RANKING DE MARKET CAP =====
            
            function ext_generateMarketCapRanking() {
                const stocks = Object.values(AppState.market.assets)
                    .filter(asset => asset.type === 'acao' && asset.stockInfo);
                
                const withMarketCap = stocks.map(asset => {
                    const marketCap = asset.currentPrice * asset.stockInfo.sharesIssued;
                    const priceChange = ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100;
                    
                    return {
                        ticker: asset.ticker,
                        name: asset.name,
                        marketCap: marketCap,
                        price: asset.currentPrice,
                        priceChange: priceChange
                    };
                });
                
                withMarketCap.sort((a, b) => b.marketCap - a.marketCap);
                
                return withMarketCap.slice(0, 10);
            }
            
            function ext_renderMarketCapRanking() {
                const ranking = ext_generateMarketCapRanking();
                const container = document.getElementById('ext-top-market-cap-list');
                
                if (!container) return;
                
                container.innerHTML = ranking.map((company, index) => {
                    const changeClass = company.priceChange >= 0 ? 'positive' : 'negative';
                    const changeIcon = company.priceChange >= 0 ? '📈' : '📉';
                    const position = index + 1;
                    
                    let badge = '';
                    if (position === 1) badge = '🥇';
                    else if (position === 2) badge = '🥈';
                    else if (position === 3) badge = '🥉';
                    
                    return `
                        <div class="ext-ranking-item" data-position="${position}">
                            <div class="ext-rank-position">${badge || position + 'º'}</div>
                            <div class="ext-rank-info">
                                <div class="ext-rank-ticker">${company.ticker}</div>
                                <div class="ext-rank-market-cap">${formatMarketCap(company.marketCap)}</div>
                            </div>
                            <div class="ext-rank-change ${changeClass}">
                                ${changeIcon} ${company.priceChange >= 0 ? '+' : ''}${company.priceChange.toFixed(2)}%
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            // ===== SISTEMA DE NOTÍCIAS =====
            
            const EXT_NEWS_TEMPLATES = {
                positive: [
                    "{company} anuncia lucro recorde de {value} no último trimestre",
                    "{company} expande operações e prevê crescimento de {percent}% este ano",
                    "Analistas elevam recomendação de {company} para 'Compra Forte'",
                    "{company} assina contrato milionário com governo angolano",
                    "CEO de {company} anuncia dividendos extraordinários para acionistas",
                    "{company} inaugura nova sede e contrata {number} funcionários",
                    "Investidores estrangeiros aumentam participação em {company}",
                    "{company} lança produto inovador que pode revolucionar o setor",
                    "Rating de crédito de {company} é elevado para AA+",
                    "{company} reduz dívida em {percent}% e melhora balanço",
                    "{company} bate recorde de vendas e supera expectativas",
                    "Parceria estratégica de {company} impulsiona ações",
                    "{company} anuncia investimento de {value} em tecnologia",
                    "Market share de {company} cresce {percent}% no setor",
                    "Dividendos de {company} sobem {percent}% este ano"
                ],
                
                negative: [
                    "{company} enfrenta queda de {percent}% nas vendas trimestrais",
                    "Lucro de {company} decepciona investidores e ações caem",
                    "{company} anuncia demissões e reestruturação operacional",
                    "Regulador investiga práticas de {company} no mercado",
                    "CEO de {company} renuncia após escândalo financeiro",
                    "{company} registra prejuízo de {value} no último balanço",
                    "Greve em {company} paralisa operações por tempo indeterminado",
                    "Analistas rebaixam {company} para 'Venda' após resultados fracos",
                    "{company} cancela projeto bilionário por falta de recursos",
                    "Ações de {company} despencam após alerta de lucro",
                    "Dívida de {company} aumenta {percent}% e preocupa mercado",
                    "{company} perde contrato importante para concorrente",
                    "Recall de produtos afeta reputação de {company}",
                    "Processo judicial pode custar {value} a {company}",
                    "{company} enfrenta crise de gestão e troca de diretoria"
                ],
                
                neutral: [
                    "{company} realiza assembleia de acionistas nesta semana",
                    "Diretoria de {company} anuncia mudanças na estrutura organizacional",
                    "{company} divulga calendário de pagamento de dividendos",
                    "Volume de negociação de {company} aumenta {percent}% na BODIVA",
                    "{company} participa de conferência internacional sobre sustentabilidade",
                    "Especialistas debatem futuro de {company} em painel",
                    "{company} lança relatório anual de transparência corporativa",
                    "Ações de {company} oscilam em pregão volátil hoje",
                    "{company} agenda teleconferência com investidores para próxima semana",
                    "Mercado aguarda anúncio estratégico de {company}",
                    "{company} divulga nova política de governança corporativa",
                    "Investidores avaliam perspectivas de longo prazo para {company}",
                    "{company} atualiza projeções para o ano fiscal",
                    "Análise técnica aponta consolidação em {company}",
                    "{company} mantém posição estável no ranking setorial"
                ],
                
                crypto: [
                    "{crypto} atinge nova máxima histórica de ${value}",
                    "Volatilidade de {crypto} preocupa investidores nesta semana",
                    "Baleias de {crypto} movimentam milhões em transações suspeitas",
                    "{crypto} é listada em nova exchange internacional",
                    "Mineradores de {crypto} relatam aumento de {percent}% na dificuldade",
                    "Fork polêmico divide comunidade de {crypto}",
                    "{crypto} integra nova tecnologia de escalabilidade Layer 2",
                    "Regulação de criptomoedas pode afetar {crypto} em Angola",
                    "{crypto} lidera ganhos do dia com valorização de {percent}%",
                    "Volume de {crypto} explode após anúncio de atualização",
                    "Adoção institucional de {crypto} cresce {percent}%",
                    "{crypto} anuncia queima de tokens para reduzir supply",
                    "Upgrade de rede de {crypto} programado para próximo mês",
                    "Staking de {crypto} oferece rendimento de {percent}% ao ano",
                    "Fundos de investimento adicionam {crypto} aos portfolios"
                ]
            };
            
            function ext_generateNews() {
                const allAssets = Object.values(AppState.market.assets);
                const news = [];
                
                const newsCount = Math.floor(Math.random() * 6) + 10; // 10-15 notícias
                
                for (let i = 0; i < newsCount; i++) {
                    const asset = allAssets[Math.floor(Math.random() * allAssets.length)];
                    const sentiment = Math.random();
                    
                    let template;
                    let type;
                    
                    if (asset.type === 'cripto') {
                        template = EXT_NEWS_TEMPLATES.crypto[Math.floor(Math.random() * EXT_NEWS_TEMPLATES.crypto.length)];
                        type = 'neutral';
                    } else if (asset.type === 'acao') {
                        if (sentiment < 0.35) {
                            template = EXT_NEWS_TEMPLATES.negative[Math.floor(Math.random() * EXT_NEWS_TEMPLATES.negative.length)];
                            type = 'negative';
                        } else if (sentiment < 0.7) {
                            template = EXT_NEWS_TEMPLATES.positive[Math.floor(Math.random() * EXT_NEWS_TEMPLATES.positive.length)];
                            type = 'positive';
                        } else {
                            template = EXT_NEWS_TEMPLATES.neutral[Math.floor(Math.random() * EXT_NEWS_TEMPLATES.neutral.length)];
                            type = 'neutral';
                        }
                    } else {
                        continue; // Pular ETFs e títulos
                    }
                    
                    // Substituir placeholders
                    const newsText = template
                        .replace('{company}', asset.name)
                        .replace('{crypto}', asset.name)
                        .replace('{value}', formatCurrency(Math.random() * 1000000000 + 100000000))
                        .replace('{percent}', (Math.random() * 50 + 10).toFixed(1))
                        .replace('{number}', Math.floor(Math.random() * 500 + 100));
                    
                    news.push({
                        id: Date.now() + i,
                        text: newsText,
                        type: type,
                        assetName: asset.name,
                        ticker: asset.ticker,
                        timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
                        source: ['BODIVA News', 'Mercado AO', 'Angola Investe', 'Teca Capital Análise'][Math.floor(Math.random() * 4)]
                    });
                }
                
                news.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                return news;
            }
            
            function ext_getTimeAgo(timestamp) {
                const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
                
                if (seconds < 60) return 'Agora mesmo';
                if (seconds < 3600) return Math.floor(seconds / 60) + ' min atrás';
                if (seconds < 86400) return Math.floor(seconds / 3600) + 'h atrás';
                return Math.floor(seconds / 86400) + 'd atrás';
            }
            
            function ext_renderNews() {
                const news = ext_generateNews();
                const container = document.getElementById('ext-news-feed');
                
                if (!container) return;
                
                container.innerHTML = news.map(item => {
                    const icon = {
                        positive: '📈',
                        negative: '📉',
                        neutral: '📰'
                    }[item.type];
                    
                    const typeClass = `ext-news-${item.type}`;
                    const timeAgo = ext_getTimeAgo(item.timestamp);
                    
                    return `
                        <div class="ext-news-item ${typeClass}">
                            <div class="ext-news-header">
                                <span class="ext-news-icon">${icon}</span>
                                <span class="ext-news-ticker">${item.ticker}</span>
                                <span class="ext-news-time">${timeAgo}</span>
                            </div>
                            <div class="ext-news-body">
                                ${item.text}
                            </div>
                            <div class="ext-news-footer">
                                <span class="ext-news-source">📡 ${item.source}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            // ===== ESTATÍSTICAS DO MERCADO =====
            
            const EXT_MARKET_SIMULATION = {
                totalInvestors: 20000000,
                currentBuyOrders: 0,
                currentSellOrders: 0,
                totalVolume: 0
            };
            
            function ext_simulateMarketActivity() {
                Object.values(AppState.market.assets).forEach(asset => {
                    if (asset.type !== 'acao' && asset.type !== 'cripto') return;
                    
                    const priceChange = ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100;
                    
                    if (priceChange > 0) {
                        const newBuyers = Math.floor(Math.random() * 10000 * Math.abs(priceChange) + 500);
                        EXT_MARKET_SIMULATION.currentBuyOrders += newBuyers;
                        
                        const volume = newBuyers * asset.currentPrice * (Math.random() * 100 + 50);
                        EXT_MARKET_SIMULATION.totalVolume += volume;
                    } else if (priceChange < 0) {
                        const newSellers = Math.floor(Math.random() * 10000 * Math.abs(priceChange) + 500);
                        EXT_MARKET_SIMULATION.currentSellOrders += newSellers;
                        
                        const volume = newSellers * asset.currentPrice * (Math.random() * 100 + 50);
                        EXT_MARKET_SIMULATION.totalVolume += volume;
                    } else {
                        // Atividade aleatória mesmo sem mudança
                        const randomBuyers = Math.floor(Math.random() * 1000);
                        const randomSellers = Math.floor(Math.random() * 1000);
                        EXT_MARKET_SIMULATION.currentBuyOrders += randomBuyers;
                        EXT_MARKET_SIMULATION.currentSellOrders += randomSellers;
                    }
                });
                
                // Adicionar transações do usuário
                if (AppState.portfolio.transactions) {
                    AppState.portfolio.transactions.forEach(tx => {
                        if (!tx.countedInMarket) {
                            EXT_MARKET_SIMULATION.totalVolume += tx.total;
                            tx.countedInMarket = true;
                            
                            if (tx.type === 'buy') {
                                EXT_MARKET_SIMULATION.currentBuyOrders++;
                            } else {
                                EXT_MARKET_SIMULATION.currentSellOrders++;
                            }
                        }
                    });
                }
                
                // Decair ordens antigas
                EXT_MARKET_SIMULATION.currentBuyOrders = Math.floor(EXT_MARKET_SIMULATION.currentBuyOrders * 0.95);
                EXT_MARKET_SIMULATION.currentSellOrders = Math.floor(EXT_MARKET_SIMULATION.currentSellOrders * 0.95);
            }
            
            function ext_updateMarketStats() {
                const totalInvestorsEl = document.getElementById('ext-total-investors');
                const totalVolumeEl = document.getElementById('ext-total-volume');
                const buyOrdersEl = document.getElementById('ext-buy-orders');
                const sellOrdersEl = document.getElementById('ext-sell-orders');
                const sentimentFill = document.getElementById('ext-sentiment-fill');
                const sentimentText = document.getElementById('ext-sentiment-text');
                
                if (!totalInvestorsEl) return;
                
                totalInvestorsEl.textContent = EXT_MARKET_SIMULATION.totalInvestors.toLocaleString('pt-AO');
                totalVolumeEl.textContent = formatCurrency(EXT_MARKET_SIMULATION.totalVolume);
                buyOrdersEl.textContent = EXT_MARKET_SIMULATION.currentBuyOrders.toLocaleString('pt-AO');
                sellOrdersEl.textContent = EXT_MARKET_SIMULATION.currentSellOrders.toLocaleString('pt-AO');
                
                const total = EXT_MARKET_SIMULATION.currentBuyOrders + EXT_MARKET_SIMULATION.currentSellOrders || 1;
                const buyPercentage = (EXT_MARKET_SIMULATION.currentBuyOrders / total) * 100;
                
                sentimentFill.style.width = buyPercentage + '%';
                
                if (buyPercentage >= 60) {
                    sentimentFill.style.background = 'linear-gradient(90deg, var(--success), rgb(25, 175, 75))';
                    sentimentText.textContent = `📈 Otimista (${buyPercentage.toFixed(1)}% Compradores)`;
                    sentimentText.className = 'ext-sentiment-text positive';
                } else if (buyPercentage >= 45) {
                    sentimentFill.style.background = 'linear-gradient(90deg, var(--accent-green), rgb(194, 154, 80))';
                    sentimentText.textContent = `➡️ Neutro (${buyPercentage.toFixed(1)}% Compradores)`;
                    sentimentText.className = 'ext-sentiment-text neutral';
                } else {
                    sentimentFill.style.background = 'linear-gradient(90deg, var(--danger), rgb(220, 50, 50))';
                    sentimentText.textContent = `📉 Pessimista (${buyPercentage.toFixed(1)}% Compradores)`;
                    sentimentText.className = 'ext-sentiment-text negative';
                }
            }
            
            // ===== FLUXO DE ORDENS POR ATIVO =====
            
            function ext_calculateAssetOrderFlow(asset) {
                const priceChange = ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100;
                
                let buyPercentage;
                
                if (priceChange > 0) {
                    buyPercentage = 50 + Math.min(priceChange * 5, 45);
                } else if (priceChange < 0) {
                    buyPercentage = 50 + Math.max(priceChange * 5, -45);
                } else {
                    buyPercentage = 50;
                }
                
                const sellPercentage = 100 - buyPercentage;
                
                return {
                    buyPercentage: buyPercentage.toFixed(1),
                    sellPercentage: sellPercentage.toFixed(1),
                    dominantSide: buyPercentage > 50 ? 'buy' : 'sell'
                };
            }
            
            // ===== SISTEMA DE ORDENS LIMITE =====
            
            function ext_executeOrder(assetId, quantity, orderType, limitPrice = null) {
                const type = document.getElementById('trade-modal').dataset.type;
                
                if (orderType === 'market') {
                    if (type === 'buy') {
                        return Promise.resolve(buyAsset(assetId, quantity));
                    } else {
                        return Promise.resolve(sellAsset(assetId, quantity));
                    }
                } else if (orderType === 'limit') {
                    return ext_processLimitOrder(assetId, quantity, limitPrice, type);
                }
            }
            
            function ext_processLimitOrder(assetId, quantity, limitPrice, type) {
                return new Promise((resolve, reject) => {
                    const processingDiv = document.getElementById('ext-limit-processing');
                    const progressBar = document.getElementById('ext-limit-progress');
                    const timeRemaining = document.getElementById('ext-time-remaining');
                    const confirmBtn = document.getElementById('confirm-trade');
                    const cancelBtn = document.getElementById('cancel-trade');
                    
                    // Desabilitar botões durante processamento
                    confirmBtn.disabled = true;
                    cancelBtn.disabled = true;
                    
                    processingDiv.style.display = 'block';
                    
                    let secondsLeft = 10;
                    const interval = setInterval(() => {
                        secondsLeft--;
                        const progress = ((10 - secondsLeft) / 10) * 100;
                        progressBar.style.width = progress + '%';
                        timeRemaining.textContent = `Tempo restante: ${secondsLeft}s`;
                        
                        if (secondsLeft <= 0) {
                            clearInterval(interval);
                            processingDiv.style.display = 'none';
                            
                            // Reabilitar botões
                            confirmBtn.disabled = false;
                            cancelBtn.disabled = false;
                            
                            // Executar ordem com preço limite
                            const asset = AppState.market.assets[assetId];
                            const originalPrice = asset.currentPrice;
                            
                            // Temporariamente usar preço limite
                            asset.currentPrice = limitPrice;
                            
                            let result;
                            if (type === 'buy') {
                                result = buyAsset(assetId, quantity);
                            } else {
                                result = sellAsset(assetId, quantity);
                            }
                            
                            // Restaurar preço original
                            asset.currentPrice = originalPrice;
                            
                            if (result.success) {
                                showNotification(`✅ Ordem limite executada com sucesso! ${result.message}`, 'success');
                                resolve(result);
                            } else {
                                showNotification(`❌ ${result.message}`, 'error');
                                reject(result);
                            }
                        }
                    }, 1000);
                });
            }
            
            // ===== ATUALIZAÇÃO DE CARDS DE ATIVOS =====
            
            function ext_addMarketCapToCards() {
                const assetCards = document.querySelectorAll('.asset-card');
                
                assetCards.forEach(card => {
                    const ticker = card.querySelector('.ticker')?.textContent;
                    if (!ticker) return;
                    
                    const asset = Object.values(AppState.market.assets).find(a => a.ticker === ticker);
                    if (!asset || asset.type !== 'acao') return;
                    
                    // Verificar se já existe info de market cap
                    if (card.querySelector('.ext-market-cap-info')) return;
                    
                    const marketCapInfo = ext_calculateMarketCap(asset);
                    if (!marketCapInfo) return;
                    
                    const orderFlow = ext_calculateAssetOrderFlow(asset);
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'ext-market-cap-info';
                    infoDiv.innerHTML = `
                        <div class="ext-info-row">
                            <span class="ext-label">📈 Ações Emitidas:</span>
                            <span class="ext-value">${formatShares(marketCapInfo.sharesIssued)}</span>
                        </div>
                        <div class="ext-info-row">
                            <span class="ext-label">💹 Ações em Circulação:</span>
                            <span class="ext-value">${formatShares(marketCapInfo.sharesOutstanding)} (${((marketCapInfo.sharesOutstanding / marketCapInfo.sharesIssued) * 100).toFixed(1)}%)</span>
                        </div>
                        <div class="ext-info-row highlight">
                            <span class="ext-label">📊 Valor de Mercado:</span>
                            <span class="ext-value ext-market-cap">${marketCapInfo.marketCapFormatted}</span>
                        </div>
                    `;
                    
                    // Adicionar fluxo de ordens
                    const flowDiv = document.createElement('div');
                    flowDiv.className = 'ext-order-flow';
                    flowDiv.innerHTML = `
                        <div class="ext-flow-header">
                            <span>📊 Fluxo de Ordens</span>
                        </div>
                        <div class="ext-flow-bar">
                            <div class="ext-flow-buy" style="width: ${orderFlow.buyPercentage}%">
                                <span>📈 ${orderFlow.buyPercentage}%</span>
                            </div>
                            <div class="ext-flow-sell" style="width: ${orderFlow.sellPercentage}%">
                                <span>📉 ${orderFlow.sellPercentage}%</span>
                            </div>
                        </div>
                    `;
                    
                    // Inserir antes dos botões de ação
                    const actionsDiv = card.querySelector('.asset-actions');
                    if (actionsDiv) {
                        actionsDiv.parentNode.insertBefore(infoDiv, actionsDiv);
                        actionsDiv.parentNode.insertBefore(flowDiv, actionsDiv);
                    }
                });
            }
            
            // ===== CONFIGURAÇÃO DO MODAL DE ORDENS =====
            
            function ext_setupOrderTypeSelector() {
                const modal = document.getElementById('trade-modal');
                if (!modal) return;
                
                const modalContent = modal.querySelector('.modal-content');
                const assetDetails = modalContent.querySelector('.asset-details');
                
                // Verificar se já existe o seletor
                if (modalContent.querySelector('.ext-order-type-selector')) return;
                
                const orderTypeHTML = `
                    <div class="ext-order-type-selector">
                        <label class="ext-order-type-label">
                            <input type="radio" name="order-type" value="market" checked>
                            <div class="ext-order-type-card">
                                <div class="ext-order-type-icon">⚡</div>
                                <div class="ext-order-type-title">Ordem a Mercado</div>
                                <div class="ext-order-type-desc">Execução instantânea ao preço atual</div>
                            </div>
                        </label>
                        
                        <label class="ext-order-type-label">
                            <input type="radio" name="order-type" value="limit">
                            <div class="ext-order-type-card">
                                <div class="ext-order-type-icon">🎯</div>
                                <div class="ext-order-type-title">Ordem Limite</div>
                                <div class="ext-order-type-desc">Defina o preço desejado</div>
                            </div>
                        </label>
                    </div>
                    
                    <div id="ext-limit-price-input" style="display:none; margin-bottom: 15px;">
                        <label for="ext-limit-price">Preço Limite (Kz):</label>
                        <input 
                            type="number" 
                            id="ext-limit-price" 
                            min="0.01" 
                            step="0.01" 
                            placeholder="Digite o preço desejado"
                            style="width: 100%; padding: 12px; background: var(--gray-medium); border: 2px solid var(--gray-light); border-radius: 8px; color: var(--text-white); font-size: 1rem;"
                        >
                        <p class="ext-limit-hint" style="margin-top: 5px; font-size: 0.85rem; color: var(--accent-green);">
                            💡 Sua ordem será executada quando o mercado atingir este preço
                        </p>
                    </div>
                    
                    <p id="ext-order-summary" style="text-align: center; color: var(--accent-green); margin-bottom: 15px; font-size: 0.9rem;">
                        ⚡ Ordem será executada imediatamente ao preço de mercado
                    </p>
                `;
                
                const processingHTML = `
                    <div id="ext-limit-processing" class="ext-limit-processing" style="display:none;">
                        <div class="ext-processing-icon">⏳</div>
                        <div class="ext-processing-text">
                            <h4>Procurando ordem compatível...</h4>
                            <p>Aguarde alguns segundos enquanto sua ordem é processada no mercado.</p>
                            <div class="ext-progress-bar">
                                <div class="ext-progress-fill" id="ext-limit-progress"></div>
                            </div>
                            <p class="ext-time-remaining" id="ext-time-remaining">Tempo restante: 10s</p>
                        </div>
                    </div>
                `;
                
                // Inserir após os detalhes do ativo
                if (assetDetails) {
                    assetDetails.insertAdjacentHTML('afterend', orderTypeHTML);
                    assetDetails.insertAdjacentHTML('afterend', processingHTML);
                } else {
                    modalContent.querySelector('.trade-form').insertAdjacentHTML('beforebegin', orderTypeHTML);
                    modalContent.querySelector('.trade-form').insertAdjacentHTML('beforebegin', processingHTML);
                }
                
                // Event listeners
                document.querySelectorAll('input[name="order-type"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        const limitInput = document.getElementById('ext-limit-price-input');
                        const orderSummary = document.getElementById('ext-order-summary');
                        
                        if (e.target.value === 'limit') {
                            limitInput.style.display = 'block';
                            orderSummary.innerHTML = '🎯 Ordem será executada ao preço limite definido';
                        } else {
                            limitInput.style.display = 'none';
                            orderSummary.innerHTML = '⚡ Ordem será executada imediatamente ao preço de mercado';
                        }
                    });
                });
            }
            
            // ===== MODIFICAR CONFIRMAÇÃO DE ORDEM =====

        function ext_overrideConfirmTrade() {
            const confirmBtn = document.getElementById('confirm-trade');
            if (!confirmBtn) return;
            
            // Remover listeners antigos
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            newBtn.addEventListener('click', async () => {
                const orderTypeRadio = document.querySelector('input[name="order-type"]:checked');
                const orderType = orderTypeRadio ? orderTypeRadio.value : 'market';
                
                const limitPriceInput = document.getElementById('ext-limit-price');
                const limitPrice = orderType === 'limit' && limitPriceInput
                    ? parseFloat(limitPriceInput.value) 
                    : null;
                
                const assetId = document.getElementById('trade-modal').dataset.assetId;
                const quantity = parseFloat(document.getElementById('trade-quantity').value);
                
                if (!quantity || quantity <= 0) {
                    showNotification('⚠️ Por favor, insira uma quantidade válida', 'error');
                    return;
                }
                
                if (orderType === 'limit' && (!limitPrice || limitPrice <= 0)) {
                    showNotification('⚠️ Por favor, defina um preço limite válido', 'error');
                    return;
                }
                
                try {
                    const result = await ext_executeOrder(assetId, quantity, orderType, limitPrice);
                    
                    // ✅ CORREÇÃO: Exibir notificação de sucesso
                    if (result && result.success) {
                        showNotification(result.message, 'success');
                    }
                    
                    closeTradeModal();
                    updatePortfolioUI();
                    updateTransactionsUI();
                } catch (error) {
                    console.error('Erro ao executar ordem:', error);
                    
                    // ✅ CORREÇÃO: Exibir notificação de erro
                    showNotification('❌ Erro ao processar transação. Tente novamente.', 'error');
                }
            });
        }

            // ===== INTEGRAÇÃO COM SISTEMA EXISTENTE =====
            
            function ext_updateAllData() {
                ext_simulateMarketActivity();
                ext_updateMarketStats();
                ext_renderMarketCapRanking();
                ext_addMarketCapToCards();
            }
            
            // Hook no sistema existente
            const originalUpdateMarketPrices = window.updateMarketPrices;
            if (originalUpdateMarketPrices) {
                window.updateMarketPrices = function() {
                    const result = originalUpdateMarketPrices.call(this);
                    ext_updateAllData();
                    return result;
                };
            }
            
            const originalRenderAssetsUI = window.renderAssetsUI;
            if (originalRenderAssetsUI) {
                window.renderAssetsUI = function(category) {
                    const result = originalRenderAssetsUI.call(this, category);
                    setTimeout(() => {
                        ext_addMarketCapToCards();
                    }, 100);
                    return result;
                };
            }
            
            // ===== ADICIONAR HTML DOS PAINÉIS =====
            
            function ext_injectHTML() {
                const positionsList = document.querySelector('.positions-list');
                if (!positionsList) return;
                
                // Ranking de Market Cap
                const rankingHTML = `
                    <div class="ext-market-cap-ranking">
                        <h4>🏆 Top 10 Maiores Empresas</h4>
                        <p class="ext-ranking-subtitle">Por Valor de Mercado</p>
                        <div id="ext-top-market-cap-list"></div>
                    </div>
                `;
                
                // Estatísticas do Mercado
                const statsHTML = `
                    <div class="ext-market-stats">
                        <h4>📊 Estatísticas do Mercado</h4>
                        
                        <div class="ext-stat-item">
                            <span class="ext-stat-label">👥 Investidores Ativos:</span>
                            <span class="ext-stat-value" id="ext-total-investors">20.000.000</span>
                        </div>
                        
                        <div class="ext-stat-item">
                            <span class="ext-stat-label">💰 Volume Total Transacionado:</span>
                            <span class="ext-stat-value" id="ext-total-volume">0 Kz</span>
                        </div>
                        
                        <div class="ext-stat-item">
                            <span class="ext-stat-label">📈 Ordens de Compra:</span>
                            <span class="ext-stat-value positive" id="ext-buy-orders">0</span>
                        </div>
                        
                        <div class="ext-stat-item">
                            <span class="ext-stat-label">📉 Ordens de Venda:</span>
                            <span class="ext-stat-value negative" id="ext-sell-orders">0</span>
                        </div>
                        
                        <div class="ext-sentiment-indicator">
                            <div class="ext-sentiment-label">Sentimento do Mercado:</div>
                            <div class="ext-sentiment-bar">
                                <div class="ext-sentiment-fill" id="ext-sentiment-fill" style="width: 50%;"></div>
                            </div>
                            <div class="ext-sentiment-text" id="ext-sentiment-text">Neutro</div>
                        </div>
                    </div>
                `;
                
                positionsList.insertAdjacentHTML('afterend', rankingHTML);
                
                // Encontrar a performance-ranking para inserir depois
                const performanceRanking = document.querySelector('.performance-ranking');
                if (performanceRanking) {
                    performanceRanking.insertAdjacentHTML('afterend', statsHTML);
                } else {
                    // Fallback: inserir após o ranking
                    document.getElementById('ext-top-market-cap-list').parentNode.insertAdjacentHTML('afterend', statsHTML);
                }
                
                // Botão de Notícias
                const headerActions = document.querySelector('.header-actions');
                if (headerActions) {
                    const newsBtn = document.createElement('button');
                    newsBtn.id = 'ext-news-btn';
                    newsBtn.className = 'btn-secondary';
                    newsBtn.innerHTML = '📰 Notícias do Mercado';
                    headerActions.insertBefore(newsBtn, headerActions.querySelector('#reset-simulation'));
                }
                
                // Modal de Notícias
                const newsModalHTML = `
                    <div id="ext-news-modal" class="modal">
                        <div class="modal-content ext-news-modal-content">
                            <span class="close" id="ext-news-close">&times;</span>
                            <h3>📰 Notícias do Mercado Financeiro</h3>
                            <p class="ext-news-disclaimer">
                                ⚠️ Notícias fictícias geradas para fins educacionais
                            </p>
                            <div id="ext-news-feed"></div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', newsModalHTML);
            }
            
            // ===== EVENT LISTENERS =====
            
            function ext_setupEventListeners() {
                // Botão de notícias
                const newsBtn = document.getElementById('ext-news-btn');
                if (newsBtn) {
                    newsBtn.addEventListener('click', () => {
                        const modal = document.getElementById('ext-news-modal');
                        modal.style.display = 'block';
                        ext_renderNews();
                    });
                }
                
                // Fechar modal de notícias
                const newsClose = document.getElementById('ext-news-close');
                if (newsClose) {
                    newsClose.addEventListener('click', () => {
                        document.getElementById('ext-news-modal').style.display = 'none';
                    });
                }
                
                // Fechar ao clicar fora
                window.addEventListener('click', (e) => {
                    const newsModal = document.getElementById('ext-news-modal');
                    if (e.target === newsModal) {
                        newsModal.style.display = 'none';
                    }
                });
            }
            
            // ===== INICIALIZAÇÃO =====
            
            function ext_initialize() {
                console.log('🚀 Inicializando módulo Market Cap e funcionalidades avançadas...');
                
                setTimeout(() => {
                    ext_initializeMarketCapData();
                    ext_injectHTML();
                    ext_setupOrderTypeSelector();
                    ext_overrideConfirmTrade();
                    ext_setupEventListeners();
                    ext_updateAllData();
                    
                    console.log('✅ Módulo Market Cap inicializado com sucesso!');
                }, 2000);
            }
            
            // Aguardar carregamento completo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ext_initialize);
            } else {
                ext_initialize();
            }
            
            // Exposição global para debug
            window.EXT_MARKET_MODULE = {
                initialize: ext_initialize,
                generateNews: ext_generateNews,
                calculateMarketCap: ext_calculateMarketCap,
                updateMarketStats: ext_updateMarketStats,
                renderMarketCapRanking: ext_renderMarketCapRanking
            };
            
        })();

        // ========================================
        // SISTEMA DE CRONOGRAMA INTERNO
        // ========================================

        // Adicionar propriedades ao AppState.market (APÓS linha 215)
        // Buscar: AppState.market = { (linha ~215)
        if (!AppState.market.simulatedTime) {
            AppState.market.simulatedTime = {
                startTimestamp: Date.now(),
                currentYear: 2025,
                currentMonth: 1, // Janeiro
                currentDay: 1,
                lastUpdate: Date.now(),
                totalDaysElapsed: 0
            };
        }

        // Função para atualizar tempo simulado (NOVA FUNÇÃO)
        function updateSimulatedTime() {
            const now = Date.now();
            const elapsedMs = now - AppState.market.simulatedTime.startTimestamp;
            
            // Conversões baseadas nas proporções fornecidas:
            // 0.0125 segundos = 1 hora → 0.0125 * 1000 ms = 12.5 ms por hora
            // 0.3 segundos = 1 dia → 0.3 * 1000 ms = 300 ms por dia
            // 2 min 1 seg = 1 semana → 121000 ms por semana
            // 8 min 4 seg = 1 mês → 484000 ms por mês
            // 100 min 8 seg = 1 ano → 6008000 ms por ano
            
            const hoursSimulated = elapsedMs / 12.5; // horas simuladas
            const daysSimulated = hoursSimulated / 24; // dias simulados
            
            // Atualizar dias
            const newTotalDays = Math.floor(daysSimulated);
            AppState.market.simulatedTime.totalDaysElapsed = newTotalDays;
            
            // Calcular data a partir dos dias totais
            let remainingDays = newTotalDays;
            let year = 2025;
            let month = 1;
            let day = 1;
            
            while (remainingDays > 0) {
                const daysInMonth = getDaysInMonth(month, year);
                
                if (remainingDays >= daysInMonth) {
                    remainingDays -= daysInMonth;
                    month++;
                    
                    if (month > 12) {
                        month = 1;
                        year++;
                    }
                } else {
                    day = remainingDays + 1;
                    remainingDays = 0;
                }
            }
            
            // Atualizar AppState
            const oldMonth = AppState.market.simulatedTime.currentMonth;
            const oldYear = AppState.market.simulatedTime.currentYear;
            
            AppState.market.simulatedTime.currentYear = year;
            AppState.market.simulatedTime.currentMonth = month;
            AppState.market.simulatedTime.currentDay = day;
            AppState.market.simulatedTime.lastUpdate = now;
            
            // Verificar se mês ou ano mudaram (para dividendos/juros)
            const monthChanged = oldMonth !== month;
            const yearChanged = oldYear !== year;
            
            return { monthChanged, yearChanged, currentDate: { year, month, day } };
        }

        // Função auxiliar para dias no mês
        function getDaysInMonth(month, year) {
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            
            // Fevereiro em ano bissexto
            if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0))) {
                return 29;
            }
            
            return daysInMonth[month - 1];
        }

        // Formatar data para exibição
        function formatSimulatedDate() {
            const { currentDay, currentMonth, currentYear } = AppState.market.simulatedTime;
            return `${currentDay.toString().padStart(2, '0')}/${currentMonth.toString().padStart(2, '0')}/${currentYear}`;
        }

        // Modificar updateMarketPrices() para incluir cronograma
        // Buscar: function updateMarketPrices() { (linha ~715)
        // ADICIONAR NO INÍCIO da função:
        const originalUpdateMarketPrices = updateMarketPrices;
        updateMarketPrices = function() {
            // Atualizar tempo simulado
            const timeUpdate = updateSimulatedTime();
            
            // Processar eventos baseados em tempo (dividendos/juros)
            if (timeUpdate.monthChanged || timeUpdate.yearChanged) {
                setTimeout(() => {
                    processTimeBasedEvents(timeUpdate);
                }, 0);
            }
            
            // Chamar função original
            originalUpdateMarketPrices();
            
            // Atualizar data na UI
            updateSimulatedDateUI();
        };

        // Função para processar eventos baseados em tempo
        function processTimeBasedEvents(timeUpdate) {
            // Esta função será expandida para dividendos e juros
            const { currentDate } = timeUpdate;
            
            // Verificar se é mês de pagamento de dividendos (Junho ou Dezembro)
            if (currentDate.month === 6 || currentDate.month === 12) {
                console.log(`Mês de dividendos: ${currentDate.month}/${currentDate.year}`);
            }
            
            // Verificar se é mês antes para alerta
            if (currentDate.month === 5 || currentDate.month === 11) {
                showNotification(
                    `📅 Dividendos se aproximam! Pagamento em ${currentDate.month === 5 ? 'Junho' : 'Dezembro'}`,
                    'warning'
                );
            }
        }

        // Atualizar UI da data simulada
        function updateSimulatedDateUI() {
            const dateElement = document.getElementById('simulated-date');
            if (dateElement) {
                dateElement.textContent = formatSimulatedDate();
            }
        }

        // Adicionar elemento HTML para data simulada
        // Buscar no HTML: <div class="balance-item highlight"> (linha ~270)
        // ADICIONAR APÓS este elemento:
        function addSimulatedDateToUI() {
            const balanceInfo = document.querySelector('.balance-info');
            if (!balanceInfo) return;
            
            // Verificar se já existe
            if (!document.getElementById('simulated-date')) {
                const dateElement = document.createElement('div');
                dateElement.className = 'balance-item';
                dateElement.innerHTML = `
                    <span class="label">📅 Data Simulada:</span>
                    <span class="value" id="simulated-date">01/01/2025</span>
                `;
                
                // Inserir após o último balance-item
                const lastBalanceItem = balanceInfo.querySelector('.balance-item:last-child');
                if (lastBalanceItem) {
                    lastBalanceItem.insertAdjacentElement('afterend', dateElement);
                } else {
                    balanceInfo.appendChild(dateElement);
                }
            }
        }

        // Inicializar UI quando dashboard for mostrado
        const originalShowDashboard = showDashboard || function() {};
        showDashboard = function() {
            originalShowDashboard();
            setTimeout(addSimulatedDateToUI, 100);
        };


        // ========================================
        // SISTEMA DE PROVÍNCIA DO USUÁRIO
        // ========================================

        // Modificar a inicialização do usuário para incluir província
        // Buscar no código: AppState.user.name = (linha ~1900)
        // ADICIONAR após salvar o nome:

        // Encontrar onde o formulário é processado
        document.addEventListener('DOMContentLoaded', function() {
            const userSetupForm = document.getElementById('user-setup');
            if (userSetupForm) {
                const originalSubmit = userSetupForm.onsubmit;
                
                userSetupForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Coletar dados do formulário
                    const name = document.getElementById('investor-name').value;
                    const region = document.getElementById('region').value;
                    const gender = document.getElementById('gender').value;
                    const profile = document.querySelector('.profile-card.selected')?.dataset.profile;
                    const scenario = document.querySelector('.scenario-card.selected')?.dataset.scenario;
                    const balance = document.querySelector('.balance-options button.selected')?.dataset.balance;
                    const tickInterval = document.getElementById('tick-interval').value;
                    
                    // Salvar no AppState (incluindo província)
                    AppState.user.name = name;
                    AppState.user.region = region; // Já existe
                    AppState.user.province = region; // Novo campo para exibição específica
                    AppState.user.gender = gender;
                    AppState.user.profile = profile;
                    AppState.user.scenario = scenario;
                    AppState.user.initialBalance = parseInt(balance) || 100000;
                    AppState.user.availableBalance = AppState.user.initialBalance;
                    AppState.user.tickInterval = parseInt(tickInterval) || 60000;
                    
                    // Resto da lógica existente...
                    // (manter código original aqui)
                    
                    // Chamar função original se existir
                    if (typeof originalSubmit === 'function') {
                        originalSubmit.call(this, e);
                    }
                });
            }
        });

        // Adicionar província ao header do dashboard
        function addProvinceToDashboard() {
            const userInfo = document.querySelector('.user-info');
            if (!userInfo || !AppState.user.province) return;
            
            // Verificar se já existe
            if (!document.getElementById('province-display')) {
                const provinceElement = document.createElement('p');
                provinceElement.className = 'scenario-badge';
                provinceElement.innerHTML = `Província: <span id="province-display">${AppState.user.province}</span>`;
                
                // Inserir após o cenário
                const scenarioElement = userInfo.querySelector('.scenario-badge');
                if (scenarioElement) {
                    scenarioElement.insertAdjacentElement('afterend', provinceElement);
                } else {
                    userInfo.appendChild(provinceElement);
                }
            } else {
                // Atualizar se já existe
                document.getElementById('province-display').textContent = AppState.user.province;
            }
        }

        // Integrar com showDashboard
        if (typeof showDashboard === 'function') {
            const originalShowDashboard = showDashboard;
            showDashboard = function() {
                originalShowDashboard();
                setTimeout(addProvinceToDashboard, 150);
            };
        }


        // ========================================
        // SISTEMA DE DIVIDENDOS (APROVEITANDO ESTRUTURA EXISTENTE)
        // ========================================

        // Adicionar propriedades de dividendos às ações
        // Buscar: ASSETS_DATABASE.acoes.forEach (linha ~620)
        // ADICIONAR dentro do forEach:

        function initializeDividendSystem() {
            ASSETS_DATABASE.acoes.forEach((asset, index) => {
                // Inicializar informações de dividendos se não existirem
                if (!asset.dividendInfo) {
                    // Determinar frequência baseada no ranking (top 2 são semestrais)
                    const isTop2 = index < 2; // Simplificação - baseado no índice
                    const frequency = isTop2 ? 'semiannual' : 'annual';
                    
                    // Determinar yield baseado no cenário
                    let baseYield = 0.15; // 15% padrão
                    
                    // Empresas que não pagam este ano (rotação)
                    // 3 empresas aleatórias por ano não pagam
                    const notPayingThisYear = Math.random() < 0.3; // ~30% de chance
                    
                    asset.dividendInfo = {
                        enabled: true,
                        frequency: frequency,
                        yield: baseYield,
                        lastPaymentYear: null,
                        lastPaymentMonth: null,
                        isPayingThisYear: !notPayingThisYear,
                        paymentHistory: []
                    };
                }
                
                // Garantir que a ação no market também tenha a informação
                if (AppState.market.assets[asset.id]) {
                    AppState.market.assets[asset.id].dividendInfo = asset.dividendInfo;
                }
            });
        }

        // Inicializar sistema de dividendos
        initializeDividendSystem();

        // Função principal de processamento de dividendos
        function processDividends() {
            const { currentYear, currentMonth } = AppState.market.simulatedTime;
            
            // Verificar se é mês de pagamento (Junho ou Dezembro)
            const isDividendMonth = currentMonth === 6 || currentMonth === 12;
            if (!isDividendMonth) return;
            
            // Inicializar histórico de dividendos se não existir
            if (!AppState.portfolio.dividendHistory) {
                AppState.portfolio.dividendHistory = [];
            }
            
            let totalDividendsPaid = 0;
            let companiesPaid = 0;
            
            // Processar cada posição de ação
            AppState.portfolio.positions.forEach(position => {
                if (position.type !== 'acao') return;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset || !asset.dividendInfo) return;
                
                // Verificar se deve pagar dividendos
                if (shouldPayDividend(asset, currentYear, currentMonth)) {
                    // Calcular dividendo por ação
                    const dividendPerShare = calculateDividendPerShare(asset, AppState.user.scenario);
                    const totalDividend = dividendPerShare * position.quantity;
                    
                    // Adicionar ao saldo do usuário
                    AppState.user.availableBalance += totalDividend;
                    totalDividendsPaid += totalDividend;
                    companiesPaid++;
                    
                    // Criar registro de dividendo
                    const dividendRecord = {
                        id: `div_${Date.now()}_${asset.id}`,
                        date: formatSimulatedDate(),
                        company: asset.name,
                        ticker: asset.ticker,
                        perShare: dividendPerShare,
                        dividendYield: (dividendPerShare / asset.currentPrice * 100).toFixed(2),
                        quantity: position.quantity,
                        total: totalDividend,
                        status: 'Pago',
                        paymentMonth: currentMonth,
                        paymentYear: currentYear
                    };
                    
                    // Adicionar ao histórico
                    AppState.portfolio.dividendHistory.push(dividendRecord);
                    
                    // Atualizar histórico no ativo
                    if (!asset.dividendInfo.paymentHistory) {
                        asset.dividendInfo.paymentHistory = [];
                    }
                    asset.dividendInfo.paymentHistory.push({
                        date: dividendRecord.date,
                        amount: dividendPerShare,
                        total: totalDividend
                    });
                    
                    // Atualizar último pagamento
                    asset.dividendInfo.lastPaymentYear = currentYear;
                    asset.dividendInfo.lastPaymentMonth = currentMonth;
                    
                    // Mostrar notificação
                    showNotification(
                        `💰 Dividendo recebido de ${asset.ticker}: ${formatCurrency(totalDividend)}`,
                        'success'
                    );
                }
            });
            
            // Atualizar tabela de dividendos
            if (companiesPaid > 0) {
                updateDividendsTable();
                showNotification(
                    `🎉 Total de dividendos recebidos: ${formatCurrency(totalDividendsPaid)} de ${companiesPaid} empresa(s)`,
                    'success'
                );
            }
        }

        // Função auxiliar para verificar se deve pagar dividendo
        function shouldPayDividend(asset, currentYear, currentMonth) {
            const info = asset.dividendInfo;
            if (!info || !info.enabled || !info.isPayingThisYear) return false;
            
            // Verificar frequência
            if (info.frequency === 'annual') {
                // Pagamento anual em Dezembro
                if (currentMonth !== 12) return false;
                
                // Verificar se já pagou este ano
                if (info.lastPaymentYear === currentYear) return false;
                
            } else if (info.frequency === 'semiannual') {
                // Pagamento semestral em Junho e Dezembro
                if (currentMonth !== 6 && currentMonth !== 12) return false;
                
                // Verificar se já pagou neste mês/ano
                if (info.lastPaymentYear === currentYear && 
                    info.lastPaymentMonth === currentMonth) {
                    return false;
                }
            }
            
            return true;
        }

        // Calcular dividendo por ação baseado no cenário
        function calculateDividendPerShare(asset, scenario) {
            const basePrice = asset.currentPrice || asset.initialPrice;
            let yieldMultiplier = asset.dividendInfo.yield || 0.15;
            
            // Ajustar yield baseado no cenário
            switch(scenario) {
                case 'estavel':
                    yieldMultiplier *= (0.15 + Math.random() * 0.10); // 15-25%
                    break;
                case 'crise':
                    yieldMultiplier *= (Math.random() * 0.05); // 0-5%
                    break;
                case 'crescimento':
                    yieldMultiplier *= (0.05 + Math.random() * 0.25); // 5-30%
                    break;
                case 'angola-especial':
                    yieldMultiplier *= (0.05 + Math.random() * 0.15); // 5-20%
                    break;
            }
            
            // Garantir mínimo e máximo
            yieldMultiplier = Math.max(0.01, Math.min(0.30, yieldMultiplier));
            
            return basePrice * yieldMultiplier;
        }

        // ===== ATUALIZAR TABELA DE DIVIDENDOS =====
        function updateDividendsTable() {
            console.log('📊 Atualizando tabela de dividendos...');
            
            // Garantir que o painel existe
            if (!document.querySelector('.ext-dividends-panel-permanent')) {
                injectDividendsPanel();
            }
            
            const tableBody = document.getElementById('ext-dividends-body-permanent');
            if (!tableBody) {
                console.error('❌ tbody de dividendos não encontrado');
                return;
            }
            
            const history = AppState.portfolio.dividendHistory || [];
            console.log(`📋 Histórico de dividendos: ${history.length} registro(s)`);
            
            if (history.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="empty-state">
                            <div style="padding: 30px; text-align: center;">
                                <div style="font-size: 3rem; margin-bottom: 10px;">💰</div>
                                <p style="font-size: 1.1rem; margin-bottom: 8px;">Nenhum dividendo recebido ainda</p>
                                <p style="font-size: 0.85rem; opacity: 0.7;">
                                    Compre ações e aguarde os meses de <strong>Junho</strong> ou <strong>Dezembro</strong> 
                                    para receber dividendos automaticamente.
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Ordenar por data (mais recente primeiro)
            const sorted = [...history].sort((a, b) => {
                const dateA = parseDateString(a.date);
                const dateB = parseDateString(b.date);
                return dateB - dateA;
            });
            
            console.log(`✅ Renderizando ${sorted.length} dividendo(s)`);
            
            tableBody.innerHTML = sorted.map((record, index) => `
                <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                    <td>${record.date}</td>
                    <td>
                        <strong>${record.ticker}</strong>
                        <br>
                        <small style="opacity: 0.7;">${record.assetName || record.company}</small>
                    </td>
                    <td style="text-align: right;">${formatCurrency(record.perShare || record.valuePerShare)}</td>
                    <td style="text-align: center;" class="positive">
                        <strong>${(record.dividendYield || record.yield || 0).toFixed(2)}%</strong>
                    </td>
                    <td style="text-align: center;">${(record.quantity || 0).toLocaleString('pt-AO')}</td>
                    <td style="text-align: right;" class="positive">
                        <strong>${formatCurrency(record.total)}</strong>
                    </td>
                    <td style="text-align: center;">
                        <span class="badge buy">${record.status}</span>
                    </td>
                </tr>
            `).join('');
        }
            
            // Garantir que o painel esteja sempre visível
            const panel = document.querySelector('.ext-dividends-panel');
            if (panel) {
                panel.style.display = 'block';
            }


        // Função auxiliar para parse de data
        function parseDateString(dateStr) {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day);
        }

        // Atualizar processTimeBasedEvents para incluir dividendos
        const originalProcessTimeBasedEvents = processTimeBasedEvents || function() {};
        processTimeBasedEvents = function(timeUpdate) {
            originalProcessTimeBasedEvents(timeUpdate);
            
            const { currentDate } = timeUpdate;
            
            // Processar dividendos se for mês de pagamento
            if (currentDate.month === 6 || currentDate.month === 12) {
                setTimeout(processDividends, 100);
            }
            
            // Rotacionar empresas que não pagam dividendos a cada ano
            if (currentDate.month === 1) { // Janeiro - reset anual
                rotateNonPayingCompanies();
            }
        };

        // Rotacionar empresas que não pagam dividendos
        function rotateNonPayingCompanies() {
            const stocks = ASSETS_DATABASE.acoes;
            const currentYear = AppState.market.simulatedTime.currentYear;
            
            // Resetar todas para pagar
            stocks.forEach(stock => {
                if (stock.dividendInfo) {
                    stock.dividendInfo.isPayingThisYear = true;
                    
                    // Atualizar no market também
                    if (AppState.market.assets[stock.id]) {
                        AppState.market.assets[stock.id].dividendInfo.isPayingThisYear = true;
                    }
                }
            });
            
            // Selecionar 3 empresas aleatórias que não pagarão este ano
            const nonPayingCount = Math.min(3, stocks.length);
            const shuffled = [...stocks].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < nonPayingCount; i++) {
                const stock = shuffled[i];
                if (stock.dividendInfo) {
                    stock.dividendInfo.isPayingThisYear = false;
                    
                    // Atualizar no market também
                    if (AppState.market.assets[stock.id]) {
                        AppState.market.assets[stock.id].dividendInfo.isPayingThisYear = false;
                    }
                    
                    console.log(`${stock.ticker} não pagará dividendos em ${currentYear}`);
                }
            }
        }


        // Adicionar informações de dividendos aos cards de ações
        function addDividendInfoToAssetCards() {
            const assetCards = document.querySelectorAll('.asset-card');
            
            assetCards.forEach(card => {
                const tickerElement = card.querySelector('.ticker');
                if (!tickerElement) return;
                
                const ticker = tickerElement.textContent;
                
                // Encontrar o ativo
                const asset = Object.values(AppState.market.assets).find(a => a.ticker === ticker);
                if (!asset || asset.type !== 'acao' || !asset.dividendInfo) return;
                
                // Verificar se já tem info de dividendos
                if (card.querySelector('.dividend-info')) return;
                
                const info = asset.dividendInfo;
                const yieldPercent = (info.yield * 100).toFixed(1);
                const nextPayment = info.frequency === 'semiannual' ? 'Jun/Dez' : 'Dez';
                const payingStatus = info.isPayingThisYear ? '💰 Pagando' : '⏸️ Suspenso';
                
                const dividendDiv = document.createElement('div');
                dividendDiv.className = 'dividend-info';
                dividendDiv.style.cssText = `
                    margin-top: 8px;
                    padding: 6px 10px;
                    background: rgba(214, 174, 100, 0.1);
                    border-radius: 6px;
                    font-size: 0.85rem;
                    border-left: 3px solid ${info.isPayingThisYear ? 'var(--success)' : 'var(--danger)'};
                `;
                dividendDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between;">
                        <span>DY: <strong>${yieldPercent}%</strong></span>
                        <span>${payingStatus}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 2px;">
                        Pagamento: ${nextPayment} | Último: ${info.lastPaymentYear || 'Nunca'}
                    </div>
                `;
                
                // Inserir antes dos botões de ação
                const actions = card.querySelector('.asset-actions');
                if (actions) {
                    actions.insertAdjacentElement('beforebegin', dividendDiv);
                }
            });
        }

        // Integrar com renderAssetsUI
        const originalRenderAssetsUI = renderAssetsUI;
        renderAssetsUI = function(category) {
            originalRenderAssetsUI(category);
            
            if (category === 'acoes') {
                setTimeout(addDividendInfoToAssetCards, 200);
            }
        };

        // ========================================
        // SISTEMA DE JUROS PARA TÍTULOS DE RENDA FIXA
        // ========================================

        // Inicializar sistema de juros para títulos
        function initializeBondInterestSystem() {
            // Adicionar propriedades a títulos públicos
            ASSETS_DATABASE.titulosPublicos.forEach(asset => {
                if (!asset.bondSchedule) {
                    asset.bondSchedule = {
                        purchaseDate: null,
                        maturityDate: null,
                        interestRate: asset.couponRate,
                        payments: [],
                        principal: asset.initialPrice,
                        nextPaymentIndex: 0,
                        totalPayments: asset.maturity * 2, // Pagamentos semestrais
                        isPublic: true
                    };
                }
                
                // Garantir que está no market state
                if (AppState.market.assets[asset.id]) {
                    AppState.market.assets[asset.id].bondSchedule = asset.bondSchedule;
                }
            });
            
            // Adicionar propriedades a títulos privados
            ASSETS_DATABASE.titulosPrivados.forEach(asset => {
                if (!asset.bondSchedule) {
                    asset.bondSchedule = {
                        purchaseDate: null,
                        maturityDate: null,
                        interestRate: asset.couponRate,
                        payments: [],
                        principal: asset.initialPrice,
                        nextPaymentIndex: 0,
                        totalPayments: asset.maturity * 2,
                        isPublic: false
                    };
                }
                
                // Garantir que está no market state
                if (AppState.market.assets[asset.id]) {
                    AppState.market.assets[asset.id].bondSchedule = asset.bondSchedule;
                }
            });
        }

        // Inicializar sistema
        initializeBondInterestSystem();

        // Extender função buyAsset para títulos
        const originalBuyAsset = buyAsset;
        buyAsset = function(assetId, quantity) {
            const result = originalBuyAsset(assetId, quantity);
            
            // Se a compra foi bem sucedida e é um título, configurar cronograma
            if (result.success) {
                const asset = AppState.market.assets[assetId];
                if (asset && asset.type.includes('titulo')) {
                    console.log(`📊 Configurando título: ${asset.ticker}`);
                    
                    // Configurar cronograma
                    setupBondSchedule(asset, quantity);
                    
                    // ⭐ NOVO: Forçar atualização visual imediata
                    setTimeout(() => {
                        updateBondCountdowns();
                        updateBondCountdownUI();
                        updatePortfolioUI();
                    }, 500);
                }
            }
            
            return result;
        };

        function setupBondSchedule(asset, quantity) {
            if (!asset.bondSchedule) return;
            
            const purchaseDate = { ...AppState.market.simulatedTime };
            const maturityYears = asset.maturity || 1;
            
            // Calcular datas de pagamento semestrais
            const paymentDates = generatePaymentDates(purchaseDate, maturityYears);
            
            // Calcular juros totais e por pagamento
            const principal = asset.initialPrice * quantity;
            const totalInterest = principal * asset.couponRate * maturityYears;
            const semiannualPayment = totalInterest / (maturityYears * 2);
            
            // Configurar cronograma
            asset.bondSchedule.purchaseDate = purchaseDate;
            asset.bondSchedule.maturityDate = calculateMaturityDate(purchaseDate, maturityYears);
            asset.bondSchedule.payments = paymentDates.map((date, index) => ({
                index: index + 1,
                date,
                amount: semiannualPayment,
                status: 'pending',
                type: 'interest'
            }));
            
            // Adicionar pagamento do principal no final
            asset.bondSchedule.payments.push({
                index: paymentDates.length + 1,
                date: asset.bondSchedule.maturityDate,
                amount: principal,
                status: 'pending',
                type: 'principal'
            });
            
            asset.bondSchedule.nextPaymentIndex = 0;
            asset.bondSchedule.totalPayments = paymentDates.length + 1;
            
            console.log(`✅ Cronograma configurado para ${asset.ticker}: ${asset.bondSchedule.payments.length} pagamentos`);
            
            // ⭐ NOVO: Inicializar bondInfo para a posição
            initializeBondInfoForNewPurchase(asset, quantity, purchaseDate, maturityYears);
        }

        // ===== NOVA FUNÇÃO: Inicializar bondInfo ao comprar =====
        function initializeBondInfoForNewPurchase(asset, quantity, purchaseDate, maturityYears) {
            // Encontrar a posição correspondente
            const position = AppState.portfolio.positions.find(p => p.assetId === asset.id);
            
            if (!position) {
                console.warn('⚠️ Posição não encontrada para:', asset.ticker);
                return;
            }
            
            // Calcular próximo pagamento (6 meses após compra)
            const nextPaymentDate = calculateNextPaymentDate(purchaseDate, 6);
            const maturityDate = calculateMaturityDate(purchaseDate, maturityYears);
            
            // Criar bondInfo
            position.bondInfo = {
                purchaseDate: purchaseDate,
                maturityDate: maturityDate,
                totalPayments: maturityYears * 2, // Semestral
                paymentsMade: 0,
                nextPaymentDate: nextPaymentDate,
                principalAmount: asset.initialPrice * quantity,
                initialized: true,
                matured: false
            };
            
            console.log(`✅ bondInfo criado para ${asset.ticker}:`, position.bondInfo);
            
            // ⭐ CRÍTICO: Atualizar contagem regressiva imediatamente
            updateBondCountdowns();
            updateBondCountdownUI();
            
            // Salvar estado
            saveToLocalStorage();
        }

        // ===== SISTEMA DE AUTO-INICIALIZAÇÃO DA CONTAGEM REGRESSIVA =====
        function autoInitializeBondCountdowns() {
            console.log('🔄 Verificando títulos para inicialização automática...');
            
            let initialized = 0;
            
            AppState.portfolio.positions.forEach(position => {
                if (!position.type.includes('titulo')) return;
                
                // Verificar se já tem bondInfo
                if (position.bondInfo && position.bondInfo.initialized) return;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset) return;
                
                console.log(`⚙️ Inicializando bondInfo para: ${asset.ticker}`);
                
                const currentDate = AppState.market.simulatedTime;
                const maturityYears = asset.maturity || 1;
                
                // Criar bondInfo
                position.bondInfo = {
                    purchaseDate: currentDate,
                    maturityDate: calculateMaturityDate(currentDate, maturityYears),
                    totalPayments: maturityYears * 2,
                    paymentsMade: 0,
                    nextPaymentDate: calculateNextPaymentDate(currentDate, 6),
                    principalAmount: asset.initialPrice * position.quantity,
                    initialized: true,
                    matured: false
                };
                
                initialized++;
            });
            
            if (initialized > 0) {
                console.log(`✅ ${initialized} título(s) inicializado(s) automaticamente`);
                
                // Atualizar UI
                updateBondCountdowns();
                updateBondCountdownUI();
                saveToLocalStorage();
            }
        }

        // ⭐ Executar na inicialização do dashboard
        const originalShowDashboard2 = showDashboard;
        showDashboard = function() {
            originalShowDashboard2();
            
            // Auto-inicializar títulos após 2 segundos
            setTimeout(() => {
                autoInitializeBondCountdowns();
            }, 2000);
        };

        // ⭐ Executar ao carregar estado salvo
        const originalLoadFromLocalStorage2 = loadFromLocalStorage;
        loadFromLocalStorage = function() {
            const result = originalLoadFromLocalStorage2();
            
            if (result) {
                // Auto-inicializar títulos após 1 segundo
                setTimeout(() => {
                    autoInitializeBondCountdowns();
                }, 1000);
            }
            
            return result;
        };

        // Gerar datas de pagamento semestrais
        function generatePaymentDates(startDate, years) {
            const dates = [];
            let currentYear = startDate.currentYear;
            let currentMonth = startDate.currentMonth;
            let currentDay = startDate.currentDay;
            
            // Primeiro pagamento em 6 meses
            for (let i = 1; i <= years * 2; i++) {
                // Adicionar 6 meses
                currentMonth += 6;
                if (currentMonth > 12) {
                    currentMonth -= 12;
                    currentYear++;
                }
                
                // Ajustar dia se necessário (ex: 31 para meses com 30 dias)
                const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                const adjustedDay = Math.min(currentDay, daysInMonth);
                
                dates.push({
                    currentYear,
                    currentMonth,
                    currentDay: adjustedDay
                });
            }
            
            return dates;
        }

        // Calcular data de vencimento
        function calculateMaturityDate(startDate, years) {
            let maturityYear = startDate.currentYear + years;
            let maturityMonth = startDate.currentMonth;
            let maturityDay = startDate.currentDay;
            
            // Ajustar dia se necessário
            const daysInMonth = getDaysInMonth(maturityMonth, maturityYear);
            if (maturityDay > daysInMonth) {
                maturityDay = daysInMonth;
            }
            
            return {
                currentYear: maturityYear,
                currentMonth: maturityMonth,
                currentDay: maturityDay
            };
        }

        // Processar pagamentos de títulos
        function processBondPayments() {
            const currentDate = AppState.market.simulatedTime;
            let totalInterestPaid = 0;
            let bondsProcessed = 0;
            
            // Processar cada posição de título
            AppState.portfolio.positions.forEach(position => {
                if (!position.type.includes('titulo')) return;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset || !asset.bondSchedule) return;
                
                const schedule = asset.bondSchedule;
                
                // Verificar pagamentos pendentes
                while (schedule.nextPaymentIndex < schedule.payments.length) {
                    const payment = schedule.payments[schedule.nextPaymentIndex];
                    
                    if (isSameDate(currentDate, payment.date)) {
                        // Processar pagamento
                        const paymentAmount = payment.amount;
                        let netPayment = paymentAmount;
                        
                        // Aplicar imposto para títulos privados
                        if (payment.type === 'interest' && !schedule.isPublic) {
                            const tax = paymentAmount * 0.10; // 10% de imposto
                            netPayment = paymentAmount - tax;
                            
                            // Registrar imposto
                            AppState.portfolio.transactions.push({
                                timestamp: new Date().toISOString(),
                                assetId: asset.id,
                                assetName: asset.name,
                                type: 'tax',
                                amount: -tax,
                                details: `Imposto sobre juros - ${asset.ticker}`
                            });
                        }
                        
                        // Adicionar ao saldo
                        AppState.user.availableBalance += netPayment;
                        totalInterestPaid += netPayment;
                        bondsProcessed++;
                        
                        // Atualizar status do pagamento
                        payment.status = 'paid';
                        payment.paidDate = { ...currentDate };
                        payment.netAmount = netPayment;
                        
                        // Registrar transação
                        const transactionType = payment.type === 'principal' ? 'principal_return' : 'interest';
                        AppState.portfolio.transactions.push({
                            timestamp: new Date().toISOString(),
                            assetId: asset.id,
                            assetName: asset.name,
                            type: transactionType,
                            amount: netPayment,
                            quantity: position.quantity,
                            details: `${payment.type === 'principal' ? 'Principal' : 'Juros'} - ${asset.ticker}`
                        });
                        
                        // Notificação
                        const paymentType = payment.type === 'principal' ? 'principal' : 'juros';
                        showNotification(
                            `💸 Recebeu ${paymentType} de ${asset.ticker}: ${formatCurrency(netPayment)}`,
                            'success'
                        );
                        
                        // Se for pagamento do principal, remover posição
                        if (payment.type === 'principal') {
                            removeBondPosition(position.assetId);
                        }
                        
                        schedule.nextPaymentIndex++;
                    } else {
                        break; // Próxima data não atingida
                    }
                }
            });
            
            return { totalInterestPaid, bondsProcessed };
        }

        // Verificar se duas datas são iguais
        function isSameDate(date1, date2) {
            return date1.currentYear === date2.currentYear &&
                date1.currentMonth === date2.currentMonth &&
                date1.currentDay === date2.currentDay;
        }

        // Remover posição de título após pagamento do principal
        function removeBondPosition(assetId) {
            const index = AppState.portfolio.positions.findIndex(p => p.assetId === assetId);
            if (index !== -1) {
                AppState.portfolio.positions.splice(index, 1);
                console.log(`Posição de título ${assetId} removida após vencimento`);
            }
        }

        // Calcular tempo restante para vencimento
        function calculateTimeToMaturity(asset) {
            if (!asset.bondSchedule || !asset.bondSchedule.maturityDate) return 'N/A';
            
            const current = AppState.market.simulatedTime;
            const maturity = asset.bondSchedule.maturityDate;
            
            let yearsRemaining = maturity.currentYear - current.currentYear;
            let monthsRemaining = maturity.currentMonth - current.currentMonth;
            let daysRemaining = maturity.currentDay - current.currentDay;
            
            // Ajustar valores negativos
            if (daysRemaining < 0) {
                monthsRemaining--;
                const prevMonth = current.currentMonth === 1 ? 12 : current.currentMonth - 1;
                const prevYear = current.currentMonth === 1 ? current.currentYear - 1 : current.currentYear;
                daysRemaining += getDaysInMonth(prevMonth, prevYear);
            }
            
            if (monthsRemaining < 0) {
                yearsRemaining--;
                monthsRemaining += 12;
            }
            
            // Formatar resultado
            if (yearsRemaining > 0) {
                return `${yearsRemaining} ano(s), ${monthsRemaining} mês(es)`;
            } else if (monthsRemaining > 0) {
                return `${monthsRemaining} mês(es), ${daysRemaining} dia(s)`;
            } else {
                return `${daysRemaining} dia(s)`;
            }
        }

        // Adicionar informações de vencimento às posições de títulos
        function addMaturityInfoToPositions() {
            const positionItems = document.querySelectorAll('.position-item');
            
            positionItems.forEach(item => {
                const tickerElement = item.querySelector('strong');
                if (!tickerElement) return;
                
                const ticker = tickerElement.textContent;
                
                // Encontrar a posição
                const position = AppState.portfolio.positions.find(p => p.ticker === ticker);
                if (!position || !position.type.includes('titulo')) return;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset || !asset.bondSchedule) return;
                
                // Verificar se já tem info de vencimento
                if (item.querySelector('.maturity-info')) return;
                
                const timeRemaining = calculateTimeToMaturity(asset);
                const nextPaymentIndex = asset.bondSchedule.nextPaymentIndex;
                const totalPayments = asset.bondSchedule.totalPayments || 1;
                const progressPercent = Math.round((nextPaymentIndex / totalPayments) * 100);
                
                const maturityDiv = document.createElement('div');
                maturityDiv.className = 'maturity-info';
                maturityDiv.style.cssText = `
                    margin-top: 8px;
                    padding: 8px;
                    background: rgba(214, 174, 100, 0.1);
                    border-radius: 6px;
                    font-size: 0.85rem;
                    border-left: 3px solid var(--accent-green);
                `;
                maturityDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>⏳ Vencimento: <strong>${timeRemaining}</strong></span>
                        <span>${progressPercent}%</span>
                    </div>
                    <div style="height: 4px; background: var(--gray-medium); border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${progressPercent}%; background: var(--accent-green); transition: width 0.3s;"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">
                        Pagamento ${nextPaymentIndex + 1}/${totalPayments} | 
                        ${asset.bondSchedule.isPublic ? '🏛️ Público' : '🏦 Privado'}
                    </div>
                `;
                
                // Inserir antes do botão de venda
                const sellButton = item.querySelector('.btn-sell-small');
                if (sellButton) {
                    sellButton.insertAdjacentElement('beforebegin', maturityDiv);
                }
            });
        }

        // Integrar processamento de juros com o sistema temporal
        const extendedProcessTimeBasedEvents = processTimeBasedEvents;
        processTimeBasedEvents = function(timeUpdate) {
            extendedProcessTimeBasedEvents(timeUpdate);
            
            // Processar pagamentos de títulos diariamente
            processBondPayments();
        };

        // ========================================
        // CORREÇÃO DO SISTEMA DE VALORIZAÇÃO/DESVALORIZAÇÃO
        // ========================================

        // Backup da função original
        const originalCalculateNextPrice = calculateNextPrice;

        // Nova implementação com correções
        calculateNextPrice = function(asset, scenario) {
            const current = asset.currentPrice || asset.initialPrice;
            let vol = asset.volatility;
            let drift = 0;
            
            // Aplicar lógica de correção baseada no cenário
            switch(scenario) {
                case 'estavel':
                    // Cenário estável - manter como está (já funciona bem)
                    // Apenas garantir pequena oscilação
                    drift = randomNormal(0, vol);
                    break;
                    
                case 'crise':
                    if (asset.type === 'acao' || asset.type === 'etf') {
                        // Crise: mais desvalorização que valorização
                        const willRise = Math.random() < 0.30; // 30% chance de subir
                        
                        if (willRise) {
                            drift = 0.01 + (Math.random() * 0.02); // 1-3% de valorização
                            vol *= 1.5;
                        } else {
                            drift = -0.05 + (Math.random() * -0.03); // 5-8% de desvalorização
                            vol *= 2.5;
                        }
                    } else if (asset.type.includes('titulo')) {
                        // Títulos sobem em crise (flight to safety)
                        drift = 0.005 + (Math.random() * 0.005); // 0.5-1% de valorização
                    } else if (asset.type === 'cripto') {
                        // Cripto: alta volatilidade negativa
                        const willRise = Math.random() < 0.25; // 25% chance de subir
                        
                        if (willRise) {
                            drift = 0.02 + (Math.random() * 0.03); // 2-5% de valorização
                            vol *= 1.8;
                        } else {
                            drift = -0.08 + (Math.random() * -0.04); // 8-12% de desvalorização
                            vol *= 2.2;
                        }
                    }
                    break;
                    
                case 'crescimento':
                    if (asset.type === 'acao' || asset.type === 'etf' || asset.type === 'cripto') {
                        // Crescimento: mais valorização, mas COM desvalorização
                        const willRise = Math.random() < 0.75; // 75% chance de subir
                        
                        if (willRise) {
                            // Valorização forte
                            drift = 0.02 + (Math.random() * 0.03); // 2-5% de valorização
                            vol *= 1.2;
                        } else {
                            // Correção saudável
                            drift = -0.03 + (Math.random() * -0.02); // 3-5% de desvalorização
                            vol *= 1.5;
                            
                            // Garantir que não seja apenas linha reta
                            if (Math.random() < 0.3) {
                                drift *= 1.5; // Correção mais forte ocasionalmente
                            }
                        }
                        
                        // Oscilação mínima garantida
                        if (Math.abs(drift) < 0.005) {
                            drift = drift < 0 ? -0.008 : 0.008;
                        }
                    } else if (asset.type.includes('titulo')) {
                        // Títulos têm desempenho moderado em crescimento
                        drift = randomNormal(0, vol * 0.5);
                    }
                    break;
                    
                case 'angola-especial':
                    if (asset.country === 'AO' && asset.type === 'acao') {
                        // Angola Especial: forte valorização mas COM oscilação
                        const willRise = Math.random() < 0.80; // 80% chance de subir
                        
                        if (willRise) {
                            // Valorização muito forte (mas variável)
                            const baseGain = 0.03 + (Math.random() * 0.04); // 3-7% base
                            
                            // Bônus adicional baseado no tempo (acumulação)
                            const daysElapsed = AppState.market.simulatedTime.totalDaysElapsed || 0;
                            const timeBonus = Math.min(0.10, daysElapsed * 0.0005); // Até 10% bônus
                            
                            drift = baseGain + timeBonus;
                            vol *= 0.9; // Menor volatilidade na subida
                            
                            // Adicionar "momentum" - tendência a continuar subindo
                            const recentGains = calculateRecentGains(asset);
                            if (recentGains > 0.10) { // Se subiu 10% recentemente
                                drift *= 1.2; // Aumentar momentum
                            }
                        } else {
                            // Correção controlada
                            drift = -0.04 + (Math.random() * -0.03); // 4-7% de correção
                            vol *= 1.4; // Maior volatilidade na descida
                            
                            // Limitador de correção baseado no ganho anual
                            const annualGain = calculateAnnualGain(asset);
                            if (annualGain > 2.0) { // Se já subiu 200% no ano
                                // Correção mais permitida
                                drift *= 1.3;
                            } else if (annualGain < 0.5) { // Se subiu menos de 50%
                                // Correção mais limitada
                                drift *= 0.7;
                            }
                        }
                        
                        // Profit taking automático para ganhos extremos
                        const totalGain = (current - asset.initialPrice) / asset.initialPrice;
                        if (totalGain > 3.0) { // +300%
                            const correctionChance = Math.min(0.4, (totalGain - 3.0) * 0.1);
                            if (Math.random() < correctionChance) {
                                const profitTaking = 0.10 + (Math.random() * 0.10); // 10-20%
                                drift = -profitTaking;
                                console.log(`Profit taking automático em ${asset.ticker}: -${(profitTaking*100).toFixed(1)}%`);
                            }
                        }
                        
                        // REMOVER limite máximo (comentar, não deletar)
                        // const maxPrice = asset.initialPrice * 50; // <-- COMENTAR ESTA LINHA
                        
                        // Aplicar limite mínimo dinâmico
                        const minPrice = asset.initialPrice * 0.10; // Nunca abaixo de 10% do inicial
                        
                    } else if (asset.type === 'cripto') {
                        // Cripto segue mercado global em Angola Especial
                        const willRise = Math.random() < 0.65;
                        
                        if (willRise) {
                            drift = 0.015 + (Math.random() * 0.025); // 1.5-4%
                            vol *= 1.3;
                        } else {
                            drift = -0.025 + (Math.random() * -0.015); // 2.5-4%
                            vol *= 1.6;
                        }
                    }
                    break;
            }
            
            // Calcular novo preço
            const changePct = drift + randomNormal(0, vol);
            let newPrice = current * (1 + changePct);
            
            // Limites dinâmicos (sem limites máximos fixos para Angola Especial)
            const minPrice = asset.initialPrice * 0.01; // Mínimo de 1% do inicial
            
            if (scenario === 'angola-especial' && asset.country === 'AO' && asset.type === 'acao') {
                // Sem limite máximo, apenas mínimo
                newPrice = Math.max(minPrice, newPrice);
            } else {
                // Para outros cenários, manter limite razoável
                const maxPrice = asset.initialPrice * 50;
                newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
            }
            
            // Formatação baseada no tipo
            if (asset.type === 'cripto') {
                const decimals = asset.decimals || 8;
                newPrice = parseFloat(newPrice.toFixed(decimals));
            } else {
                newPrice = parseFloat(newPrice.toFixed(2));
            }
            
            // Log para debugging (opcional)
            if (Math.abs(changePct) > 0.15) { // Mudança > 15%
                console.log(`${asset.ticker}: ${changePct > 0 ? '📈' : '📉'} ${(changePct*100).toFixed(2)}% (${scenario})`);
            }
            
            return newPrice;
        };

        // Funções auxiliares para o sistema de correção
        function calculateRecentGains(asset) {
            if (!asset.priceHistory || asset.priceHistory.length < 10) return 0;
            
            const recentPrices = asset.priceHistory.slice(-10); // Últimas 10 atualizações
            const oldest = recentPrices[0];
            const latest = recentPrices[recentPrices.length - 1];
            
            return (latest - oldest) / oldest;
        }

        function calculateAnnualGain(asset) {
            const current = asset.currentPrice || asset.initialPrice;
            const initial = asset.initialPrice;
            
            return (current - initial) / initial;
        }

        // Sistema de "market cycles" para evitar linearidade
        let marketCyclePhase = 0; // 0-1: fase do ciclo
        let marketCycleDirection = 1; // 1: expansão, -1: contração

        function updateMarketCycle() {
            // Atualizar fase do ciclo (progressão lenta)
            marketCyclePhase += 0.01;
            if (marketCyclePhase >= 1) {
                marketCyclePhase = 0;
                marketCycleDirection *= -1; // Inverter direção
            }
            
            // Aplicar influência do ciclo nos preços
            Object.values(AppState.market.assets).forEach(asset => {
                if (asset.type === 'acao' || asset.type === 'etf' || asset.type === 'cripto') {
                    const cycleInfluence = Math.sin(marketCyclePhase * Math.PI * 2) * 0.005;
                    
                    // Aplicar influência gradualmente
                    if (Math.random() < 0.3) { // 30% de chance de ser afetado pelo ciclo
                        asset.currentPrice *= (1 + cycleInfluence);
                    }
                }
            });
        }

        // Integrar com updateMarketPrices
        const extendedUpdateMarketPrices = updateMarketPrices;
        updateMarketPrices = function() {
            // Atualizar ciclo de mercado
            if (Math.random() < 0.1) { // 10% de chance por atualização
                updateMarketCycle();
            }
            
            // Chamar função estendida
            extendedUpdateMarketPrices();
        };

        // Função para verificar e corrigir estagnação
        function checkAndCorrectStagnation() {
            Object.values(AppState.market.assets).forEach(asset => {
                if (asset.type === 'acao' && asset.country === 'AO') {
                    // Verificar se está "estagnado" (pouca variação recente)
                    if (asset.priceHistory && asset.priceHistory.length > 20) {
                        const recentPrices = asset.priceHistory.slice(-20);
                        const minPrice = Math.min(...recentPrices);
                        const maxPrice = Math.max(...recentPrices);
                        const priceRange = (maxPrice - minPrice) / minPrice;
                        
                        // Se variação menor que 5% nas últimas 20 atualizações
                        if (priceRange < 0.05) {
                            // Aplicar correção de estagnação
                            const correction = (Math.random() - 0.5) * 0.08; // ±4%
                            asset.currentPrice *= (1 + correction);
                            
                            console.log(`Correção de estagnação em ${asset.ticker}: ${correction > 0 ? '+' : ''}${(correction*100).toFixed(2)}%`);
                        }
                    }
                }
            });
        }

        // Executar verificação de estagnação periodicamente
        setInterval(checkAndCorrectStagnation, 30000); // A cada 30 segundos


        // ========================================
        // CORREÇÃO 2: SISTEMA DE HISTÓRICO DE JUROS
        // ========================================

        // 1. Inicializar array de histórico de juros
        if (!AppState.portfolio.bondInterestHistory) {
            AppState.portfolio.bondInterestHistory = [];
        }

        // 2. Função para registrar pagamento de juros
        function registerBondInterestPayment(asset, position, paymentNumber, interestAmount, principalRemaining) {
            const interestRecord = {
                timestamp: new Date().toISOString(),
                date: formatSimulatedDate(),
                bondId: asset.id,
                bondName: asset.name,
                ticker: asset.ticker,
                type: 'interest',
                paymentNumber: paymentNumber,
                interestAmount: interestAmount,
                principalRemaining: principalRemaining,
                quantity: position.quantity,
                simulatedDate: formatSimulatedDate()
            };
            
            // Adicionar ao histórico
            AppState.portfolio.bondInterestHistory.push(interestRecord);
            
            // Salvar
            saveToLocalStorage();
            
            // Atualizar tabela
            updateBondInterestTable();
            
            return interestRecord;
        }

        // 3. Criar e atualizar tabela de juros
        function createBondInterestTable() {
            // Verificar se já existe
            if (document.getElementById('bond-interest-table')) return;
            
            // Encontrar onde inserir (após tabela de dividendos ou transações)
            const referenceElement = document.querySelector('.ext-dividends-panel') || 
                                document.querySelector('.transaction-history');
            
            if (!referenceElement) {
                console.log('Elemento de referência não encontrado para tabela de juros');
                return;
            }
            
            // Criar nova seção
            const interestSection = document.createElement('div');
            interestSection.className = 'transaction-history';
            interestSection.style.marginTop = '20px';
            interestSection.innerHTML = `
                <h3>💵 Histórico de Pagamentos de Juros</h3>
                <div class="history-table-container">
                    <table id="bond-interest-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Título</th>
                                <th>Pagamento Nº</th>
                                <th>Valor do Juro</th>
                                <th>Principal Restante</th>
                            </tr>
                        </thead>
                        <tbody id="bond-interest-body">
                            <tr><td colspan="5" class="empty-state">Nenhum juro recebido ainda.</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            
            // Inserir após o elemento de referência
            referenceElement.insertAdjacentElement('afterend', interestSection);
        }

        function updateBondInterestTable() {
            // Garantir que a tabela existe
            if (!document.getElementById('bond-interest-table')) {
                createBondInterestTable();
            }
            
            const tableBody = document.getElementById('bond-interest-body');
            if (!tableBody) return;
            
            const history = AppState.portfolio.bondInterestHistory || [];
            
            if (history.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum juro recebido ainda.</td></tr>';
                return;
            }
            
            // Ordenar por data (mais recente primeiro)
            const sorted = [...history].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            
            tableBody.innerHTML = sorted.map(record => `
                <tr>
                    <td>${record.simulatedDate || record.date}</td>
                    <td>${record.bondName} (${record.ticker})</td>
                    <td>${record.paymentNumber}</td>
                    <td>${formatCurrency(record.interestAmount)}</td>
                    <td>${formatCurrency(record.principalRemaining)}</td>
                </tr>
            `).join('');
        }

        // 4. Criar estrutura de bondInfo para cada posição
        function initializeBondInfo() {
            AppState.portfolio.positions.forEach((position, index) => {
                if (position.type.includes('titulo') && !position.bondInfo) {
                    const asset = AppState.market.assets[position.assetId];
                    if (!asset) return;
                    
                    const maturityYears = asset.maturity || 1;
                    
                    position.bondInfo = {
                        purchaseDate: { ...AppState.market.simulatedTime },
                        maturityDate: calculateMaturityDate(AppState.market.simulatedTime, maturityYears),
                        totalPayments: maturityYears * 2, // semestral
                        paymentsMade: 0,
                        nextPaymentDate: calculateNextPaymentDate(AppState.market.simulatedTime, 6), // 6 meses
                        principalAmount: asset.initialPrice * position.quantity
                    };
                    
                    console.log(`BondInfo inicializado para ${position.ticker}: ${position.bondInfo.totalPayments} pagamentos`);
                }
            });
        }

        // Funções auxiliares para datas
        function calculateMaturityDate(startDate, years) {
            return {
                currentYear: startDate.currentYear + years,
                currentMonth: startDate.currentMonth,
                currentDay: startDate.currentDay
            };
        }

        function calculateNextPaymentDate(startDate, monthsToAdd) {
            let newYear = startDate.currentYear;
            let newMonth = startDate.currentMonth + monthsToAdd;
            
            while (newMonth > 12) {
                newMonth -= 12;
                newYear += 1;
            }
            
            return {
                currentYear: newYear,
                currentMonth: newMonth,
                currentDay: startDate.currentDay
            };
        }

        // ===== PROCESSAMENTO DE JUROS COM REGISTRO NO HISTÓRICO =====
        function processBondInterestPayments() {
            const currentDate = AppState.market.simulatedTime;
            let totalInterestPaid = 0;
            let paymentsProcessed = 0;
            
            console.log('🔍 Verificando pagamentos de juros:', formatSimulatedDate());
            
            AppState.portfolio.positions.forEach((position, index) => {
                if (!position.type.includes('titulo') || !position.bondInfo) return;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset) return;
                
                const bondInfo = position.bondInfo;
                
                // Verificar se é hora do próximo pagamento
                if (isSameDate(currentDate, bondInfo.nextPaymentDate) || 
                    isDateAfter(currentDate, bondInfo.nextPaymentDate)) {
                    
                    // Verificar se já fez todos os pagamentos
                    if (bondInfo.paymentsMade >= bondInfo.totalPayments) {
                        console.log(`⏭️ Todos os pagamentos já foram feitos para ${asset.ticker}`);
                        return;
                    }
                    
                    // Calcular juro semestral
                    const semiannualInterest = (asset.couponRate / 2) * bondInfo.principalAmount;
                    let netInterest = semiannualInterest;
                    
                    // Aplicar imposto para títulos privados
                    let tax = 0;
                    if (asset.type === 'titulo-privado') {
                        tax = semiannualInterest * 0.10; // 10% de imposto
                        netInterest = semiannualInterest - tax;
                        console.log(`💰 Título privado ${asset.ticker}: Imposto de ${formatCurrency(tax)}`);
                    }
                    
                    // Adicionar ao saldo
                    AppState.user.availableBalance += netInterest;
                    totalInterestPaid += netInterest;
                    
                    // Incrementar contador
                    bondInfo.paymentsMade += 1;
                    paymentsProcessed++;
                    
                    // ⭐ CRÍTICO: REGISTRAR NO HISTÓRICO
                    const interestRecord = {
                        id: `interest_${Date.now()}_${asset.id}_${bondInfo.paymentsMade}`,
                        timestamp: new Date().toISOString(),
                        date: formatSimulatedDate(),
                        simulatedDate: formatSimulatedDate(),
                        bondId: asset.id,
                        bondName: asset.name,
                        ticker: asset.ticker,
                        type: 'interest',
                        paymentNumber: bondInfo.paymentsMade,
                        totalPayments: bondInfo.totalPayments,
                        interestAmount: semiannualInterest,
                        netInterestAmount: netInterest,
                        taxAmount: tax,
                        principalRemaining: bondInfo.principalAmount,
                        status: 'Pago',
                        isPublic: asset.type === 'titulo-publico'
                    };
                    
                    // Adicionar ao histórico global
                    if (!AppState.portfolio.bondInterestHistory) {
                        AppState.portfolio.bondInterestHistory = [];
                    }
                    AppState.portfolio.bondInterestHistory.push(interestRecord);
                    
                    console.log(`✅ Juro registrado:`, interestRecord);
                    
                    // Calcular próximo pagamento
                    bondInfo.nextPaymentDate = calculateNextPaymentDate(bondInfo.nextPaymentDate, 6);
                    
                    // Notificação
                    const taxInfo = tax > 0 ? ` (após IAC: -${formatCurrency(tax)})` : ' (isento de IAC)';
                    showNotification(
                        `💵 Juro de ${asset.ticker}: ${formatCurrency(netInterest)}${taxInfo} | Pagamento ${bondInfo.paymentsMade}/${bondInfo.totalPayments}`,
                        'success'
                    );
                    
                    // ⭐ ATUALIZAR TABELA IMEDIATAMENTE
                    updateBondInterestTable();
                    
                    // Salvar estado
                    saveToLocalStorage();
                }
            });
            
            if (paymentsProcessed > 0) {
                console.log(`💰 Total de juros pagos: ${formatCurrency(totalInterestPaid)} (${paymentsProcessed} pagamento(s))`);
                
                // Atualizar UI completa
                updatePortfolioUI();
                updateBondInterestTable();
            }
            
            return { totalInterestPaid, paymentsProcessed };
        }

        // ===== CRIAR E ATUALIZAR TABELA DE JUROS =====
        function updateBondInterestTable() {
            console.log('📊 Atualizando tabela de juros...');
            
            // Verificar se o container existe
            let tableContainer = document.getElementById('bond-interest-table');
            
            // Se não existir, criar
            if (!tableContainer) {
                console.log('🔨 Criando tabela de juros pela primeira vez...');
                createBondInterestTableHTML();
                tableContainer = document.getElementById('bond-interest-table');
            }
            
            if (!tableContainer) {
                console.error('❌ Não foi possível criar tabela de juros');
                return;
            }
            
            const tableBody = document.getElementById('bond-interest-body');
            if (!tableBody) {
                console.error('❌ tbody não encontrado');
                return;
            }
            
            const history = AppState.portfolio.bondInterestHistory || [];
            console.log(`📋 Histórico de juros: ${history.length} registro(s)`);
            
            if (history.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <div style="padding: 30px; text-align: center;">
                                <div style="font-size: 3rem; margin-bottom: 10px;">💵</div>
                                <p style="font-size: 1.1rem; margin-bottom: 8px;">Nenhum juro recebido ainda</p>
                                <p style="font-size: 0.85rem; opacity: 0.7;">
                                    Os juros de títulos são pagos <strong>semestralmente</strong> (a cada 6 meses).
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Ordenar por data (mais recente primeiro)
            const sorted = [...history].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            console.log(`✅ Renderizando ${sorted.length} pagamento(s) de juros`);
            
            tableBody.innerHTML = sorted.map((record, index) => {
                const taxInfo = record.taxAmount > 0 
                    ? `<br><small style="color: var(--danger);">IAC: -${formatCurrency(record.taxAmount)}</small>`
                    : '<br><small style="color: var(--success);">Isento de IAC</small>';
                
                return `
                    <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                        <td>${record.simulatedDate || record.date}</td>
                        <td>
                            <strong>${record.ticker}</strong>
                            <br>
                            <small style="opacity: 0.7;">${record.bondName}</small>
                        </td>
                        <td style="text-align: center;">
                            <strong>${record.paymentNumber}/${record.totalPayments}</strong>
                        </td>
                        <td style="text-align: right;">
                            ${formatCurrency(record.interestAmount)}
                            ${taxInfo}
                        </td>
                        <td style="text-align: right;" class="positive">
                            <strong>${formatCurrency(record.netInterestAmount || record.interestAmount)}</strong>
                        </td>
                        <td style="text-align: right;">
                            ${formatCurrency(record.principalRemaining)}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // ===== CRIAR HTML DA TABELA DE JUROS =====
        function createBondInterestTableHTML() {
            // Encontrar onde inserir (após tabela de transações)
            const transactionHistory = document.querySelector('.transaction-history');
            if (!transactionHistory) {
                console.error('❌ .transaction-history não encontrada');
                return;
            }
            
            // Criar seção
            const interestSection = document.createElement('div');
            interestSection.className = 'transaction-history';
            interestSection.style.cssText = 'margin-top: 30px; display: block !important;';
            interestSection.innerHTML = `
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
                            <tr>
                                <td colspan="6" class="empty-state">Nenhum juro recebido ainda.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
            
            // Inserir após transações
            transactionHistory.insertAdjacentElement('afterend', interestSection);
            
            console.log('✅ Tabela de juros criada com sucesso');
        }

        // ===== VERIFICAÇÃO PERIÓDICA DE JUROS =====
        setInterval(() => {
            processBondInterestPayments();
        }, 10000); // A cada 10 segundos

        // Verificar imediatamente ao carregar
        setTimeout(() => {
            console.log('🔄 Verificação inicial de juros...');
            processBondInterestPayments();
            updateBondInterestTable();
        }, 3000);

        // Funções auxiliares para comparação de datas
        function isSameDate(date1, date2) {
            return date1.currentYear === date2.currentYear &&
                date1.currentMonth === date2.currentMonth &&
                date1.currentDay === date2.currentDay;
        }

        function isDateAfter(date1, date2) {
            if (date1.currentYear > date2.currentYear) return true;
            if (date1.currentYear === date2.currentYear) {
                if (date1.currentMonth > date2.currentMonth) return true;
                if (date1.currentMonth === date2.currentMonth) {
                    return date1.currentDay > date2.currentDay;
                }
            }
            return false;
        }

        // 6. Inicializar e executar sistema
        setTimeout(() => {
            initializeBondInfo();
            updateBondInterestTable();
        }, 2000);

        setInterval(() => {
            processBondInterestPayments();
        }, 30000); // Verificar a cada 30 segundos

        // ========================================
        // CORREÇÃO 3: CONTAGEM REGRESSIVA DE TÍTULOS
        // ========================================

        // 1. Atualizar informações de contagem regressiva
        function updateBondCountdowns() {
            const currentDate = AppState.market.simulatedTime;
            
            AppState.portfolio.positions.forEach((position, index) => {
                if (!position.type.includes('titulo') || !position.bondInfo) return;
                
                const bondInfo = position.bondInfo;
                
                // Calcular dias até vencimento
                const daysToMaturity = calculateDaysBetween(currentDate, bondInfo.maturityDate);
                
                // Calcular dias até próximo pagamento
                const daysToNextPayment = calculateDaysBetween(currentDate, bondInfo.nextPaymentDate);
                
                // Calcular progresso
                const progressPercent = Math.round((bondInfo.paymentsMade / bondInfo.totalPayments) * 100);
                
                // Atualizar informações
                position.countdown = {
                    daysToMaturity: daysToMaturity,
                    daysToNextPayment: daysToNextPayment,
                    progressPercent: progressPercent,
                    paymentsMade: bondInfo.paymentsMade,
                    totalPayments: bondInfo.totalPayments,
                    nextPaymentFormatted: formatDate(bondInfo.nextPaymentDate),
                    maturityFormatted: formatDate(bondInfo.maturityDate)
                };
            });
        }

        // 2. Funções auxiliares para cálculos
        function calculateDaysBetween(date1, date2) {
            // Simplificação: cada mês tem 30 dias
            const days1 = date1.currentYear * 365 + (date1.currentMonth - 1) * 30 + date1.currentDay;
            const days2 = date2.currentYear * 365 + (date2.currentMonth - 1) * 30 + date2.currentDay;
            return Math.max(0, days2 - days1);
        }

        function formatDate(date) {
            return `${date.currentDay.toString().padStart(2, '0')}/${date.currentMonth.toString().padStart(2, '0')}/${date.currentYear}`;
        }

        // 3. Atualizar UI com contagem regressiva
        function updateBondCountdownUI() {
            const positionItems = document.querySelectorAll('.position-item');
            
            positionItems.forEach(item => {
                const tickerElement = item.querySelector('strong');
                if (!tickerElement) return;
                
                const ticker = tickerElement.textContent;
                
                // Encontrar a posição
                const position = AppState.portfolio.positions.find(p => p.ticker === ticker);
                if (!position || !position.type.includes('titulo') || !position.countdown) return;
                
                const countdown = position.countdown;
                
                // Remover contagem anterior se existir
                const oldCountdown = item.querySelector('.bond-countdown');
                if (oldCountdown) oldCountdown.remove();
                
                // Criar nova contagem
                const countdownDiv = document.createElement('div');
                countdownDiv.className = 'bond-countdown';
                countdownDiv.style.cssText = `
                    margin-top: 8px;
                    padding: 10px;
                    background: rgba(214, 174, 100, 0.1);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    border-left: 3px solid var(--accent-green);
                `;
                
                countdownDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span>⏳ Vencimento: <strong>${countdown.daysToMaturity} dias</strong></span>
                        <span>${countdown.progressPercent}%</span>
                    </div>
                    <div style="height: 6px; background: var(--gray-medium); border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
                        <div style="height: 100%; width: ${countdown.progressPercent}%; background: var(--accent-green); transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: rgba(255,255,255,0.8);">
                        <span>Pagamento ${countdown.paymentsMade + 1}/${countdown.totalPayments}</span>
                        <span>Próximo: ${countdown.daysToNextPayment} dias</span>
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 4px;">
                        ${countdown.nextPaymentFormatted} → ${countdown.maturityFormatted}
                    </div>
                `;
                
                // Inserir antes do botão de venda
                const sellButton = item.querySelector('.btn-sell-small');
                if (sellButton) {
                    sellButton.insertAdjacentElement('beforebegin', countdownDiv);
                }
            });
        }

        // ⭐ Atualização mais frequente e robusta
        setInterval(() => {
            // Atualizar contagens
            updateBondCountdowns();
            updateBondCountdownUI();
            
            // Re-inicializar títulos sem bondInfo
            autoInitializeBondCountdowns();
        }, 5000); // Atualizar a cada 5 segundos

        // ⭐ Atualização extra ao mudar de tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                updateBondCountdowns();
                updateBondCountdownUI();
            }
        });

        // ========================================
        // SISTEMA SIMPLIFICADO DE VENCIMENTO DE TÍTULOS
        // VERSÃO DEFINITIVA - CORREÇÃO 100%
        // ========================================

        // 1. FUNÇÃO PRINCIPAL ÚNICA - Substitui todas as outras
        function processBondMaturities() {
            const currentDate = AppState.market.simulatedTime;
            let processedCount = 0;
            let totalReturned = 0;
            
            console.log('🔍 Verificando vencimentos de títulos...');
            
            // ✅ CORREÇÃO CRÍTICA: Usar loop reverso para remoção segura
            for (let i = AppState.portfolio.positions.length - 1; i >= 0; i--) {
                const position = AppState.portfolio.positions[i];
                
                // Verificar se é um título
                if (!position.type || !position.type.includes('titulo')) continue;
                
                const asset = AppState.market.assets[position.assetId];
                if (!asset) continue;
                
                // ✅ CORREÇÃO: Obter bondInfo do position (não do asset)
                const bondInfo = position.bondInfo;
                if (!bondInfo) {
                    console.warn(`⚠️ Título ${position.ticker} sem bondInfo. Inicializando...`);
                    
                    // Inicializar bondInfo imediatamente
                    position.bondInfo = {
                        purchaseDate: { ...currentDate },
                        maturityDate: calculateMaturityDate(currentDate, asset.maturity || 1),
                        totalPayments: (asset.maturity || 1) * 2,
                        paymentsMade: 0,
                        nextPaymentDate: calculateNextPaymentDate(currentDate, 6),
                        principalAmount: position.avgPrice * position.quantity,
                        matured: false
                    };
                    continue;
                }
                
                // Verificar se já está marcado como vencido
                if (bondInfo.matured) {
                    console.log(`⏭️ Título ${position.ticker} já vencido. Removendo...`);
                    
                    // ✅ CORREÇÃO: Remover imediatamente se já está vencido
                    const principalAmount = bondInfo.principalAmount || (position.avgPrice * position.quantity);
                    
                    // Devolver 100% do capital
                    AppState.user.availableBalance += principalAmount;
                    totalReturned += principalAmount;
                    
                    // Registrar transação
                    AppState.portfolio.transactions.push({
                        timestamp: new Date().toISOString(),
                        assetId: asset.id,
                        assetName: asset.name,
                        type: 'maturity',
                        quantity: position.quantity,
                        price: position.avgPrice,
                        total: principalAmount,
                        pnl: 0,
                        details: `Vencimento - Capital 100% devolvido`
                    });
                    
                    // Remover da carteira
                    const removedPosition = AppState.portfolio.positions.splice(i, 1)[0];
                    processedCount++;
                    
                    console.log(`✅ Removido: ${position.ticker}, Capital: ${formatCurrency(principalAmount)}`);
                    continue;
                }
                
                // Verificar se atingiu a data de vencimento
                const maturityDate = bondInfo.maturityDate;
                if (!maturityDate) continue;
                
                if (isSameDate(currentDate, maturityDate) || isDateAfter(currentDate, maturityDate)) {
                    console.log(`🎯 Título ${position.ticker} VENCEU HOJE! Processando...`);
                    
                    // ✅ CORREÇÃO: Calcular 100% do capital investido
                    const principalAmount = bondInfo.principalAmount || (position.avgPrice * position.quantity);
                    const totalInvested = position.avgPrice * position.quantity;
                    
                    // ✅ CORREÇÃO CRÍTICA: Devolver 100% do capital
                    AppState.user.availableBalance += totalInvested;
                    totalReturned += totalInvested;
                    
                    // Marcar como vencido
                    bondInfo.matured = true;
                    
                    // ✅ CORREÇÃO: Registrar no histórico de dividendos/juros
                    const returnRecord = {
                        timestamp: new Date().toISOString(),
                        date: formatSimulatedDate(),
                        bondId: asset.id,
                        bondName: asset.name,
                        ticker: position.ticker,
                        type: 'capital_return',
                        principalAmount: totalInvested,
                        quantity: position.quantity,
                        simulatedDate: formatSimulatedDate(),
                        status: 'Capital Devolvido (100%)',
                        returnPercentage: 100
                    };
                    
                    if (!AppState.portfolio.bondInterestHistory) {
                        AppState.portfolio.bondInterestHistory = [];
                    }
                    AppState.portfolio.bondInterestHistory.push(returnRecord);
                    
                    // ✅ CORREÇÃO: Registrar transação normal também
                    AppState.portfolio.transactions.push({
                        timestamp: new Date().toISOString(),
                        assetId: asset.id,
                        assetName: asset.name,
                        type: 'maturity',
                        quantity: position.quantity,
                        price: position.avgPrice,
                        total: totalInvested,
                        pnl: 0,
                        details: `Vencimento - ${formatCurrency(totalInvested)} devolvido (100%)`
                    });
                    
                    // ✅ CORREÇÃO: Remover imediatamente da carteira
                    const removedPosition = AppState.portfolio.positions.splice(i, 1)[0];
                    processedCount++;
                    
                    // ✅ CORREÇÃO: Atualizar métricas IMEDIATAMENTE
                    updatePortfolioMetrics();
                    
                    // ✅ CORREÇÃO: Notificação clara e visível
                    showNotification(
                        `🏛️ TÍTULO VENCIDO: ${position.ticker}\n` +
                        `💰 Capital devolvido: ${formatCurrency(totalInvested)} (100%)\n` +
                        `📊 Posição removida da carteira`,
                        'success'
                    );
                    
                    console.log(`✅ Processado: ${position.ticker}, Devolvido: ${formatCurrency(totalInvested)}`);
                }
            }
            
            // ✅ CORREÇÃO: Se processou algum título, atualizar TODAS as UIs
            if (processedCount > 0) {
                console.log(`📈 Atualizando UIs após ${processedCount} vencimento(s)`);
                
                // Forçar atualização completa
                updatePortfolioUI();
                updateTransactionsUI();
                
                // Atualizar tabela de juros se existir
                if (typeof updateBondInterestTable === 'function') {
                    updateBondInterestTable();
                }
                
                // Salvar estado
                saveToLocalStorage();
                
                console.log(`🎉 Total devolvido: ${formatCurrency(totalReturned)} de ${processedCount} título(s)`);
            }
            
            return { processedCount, totalReturned };
        }

        // 2. REMOVER todas as outras funções conflitantes (comente ou delete):
        // - processMaturedBonds()
        // - cleanupMaturedBonds() 
        // - validateBondIntegrity()

        // 3. FUNÇÕES AUXILIARES SIMPLIFICADAS (já existem, apenas garantir):

        function calculateMaturityDate(startDate, years) {
            return {
                currentYear: startDate.currentYear + years,
                currentMonth: startDate.currentMonth,
                currentDay: startDate.currentDay
            };
        }

        function calculateNextPaymentDate(startDate, monthsToAdd) {
            let newYear = startDate.currentYear;
            let newMonth = startDate.currentMonth + monthsToAdd;
            
            while (newMonth > 12) {
                newMonth -= 12;
                newYear += 1;
            }
            
            return {
                currentYear: newYear,
                currentMonth: newMonth,
                currentDay: startDate.currentDay
            };
        }

        function isSameDate(date1, date2) {
            return date1.currentYear === date2.currentYear &&
                date1.currentMonth === date2.currentMonth &&
                date1.currentDay === date2.currentDay;
        }

        function isDateAfter(date1, date2) {
            if (date1.currentYear > date2.currentYear) return true;
            if (date1.currentYear === date2.currentYear) {
                if (date1.currentMonth > date2.currentMonth) return true;
                if (date1.currentMonth === date2.currentMonth) {
                    return date1.currentDay > date2.currentDay;
                }
            }
            return false;
        }

        // 3. Modificar função de venda para isentar títulos públicos de impostos
        const originalSellAsset = sellAsset;

        // ========================================
        // CORREÇÃO 3: CONTAGEM REGRESSIVA DE TÍTULOS
        // ========================================

        // 1. Atualizar informações de contagem regressiva
        function updateBondCountdowns() {
            const currentDate = AppState.market.simulatedTime;
            
            AppState.portfolio.positions.forEach((position, index) => {
                if (!position.type.includes('titulo') || !position.bondInfo) return;
                
                const bondInfo = position.bondInfo;
                
                // Calcular dias até vencimento
                const daysToMaturity = calculateDaysBetween(currentDate, bondInfo.maturityDate);
                
                // Calcular dias até próximo pagamento
                const daysToNextPayment = calculateDaysBetween(currentDate, bondInfo.nextPaymentDate);
                
                // Calcular progresso
                const progressPercent = Math.round((bondInfo.paymentsMade / bondInfo.totalPayments) * 100);
                
                // Atualizar informações
                position.countdown = {
                    daysToMaturity: daysToMaturity,
                    daysToNextPayment: daysToNextPayment,
                    progressPercent: progressPercent,
                    paymentsMade: bondInfo.paymentsMade,
                    totalPayments: bondInfo.totalPayments,
                    nextPaymentFormatted: formatDate(bondInfo.nextPaymentDate),
                    maturityFormatted: formatDate(bondInfo.maturityDate)
                };
            });
        }

        // 2. Funções auxiliares para cálculos
        function calculateDaysBetween(date1, date2) {
            // Simplificação: cada mês tem 30 dias
            const days1 = date1.currentYear * 365 + (date1.currentMonth - 1) * 30 + date1.currentDay;
            const days2 = date2.currentYear * 365 + (date2.currentMonth - 1) * 30 + date2.currentDay;
            return Math.max(0, days2 - days1);
        }

        function formatDate(date) {
            return `${date.currentDay.toString().padStart(2, '0')}/${date.currentMonth.toString().padStart(2, '0')}/${date.currentYear}`;
        }

        // 3. Atualizar UI com contagem regressiva
        function updateBondCountdownUI() {
            const positionItems = document.querySelectorAll('.position-item');
            
            positionItems.forEach(item => {
                const tickerElement = item.querySelector('strong');
                if (!tickerElement) return;
                
                const ticker = tickerElement.textContent;
                
                // Encontrar a posição
                const position = AppState.portfolio.positions.find(p => p.ticker === ticker);
                if (!position || !position.type.includes('titulo') || !position.countdown) return;
                
                const countdown = position.countdown;
                
                // Remover contagem anterior se existir
                const oldCountdown = item.querySelector('.bond-countdown');
                if (oldCountdown) oldCountdown.remove();
                
                // Criar nova contagem
                const countdownDiv = document.createElement('div');
                countdownDiv.className = 'bond-countdown';
                countdownDiv.style.cssText = `
                    margin-top: 8px;
                    padding: 10px;
                    background: rgba(214, 174, 100, 0.1);
                    border-radius: 8px;
                    font-size: 0.85rem;
                    border-left: 3px solid var(--accent-green);
                `;
                
                countdownDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span>⏳ Vencimento: <strong>${countdown.daysToMaturity} dias</strong></span>
                        <span>${countdown.progressPercent}%</span>
                    </div>
                    <div style="height: 6px; background: var(--gray-medium); border-radius: 3px; overflow: hidden; margin-bottom: 6px;">
                        <div style="height: 100%; width: ${countdown.progressPercent}%; background: var(--accent-green); transition: width 0.3s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: rgba(255,255,255,0.8);">
                        <span>Pagamento ${countdown.paymentsMade + 1}/${countdown.totalPayments}</span>
                        <span>Próximo: ${countdown.daysToNextPayment} dias</span>
                    </div>
                    <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); margin-top: 4px;">
                        ${countdown.nextPaymentFormatted} → ${countdown.maturityFormatted}
                    </div>
                `;
                
                // Inserir antes do botão de venda
                const sellButton = item.querySelector('.btn-sell-small');
                if (sellButton) {
                    sellButton.insertAdjacentElement('beforebegin', countdownDiv);
                }
            });
        }

        // 4. Integrar com atualização do portfolio
        const originalUpdatePortfolioUI = updatePortfolioUI;
        updatePortfolioUI = function() {
            // Atualizar contagens
            updateBondCountdowns();
            
            // Chamar função original
            originalUpdatePortfolioUI();
            
            // Atualizar UI
            setTimeout(updateBondCountdownUI, 100);
        };

        // 5. Executar periodicamente
        setInterval(() => {
            updateBondCountdowns();
        }, 10000); // Atualizar a cada 03 segundos


        // ========================================
        // FUNÇÃO AUXILIAR: Limpar títulos vencidos automaticamente
        // ========================================

        function cleanupMaturedBonds() {
            const positionsToRemove = [];
            
            // Identificar títulos vencidos para remoção
            AppState.portfolio.positions.forEach((position, index) => {
                if (position.type.includes('titulo') && position.bondInfo && position.bondInfo.matured) {
                    positionsToRemove.push({
                        index: index,
                        position: position,
                        ticker: position.ticker
                    });
                }
            });
            
            // Remover em ordem reversa para manter índices válidos
            positionsToRemove.reverse().forEach(item => {
                if (item.index < AppState.portfolio.positions.length) {
                    AppState.portfolio.positions.splice(item.index, 1);
                    console.log(`🧹 Título vencido removido: ${item.ticker}`);
                }
            });
            
            if (positionsToRemove.length > 0) {
                updatePortfolioMetrics();
                updatePortfolioUI();
                console.log(`✅ ${positionsToRemove.length} título(s) vencido(s) removido(s)`);
            }
            
            return positionsToRemove.length;
        }

        // Executar limpeza periodicamente
        setInterval(cleanupMaturedBonds, 10000); // A cada 10 segundos

        // ========================================
        // SISTEMA DE VALIDAÇÃO DE INTEGRIDADE
        // ========================================

        function validateBondIntegrity() {
            console.log('🔍 Validando integridade dos títulos...');
            
            let issues = 0;
            
            AppState.portfolio.positions.forEach((position, index) => {
                if (position.type.includes('titulo')) {
                    const asset = AppState.market.assets[position.assetId];
                    
                    // Validação 1: Asset existe
                    if (!asset) {
                        console.error(`❌ Título ${position.ticker} não encontrado no market`);
                        issues++;
                        return;
                    }
                    
                    // Validação 2: bondInfo existe
                    if (!position.bondInfo) {
                        console.warn(`⚠️ Título ${position.ticker} sem bondInfo. Inicializando...`);
                        initializeBondInfoForPosition(position, asset);
                        issues++;
                    }
                    
                    // Validação 3: Se está vencido, deve ser removido
                    if (position.bondInfo && position.bondInfo.matured) {
                        console.log(`🗑️ Título ${position.ticker} marcado como vencido - agendando remoção`);
                        position.readyForRemoval = true;
                        issues++;
                    }
                    
                    // Validação 4: Cálculo do principal
                    if (position.bondInfo && position.bondInfo.principalAmount <= 0) {
                        console.warn(`⚠️ Principal inválido para ${position.ticker}: ${position.bondInfo.principalAmount}`);
                        position.bondInfo.principalAmount = position.avgPrice * position.quantity;
                        issues++;
                    }
                }
            });
            
            if (issues > 0) {
                console.log(`🔧 ${issues} problema(s) detectado(s) e corrigido(s)`);
                saveToLocalStorage();
            }
            
            return issues;
        }

        // Executar validação periodicamente
        setInterval(validateBondIntegrity, 30000); // A cada 30 segundos

        // Executar na inicialização
        setTimeout(validateBondIntegrity, 5000);

       
        // Novos elementos de interface
    
    // ============================================
    // MÓDULO 3: SISTEMA DE MOEDAS (FOREX)
    // ============================================
    
    (function() {
        'use strict';
        
        const CurrencySystem = {
            currencies: [
                { 
                    code: 'USD', 
                    name: 'Dólar Americano', 
                    symbol: 'US$', 
                    flag: '🇺🇸',
                    initialRate: 830, 
                    volatility: 0.008,
                    currentRate: 830,
                    history: [830],
                    spread: 0.005 // 0.5% spread
                },
                { 
                    code: 'EUR', 
                    name: 'Euro', 
                    symbol: '€', 
                    flag: '🇪🇺',
                    initialRate: 890, 
                    volatility: 0.007,
                    currentRate: 890,
                    history: [890],
                    spread: 0.005
                },
                { 
                    code: 'CNY', 
                    name: 'Yuan Chinês', 
                    symbol: '¥', 
                    flag: '🇨🇳',
                    initialRate: 115, 
                    volatility: 0.006,
                    currentRate: 115,
                    history: [115],
                    spread: 0.008
                },
                { 
                    code: 'JPY', 
                    name: 'Iene Japonês', 
                    symbol: '¥', 
                    flag: '🇯🇵',
                    initialRate: 5.6, 
                    volatility: 0.009,
                    currentRate: 5.6,
                    history: [5.6],
                    spread: 0.01
                },
                { 
                    code: 'GBP', 
                    name: 'Libra Esterlina', 
                    symbol: '£', 
                    flag: '🇬🇧',
                    initialRate: 1050, 
                    volatility: 0.008,
                    currentRate: 1050,
                    history: [1050],
                    spread: 0.005
                },
                { 
                    code: 'ZAR', 
                    name: 'Rand Sul-Africano', 
                    symbol: 'R', 
                    flag: '🇿🇦',
                    initialRate: 44, 
                    volatility: 0.012,
                    currentRate: 44,
                    history: [44],
                    spread: 0.015
                }
            ],
            
            scenarioFactors: {
                'angola-especial': { multiplier: 0.95, oilEffect: 1.1 },
                'crescimento': { multiplier: 0.98, oilEffect: 1.05 },
                'estavel': { multiplier: 1.0, oilEffect: 1.0 },
                'crise': { multiplier: 1.15, oilEffect: 0.85 }
            },
            
            state: {
                oilPrice: 80, // Preço do petróleo em USD
                lastUpdate: Date.now()
            },
            
            init() {
                this.addToDatabase();
                this.injectTab();
                this.startSimulation();
                console.log('✅ Sistema de Moedas inicializado');
            },
            
            addToDatabase() {
                // Adicionar moedas como ativos negociáveis
                this.currencies.forEach(curr => {
                    const assetId = `CURRENCY_${curr.code}`;
                    AppState.market.assets[assetId] = {
                        id: assetId,
                        name: curr.name,
                        ticker: curr.code,
                        type: 'moeda',
                        currency: 'KZ',
                        initialPrice: curr.initialRate,
                        currentPrice: curr.initialRate,
                        previousPrice: curr.initialRate,
                        volatility: curr.volatility,
                        icon: curr.flag,
                        priceHistory: [curr.initialRate],
                        spread: curr.spread,
                        forexData: curr
                    };
                });
            },
            
            injectTab() {
                // Adicionar tab de Moedas
                const tabsContainer = document.querySelector('.asset-tabs');
                if (!tabsContainer) {
                    setTimeout(() => this.injectTab(), 1000);
                    return;
                }
                
                const tabHTML = `<button class="tab" data-category="moedas">💱 Moedas</button>`;
                tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
                
                // Adicionar handler
                const newTab = tabsContainer.querySelector('[data-category="moedas"]');
                if (newTab) {
                    newTab.addEventListener('click', () => {
                        document.querySelectorAll('.asset-tabs .tab').forEach(t => t.classList.remove('active'));
                        newTab.classList.add('active');
                        this.renderCurrencies();
                    });
                }
                
                // Hook em renderAssetsUI
                const originalRender = window.renderAssetsUI;
                window.renderAssetsUI = (category) => {
                    if (category === 'moedas') {
                        this.renderCurrencies();
                    } else {
                        originalRender(category);
                    }
                };
            },
            
            renderCurrencies() {
                const container = document.getElementById('assets-list');
                if (!container) return;
                
                container.innerHTML = '';
                
                this.currencies.forEach(curr => {
                    const asset = AppState.market.assets[`CURRENCY_${curr.code}`];
                    const change = curr.currentRate - curr.initialRate;
                    const changePct = (change / curr.initialRate) * 100;
                    const changeClass = change >= 0 ? 'positive' : 'negative';
                    
                    const buyRate = curr.currentRate * (1 + curr.spread);
                    const sellRate = curr.currentRate * (1 - curr.spread);
                    
                    const card = document.createElement('div');
                    card.className = `ext-currency-card ${curr.code}`;
                    card.innerHTML = `
                        <div class="ext-currency-header">
                            <div class="ext-currency-info">
                                <h4>${curr.code}</h4>
                                <span>${curr.name}</span>
                            </div>
                            <div class="ext-currency-flag">${curr.flag}</div>
                        </div>
                        
                        <div class="ext-currency-rate">
                            ${curr.currentRate.toFixed(2)} Kz
                        </div>
                        
                        <div class="ext-currency-change ${changeClass}">
                            ${change >= 0 ? '📈' : '📉'} ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%
                        </div>
                        
                        <div class="ext-currency-spread">
                            <div>
                                <span class="label">Compra:</span>
                                <span class="buy">${buyRate.toFixed(2)} Kz</span>
                            </div>
                            <div>
                                <span class="label">Venda:</span>
                                <span class="sell">${sellRate.toFixed(2)} Kz</span>
                            </div>
                            <div>
                                <span class="label">Spread:</span>
                                <span>${(curr.spread * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        
                        <div class="asset-actions" style="margin-top: 15px;">
                            <button class="btn-buy" onclick="CurrencySystem.trade('${curr.code}', 'buy')">
                                🛒 Comprar ${curr.code}
                            </button>
                            <button class="btn-sell" onclick="CurrencySystem.trade('${curr.code}', 'sell')">
                                💰 Vender ${curr.code}
                            </button>
                        </div>
                    `;
                    
                    container.appendChild(card);
                });
            },
            
            trade(code, type) {
                const curr = this.currencies.find(c => c.code === code);
                if (!curr) return;
                
                const rate = type === 'buy' 
                    ? curr.currentRate * (1 + curr.spread)
                    : curr.currentRate * (1 - curr.spread);
                
                // Abrir modal de trade customizado
                this.openTradeModal(code, type, rate);
            },
            
            openTradeModal(code, type, rate) {
                const curr = this.currencies.find(c => c.code === code);
                
                // Reutilizar modal existente
                const modal = document.getElementById('trade-modal');
                if (!modal) return;
                
                document.getElementById('modal-title').textContent = 
                    type === 'buy' ? `🛒 Comprar ${code}` : `💰 Vender ${code}`;
                document.getElementById('modal-asset-name').textContent = curr.name;
                document.getElementById('modal-price').textContent = `${rate.toFixed(2)} Kz`;
                
                // Configurar quantidade
                const qtyInput = document.getElementById('trade-quantity');
                qtyInput.min = 1;
                qtyInput.step = 1;
                qtyInput.placeholder = `Quantidade em ${code}`;
                qtyInput.value = '';
                
                // Calcular total
                qtyInput.oninput = () => {
                    const qty = parseFloat(qtyInput.value) || 0;
                    const total = qty * rate;
                    document.getElementById('trade-total').textContent = formatCurrency(total);
                    
                    const warning = document.getElementById('insufficient-funds');
                    if (type === 'buy' && total > AppState.user.availableBalance) {
                        warning.style.display = 'block';
                        document.getElementById('confirm-trade').disabled = true;
                    } else {
                        warning.style.display = 'none';
                        document.getElementById('confirm-trade').disabled = false;
                    }
                };
                
                modal.style.display = 'block';
                modal.dataset.assetId = `CURRENCY_${code}`;
                modal.dataset.type = type;
                modal.dataset.isForex = 'true';
                modal.dataset.rate = rate;
            },
            
            startSimulation() {
                // Atualizar taxas a cada 30 segundos
                setInterval(() => this.updateRates(), 30000);
            },
            
            updateRates() {
                const scenario = AppState.user.scenario || 'estavel';
                const factor = this.scenarioFactors[scenario] || this.scenarioFactors.estavel;
                
                // Simular preço do petróleo
                this.state.oilPrice += (Math.random() - 0.5) * 5;
                this.state.oilPrice = Math.max(60, Math.min(100, this.state.oilPrice));
                
                const oilEffect = this.state.oilPrice > 85 ? 1.02 : (this.state.oilPrice < 75 ? 0.98 : 1.0);
                
                this.currencies.forEach(curr => {
                    // Calcular variação
                    const change = (Math.random() - 0.5) * curr.volatility * factor.multiplier * oilEffect;
                    curr.currentRate *= (1 + change);
                    
                    // Manter histórico
                    curr.history.push(curr.currentRate);
                    if (curr.history.length > 100) curr.history.shift();
                    
                    // Atualizar no AppState
                    const asset = AppState.market.assets[`CURRENCY_${curr.code}`];
                    if (asset) {
                        asset.previousPrice = asset.currentPrice;
                        asset.currentPrice = curr.currentRate;
                        asset.priceHistory.push(curr.currentRate);
                        if (asset.priceHistory.length > 100) asset.priceHistory.shift();
                    }
                });
                
                // Atualizar display se visível
                const activeTab = document.querySelector('.asset-tabs .tab.active');
                if (activeTab && activeTab.dataset.category === 'moedas') {
                    this.renderCurrencies();
                }
            },
            
            convertToKz(amount, currencyCode) {
                const curr = this.currencies.find(c => c.code === currencyCode);
                if (!curr) return amount;
                return amount * curr.currentRate;
            },
            
            convertFromKz(amount, currencyCode) {
                const curr = this.currencies.find(c => c.code === currencyCode);
                if (!curr) return amount;
                return amount / curr.currentRate;
            },
            
            getRate(currencyCode) {
                const curr = this.currencies.find(c => c.code === currencyCode);
                return curr ? curr.currentRate : 1;
            }
        };
        
        window.CurrencySystem = CurrencySystem;
        
        // Hook no buyAsset/sellAsset para moedas
        const originalBuy = window.buyAsset;
        window.buyAsset = function(assetId, quantity) {
            if (assetId.startsWith('CURRENCY_')) {
                return CurrencySystem.executeBuy(assetId, quantity);
            }
            return originalBuy(assetId, quantity);
        };
        
        setTimeout(() => CurrencySystem.init(), 2000);
    })();
    
    // ============================================
    // MÓDULO 4: BOLSA DE VALORES DOS EUA
    // ============================================
    
    (function() {
        'use strict';
        
        const USStockMarket = {
            stocks: [
                {
                    id: 'US_AAPL',
                    name: 'Apple Inc.',
                    ticker: 'AAPL',
                    sector: 'Tecnologia',
                    initialPriceUSD: 185.50,
                    volatility: 0.018,
                    icon: '📱',
                    description: 'Líder em tecnologia consumer'
                },
                {
                    id: 'US_MSFT',
                    name: 'Microsoft Corporation',
                    ticker: 'MSFT',
                    sector: 'Tecnologia',
                    initialPriceUSD: 420.75,
                    volatility: 0.016,
                    icon: '💻',
                    description: 'Cloud computing e software'
                },
                {
                    id: 'US_GOOGL',
                    name: 'Alphabet Inc.',
                    ticker: 'GOOGL',
                    sector: 'Tecnologia',
                    initialPriceUSD: 175.20,
                    volatility: 0.019,
                    icon: '🔍',
                    description: 'Google e publicidade digital'
                },
                {
                    id: 'US_AMZN',
                    name: 'Amazon.com Inc.',
                    ticker: 'AMZN',
                    sector: 'Varejo/Tecnologia',
                    initialPriceUSD: 195.40,
                    volatility: 0.022,
                    icon: '📦',
                    description: 'E-commerce e cloud AWS'
                },
                {
                    id: 'US_TSLA',
                    name: 'Tesla Inc.',
                    ticker: 'TSLA',
                    sector: 'Automotivo/Energia',
                    initialPriceUSD: 245.80,
                    volatility: 0.035,
                    icon: '🚗',
                    description: 'Veículos elétricos e energia'
                },
                {
                    id: 'US_JPM',
                    name: 'JPMorgan Chase & Co.',
                    ticker: 'JPM',
                    sector: 'Financeiro',
                    initialPriceUSD: 235.60,
                    volatility: 0.015,
                    icon: '🏦',
                    description: 'Maior banco dos EUA'
                },
                {
                    id: 'US_JNJ',
                    name: 'Johnson & Johnson',
                    ticker: 'JNJ',
                    sector: 'Saúde',
                    initialPriceUSD: 155.30,
                    volatility: 0.012,
                    icon: '💊',
                    description: 'Farmacêutica e dispositivos médicos'
                },
                {
                    id: 'US_WMT',
                    name: 'Walmart Inc.',
                    ticker: 'WMT',
                    sector: 'Varejo',
                    initialPriceUSD: 95.40,
                    volatility: 0.014,
                    icon: '🛒',
                    description: 'Maior varejista do mundo'
                },
                {
                    id: 'US_V',
                    name: 'Visa Inc.',
                    ticker: 'V',
                    sector: 'Financeiro/Pagamentos',
                    initialPriceUSD: 285.90,
                    volatility: 0.016,
                    icon: '💳',
                    description: 'Processamento de pagamentos'
                },
                {
                    id: 'US_PG',
                    name: 'Procter & Gamble',
                    ticker: 'PG',
                    sector: 'Bens de Consumo',
                    initialPriceUSD: 165.70,
                    volatility: 0.011,
                    icon: '🧴',
                    description: 'Produtos de consumo diário'
                }
            ],
            
            init() {
                this.addToDatabase();
                this.injectTab();
                this.startSimulation();
                console.log('✅ Bolsa de Valores EUA inicializada');
            },
            
            addToDatabase() {
                const usdToKz = window.CurrencySystem ? 
                    CurrencySystem.getRate('USD') : 830;
                
                this.stocks.forEach(stock => {
                    const priceKz = stock.initialPriceUSD * usdToKz;
                    
                    AppState.market.assets[stock.id] = {
                        ...stock,
                        type: 'acao-us',
                        country: 'US',
                        exchange: 'NASDAQ/NYSE',
                        currency: 'USD',
                        initialPrice: priceKz,
                        currentPrice: priceKz,
                        previousPrice: priceKz,
                        priceHistory: [priceKz],
                        usdPrice: stock.initialPriceUSD,
                        volatility: stock.volatility
                    };
                });
                
                // Adicionar à base de dados para renderização
                if (!window.ASSETS_DATABASE) window.ASSETS_DATABASE = {};
                window.ASSETS_DATABASE.acoesUs = this.stocks.map(s => ({
                    ...s,
                    type: 'acao-us',
                    country: 'US',
                    initialPrice: s.initialPriceUSD * 830
                }));
            },
            
            injectTab() {
                const tabsContainer = document.querySelector('.asset-tabs');
                if (!tabsContainer) {
                    setTimeout(() => this.injectTab(), 1000);
                    return;
                }
                
                const tabHTML = `<button class="tab" data-category="acoesUs">🇺🇸 Ações EUA</button>`;
                tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
                
                const newTab = tabsContainer.querySelector('[data-category="acoesUs"]');
                if (newTab) {
                    newTab.addEventListener('click', () => {
                        document.querySelectorAll('.asset-tabs .tab').forEach(t => t.classList.remove('active'));
                        newTab.classList.add('active');
                        this.renderStocks();
                    });
                }
                
                // Hook em renderAssetsUI
                const originalRender = window.renderAssetsUI;
                window.renderAssetsUI = (category) => {
                    if (category === 'acoesUs') {
                        this.renderStocks();
                    } else {
                        originalRender(category);
                    }
                };
            },
            
            renderStocks() {
                const container = document.getElementById('assets-list');
                if (!container) return;
                
                container.innerHTML = '';
                
                const usdToKz = window.CurrencySystem ? 
                    CurrencySystem.getRate('USD') : 830;
                
                this.stocks.forEach(stock => {
                    const asset = AppState.market.assets[stock.id];
                    const priceChange = asset.currentPrice - asset.previousPrice;
                    const priceChangePct = (priceChange / asset.previousPrice) * 100;
                    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
                    
                    // Calcular preço em USD atual
                    const currentUSD = asset.currentPrice / usdToKz;
                    
                    const card = document.createElement('div');
                    card.className = 'ext-us-stock-card';
                    card.innerHTML = `
                        <div class="ext-us-stock-header">
                            <div class="ext-us-stock-icon">${stock.icon}</div>
                            <div class="ext-us-stock-info">
                                <h4>${stock.name}</h4>
                                <span class="ticker">${stock.ticker}</span>
                                <span style="font-size: 0.8rem; color: rgba(255,255,255,0.6); display: block; margin-top: 4px;">
                                    ${stock.sector}
                                </span>
                            </div>
                        </div>
                        
                        <div class="ext-us-stock-prices">
                            <div class="ext-us-stock-price-box">
                                <span class="label">Preço USD</span>
                                <span class="value">$${currentUSD.toFixed(2)}</span>
                            </div>
                            <div class="ext-us-stock-price-box">
                                <span class="label">Preço Kz</span>
                                <span class="converted">${formatCurrency(asset.currentPrice)}</span>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 15px;">
                            <span class="price-change ${changeClass}" style="font-size: 1.1rem; padding: 6px 16px; border-radius: 20px; background: ${priceChange >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'};">
                                ${priceChange >= 0 ? '📈' : '📉'} ${priceChangePct >= 0 ? '+' : ''}${priceChangePct.toFixed(2)}%
                            </span>
                        </div>
                        
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-bottom: 15px; text-align: center;">
                            ${stock.description}
                        </div>
                        
                        <div class="asset-actions">
                            <button class="btn-buy" onclick="openTradeModal('${stock.id}', 'buy')">
                                🛒 Comprar
                            </button>
                            <button class="btn-sell" onclick="openTradeModal('${stock.id}', 'sell')">
                                💰 Vender
                            </button>
                        </div>
                    `;
                    
                    container.appendChild(card);
                });
            },
            
            startSimulation() {
                // Atualizar preços a cada intervalo do mercado
                setInterval(() => this.updatePrices(), 60000);
            },
            
            updatePrices() {
                const usdToKz = window.CurrencySystem ? 
                    CurrencySystem.getRate('USD') : 830;
                
                // Influência do cenário global (diferente de Angola)
                const globalSentiment = Math.random(); // 0-1 sentimento de mercado
                
                this.stocks.forEach(stock => {
                    const asset = AppState.market.assets[stock.id];
                    
                    // Volatilidade do mercado americano (mais estável que Angola)
                    let drift = (Math.random() - 0.5) * 0.01; // ±0.5% tendência
                    
                    // Efeito de sentimento global
                    if (globalSentiment > 0.7) drift += 0.005; // Bull market
                    else if (globalSentiment < 0.3) drift -= 0.005; // Bear market
                    
                    // Setores específicos
                    if (stock.sector === 'Tecnologia' && globalSentiment > 0.6) {
                        drift += 0.008; // Tech rally
                    }
                    
                    const change = drift + (Math.random() - 0.5) * stock.volatility;
                    asset.previousPrice = asset.currentPrice;
                    asset.currentPrice *= (1 + change);
                    
                    // Atualizar preço USD
                    asset.usdPrice = asset.currentPrice / usdToKz;
                    
                    // Histórico
                    asset.priceHistory.push(asset.currentPrice);
                    if (asset.priceHistory.length > 100) asset.priceHistory.shift();
                });
                
                // Atualizar display se visível
                const activeTab = document.querySelector('.asset-tabs .tab.active');
                if (activeTab && activeTab.dataset.category === 'acoesUs') {
                    this.renderStocks();
                }
            },
            
            convertToKz(usdAmount) {
                const rate = window.CurrencySystem ? 
                    CurrencySystem.getRate('USD') : 830;
                return usdAmount * rate;
            }
        };
        
        window.USStockMarket = USStockMarket;
        
        // Modificar buyAsset/sellAsset para converter USD→Kz
        const originalBuyAsset = window.buyAsset;
        window.buyAsset = function(assetId, quantity) {
            const asset = AppState.market.assets[assetId];
            if (asset && asset.type === 'acao-us') {
                // Converter preço USD para Kz no momento da compra
                const usdToKz = window.CurrencySystem ? 
                    CurrencySystem.getRate('USD') : 830;
                const priceKz = asset.usdPrice * usdToKz;
                asset.currentPrice = priceKz;
            }
            return originalBuyAsset(assetId, quantity);
        };
        
        setTimeout(() => USStockMarket.init(), 2500);
    })();
    
    // ============================================
    // MÓDULO 5: REMOVER LIMITES DE PREÇO
    // ============================================
    
    (function() {
        'use strict';
        
        const UnlimitedPrices = {
            init() {
                this.overrideCalculateNextPrice();
                this.addBankruptcyRisk();
                console.log('✅ Sistema de Preços Ilimitados ativado');
            },
            
            overrideCalculateNextPrice() {
                // Guardar referência original se existir
                const originalCalc = window.calculateNextPrice;
                
                window.calculateNextPrice = function(asset, scenario) {
                    const current = asset.currentPrice || asset.initialPrice;
                    let vol = asset.volatility;
                    let drift = 0;
                    
                    // AUMENTAR VOLATILIDADE BASEADO NO CENÁRIO
                    switch(scenario) {
                        case 'crise':
                            vol *= 3.0;
                            drift = -0.025;
                            // Chance de queda catastrófica (flash crash)
                            if (Math.random() < 0.05) {
                                vol *= 5;
                                console.log(`⚠️ Flash crash detectado em ${asset.ticker}!`);
                            }
                            break;
                            
                        case 'crescimento':
                            vol *= 1.5;
                            drift = 0.03;
                            // Bubble burst chance
                            if (current > asset.initialPrice * 5 && Math.random() < 0.1) {
                                drift = -0.15; // Correção de 15%
                                console.log(`💥 Correção de bolha em ${asset.ticker}!`);
                            }
                            break;
                            
                        case 'angola-especial':
                            if (asset.country === 'AO' && asset.type === 'acao') {
                                drift = 0.04;
                                vol *= 0.7;
                                
                                // Profit taking em ganhos extremos
                                const totalGain = (current - asset.initialPrice) / asset.initialPrice;
                                if (totalGain > 3.0 && Math.random() < 0.3) {
                                    drift = -0.12; // Correção de 12%
                                }
                            }
                            break;
                    }
                    
                    // Calcular mudança percentual
                    const changePct = drift + ((Math.random() - 0.5) * vol * 2);
                    let newPrice = current * (1 + changePct);
                    
                    // PERMITIR ZERO (FALÊNCIA) - chance baseada em volatilidade e cenário
                    if (newPrice < 0.01) {
                        const bankruptcyChance = scenario === 'crise' ? 0.3 : 0.05;
                        if (Math.random() < bankruptcyChance) {
                            newPrice = 0;
                            console.log(`🏴 ${asset.ticker} entrou em falência!`);
                            // Notificar usuário se tiver posição
                            const position = AppState.portfolio.positions.find(p => p.assetId === asset.id);
                            if (position) {
                                showNotification(`🏴 ${asset.name} FALIU! Sua posição foi liquidada com perda total.`, 'error');
                                // Liquidar posição
                                AppState.portfolio.positions = AppState.portfolio.positions.filter(p => p.assetId !== asset.id);
                                updatePortfolioUI();
                            }
                        } else {
                            newPrice = 0.01; // Penúltimo centavo
                        }
                    }
                    
                    // SEM LIMITE SUPERIOR - permitir crescimento exponencial
                    // Mas adicionar correções saudáveis ocasionais
                    const gainFromInitial = (newPrice - asset.initialPrice) / asset.initialPrice;
                    if (gainFromInitial > 10 && Math.random() < 0.2) { // +1000% com 20% chance de correção
                        newPrice *= 0.9; // Correção de 10%
                        console.log(`📉 Correção saudável em ${asset.ticker} após grande alta`);
                    }
                    
                    // Formatar conforme tipo
                    if (asset.type === 'cripto') {
                        const decimals = asset.decimals || 8;
                        return parseFloat(newPrice.toFixed(decimals));
                    }
                    
                    return parseFloat(newPrice.toFixed(2));
                };
            },
            
            addBankruptcyRisk() {
                // Adicionar risco de falência para empresas em queda prolongada
                setInterval(() => {
                    Object.values(AppState.market.assets).forEach(asset => {
                        if (asset.type !== 'acao') return;
                        
                        const history = asset.priceHistory || [];
                        if (history.length < 20) return;
                        
                        // Verificar tendência de queda prolongada
                        const recentPrices = history.slice(-20);
                        const firstPrice = recentPrices[0];
                        const lastPrice = recentPrices[recentPrices.length - 1];
                        
                        if (lastPrice < firstPrice * 0.3) { // Perdeu 70% em 20 períodos
                            const bankruptcyRisk = 0.1; // 10% chance
                            if (Math.random() < bankruptcyRisk) {
                                asset.currentPrice = 0;
                                console.log(`🏴 Falência administrativa: ${asset.ticker}`);
                                
                                // Liquidar posições
                                const positions = AppState.portfolio.positions.filter(p => p.assetId === asset.id);
                                if (positions.length > 0) {
                                    showNotification(`🏴 ${asset.name} entrou em recuperação judicial. Ativo suspens.`, 'error');
                                    AppState.portfolio.positions = AppState.portfolio.positions.filter(p => p.assetId !== asset.id);
                                    updatePortfolioUI();
                                }
                            }
                        }
                    });
                }, 60000); // Verificar a cada minuto
            }
        };
        
        window.UnlimitedPrices = UnlimitedPrices;
        
        setTimeout(() => UnlimitedPrices.init(), 1000);
    })();
    
    // ============================================
    // MÓDULO 6: CORREÇÃO DO SISTEMA DE DIVIDENDOS
    // ============================================
    
    (function() {
        'use strict';
        
        const DividendFix = {
            init() {
                this.injectDividendPanel();
                this.fixDividendProcessing();
                this.ensureDividendTableExists();
                console.log('✅ Sistema de Dividendos corrigido');
            },
            
            injectDividendPanel() {
                // Verificar se já existe
                if (document.querySelector('.ext-dividends-panel-permanent')) return;
                
                const transactionHistory = document.querySelector('.transaction-history');
                if (!transactionHistory) {
                    setTimeout(() => this.injectDividendPanel(), 1000);
                    return;
                }
                
                const panelHTML = `
                    <section class="ext-dividends-panel-permanent">
                        <h3>💰 Histórico de Dividendos Recebidos</h3>
                        <div class="history-table-container">
                            <table id="ext-dividends-table-permanent">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Ativo</th>
                                        <th>Valor/Ação</th>
                                        <th>Yield</th>
                                        <th>Qtd</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="ext-dividends-body-permanent">
                                    <tr>
                                        <td colspan="7" class="empty-state">
                                            <div style="padding: 30px; text-align: center;">
                                                <div style="font-size: 3rem; margin-bottom: 10px;">💰</div>
                                                <p>Nenhum dividendo recebido ainda</p>
                                                <p style="font-size: 0.85rem; opacity: 0.7;">
                                                    Compre ações e aguarde Junho ou Dezembro
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                `;
                
                transactionHistory.insertAdjacentHTML('afterend', panelHTML);
            },
            
            fixDividendProcessing() {
                // Sobrescrever processDividends para garantir atualização da tabela
                const originalProcess = window.processDividends;
                
                window.processDividends = function() {
                    console.log('🔄 Processando dividendos...');
                    
                    const currentDate = AppState.market.simulatedTime;
                    const isDividendMonth = currentDate.currentMonth === 6 || currentDate.currentMonth === 12;
                    
                    if (!isDividendMonth) {
                        console.log('⏭️ Não é mês de dividendos');
                        return { totalDividendsPaid: 0, companiesPaid: 0 };
                    }
                    
                    let totalDividendsPaid = 0;
                    let companiesPaid = 0;
                    const dividendsPaid = [];
                    
                    AppState.portfolio.positions.forEach(position => {
                        if (position.type !== 'acao') return;
                        
                        const asset = AppState.market.assets[position.assetId];
                        if (!asset || !asset.dividendInfo) return;
                        
                        if (!asset.dividendInfo.enabled || !asset.dividendInfo.isPayingThisYear) return;
                        
                        // Verificar se já pagou este ano/mês
                        const lastPayment = asset.dividendInfo.lastPayment;
                        if (lastPayment && lastPayment.year === currentDate.currentYear && 
                            lastPayment.month === currentDate.currentMonth) {
                            return;
                        }
                        
                        // Calcular dividendo
                        const dividendPerShare = asset.currentPrice * asset.dividendInfo.yield;
                        const totalDividend = dividendPerShare * position.quantity;
                        
                        // Creditar
                        AppState.user.availableBalance += totalDividend;
                        totalDividendsPaid += totalDividend;
                        companiesPaid++;
                        
                        // Registrar
                        const record = {
                            id: `div_${Date.now()}_${asset.id}`,
                            date: `${currentDate.currentDay.toString().padStart(2,'0')}/${currentDate.currentMonth.toString().padStart(2,'0')}/${currentDate.currentYear}`,
                            assetName: asset.name,
                            ticker: asset.ticker,
                            perShare: dividendPerShare,
                            dividendYield: asset.dividendInfo.yield * 100,
                            quantity: position.quantity,
                            total: totalDividend,
                            status: 'Pago',
                            timestamp: Date.now()
                        };
                        
                        dividendsPaid.push(record);
                        
                        // Atualizar asset
                        asset.dividendInfo.lastPayment = {
                            year: currentDate.currentYear,
                            month: currentDate.currentMonth
                        };
                        
                        if (!asset.dividendInfo.history) asset.dividendInfo.history = [];
                        asset.dividendInfo.history.push(record);
                        
                        // Notificação
                        showNotification(
                            `💰 Dividendo de ${asset.ticker}: ${formatCurrency(totalDividend)}`,
                            'success'
                        );
                    });
                    
                    // Adicionar ao histórico global
                    if (!AppState.portfolio.dividendHistory) AppState.portfolio.dividendHistory = [];
                    AppState.portfolio.dividendHistory.push(...dividendsPaid);
                    
                    // ⭐ CRÍTICO: Atualizar tabela
                    if (dividendsPaid.length > 0) {
                        DividendFix.updateDividendTable();
                        updatePortfolioUI();
                        saveToLocalStorage();
                    }
                    
                    return { totalDividendsPaid, companiesPaid, dividendsPaid };
                };
            },
            
            updateDividendTable() {
                const tbody = document.getElementById('ext-dividends-body-permanent');
                if (!tbody) {
                    console.error('Tabela de dividendos não encontrada');
                    return;
                }
                
                const history = AppState.portfolio.dividendHistory || [];
                
                if (history.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" class="empty-state">
                                <div style="padding: 30px; text-align: center;">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">💰</div>
                                    <p>Nenhum dividendo recebido ainda</p>
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Ordenar por data (mais recente primeiro)
                const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
                
                tbody.innerHTML = sorted.map((record, index) => `
                    <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                        <td>${record.date}</td>
                        <td>
                            <strong>${record.ticker}</strong>
                            <br>
                            <small style="opacity: 0.7;">${record.assetName}</small>
                        </td>
                        <td>${formatCurrency(record.perShare)}</td>
                        <td class="positive">${record.dividendYield.toFixed(2)}%</td>
                        <td>${record.quantity.toLocaleString('pt-AO')}</td>
                        <td class="positive"><strong>${formatCurrency(record.total)}</strong></td>
                        <td><span class="badge buy">${record.status}</span></td>
                    </tr>
                `).join('');
            },
            
            ensureDividendTableExists() {
                // Garantir que a tabela seja renderizada inicialmente
                setTimeout(() => {
                    this.updateDividendTable();
                }, 3000);
                
                // Atualizar periodicamente
                setInterval(() => {
                    this.updateDividendTable();
                }, 30000);
            }
        };
        
        window.DividendFix = DividendFix;
        
        setTimeout(() => DividendFix.init(), 2000);
    })();
    
    // ============================================
    // MÓDULO 7: INDICADORES AVANÇADOS
    // ============================================
    
    (function() {
        'use strict';
        
        const AdvancedIndicators = {
            init() {
                this.calculateAllIndicators();
                this.injectIndicatorsPanel();
                this.startPeriodicUpdate();
                console.log('✅ Indicadores Avançados inicializados');
            },
            
            calculateAllIndicators() {
                const positions = AppState.portfolio.positions;
                const transactions = AppState.portfolio.transactions;
                
                // 1. Beta do Portfólio (volatilidade vs mercado)
                const portfolioBeta = this.calculateBeta(positions);
                
                // 2. Sharpe Ratio (retorno ajustado ao risco)
                const sharpeRatio = this.calculateSharpeRatio(positions, transactions);
                
                // 3. Drawdown Máximo
                const maxDrawdown = this.calculateMaxDrawdown();
                
                // 4. Correlação entre ativos
                const correlations = this.calculateCorrelations(positions);
                
                // 5. Índice de Diversificação (0-100%)
                const diversificationIndex = this.calculateDiversificationIndex(positions);
                
                // 6. Rentabilidade Anualizada
                const annualizedReturn = this.calculateAnnualizedReturn(transactions);
                
                // 7. Previsão de Impostos (IAC)
                const taxForecast = this.calculateTaxForecast(positions);
                
                // 8. Alocação Ótima (sugestão)
                const optimalAllocation = this.calculateOptimalAllocation(positions);
                
                // Armazenar
                AppState.portfolio.advancedIndicators = {
                    beta: portfolioBeta,
                    sharpeRatio,
                    maxDrawdown,
                    correlations,
                    diversificationIndex,
                    annualizedReturn,
                    taxForecast,
                    optimalAllocation,
                    lastUpdate: Date.now()
                };
            },
            
            calculateBeta(positions) {
                // Beta simplificado: volatilidade do portfólio / volatilidade do mercado
                if (positions.length === 0) return 1.0;
                
                const portfolioVolatility = positions.reduce((sum, p) => {
                    const asset = AppState.market.assets[p.assetId];
                    return sum + (asset?.volatility || 0.01) * (p.currentPrice * p.quantity);
                }, 0) / (AppState.portfolio.currentValue || 1);
                
                // Mercado = volatilidade média de 15%
                const marketVolatility = 0.15;
                
                return Math.min(3, Math.max(0.5, portfolioVolatility / marketVolatility));
            },
            
            calculateSharpeRatio(positions, transactions) {
                // Sharpe = (Retorno - Taxa Livre de Risco) / Desvio Padrão do Retorno
                const riskFreeRate = 0.10; // 10% ao ano (título público)
                
                const sellTransactions = transactions.filter(t => t.type === 'sell' && t.pnl !== undefined);
                if (sellTransactions.length === 0) return 0;
                
                const returns = sellTransactions.map(t => t.pnl / (t.total - t.pnl || 1));
                const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
                const stdDev = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length) || 0.01;
                
                return ((avgReturn - riskFreeRate) / stdDev).toFixed(2);
            },
            
            calculateMaxDrawdown() {
                const history = AppState.portfolio.valueHistory || [];
                if (history.length < 2) return 0;
                
                let maxDrawdown = 0;
                let peak = history[0];
                
                history.forEach(value => {
                    if (value > peak) peak = value;
                    const drawdown = (peak - value) / peak;
                    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
                });
                
                return (maxDrawdown * 100).toFixed(1);
            },
            
            calculateCorrelations(positions) {
                // Matriz de correlação simplificada
                const correlations = {};
                positions.forEach(p1 => {
                    correlations[p1.assetId] = {};
                    positions.forEach(p2 => {
                        if (p1.assetId === p2.assetId) {
                            correlations[p1.assetId][p2.assetId] = 1;
                        } else {
                            // Correlação estimada baseada em setor
                            const asset1 = AppState.market.assets[p1.assetId];
                            const asset2 = AppState.market.assets[p2.assetId];
                            const sameSector = asset1?.sector === asset2?.sector;
                            correlations[p1.assetId][p2.assetId] = sameSector ? 0.7 : 0.3;
                        }
                    });
                });
                return correlations;
            },
            
            calculateDiversificationIndex(positions) {
                if (positions.length === 0) return 0;
                
                // Baseado em número de setores diferentes
                const sectors = new Set(positions.map(p => {
                    const asset = AppState.market.assets[p.assetId];
                    return asset?.sector || 'unknown';
                }));
                
                const types = new Set(positions.map(p => p.type));
                
                // Score: 40% tipos, 40% setores, 20% quantidade
                const typeScore = Math.min(types.size / 5, 1) * 40;
                const sectorScore = Math.min(sectors.size / 5, 1) * 40;
                const quantityScore = Math.min(positions.length / 10, 1) * 20;
                
                return Math.round(typeScore + sectorScore + quantityScore);
            },
            
            calculateAnnualizedReturn(transactions) {
                const sellTransactions = transactions.filter(t => t.type === 'sell' && t.pnl > 0);
                if (sellTransactions.length === 0) return 0;
                
                const totalReturn = sellTransactions.reduce((sum, t) => sum + t.pnl, 0);
                const totalInvested = sellTransactions.reduce((sum, t) => sum + (t.total - t.pnl), 0);
                
                // Simular período (assumir 1 ano se não houver histórico de tempo)
                const days = AppState.market.simulatedTime?.totalDaysElapsed || 365;
                const years = days / 365;
                
                if (years < 0.1) return ((totalReturn / totalInvested) * 100).toFixed(1);
                
                // Fórmula: (1 + retorno)^(1/anos) - 1
                const annualized = Math.pow(1 + (totalReturn / totalInvested), 1/years) - 1;
                return (annualized * 100).toFixed(1);
            },
            
            calculateTaxForecast(positions) {
                // IAC = 10% sobre ganhos de capital
                const unrealizedGains = positions.reduce((sum, p) => {
                    return sum + Math.max(0, p.pnl || 0);
                }, 0);
                
                return unrealizedGains * 0.10;
            },
            
            calculateOptimalAllocation(positions) {
                const profile = AppState.user.profile || 'moderado';
                
                const allocations = {
                    conservador: { acoes: 30, titulos: 50, cripto: 0, moedas: 10, etfs: 10 },
                    moderado: { acoes: 50, titulos: 30, cripto: 5, moedas: 5, etfs: 10 },
                    agressivo: { acoes: 60, titulos: 10, cripto: 20, moedas: 5, etfs: 5 }
                };
                
                const current = {
                    acoes: 0, titulos: 0, cripto: 0, moedas: 0, etfs: 0
                };
                
                const totalValue = AppState.portfolio.currentValue || 1;
                
                positions.forEach(p => {
                    const value = p.currentPrice * p.quantity;
                    if (p.type === 'acao') current.acoes += value;
                    else if (p.type.includes('titulo')) current.titulos += value;
                    else if (p.type === 'cripto') current.cripto += value;
                    else if (p.type === 'moeda') current.moedas += value;
                    else if (p.type === 'etf') current.etfs += value;
                });
                
                // Converter para percentuais
                Object.keys(current).forEach(k => {
                    current[k] = (current[k] / totalValue) * 100;
                });
                
                const target = allocations[profile];
                const suggestions = [];
                
                Object.keys(target).forEach(assetType => {
                    const diff = target[assetType] - current[assetType];
                    if (Math.abs(diff) > 5) {
                        suggestions.push({
                            type: assetType,
                            action: diff > 0 ? 'aumentar' : 'reduzir',
                            target: target[assetType],
                            current: current[assetType].toFixed(1)
                        });
                    }
                });
                
                return { profile, current, target, suggestions };
            },
            
            injectIndicatorsPanel() {
                const dashboard = document.getElementById('dashboard');
                if (!dashboard) {
                    setTimeout(() => this.injectIndicatorsPanel(), 1000);
                    return;
                }
                
                // Verificar se já existe
                if (document.getElementById('ext-advanced-indicators')) return;
                
                const panelHTML = `
                    <div id="ext-advanced-indicators" class="ext-advanced-indicators">
                        <h4>📊 Indicadores Avançados de Portfólio</h4>
                        <div class="ext-indicator-grid" id="ext-indicator-grid">
                            <!-- Preenchido dinamicamente -->
                        </div>
                        <div id="ext-allocation-suggestion" style="margin-top: 15px; padding: 15px; background: var(--gray-medium); border-radius: 8px; display: none;">
                            <!-- Sugestões de alocação -->
                        </div>
                    </div>
                `;
                
                // Inserir antes do histórico de transações
                const transactionHistory = dashboard.querySelector('.transaction-history');
                if (transactionHistory) {
                    transactionHistory.insertAdjacentHTML('beforebegin', panelHTML);
                } else {
                    dashboard.insertAdjacentHTML('beforeend', panelHTML);
                }
                
                this.updateDisplay();
            },
            
            updateDisplay() {
                const indicators = AppState.portfolio.advancedIndicators;
                if (!indicators) return;
                
                const grid = document.getElementById('ext-indicator-grid');
                if (!grid) return;
                
                const items = [
                    { name: 'Beta', value: indicators.beta, format: 'x', 
                      interpret: indicators.beta > 1.2 ? 'Volátil' : (indicators.beta < 0.8 ? 'Defensivo' : 'Neutro'),
                      class: indicators.beta > 1.2 ? 'danger' : (indicators.beta < 0.8 ? 'good' : 'neutral') },
                    { name: 'Sharpe Ratio', value: indicators.sharpeRatio, format: '',
                      interpret: indicators.sharpeRatio > 1 ? 'Bom' : (indicators.sharpeRatio < 0 ? 'Ruim' : 'Médio'),
                      class: indicators.sharpeRatio > 1 ? 'good' : (indicators.sharpeRatio < 0 ? 'danger' : 'warning') },
                    { name: 'Max Drawdown', value: indicators.maxDrawdown, format: '%',
                      interpret: indicators.maxDrawdown > 20 ? 'Alto Risco' : 'Controlado',
                      class: indicators.maxDrawdown > 20 ? 'danger' : 'good' },
                    { name: 'Diversificação', value: indicators.diversificationIndex, format: '%',
                      interpret: indicators.diversificationIndex > 70 ? 'Boa' : (indicators.diversificationIndex < 40 ? 'Fraca' : 'Média'),
                      class: indicators.diversificationIndex > 70 ? 'good' : (indicators.diversificationIndex < 40 ? 'danger' : 'warning') },
                    { name: 'Retorno Anualizado', value: indicators.annualizedReturn, format: '%',
                      interpret: indicators.annualizedReturn > 15 ? 'Excelente' : (indicators.annualizedReturn < 5 ? 'Baixo' : 'Bom'),
                      class: indicators.annualizedReturn > 15 ? 'good' : (indicators.annualizedReturn < 5 ? 'warning' : 'neutral') },
                    { name: 'Imposto Previsto (IAC)', value: (indicators.taxForecast / (AppState.portfolio.currentValue || 1) * 100).toFixed(1), format: '%',
                      interpret: 'Sobre ganhos não realizados',
                      class: 'neutral' }
                ];
                
                grid.innerHTML = items.map(item => `
                    <div class="ext-indicator-item ${item.class}">
                        <div class="name">${item.name}</div>
                        <div class="value">${item.value}${item.format}</div>
                        <div class="interpretation">${item.interpret}</div>
                    </div>
                `).join('');
                
                // Mostrar sugestões de alocação
                const suggestionDiv = document.getElementById('ext-allocation-suggestion');
                if (suggestionDiv && indicators.optimalAllocation) {
                    const opt = indicators.optimalAllocation;
                    if (opt.suggestions.length > 0) {
                        suggestionDiv.style.display = 'block';
                        suggestionDiv.innerHTML = `
                            <h5 style="margin: 0 0 10px 0; color: var(--accent-green);">
                                💡 Sugestões de Alocação (${opt.profile})
                            </h5>
                            ${opt.suggestions.map(s => `
                                <div style="margin: 5px 0; font-size: 0.9rem;">
                                    ${s.action === 'aumentar' ? '📈' : '📉'} 
                                    <strong>${s.type.toUpperCase()}</strong>: 
                                    ${s.action} de ${s.current}% para ${s.target}%
                                </div>
                            `).join('')}
                        `;
                    }
                }
            },
            
            startPeriodicUpdate() {
                // Atualizar a cada 2 minutos
                setInterval(() => {
                    this.calculateAllIndicators();
                    this.updateDisplay();
                }, 120000);
                
                // Atualizar quando houver transações
                const originalUpdate = window.updatePortfolioUI;
                window.updatePortfolioUI = function() {
                    const result = originalUpdate.apply(this, arguments);
                    setTimeout(() => {
                        AdvancedIndicators.calculateAllIndicators();
                        AdvancedIndicators.updateDisplay();
                    }, 500);
                    return result;
                };
            }
        };
        
        window.AdvancedIndicators = AdvancedIndicators;
        
        setTimeout(() => AdvancedIndicators.init(), 3000);
    })();

    // Novas Funções de Suporte

    // ============================================
// MÓDULO 1: CALCULADORA DE ACUMULADO DE GANHOS/PERDAS
// ============================================
// Arquivo: accumulated_pnl_calculator.js
// Descrição: Calcula ganhos/perdas acumulados varrendo todo o histórico de transações
// e categorizando por tipo de ativo

(function() {
    'use strict';
    
    const AccumulatedPnL = {
        // Configuração das categorias
        categories: {
            'acoes': { name: 'Ações Angola', icon: '🏢', color: '#22c55e' },
            'us-acoes': { name: 'Ações EUA', icon: '🇺🇸', color: '#3b82f6' },
            'cripto': { name: 'Criptomoedas', icon: '₿', color: '#f59e0b' },
            'moedas': { name: 'Moedas', icon: '💱', color: '#8b5cf6' },
            'titulos': { name: 'Títulos', icon: '🏛️', color: '#ec4899' },
            'etfs': { name: 'ETFs', icon: '📦', color: '#06b6d4' }
        },
        
        // Estado dos cálculos
        state: {
            totalGains: 0,
            totalLosses: 0,
            netTotal: 0,
            totalOperations: 0,
            byCategory: {}
        },
        
        /**
         * Inicializa o módulo
         */
        init() {
            console.log('📊 Inicializando Calculadora de P&L Acumulado...');
            
            // Inicializar categorias
            Object.keys(this.categories).forEach(key => {
                this.state.byCategory[key] = {
                    gains: 0,
                    losses: 0,
                    net: 0,
                    operations: 0
                };
            });
            
            // Configurar UI
            this.setupUI();
            
            // Calcular inicial
            this.calculateAll();
            
            // Configurar hooks de atualização automática
            this.setupAutoUpdate();
            
            console.log('✅ Calculadora de P&L Acumulado inicializada');
        },
        
        /**
         * Configura elementos HTML necessários
         */
        setupUI() {
            // Verificar se painel já existe
            if (document.getElementById('ext-accumulated-pnl')) return;
            
            const portfolioSummary = document.querySelector('.portfolio-summary');
            if (!portfolioSummary) {
                setTimeout(() => this.setupUI(), 1000);
                return;
            }
            
            const html = `
                <div id="ext-accumulated-pnl" class="ext-pnl-accumulation">
                    <div class="ext-pnl-header">
                        <h4>📊 Acumulado de Ganhos/Perdas</h4>
                        <button class="ext-btn-refresh" onclick="AccumulatedPnL.calculateAll()" title="Recalcular">
                            🔄
                        </button>
                    </div>
                    
                    <div class="ext-pnl-totals">
                        <div class="ext-pnl-stat positive">
                            <span class="label">Total Ganhos</span>
                            <span class="value" id="ext-pnl-total-gains">0 Kz</span>
                        </div>
                        <div class="ext-pnl-stat negative">
                            <span class="label">Total Perdas</span>
                            <span class="value" id="ext-pnl-total-losses">0 Kz</span>
                        </div>
                        <div class="ext-pnl-stat neutral">
                            <span class="label">Saldo Líquido</span>
                            <span class="value" id="ext-pnl-net-total">0 Kz</span>
                        </div>
                        <div class="ext-pnl-stat neutral">
                            <span class="label">Operações</span>
                            <span class="value" id="ext-pnl-total-ops">0</span>
                        </div>
                    </div>
                    
                    <div class="ext-pnl-by-type" id="ext-pnl-by-type">
                        <!-- Preenchido dinamicamente -->
                    </div>
                    
                    <div class="ext-pnl-chart-container">
                        <canvas id="ext-pnl-chart" width="400" height="150"></canvas>
                    </div>
                </div>
            `;
            
            // Inserir após o summary-card
            const summaryCard = portfolioSummary.querySelector('.summary-card');
            if (summaryCard) {
                summaryCard.insertAdjacentHTML('afterend', html);
            }
            
            // Adicionar CSS se não existir
            this.addStyles();
        },
        
        /**
         * Adiciona estilos CSS necessários
         */
        addStyles() {
            if (document.getElementById('ext-pnl-styles')) return;
            
            const styles = `
                <style id="ext-pnl-styles">
                    .ext-pnl-accumulation {
                        background: var(--gray-dark);
                        border: 2px solid var(--gray-medium);
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 20px;
                    }
                    
                    .ext-pnl-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }
                    
                    .ext-pnl-header h4 {
                        color: var(--accent-green);
                        margin: 0;
                        font-size: 1.1rem;
                    }
                    
                    .ext-btn-refresh {
                        background: transparent;
                        border: 1px solid var(--gray-light);
                        color: var(--accent-green);
                        padding: 5px 10px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 1rem;
                        transition: all 0.3s;
                    }
                    
                    .ext-btn-refresh:hover {
                        background: var(--accent-green);
                        color: var(--gray-dark);
                    }
                    
                    .ext-pnl-totals {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    
                    .ext-pnl-stat {
                        background: var(--gray-medium);
                        padding: 12px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    
                    .ext-pnl-stat .label {
                        display: block;
                        font-size: 0.8rem;
                        color: rgba(255,255,255,0.7);
                        margin-bottom: 5px;
                    }
                    
                    .ext-pnl-stat .value {
                        display: block;
                        font-size: 1.2rem;
                        font-weight: 700;
                    }
                    
                    .ext-pnl-stat.positive .value { color: var(--success); }
                    .ext-pnl-stat.negative .value { color: var(--danger); }
                    .ext-pnl-stat.neutral .value { color: var(--accent-green); }
                    
                    .ext-pnl-by-type {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    
                    .ext-pnl-type-card {
                        background: var(--gray-medium);
                        padding: 12px;
                        border-radius: 8px;
                        border-left: 3px solid var(--accent-green);
                    }
                    
                    .ext-pnl-type-card h5 {
                        margin: 0 0 8px 0;
                        font-size: 0.9rem;
                        color: var(--text-white);
                    }
                    
                    .ext-pnl-type-stats {
                        display: flex;
                        justify-content: space-between;
                        font-size: 0.8rem;
                    }
                    
                    .ext-pnl-type-stats .gains { color: var(--success); }
                    .ext-pnl-type-stats .losses { color: var(--danger); }
                    
                    .ext-pnl-chart-container {
                        background: var(--gray-medium);
                        border-radius: 8px;
                        padding: 10px;
                        height: 150px;
                    }
                    
                    #ext-pnl-chart {
                        width: 100%;
                        height: 100%;
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', styles);
        },
        
        /**
         * Calcula todos os valores a partir do histórico de transações
         */
        calculateAll() {
            console.log('🔄 Calculando P&L Acumulado...');
            
            // Resetar estado
            this.state.totalGains = 0;
            this.state.totalLosses = 0;
            this.state.netTotal = 0;
            this.state.totalOperations = 0;
            
            Object.keys(this.state.byCategory).forEach(key => {
                this.state.byCategory[key] = {
                    gains: 0,
                    losses: 0,
                    net: 0,
                    operations: 0
                };
            });
            
            // Verificar se há transações
            const transactions = AppState.portfolio.transactions || [];
            
            if (transactions.length === 0) {
                console.log('ℹ️ Nenhuma transação encontrada');
                this.updateUI();
                return this.state;
            }
            
            console.log(`📋 Analisando ${transactions.length} transações...`);
            
            // Analisar cada transação
            transactions.forEach((tx, index) => {
                this.state.totalOperations++;
                
                // Determinar categoria do ativo
                const category = this.categorizeTransaction(tx);
                if (!category) {
                    console.log(`⚠️ Transação ${index} sem categoria:`, tx);
                    return;
                }
                
                // Incrementar contador da categoria
                this.state.byCategory[category].operations++;
                
                // Processar P&L de vendas (type === 'sell' ou similar)
                if ((tx.type === 'sell' || tx.type === 'maturity' || tx.type === 'currency-sell') && 
                    tx.pnl !== undefined && tx.pnl !== null) {
                    
                    const pnl = parseFloat(tx.pnl) || 0;
                    
                    if (pnl > 0) {
                        // Ganho
                        this.state.totalGains += pnl;
                        this.state.byCategory[category].gains += pnl;
                    } else if (pnl < 0) {
                        // Perda
                        this.state.totalLosses += Math.abs(pnl);
                        this.state.byCategory[category].losses += Math.abs(pnl);
                    }
                    
                    console.log(`💰 Venda ${tx.assetName || tx.assetId}: P&L = ${pnl}`);
                }
                
                // Processar dividendos como ganhos
                if (tx.type === 'dividends' || tx.type === 'interest') {
                    const amount = parseFloat(tx.total) || 0;
                    if (amount > 0) {
                        this.state.totalGains += amount;
                        this.state.byCategory[category].gains += amount;
                    }
                }
            });
            
            // Calcular saldo líquido
            this.state.netTotal = this.state.totalGains - this.state.totalLosses;
            
            // Calcular nets por categoria
            Object.keys(this.state.byCategory).forEach(key => {
                const cat = this.state.byCategory[key];
                cat.net = cat.gains - cat.losses;
            });
            
            console.log('✅ Cálculo completo:', this.state);
            
            // Atualizar UI e AppState
            this.updateUI();
            this.updateAppState();
            
            return this.state;
        },
        
        /**
         * Categoriza uma transação pelo tipo de ativo
         */
        categorizeTransaction(tx) {
            if (!tx || !tx.assetId) return null;
            
            const asset = AppState.market.assets[tx.assetId];
            
            // Se não encontrar no market, tentar inferir pelo ID
            if (!asset) {
                if (tx.assetId.startsWith('US_')) return 'us-acoes';
                if (tx.assetId.startsWith('CURRENCY_')) return 'moedas';
                if (tx.assetId.startsWith('ETF_')) return 'etfs';
                if (tx.assetId.includes('titulo')) return 'titulos';
                if (tx.assetId.includes('cripto') || ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX'].includes(tx.assetId)) return 'cripto';
                return 'acoes'; // Default
            }
            
            // Categorizar pelo tipo do ativo
            switch(asset.type) {
                case 'acao':
                    return asset.country === 'US' || asset.country === 'USA' ? 'us-acoes' : 'acoes';
                case 'us-acao':
                case 'acao-us':
                    return 'us-acoes';
                case 'cripto':
                    return 'cripto';
                case 'moeda':
                case 'currency':
                    return 'moedas';
                case 'titulo-publico':
                case 'titulo-privado':
                case 'titulo':
                    return 'titulos';
                case 'etf':
                    return 'etfs';
                default:
                    // Tentar inferir por outras propriedades
                    if (asset.currency === 'USD' && asset.country === 'US') return 'us-acoes';
                    if (asset.ticker && ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'ZAR'].includes(asset.ticker)) return 'moedas';
                    return 'acoes';
            }
        },
        
        /**
         * Atualiza a interface do usuário
         */
        updateUI() {
            // Atualizar totais
            const gainsEl = document.getElementById('ext-pnl-total-gains');
            const lossesEl = document.getElementById('ext-pnl-total-losses');
            const netEl = document.getElementById('ext-pnl-net-total');
            const opsEl = document.getElementById('ext-pnl-total-ops');
            
            if (gainsEl) gainsEl.textContent = formatCurrency(this.state.totalGains);
            if (lossesEl) lossesEl.textContent = formatCurrency(this.state.totalLosses);
            if (netEl) {
                netEl.textContent = formatCurrency(this.state.netTotal);
                netEl.style.color = this.state.netTotal >= 0 ? 'var(--success)' : 'var(--danger)';
            }
            if (opsEl) opsEl.textContent = this.state.totalOperations.toLocaleString('pt-AO');
            
            // Atualizar cards por categoria
            this.renderCategoryCards();
            
            // Desenhar gráfico
            this.drawChart();
        },
        
        /**
         * Renderiza cards por categoria
         */
        renderCategoryCards() {
            const container = document.getElementById('ext-pnl-by-type');
            if (!container) return;
            
            const hasData = Object.values(this.state.byCategory).some(cat => cat.operations > 0);
            
            if (!hasData) {
                container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">Nenhuma operação registrada ainda</p>';
                return;
            }
            
            container.innerHTML = Object.entries(this.state.byCategory)
                .filter(([_, data]) => data.operations > 0) // Mostrar apenas categorias com operações
                .map(([key, data]) => {
                    const config = this.categories[key] || { name: key, icon: '📊', color: '#666' };
                    const netClass = data.net >= 0 ? 'positive' : 'negative';
                    
                    return `
                        <div class="ext-pnl-type-card" style="border-left-color: ${config.color}">
                            <h5>${config.icon} ${config.name}</h5>
                            <div class="ext-pnl-type-stats">
                                <span class="gains">+${formatCurrency(data.gains)}</span>
                                <span class="losses">-${formatCurrency(data.losses)}</span>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.85rem; color: ${data.net >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                Net: ${data.net >= 0 ? '+' : ''}${formatCurrency(data.net)}
                            </div>
                            <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 3px;">
                                ${data.operations} operação(ões)
                            </div>
                        </div>
                    `;
                }).join('');
        },
        
        /**
         * Desenha gráfico de evolução do P&L
         */
        drawChart() {
            const canvas = document.getElementById('ext-pnl-chart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // Dados para o gráfico (histórico simplificado)
            const transactions = AppState.portfolio.transactions || [];
            const sellTransactions = transactions.filter(tx => 
                (tx.type === 'sell' || tx.type === 'maturity') && tx.pnl !== undefined
            );
            
            if (sellTransactions.length < 2) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Aguardando mais operações para gráfico...', width/2, height/2);
                return;
            }
            
            // Calcular evolução acumulada
            let cumulative = 0;
            const dataPoints = sellTransactions.map(tx => {
                cumulative += parseFloat(tx.pnl) || 0;
                return cumulative;
            });
            
            // Encontrar min/max para escala
            const min = Math.min(...dataPoints, 0);
            const max = Math.max(...dataPoints, 0);
            const range = max - min || 1;
            
            // Desenhar linha
            ctx.beginPath();
            ctx.strokeStyle = 'rgb(214, 174, 100)';
            ctx.lineWidth = 2;
            
            dataPoints.forEach((value, index) => {
                const x = (index / (dataPoints.length - 1)) * width;
                const y = height - ((value - min) / range) * (height - 40) - 20;
                
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            
            ctx.stroke();
            
            // Preencher área sob a linha
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(214, 174, 100, 0.3)');
            gradient.addColorStop(1, 'rgba(214, 174, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Mostrar valor atual
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'right';
            const lastValue = dataPoints[dataPoints.length - 1];
            ctx.fillText(formatCurrency(lastValue), width - 10, 20);
            
            // Linha de referência zero
            const zeroY = height - ((0 - min) / range) * (height - 40) - 20;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.moveTo(0, zeroY);
            ctx.lineTo(width, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);
        },
        
        /**
         * Atualiza AppState com os valores calculados
         */
        updateAppState() {
            if (!AppState.portfolio) AppState.portfolio = {};
            
            AppState.portfolio.accumulatedPnL = {
                totalGains: this.state.totalGains,
                totalLosses: this.state.totalLosses,
                netTotal: this.state.netTotal,
                totalOperations: this.state.totalOperations,
                byCategory: { ...this.state.byCategory },
                lastCalculated: Date.now()
            };
        },
        
        /**
         * Configura atualização automática
         */
        setupAutoUpdate() {
            // Hook em funções que modificam transações
            
            // 1. Hook em buyAsset
            const originalBuy = window.buyAsset;
            if (originalBuy) {
                window.buyAsset = (...args) => {
                    const result = originalBuy.apply(this, args);
                    if (result && result.success) {
                        setTimeout(() => this.calculateAll(), 500);
                    }
                    return result;
                };
            }
            
            // 2. Hook em sellAsset
            const originalSell = window.sellAsset;
            if (originalSell) {
                window.sellAsset = (...args) => {
                    const result = originalSell.apply(this, args);
                    if (result && result.success) {
                        setTimeout(() => this.calculateAll(), 500);
                    }
                    return result;
                };
            }
            
            // 3. Atualizar periodicamente (a cada 30 segundos)
            setInterval(() => this.calculateAll(), 30000);
            
            console.log('🔄 Auto-atualização configurada');
        },
        
        /**
         * Retorna estado atual (para debug)
         */
        getState() {
            return { ...this.state };
        },
        
        /**
         * Reseta todos os cálculos
         */
        reset() {
            this.state = {
                totalGains: 0,
                totalLosses: 0,
                netTotal: 0,
                totalOperations: 0,
                byCategory: {}
            };
            
            Object.keys(this.categories).forEach(key => {
                this.state.byCategory[key] = {
                    gains: 0,
                    losses: 0,
                    net: 0,
                    operations: 0
                };
            });
            
            this.updateUI();
            this.updateAppState();
            
            console.log('🔄 P&L Acumulado resetado');
        }
    };
    
    // Expor globalmente
    window.AccumulatedPnL = AccumulatedPnL;
    
    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AccumulatedPnL.init());
    } else {
        setTimeout(() => AccumulatedPnL.init(), 1500);
    }
    
    console.log('📊 Módulo AccumulatedPnL carregado');
})();

// ============================================
// MÓDULO 2: SISTEMA DE COMPRA/VENDA DE MOEDAS CORRIGIDO
// ============================================
// Arquivo: currency_trade_fix.js
// Descrição: Corrige compra/venda de moedas estrangeiras com conversão adequada
// e uso correto de buyRate/sellRate com spread

(function() {
    'use strict';
    
    const CurrencyTradeFix = {
        // Configuração de moedas suportadas
        supportedCurrencies: ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'ZAR'],
        
        /**
         * Inicializa o módulo
         */
        init() {
            console.log('💱 Inicializando Correção de Comércio de Moedas...');
            
            // Aplicar patches
            this.patchBuyAsset();
            this.patchSellAsset();
            this.patchTradeModal();
            this.addExplanations();
            
            console.log('✅ Correção de Moedas inicializada');
        },
        
        /**
         * Verifica se um assetId é uma moeda
         */
        isCurrency(assetId) {
            if (!assetId) return false;
            
            // Verificar prefixo CURRENCY_
            if (assetId.startsWith('CURRENCY_')) return true;
            
            // Verificar códigos de moeda
            const code = assetId.replace('CURRENCY_', '');
            return this.supportedCurrencies.includes(code);
        },
        
        /**
         * Obtém código da moeda a partir do assetId
         */
        getCurrencyCode(assetId) {
            return assetId.replace('CURRENCY_', '');
        },
        
        /**
         * Obtém dados da moeda do AppState
         */
        getCurrencyData(assetId) {
            const asset = AppState.market.assets[assetId];
            if (!asset) return null;
            
            // Garantir que temos buyRate e sellRate
            const currentRate = asset.currentPrice || asset.initialPrice;
            const spread = asset.spread || asset.forexData?.spread || 0.005;
            
            return {
                ...asset,
                buyRate: currentRate * (1 + spread),
                sellRate: currentRate * (1 - spread),
                spread: spread,
                code: this.getCurrencyCode(assetId)
            };
        },
        
        /**
         * Patch da função buyAsset para interceptar moedas
         */
        patchBuyAsset() {
            const self = this;
            const originalBuy = window.buyAsset;
            
            window.buyAsset = function(assetId, quantity, isLimitOrder, limitPrice) {
                // Verificar se é moeda
                if (self.isCurrency(assetId)) {
                    return self.buyCurrency(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                // Chamar função original para outros ativos
                return originalBuy ? originalBuy.apply(this, arguments) : 
                    { success: false, message: 'Função buyAsset original não encontrada' };
            };
            
            console.log('🔧 Patch buyAsset aplicado para moedas');
        },
        
        /**
         * Patch da função sellAsset para interceptar moedas
         */
        patchSellAsset() {
            const self = this;
            const originalSell = window.sellAsset;
            
            window.sellAsset = function(assetId, quantity, isLimitOrder, limitPrice) {
                // Verificar se é moeda
                if (self.isCurrency(assetId)) {
                    return self.sellCurrency(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                // Chamar função original para outros ativos
                return originalSell ? originalSell.apply(this, arguments) : 
                    { success: false, message: 'Função sellAsset original não encontrada' };
            };
            
            console.log('🔧 Patch sellAsset aplicado para moedas');
        },
        
        /**
         * Compra de moeda estrangeira
         * FLUXO: Kz → MoedaEstrangeira (usa buyRate)
         */
        buyCurrency(assetId, quantity, isLimitOrder, limitPrice) {
            console.log(`🛒 Iniciando compra de moeda: ${assetId}, Qtd: ${quantity}`);
            
            // Validar quantidade
            quantity = parseFloat(quantity);
            if (!quantity || quantity <= 0) {
                return { success: false, message: '⚠️ Quantidade inválida' };
            }
            
            // Obter dados da moeda
            const currency = this.getCurrencyData(assetId);
            if (!currency) {
                return { success: false, message: '❌ Moeda não encontrada' };
            }
            
            // Usar buyRate para compra (preço que o usuário paga)
            const rate = isLimitOrder && limitPrice ? limitPrice : currency.buyRate;
            const totalKz = quantity * rate;
            
            console.log(`💰 Compra: ${quantity} ${currency.code} × ${rate} = ${totalKz} Kz`);
            
            // Validar saldo em Kz
            if (totalKz > AppState.user.availableBalance) {
                return { 
                    success: false, 
                    message: `⚠️ Saldo insuficiente. Necessário: ${formatCurrency(totalKz)}, Disponível: ${formatCurrency(AppState.user.availableBalance)}` 
                };
            }
            
            // Executar compra
            AppState.user.availableBalance -= totalKz;
            
            // Atualizar ou criar posição
            const existingPosition = AppState.portfolio.positions.find(p => p.assetId === assetId);
            
            if (existingPosition) {
                // Atualizar posição existente (média ponderada)
                const totalQuantity = existingPosition.quantity + quantity;
                const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + totalKz;
                existingPosition.avgPrice = totalCost / totalQuantity;
                existingPosition.quantity = totalQuantity;
                existingPosition.lastRate = rate;
            } else {
                // Nova posição
                AppState.portfolio.positions.push({
                    assetId: assetId,
                    name: currency.name,
                    ticker: currency.code,
                    type: 'moeda',
                    quantity: quantity,
                    avgPrice: rate, // Preço médio em Kz por unidade de moeda
                    currentPrice: rate,
                    purchaseRate: rate,
                    lastRate: rate,
                    currency: 'Kz',
                    icon: currency.icon || '💱'
                });
            }
            
            // Registrar transação
            const transaction = {
                timestamp: new Date().toISOString(),
                assetId: assetId,
                assetName: currency.name,
                type: 'buy',
                subtype: 'currency-buy',
                quantity: quantity,
                price: rate,
                total: totalKz,
                rateType: 'buyRate',
                spread: currency.spread,
                currency: 'Kz'
            };
            
            AppState.portfolio.transactions.push(transaction);
            
            // Atualizar métricas e salvar
            if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            
            console.log(`✅ Compra de moeda realizada: ${quantity} ${currency.code}`);
            
            return {
                success: true,
                message: `✅ Compra realizada: ${quantity.toLocaleString('pt-AO')} ${currency.code} por ${formatCurrency(totalKz)} (taxa: ${rate.toFixed(2)})`,
                transaction: transaction
            };
        },
        
        /**
         * Venda de moeda estrangeira
         * FLUXO: MoedaEstrangeira → Kz (usa sellRate)
         */
        sellCurrency(assetId, quantity, isLimitOrder, limitPrice) {
            console.log(`💰 Iniciando venda de moeda: ${assetId}, Qtd: ${quantity}`);
            
            // Validar quantidade
            quantity = parseFloat(quantity);
            if (!quantity || quantity <= 0) {
                return { success: false, message: '⚠️ Quantidade inválida' };
            }
            
            // Obter dados da moeda
            const currency = this.getCurrencyData(assetId);
            if (!currency) {
                return { success: false, message: '❌ Moeda não encontrada' };
            }
            
            // Verificar posição
            const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
            if (!position) {
                return { success: false, message: `⚠️ Você não possui ${currency.code} para vender` };
            }
            
            if (quantity > position.quantity) {
                return { 
                    success: false, 
                    message: `⚠️ Quantidade insuficiente. Você tem: ${position.quantity.toFixed(4)} ${currency.code}` 
                };
            }
            
            // Usar sellRate para venda (preço que o usuário recebe)
            const rate = isLimitOrder && limitPrice ? limitPrice : currency.sellRate;
            const totalKz = quantity * rate;
            
            // Calcular custo original e P&L
            const costBasis = position.avgPrice * quantity;
            const grossPnL = totalKz - costBasis;
            
            // Aplicar imposto sobre ganhos (IAC - 10% sobre lucro)
            let tax = 0;
            if (grossPnL > 0) {
                tax = grossPnL * 0.10;
            }
            
            const netPnL = grossPnL - tax;
            const netTotal = totalKz - tax;
            
            console.log(`💰 Venda: ${quantity} ${currency.code} × ${rate} = ${totalKz} Kz | P&L: ${netPnL}`);
            
            // Executar venda
            AppState.user.availableBalance += netTotal;
            
            // Atualizar posição
            position.quantity -= quantity;
            
            if (position.quantity <= 0.0001) { // Remover se quantidade muito pequena
                const index = AppState.portfolio.positions.indexOf(position);
                AppState.portfolio.positions.splice(index, 1);
            }
            
            // Registrar transação
            const transaction = {
                timestamp: new Date().toISOString(),
                assetId: assetId,
                assetName: currency.name,
                type: 'sell',
                subtype: 'currency-sell',
                quantity: quantity,
                price: rate,
                total: netTotal,
                grossTotal: totalKz,
                grossPnL: grossPnL,
                tax: tax,
                pnl: netPnL,
                rateType: 'sellRate',
                spread: currency.spread,
                currency: 'Kz'
            };
            
            AppState.portfolio.transactions.push(transaction);
            
            // Atualizar métricas e salvar
            if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            if (typeof updateTransactionsUI === 'function') updateTransactionsUI();
            
            console.log(`✅ Venda de moeda realizada: ${quantity} ${currency.code}, P&L: ${netPnL}`);
            
            // Mensagem apropriada
            let message = `✅ Venda realizada: ${quantity.toLocaleString('pt-AO')} ${currency.code} = ${formatCurrency(netTotal)}`;
            if (tax > 0) {
                message += ` (IAC: ${formatCurrency(tax)})`;
            }
            if (netPnL !== 0) {
                const pnlEmoji = netPnL > 0 ? '📈' : '📉';
                message += ` | ${pnlEmoji} P&L: ${netPnL > 0 ? '+' : ''}${formatCurrency(netPnL)}`;
            }
            
            return {
                success: true,
                message: message,
                transaction: transaction,
                pnl: netPnL
            };
        },
        
        /**
         * Patch do modal de trade para moedas
         */
        patchTradeModal() {
            const self = this;
            const originalOpenTradeModal = window.openTradeModal;
            
            window.openTradeModal = function(assetId, type) {
                // Verificar se é moeda
                if (self.isCurrency(assetId)) {
                    return self.openCurrencyTradeModal(assetId, type);
                }
                
                // Chamar original
                return originalOpenTradeModal ? originalOpenTradeModal.apply(this, arguments) : null;
            };
            
            console.log('🔧 Patch openTradeModal aplicado para moedas');
        },
        
        /**
         * Abre modal de trade específico para moedas
         */
        openCurrencyTradeModal(assetId, type) {
            const currency = this.getCurrencyData(assetId);
            if (!currency) return;
            
            const modal = document.getElementById('trade-modal');
            if (!modal) return;
            
            // Configurar modal
            document.getElementById('modal-title').textContent = 
                type === 'buy' ? `🛒 Comprar ${currency.code}` : `💰 Vender ${currency.code}`;
            document.getElementById('modal-asset-name').textContent = currency.name;
            
            // Mostrar taxas
            const rate = type === 'buy' ? currency.buyRate : currency.sellRate;
            const rateLabel = type === 'buy' ? 'Taxa de Compra' : 'Taxa de Venda';
            
            document.getElementById('modal-price').innerHTML = 
                `${rate.toFixed(2)} Kz <small style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">(${rateLabel})</small>`;
            
            // Info extra
            const extraInfo = document.getElementById('modal-extra-info');
            if (extraInfo) {
                const spreadInfo = `Spread: ${(currency.spread * 100).toFixed(1)}% | `;
                const refInfo = `Referência: ${currency.currentPrice.toFixed(2)} Kz`;
                extraInfo.innerHTML = `<small>${spreadInfo}${refInfo}</small>`;
            }
            
            // Configurar input de quantidade
            const qtyInput = document.getElementById('trade-quantity');
            if (qtyInput) {
                qtyInput.min = 0.01;
                qtyInput.step = 0.01;
                qtyInput.placeholder = `Quantidade em ${currency.code}`;
                qtyInput.value = '';
                
                // Calcular total em tempo real
                qtyInput.oninput = () => {
                    const qty = parseFloat(qtyInput.value) || 0;
                    const total = qty * rate;
                    
                    const totalEl = document.getElementById('trade-total');
                    if (totalEl) totalEl.textContent = formatCurrency(total);
                    
                    // Validar saldo
                    const warning = document.getElementById('insufficient-funds');
                    const confirmBtn = document.getElementById('confirm-trade');
                    
                    if (type === 'buy' && total > AppState.user.availableBalance) {
                        if (warning) warning.style.display = 'block';
                        if (confirmBtn) confirmBtn.disabled = true;
                    } else {
                        if (warning) warning.style.display = 'none';
                        if (confirmBtn) confirmBtn.disabled = false;
                    }
                };
            }
            
            // Configurar dataset do modal
            modal.style.display = 'block';
            modal.dataset.assetId = assetId;
            modal.dataset.type = type;
            modal.dataset.isCurrency = 'true';
            
            // Esconder opções de cripto
            const cryptoOptions = document.getElementById('crypto-purchase-options');
            if (cryptoOptions) cryptoOptions.style.display = 'none';
        },
        
        /**
         * Adiciona explicações educacionais para moedas
         */
        addExplanations() {
            if (!window.ASSET_EXPLANATIONS) window.ASSET_EXPLANATIONS = {};
            
            window.ASSET_EXPLANATIONS['moedas'] = {
                title: "💱 O que são Moedas Estrangeiras (Divisas)?",
                content: `Moedas estrangeiras permitem investir em diferentes economias através do mercado de câmbio (Forex).

Como funciona:
• Você compra moeda estrangeira (ex: USD, EUR) com Kwanza
• Lucra se a moeda valorizar em relação ao Kz
• Cada moeda tem taxa de compra (buy) e venda (sell) com spread
• O preço varia conforme oferta/demanda e cenário econômico

Fatores que influenciam:
• Economia de Angola (preço do petróleo, crescimento)
• Política monetária dos bancos centrais
• Cenário econômico global
• Eventos geopolíticos

⚠️ Spread: Diferença entre preço de compra e venda - custo da operação.

💡 Dica: Acompanhe a taxa de câmbio USD/Kz, pois afeta diretamente seus retornos.`
            };
        }
    };
    
    // Expor globalmente
    window.CurrencyTradeFix = CurrencyTradeFix;
    
    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CurrencyTradeFix.init());
    } else {
        setTimeout(() => CurrencyTradeFix.init(), 1000);
    }
    
    console.log('💱 Módulo CurrencyTradeFix carregado');
})();

// ============================================
// MÓDULO 3: SISTEMA DE COMPRA/VENDA DE AÇÕES EUA CORRIGIDO
// ============================================
// Arquivo: us_stocks_trade_fix.js
// Descrição: Corrige conversão USD↔Kz para ações americanas
// Garante que preços em USD sejam convertidos corretamente

(function() {
    'use strict';
    
    const USStocksTradeFix = {
        /**
         * Inicializa o módulo
         */
        init() {
            console.log('🇺🇸 Inicializando Correção de Ações EUA...');
            
            this.patchBuyAsset();
            this.patchSellAsset();
            this.patchTradeModal();
            this.addExplanations();
            this.ensureUSDAssetExists();
            
            console.log('✅ Correção de Ações EUA inicializada');
        },
        
        /**
         * Garante que o asset USD existe para taxa de câmbio
         */
        ensureUSDAssetExists() {
            if (!AppState.market.assets['CURRENCY_USD']) {
                console.log('⚠️ Asset USD não encontrado, criando...');
                AppState.market.assets['CURRENCY_USD'] = {
                    id: 'CURRENCY_USD',
                    name: 'Dólar Americano',
                    ticker: 'USD',
                    type: 'moeda',
                    currentPrice: 830,
                    initialPrice: 830
                };
            }
        },
        
        /**
         * Obtém taxa de câmbio USD/Kz atual
         */
        getUSDRate() {
            const usdAsset = AppState.market.assets['CURRENCY_USD'] || 
                           AppState.market.assets['USD'];
            
            if (usdAsset && usdAsset.currentPrice) {
                return usdAsset.currentPrice;
            }
            
            // Fallback para CurrencySystem se disponível
            if (window.CurrencySystem && typeof CurrencySystem.getRate === 'function') {
                return CurrencySystem.getRate('USD');
            }
            
            return 830; // Taxa padrão
        },
        
        /**
         * Verifica se é uma ação EUA
         */
        isUSStock(assetId) {
            if (!assetId) return false;
            
            const asset = AppState.market.assets[assetId];
            if (!asset) {
                // Tentar inferir pelo prefixo
                return assetId.startsWith('US_');
            }
            
            return asset.type === 'us-acao' || 
                   asset.type === 'acao-us' || 
                   asset.type === 'us-stock' ||
                   (asset.type === 'acao' && asset.country === 'US') ||
                   (asset.currency === 'USD' && asset.country === 'US');
        },
        
        /**
         * Obtém dados da ação EUA
         */
        getUSStockData(assetId) {
            const asset = AppState.market.assets[assetId];
            if (!asset) return null;
            
            const usdRate = this.getUSDRate();
            
            // Determinar preço em USD
            let priceUSD;
            if (asset.usdPrice) {
                priceUSD = asset.usdPrice;
            } else if (asset.currentPrice && asset.currentPrice > 1000) {
                // Provavelmente já está em Kz, converter para USD
                priceUSD = asset.currentPrice / usdRate;
            } else {
                priceUSD = asset.currentPrice || asset.initialPrice;
            }
            
            return {
                ...asset,
                usdRate: usdRate,
                priceUSD: priceUSD,
                priceKz: priceUSD * usdRate
            };
        },
        
        /**
         * Patch da função buyAsset
         */
        patchBuyAsset() {
            const self = this;
            const originalBuy = window.buyAsset;
            
            window.buyAsset = function(assetId, quantity, isLimitOrder, limitPrice) {
                if (self.isUSStock(assetId)) {
                    return self.buyUSStock(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                return originalBuy ? originalBuy.apply(this, arguments) : 
                    { success: false, message: 'buyAsset original não encontrado' };
            };
            
            console.log('🔧 Patch buyAsset aplicado para ações EUA');
        },
        
        /**
         * Patch da função sellAsset
         */
        patchSellAsset() {
            const self = this;
            const originalSell = window.sellAsset;
            
            window.sellAsset = function(assetId, quantity, isLimitOrder, limitPrice) {
                if (self.isUSStock(assetId)) {
                    return self.sellUSStock(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                return originalSell ? originalSell.apply(this, arguments) : 
                    { success: false, message: 'sellAsset original não encontrado' };
            };
            
            console.log('🔧 Patch sellAsset aplicado para ações EUA');
        },
        
        /**
         * Compra de ação EUA
         * FLUXO: Preço USD → Quantidade → Taxa → Total Kz
         */
        buyUSStock(assetId, quantity, isLimitOrder, limitPrice) {
            console.log(`🛒 Comprando ação EUA: ${assetId}, Qtd: ${quantity}`);
            
            quantity = parseInt(quantity) || 0;
            if (quantity <= 0) {
                return { success: false, message: '⚠️ Quantidade inválida' };
            }
            
            const stock = this.getUSStockData(assetId);
            if (!stock) {
                return { success: false, message: '❌ Ação não encontrada' };
            }
            
            // Determinar preço em USD
            let priceUSD;
            if (isLimitOrder && limitPrice) {
                // LimitPrice vem em USD do modal
                priceUSD = parseFloat(limitPrice);
            } else {
                priceUSD = stock.priceUSD;
            }
            
            // OBTER TAXA ATUAL
            const usdRate = this.getUSDRate();
            
            // CÁLCULO CRÍTICO: USD × Qtd × Taxa = Total Kz
            const totalUSD = priceUSD * quantity;
            const totalKz = totalUSD * usdRate;
            
            console.log(`💰 Cálculo: $${priceUSD} × ${quantity} × ${usdRate} = ${totalKz} Kz`);
            
            // Validar saldo em Kz
            if (totalKz > AppState.user.availableBalance) {
                return {
                    success: false,
                    message: `⚠️ Saldo insuficiente. Necessário: ${formatCurrency(totalKz)} ($${totalUSD.toFixed(2)} USD)`
                };
            }
            
            // Executar compra
            AppState.user.availableBalance -= totalKz;
            
            // Atualizar ou criar posição
            const existingPosition = AppState.portfolio.positions.find(p => p.assetId === assetId);
            
            if (existingPosition) {
                // Atualizar média ponderada
                const totalQuantity = existingPosition.quantity + quantity;
                const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + totalKz;
                existingPosition.avgPrice = totalCost / totalQuantity;
                existingPosition.quantity = totalQuantity;
                existingPosition.usdPrice = priceUSD;
                existingPosition.exchangeRate = usdRate;
            } else {
                // Nova posição
                AppState.portfolio.positions.push({
                    assetId: assetId,
                    name: stock.name,
                    ticker: stock.ticker,
                    type: 'us-acao',
                    quantity: quantity,
                    avgPrice: totalKz / quantity, // Preço médio em Kz por ação
                    usdPrice: priceUSD,           // Preço em USD no momento da compra
                    exchangeRate: usdRate,        // Taxa de câmbio no momento da compra
                    currentPrice: stock.priceKz,  // Preço atual em Kz
                    currency: 'USD',
                    country: 'US',
                    icon: stock.icon || '🇺🇸'
                });
            }
            
            // Registrar transação
            const transaction = {
                timestamp: new Date().toISOString(),
                assetId: assetId,
                assetName: stock.name,
                type: 'buy',
                subtype: 'us-stock-buy',
                quantity: quantity,
                priceUSD: priceUSD,
                price: stock.priceKz, // Para compatibilidade
                total: totalKz,
                totalUSD: totalUSD,
                usdRate: usdRate,
                exchangeRate: usdRate,
                currency: 'USD'
            };
            
            AppState.portfolio.transactions.push(transaction);
            
            // Atualizar sistema
            if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            
            console.log(`✅ Compra de ação EUA realizada: ${quantity}x ${stock.ticker}`);
            
            return {
                success: true,
                message: `✅ Compra realizada: ${quantity}x ${stock.ticker} por ${formatCurrency(totalKz)} ($${totalUSD.toFixed(2)} USD @ ${usdRate})`,
                transaction: transaction
            };
        },
        
        /**
         * Venda de ação EUA
         * FLUXO: Preço USD atual → Quantidade → Taxa atual → Total Kz
         * P&L = (Preço venda - Preço compra) × Quantidade × Taxa média
         */
        sellUSStock(assetId, quantity, isLimitOrder, limitPrice) {
            console.log(`💰 Vendendo ação EUA: ${assetId}, Qtd: ${quantity}`);
            
            quantity = parseInt(quantity) || 0;
            if (quantity <= 0) {
                return { success: false, message: '⚠️ Quantidade inválida' };
            }
            
            const stock = this.getUSStockData(assetId);
            if (!stock) {
                return { success: false, message: '❌ Ação não encontrada' };
            }
            
            // Verificar posição
            const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
            if (!position) {
                return { success: false, message: `⚠️ Você não possui ações ${stock.ticker}` };
            }
            
            if (quantity > position.quantity) {
                return {
                    success: false,
                    message: `⚠️ Quantidade insuficiente. Você tem: ${position.quantity} ações`
                };
            }
            
            // OBTER TAXA ATUAL
            const currentUSDRate = this.getUSDRate();
            
            // Determinar preço de venda em USD
            let sellPriceUSD;
            if (isLimitOrder && limitPrice) {
                sellPriceUSD = parseFloat(limitPrice);
            } else {
                sellPriceUSD = stock.priceUSD;
            }
            
            // CÁLCULO DA VENDA
            const totalUSD = sellPriceUSD * quantity;
            const totalKz = totalUSD * currentUSDRate;
            
            // CÁLCULO DO CUSTO ORIGINAL (em Kz)
            const originalCostPerShare = position.avgPrice; // Já está em Kz
            const totalCostKz = originalCostPerShare * quantity;
            
            // CÁLCULO DO P&L EM Kz
            const grossPnL = totalKz - totalCostKz;
            
            // Imposto sobre ganhos (IAC - 10%)
            let tax = 0;
            if (grossPnL > 0) {
                tax = grossPnL * 0.10;
            }
            
            const netPnL = grossPnL - tax;
            const netTotal = totalKz - tax;
            
            console.log(`💰 Venda: ${quantity}x ${stock.ticker} @ $${sellPriceUSD}`);
            console.log(`   Total: ${totalKz} Kz | Custo: ${totalCostKz} Kz | P&L: ${netPnL} Kz`);
            
            // Executar venda
            AppState.user.availableBalance += netTotal;
            
            // Atualizar posição
            position.quantity -= quantity;
            
            if (position.quantity === 0) {
                const index = AppState.portfolio.positions.indexOf(position);
                AppState.portfolio.positions.splice(index, 1);
            }
            
            // Registrar transação
            const transaction = {
                timestamp: new Date().toISOString(),
                assetId: assetId,
                assetName: stock.name,
                type: 'sell',
                subtype: 'us-stock-sell',
                quantity: quantity,
                priceUSD: sellPriceUSD,
                price: stock.priceKz,
                total: netTotal,
                grossTotal: totalKz,
                costBasis: totalCostKz,
                grossPnL: grossPnL,
                tax: tax,
                pnl: netPnL,
                usdRate: currentUSDRate,
                originalRate: position.exchangeRate,
                currency: 'USD'
            };
            
            AppState.portfolio.transactions.push(transaction);
            
            // Atualizar sistema
            if (typeof updatePortfolioMetrics === 'function') updatePortfolioMetrics();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if (typeof updatePortfolioUI === 'function') updatePortfolioUI();
            if (typeof updateTransactionsUI === 'function') updateTransactionsUI();
            
            // Notificação
            let message = `✅ Venda realizada: ${quantity}x ${stock.ticker} = ${formatCurrency(netTotal)}`;
            if (tax > 0) message += ` (IAC: ${formatCurrency(tax)})`;
            
            const pnlEmoji = netPnL > 0 ? '📈' : (netPnL < 0 ? '📉' : '➡️');
            message += ` | ${pnlEmoji} P&L: ${netPnL > 0 ? '+' : ''}${formatCurrency(netPnL)}`;
            
            console.log(`✅ Venda de ação EUA realizada: ${quantity}x ${stock.ticker}`);
            
            return {
                success: true,
                message: message,
                transaction: transaction,
                pnl: netPnL
            };
        },
        
        /**
         * Patch do modal de trade
         */
        patchTradeModal() {
            const self = this;
            const originalOpenTradeModal = window.openTradeModal;
            
            window.openTradeModal = function(assetId, type) {
                if (self.isUSStock(assetId)) {
                    return self.openUSStockTradeModal(assetId, type);
                }
                
                return originalOpenTradeModal ? originalOpenTradeModal.apply(this, arguments) : null;
            };
            
            console.log('🔧 Patch openTradeModal aplicado para ações EUA');
        },
        
        /**
         * Abre modal específico para ações EUA
         */
        openUSStockTradeModal(assetId, type) {
            const stock = this.getUSStockData(assetId);
            if (!stock) return;
            
            const modal = document.getElementById('trade-modal');
            if (!modal) return;
            
            const usdRate = this.getUSDRate();
            
            // Configurar modal
            document.getElementById('modal-title').textContent = 
                type === 'buy' ? `🛒 Comprar ${stock.ticker}` : `💰 Vender ${stock.ticker}`;
            document.getElementById('modal-asset-name').textContent = stock.name;
            
            // Mostrar ambos os preços
            const priceHTML = `
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.3rem; font-weight: 700; color: var(--accent-green);">
                            $${stock.priceUSD.toFixed(2)}
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">USD</div>
                    </div>
                    <div style="color: rgba(255,255,255,0.4);">≈</div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.3rem; font-weight: 700;">
                            ${formatCurrency(stock.priceKz)}
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">Kz</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 5px; font-size: 0.8rem; color: rgba(255,255,255,0.5);">
                    Taxa USD/Kz: ${usdRate.toFixed(2)}
                </div>
            `;
            
            document.getElementById('modal-price').innerHTML = priceHTML;
            
            // Info extra
            const extraInfo = document.getElementById('modal-extra-info');
            if (extraInfo) {
                const position = AppState.portfolio.positions.find(p => p.assetId === assetId);
                if (position && type === 'sell') {
                    extraInfo.innerHTML = `
                        <small>Posição: ${position.quantity} ações @ ${formatCurrency(position.avgPrice)}/ação</small>
                    `;
                } else {
                    extraInfo.innerHTML = `<small>Setor: ${stock.sector || 'Tecnologia'} | Bolsa: ${stock.exchange || 'NASDAQ'}</small>`;
                }
            }
            
            // Configurar input
            const qtyInput = document.getElementById('trade-quantity');
            if (qtyInput) {
                qtyInput.min = 1;
                qtyInput.step = 1;
                qtyInput.placeholder = 'Quantidade de ações';
                qtyInput.value = '';
                
                // Calcular total em tempo real
                qtyInput.oninput = () => {
                    const qty = parseInt(qtyInput.value) || 0;
                    const totalKz = qty * stock.priceKz;
                    const totalUSD = qty * stock.priceUSD;
                    
                    const totalEl = document.getElementById('trade-total');
                    if (totalEl) {
                        totalEl.innerHTML = `${formatCurrency(totalKz)} <small>($${totalUSD.toFixed(2)})</small>`;
                    }
                    
                    // Validar
                    const warning = document.getElementById('insufficient-funds');
                    const confirmBtn = document.getElementById('confirm-trade');
                    
                    if (type === 'buy' && totalKz > AppState.user.availableBalance) {
                        if (warning) warning.style.display = 'block';
                        if (confirmBtn) confirmBtn.disabled = true;
                    } else if (type === 'sell' && qty > (position?.quantity || 0)) {
                        if (warning) {
                            warning.textContent = '⚠️ Quantidade insuficiente';
                            warning.style.display = 'block';
                        }
                        if (confirmBtn) confirmBtn.disabled = true;
                    } else {
                        if (warning) warning.style.display = 'none';
                        if (confirmBtn) confirmBtn.disabled = false;
                    }
                };
            }
            
            // Configurar modal
            modal.style.display = 'block';
            modal.dataset.assetId = assetId;
            modal.dataset.type = type;
            modal.dataset.isUSStock = 'true';
            
            // Esconder opções de cripto
            const cryptoOptions = document.getElementById('crypto-purchase-options');
            if (cryptoOptions) cryptoOptions.style.display = 'none';
        },
        
        /**
         * Adiciona explicações educacionais
         */
        addExplanations() {
            if (!window.ASSET_EXPLANATIONS) window.ASSET_EXPLANATIONS = {};
            
            window.ASSET_EXPLANATIONS['us-acoes'] = {
                title: "🇺🇸 O que são Ações Americanas?",
                content: `Ações de empresas listadas nas bolsas dos Estados Unidos (NASDAQ, NYSE, AMEX).

Investir em ações americanas oferece:
• Exposição às maiores empresas globais (Apple, Microsoft, Amazon, etc.)
• Mercado com alta liquidez e transparência
• Diversificação internacional da carteira
• Potencial de crescimento com o maior mercado financeiro do mundo

Como funciona a conversão:
• As ações são negociadas em dólares americanos (USD)
• Ao comprar, seu saldo em Kz é convertido automaticamente
• Taxa de câmbio USD/Kz é aplicada no momento da operação
• Na venda, o valor é convertido de volta para Kz

💡 Dica: Variações na taxa de câmbio afetam seus retornos! Se o dólar sobe, suas ações valorizam em Kz mesmo que o preço em USD fique estável.

⚠️ Atenção: Operações internacionais estão sujeitas a:
• Spread cambial (diferença entre compra e venda de moeda)
• Imposto de renda sobre ganhos de capital (IAC)
• Volatilidade do mercado americano`
            };
        }
    };
    
    // Expor globalmente
    window.USStocksTradeFix = USStocksTradeFix;
    
    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => USStocksTradeFix.init());
    } else {
        setTimeout(() => USStocksTradeFix.init(), 1200);
    }
    
    console.log('🇺🇸 Módulo USStocksTradeFix carregado');
})();

// ============================================
// MÓDULO 4: EXPLICAÇÕES EDUCACIONAIS COMPLETAS
// ============================================
// Arquivo: educational_content_fix.js
// Descrição: Adiciona explicações para todos os tipos de ativos
// e corrige a função showExplanation

(function() {
    'use strict';
    
    const EducationalFix = {
        /**
         * Inicializa o módulo
         */
        init() {
            console.log('📚 Inicializando Correções Educacionais...');
            
            this.addMissingExplanations();
            this.patchShowExplanation();
            this.patchAssetTabs();
            
            console.log('✅ Correções Educacionais inicializadas');
        },
        
        /**
         * Adiciona todas as explicações ausentes
         */
        addMissingExplanations() {
            if (!window.ASSET_EXPLANATIONS) {
                window.ASSET_EXPLANATIONS = {};
            }
            
            // Ações EUA (se não foi adicionada pelo módulo 3)
            if (!window.ASSET_EXPLANATIONS['us-acoes']) {
                window.ASSET_EXPLANATIONS['us-acoes'] = {
                    title: "🇺🇸 O que são Ações Americanas?",
                    content: `Ações de empresas listadas nas bolsas dos Estados Unidos (NASDAQ, NYSE, AMEX).

Investir em ações americanas oferece:
• Exposição às maiores empresas globais (Apple, Microsoft, Amazon, Tesla)
• Mercado com alta liquidez e transparência regulatória
• Diversificação internacional da carteira
• Potencial de crescimento com economia inovadora

💱 Conversão Automática:
• Preços mostrados em USD e Kz simultaneamente
• Taxa de câmbio aplicada automaticamente nas operações
• Variações cambiais afetam o valor em Kz

⚠️ Considerações:
• Horário de negociação segue o mercado americano
• Dividendos pagos em USD e convertidos
• Sujeito a imposto sobre ganhos de capital (IAC)`
                };
            }
            
            // Moedas (se não foi adicionada pelo módulo 2)
            if (!window.ASSET_EXPLANATIONS['moedas']) {
                window.ASSET_EXPLANATIONS['moedas'] = {
                    title: "💱 O que são Moedas Estrangeiras (Forex)?",
                    content: `Investimento em divisas permite lucrar com variações cambiais entre o Kwanza e moedas globais.

Como funciona:
• Compra de moeda estrangeira (USD, EUR, GBP, etc.) com Kz
• Lucro quando a moeda se valoriza vs. Kwanza
• Spread: diferença entre preço de compra e venda

Principais pares disponíveis:
• USD/Kz - Dólar Americano (moeda de reserva global)
• EUR/Kz - Euro (moeda da União Europeia)
• GBP/Kz - Libra Esterlina (moeda do Reino Unido)
• CNY/Kz - Yuan Chinês (moeda da maior economia asiática)

Fatores que influenciam:
• Preço do petróleo (principal exportação de Angola)
• Política monetária do BNA e bancos centrais estrangeiros
• Estabilidade política e econômica
• Fluxos de capital internacional

💡 Estratégia: Diversificar em múltiplas moedas reduz risco cambial.`
                };
            }
            
            // ETFs (se não existir)
            if (!window.ASSET_EXPLANATIONS['etfs']) {
                window.ASSET_EXPLANATIONS['etfs'] = {
                    title: "📦 O que são ETFs?",
                    content: `ETFs (Exchange Traded Funds) são fundos de investimento negociados em bolsa como ações.

Vantagens dos ETFs:
• Diversificação instantânea em múltiplos ativos
• Custos operacionais geralmente menores
• Liquidez diária (compra e venda a qualquer momento)
• Transparência na composição da carteira

Tipos de ETFs disponíveis:
• ETFs de Índice: acompanham índices de mercado (BODIVA, S&P 500)
• ETFs de Setor: focados em tecnologia, saúde, energia, etc.
• ETFs de Commodities: exposição a ouro, petróleo, etc.
• ETFs de Criptomoedas: acompanham Bitcoin, Ethereum

💡 Ideal para investidores que buscam diversificação sem precisar selecionar individualmente cada ativo.`
                };
            }
            
            console.log('📚 Explicações educacionais adicionadas');
        },
        
        /**
         * Patch da função showExplanation para garantir funcionamento
         */
        patchShowExplanation() {
            const self = this;
            const originalShowExplanation = window.showExplanation;
            
            window.showExplanation = function() {
                console.log('📖 Abrindo explicação educacional...');
                
                // Garantir que explicações existam
                self.addMissingExplanations();
                
                const box = document.getElementById('explanation-content');
                const activeTab = document.querySelector('.asset-tabs .tab.active');
                
                if (!activeTab) {
                    console.warn('Nenhuma tab ativa encontrada');
                    return;
                }
                
                const category = activeTab.dataset.category;
                console.log(`Categoria selecionada: ${category}`);
                
                // Mapear categorias para chaves de explicação
                const categoryMap = {
                    'acoes': 'acoes',
                    'acoesUs': 'us-acoes',
                    'us-acoes': 'us-acoes',
                    'etfs': 'etfs',
                    'cripto': 'cripto',
                    'moedas': 'moedas',
                    'titulosPublicos': 'titulosPublicos',
                    'titulosPrivados': 'titulosPrivados'
                };
                
                const explanationKey = categoryMap[category] || category;
                const explanation = window.ASSET_EXPLANATIONS[explanationKey];
                
                if (!box) {
                    console.error('Elemento explanation-content não encontrado');
                    return;
                }
                
                if (box.style.display === 'none' || !box.style.display) {
                    if (explanation) {
                        box.innerHTML = `
                            <h4>${explanation.title}</h4>
                            <div style="white-space: pre-line; line-height: 1.6;">
                                ${explanation.content}
                            </div>
                        `;
                        box.style.display = 'block';
                        
                        // Scroll suave até a explicação
                        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        box.innerHTML = `
                            <h4>ℹ️ Informação</h4>
                            <p>Selecione uma categoria de ativos para ver a explicação detalhada.</p>
                            <p>Categoria atual: <strong>${category}</strong></p>
                        `;
                        box.style.display = 'block';
                        console.warn(`Explicação não encontrada para: ${category}`);
                    }
                } else {
                    box.style.display = 'none';
                }
            };
            
            console.log('🔧 Patch showExplanation aplicado');
        },
        
        /**
         * Patch das tabs de ativos para garantir que explicações funcionem
         */
        patchAssetTabs() {
            const self = this;
            
            // Reconfigurar tabs quando forem clicadas
            document.addEventListener('click', function(e) {
                if (e.target.matches('.asset-tabs .tab')) {
                    // Resetar explicação ao mudar de tab
                    const box = document.getElementById('explanation-content');
                    if (box) {
                        box.style.display = 'none';
                    }
                }
            });
            
            console.log('🔧 Event listener de tabs configurado');
        }
    };
    
    // Expor globalmente
    window.EducationalFix = EducationalFix;
    
    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EducationalFix.init());
    } else {
        setTimeout(() => EducationalFix.init(), 800);
    }
    
    console.log('📚 Módulo EducationalFix carregado');
})();

// ============================================
// MÓDULO 5: INTEGRAÇÃO E VERIFICAÇÃO FINAL
// ============================================
// Arquivo: integration_verifier.js
// Descrição: Verifica se todos os módulos foram carregados corretamente
// e resolve conflitos potenciais

(function() {
    'use  strict';
    
    const IntegrationVerifier = {
        modules: [
            { name: 'AccumulatedPnL', global: 'AccumulatedPnL', required: true },
            { name: 'CurrencyTradeFix', global: 'CurrencyTradeFix', required: true },
            { name: 'USStocksTradeFix', global: 'USStocksTradeFix', required: true },
            { name: 'EducationalFix', global: 'EducationalFix', required: false }
        ],
        
        init() {
            console.log('🔍 Verificando integração de módulos...');
            
            setTimeout(() => {
                this.verifyModules();
                this.checkForConflicts();
                this.setupEmergencyPatches();
            }, 3000);
        },
        
        verifyModules() {
            let allOk = true;
            
            this.modules.forEach(mod => {
                const exists = window[mod.global] !== undefined;
                const status = exists ? '✅' : (mod.required ? '❌' : '⚠️');
                
                console.log(`${status} ${mod.name}: ${exists ? 'Carregado' : 'Não encontrado'}`);
                
                if (!exists && mod.required) {
                    allOk = false;
                    console.error(`Módulo crítico não carregado: ${mod.name}`);
                }
            });
            
            if (allOk) {
                console.log('🎉 Todos os módulos críticos carregados com sucesso!');
            } else {
                console.warn('⚠️ Alguns módulos não foram carregados. Verifique a ordem de inclusão dos scripts.');
            }
        },
        
        checkForConflicts() {
            // Verificar se buyAsset foi patchado corretamente
            const buyAssetStr = window.buyAsset ? window.buyAsset.toString() : '';
            
            if (buyAssetStr.includes('isCurrency') && buyAssetStr.includes('isUSStock')) {
                console.log('✅ buyAsset: Patches de moeda e ações EUA detectados');
            } else if (buyAssetStr.includes('originalBuy')) {
                console.log('⚠️ buyAsset: Patchado mas pode não incluir todas as correções');
            } else {
                console.warn('❌ buyAsset: Não parece estar patchado');
            }
            
            // Verificar se ASSET_EXPLANATIONS foi populado
            const explanations = window.ASSET_EXPLANATIONS || {};
            const hasUSStocks = !!explanations['us-acoes'];
            const hasCurrencies = !!explanations['moedas'];
            
            console.log(`${hasUSStocks ? '✅' : '❌'} Explicações: Ações EUA`);
            console.log(`${hasCurrencies ? '✅' : '❌'} Explicações: Moedas`);
        },
        
        setupEmergencyPatches() {
            // Patch de emergência para garantir que tudo funcione
            const self = this;
            
            // Verificar periodicamente se os patches estão funcionando
            setInterval(() => {
                // Se buyAsset não estiver patchado, aplicar patch de emergência
                if (window.buyAsset && !window.buyAsset.toString().includes('originalBuy')) {
                    console.warn('🚨 Aplicando patch de emergência em buyAsset');
                    self.emergencyPatchBuyAsset();
                }
            }, 10000);
        },
        
        emergencyPatchBuyAsset() {
            const originalBuy = window.buyAsset;
            
            window.buyAsset = function(assetId, quantity, isLimitOrder, limitPrice) {
                // Verificar moedas
                if (window.CurrencyTradeFix && window.CurrencyTradeFix.isCurrency(assetId)) {
                    return window.CurrencyTradeFix.buyCurrency(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                // Verificar ações EUA
                if (window.USStocksTradeFix && window.USStocksTradeFix.isUSStock(assetId)) {
                    return window.USStocksTradeFix.buyUSStock(assetId, quantity, isLimitOrder, limitPrice);
                }
                
                return originalBuy.apply(this, arguments);
            };
        }
    };
    
    // Inicializar verificador
    setTimeout(() => IntegrationVerifier.init(), 4000);
    
    console.log('🔍 Verificador de integração carregado');
})();

// ============================================
// MENSAGEM FINAL DE INICIALIZAÇÃO
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║          MÓDULOS DE CORREÇÃO TECA CAPITAL                  ║
║                   Carregados com Sucesso!                  ║
╠════════════════════════════════════════════════════════════╣
║  📊 AccumulatedPnL      - Calculadora de Ganhos/Perdas    ║
║  💱 CurrencyTradeFix    - Correção de Comércio de Moedas  ║
║  🇺🇸 USStocksTradeFix    - Correção de Ações EUA          ║
║  📚 EducationalFix      - Explicações Educacionais        ║
╚════════════════════════════════════════════════════════════╝

Todos os patches foram aplicados usando padrão não-destrutivo.
O código original foi preservado e extendido.
`);
    
    // ============================================
    // INICIALIZAÇÃO GERAL
    // ============================================
    
    
    console.log('🚀 Módulos Avançados Teca Capital carregados');
    console.log('📦 Módulos: P&L Acumulado, Tempo, Moedas, Ações EUA, Preços Ilimitados, Dividendos, Indicadores');

    // Funções javascript de Suporte
    