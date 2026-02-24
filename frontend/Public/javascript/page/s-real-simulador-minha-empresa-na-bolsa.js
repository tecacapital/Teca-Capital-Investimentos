        // ============================================
        // VARIÁVEIS GLOBAIS E ESTADO DO SIMULADOR
        // ============================================
        let estadoSimulador = {
            faseAtual: 'introducao',
            empresa: {},
            configuracao: {},
            opv: {},
            mercado: {
                historicoPrecos: [],
                precoAtual: 0,
                precoAnterior: 0,
                variacaoPercentual: 0,
                volume: 0,
                beta: 1.0,
                dividendYield: 0,
                lpa: 0,
                pl: 0,
                roi: 0,
                ultimaAtualizacao: new Date(),
                eventoAtivo: null,
                eventoExpiraEm: null
            },
            noticiaAtual: 0,
            intervaloGrafico: null,
            intervaloNoticias: null,
            tempoSimulacao: 0
        };

        // ============================================
        // DADOS REGULATÓRIOS BODIVA
        // ============================================
        const regrasBODIVA = {
            enquadramento_legal: {
                lei_base: "Lei n.º 22/15, de 31 de Agosto - Código dos Valores Mobiliários (CVM)",
                autoridade: "CMC - Comissão do Mercado de Capitais",
                bolsa: "BODIVA - Bolsa de Dívida e Valores de Angola"
            },
            
            requisitos_acoes: {
                estatuto: "Sociedade Aberta (S.A.)",
                auditoria: "Demonstrações financeiras auditadas obrigatórias",
                agente_intermediacao: "Obrigatório (Sociedade Corretora ou SDVM)",
                prospecto: "Obrigatório",
                governanca: "Estrutura de governança corporativa adequada"
            },
            
            requisitos_obrigacoes: {
                montante_minimo_listagem: "AOA 60.000.000,00",
                notacao_risco: "Recomendada (especialmente sem garantias)",
                prospecto: "Obrigatório para oferta pública",
                oferta_particular: "< 150 investidores institucionais (sem Prospecto formal)"
            },
            
            segmentos: {
                MBA: "Mercado de Bolsa de Ações (renda variável)",
                MBOP: "Mercado de Bolsa de Obrigações Privadas (renda fixa)",
                MBTT: "Mercado de Bolsa de Títulos do Tesouro (dívida soberana)",
                MROV: "Mercado de Registo de Operações OTC (liquidação D+1)",
                MVMF: "Mercado de Valores Mobiliários Fracionados (acesso retalho)"
            },
            
            processo_listagem: [
                "1. Transformação em S.A.",
                "2. Registo inicial na BODIVA",
                "3. Contratação de agente de intermediação",
                "4. Elaboração e registo do Prospecto na CMC",
                "5. Auditoria e demonstrações financeiras",
                "6. Oferta Pública (Mercado Primário)",
                "7. Admissão à negociação (Mercado Secundário)",
                "8. Deveres contínuos de informação"
            ],
            
            custos_estimados: "3% a 10% do montante total da emissão",
            tempo_processo: "6 a 18 meses (média: 9 meses)",
            
            principio_cmc: {
                base_legal: "Art. 164.º, n.º 5 do CVM",
                criterio: "CMC aprova ofertas baseada ESTRITAMENTE em LEGALIDADE",
                nao_garante: "CMC NÃO garante situação econômica, viabilidade ou qualidade dos valores",
                responsabilidade: "Emitente é totalmente responsável pela veracidade das informações"
            }
        };

        // ============================================
        // INICIALIZAÇÃO DO SIMULADOR
        // ============================================
        document.addEventListener('DOMContentLoaded', function() {
            inicializarEventListeners();
            inicializarSliders();
            inicializarAccordion();
        });

        function inicializarEventListeners() {
            // Navegação entre fases
            document.getElementById('btnIniciar').addEventListener('click', () => mudarFase('configuracao'));
            document.getElementById('btnVoltarIntro').addEventListener('click', () => mudarFase('introducao'));
            document.getElementById('btnVoltarConfig').addEventListener('click', () => mudarFase('configuracao'));
            document.getElementById('btnVoltarEducacao').addEventListener('click', () => mudarFase('educacao'));
            
            // Formulário de configuração
            document.getElementById('formConfiguracao').addEventListener('submit', function(e) {
                e.preventDefault();
                processarConfiguracao();
                mudarFase('educacao');
            });
            
            // Educação
            document.getElementById('btnAvancarEtapa').addEventListener('click', avancarEtapaEducacao);
            document.getElementById('btnPularParaOPV').addEventListener('click', () => mudarFase('opv'));
            
            // Mercado secundário
            document.getElementById('btnIrMercadoSecundario').addEventListener('click', iniciarMercadoSecundario);
            document.getElementById('btnReiniciarSimulacao').addEventListener('click', reiniciarSimulacao);
            
            // Eventos corporativos
            document.querySelectorAll('.evento-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const evento = this.getAttribute('data-evento');
                    acionarEventoCorporativo(evento);
                });
            });
            
            // Dividendos
            document.getElementById('btnDistribuirDividendos').addEventListener('click', distribuirDividendos);
            
            // Emissão de ações
            document.getElementById('btnEmitirAcoes').addEventListener('click', emitirAcoes);
            
            // Recompra de ações
            document.getElementById('btnRecomprarAcoes').addEventListener('click', recomprarAcoes);
            
            // Tipo de emissão
            document.querySelectorAll('input[name="tipoEmissao"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    const tipo = this.value;
                    document.getElementById('tipoAcaoGroup').classList.toggle('hidden', tipo !== 'acoes' && tipo !== 'hibrido');
                });
            });
            
            // Concluir OPV
            document.getElementById('btnConcluirOPV').addEventListener('click', concluirOPV);
        }

        function inicializarSliders() {
            const alcanceSlider = document.getElementById('alcancePercentual');
            const alcanceValue = document.getElementById('alcancePercentualValue');
            
            alcanceSlider.addEventListener('input', function() {
                alcanceValue.textContent = `${this.value}%`;
            });
            
            const dividendosSlider = document.getElementById('percentualDividendos');
            const dividendosValue = document.getElementById('percentualDividendosValue');
            
            dividendosSlider.addEventListener('input', function() {
                dividendosValue.textContent = `${this.value}%`;
                atualizarAlertaDividendos(parseInt(this.value));
            });
            
            const emissaoSlider = document.getElementById('percentualRetidas');
            const emissaoValue = document.getElementById('percentualRetidasValue');
            
            emissaoSlider.addEventListener('input', function() {
                emissaoValue.textContent = `${this.value}%`;
                atualizarAlertaEmissao(parseInt(this.value));
            });
            
            const recompraSlider = document.getElementById('percentualRecompra');
            const recompraValue = document.getElementById('percentualRecompraValue');
            
            recompraSlider.addEventListener('input', function() {
                recompraValue.textContent = `${this.value}%`;
                calcularCustoRecompra();
            });
            
            // Calcular custo inicial da recompra
            calcularCustoRecompra();
        }

        function inicializarAccordion() {
            document.querySelectorAll('.accordion-header').forEach(header => {
                header.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const isOpen = content.classList.contains('aberto');
                    
                    // Fechar todos os outros
                    document.querySelectorAll('.accordion-content').forEach(item => {
                        item.classList.remove('aberto');
                    });
                    
                    // Abrir/fechar este
                    if (!isOpen) {
                        content.classList.add('aberto');
                    }
                    
                    // Atualizar seta
                    const arrow = this.querySelector('span:last-child');
                    arrow.textContent = isOpen ? '▼' : '▲';
                });
            });
        }

        // ============================================
        // GERENCIAMENTO DE FASES
        // ============================================
        function mudarFase(faseDestino) {
            // Esconder todas as fases
            document.querySelectorAll('.fase').forEach(fase => {
                fase.classList.add('hidden');
            });
            
            // Mostrar fase de destino
            document.getElementById(`fase-${faseDestino}`).classList.remove('hidden');
            estadoSimulador.faseAtual = faseDestino;
            
            // Ações específicas para cada fase
            switch(faseDestino) {
                case 'configuracao':
                    atualizarEtapas(1);
                    break;
                case 'educacao':
                    atualizarEtapas(2);
                    break;
                case 'opv':
                    atualizarEtapas(3);
                    carregarFormularioOPV();
                    break;
                case 'conclusao-opv':
                    atualizarEtapas(3);
                    mostrarResumoOPV();
                    break;
                case 'mercado-secundario':
                    atualizarEtapas(4);
                    iniciarSimulacaoMercado();
                    break;
            }
        }

        function atualizarEtapas(etapaAtiva) {
            document.querySelectorAll('.etapa').forEach((etapa, index) => {
                etapa.classList.remove('ativa', 'etapa-concluida');
                
                if (index + 1 === etapaAtiva) {
                    etapa.classList.add('ativa');
                } else if (index + 1 < etapaAtiva) {
                    etapa.classList.add('etapa-concluida');
                }
            });
        }

        // ============================================
        // PROCESSAMENTO DA CONFIGURAÇÃO
        // ============================================
        function processarConfiguracao() {
            // Coletar dados do formulário
            estadoSimulador.configuracao = {
                nomeEmpresa: document.getElementById('nomeEmpresa').value,
                nomePresidente: document.getElementById('nomePresidente').value,
                provincia: document.getElementById('provincia').value,
                setor: document.getElementById('setor').value,
                cenarioEconomico: document.getElementById('cenarioEconomico').value,
                capitalSocial: parseInt(document.getElementById('capitalSocial').value),
                tipoEmissao: document.querySelector('input[name="tipoEmissao"]:checked').value,
                tipoAcao: document.querySelector('input[name="tipoAcao"]:checked')?.value || null,
                alcance: document.querySelector('input[name="alcance"]:checked').value,
                alcancePercentual: parseInt(document.getElementById('alcancePercentual').value)
            };
            
            // Criar objeto empresa inicial
            estadoSimulador.empresa = {
                nome: estadoSimulador.configuracao.nomeEmpresa,
                presidente: estadoSimulador.configuracao.nomePresidente,
                provincia: estadoSimulador.configuracao.provincia,
                setor: estadoSimulador.configuracao.setor,
                capitalSocial: estadoSimulador.configuracao.capitalSocial,
                tipoEmissao: estadoSimulador.configuracao.tipoEmissao,
                tipoAcao: estadoSimulador.configuracao.tipoAcao,
                cenarioEconomico: estadoSimulador.configuracao.cenarioEconomico,
                alcanceInvestidores: calcularInvestidoresPotenciais(),
                dataFundacao: new Date().toISOString().split('T')[0]
            };
            
            // Gerar ticker baseado no nome da empresa
            estadoSimulador.empresa.ticker = gerarTicker(estadoSimulador.empresa.nome);
        }

        function calcularInvestidoresPotenciais() {
            const base = estadoSimulador.configuracao.alcance === 'angola' ? 26600000 : 7000000000;
            const percentual = estadoSimulador.configuracao.alcancePercentual / 100;
            return Math.round(base * percentual);
        }

        function gerarTicker(nomeEmpresa) {
            // Extrair iniciais e limitar a 4 caracteres
            const palavras = nomeEmpresa.split(' ');
            let ticker = '';
            
            for (let palavra of palavras) {
                if (palavra.length > 0 && /[A-Za-z]/.test(palavra[0])) {
                    ticker += palavra[0].toUpperCase();
                }
            }
            
            // Adicionar número se necessário para ter 4 caracteres
            while (ticker.length < 4) {
                ticker += 'X';
            }
            
            // Limitar a 4 caracteres
            ticker = ticker.substring(0, 4);
            
            return ticker + '.BA';
        }

        // ============================================
        // PROCESSO EDUCACIONAL
        // ============================================
        let etapaEducacaoAtual = 1;
        const totalEtapasEducacao = 10;

        function avancarEtapaEducacao() {
            // Esconder etapa atual
            document.getElementById(`etapa-${etapaEducacaoAtual}`).classList.remove('ativa');
            document.getElementById(`etapa-${etapaEducacaoAtual}`).classList.add('hidden');
            
            // Avançar etapa
            etapaEducacaoAtual++;
            
            // Se chegou ao fim, ir para OPV
            if (etapaEducacaoAtual > totalEtapasEducacao) {
                mudarFase('opv');
                return;
            }
            
            // Mostrar próxima etapa
            document.getElementById(`etapa-${etapaEducacaoAtual}`).classList.remove('hidden');
            document.getElementById(`etapa-${etapaEducacaoAtual}`).classList.add('ativa');
            
            // Atualizar botão se for a última etapa
            const btnAvancar = document.getElementById('btnAvancarEtapa');
            if (etapaEducacaoAtual === totalEtapasEducacao) {
                btnAvancar.textContent = 'CONCLUIR EDUCAÇÃO ➡️';
            }
        }

        // ============================================
        // MERCADO PRIMÁRIO (OPV)
        // ============================================
        function carregarFormularioOPV() {
            const container = document.getElementById('opvContainer');
            const tipoEmissao = estadoSimulador.configuracao.tipoEmissao;
            
            let html = '';
            
            if (tipoEmissao === 'acoes' || tipoEmissao === 'hibrido') {
                html += `
                    <h3>Configuração da Emissão de Ações</h3>
                    <div class="form-group">
                        <label for="totalAcoes">Total de ações a emitir:</label>
                        <input type="number" id="totalAcoes" min="1000" value="1000000">
                        <small>Número total de ações da empresa (incluindo as que não serão ofertadas)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="acoesPublico">Ações que irão a público:</label>
                        <input type="number" id="acoesPublico" min="100" value="200000">
                        <small>Quantidade de ações disponíveis para investidores (free float)</small>
                        <div id="percentualFreeFloat" class="slider-value">20%</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="precoNominalAcao">Preço nominal por ação (AOA):</label>
                        <input type="number" id="precoNominalAcao" min="10" value="100">
                        <small>Preço inicial de cada ação na OPV</small>
                    </div>
                    
                    <div class="metricas-container" id="calculosAcoes">
                        <!-- Cálculos serão atualizados dinamicamente -->
                    </div>
                `;
            }
            
            if (tipoEmissao === 'obrigacoes' || tipoEmissao === 'hibrido') {
                if (tipoEmissao === 'hibrido') {
                    html += '<hr class="mt-30 mb-30">';
                }
                
                html += `
                    <h3>Configuração da Emissão de Obrigações</h3>
                    <div class="form-group">
                        <label for="totalObrigacoes">Total de obrigações:</label>
                        <input type="number" id="totalObrigacoes" min="100" value="50000">
                        <small>Número total de obrigações a emitir</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="valorNominalObrigacao">Valor nominal por obrigação (AOA):</label>
                        <input type="number" id="valorNominalObrigacao" min="1000" value="10000">
                        <small>Valor de face de cada obrigação</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="taxaJuros">Taxa de juros (% a.a.):</label>
                        <input type="number" id="taxaJuros" min="1" max="30" step="0.1" value="12">
                        <small>Taxa de juros anual sobre o valor nominal</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="prazoMaturidade">Prazo de maturidade:</label>
                        <input type="range" id="prazoMaturidade" min="6" max="60" step="6" value="24">
                        <div class="slider-value" id="prazoMaturidadeValue">24 meses (2 anos)</div>
                        <small>Período até o vencimento das obrigações (6 meses a 5 anos)</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="loteMinimo">Lote mínimo:</label>
                        <input type="number" id="loteMinimo" min="1" value="10">
                        <small>Número mínimo de obrigações por transação</small>
                    </div>
                    
                    <div class="alert alert-warning" id="alertaMontanteMinimo" style="display: none;">
                        <strong>⚠️ ATENÇÃO:</strong> Montante mínimo para listagem de obrigações na BODIVA é AOA 60.000.000,00
                    </div>
                    
                    <div class="metricas-container" id="calculosObrigacoes">
                        <!-- Cálculos serão atualizados dinamicamente -->
                    </div>
                `;
            }
            
            if (tipoEmissao === 'hibrido') {
                html += `
                    <hr class="mt-30 mb-30">
                    <h3>Ordem de Emissão - Modo Híbrido</h3>
                    <div class="form-group">
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" id="ordemAcoesPrimeiro" name="ordemEmissao" value="acoes" checked>
                                <label for="ordemAcoesPrimeiro">Ações primeiro, depois Obrigações</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" id="ordemObrigacoesPrimeiro" name="ordemEmissao" value="obrigacoes">
                                <label for="ordemObrigacoesPrimeiro">Obrigações primeiro, depois Ações</label>
                            </div>
                        </div>
                        <small>A ordem pode influenciar a percepção do mercado sobre a estratégia de captação</small>
                    </div>
                `;
            }
            
            container.innerHTML = html;
            
            // Adicionar listeners para os novos inputs
            adicionarListenersOPV();
            atualizarCalculosOPV();
        }

        function adicionarListenersOPV() {
            // Listeners para atualizar cálculos em tempo real
            const inputsOPV = ['totalAcoes', 'acoesPublico', 'precoNominalAcao', 'totalObrigacoes', 'valorNominalObrigacao', 'taxaJuros', 'prazoMaturidade', 'loteMinimo'];
            
            inputsOPV.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', atualizarCalculosOPV);
                }
            });
            
            // Listener especial para o slider de prazo
            const prazoSlider = document.getElementById('prazoMaturidade');
            const prazoValue = document.getElementById('prazoMaturidadeValue');
            
            if (prazoSlider) {
                prazoSlider.addEventListener('input', function() {
                    const meses = parseInt(this.value);
                    const anos = meses / 12;
                    prazoValue.textContent = `${meses} meses (${anos.toFixed(1)} anos)`;
                    atualizarCalculosOPV();
                });
            }
        }

        function atualizarCalculosOPV() {
            const tipoEmissao = estadoSimulador.configuracao.tipoEmissao;
            
            // Cálculos para ações (se aplicável)
            if (tipoEmissao === 'acoes' || tipoEmissao === 'hibrido') {
                const totalAcoes = parseInt(document.getElementById('totalAcoes')?.value) || 0;
                const acoesPublico = parseInt(document.getElementById('acoesPublico')?.value) || 0;
                const precoNominal = parseInt(document.getElementById('precoNominalAcao')?.value) || 0;
                
                const percentualFreeFloat = totalAcoes > 0 ? (acoesPublico / totalAcoes * 100).toFixed(1) : 0;
                const capitalCaptar = acoesPublico * precoNominal;
                const valorMercado = totalAcoes * precoNominal;
                
                // Atualizar display do percentual
                const percentualElement = document.getElementById('percentualFreeFloat');
                if (percentualElement) {
                    percentualElement.textContent = `${percentualFreeFloat}%`;
                }
                
                // Atualizar cálculos
                const calculosAcoes = document.getElementById('calculosAcoes');
                if (calculosAcoes) {
                    calculosAcoes.innerHTML = `
                        <div class="metrica-card">
                            <div>Capital a captar:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(capitalCaptar)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Valor de mercado inicial:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(valorMercado)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Free float:</div>
                            <div class="metrica-valor">${percentualFreeFloat}%</div>
                        </div>
                    `;
                }
                
                // Salvar dados para uso posterior
                if (!estadoSimulador.opv.acoes) estadoSimulador.opv.acoes = {};
                estadoSimulador.opv.acoes = {
                    totalAcoes,
                    acoesPublico,
                    precoNominal,
                    percentualFreeFloat: parseFloat(percentualFreeFloat),
                    capitalCaptar,
                    valorMercado
                };
            }
            
            // Cálculos para obrigações (se aplicável)
            if (tipoEmissao === 'obrigacoes' || tipoEmissao === 'hibrido') {
                const totalObrigacoes = parseInt(document.getElementById('totalObrigacoes')?.value) || 0;
                const valorNominal = parseInt(document.getElementById('valorNominalObrigacao')?.value) || 0;
                const taxaJuros = parseFloat(document.getElementById('taxaJuros')?.value) || 0;
                const prazoMeses = parseInt(document.getElementById('prazoMaturidade')?.value) || 0;
                const loteMinimo = parseInt(document.getElementById('loteMinimo')?.value) || 0;
                
                const capitalCaptar = totalObrigacoes * valorNominal;
                const prazoAnos = prazoMeses / 12;
                const jurosTotal = capitalCaptar * (taxaJuros / 100) * prazoAnos;
                const dividaTotal = capitalCaptar + jurosTotal;
                const cupomPeriodico = valorNominal * (taxaJuros / 100) * (prazoMeses / 12) / prazoMeses;
                const investimentoMinimo = loteMinimo * valorNominal;
                
                // Verificar montante mínimo
                const alertaMontante = document.getElementById('alertaMontanteMinimo');
                if (alertaMontante) {
                    alertaMontante.style.display = capitalCaptar < 60000000 ? 'block' : 'none';
                }
                
                // Atualizar cálculos
                const calculosObrigacoes = document.getElementById('calculosObrigacoes');
                if (calculosObrigacoes) {
                    calculosObrigacoes.innerHTML = `
                        <div class="metrica-card">
                            <div>Capital a captar:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(capitalCaptar)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Total de juros a pagar:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(jurosTotal)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Dívida total (principal + juros):</div>
                            <div class="metrica-valor">AOA ${formatarNumero(dividaTotal)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Cupom por período:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(cupomPeriodico)}</div>
                        </div>
                        <div class="metrica-card">
                            <div>Investimento mínimo:</div>
                            <div class="metrica-valor">AOA ${formatarNumero(investimentoMinimo)}</div>
                        </div>
                    `;
                }
                
                // Salvar dados para uso posterior
                if (!estadoSimulador.opv.obrigacoes) estadoSimulador.opv.obrigacoes = {};
                estadoSimulador.opv.obrigacoes = {
                    totalObrigacoes,
                    valorNominal,
                    taxaJuros,
                    prazoMeses,
                    prazoAnos,
                    loteMinimo,
                    capitalCaptar,
                    jurosTotal,
                    dividaTotal,
                    cupomPeriodico,
                    investimentoMinimo
                };
            }
        }

        function concluirOPV() {
            // Validar dados da OPV
            const tipoEmissao = estadoSimulador.configuracao.tipoEmissao;
            let valido = true;
            
            if (tipoEmissao === 'obrigacoes' || tipoEmissao === 'hibrido') {
                const capitalCaptar = estadoSimulador.opv.obrigacoes?.capitalCaptar || 0;
                if (capitalCaptar < 60000000) {
                    alert('Para emissão de obrigações, o montante mínimo é AOA 60.000.000,00. Ajuste os valores e tente novamente.');
                    valido = false;
                }
            }
            
            if (valido) {
                // Salvar ordem de emissão se for híbrido
                if (tipoEmissao === 'hibrido') {
                    estadoSimulador.opv.ordemEmissao = document.querySelector('input[name="ordemEmissao"]:checked').value;
                }
                
                // Inicializar dados de mercado
                if (tipoEmissao === 'acoes' || tipoEmissao === 'hibrido') {
                    estadoSimulador.mercado.precoAtual = estadoSimulador.opv.acoes.precoNominal;
                    estadoSimulador.mercado.precoAnterior = estadoSimulador.opv.acoes.precoNominal;
                    
                    // Inicializar histórico de preços
                    for (let i = 0; i < 30; i++) {
                        estadoSimulador.mercado.historicoPrecos.push({
                            tempo: i,
                            preco: estadoSimulador.opv.acoes.precoNominal * (0.95 + Math.random() * 0.1)
                        });
                    }
                }
                
                mudarFase('conclusao-opv');
            }
        }

        function mostrarResumoOPV() {
            const container = document.getElementById('resumoOPV');
            const tipoEmissao = estadoSimulador.configuracao.tipoEmissao;
            
            let html = '';
            
            html += `
                <div class="metrica-card">
                    <div>Nome da Empresa:</div>
                    <div class="metrica-valor">${estadoSimulador.empresa.nome}</div>
                </div>
                
                <div class="metrica-card">
                    <div>Ticker:</div>
                    <div class="metrica-valor">${estadoSimulador.empresa.ticker}</div>
                </div>
                
                <div class="metrica-card">
                    <div>Tipo de Emissão:</div>
                    <div class="metrica-valor">${tipoEmissao === 'acoes' ? 'Ações' : tipoEmissao === 'obrigacoes' ? 'Obrigações' : 'Híbrido'}</div>
                </div>
            `;
            
            if (tipoEmissao === 'acoes' || tipoEmissao === 'hibrido') {
                html += `
                    <div class="metrica-card">
                        <div>Capital captado (Ações):</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.acoes.capitalCaptar)}</div>
                    </div>
                    
                    <div class="metrica-card">
                        <div>Valor de mercado inicial:</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.acoes.valorMercado)}</div>
                    </div>
                    
                    <div class="metrica-card">
                        <div>Preço inicial por ação:</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.acoes.precoNominal)}</div>
                    </div>
                `;
            }
            
            if (tipoEmissao === 'obrigacoes' || tipoEmissao === 'hibrido') {
                html += `
                    <div class="metrica-card">
                        <div>Capital captado (Obrigações):</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.obrigacoes.capitalCaptar)}</div>
                    </div>
                    
                    <div class="metrica-card">
                        <div>Total de dívida (capital + juros):</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.obrigacoes.dividaTotal)}</div>
                    </div>
                    
                    <div class="metrica-card">
                        <div>Taxa de juros anual:</div>
                        <div class="metrica-valor">${estadoSimulador.opv.obrigacoes.taxaJuros}%</div>
                    </div>
                `;
            }
            
            if (tipoEmissao === 'hibrido') {
                html += `
                    <div class="metrica-card">
                        <div>Ordem de emissão:</div>
                        <div class="metrica-valor">${estadoSimulador.opv.ordemEmissao === 'acoes' ? 'Ações primeiro' : 'Obrigações primeiro'}</div>
                    </div>
                    
                    <div class="metrica-card">
                        <div>Capital total captado:</div>
                        <div class="metrica-valor">AOA ${formatarNumero(estadoSimulador.opv.acoes.capitalCaptar + estadoSimulador.opv.obrigacoes.capitalCaptar)}</div>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }

        // ============================================
        // MERCADO SECUNDÁRIO
        // ============================================
        function iniciarMercadoSecundario() {
            mudarFase('mercado-secundario');
        }

        function iniciarSimulacaoMercado() {
            // Atualizar informações da empresa no cabeçalho
            atualizarInformacoesEmpresa();
            
            // Mostrar/ocultar seções conforme tipo de emissão
            const tipoEmissao = estadoSimulador.configuracao.tipoEmissao;
            
            if (tipoEmissao === 'acoes' || tipoEmissao === 'hibrido') {
                document.getElementById('carteiraAcoes').classList.remove('hidden');
                atualizarMetricasAcoes();
            }
            
            if (tipoEmissao === 'obrigacoes' || tipoEmissao === 'hibrido') {
                document.getElementById('carteiraObrigacoes').classList.remove('hidden');
                atualizarMetricasObrigacoes();
            }
            
            if (tipoEmissao === 'hibrido') {
                document.getElementById('alertasHibrido').classList.remove('hidden');
                atualizarAlertasHibrido();
            }
            
            // Inicializar gráfico
            inicializarGrafico();
            
            // Iniciar loops de atualização
            estadoSimulador.intervaloGrafico = setInterval(atualizarMercado, 3000); // A cada 3 segundos
            estadoSimulador.intervaloNoticias = setInterval(rotacionarNoticias, 10000); // A cada 10 segundos
            
            // Atualizar tempo de simulação
            estadoSimulador.intervaloTempo = setInterval(() => {
                estadoSimulador.tempoSimulacao += 1;
            }, 3000);
        }

        function atualizarInformacoesEmpresa() {
            const container = document.getElementById('empresaInfoHeader');
            const empresa = estadoSimulador.empresa;
            
            container.innerHTML = `
                <div class="info-item">
                    <span>🏢</span>
                    <span><strong>Empresa:</strong> ${empresa.nome}</span>
                </div>
                
                <div class="info-item">
                    <span>👔</span>
                    <span><strong>Presidente:</strong> ${empresa.presidente}</span>
                </div>
                
                <div class="info-item">
                    <span>🏭</span>
                    <span><strong>Setor:</strong> ${empresa.setor}</span>
                </div>
                
                <div class="info-item">
                    <span>📍</span>
                    <span><strong>Província:</strong> ${empresa.provincia}</span>
                </div>
                
                <div class="info-item">
                    <span>📊</span>
                    <span><strong>Tipo:</strong> ${estadoSimulador.configuracao.tipoEmissao === 'acoes' ? 'Ações' : estadoSimulador.configuracao.tipoEmissao === 'obrigacoes' ? 'Obrigações' : 'Híbrido'}</span>
                </div>
            `;
            
            // Atualizar também no gráfico
            document.getElementById('infoEmpresaGrafico').textContent = empresa.nome;
            document.getElementById('infoTickerGrafico').textContent = empresa.ticker;
        }

        function atualizarMetricasAcoes() {
            const container = document.getElementById('metricasAcoes');
            
            if (!container) return;
            
            const preco = estadoSimulador.mercado.precoAtual;
            const variacao = estadoSimulador.mercado.variacaoPercentual;
            const valorMercado = estadoSimulador.opv.acoes.totalAcoes * preco;
            const valorCirculacao = estadoSimulador.opv.acoes.acoesPublico * preco;
            const percentualCirculacao = (estadoSimulador.opv.acoes.acoesPublico / estadoSimulador.opv.acoes.totalAcoes * 100).toFixed(1);
            
            // Calcular LPA (Lucro por Ação) baseado no lucro anual
            const lucroAnual = parseInt(document.getElementById('lucroAnual')?.value) || 100000000;
            const lpa = estadoSimulador.opv.acoes.totalAcoes > 0 ? lucroAnual / estadoSimulador.opv.acoes.totalAcoes : 0;
            
            // Calcular P/L
            const pl = preco > 0 ? (preco / lpa).toFixed(1) : 0;
            
            // Calcular ROI (simplificado)
            const precoInicial = estadoSimulador.opv.acoes.precoNominal;
            const roi = precoInicial > 0 ? ((preco - precoInicial) / precoInicial * 100).toFixed(1) : 0;
            
            // Atualizar estado
            estadoSimulador.mercado.lpa = lpa;
            estadoSimulador.mercado.pl = pl;
            estadoSimulador.mercado.roi = roi;
            estadoSimulador.mercado.dividendYield = 0; // Será atualizado quando dividendos forem distribuídos
            
            container.innerHTML = `
                <div class="metrica-card">
                    <div>💰 Valor de Mercado</div>
                    <div class="metrica-valor">AOA ${formatarNumero(valorMercado)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>📊 Valor em Circulação</div>
                    <div class="metrica-valor">AOA ${formatarNumero(valorCirculacao)} (${percentualCirculacao}%)</div>
                </div>
                
                <div class="metrica-card">
                    <div>📈 Preço Atual da Ação</div>
                    <div class="metrica-valor ${variacao >= 0 ? 'positivo' : 'negativo'}">AOA ${formatarNumero(preco)}</div>
                    <div class="${variacao >= 0 ? 'positivo' : 'negativo'}">${variacao >= 0 ? '+' : ''}${variacao.toFixed(2)}%</div>
                </div>
                
                <div class="metrica-card">
                    <div>📉 Beta (β)</div>
                    <div class="metrica-valor">${estadoSimulador.mercado.beta.toFixed(2)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>💵 Dividend Yield</div>
                    <div class="metrica-valor">${estadoSimulador.mercado.dividendYield.toFixed(2)}%</div>
                </div>
                
                <div class="metrica-card">
                    <div>📊 Lucro por Ação (LPA)</div>
                    <div class="metrica-valor">AOA ${formatarNumero(lpa)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>📊 P/L Ratio</div>
                    <div class="metrica-valor">${pl}</div>
                </div>
                
                <div class="metrica-card">
                    <div>💰 ROI</div>
                    <div class="metrica-valor ${roi >= 0 ? 'positivo' : 'negativo'}">${roi}%</div>
                </div>
            `;
        }

        function atualizarMetricasObrigacoes() {
            const container = document.getElementById('metricasObrigacoes');
            
            if (!container) return;
            
            const obrigacoes = estadoSimulador.opv.obrigacoes;
            
            container.innerHTML = `
                <div class="metrica-card">
                    <div>📄 Total emitido</div>
                    <div class="metrica-valor">${formatarNumero(obrigacoes.totalObrigacoes)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>💰 Valor nominal/unidade</div>
                    <div class="metrica-valor">AOA ${formatarNumero(obrigacoes.valorNominal)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>📊 Total captado</div>
                    <div class="metrica-valor">AOA ${formatarNumero(obrigacoes.capitalCaptar)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>💵 Taxa de juros (% a.a.)</div>
                    <div class="metrica-valor">${obrigacoes.taxaJuros}%</div>
                </div>
                
                <div class="metrica-card">
                    <div>📅 Maturidade</div>
                    <div class="metrica-valor">${obrigacoes.prazoMeses} meses</div>
                </div>
                
                <div class="metrica-card">
                    <div>🔄 Cupom (periódico)</div>
                    <div class="metrica-valor">AOA ${formatarNumero(obrigacoes.cupomPeriodico)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>⚠️ Passivo total</div>
                    <div class="metrica-valor">AOA ${formatarNumero(obrigacoes.dividaTotal)}</div>
                </div>
                
                <div class="metrica-card">
                    <div>📈 Lote mínimo</div>
                    <div class="metrica-valor">${obrigacoes.loteMinimo} un.</div>
                </div>
                
                <div class="metrica-card">
                    <div>💸 Investimento mínimo</div>
                    <div class="metrica-valor">AOA ${formatarNumero(obrigacoes.investimentoMinimo)}</div>
                </div>
            `;
        }

        function atualizarAlertasHibrido() {
            const container = document.getElementById('alertasHibridoConteudo');
            
            if (!container) return;
            
            // Calcular índice de endividamento
            const dividaTotal = estadoSimulador.opv.obrigacoes.dividaTotal;
            const patrimonioLiquido = estadoSimulador.opv.acoes.valorMercado;
            const indiceEndividamento = patrimonioLiquido > 0 ? (dividaTotal / patrimonioLiquido * 100).toFixed(1) : 0;
            
            // Calcular cobertura de juros
            const lucroOperacional = parseInt(document.getElementById('lucroAnual')?.value) || 100000000;
            const despesaJuros = estadoSimulador.opv.obrigacoes.jurosTotal / estadoSimulador.opv.obrigacoes.prazoAnos;
            const coberturaJuros = despesaJuros > 0 ? (lucroOperacional / despesaJuros).toFixed(1) : 0;
            
            // Determinar alertas
            let alertaEndividamento = '';
            let classeEndividamento = 'neutro';
            
            if (indiceEndividamento < 50) {
                alertaEndividamento = 'Saudável';
            } else if (indiceEndividamento < 100) {
                alertaEndividamento = 'Moderado';
                classeEndividamento = 'alerta';
            } else if (indiceEndividamento < 200) {
                alertaEndividamento = '⚠️ ALTO';
                classeEndividamento = 'alerta';
            } else {
                alertaEndividamento = '⚠️ CRÍTICO';
                classeEndividamento = 'negativo';
            }
            
            let alertaCobertura = '';
            let classeCobertura = 'neutro';
            
            if (coberturaJuros > 3.0) {
                alertaCobertura = 'Excelente';
                classeCobertura = 'positivo';
            } else if (coberturaJuros > 1.5) {
                alertaCobertura = 'Adequado';
            } else {
                alertaCobertura = '⚠️ DIFICULDADE EM PAGAR JUROS';
                classeCobertura = 'negativo';
            }
            
            container.innerHTML = `
                <div class="metrica-card">
                    <div>Índice de Endividamento</div>
                    <div class="metrica-valor ${classeEndividamento}">${indiceEndividamento}%</div>
                    <div class="${classeEndividamento}">${alertaEndividamento}</div>
                </div>
                
                <div class="metrica-card">
                    <div>Cobertura de Juros</div>
                    <div class="metrica-valor ${classeCobertura}">${coberturaJuros}</div>
                    <div class="${classeCobertura}">${alertaCobertura}</div>
                </div>
            `;
        }

        // ============================================
        // GRÁFICO EM TEMPO REAL
        // ============================================
        let graficoCtx = null;
        let dadosGrafico = [];

        function inicializarGrafico() {
            const canvas = document.getElementById('canvasGrafico');
            graficoCtx = canvas.getContext('2d');
            
            // Ajustar tamanho do canvas
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            
            // Inicializar dados do gráfico
            dadosGrafico = estadoSimulador.mercado.historicoPrecos.map(ponto => ponto.preco);
            
            // Desenhar gráfico inicial
            desenharGrafico();
        }

        function desenharGrafico() {
            if (!graficoCtx) return;
            
            const canvas = document.getElementById('canvasGrafico');
            const width = canvas.width;
            const height = canvas.height;
            const padding = 40;
            const graficoWidth = width - padding * 2;
            const graficoHeight = height - padding * 2;
            
            // Limpar canvas
            graficoCtx.clearRect(0, 0, width, height);
            
            // Desenhar fundo
            graficoCtx.fillStyle = 'rgba(0, 0, 0, 0)';
            graficoCtx.fillRect(0, 0, width, height);
            
            // Calcular valores para escalas
            const dados = dadosGrafico.slice(-30); // Últimos 30 pontos
            const maxValor = Math.max(...dados);
            const minValor = Math.min(...dados);
            const valorRange = maxValor - minValor || 1;
            
            // Desenhar grade
            graficoCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            graficoCtx.lineWidth = 1;
            
            // Linhas horizontais
            for (let i = 0; i <= 5; i++) {
                const y = padding + (graficoHeight * (1 - i/5));
                graficoCtx.beginPath();
                graficoCtx.moveTo(padding, y);
                graficoCtx.lineTo(width - padding, y);
                graficoCtx.stroke();
                
                // Valor da linha
                graficoCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                graficoCtx.font = '12px Arial';
                const valor = minValor + (valorRange * i/5);
                graficoCtx.fillText(formatarNumero(valor), 5, y + 4);
            }
            
            // Linhas verticais (tempo)
            for (let i = 0; i <= 5; i++) {
                const x = padding + (graficoWidth * i/5);
                graficoCtx.beginPath();
                graficoCtx.moveTo(x, padding);
                graficoCtx.lineTo(x, height - padding);
                graficoCtx.stroke();
            }
            
            // Desenhar linha do gráfico
            if (dados.length > 1) {
                graficoCtx.beginPath();
                graficoCtx.strokeStyle = estadoSimulador.mercado.variacaoPercentual >= 0 ? '#00FF00' : '#FF0000';
                graficoCtx.lineWidth = 2;
                
                for (let i = 0; i < dados.length; i++) {
                    const x = padding + (graficoWidth * i / (dados.length - 1));
                    const y = padding + graficoHeight * (1 - (dados[i] - minValor) / valorRange);
                    
                    if (i === 0) {
                        graficoCtx.moveTo(x, y);
                    } else {
                        graficoCtx.lineTo(x, y);
                    }
                }
                
                graficoCtx.stroke();
                
                // Desenhar pontos
                for (let i = 0; i < dados.length; i++) {
                    const x = padding + (graficoWidth * i / (dados.length - 1));
                    const y = padding + graficoHeight * (1 - (dados[i] - minValor) / valorRange);
                    
                    graficoCtx.beginPath();
                    graficoCtx.arc(x, y, 3, 0, Math.PI * 2);
                    graficoCtx.fillStyle = estadoSimulador.mercado.variacaoPercentual >= 0 ? '#00FF00' : '#FF0000';
                    graficoCtx.fill();
                }
            }
            
            // Títulos
            graficoCtx.fillStyle = '#FFFFFF';
            graficoCtx.font = '14px Arial';
            graficoCtx.fillText('Preço da Ação (AOA)', width / 2 - 50, 20);
            
            // Legenda do tempo
            graficoCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            graficoCtx.font = '12px Arial';
            graficoCtx.fillText('Tempo →', width - 50, height - 10);
        }

        // ============================================
        // ATUALIZAÇÃO DO MERCADO
        // ============================================
        function atualizarMercado() {
            // Atualizar preço com base no cenário e eventos
            const novoPreco = calcularNovoPreco();
            
            // Atualizar estado
            estadoSimulador.mercado.precoAnterior = estadoSimulador.mercado.precoAtual;
            estadoSimulador.mercado.precoAtual = novoPreco;
            estadoSimulador.mercado.variacaoPercentual = ((novoPreco - estadoSimulador.mercado.precoAnterior) / estadoSimulador.mercado.precoAnterior * 100);
            
            // Atualizar histórico
            estadoSimulador.mercado.historicoPrecos.push({
                tempo: estadoSimulador.mercado.historicoPrecos.length,
                preco: novoPreco
            });
            
            // Manter histórico limitado
            if (estadoSimulador.mercado.historicoPrecos.length > 100) {
                estadoSimulador.mercado.historicoPrecos.shift();
            }
            
            // Atualizar dados do gráfico
            dadosGrafico = estadoSimulador.mercado.historicoPrecos.map(ponto => ponto.preco);
            
            // Atualizar beta dinamicamente
            atualizarBeta();
            
            // Atualizar interface
            atualizarInterfaceMercado();
            
            // Verificar expiração de evento
            verificarExpiracoEvento();
        }

        function calcularNovoPreco() {
            const precoAtual = estadoSimulador.mercado.precoAtual || estadoSimulador.opv.acoes?.precoNominal || 100;
            const cenario = estadoSimulador.configuracao.cenarioEconomico;
            
            // Verificar se há evento especial ativo
            if (estadoSimulador.mercado.eventoAtivo && estadoSimulador.mercado.eventoExpiraEn > estadoSimulador.tempoSimulacao) {
                return aplicarEventoEspecial(precoAtual);
            }
            
            // Aplicar variação baseada no cenário
            let variacaoPercentual = 0;
            
            switch(cenario) {
                case 'estavel':
                    // Variações moderadas (±5%)
                    if (Math.random() > 0.5) {
                        variacaoPercentual = (Math.random() * 5); // 0 a +5%
                    } else {
                        variacaoPercentual = -(Math.random() * 5); // 0 a -5%
                    }
                    break;
                    
                case 'crescimento':
                    // Alta valorização frequente (10-20%)
                    if (Math.random() > 0.3) {
                        variacaoPercentual = 10 + (Math.random() * 10); // +10 a +20%
                    } else {
                        variacaoPercentual = -(Math.random() * 10); // 0 a -10%
                    }
                    break;
                    
                case 'instavel':
                    // Alta desvalorização frequente
                    if (Math.random() > 0.8) {
                        variacaoPercentual = Math.random() * 10; // 0 a +10%
                    } else {
                        variacaoPercentual = -(10 + Math.random() * 20); // -10 a -30%
                    }
                    break;
                    
                case 'angola-novo':
                    // Baixa volatilidade diária (2-5%)
                    variacaoPercentual = (Math.random() * 6) - 3; // -3 a +3%
                    break;
                    
                case 'angola-maduro':
                    // Alta volatilidade (-15% a +15%)
                    variacaoPercentual = (Math.random() * 30) - 15; // -15 a +15%
                    break;
                    
                default:
                    variacaoPercentual = (Math.random() * 10) - 5; // -5 a +5%
            }
            
            // Aplicar efeito de liquidez baseado no alcance
            const liquidez = calcularLiquidez();
            if (liquidez === 'alta') {
                variacaoPercentual += 1; // Tendência de valorização
            } else if (liquidez === 'baixa') {
                variacaoPercentual -= 1; // Tendência de desvalorização
            }
            
            // Calcular novo preço
            const novoPreco = precoAtual * (1 + variacaoPercentual / 100);
            
            return Math.max(novoPreco, 0.01); // Preço mínimo de 0.01 AOA
        }

        function calcularLiquidez() {
            const investidoresPotenciais = estadoSimulador.empresa.alcanceInvestidores;
            const acoesEmCirculacao = estadoSimulador.opv.acoes?.acoesPublico || 1;
            
            const taxa = investidoresPotenciais / acoesEmCirculacao;
            
            if (taxa > 100) return 'alta';
            if (taxa > 50) return 'media';
            return 'baixa';
        }

        function aplicarEventoEspecial(precoAtual) {
            const evento = estadoSimulador.mercado.eventoAtivo;
            
            switch(evento) {
                case 'lucro-recorde':
                    // Valorização: +15% a +30%
                    return precoAtual * (1.15 + Math.random() * 0.15);
                    
                case 'lucro-normal':
                    // Mantém padrão do cenário
                    return precoAtual * (0.99 + Math.random() * 0.02);
                    
                case 'lucro-abaixo':
                    // Desvalorização: -10% a -25%
                    return precoAtual * (0.75 + Math.random() * 0.15);
                    
                case 'escandalo':
                    // Desvalorização catastrófica: -30% a -50%
                    return precoAtual * (0.5 + Math.random() * 0.2);
                    
                case 'parceria':
                    // Valorização: +10% a +20%
                    return precoAtual * (1.1 + Math.random() * 0.1);
                    
                default:
                    return precoAtual;
            }
        }

        function atualizarBeta() {
            let beta = 1.0; // Beta padrão
            
            // Ajuste por cenário
            const cenario = estadoSimulador.configuracao.cenarioEconomico;
            switch(cenario) {
                case 'angola-maduro':
                case 'instavel':
                    beta += 0.5;
                    break;
                case 'angola-novo':
                    beta -= 0.3;
                    break;
                case 'crescimento':
                    beta += 0.2;
                    break;
            }
            
            // Ajuste por evento ativo
            if (estadoSimulador.mercado.eventoAtivo) {
                switch(estadoSimulador.mercado.eventoAtivo) {
                    case 'escandalo':
                        beta += 1.0;
                        break;
                    case 'lucro-recorde':
                        beta += 0.3;
                        break;
                    case 'parceria':
                        beta += 0.2;
                        break;
                }
            }
            
            estadoSimulador.mercado.beta = Math.max(beta, 0.1);
        }

        function atualizarInterfaceMercado() {
            // Atualizar informações do gráfico
            document.getElementById('infoPrecoAtualGrafico').textContent = `AOA ${formatarNumero(estadoSimulador.mercado.precoAtual)} (USD ${formatarNumero(estadoSimulador.mercado.precoAtual / 850)})`;
            document.getElementById('infoVariacaoGrafico').textContent = `${estadoSimulador.mercado.variacaoPercentual >= 0 ? '+' : ''}${estadoSimulador.mercado.variacaoPercentual.toFixed(2)}%`;
            
            // Aplicar classe de cor
            const variacaoElement = document.getElementById('infoVariacaoGrafico');
            const precoElement = document.getElementById('infoPrecoAtualGrafico');
            
            if (estadoSimulador.mercado.variacaoPercentual >= 0) {
                variacaoElement.className = 'positivo';
                precoElement.className = 'positivo';
            } else {
                variacaoElement.className = 'negativo';
                precoElement.className = 'negativo';
            }
            
            // Atualizar hora da última atualização
            const agora = new Date();
            document.getElementById('infoAtualizacaoGrafico').textContent = agora.toLocaleTimeString('pt-PT');
            
            // Atualizar métricas de ações
            if (estadoSimulador.configuracao.tipoEmissao === 'acoes' || estadoSimulador.configuracao.tipoEmissao === 'hibrido') {
                atualizarMetricasAcoes();
            }
            
            // Atualizar alertas híbridos
            if (estadoSimulador.configuracao.tipoEmissao === 'hibrido') {
                atualizarAlertasHibrido();
            }
            
            // Redesenhar gráfico
            desenharGrafico();
        }

        function verificarExpiracoEvento() {
            if (estadoSimulador.mercado.eventoAtivo && estadoSimulador.mercado.eventoExpiraEn <= estadoSimulador.tempoSimulacao) {
                estadoSimulador.mercado.eventoAtivo = null;
                estadoSimulador.mercado.eventoExpiraEn = null;
                
                // Mostrar notificação de evento expirado
                mostrarNotificacao('Evento corporativo expirou. O preço agora segue apenas o cenário econômico.', 'info');
            }
        }

        // ============================================
        // EVENTOS CORPORATIVOS
        // ============================================
        function acionarEventoCorporativo(evento) {
            // Definir evento ativo
            estadoSimulador.mercado.eventoAtivo = evento;
            estadoSimulador.mercado.eventoExpiraEn = estadoSimulador.tempoSimulacao + 10; // Expira em 10 ciclos (30 segundos)
            
            // Mostrar notificação
            let mensagem = '';
            switch(evento) {
                case 'lucro-recorde':
                    mensagem = 'Lucro recorde anunciado! Expectativa de valorização significativa.';
                    break;
                case 'lucro-normal':
                    mensagem = 'Lucro dentro do esperado. Mercado deve reagir de forma neutra.';
                    break;
                case 'lucro-abaixo':
                    mensagem = 'Lucro abaixo das expectativas. Possível desvalorização.';
                    break;
                case 'escandalo':
                    mensagem = 'Escândalo de corrupção revelado! Desvalorização catastrófica esperada.';
                    break;
                case 'parceria':
                    mensagem = 'Nova parceria estratégica anunciada! Valorização esperada.';
                    break;
            }
            
            mostrarNotificacao(mensagem, evento === 'escandalo' ? 'erro' : 'sucesso');
            
            // Adicionar animação de destaque
            const container = document.querySelector('.carteira-header');
            if (evento === 'escandalo' || evento === 'lucro-abaixo') {
                container.classList.add('animacao-desvalorizacao');
                setTimeout(() => container.classList.remove('animacao-desvalorizacao'), 1000);
            } else {
                container.classList.add('animacao-valorizacao');
                setTimeout(() => container.classList.remove('animacao-valorizacao'), 1000);
            }
            
            // Atualizar interface imediatamente
            atualizarMercado();
        }

        // ============================================
        // GESTÃO DE DIVIDENDOS
        // ============================================
        function atualizarAlertaDividendos(percentual) {
            const alertaDiv = document.getElementById('alertaDividendos');
            let mensagem = '';
            let tipo = '';
            
            if (percentual === 0) {
                mensagem = '⚠️ Sem dividendos - Desmotiva investidores';
                tipo = 'alert-warning';
            } else if (percentual < 20) {
                mensagem = '⚠️ ALERTA: Estratégia não divulgada preocupa mercado';
                tipo = 'alert-warning';
            } else if (percentual === 25) {
                mensagem = 'Mínimo padrão recomendado';
                tipo = 'alert-success';
            } else if (percentual >= 20 && percentual <= 70) {
                mensagem = 'Faixa normal e saudável';
                tipo = 'alert-success';
            } else if (percentual > 70) {
                mensagem = '⚠️ ALERTA CRÍTICO: Possível manobra desesperada';
                tipo = 'alert-danger';
            }
            
            // Verificar se é >70% + cenário ruim + lucro baixo
            if (percentual > 70 && estadoSimulador.configuracao.cenarioEconomico === 'instavel' && document.getElementById('resultadoAnunciar').value === 'ruim') {
                mensagem = '⚠️ ALERTA CRÍTICO: Empresa pode estar atraindo investidores artificialmente antes de colapso';
                tipo = 'alert-danger';
            }
            
            alertaDiv.innerHTML = mensagem;
            alertaDiv.className = `alert ${tipo}`;
        }

        function distribuirDividendos() {
            const percentual = parseInt(document.getElementById('percentualDividendos').value);
            const lucroAnual = parseInt(document.getElementById('lucroAnual').value);
            const resultado = document.getElementById('resultadoAnunciar').value;
            
            // Calcular valor total dos dividendos
            const valorDividendos = lucroAnual * (percentual / 100);
            
            // Calcular dividendos por ação
            const acoesTotais = estadoSimulador.opv.acoes.totalAcoes;
            const dividendosPorAcao = acoesTotais > 0 ? valorDividendos / acoesTotais : 0;
            
            // Calcular dividend yield
            const precoAtual = estadoSimulador.mercado.precoAtual;
            const dividendYield = precoAtual > 0 ? (dividendosPorAcao / precoAtual * 100) : 0;
            
            // Atualizar estado
            estadoSimulador.mercado.dividendYield = dividendYield;
            
            // Impacto no preço da ação
            let impactoPercentual = 0;
            if (percentual >= 50 && percentual <= 70) {
                impactoPercentual = 5 + (Math.random() * 5); // +5% a +10%
            } else if (percentual < 20) {
                impactoPercentual = -(3 + Math.random() * 2); // -3% a -5%
            } else {
                impactoPercentual = (Math.random() * 4) - 2; // -2% a +2%
            }
            
            // Aplicar impacto ao preço
            estadoSimulador.mercado.precoAnterior = estadoSimulador.mercado.precoAtual;
            estadoSimulador.mercado.precoAtual = estadoSimulador.mercado.precoAtual * (1 + impactoPercentual / 100);
            estadoSimulador.mercado.variacaoPercentual = ((estadoSimulador.mercado.precoAtual - estadoSimulador.mercado.precoAnterior) / estadoSimulador.mercado.precoAnterior * 100);
            
            // Mostrar notificação
            const mensagem = `Dividendos de ${percentual}% distribuídos! Valor total: AOA ${formatarNumero(valorDividendos)} (${formatarNumero(dividendosPorAcao)} por ação). Impacto no preço: ${impactoPercentual >= 0 ? '+' : ''}${impactoPercentual.toFixed(1)}%`;
            mostrarNotificacao(mensagem, impactoPercentual >= 0 ? 'sucesso' : 'erro');
            
            // Atualizar interface
            atualizarMetricasAcoes();
            desenharGrafico();
        }

        // ============================================
        // EMISSÃO ADICIONAL DE AÇÕES
        // ============================================
        function atualizarAlertaEmissao(percentual) {
            const alertaDiv = document.getElementById('alertaEmissao');
            let mensagem = '';
            let tipo = '';
            
            if (percentual >= 20 && percentual <= 50) {
                mensagem = 'Moderado - Aceitável com demanda';
                tipo = 'alert-success';
            } else if (percentual > 50 && percentual <= 80) {
                mensagem = '⚠️ ALTO - Risco de queda se demanda baixa';
                tipo = 'alert-warning';
            } else if (percentual === 100) {
                mensagem = '⚠️ CRÍTICO - Perda total de controle';
                tipo = 'alert-danger';
            } else if (percentual > 80 && percentual < 100) {
                mensagem = '⚠️ MUITO ALTO - Risco significativo';
                tipo = 'alert-danger';
            } else {
                mensagem = 'Baixo - Impacto limitado';
                tipo = '';
            }
            
            alertaDiv.innerHTML = mensagem;
            alertaDiv.className = `alert ${tipo}`;
        }

        function emitirAcoes() {
            let quantidade = parseInt(document.getElementById('novasAcoes').value);
            const percentual = parseInt(document.getElementById('percentualRetidas').value);
            
            // Se quantidade é 0 mas percentual não, calcular baseado no percentual
            if (quantidade === 0 && percentual > 0) {
                const acoesRetidas = estadoSimulador.opv.acoes.totalAcoes - estadoSimulador.opv.acoes.acoesPublico;
                quantidade = Math.floor(acoesRetidas * (percentual / 100));
            }
            
            if (quantidade <= 0) {
                mostrarNotificacao('Insira uma quantidade válida de ações para emitir.', 'erro');
                return;
            }
            
            // Atualizar total de ações
            estadoSimulador.opv.acoes.totalAcoes += quantidade;
            
            // Determinar efeito no preço baseado na relação oferta/demanda
            const liquidez = calcularLiquidez();
            let impactoPercentual = 0;
            
            if (liquidez === 'alta') {
                // Demanda alta absorve oferta
                impactoPercentual = (Math.random() * 4) - 2; // -2% a +2%
            } else if (liquidez === 'media') {
                // Oferta > Demanda moderada
                impactoPercentual = -(2 + Math.random() * 3); // -2% a -5%
            } else {
                // Oferta > Demanda significativa
                impactoPercentual = -(5 + Math.random() * 15); // -5% a -20%
            }
            
            // Aplicar impacto ao preço
            estadoSimulador.mercado.precoAnterior = estadoSimulador.mercado.precoAtual;
            estadoSimulador.mercado.precoAtual = estadoSimulador.mercado.precoAtual * (1 + impactoPercentual / 100);
            estadoSimulador.mercado.variacaoPercentual = ((estadoSimulador.mercado.precoAtual - estadoSimulador.mercado.precoAnterior) / estadoSimulador.mercado.precoAnterior * 100);
            
            // Mostrar notificação
            const mensagem = `${formatarNumero(quantidade)} novas ações emitidas. Total de ações agora: ${formatarNumero(estadoSimulador.opv.acoes.totalAcoes)}. Impacto no preço: ${impactoPercentual >= 0 ? '+' : ''}${impactoPercentual.toFixed(1)}%`;
            mostrarNotificacao(mensagem, impactoPercentual >= 0 ? 'sucesso' : 'erro');
            
            // Atualizar interface
            atualizarMetricasAcoes();
            desenharGrafico();
        }

        // ============================================
        // RECOMPRA DE AÇÕES
        // ============================================
        function calcularCustoRecompra() {
            const quantidade = parseInt(document.getElementById('acoesRecomprar').value);
            const percentual = parseInt(document.getElementById('percentualRecompra').value);
            
            let quantidadeCalculada = quantidade;
            
            // Se quantidade é 0 mas percentual não, calcular baseado no percentual
            if (quantidade === 0 && percentual > 0) {
                const acoesCirculacao = estadoSimulador.opv.acoes.acoesPublico;
                quantidadeCalculada = Math.floor(acoesCirculacao * (percentual / 100));
            }
            
            const custo = quantidadeCalculada * estadoSimulador.mercado.precoAtual;
            document.getElementById('custoRecompraValor').textContent = `AOA ${formatarNumero(custo)}`;
        }

        function recomprarAcoes() {
            let quantidade = parseInt(document.getElementById('acoesRecomprar').value);
            const percentual = parseInt(document.getElementById('percentualRecompra').value);
            
            // Se quantidade é 0 mas percentual não, calcular baseado no percentual
            if (quantidade === 0 && percentual > 0) {
                const acoesCirculacao = estadoSimulador.opv.acoes.acoesPublico;
                quantidade = Math.floor(acoesCirculacao * (percentual / 100));
            }
            
            if (quantidade <= 0) {
                mostrarNotificacao('Insira uma quantidade válida de ações para recomprar.', 'erro');
                return;
            }
            
            // Verificar se há ações suficientes em circulação
            if (quantidade > estadoSimulador.opv.acoes.acoesPublico) {
                mostrarNotificacao(`Não é possível recomprar mais ações (${formatarNumero(quantidade)}) do que as disponíveis em circulação (${formatarNumero(estadoSimulador.opv.acoes.acoesPublico)}).`, 'erro');
                return;
            }
            
            // Atualizar ações em circulação
            estadoSimulador.opv.acoes.acoesPublico -= quantidade;
            
            // Efeito no preço (valorização por redução da oferta)
            const impactoPercentual = 5 + (Math.random() * 10); // +5% a +15%
            
            // Aplicar impacto ao preço
            estadoSimulador.mercado.precoAnterior = estadoSimulador.mercado.precoAtual;
            estadoSimulador.mercado.precoAtual = estadoSimulador.mercado.precoAtual * (1 + impactoPercentual / 100);
            estadoSimulador.mercado.variacaoPercentual = ((estadoSimulador.mercado.precoAtual - estadoSimulador.mercado.precoAnterior) / estadoSimulador.mercado.precoAnterior * 100);
            
            // Mostrar notificação
            const custo = quantidade * estadoSimulador.mercado.precoAnterior;
            const mensagem = `${formatarNumero(quantidade)} ações recompradas por AOA ${formatarNumero(custo)}. Ações em circulação agora: ${formatarNumero(estadoSimulador.opv.acoes.acoesPublico)}. Impacto no preço: +${impactoPercentual.toFixed(1)}%`;
            mostrarNotificacao(mensagem, 'sucesso');
            
            // Atualizar interface
            atualizarMetricasAcoes();
            calcularCustoRecompra();
            desenharGrafico();
        }

        // ============================================
        // NOTÍCIAS EM LOOP
        // ============================================
        function rotacionarNoticias() {
            // Esconder notícia atual
            document.querySelectorAll('.noticia-item').forEach(item => {
                item.classList.remove('ativa');
            });
            
            // Avançar para próxima notícia
            estadoSimulador.noticiaAtual = (estadoSimulador.noticiaAtual + 1) % 3;
            
            // Mostrar nova notícia
            document.getElementById(`noticia-${estadoSimulador.noticiaAtual + 1}`).classList.add('ativa');
        }

        // ============================================
        // UTILITÁRIOS
        // ============================================
        function formatarNumero(numero) {
            if (numero >= 1000000000) {
                return (numero / 1000000000).toFixed(2) + 'B';
            } else if (numero >= 1000000) {
                return (numero / 1000000).toFixed(2) + 'M';
            } else if (numero >= 1000) {
                return (numero / 1000).toFixed(2) + 'K';
            } else {
                return numero.toFixed(2);
            }
        }

        function mostrarNotificacao(mensagem, tipo) {
            // Criar elemento de notificação
            const notificacao = document.createElement('div');
            notificacao.className = `alert ${tipo === 'erro' ? 'alert-danger' : tipo === 'sucesso' ? 'alert-success' : 'alert-warning'}`;
            notificacao.style.position = 'fixed';
            notificacao.style.top = '20px';
            notificacao.style.right = '20px';
            notificacao.style.zIndex = '1000';
            notificacao.style.maxWidth = '400px';
            notificacao.innerHTML = `<strong>${tipo === 'erro' ? '⚠️' : tipo === 'sucesso' ? '✅' : 'ℹ️'}</strong> ${mensagem}`;
            
            // Adicionar ao documento
            document.body.appendChild(notificacao);
            
            // Remover após 5 segundos
            setTimeout(() => {
                notificacao.style.opacity = '0';
                notificacao.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (notificacao.parentNode) {
                        notificacao.parentNode.removeChild(notificacao);
                    }
                }, 500);
            }, 5000);
        }

        function reiniciarSimulacao() {
            // Parar intervalos
            clearInterval(estadoSimulador.intervaloGrafico);
            clearInterval(estadoSimulador.intervaloNoticias);
            clearInterval(estadoSimulador.intervaloTempo);
            
            // Resetar estado
            estadoSimulador = {
                faseAtual: 'introducao',
                empresa: {},
                configuracao: {},
                opv: {},
                mercado: {
                    historicoPrecos: [],
                    precoAtual: 0,
                    precoAnterior: 0,
                    variacaoPercentual: 0,
                    volume: 0,
                    beta: 1.0,
                    dividendYield: 0,
                    lpa: 0,
                    pl: 0,
                    roi: 0,
                    ultimaAtualizacao: new Date(),
                    eventoAtivo: null,
                    eventoExpiraEn: null
                },
                noticiaAtual: 0,
                intervaloGrafico: null,
                intervaloNoticias: null,
                tempoSimulacao: 0
            };
            
            // Resetar formulários
            document.getElementById('formConfiguracao').reset();
            document.getElementById('percentualDividendosValue').textContent = '25%';
            document.getElementById('alcancePercentualValue').textContent = '10%';
            
            // Voltar para fase inicial
            mudarFase('introducao');
            
            // Mostrar notificação
            mostrarNotificacao('Simulação reiniciada com sucesso!', 'sucesso');
        }

        // ============================================
// OTIMIZAÇÃO DE TABELAS PARA MOBILE
// ============================================
function otimizarTabelasParaMobile() {
    const larguraTela = window.innerWidth;
    
    if (larguraTela <= 450) {
        // Adicionar indicador de rolagem horizontal
        document.querySelectorAll('.table-container').forEach(container => {
            if (!container.querySelector('.scroll-hint')) {
                const hint = document.createElement('div');
                hint.className = 'scroll-hint';
                hint.innerHTML = '↔️ Role para ver mais';
                hint.style.cssText = `
                    text-align: center;
                    font-size: 0.8rem;
                    color: var(--cor-texto-secundario);
                    padding: 5px;
                    background: rgba(214, 174, 100, 0.1);
                    border-radius: 4px;
                    margin-bottom: 8px;
                `;
                container.insertBefore(hint, container.firstChild);
            }
        });
    }
}

// Executar na inicialização e no redimensionamento
document.addEventListener('DOMContentLoaded', otimizarTabelasParaMobile);
window.addEventListener('resize', otimizarTabelasParaMobile);

        // ============================================
        // MANIPULAÇÃO DE REDIMENSIONAMENTO
        // ============================================
        window.addEventListener('resize', function() {
            if (graficoCtx) {
                const canvas = document.getElementById('canvasGrafico');
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                desenharGrafico();
            }
        });
    
    
        // ============================================
        // JAVASCRIPT OBRIGATÓRIO EM TODAS AS PÁGINAS
        // ============================================
        
        // 1. Menu mobile toggle
        document.addEventListener('DOMContentLoaded', function() {
            const mobileToggle = document.querySelector('.mobile-nav-toggle');
            const mobileOverlay = document.querySelector('.mobile-nav-overlay');
            const mobileLinks = document.querySelectorAll('.mobile-nav-list a');
            
            // Abrir/fechar menu mobile
            if (mobileToggle) {
                mobileToggle.addEventListener('click', function() {
                    mobileOverlay.classList.toggle('active');
                    
                    // Animar ícone hamburguer
                    const lines = this.querySelectorAll('.hamburger-line');
                    if (mobileOverlay.classList.contains('active')) {
                        lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                        lines[1].style.opacity = '0';
                        lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
                    } else {
                        lines[0].style.transform = 'rotate(0) translate(0, 0)';
                        lines[1].style.opacity = '1';
                        lines[2].style.transform = 'rotate(0) translate(0, 0)';
                    }
                });
            }
            
            // Fechar menu ao clicar em um link
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileOverlay.classList.remove('active');
                    const lines = mobileToggle.querySelectorAll('.hamburger-line');
                    lines[0].style.transform = 'rotate(0) translate(0, 0)';
                    lines[1].style.opacity = '1';
                    lines[2].style.transform = 'rotate(0) translate(0, 0)';
                });
            });
            
            // 2. Atualizar ano no footer
            const yearSpan = document.getElementById('current-year');
            if (yearSpan) {
                yearSpan.textContent = new Date().getFullYear();
            }
            
            // 3. Destacar link ativo no menu
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            const navLinks = document.querySelectorAll('.nav-list a, .mobile-nav-list a');
            
            navLinks.forEach(link => {
                const linkPage = link.getAttribute('href');
                if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
            
            // 4. Tratamento básico de erros
            window.addEventListener('error', function(e) {
                console.error('Erro detectado:', e.error);
            });
            
            // ============================================
            // JAVASCRIPT ESPECÍFICO PARA A HOME
            // ============================================
            
            // 1. Contadores animados nas estatísticas
            const statNumbers = document.querySelectorAll('.stat-number');
            
            if (statNumbers.length > 0) {
                const observerOptions = {
                    threshold: 0.5,
                    rootMargin: '0px 0px -50px 0px'
                };
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const statNumber = entry.target;
                            const target = parseInt(statNumber.getAttribute('data-target'));
                            const duration = 2000; // 2 segundos
                            const step = target / (duration / 16); // 60fps
                            let current = 0;
                            
                            const timer = setInterval(() => {
                                current += step;
                                if (current >= target) {
                                    current = target;
                                    clearInterval(timer);
                                }
                                statNumber.textContent = Math.floor(current).toLocaleString('pt-AO');
                            }, 16);
                            
                            observer.unobserve(statNumber);
                        }
                    });
                }, observerOptions);
                
                statNumbers.forEach(stat => observer.observe(stat));
            }
            
            // 2. Carrossel de simuladores
            const carousel = document.getElementById('simulators-carousel');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            
            if (carousel && prevBtn && nextBtn) {
                const cardWidth = 280; // Largura do card + gap
                const scrollAmount = cardWidth * 2; // Rolagem de 2 cards por vez
                
                prevBtn.addEventListener('click', () => {
                    carousel.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                });
                
                nextBtn.addEventListener('click', () => {
                    carousel.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                });
            }
            
            // 3. Scroll suave para âncoras internas
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    
                    // Apenas para âncoras internas
                    if (href !== '#' && href.startsWith('#')) {
                        e.preventDefault();
                        const targetId = href.substring(1);
                        const targetElement = document.getElementById(targetId);
                        
                        if (targetElement) {
                            window.scrollTo({
                                top: targetElement.offsetTop - 80, // Ajuste para header fixo
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            });
            
            // 4. Animações de entrada
            const fadeElements = document.querySelectorAll('.fade-in');
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        fadeObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
            
            fadeElements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                fadeObserver.observe(element);
            });
            
            // Fallback para navegadores sem suporte a IntersectionObserver
            if (!('IntersectionObserver' in window)) {
                fadeElements.forEach(element => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                });
                
                // Contadores fallback
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    stat.textContent = target.toLocaleString('pt-AO');
                });
            }
            
            // Prevenir envio de formulários inexistentes (para validação futura)
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    console.log('Formulário submetido (demonstração)');
                    // Aqui seria implementada a validação real
                });
            });
        });
        
        // Fallback para JS desabilitado
        document.documentElement.classList.add('js-enabled');

        
