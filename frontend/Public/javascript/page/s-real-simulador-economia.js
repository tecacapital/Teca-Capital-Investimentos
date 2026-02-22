// ============================================
// SIMULADOR DE ECONOMIA DE ANGOLA - VERSÃO COMPLETA
// TODAS AS FUNCIONALIDADES INTEGRADAS
// ============================================

// ============================================
// CONSTANTES GLOBAIS
// ============================================

const VALORES_CAMBIO = [100, 150, 250, 350, 400, 500, 600, 700, 720, 760, 790, 812, 850, 900, 912, 970, 1000, 1100, 1500, 1700, 2000];

const EVENTOS_GLOBAIS = [
    {
        nome: 'Pandemia Global',
        duracao: { min: 1, max: 3 },
        impacto: {
            cambio: 3,
            pib: -0.05,
            desemprego: 0.05,
            inflacao: 0.03,
            reservas: -0.1
        },
        cor: '#cc3333'
    },
    {
        nome: 'Crise Financeira Global',
        duracao: { min: 1, max: 3 },
        impacto: {
            cambio: 2,
            pib: -0.03,
            desemprego: 0.03,
            inflacao: 0.02,
            reservas: -0.15
        },
        cor: '#cc3333'
    },
    {
        nome: 'Guerra Internacional',
        duracao: { min: 1, max: 2 },
        impacto: {
            cambio: 2,
            pib: -0.04,
            inflacao: 0.05,
            reservas: -0.2
        },
        cor: '#cc3333'
    },
    {
        nome: 'Boom das Commodities',
        duracao: { min: 1, max: 2 },
        impacto: {
            cambio: -2,
            pib: 0.05,
            reservas: 0.15,
            inflacao: -0.02
        },
        cor: '#33cc33'
    },
    {
        nome: 'Colapso do Petróleo',
        duracao: { min: 1, max: 2 },
        impacto: {
            cambio: 3,
            pib: -0.06,
            reservas: -0.25,
            desemprego: 0.04
        },
        cor: '#cc3333'
    },
    {
        nome: 'Seca Severa',
        duracao: { min: 1, max: 2 },
        impacto: {
            pib: -0.03,
            inflacao: 0.04,
            desemprego: 0.02
        },
        cor: '#f39c12'
    }
];

const NIVEIS_INVESTIMENTO = {
    C: {
        custoMinimo: 5000000,
        impactoPIB: 1000000,
        impactoReservas: 0.05,
        tempoMaturacao: 12,
        cor: '#33cc33',
        nome: 'Pequeno'
    },
    B: {
        custoMinimo: 200000000,
        impactoPIB: 10000000000,
        impactoReservas: 0.20,
        tempoMaturacao: 12,
        cor: '#0066cc',
        nome: 'Médio'
    },
    A: {
        custoMinimo: 1000000000,
        impactoPIB: 5000000000,
        impactoReservas: 0.50,
        tempoMaturacao: 12,
        cor: '#9b59b6',
        nome: 'Grande'
    }
};

const NIVEIS_EXPORTACAO = {
    C: {
        custo: 10000000,
        retornoTotal: 1.05,
        retornoReservas: 0.05,
        retornoPIB: 1.0,
        nome: 'Pequena'
    },
    B: {
        custo: 50000000,
        retornoTotal: 1.20,
        retornoReservas: 0.20,
        retornoPIB: 1.0,
        nome: 'Média'
    },
    A: {
        custo: 100000000,
        retornoTotal: 1.50,
        retornoReservas: 0.50,
        retornoPIB: 1.0,
        nome: 'Grande'
    }
};

const RATINGS = {
    'AAA': { cor: '#33cc33', multiplicadorJuros: 0.8, limiteDivida: 0.4, nome: 'Excelente' },
    'AA': { cor: '#33cc33', multiplicadorJuros: 0.9, limiteDivida: 0.5, nome: 'Muito Bom' },
    'A': { cor: '#33cc33', multiplicadorJuros: 1.0, limiteDivida: 0.6, nome: 'Bom' },
    'BBB': { cor: '#f39c12', multiplicadorJuros: 1.2, limiteDivida: 0.7, nome: 'Estável' },
    'BB': { cor: '#f39c12', multiplicadorJuros: 1.5, limiteDivida: 0.8, nome: 'Risco Moderado' },
    'B': { cor: '#cc3333', multiplicadorJuros: 2.0, limiteDivida: 0.9, nome: 'Alto Risco' },
    'CCC': { cor: '#cc3333', multiplicadorJuros: 3.0, limiteDivida: 1.0, nome: 'Crítico' },
    'D': { cor: '#cc3333', multiplicadorJuros: 5.0, limiteDivida: 0, nome: 'Calote' }
};

// Ações internacionais disponíveis
const ACOES_INTERNACIONAIS = [
    { nome: 'Apple Inc.', ticker: 'AAPL', setor: 'Tecnologia', pais: 'EUA', precoBase: 175, volatilidade: 0.25 },
    { nome: 'Microsoft', ticker: 'MSFT', setor: 'Tecnologia', pais: 'EUA', precoBase: 330, volatilidade: 0.2 },
    { nome: 'Tesla', ticker: 'TSLA', setor: 'Automotivo', pais: 'EUA', precoBase: 240, volatilidade: 0.4 },
    { nome: 'Petrobras', ticker: 'PETR4', setor: 'Petróleo', pais: 'Brasil', precoBase: 38, volatilidade: 0.35 },
    { nome: 'Vale', ticker: 'VALE3', setor: 'Mineração', pais: 'Brasil', precoBase: 68, volatilidade: 0.3 },
    { nome: 'Tencent', ticker: '0700', setor: 'Tecnologia', pais: 'China', precoBase: 320, volatilidade: 0.3 },
    { nome: 'Samsung', ticker: '005930', setor: 'Tecnologia', pais: 'Coreia', precoBase: 68000, volatilidade: 0.25 },
    { nome: 'BP', ticker: 'BP', setor: 'Petróleo', pais: 'Reino Unido', precoBase: 480, volatilidade: 0.28 },
    { nome: 'Deutsche Bank', ticker: 'DBK', setor: 'Bancário', pais: 'Alemanha', precoBase: 12, volatilidade: 0.35 },
    { nome: 'LVMH', ticker: 'MC', setor: 'Luxo', pais: 'França', precoBase: 750, volatilidade: 0.22 }
];

// Títulos públicos estrangeiros disponíveis
const TITULOS_ESTRANGEIROS = [
    { pais: 'EUA', moeda: 'USD', taxaBase: 0.045, risco: 'Baixo', prazoMin: 1, prazoMax: 30 },
    { pais: 'Alemanha', moeda: 'EUR', taxaBase: 0.03, risco: 'Baixo', prazoMin: 1, prazoMax: 20 },
    { pais: 'Brasil', moeda: 'BRL', taxaBase: 0.12, risco: 'Alto', prazoMin: 1, prazoMax: 10 },
    { pais: 'África do Sul', moeda: 'ZAR', taxaBase: 0.10, risco: 'Médio', prazoMin: 1, prazoMax: 15 },
    { pais: 'China', moeda: 'CNY', taxaBase: 0.035, risco: 'Baixo', prazoMin: 1, prazoMax: 20 },
    { pais: 'Japão', moeda: 'JPY', taxaBase: 0.005, risco: 'Muito Baixo', prazoMin: 1, prazoMax: 30 },
    { pais: 'Reino Unido', moeda: 'GBP', taxaBase: 0.042, risco: 'Baixo', prazoMin: 1, prazoMax: 25 },
    { pais: 'França', moeda: 'EUR', taxaBase: 0.032, risco: 'Baixo', prazoMin: 1, prazoMax: 20 }
];

// ============================================
// CLASSES AUXILIARES
// ============================================

class AcaoInternacional {
    constructor(nome, ticker, setor, pais, precoInicial, volatilidade) {
        this.id = Date.now() + Math.random();
        this.nome = nome;
        this.ticker = ticker;
        this.setor = setor;
        this.pais = pais;
        this.precoCompra = precoInicial;
        this.precoAtual = precoInicial;
        this.quantidade = 0;
        this.precoMedioCompra = 0;
        this.dividendYield = Math.random() * 0.03 + 0.01;
        this.volatilidade = volatilidade || 0.2;
        this.historicoPrecos = [precoInicial];
    }
    
    atualizarPreco(eventoAtivo) {
        let variacaoBase = (Math.random() - 0.5) * this.volatilidade;
        
        if (eventoAtivo) {
            if (eventoAtivo.nome.includes('Crise')) {
                variacaoBase -= 0.1;
            } else if (eventoAtivo.nome.includes('Boom')) {
                variacaoBase += 0.15;
            }
        }
        
        this.precoAtual = this.precoAtual * (1 + variacaoBase);
        this.precoAtual = Math.max(1, this.precoAtual);
        this.historicoPrecos.push(this.precoAtual);
        
        if (this.historicoPrecos.length > 30) {
            this.historicoPrecos.shift();
        }
        
        return this.precoAtual;
    }
}

class TituloEstrangeiro {
    constructor(pais, moeda, taxaJuros, prazoAnos, valor) {
        this.id = Date.now() + Math.random();
        this.pais = pais;
        this.moeda = moeda;
        this.taxaJuros = taxaJuros;
        this.prazoAnos = prazoAnos;
        this.valorInvestido = valor;
        this.dataCompra = {
            ano: 0,
            mes: 0,
            dia: 0
        };
        this.dataVencimento = {
            ano: 0,
            mes: 0,
            dia: 0
        };
        this.ultimoPagamentoJuros = null;
        this.jurosAcumulados = 0;
        this.inadimplencia = 0;
    }
    
    calcularJurosSemestrais() {
        return this.valorInvestido * this.taxaJuros * (180/360);
    }
}

// ============================================
// CLASSE PRINCIPAL DO ESTADO
// ============================================

class EstadoSimulador {
    constructor() {
        // Tempo
        this.tempo = {
            ano: 2025,
            mes: 1,
            dia: 1,
            segundosAcumulados: 0,
            pausado: false
        };
        
        // Usuário
        this.usuario = {
            nome: '',
            genero: '',
            provincia: ''
        };
        
        // Econômico Principal
        this.pib = 80000000000;
        this.pibOriginal = 80000000000;
        this.inflacao = 0.02;
        this.desemprego = 0.1;
        this.dividaPublica = 48000000000;
        this.dividaPublicaPercentualPIB = 60;
        this.receitaGovernoUSD = 5000000000;
        this.receitaGovernoKz = 5000000000000;
        
        // BNA e Política Monetária
        this.taxaJuros = 0.15;
        this.regimeCambial = 'flutuante';
        this.cambioFixo = 912;
        this.bandaMin = 700;
        this.bandaMax = 900;
        this.indiceCambio = 14;
        
        // Reservas
        this.reservasUSD = 11000000000;
        this.ouro = {
            oncas: 100000,
            precoPorOnca: 1800,
            historico: []
        };
        
        // Saldo do Governo em Kwanzas
        this.saldoGovernoKz = 5000000000000;
        this.receitaMensalKz = 0;
        this.despesaMensalKz = 0;
        this.saldoHistorico = [];
        
        // Conta de Investimentos Internacionais
        this.carteiraInternacional = {
            acoes: [],
            acoesDisponiveis: [],
            titulosEstrangeiros: [],
            titulosDisponiveis: TITULOS_ESTRANGEIROS,
            saldoUSD: 0,
            valorTotal: 0
        };
        
        // Demográfico
        this.populacao = 40000000;
        this.funcionariosPublicos = 10000000;
        this.salarioMedio = 100000;
        
        // Índices sociais
        this.indicePobreza = 0.3;
        this.indiceInsatisfacao = 0.2;
        this.indiceInformalidade = 0.3;
        this.indiceConsumo = 1.0;
        this.indicePoupanca = 5000;
        
        // Empresas detalhadas
        this.empresasDetalhadas = {
            A: {
                quantidade: 100,
                resiliencia: 0.9,
                contribuicaoPIB: 0.4,
                empregos: 5000,
                faturamentoMensal: 50000000,
                lucroMensal: 5000000,
                endividamento: 0.3,
                satisfacao: 0.8,
                emRisco: 0
            },
            B: {
                quantidade: 5000,
                resiliencia: 0.6,
                contribuicaoPIB: 0.4,
                empregos: 200,
                faturamentoMensal: 2000000,
                lucroMensal: 200000,
                endividamento: 0.5,
                satisfacao: 0.6,
                emRisco: 0
            },
            C: {
                quantidade: 50000,
                resiliencia: 0.3,
                contribuicaoPIB: 0.2,
                empregos: 10,
                faturamentoMensal: 100000,
                lucroMensal: 10000,
                endividamento: 0.7,
                satisfacao: 0.4,
                emRisco: 0
            }
        };
        
        // Famílias detalhadas
        this.familiasDetalhadas = {
            rendaMedia: 100000,
            poderCompra: 1.0,
            endividamento: 0.4,
            poupancaMedia: 50000,
            satisfacao: 0.6,
            acessoCredito: 0.5,
            informalidade: 0.3,
            pobreza: 0.3,
            gini: 0.5
        };
        
        // Dívidas ativas
        this.dividasAtivas = [];
        
        // Investimentos ativos
        this.investimentosAtivos = [];
        
        // Evento ativo
        this.eventoAtivo = null;
        this.eventoTermino = null;
        
        // Rating
        this.rating = {
            nivel: 'BBB',
            cor: '#f39c12',
            multiplicadorJuros: 1.2
        };
        
        // Dependência petróleo
        this.dependenciaPetroleo = 0.8;
        
        // Histórico
        this.historico = [];
        
        // Estatísticas adicionais
        this.exportacoesMensais = 0;
        this.importacoesMensais = 0;
        this.balancoComercial = 0;
        this.investimentoEstrangeiro = 0;
    }
    
    // Métodos de cálculo
    calcularDividaPercentualPIB() {
        return (this.dividaPublica / this.pib) * 100;
    }
    
    calcularCustoSalarialMensal() {
        return this.funcionariosPublicos * this.salarioMedio;
    }
    
    calcularReceitaMensal() {
        const pibMensal = this.pib / 12;
        const arrecadacaoBase = pibMensal * 0.15;
        const ajusteConsumo = this.indiceConsumo;
        const ajusteFormalidade = 1 - this.indiceInformalidade;
        
        this.receitaMensalKz = arrecadacaoBase * ajusteConsumo * ajusteFormalidade * VALORES_CAMBIO[this.indiceCambio];
        
        return this.receitaMensalKz;
    }
    
    atualizarRating() {
        const dividaPercentual = this.calcularDividaPercentualPIB();
        const niveis = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];
        
        if (dividaPercentual > 120 || this.rating.nivel === 'D') {
            this.rating.nivel = 'D';
        } else if (dividaPercentual > 100) {
            this.rating.nivel = 'CCC';
        } else if (dividaPercentual > 90) {
            this.rating.nivel = 'B';
        } else if (dividaPercentual > 80) {
            this.rating.nivel = 'BB';
        } else if (dividaPercentual > 70) {
            this.rating.nivel = 'BBB';
        } else if (dividaPercentual > 60) {
            this.rating.nivel = 'A';
        } else if (dividaPercentual > 50) {
            this.rating.nivel = 'AA';
        } else {
            this.rating.nivel = 'AAA';
        }
        
        const ratingConfig = RATINGS[this.rating.nivel];
        this.rating.cor = ratingConfig.cor;
        this.rating.multiplicadorJuros = ratingConfig.multiplicadorJuros;
        
        if (this.reservasUSD < 1000000000) {
            const index = niveis.indexOf(this.rating.nivel);
            if (index < niveis.length - 1) {
                this.rating.nivel = niveis[index + 1];
            }
        }
    }
    
    atualizarSaldoGoverno() {
        this.saldoHistorico.push({
            data: `${this.tempo.mes}/${this.tempo.ano}`,
            saldo: this.saldoGovernoKz,
            receita: this.receitaMensalKz,
            despesa: this.despesaMensalKz
        });
        
        if (this.saldoHistorico.length > 12) {
            this.saldoHistorico.shift();
        }
    }
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let estado = new EstadoSimulador();
let intervaloSimulacao = null;
let tempoRealInicio = null;

// Elementos DOM (serão preenchidos na inicialização)
let formInicio, dashboard, inicioSection;

// ============================================
// FUNÇÕES DE TEMPO
// ============================================

function iniciarTempo() {
    if (intervaloSimulacao) {
        clearInterval(intervaloSimulacao);
    }
    
    tempoRealInicio = Date.now();
    
    intervaloSimulacao = setInterval(() => {
        if (!estado.tempo.pausado) {
            estado.tempo.segundosAcumulados++;
            
            if (estado.tempo.segundosAcumulados % 5 === 0) {
                passarDia();
            }
            
            if (estado.tempo.segundosAcumulados % 150 === 0) {
                passarMes();
            }
            
            if (estado.tempo.segundosAcumulados % 1800 === 0) {
                passarAno();
            }
            
            atualizarInterface();
            atualizarInterfaceExpandida();
        }
    }, 1000);
}

function passarDia() {
    estado.tempo.dia++;
    
    if (estado.tempo.dia > 30) {
        estado.tempo.dia = 1;
        estado.tempo.mes++;
        
        if (estado.tempo.mes > 12) {
            estado.tempo.mes = 1;
            estado.tempo.ano++;
        }
    }
    
    if (estado.regimeCambial === 'flutuante' || estado.regimeCambial === 'bandas') {
        atualizarCambioFlutuante();
    }
}

function passarMes() {
    pagarSalarios();
    processarJurosDividas();
    processarRetornoInvestimentos();
    calcularInflacao();
    calcularDesemprego();
    atualizarIndicesSociais();
    atualizarEmpresas();
    atualizarFamilias();
    processarInvestimentosInternacionais();
    
    if (Math.random() < 0.05 && !estado.eventoAtivo) {
        ativarEventoAleatorio();
    }
    
    if (estado.eventoAtivo) {
        processarEventoAtivo();
    }
    
    estado.atualizarRating();
    
    estado.saldoGovernoKz += estado.receitaMensalKz - estado.despesaMensalKz;
    estado.atualizarSaldoGoverno();
    
    calcularBalancoComercial();
    
    adicionarAoHistorico('Mensal', 'Fechamento do mês');
}

function passarAno() {
    calcularCrescimentoPIB();
    reduzirDependenciaPetroleo();
    adicionarAoHistorico('Anual', `Ano ${estado.tempo.ano} concluído`);
}

// ============================================
// FUNÇÕES ECONÔMICAS PRINCIPAIS
// ============================================

function pagarSalarios() {
    const custoMensalKz = estado.calcularCustoSalarialMensal();
    const custoMensalUSD = custoMensalKz / VALORES_CAMBIO[estado.indiceCambio];
    
    estado.despesaMensalKz = custoMensalKz;
    
    if (estado.saldoGovernoKz >= custoMensalKz) {
        estado.saldoGovernoKz -= custoMensalKz;
        adicionarAoHistorico('Pagamento', `Salários pagos: ${formatarKwanza(custoMensalKz)}`);
    } else {
        const deficit = custoMensalKz - estado.saldoGovernoKz;
        estado.indiceInsatisfacao = Math.min(1, estado.indiceInsatisfacao + 0.2);
        estado.empresasDetalhadas.C.quantidade = Math.floor(estado.empresasDetalhadas.C.quantidade * 0.95);
        estado.saldoGovernoKz = 0;
        
        adicionarAoHistorico('Alerta', `FALTA DE VERBA PARA SALÁRIOS! Déficit: ${formatarKwanza(deficit)}`, 'danger');
        
        const niveis = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];
        const index = niveis.indexOf(estado.rating.nivel);
        if (index < niveis.length - 1) {
            estado.rating.nivel = niveis[index + 1];
        }
    }
}

function atualizarCambioFlutuante() {
    let variacao = 0;
    
    if (estado.inflacao > 0.1) variacao += 1;
    if (estado.reservasUSD < 5000000000) variacao += 1;
    if (estado.indiceConsumo < 0.8) variacao += 1;
    if (estado.balancoComercial < 0) variacao += 1;
    
    const totalExportacoes = estado.investimentosAtivos
        .filter(i => i.tipo === 'exportacao')
        .reduce((sum, i) => sum + i.retornoMensal, 0);
    
    if (totalExportacoes > 100000000) variacao -= 1;
    
    if (estado.eventoAtivo) {
        variacao += estado.eventoAtivo.impacto.cambio || 0;
    }
    
    if (estado.regimeCambial === 'flutuante') {
        estado.indiceCambio = Math.max(0, Math.min(VALORES_CAMBIO.length - 1, estado.indiceCambio + variacao));
    } else if (estado.regimeCambial === 'bandas') {
        const indiceMin = VALORES_CAMBIO.findIndex(v => v >= estado.bandaMin);
        const indiceMax = VALORES_CAMBIO.findIndex(v => v >= estado.bandaMax);
        
        if (indiceMin === -1) indiceMin = 0;
        if (indiceMax === -1) indiceMax = VALORES_CAMBIO.length - 1;
        
        let novoIndice = estado.indiceCambio + variacao;
        novoIndice = Math.max(indiceMin, Math.min(indiceMax, novoIndice));
        estado.indiceCambio = novoIndice;
    }
}

function processarJurosDividas() {
    estado.dividasAtivas.forEach(titulo => {
        const mesesDesdeUltimo = (estado.tempo.ano - titulo.ultimoPagamentoJuros.ano) * 12 + 
                                 (estado.tempo.mes - titulo.ultimoPagamentoJuros.mes);
        
        if (mesesDesdeUltimo >= 6) {
            const juros = calcularJurosSemestrais(titulo);
            
            if (titulo.moeda === 'USD' && estado.reservasUSD >= juros) {
                estado.reservasUSD -= juros;
                titulo.ultimoPagamentoJuros = { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia };
                adicionarAoHistorico('Pagamento', `Juros pagos: ${titulo.tipo} ${formatarUSD(juros)}`);
            } else if (titulo.moeda === 'Kz' && estado.saldoGovernoKz >= juros) {
                estado.saldoGovernoKz -= juros;
                titulo.ultimoPagamentoJuros = { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia };
                adicionarAoHistorico('Pagamento', `Juros pagos: ${titulo.tipo} ${formatarKwanza(juros)}`);
            } else {
                titulo.inadimplencia = (titulo.inadimplencia || 0) + 1;
                adicionarAoHistorico('Alerta', `INADIMPLÊNCIA: ${titulo.tipo}`, 'danger');
                
                if (titulo.inadimplencia >= 3) {
                    estado.rating.nivel = 'D';
                }
            }
        }
        
        const anosDesdeEmissao = (estado.tempo.ano - titulo.dataEmissao.ano);
        if (anosDesdeEmissao >= titulo.prazoAnos) {
            if (titulo.moeda === 'USD' && estado.reservasUSD >= titulo.capital) {
                estado.reservasUSD -= titulo.capital;
                estado.dividasAtivas = estado.dividasAtivas.filter(d => d.id !== titulo.id);
                estado.dividaPublica -= titulo.capital;
                adicionarAoHistorico('Pagamento', `Título quitado: ${titulo.tipo} ${formatarUSD(titulo.capital)}`);
            } else if (titulo.moeda === 'Kz' && estado.saldoGovernoKz >= titulo.capital) {
                estado.saldoGovernoKz -= titulo.capital;
                estado.dividasAtivas = estado.dividasAtivas.filter(d => d.id !== titulo.id);
                estado.dividaPublica -= titulo.capital;
                adicionarAoHistorico('Pagamento', `Título quitado: ${titulo.tipo} ${formatarKwanza(titulo.capital)}`);
            } else {
                estado.rating.nivel = 'D';
                adicionarAoHistorico('Alerta', 'CALOTE NA DÍVIDA!', 'danger');
            }
        }
    });
}

function calcularJurosSemestrais(titulo) {
    return titulo.capital * titulo.taxaJurosAnual * 0.5;
}

function emitirDivida(tipo, moeda, valor, prazo, taxa) {
    if (moeda === 'USD' && valor > estado.reservasUSD * 0.5) {
        mostrarNotificacao('Valor muito alto para reservas atuais', 'danger');
        return false;
    }
    
    if (taxa < 0.1 || taxa > 0.25) {
        mostrarNotificacao('Taxa fora do intervalo permitido', 'danger');
        return false;
    }
    
    taxa *= estado.rating.multiplicadorJuros;
    
    const novoTitulo = {
        id: Date.now() + Math.random(),
        tipo: tipo,
        moeda: moeda,
        capital: valor,
        taxaJurosAnual: taxa,
        prazoAnos: prazo,
        dataEmissao: { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia },
        ultimoPagamentoJuros: { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia }
    };
    
    estado.dividasAtivas.push(novoTitulo);
    estado.dividaPublica += valor;
    
    if (moeda === 'USD') {
        estado.reservasUSD += valor;
    } else {
        estado.saldoGovernoKz += valor;
    }
    
    adicionarAoHistorico('Emissão', `Título emitido: ${tipo} ${moeda} ${formatarMoeda(valor, moeda)} a ${(taxa*100).toFixed(1)}%`);
    mostrarNotificacao('Título emitido com sucesso', 'success');
    return true;
}

function calcularInflacao() {
    let novaInflacao = 0.02;
    
    if (estado.taxaJuros < 0.05) novaInflacao += 0.03;
    if (estado.indiceConsumo > 1.2) novaInflacao += 0.02;
    if (estado.regimeCambial === 'flutuante' && VALORES_CAMBIO[estado.indiceCambio] > 900) {
        novaInflacao += 0.02;
    }
    if (estado.saldoGovernoKz < estado.calcularCustoSalarialMensal() * 3) {
        novaInflacao += 0.01;
    }
    
    if (estado.eventoAtivo && estado.eventoAtivo.impacto.inflacao) {
        novaInflacao += estado.eventoAtivo.impacto.inflacao;
    }
    
    estado.inflacao = Math.max(0, Math.min(0.5, novaInflacao));
}

function calcularDesemprego() {
    let novoDesemprego = 0.1;
    
    if (estado.taxaJuros > 0.2) novoDesemprego += 0.02;
    if (estado.taxaJuros > 0.3) novoDesemprego += 0.03;
    
    if (estado.eventoAtivo && estado.eventoAtivo.impacto.desemprego) {
        novoDesemprego += estado.eventoAtivo.impacto.desemprego;
    }
    
    const totalInvestimentos = estado.investimentosAtivos.length;
    novoDesemprego -= totalInvestimentos * 0.001;
    
    novoDesemprego += (1 - estado.empresasDetalhadas.C.satisfacao) * 0.05;
    
    estado.desemprego = Math.max(0.05, Math.min(0.4, novoDesemprego));
}

function atualizarIndicesSociais() {
    estado.indicePobreza = Math.min(1, 0.3 + estado.desemprego * 0.5 + estado.inflacao * 2);
    estado.indiceInsatisfacao = Math.min(1, estado.indicePobreza * 0.7 + (1 - estado.familiasDetalhadas.satisfacao) * 0.3);
    estado.indiceConsumo = Math.max(0.5, Math.min(1.5, 1.0 - estado.taxaJuros * 2 - estado.inflacao * 3));
    
    estado.familiasDetalhadas.satisfacao = Math.max(0, Math.min(1, 
        0.6 - estado.desemprego * 1.5 - estado.inflacao * 2 + (1 - estado.familiasDetalhadas.endividamento) * 0.3
    ));
}

function calcularCrescimentoPIB() {
    const crescimentoBase = 0.02;
    let crescimento = crescimentoBase - (estado.taxaJuros * 0.1);
    
    const totalInvestido = estado.investimentosAtivos.reduce((sum, i) => sum + i.valorTotal, 0);
    crescimento += (totalInvestido / estado.pib) * 0.5;
    
    if (estado.eventoAtivo && estado.eventoAtivo.impacto.pib) {
        crescimento += estado.eventoAtivo.impacto.pib;
    }
    
    crescimento += (estado.exportacoesMensais - estado.importacoesMensais) / estado.pib * 12;
    
    estado.pib = estado.pib * (1 + crescimento);
    estado.pibOriginal = estado.pib;
}

function reduzirDependenciaPetroleo() {
    const investimentosDiversificacao = estado.investimentosAtivos.filter(i => 
        ['Agricultura', 'Indústria', 'Tecnologia'].includes(i.area)
    ).length;
    
    estado.dependenciaPetroleo = Math.max(0.3, estado.dependenciaPetroleo - investimentosDiversificacao * 0.01);
}

function calcularBalancoComercial() {
    estado.exportacoesMensais = estado.investimentosAtivos
        .filter(i => i.tipo === 'exportacao')
        .reduce((sum, i) => sum + i.retornoMensal, 0);
    
    estado.importacoesMensais = estado.pib * 0.2 / 12 * (1 + estado.indiceConsumo);
    
    estado.balancoComercial = estado.exportacoesMensais - estado.importacoesMensais;
}

// ============================================
// FUNÇÕES DE CÂMBIO (COMPRA/VENDA DE USD)
// ============================================

function comprarUSD(valorUSD) {
    if (valorUSD > estado.reservasUSD) {
        mostrarNotificacao('Reservas insuficientes', 'danger');
        return false;
    }
    
    const valorKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio];
    
    if (valorKz > estado.saldoGovernoKz) {
        mostrarNotificacao('Saldo em Kwanzas insuficiente', 'danger');
        return false;
    }
    
    estado.reservasUSD -= valorUSD;
    estado.saldoGovernoKz += valorKz;
    
    estado.indiceCambio = Math.max(0, estado.indiceCambio - 1);
    
    adicionarAoHistorico('Câmbio', `Compra de USD: ${formatarUSD(valorUSD)} por ${formatarKwanza(valorKz)}`);
    mostrarNotificacao('USD comprados com sucesso', 'success');
    
    return true;
}

function venderUSD(valorUSD) {
    const valorKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio];
    
    if (valorKz > estado.saldoGovernoKz) {
        mostrarNotificacao('Saldo em Kwanzas insuficiente', 'danger');
        return false;
    }
    
    estado.reservasUSD += valorUSD;
    estado.saldoGovernoKz -= valorKz;
    
    estado.indiceCambio = Math.min(VALORES_CAMBIO.length - 1, estado.indiceCambio + 1);
    
    adicionarAoHistorico('Câmbio', `Venda de USD: ${formatarUSD(valorUSD)} por ${formatarKwanza(valorKz)}`);
    mostrarNotificacao('USD vendidos com sucesso', 'success');
    
    return true;
}

// ============================================
// FUNÇÕES DE INVESTIMENTOS
// ============================================

function realizarInvestimento(tipo, nivel, area, quantidade) {
    const niveis = tipo === 'publico' ? NIVEIS_INVESTIMENTO : NIVEIS_EXPORTACAO;
    const config = niveis[nivel];
    
    if (!config) return false;
    
    const custoTotal = config.custoMinimo * quantidade;
    
    if (custoTotal > estado.reservasUSD * 0.3) {
        mostrarNotificacao('Recursos insuficientes (máx 30% das reservas)', 'danger');
        return false;
    }
    
    estado.reservasUSD -= custoTotal;
    
    const investimento = {
        id: Date.now() + Math.random(),
        tipo: tipo,
        nivel: nivel,
        area: area,
        quantidade: quantidade,
        valorTotal: custoTotal,
        dataInicio: { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia },
        mesesRestantes: config.tempoMaturacao || 12,
        retornoMensal: tipo === 'publico' 
            ? (config.impactoPIB * quantidade) / 12
            : (config.custo * config.retornoPIB * quantidade) / 12,
        retornoReservasMensal: tipo === 'exportacao'
            ? (config.custo * config.retornoReservas * quantidade) / 12
            : 0
    };
    
    estado.investimentosAtivos.push(investimento);
    adicionarAoHistorico('Investimento', `${tipo} ${nivel} em ${area}: ${formatarUSD(custoTotal)}`);
    mostrarNotificacao('Investimento realizado com sucesso', 'success');
    
    return true;
}

function processarRetornoInvestimentos() {
    estado.investimentosAtivos.forEach(invest => {
        estado.pib += invest.retornoMensal;
        
        if (invest.tipo === 'exportacao') {
            estado.reservasUSD += invest.retornoReservasMensal;
        }
        
        invest.mesesRestantes--;
    });
    
    estado.investimentosAtivos = estado.investimentosAtivos.filter(i => i.mesesRestantes > 0);
}

// ============================================
// FUNÇÕES DE INVESTIMENTOS INTERNACIONAIS
// ============================================

function inicializarMercadoInternacional() {
    estado.carteiraInternacional.acoesDisponiveis = ACOES_INTERNACIONAIS.map(a => 
        new AcaoInternacional(a.nome, a.ticker, a.setor, a.pais, a.precoBase, a.volatilidade)
    );
    
    estado.carteiraInternacional.saldoUSD = estado.reservasUSD * 0.1;
    atualizarValorCarteira();
}

function comprarAcao(ticker, quantidade) {
    const acao = estado.carteiraInternacional.acoesDisponiveis.find(a => a.ticker === ticker);
    
    if (!acao) {
        mostrarNotificacao('Ação não encontrada', 'danger');
        return false;
    }
    
    const custoTotal = acao.precoAtual * quantidade;
    
    if (custoTotal > estado.carteiraInternacional.saldoUSD) {
        mostrarNotificacao('Saldo insuficiente na carteira internacional', 'danger');
        return false;
    }
    
    let acaoExistente = estado.carteiraInternacional.acoes.find(a => a.ticker === ticker);
    
    if (acaoExistente) {
        const quantidadeAnterior = acaoExistente.quantidade;
        acaoExistente.quantidade += quantidade;
        acaoExistente.precoMedioCompra = (acaoExistente.precoMedioCompra * quantidadeAnterior + acao.precoAtual * quantidade) / acaoExistente.quantidade;
    } else {
        const novaAcao = new AcaoInternacional(acao.nome, acao.ticker, acao.setor, acao.pais, acao.precoAtual, acao.volatilidade);
        novaAcao.quantidade = quantidade;
        novaAcao.precoMedioCompra = acao.precoAtual;
        estado.carteiraInternacional.acoes.push(novaAcao);
    }
    
    estado.carteiraInternacional.saldoUSD -= custoTotal;
    atualizarValorCarteira();
    
    adicionarAoHistorico('Investimento', `Compra de ${quantidade} ${ticker} por ${formatarUSD(custoTotal)}`);
    mostrarNotificacao(`Compra de ${quantidade} ${ticker} realizada`, 'success');
    
    return true;
}

function venderAcao(ticker, quantidade) {
    const acaoIndex = estado.carteiraInternacional.acoes.findIndex(a => a.ticker === ticker);
    
    if (acaoIndex === -1) {
        mostrarNotificacao('Ação não encontrada na carteira', 'danger');
        return false;
    }
    
    const acao = estado.carteiraInternacional.acoes[acaoIndex];
    
    if (quantidade > acao.quantidade) {
        mostrarNotificacao('Quantidade insuficiente', 'danger');
        return false;
    }
    
    const valorVenda = acao.precoAtual * quantidade;
    const lucroPrejuizo = (acao.precoAtual - acao.precoMedioCompra) * quantidade;
    
    acao.quantidade -= quantidade;
    
    if (acao.quantidade === 0) {
        estado.carteiraInternacional.acoes.splice(acaoIndex, 1);
    }
    
    estado.carteiraInternacional.saldoUSD += valorVenda;
    atualizarValorCarteira();
    
    const sinal = lucroPrejuizo >= 0 ? '+' : '';
    adicionarAoHistorico('Investimento', `Venda de ${quantidade} ${ticker} por ${formatarUSD(valorVenda)} (${sinal}${formatarUSD(lucroPrejuizo)})`);
    mostrarNotificacao(`Venda de ${quantidade} ${ticker} realizada`, 'success');
    
    return true;
}

function comprarTituloEstrangeiro(pais, valor, prazo) {
    const tituloInfo = TITULOS_ESTRANGEIROS.find(t => t.pais === pais);
    
    if (!tituloInfo) {
        mostrarNotificacao('País não encontrado', 'danger');
        return false;
    }
    
    if (valor > estado.carteiraInternacional.saldoUSD) {
        mostrarNotificacao('Saldo insuficiente na carteira internacional', 'danger');
        return false;
    }
    
    let taxaJuros = tituloInfo.taxaBase;
    
    if (tituloInfo.risco === 'Baixo') {
        taxaJuros *= 1.0;
    } else if (tituloInfo.risco === 'Médio') {
        taxaJuros *= 1.5;
    } else {
        taxaJuros *= 2.0;
    }
    
    const novoTitulo = new TituloEstrangeiro(
        tituloInfo.pais,
        tituloInfo.moeda,
        taxaJuros,
        prazo || 5,
        valor
    );
    
    novoTitulo.dataCompra = { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia };
    novoTitulo.dataVencimento = { 
        ano: estado.tempo.ano + (prazo || 5), 
        mes: estado.tempo.mes, 
        dia: estado.tempo.dia 
    };
    novoTitulo.ultimoPagamentoJuros = { ano: estado.tempo.ano, mes: estado.tempo.mes, dia: estado.tempo.dia };
    
    estado.carteiraInternacional.titulosEstrangeiros.push(novoTitulo);
    estado.carteiraInternacional.saldoUSD -= valor;
    atualizarValorCarteira();
    
    adicionarAoHistorico('Investimento', `Compra de título ${pais} por ${formatarUSD(valor)} a ${(taxaJuros*100).toFixed(1)}%`);
    mostrarNotificacao(`Título de ${pais} adquirido`, 'success');
    
    return true;
}

function processarInvestimentosInternacionais() {
    estado.carteiraInternacional.acoesDisponiveis.forEach(acao => {
        acao.atualizarPreco(estado.eventoAtivo);
    });
    
    estado.carteiraInternacional.acoes.forEach(acao => {
        const acaoRef = estado.carteiraInternacional.acoesDisponiveis.find(a => a.ticker === acao.ticker);
        if (acaoRef) {
            acao.precoAtual = acaoRef.precoAtual;
        }
    });
    
    estado.carteiraInternacional.titulosEstrangeiros.forEach(titulo => {
        const mesesDesdeUltimo = (estado.tempo.ano - titulo.ultimoPagamentoJuros.ano) * 12 + 
                                 (estado.tempo.mes - titulo.ultimoPagamentoJuros.mes);
        
        if (mesesDesdeUltimo >= 6) {
            const juros = titulo.calcularJurosSemestrais();
            estado.carteiraInternacional.saldoUSD += juros;
            titulo.ultimoPagamentoJuros = {
                ano: estado.tempo.ano,
                mes: estado.tempo.mes,
                dia: estado.tempo.dia
            };
            titulo.jurosAcumulados += juros;
            
            adicionarAoHistorico('Rendimento', `Juros recebidos: ${titulo.pais} ${formatarUSD(juros)}`);
        }
        
        if (estado.tempo.ano >= titulo.dataVencimento.ano && 
            estado.tempo.mes >= titulo.dataVencimento.mes) {
            const totalReceber = titulo.valorInvestido + titulo.calcularJurosSemestrais();
            estado.carteiraInternacional.saldoUSD += totalReceber;
            
            adicionarAoHistorico('Investimento', `Título ${titulo.pais} venceu: ${formatarUSD(totalReceber)}`);
            
            estado.carteiraInternacional.titulosEstrangeiros = 
                estado.carteiraInternacional.titulosEstrangeiros.filter(t => t.id !== titulo.id);
        }
    });
    
    atualizarValorCarteira();
}

function atualizarValorCarteira() {
    let valorAcoes = 0;
    estado.carteiraInternacional.acoes.forEach(acao => {
        valorAcoes += acao.precoAtual * acao.quantidade;
    });
    
    let valorTitulos = 0;
    estado.carteiraInternacional.titulosEstrangeiros.forEach(titulo => {
        valorTitulos += titulo.valorInvestido;
    });
    
    estado.carteiraInternacional.valorTotal = 
        estado.carteiraInternacional.saldoUSD + valorAcoes + valorTitulos;
}

// ============================================
// FUNÇÕES DE EMPRESAS E FAMÍLIAS
// ============================================

function atualizarEmpresas() {
    const fatorJuros = 1 - (estado.taxaJuros * 0.5);
    const fatorConsumo = estado.indiceConsumo;
    const fatorCambio = VALORES_CAMBIO[estado.indiceCambio] > 900 ? 0.9 : 1.1;
    
    const empresasA = estado.empresasDetalhadas.A;
    empresasA.faturamentoMensal = 50000000 * fatorConsumo * (1 - estado.inflacao * 0.5) * fatorCambio;
    empresasA.lucroMensal = empresasA.faturamentoMensal * 0.1;
    empresasA.endividamento = Math.min(1, 0.3 + estado.taxaJuros * 0.5);
    empresasA.satisfacao = Math.max(0, Math.min(1, 0.8 - estado.desemprego * 0.5 - estado.inflacao));
    empresasA.emRisco = empresasA.endividamento > 0.8 ? empresasA.quantidade * 0.1 : 0;
    
    const empresasB = estado.empresasDetalhadas.B;
    empresasB.faturamentoMensal = 2000000 * fatorConsumo * (1 - estado.inflacao) * fatorJuros;
    empresasB.lucroMensal = empresasB.faturamentoMensal * 0.08;
    empresasB.endividamento = Math.min(1, 0.5 + estado.taxaJuros);
    empresasB.satisfacao = Math.max(0, Math.min(1, 0.6 - estado.desemprego - estado.inflacao * 0.5));
    empresasB.emRisco = empresasB.endividamento > 0.7 ? empresasB.quantidade * 0.15 : 0;
    
    const empresasC = estado.empresasDetalhadas.C;
    empresasC.faturamentoMensal = 100000 * fatorConsumo * (1 - estado.inflacao * 1.5) * fatorJuros * 0.8;
    empresasC.lucroMensal = empresasC.faturamentoMensal * 0.05;
    empresasC.endividamento = Math.min(1, 0.7 + estado.taxaJuros * 1.5);
    empresasC.satisfacao = Math.max(0, Math.min(1, 0.4 - estado.desemprego * 1.5 - estado.inflacao));
    empresasC.emRisco = empresasC.endividamento > 0.6 ? empresasC.quantidade * 0.2 : 0;
    
    if (empresasC.emRisco > 0 && Math.random() < 0.1) {
        const falencias = Math.floor(Math.random() * empresasC.emRisco);
        empresasC.quantidade = Math.max(0, empresasC.quantidade - falencias);
        adicionarAoHistorico('Empresas', `${falencias} pequenas empresas faliram`, 'danger');
    }
    
    if (empresasB.emRisco > 0 && Math.random() < 0.05) {
        const falencias = Math.floor(Math.random() * empresasB.emRisco * 0.5);
        empresasB.quantidade = Math.max(0, empresasB.quantidade - falencias);
        adicionarAoHistorico('Empresas', `${falencias} médias empresas faliram`, 'warning');
    }
    
    if (estado.taxaJuros < 0.1 && Math.random() < 0.2) {
        const novasEmpresas = Math.floor(Math.random() * 100) + 50;
        empresasC.quantidade += novasEmpresas;
        adicionarAoHistorico('Empresas', `${novasEmpresas} novas empresas abertas`, 'success');
    }
}

function atualizarFamilias() {
    const familias = estado.familiasDetalhadas;
    
    familias.rendaMedia = 100000 * (1 - estado.desemprego) * (1 - familias.informalidade * 0.5);
    familias.poderCompra = 1 / (1 + estado.inflacao);
    familias.endividamento = Math.min(1, 0.4 + estado.taxaJuros);
    familias.poupancaMedia = familias.rendaMedia * 0.2 * (1 + estado.taxaJuros * 2);
    
    familias.satisfacao = Math.max(0, Math.min(1, 
        0.6 - estado.desemprego * 1.5 - estado.inflacao * 2 + (1 - familias.endividamento) * 0.3
    ));
    
    familias.acessoCredito = Math.max(0, Math.min(1, 0.5 - estado.taxaJuros * 2));
    
    if (estado.desemprego > 0.2) {
        familias.informalidade = Math.min(1, familias.informalidade + 0.01);
    } else if (estado.taxaJuros < 0.1) {
        familias.informalidade = Math.max(0.1, familias.informalidade - 0.005);
    }
    
    familias.pobreza = estado.indicePobreza;
    familias.gini = 0.5 + familias.informalidade * 0.3 + estado.desemprego * 0.2;
}

// ============================================
// FUNÇÕES DE OURO
// ============================================

function comprarOuro(valorUSD) {
    if (valorUSD > estado.reservasUSD) {
        mostrarNotificacao('Reservas insuficientes', 'danger');
        return false;
    }
    
    const oncasCompradas = valorUSD / estado.ouro.precoPorOnca;
    estado.reservasUSD -= valorUSD;
    estado.ouro.oncas += oncasCompradas;
    
    adicionarAoHistorico('Ouro', `Compra: ${oncasCompradas.toFixed(2)} onças por ${formatarUSD(valorUSD)}`);
    mostrarNotificacao('Ouro comprado com sucesso', 'success');
    return true;
}

function venderOuro(oncas) {
    if (oncas > estado.ouro.oncas) {
        mostrarNotificacao('Ouro insuficiente', 'danger');
        return false;
    }
    
    const valorRecebido = oncas * estado.ouro.precoPorOnca;
    estado.reservasUSD += valorRecebido;
    estado.ouro.oncas -= oncas;
    
    adicionarAoHistorico('Ouro', `Venda: ${oncas.toFixed(2)} onças por ${formatarUSD(valorRecebido)}`);
    mostrarNotificacao('Ouro vendido com sucesso', 'success');
    return true;
}

function atualizarPrecoOuro() {
    const variacao = (Math.random() - 0.5) * 100;
    let novoPreco = estado.ouro.precoPorOnca + variacao;
    
    if (estado.eventoAtivo) {
        if (estado.eventoAtivo.nome.includes('Crise')) {
            novoPreco *= 1.1;
        } else if (estado.eventoAtivo.nome.includes('Boom')) {
            novoPreco *= 0.95;
        }
    }
    
    novoPreco = Math.max(1200, Math.min(3500, novoPreco));
    estado.ouro.precoPorOnca = novoPreco;
    
    estado.ouro.historico.push({
        data: `${estado.tempo.mes}/${estado.tempo.ano}`,
        preco: novoPreco
    });
    
    if (estado.ouro.historico.length > 12) {
        estado.ouro.historico.shift();
    }
}

// ============================================
// FUNÇÕES DE EVENTOS ALEATÓRIOS
// ============================================

function ativarEventoAleatorio() {
    const evento = EVENTOS_GLOBAIS[Math.floor(Math.random() * EVENTOS_GLOBAIS.length)];
    const duracaoAnos = evento.duracao.min + Math.random() * (evento.duracao.max - evento.duracao.min);
    const duracaoMeses = duracaoAnos * 12;
    
    estado.eventoAtivo = {
        ...evento,
        duracaoMeses: duracaoMeses,
        mesesRestantes: duracaoMeses
    };
    
    estado.eventoTermino = {
        ano: estado.tempo.ano + Math.floor(duracaoAnos),
        mes: estado.tempo.mes + Math.floor(duracaoMeses % 12)
    };
    
    if (evento.impacto.cambio) {
        estado.indiceCambio = Math.min(VALORES_CAMBIO.length - 1, 
                                      Math.max(0, estado.indiceCambio + evento.impacto.cambio));
    }
    
    if (evento.impacto.reservas) {
        estado.reservasUSD *= (1 + evento.impacto.reservas);
    }
    
    adicionarAoHistorico('Evento', `INÍCIO: ${evento.nome}`, evento.cor === '#cc3333' ? 'danger' : 'success');
    mostrarNotificacao(`Evento iniciado: ${evento.nome}`, evento.cor === '#cc3333' ? 'danger' : 'success');
}

function processarEventoAtivo() {
    if (!estado.eventoAtivo) return;
    
    estado.eventoAtivo.mesesRestantes--;
    
    if (estado.eventoAtivo.mesesRestantes <= 0) {
        adicionarAoHistorico('Evento', `FIM: ${estado.eventoAtivo.nome}`, 'success');
        mostrarNotificacao(`Evento encerrado: ${estado.eventoAtivo.nome}`, 'success');
        estado.eventoAtivo = null;
        estado.eventoTermino = null;
    }
}

// ============================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================

function formatarKwanza(valor) {
    if (valor >= 1e12) return (valor / 1e12).toFixed(1) + ' T Kz';
    if (valor >= 1e9) return (valor / 1e9).toFixed(1) + ' B Kz';
    if (valor >= 1e6) return (valor / 1e6).toFixed(1) + ' M Kz';
    if (valor >= 1e3) return (valor / 1e3).toFixed(1) + ' k Kz';
    return valor.toFixed(0) + ' Kz';
}

function formatarUSD(valor) {
    if (valor >= 1e9) return '$' + (valor / 1e9).toFixed(1) + 'B';
    if (valor >= 1e6) return '$' + (valor / 1e6).toFixed(1) + 'M';
    if (valor >= 1e3) return '$' + (valor / 1e3).toFixed(1) + 'k';
    return '$' + valor.toFixed(0);
}

function formatarMoeda(valor, moeda) {
    if (moeda === 'USD') return formatarUSD(valor);
    return formatarKwanza(valor);
}

// ============================================
// FUNÇÕES DE HISTÓRICO
// ============================================

function adicionarAoHistorico(tipo, descricao, classe = '') {
    const dataStr = `${estado.tempo.dia.toString().padStart(2, '0')}/${estado.tempo.mes.toString().padStart(2, '0')}/${estado.tempo.ano}`;
    
    estado.historico.unshift({
        data: dataStr,
        tipo: tipo,
        descricao: descricao,
        classe: classe
    });
    
    if (estado.historico.length > 50) {
        estado.historico.pop();
    }
}

// ============================================
// FUNÇÕES DE INTERFACE (ATUALIZAÇÃO)
// ============================================

function atualizarInterface() {
    document.getElementById('dataSimulada').textContent = 
        `${estado.tempo.dia.toString().padStart(2, '0')}/${estado.tempo.mes.toString().padStart(2, '0')}/${estado.tempo.ano}`;
    
    document.getElementById('anoProgresso').textContent = `Ano ${estado.tempo.ano - 2024}/∞`;
    
    document.getElementById('pibValor').textContent = formatarUSD(estado.pib);
    document.getElementById('pibVariacao').textContent = 
        `+${((estado.pib / estado.pibOriginal - 1) * 100).toFixed(1)}%`;
    
    document.getElementById('inflacaoValor').textContent = (estado.inflacao * 100).toFixed(1) + '%';
    document.getElementById('inflacaoStatus').textContent = 
        estado.inflacao < 0.03 ? 'Estável' : estado.inflacao < 0.07 ? 'Moderada' : 'Crítica';
    
    document.getElementById('desempregoValor').textContent = (estado.desemprego * 100).toFixed(1) + '%';
    document.getElementById('desempregoTendencia').textContent = 
        estado.desemprego > 0.15 ? '↑' : estado.desemprego < 0.08 ? '↓' : '→';
    
    document.getElementById('cambioValor').textContent = VALORES_CAMBIO[estado.indiceCambio];
    document.getElementById('regimeCambial').textContent = 
        estado.regimeCambial === 'fixo' ? 'Fixo' : 
        estado.regimeCambial === 'flutuante' ? 'Flutuante' : 'Bandas';
    
    document.getElementById('reservasValor').textContent = formatarUSD(estado.reservasUSD);
    document.getElementById('dividaPIB').textContent = estado.calcularDividaPercentualPIB().toFixed(1) + '%';
    
    const ratingEl = document.getElementById('ratingDisplay');
    ratingEl.textContent = estado.rating.nivel;
    ratingEl.style.color = estado.rating.cor;
    
    const eventoContainer = document.getElementById('eventoContainer');
    if (estado.eventoAtivo) {
        eventoContainer.style.display = 'block';
        eventoContainer.style.borderLeftColor = estado.eventoAtivo.cor;
        document.getElementById('eventoNome').textContent = estado.eventoAtivo.nome;
        document.getElementById('eventoNome').style.color = estado.eventoAtivo.cor;
        document.getElementById('eventoTempo').textContent = 
            `Restante: ${Math.ceil(estado.eventoAtivo.mesesRestantes)} meses`;
    } else {
        eventoContainer.style.display = 'none';
    }
}

function atualizarInterfaceExpandida() {
    if (!document.getElementById('saldoGovernoValor')) return;
    
    document.getElementById('saldoGovernoValor').textContent = formatarKwanza(estado.saldoGovernoKz);
    
    const receitaMensal = estado.calcularReceitaMensal();
    const custoSalarial = estado.calcularCustoSalarialMensal();
    const outrasDespesas = custoSalarial * 0.3;
    const despesaMensal = custoSalarial + outrasDespesas;
    
    estado.receitaMensalKz = receitaMensal;
    estado.despesaMensalKz = despesaMensal;
    
    document.getElementById('receitaMensal').textContent = formatarKwanza(receitaMensal);
    document.getElementById('despesaMensal').textContent = formatarKwanza(despesaMensal);
    document.getElementById('custoSalarial').textContent = formatarKwanza(custoSalarial);
    
    const saldoStatus = document.getElementById('saldoGovernoStatus');
    if (estado.saldoGovernoKz < custoSalarial * 3) {
        saldoStatus.textContent = 'Crítico';
        saldoStatus.style.backgroundColor = 'rgba(204, 51, 51, 0.2)';
        saldoStatus.style.color = '#cc3333';
    } else if (estado.saldoGovernoKz < custoSalarial * 6) {
        saldoStatus.textContent = 'Atenção';
        saldoStatus.style.backgroundColor = 'rgba(243, 156, 18, 0.2)';
        saldoStatus.style.color = '#f39c12';
    } else {
        saldoStatus.textContent = 'Estável';
        saldoStatus.style.backgroundColor = 'rgba(51, 204, 51, 0.2)';
        saldoStatus.style.color = '#33cc33';
    }
    
    const historicoHTML = estado.saldoHistorico.slice(-6).map((item, i) => {
        const altura = (item.saldo / Math.max(...estado.saldoHistorico.map(h => h.saldo)) * 100) || 50;
        return `<div class="barra-historico" style="height: ${altura}px" title="${item.data}: ${formatarKwanza(item.saldo)}"></div>`;
    }).join('');
    document.getElementById('saldoHistorico').innerHTML = `<div class="historico-barras">${historicoHTML}</div>`;
    
    document.getElementById('carteiraValorTotal').textContent = formatarUSD(estado.carteiraInternacional.valorTotal);
    document.getElementById('carteiraSaldo').textContent = formatarUSD(estado.carteiraInternacional.saldoUSD);
    
    const valorAcoes = estado.carteiraInternacional.acoes.reduce((sum, a) => sum + (a.precoAtual * a.quantidade), 0);
    const valorTitulos = estado.carteiraInternacional.titulosEstrangeiros.reduce((sum, t) => sum + t.valorInvestido, 0);
    
    document.getElementById('carteiraAcoes').textContent = formatarUSD(valorAcoes);
    document.getElementById('carteiraTitulos').textContent = formatarUSD(valorTitulos);
    
    document.getElementById('empresasAQtd').textContent = estado.empresasDetalhadas.A.quantidade;
    document.getElementById('empresasAFaturamento').textContent = formatarUSD(estado.empresasDetalhadas.A.faturamentoMensal);
    document.getElementById('empresasALucro').textContent = formatarUSD(estado.empresasDetalhadas.A.lucroMensal);
    document.getElementById('empresasAEndividamento').textContent = (estado.empresasDetalhadas.A.endividamento * 100).toFixed(1) + '%';
    document.getElementById('empresasASatisfacao').textContent = (estado.empresasDetalhadas.A.satisfacao * 100).toFixed(1) + '%';
    document.getElementById('empresasARisco').textContent = estado.empresasDetalhadas.A.emRisco;
    
    document.getElementById('empresasBQtd').textContent = estado.empresasDetalhadas.B.quantidade;
    document.getElementById('empresasBFaturamento').textContent = formatarUSD(estado.empresasDetalhadas.B.faturamentoMensal);
    document.getElementById('empresasBLucro').textContent = formatarUSD(estado.empresasDetalhadas.B.lucroMensal);
    document.getElementById('empresasBEndividamento').textContent = (estado.empresasDetalhadas.B.endividamento * 100).toFixed(1) + '%';
    document.getElementById('empresasBSatisfacao').textContent = (estado.empresasDetalhadas.B.satisfacao * 100).toFixed(1) + '%';
    document.getElementById('empresasBRisco').textContent = estado.empresasDetalhadas.B.emRisco;
    
    document.getElementById('empresasCQtd').textContent = estado.empresasDetalhadas.C.quantidade;
    document.getElementById('empresasCFaturamento').textContent = formatarUSD(estado.empresasDetalhadas.C.faturamentoMensal);
    document.getElementById('empresasCLucro').textContent = formatarUSD(estado.empresasDetalhadas.C.lucroMensal);
    document.getElementById('empresasCEndividamento').textContent = (estado.empresasDetalhadas.C.endividamento * 100).toFixed(1) + '%';
    document.getElementById('empresasCSatisfacao').textContent = (estado.empresasDetalhadas.C.satisfacao * 100).toFixed(1) + '%';
    document.getElementById('empresasCRisco').textContent = estado.empresasDetalhadas.C.emRisco;
    
    document.getElementById('rendaMedia').textContent = formatarKwanza(estado.familiasDetalhadas.rendaMedia);
    document.getElementById('rendaProgresso').style.width = (estado.familiasDetalhadas.rendaMedia / 200000 * 100) + '%';
    
    document.getElementById('poderCompra').textContent = estado.familiasDetalhadas.poderCompra.toFixed(2);
    document.getElementById('compraProgresso').style.width = (estado.familiasDetalhadas.poderCompra * 100) + '%';
    
    document.getElementById('endividamentoFamiliar').textContent = (estado.familiasDetalhadas.endividamento * 100).toFixed(1) + '%';
    document.getElementById('endividamentoProgresso').style.width = (estado.familiasDetalhadas.endividamento * 100) + '%';
    
    document.getElementById('poupancaMedia').textContent = formatarKwanza(estado.familiasDetalhadas.poupancaMedia);
    document.getElementById('poupancaProgresso').style.width = (estado.familiasDetalhadas.poupancaMedia / 100000 * 100) + '%';
    
    document.getElementById('satisfacaoFamiliar').textContent = (estado.familiasDetalhadas.satisfacao * 100).toFixed(1) + '%';
    document.getElementById('satisfacaoProgresso').style.width = (estado.familiasDetalhadas.satisfacao * 100) + '%';
    
    document.getElementById('acessoCredito').textContent = (estado.familiasDetalhadas.acessoCredito * 100).toFixed(1) + '%';
    document.getElementById('creditoProgresso').style.width = (estado.familiasDetalhadas.acessoCredito * 100) + '%';
    
    document.getElementById('informalidade').textContent = (estado.familiasDetalhadas.informalidade * 100).toFixed(1) + '%';
    document.getElementById('informalidadeProgresso').style.width = (estado.familiasDetalhadas.informalidade * 100) + '%';
    
    document.getElementById('pobreza').textContent = (estado.familiasDetalhadas.pobreza * 100).toFixed(1) + '%';
    document.getElementById('pobrezaProgresso').style.width = (estado.familiasDetalhadas.pobreza * 100) + '%';
    
    document.getElementById('giniValor').textContent = estado.familiasDetalhadas.gini.toFixed(2);
    document.getElementById('giniProgresso').style.width = (estado.familiasDetalhadas.gini * 100) + '%';
    
    document.getElementById('bemEstarSocial').textContent = (estado.familiasDetalhadas.satisfacao * 100).toFixed(1) + '%';
    
    const historicoEl = document.getElementById('historicoAcoes');
    if (historicoEl) {
        historicoEl.innerHTML = '';
        estado.historico.slice(0, 20).forEach(item => {
            const div = document.createElement('div');
            div.className = `historico-item ${item.classe}`;
            div.innerHTML = `
                <span class="data">${item.data}</span>
                <span class="acao">${item.tipo}:</span>
                <span class="descricao">${item.descricao}</span>
            `;
            historicoEl.appendChild(div);
        });
    }
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `alert-${tipo}`;
    notificacao.style.position = 'fixed';
    notificacao.style.top = '20px';
    notificacao.style.right = '20px';
    notificacao.style.zIndex = '10000';
    notificacao.style.minWidth = '300px';
    notificacao.style.padding = '15px 20px';
    notificacao.style.borderRadius = '12px';
    notificacao.style.animation = 'slideInRight 0.3s ease';
    notificacao.style.backgroundColor = tipo === 'danger' ? 'rgba(204, 51, 51, 0.1)' : 
                                        tipo === 'success' ? 'rgba(51, 204, 51, 0.1)' : 
                                        'rgba(214, 174, 100, 0.1)';
    notificacao.style.border = tipo === 'danger' ? '1px solid #cc3333' : 
                               tipo === 'success' ? '1px solid #33cc33' : 
                               '1px solid rgb(214, 174, 100)';
    notificacao.style.color = tipo === 'danger' ? '#cc3333' : 
                              tipo === 'success' ? '#33cc33' : 
                              'rgb(214, 174, 100)';
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 5000);
}

// ============================================
// INICIALIZAÇÃO DA INTERFACE
// ============================================

function inicializarInterface() {
    formInicio = document.getElementById('formInicio');
    dashboard = document.getElementById('dashboard');
    inicioSection = document.querySelector('.simulador-inicio');
    
    if (formInicio) {
        formInicio.addEventListener('submit', (e) => {
            e.preventDefault();
            
            estado.usuario.nome = document.getElementById('nome').value;
            estado.usuario.genero = document.querySelector('input[name="genero"]:checked').value;
            estado.usuario.provincia = document.getElementById('provincia').value;
            
            inicioSection.style.display = 'none';
            dashboard.style.display = 'block';
            
            document.getElementById('nomeUsuarioDisplay').textContent = estado.usuario.nome;
            document.getElementById('provinciaDisplay').textContent = estado.usuario.provincia;
            
            iniciarTempo();
            inicializarMercadoInternacional();
            adicionarAoHistorico('Sistema', 'Simulação iniciada');
        });
    }
    
    const sliderJuros = document.getElementById('taxaJuros');
    const jurosDisplay = document.getElementById('jurosDisplay');
    const jurosAtual = document.getElementById('jurosAtual');
    
    if (sliderJuros) {
        sliderJuros.addEventListener('input', () => {
            const valor = sliderJuros.value;
            jurosDisplay.textContent = valor + '%';
        });
    }
    
    const aplicarBNA = document.getElementById('aplicarBNA');
    if (aplicarBNA) {
        aplicarBNA.addEventListener('click', () => {
            estado.taxaJuros = parseFloat(sliderJuros.value) / 100;
            jurosAtual.textContent = (estado.taxaJuros * 100).toFixed(1) + '%';
            
            const regime = document.querySelector('input[name="regimeCambial"]:checked').value;
            estado.regimeCambial = regime;
            
            if (regime === 'fixo') {
                estado.cambioFixo = parseInt(document.getElementById('cambioFixo').value);
                estado.indiceCambio = VALORES_CAMBIO.findIndex(v => v >= estado.cambioFixo);
                if (estado.indiceCambio === -1) estado.indiceCambio = VALORES_CAMBIO.length - 1;
            } else if (regime === 'bandas') {
                estado.bandaMin = parseInt(document.getElementById('bandaMin').value);
                estado.bandaMax = parseInt(document.getElementById('bandaMax').value);
            }
            
            adicionarAoHistorico('BNA', `Juros: ${(estado.taxaJuros*100).toFixed(1)}%, Regime: ${regime}`);
            mostrarNotificacao('Configurações do BNA aplicadas', 'success');
        });
    }
    
    document.querySelectorAll('input[name="regimeCambial"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.getElementById('configFixo').style.display = e.target.value === 'fixo' ? 'block' : 'none';
            document.getElementById('configBandas').style.display = e.target.value === 'bandas' ? 'block' : 'none';
        });
    });
    
    const bandaMin = document.getElementById('bandaMin');
    const bandaMax = document.getElementById('bandaMax');
    
    if (bandaMin && bandaMax) {
        VALORES_CAMBIO.forEach(valor => {
            const optionMin = document.createElement('option');
            optionMin.value = valor;
            optionMin.textContent = valor + ' Kz';
            bandaMin.appendChild(optionMin);
            
            const optionMax = document.createElement('option');
            optionMax.value = valor;
            optionMax.textContent = valor + ' Kz';
            bandaMax.appendChild(optionMax);
        });
        
        bandaMin.value = 700;
        bandaMax.value = 900;
    }
    
    document.querySelectorAll('input[name="tipoDivida"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const hint = document.getElementById('taxaRangeHint');
            const taxaInput = document.getElementById('taxaDivida');
            if (e.target.value === 'interna') {
                hint.textContent = 'Interna: 15-25%';
                taxaInput.min = 15;
                taxaInput.max = 25;
                taxaInput.value = 15;
            } else {
                hint.textContent = 'Externa: 10-20%';
                taxaInput.min = 10;
                taxaInput.max = 20;
                taxaInput.value = 10;
            }
        });
    });
    
    const emitirDivida = document.getElementById('emitirDivida');
    if (emitirDivida) {
        emitirDivida.addEventListener('click', () => {
            const tipo = document.querySelector('input[name="tipoDivida"]:checked').value;
            const moeda = tipo === 'interna' ? 'Kz' : 'USD';
            const valor = parseFloat(document.getElementById('valorDivida').value);
            const prazo = parseInt(document.getElementById('prazoDivida').value);
            const taxa = parseFloat(document.getElementById('taxaDivida').value) / 100;
            
            if (!valor || valor <= 0) {
                mostrarNotificacao('Valor inválido', 'danger');
                return;
            }
            
            emitirDivida(tipo, moeda, valor, prazo, taxa);
        });
    }
    
    document.querySelectorAll('input[name="tipoInvestimento"], input[name="nivelInvestimento"]').forEach(input => {
        input.addEventListener('change', atualizarInfoInvestimento);
    });
    
    const quantidadeInvestimento = document.getElementById('quantidadeInvestimento');
    if (quantidadeInvestimento) {
        quantidadeInvestimento.addEventListener('input', atualizarInfoInvestimento);
    }
    
    function atualizarInfoInvestimento() {
        const tipo = document.querySelector('input[name="tipoInvestimento"]:checked').value;
        const nivel = document.querySelector('input[name="nivelInvestimento"]:checked').value;
        const quantidade = parseInt(document.getElementById('quantidadeInvestimento').value) || 1;
        
        const niveis = tipo === 'publico' ? NIVEIS_INVESTIMENTO : NIVEIS_EXPORTACAO;
        const config = niveis[nivel];
        
        if (!config) return;
        
        const custoTotal = config.custoMinimo * quantidade;
        document.getElementById('custoTotalInvestimento').textContent = formatarUSD(custoTotal);
        
        if (tipo === 'publico') {
            document.getElementById('retornoPIBInfo').textContent = `+${formatarUSD(config.impactoPIB * quantidade)}/ano`;
            document.getElementById('retornoReservasInfo').textContent = `+${config.impactoReservas * 100}%`;
            document.getElementById('areaInvestimentoGroup').style.display = 'block';
        } else {
            const retornoTotal = config.custo * config.retornoTotal * quantidade;
            document.getElementById('retornoPIBInfo').textContent = `+${formatarUSD(retornoTotal)} total`;
            document.getElementById('retornoReservasInfo').textContent = `+${config.retornoReservas * 100}% reservas`;
            document.getElementById('areaInvestimentoGroup').style.display = 'none';
        }
    }
    
    const realizarInvestimentoBtn = document.getElementById('realizarInvestimento');
    if (realizarInvestimentoBtn) {
        realizarInvestimentoBtn.addEventListener('click', () => {
            const tipo = document.querySelector('input[name="tipoInvestimento"]:checked').value;
            const nivel = document.querySelector('input[name="nivelInvestimento"]:checked').value;
            const area = tipo === 'publico' ? document.getElementById('areaInvestimento').value : 'Exportação';
            const quantidade = parseInt(document.getElementById('quantidadeInvestimento').value) || 1;
            
            realizarInvestimento(tipo, nivel, area, quantidade);
        });
    }
    
    const executarOuro = document.getElementById('executarOuro');
    if (executarOuro) {
        executarOuro.addEventListener('click', () => {
            const acao = document.querySelector('input[name="acaoOuro"]:checked').value;
            const valor = parseFloat(document.getElementById('valorOuro').value);
            
            if (!valor || valor <= 0) {
                mostrarNotificacao('Valor inválido', 'danger');
                return;
            }
            
            if (acao === 'comprar') {
                comprarOuro(valor * 1e6);
            } else {
                venderOuro(valor);
            }
        });
    }
    
    const pausarSimulacao = document.getElementById('pausarSimulacao');
    if (pausarSimulacao) {
        pausarSimulacao.addEventListener('click', (e) => {
            estado.tempo.pausado = !estado.tempo.pausado;
            e.target.innerHTML = estado.tempo.pausado ? 
                '<i class="fas fa-play"></i> Continuar' : 
                '<i class="fas fa-pause"></i> Pausar';
            adicionarAoHistorico('Sistema', estado.tempo.pausado ? 'Simulação pausada' : 'Simulação continuada');
        });
    }
    
    const reiniciarSimulacao = document.getElementById('reiniciarSimulacao');
    if (reiniciarSimulacao) {
        reiniciarSimulacao.addEventListener('click', () => {
            if (confirm('Tem certeza? Todo progresso será perdido.')) {
                location.reload();
            }
        });
    }
    
    const comprarUSDBtn = document.getElementById('comprarUSD');
    if (comprarUSDBtn) {
        comprarUSDBtn.addEventListener('click', () => {
            const valor = parseFloat(document.getElementById('valorUSD').value);
            if (valor && valor > 0) {
                comprarUSD(valor * 1e6);
            }
        });
    }
    
    const venderUSDBtn = document.getElementById('venderUSD');
    if (venderUSDBtn) {
        venderUSDBtn.addEventListener('click', () => {
            const valor = parseFloat(document.getElementById('valorUSD').value);
            if (valor && valor > 0) {
                venderUSD(valor * 1e6);
            }
        });
    }
    
    if (document.getElementById('acoesDisponiveis')) {
        inicializarPainelAcoes();
    }
    
    atualizarInfoInvestimento();
}

function inicializarPainelAcoes() {
    const acoesGrid = document.getElementById('acoesDisponiveis');
    if (!acoesGrid) return;
    
    acoesGrid.innerHTML = estado.carteiraInternacional.acoesDisponiveis.map(acao => `
        <div class="acao-card" data-ticker="${acao.ticker}">
            <div class="acao-header">
                <strong>${acao.ticker}</strong>
                <span class="acao-nome">${acao.nome}</span>
            </div>
            <div class="acao-preco">${formatarUSD(acao.precoAtual)}</div>
            <div class="acao-setor">${acao.setor} | ${acao.pais}</div>
            <div class="acao-actions">
                <input type="number" class="acao-quantidade" min="1" value="1" placeholder="Qtd">
                <button class="btn-small btn-primary comprar-acao">Comprar</button>
            </div>
        </div>
    `).join('');
    
    const titulosGrid = document.getElementById('titulosDisponiveis');
    if (titulosGrid) {
        titulosGrid.innerHTML = TITULOS_ESTRANGEIROS.map(titulo => `
            <div class="titulo-card" data-pais="${titulo.pais}">
                <div class="titulo-header">
                    <strong>${titulo.pais}</strong>
                    <span class="titulo-moeda">${titulo.moeda}</span>
                </div>
                <div class="titulo-taxa">${(titulo.taxaBase * 100).toFixed(1)}% a.a.</div>
                <div class="titulo-risco ${titulo.risco.toLowerCase()}">Risco: ${titulo.risco}</div>
                <div class="titulo-actions">
                    <input type="number" class="titulo-valor" min="100000" step="100000" value="1000000" placeholder="Valor">
                    <select class="titulo-prazo">
                        <option value="1">1 ano</option>
                        <option value="2">2 anos</option>
                        <option value="5" selected>5 anos</option>
                        <option value="10">10 anos</option>
                    </select>
                    <button class="btn-small btn-primary comprar-titulo">Comprar</button>
                </div>
            </div>
        `).join('');
    }
    
    document.querySelectorAll('.comprar-acao').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.acao-card');
            const ticker = card.dataset.ticker;
            const quantidade = parseInt(card.querySelector('.acao-quantidade').value);
            comprarAcao(ticker, quantidade);
        });
    });
    
    document.querySelectorAll('.comprar-titulo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.titulo-card');
            const pais = card.dataset.pais;
            const valor = parseInt(card.querySelector('.titulo-valor').value);
            const prazo = parseInt(card.querySelector('.titulo-prazo').value);
            comprarTituloEstrangeiro(pais, valor, prazo);
        });
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(`painel${e.target.dataset.tab.charAt(0).toUpperCase() + e.target.dataset.tab.slice(1)}`).classList.add('active');
        });
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarInterface();
    setInterval(atualizarPrecoOuro, 60000);
    
    setTimeout(() => {
        if (document.getElementById('acoesDisponiveis')) {
            inicializarPainelAcoes();
        }
    }, 1000);
});

// ============================================
// EXPORTAÇÕES (para uso em outros módulos, se necessário)
// ============================================

window.SimuladorEconomia = {
    estado,
    comprarUSD,
    venderUSD,
    comprarAcao,
    venderAcao,
    comprarTituloEstrangeiro,
    emitirDivida,
    realizarInvestimento,
    comprarOuro,
    venderOuro,
    formatarKwanza,
    formatarUSD
};

// ============================================
// CÓDIGOS DE SUPORTE - AÇÕES, USD E PERSISTÊNCIA
// ADICIONAR AO ARQUIVO JAVASCRIPT PRINCIPAL
// ============================================

// ============================================
// 1. FUNÇÕES PARA EXIBIR PAINÉIS DE AÇÕES E USD
// ============================================

function criarPaineisFaltantes() {
    // Verificar se os elementos já existem, se não, criar
    if (!document.getElementById('painelAcoesContainer')) {
        criarPainelAcoes();
    }
    
    if (!document.getElementById('painelUSDContainer')) {
        criarPainelUSD();
    }
    
    if (!document.getElementById('painelCarteiraContainer')) {
        criarPainelCarteira();
    }
}

function criarPainelAcoes() {
    // Encontrar onde inserir o painel de ações
    const modulosGrid = document.querySelector('.modulos-grid');
    if (!modulosGrid) return;
    
    const painelAcoes = document.createElement('div');
    painelAcoes.className = 'modulo-card card-animated';
    painelAcoes.id = 'painelAcoesContainer';
    painelAcoes.innerHTML = `
        <div class="modulo-header">
            <h2><i class="fas fa-chart-line"></i> Mercado de Ações</h2>
        </div>
        <div class="modulo-conteudo">
            <div class="acoes-tabs">
                <button class="tab-btn active" data-acoes-tab="disponiveis">Disponíveis</button>
                <button class="tab-btn" data-acoes-tab="carteira">Minha Carteira</button>
            </div>
            
            <div class="acoes-tab-panel active" id="acoesDisponiveisPanel">
                <div class="acoes-grid" id="acoesDisponiveisGrid">
                    <!-- Ações serão inseridas via JS -->
                    <div class="loading-message">Carregando ações...</div>
                </div>
            </div>
            
            <div class="acoes-tab-panel" id="acoesCarteiraPanel">
                <div class="carteira-resumo">
                    <div class="resumo-item">
                        <span>Valor Total:</span>
                        <span class="valor-destaque" id="carteiraAcoesTotal">$0</span>
                    </div>
                    <div class="resumo-item">
                        <span>Saldo Disponível:</span>
                        <span class="valor-destaque" id="saldoAcoesDisponivel">$0</span>
                    </div>
                </div>
                <div class="minhas-acoes-grid" id="minhasAcoesGrid">
                    <!-- Minhas ações serão inseridas via JS -->
                </div>
            </div>
        </div>
    `;
    
    // Inserir após o módulo de investimentos ou no final
    const investimentoModulo = document.querySelector('.modulo-card:nth-child(3)');
    if (investimentoModulo) {
        investimentoModulo.insertAdjacentElement('afterend', painelAcoes);
    } else {
        modulosGrid.appendChild(painelAcoes);
    }
    
    // Adicionar event listeners para as abas
    painelAcoes.querySelectorAll('[data-acoes-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            painelAcoes.querySelectorAll('[data-acoes-tab]').forEach(b => b.classList.remove('active'));
            painelAcoes.querySelectorAll('.acoes-tab-panel').forEach(p => p.classList.remove('active'));
            
            e.target.classList.add('active');
            const tabId = e.target.dataset.acoesTab;
            document.getElementById(`acoes${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Panel`).classList.add('active');
        });
    });
}

function criarPainelUSD() {
    const modulosGrid = document.querySelector('.modulos-grid');
    if (!modulosGrid) return;
    
    const painelUSD = document.createElement('div');
    painelUSD.className = 'modulo-card card-animated';
    painelUSD.id = 'painelUSDContainer';
    painelUSD.innerHTML = `
        <div class="modulo-header">
            <h2><i class="fas fa-dollar-sign"></i> Câmbio USD/Kz</h2>
        </div>
        <div class="modulo-conteudo">
            <div class="cambio-info">
                <div class="cambio-atual">
                    <span class="cambio-rotulo">Taxa Atual:</span>
                    <span class="cambio-valor" id="cambioAtualDisplay">912 Kz</span>
                </div>
                <div class="cambio-variacao" id="cambioVariacaoDisplay">Estável</div>
            </div>
            
            <div class="cambio-acoes">
                <div class="cambio-acao compra">
                    <h4><i class="fas fa-arrow-down" style="color: #33cc33;"></i> Comprar USD</h4>
                    <div class="cambio-input-group">
                        <input type="number" id="valorCompraUSD" class="form-control" placeholder="Valor em USD" min="1" step="0.1">
                        <button class="btn-primary" id="btnComprarUSD">Comprar</button>
                    </div>
                    <div class="cambio-info-texto">
                        <small>Gasto estimado: <span id="gastoCompraKz">0 Kz</span></small>
                    </div>
                </div>
                
                <div class="cambio-acao venda">
                    <h4><i class="fas fa-arrow-up" style="color: #cc3333;"></i> Vender USD</h4>
                    <div class="cambio-input-group">
                        <input type="number" id="valorVendaUSD" class="form-control" placeholder="Valor em USD" min="1" step="0.1">
                        <button class="btn-primary" id="btnVenderUSD">Vender</button>
                    </div>
                    <div class="cambio-info-texto">
                        <small>Recebimento: <span id="recebimentoVendaKz">0 Kz</span></small>
                    </div>
                </div>
            </div>
            
            <div class="reservas-info">
                <div class="reservas-item">
                    <span>Reservas USD:</span>
                    <span class="valor-destaque" id="reservasUSDPainel">$11B</span>
                </div>
                <div class="reservas-item">
                    <span>Saldo Kz:</span>
                    <span class="valor-destaque" id="saldoKzPainel">5T Kz</span>
                </div>
            </div>
        </div>
    `;
    
    // Inserir após o módulo de reservas e ouro
    const ouroModulo = document.querySelector('.modulo-card:nth-child(4)');
    if (ouroModulo) {
        ouroModulo.insertAdjacentElement('afterend', painelUSD);
    } else {
        modulosGrid.appendChild(painelUSD);
    }
    
    // Adicionar event listeners para os inputs
    document.getElementById('valorCompraUSD')?.addEventListener('input', atualizarGastoCompra);
    document.getElementById('valorVendaUSD')?.addEventListener('input', atualizarRecebimentoVenda);
    
    document.getElementById('btnComprarUSD')?.addEventListener('click', () => {
        const valor = parseFloat(document.getElementById('valorCompraUSD').value);
        if (valor && valor > 0) {
            comprarUSD(valor * 1e6);
        } else {
            mostrarNotificacao('Digite um valor válido', 'danger');
        }
    });
    
    document.getElementById('btnVenderUSD')?.addEventListener('click', () => {
        const valor = parseFloat(document.getElementById('valorVendaUSD').value);
        if (valor && valor > 0) {
            venderUSD(valor * 1e6);
        } else {
            mostrarNotificacao('Digite um valor válido', 'danger');
        }
    });
}

function criarPainelCarteira() {
    // Encontrar o local apropriado para inserir
    const historicoSection = document.querySelector('.historico-section');
    if (!historicoSection) return;
    
    const painelCarteira = document.createElement('div');
    painelCarteira.className = 'carteira-completa card-animated';
    painelCarteira.id = 'painelCarteiraContainer';
    painelCarteira.innerHTML = `
        <div class="carteira-header">
            <h3><i class="fas fa-globe"></i> Carteira de Investimentos</h3>
            <span class="badge" id="carteiraTotalBadge">$0</span>
        </div>
        
        <div class="carteira-stats-detailed">
            <div class="stat-bloco">
                <span class="stat-label">Saldo Disponível</span>
                <span class="stat-value" id="carteiraSaldoDisponivel">$0</span>
            </div>
            <div class="stat-bloco">
                <span class="stat-label">Em Ações</span>
                <span class="stat-value" id="carteiraAcoesValor">$0</span>
            </div>
            <div class="stat-bloco">
                <span class="stat-label">Em Títulos</span>
                <span class="stat-value" id="carteiraTitulosValor">$0</span>
            </div>
            <div class="stat-bloco">
                <span class="stat-label">Rendimento Total</span>
                <span class="stat-value" id="carteiraRendimento">$0</span>
            </div>
        </div>
        
        <div class="carteira-tabs">
            <button class="tab-btn active" data-carteira-tab="acoes">Ações</button>
            <button class="tab-btn" data-carteira-tab="titulos">Títulos</button>
        </div>
        
        <div class="carteira-tab-panel active" id="carteiraAcoesDetalhadas">
            <div class="acoes-list" id="listaAcoesDetalhadas">
                <!-- Lista de ações será inserida via JS -->
            </div>
        </div>
        
        <div class="carteira-tab-panel" id="carteiraTitulosDetalhados">
            <div class="titulos-list" id="listaTitulosDetalhados">
                <!-- Lista de títulos será inserida via JS -->
            </div>
        </div>
    `;
    
    historicoSection.insertAdjacentElement('beforebegin', painelCarteira);
    
    // Adicionar event listeners para as abas
    painelCarteira.querySelectorAll('[data-carteira-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            painelCarteira.querySelectorAll('[data-carteira-tab]').forEach(b => b.classList.remove('active'));
            painelCarteira.querySelectorAll('.carteira-tab-panel').forEach(p => p.classList.remove('active'));
            
            e.target.classList.add('active');
            const tabId = e.target.dataset.carteiraTab;
            document.getElementById(`carteira${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Detalhadas`).classList.add('active');
        });
    });
}

// ============================================
// 2. FUNÇÕES DE ATUALIZAÇÃO DOS PAINÉIS
// ============================================

function atualizarPaineisAcoes() {
    if (!estado.carteiraInternacional.acoesDisponiveis) return;
    
    // Atualizar grid de ações disponíveis
    const acoesGrid = document.getElementById('acoesDisponiveisGrid');
    if (acoesGrid) {
        if (estado.carteiraInternacional.acoesDisponiveis.length === 0) {
            acoesGrid.innerHTML = '<div class="mensagem-info">Nenhuma ação disponível no momento</div>';
        } else {
            acoesGrid.innerHTML = estado.carteiraInternacional.acoesDisponiveis.map(acao => `
                <div class="acao-card-compacto" data-ticker="${acao.ticker}">
                    <div class="acao-info">
                        <div class="acao-ticker">${acao.ticker}</div>
                        <div class="acao-nome">${acao.nome}</div>
                    </div>
                    <div class="acao-preco-atual">${formatarUSD(acao.precoAtual)}</div>
                    <div class="acao-detalhes">
                        <span class="acao-setor">${acao.setor}</span>
                        <span class="acao-pais">${acao.pais}</span>
                    </div>
                    <div class="acao-compra">
                        <input type="number" class="acao-qtd" value="1" min="1" step="1" placeholder="Qtd">
                        <button class="btn-small btn-primary comprar-acao-btn">Comprar</button>
                    </div>
                </div>
            `).join('');
            
            // Adicionar event listeners aos botões de compra
            acoesGrid.querySelectorAll('.comprar-acao-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('.acao-card-compacto');
                    const ticker = card.dataset.ticker;
                    const quantidade = parseInt(card.querySelector('.acao-qtd').value);
                    if (quantidade > 0) {
                        comprarAcao(ticker, quantidade);
                    }
                });
            });
        }
    }
    
    // Atualizar minhas ações
    const minhasAcoesGrid = document.getElementById('minhasAcoesGrid');
    if (minhasAcoesGrid) {
        if (estado.carteiraInternacional.acoes.length === 0) {
            minhasAcoesGrid.innerHTML = '<div class="mensagem-info">Você não possui ações</div>';
        } else {
            minhasAcoesGrid.innerHTML = estado.carteiraInternacional.acoes.map(acao => {
                const valorTotal = acao.precoAtual * acao.quantidade;
                const lucroPrejuizo = (acao.precoAtual - acao.precoMedioCompra) * acao.quantidade;
                const lucroPercentual = ((acao.precoAtual - acao.precoMedioCompra) / acao.precoMedioCompra * 100) || 0;
                
                return `
                    <div class="minha-acao-card" data-ticker="${acao.ticker}">
                        <div class="acao-header">
                            <span class="acao-ticker">${acao.ticker}</span>
                            <span class="acao-qtd">${acao.quantidade} ações</span>
                        </div>
                        <div class="acao-precos">
                            <div class="preco-compra">
                                <small>Compra: ${formatarUSD(acao.precoMedioCompra)}</small>
                            </div>
                            <div class="preco-atual">
                                <small>Atual: ${formatarUSD(acao.precoAtual)}</small>
                            </div>
                        </div>
                        <div class="acao-resultado ${lucroPrejuizo >= 0 ? 'positivo' : 'negativo'}">
                            <span>${lucroPrejuizo >= 0 ? '+' : ''}${formatarUSD(lucroPrejuizo)} (${lucroPercentual.toFixed(1)}%)</span>
                        </div>
                        <div class="acao-acoes">
                            <input type="number" class="acao-venda-qtd" value="1" min="1" max="${acao.quantidade}" step="1">
                            <button class="btn-small btn-danger vender-acao-btn">Vender</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Adicionar event listeners aos botões de venda
            minhasAcoesGrid.querySelectorAll('.vender-acao-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.target.closest('.minha-acao-card');
                    const ticker = card.dataset.ticker;
                    const quantidade = parseInt(card.querySelector('.acao-venda-qtd').value);
                    if (quantidade > 0) {
                        venderAcao(ticker, quantidade);
                    }
                });
            });
        }
    }
    
    // Atualizar valores da carteira
    const valorAcoes = estado.carteiraInternacional.acoes.reduce((sum, a) => sum + (a.precoAtual * a.quantidade), 0);
    document.getElementById('carteiraAcoesTotal') && (document.getElementById('carteiraAcoesTotal').textContent = formatarUSD(valorAcoes));
    document.getElementById('saldoAcoesDisponivel') && (document.getElementById('saldoAcoesDisponivel').textContent = formatarUSD(estado.carteiraInternacional.saldoUSD));
    document.getElementById('carteiraAcoesValor') && (document.getElementById('carteiraAcoesValor').textContent = formatarUSD(valorAcoes));
    document.getElementById('carteiraSaldoDisponivel') && (document.getElementById('carteiraSaldoDisponivel').textContent = formatarUSD(estado.carteiraInternacional.saldoUSD));
    
    const valorTitulos = estado.carteiraInternacional.titulosEstrangeiros.reduce((sum, t) => sum + t.valorInvestido, 0);
    document.getElementById('carteiraTitulosValor') && (document.getElementById('carteiraTitulosValor').textContent = formatarUSD(valorTitulos));
    
    const valorTotal = estado.carteiraInternacional.valorTotal;
    document.getElementById('carteiraTotalBadge') && (document.getElementById('carteiraTotalBadge').textContent = formatarUSD(valorTotal));
}

function atualizarPainelUSD() {
    const cambioAtual = document.getElementById('cambioAtualDisplay');
    if (cambioAtual) {
        cambioAtual.textContent = `${VALORES_CAMBIO[estado.indiceCambio]} Kz`;
    }
    
    const cambioVariacao = document.getElementById('cambioVariacaoDisplay');
    if (cambioVariacao) {
        if (estado.eventoAtivo && estado.eventoAtivo.impacto.cambio) {
            cambioVariacao.textContent = 'Volátil';
            cambioVariacao.style.color = estado.eventoAtivo.cor;
        } else if (estado.regimeCambial === 'fixo') {
            cambioVariacao.textContent = 'Fixo';
            cambioVariacao.style.color = '#33cc33';
        } else {
            cambioVariacao.textContent = 'Flutuante';
            cambioVariacao.style.color = '#f39c12';
        }
    }
    
    document.getElementById('reservasUSDPainel') && (document.getElementById('reservasUSDPainel').textContent = formatarUSD(estado.reservasUSD));
    document.getElementById('saldoKzPainel') && (document.getElementById('saldoKzPainel').textContent = formatarKwanza(estado.saldoGovernoKz));
}

function atualizarGastoCompra() {
    const valorUSD = parseFloat(document.getElementById('valorCompraUSD').value) || 0;
    const gastoKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio] * 1e6;
    document.getElementById('gastoCompraKz').textContent = formatarKwanza(gastoKz);
}

function atualizarRecebimentoVenda() {
    const valorUSD = parseFloat(document.getElementById('valorVendaUSD').value) || 0;
    const recebimentoKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio] * 1e6;
    document.getElementById('recebimentoVendaKz').textContent = formatarKwanza(recebimentoKz);
}

// ============================================
// 3. SISTEMA DE PERSISTÊNCIA (SAVE/LOAD)
// ============================================

const STORAGE_KEY = 'simulador_economia_angola';

function salvarSimulacao() {
    try {
        // Criar uma cópia do estado para salvar
        const estadoParaSalvar = {
            tempo: { ...estado.tempo },
            usuario: { ...estado.usuario },
            pib: estado.pib,
            pibOriginal: estado.pibOriginal,
            inflacao: estado.inflacao,
            desemprego: estado.desemprego,
            dividaPublica: estado.dividaPublica,
            receitaGovernoUSD: estado.receitaGovernoUSD,
            receitaGovernoKz: estado.receitaGovernoKz,
            saldoGovernoKz: estado.saldoGovernoKz,
            receitaMensalKz: estado.receitaMensalKz,
            despesaMensalKz: estado.despesaMensalKz,
            saldoHistorico: estado.saldoHistorico,
            
            // BNA
            taxaJuros: estado.taxaJuros,
            regimeCambial: estado.regimeCambial,
            cambioFixo: estado.cambioFixo,
            bandaMin: estado.bandaMin,
            bandaMax: estado.bandaMax,
            indiceCambio: estado.indiceCambio,
            
            // Reservas
            reservasUSD: estado.reservasUSD,
            ouro: { ...estado.ouro },
            
            // Carteira internacional
            carteiraInternacional: {
                acoes: estado.carteiraInternacional.acoes.map(acao => ({
                    ticker: acao.ticker,
                    nome: acao.nome,
                    quantidade: acao.quantidade,
                    precoMedioCompra: acao.precoMedioCompra,
                    precoAtual: acao.precoAtual,
                    setor: acao.setor,
                    pais: acao.pais
                })),
                titulosEstrangeiros: estado.carteiraInternacional.titulosEstrangeiros.map(titulo => ({
                    pais: titulo.pais,
                    moeda: titulo.moeda,
                    valorInvestido: titulo.valorInvestido,
                    taxaJuros: titulo.taxaJuros,
                    prazoAnos: titulo.prazoAnos,
                    dataCompra: titulo.dataCompra,
                    dataVencimento: titulo.dataVencimento,
                    jurosAcumulados: titulo.jurosAcumulados
                })),
                saldoUSD: estado.carteiraInternacional.saldoUSD,
                valorTotal: estado.carteiraInternacional.valorTotal
            },
            
            // Empresas
            empresasDetalhadas: { ...estado.empresasDetalhadas },
            
            // Famílias
            familiasDetalhadas: { ...estado.familiasDetalhadas },
            
            // Dívidas ativas
            dividasAtivas: estado.dividasAtivas.map(d => ({
                ...d,
                dataEmissao: { ...d.dataEmissao },
                ultimoPagamentoJuros: { ...d.ultimoPagamentoJuros }
            })),
            
            // Investimentos ativos
            investimentosAtivos: estado.investimentosAtivos.map(i => ({
                ...i,
                dataInicio: { ...i.dataInicio }
            })),
            
            // Evento ativo
            eventoAtivo: estado.eventoAtivo ? {
                ...estado.eventoAtivo,
                dataInicio: estado.eventoAtivo.dataInicio,
                dataFim: estado.eventoAtivo.dataFim
            } : null,
            
            // Rating
            rating: { ...estado.rating },
            
            // Dependência petróleo
            dependenciaPetroleo: estado.dependenciaPetroleo,
            
            // Histórico
            historico: estado.historico,
            
            // Timestamp do save
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoParaSalvar));
        mostrarNotificacao('Simulação salva com sucesso!', 'success');
        adicionarAoHistorico('Sistema', 'Simulação salva');
        return true;
    } catch (error) {
        console.error('Erro ao salvar simulação:', error);
        mostrarNotificacao('Erro ao salvar simulação', 'danger');
        return false;
    }
}

function carregarSimulacao() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            mostrarNotificacao('Nenhum save encontrado', 'warning');
            return false;
        }
        
        const saved = JSON.parse(savedData);
        
        // Restaurar estado
        estado.tempo = saved.tempo;
        estado.usuario = saved.usuario;
        estado.pib = saved.pib;
        estado.pibOriginal = saved.pibOriginal;
        estado.inflacao = saved.inflacao;
        estado.desemprego = saved.desemprego;
        estado.dividaPublica = saved.dividaPublica;
        estado.receitaGovernoUSD = saved.receitaGovernoUSD;
        estado.receitaGovernoKz = saved.receitaGovernoKz;
        estado.saldoGovernoKz = saved.saldoGovernoKz;
        estado.receitaMensalKz = saved.receitaMensalKz;
        estado.despesaMensalKz = saved.despesaMensalKz;
        estado.saldoHistorico = saved.saldoHistorico || [];
        
        estado.taxaJuros = saved.taxaJuros;
        estado.regimeCambial = saved.regimeCambial;
        estado.cambioFixo = saved.cambioFixo;
        estado.bandaMin = saved.bandaMin;
        estado.bandaMax = saved.bandaMax;
        estado.indiceCambio = saved.indiceCambio;
        
        estado.reservasUSD = saved.reservasUSD;
        estado.ouro = saved.ouro;
        
        // Restaurar carteira internacional
        estado.carteiraInternacional = {
            acoes: [],
            acoesDisponiveis: estado.carteiraInternacional?.acoesDisponiveis || [],
            titulosEstrangeiros: saved.carteiraInternacional?.titulosEstrangeiros || [],
            saldoUSD: saved.carteiraInternacional?.saldoUSD || 0,
            valorTotal: saved.carteiraInternacional?.valorTotal || 0
        };
        
        // Recriar objetos de ações
        if (saved.carteiraInternacional?.acoes) {
            saved.carteiraInternacional.acoes.forEach(acaoData => {
                const acao = new AcaoInternacional(
                    acaoData.nome,
                    acaoData.ticker,
                    acaoData.setor,
                    acaoData.pais,
                    acaoData.precoAtual,
                    acaoData.volatilidade || 0.2
                );
                acao.quantidade = acaoData.quantidade;
                acao.precoMedioCompra = acaoData.precoMedioCompra;
                estado.carteiraInternacional.acoes.push(acao);
            });
        }
        
        estado.empresasDetalhadas = saved.empresasDetalhadas;
        estado.familiasDetalhadas = saved.familiasDetalhadas;
        estado.dividasAtivas = saved.dividasAtivas || [];
        estado.investimentosAtivos = saved.investimentosAtivos || [];
        estado.eventoAtivo = saved.eventoAtivo;
        estado.rating = saved.rating;
        estado.dependenciaPetroleo = saved.dependenciaPetroleo;
        estado.historico = saved.historico || [];
        
        // Atualizar interface
        if (estado.usuario.nome) {
            document.querySelector('.simulador-inicio').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('nomeUsuarioDisplay').textContent = estado.usuario.nome;
            document.getElementById('provinciaDisplay').textContent = estado.usuario.provincia;
        }
        
        atualizarInterface();
        atualizarInterfaceExpandida();
        atualizarPaineisAcoes();
        atualizarPainelUSD();
        
        mostrarNotificacao('Simulação carregada com sucesso!', 'success');
        adicionarAoHistorico('Sistema', 'Simulação carregada');
        
        return true;
    } catch (error) {
        console.error('Erro ao carregar simulação:', error);
        mostrarNotificacao('Erro ao carregar simulação', 'danger');
        return false;
    }
}

function reiniciarSimulacao() {
    if (confirm('Tem certeza? Todo progresso será perdido permanentemente.')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function verificarSaveExistente() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

// ============================================
// 4. BOTÕES DE CONTROLE DE SAVE/LOAD
// ============================================

function adicionarBotoesPersistencia() {
    const controlesDiv = document.querySelector('.controles-simulacao');
    if (!controlesDiv) return;
    
    // Criar container para botões de save/load
    const persistenciaDiv = document.createElement('div');
    persistenciaDiv.className = 'persistencia-buttons';
    persistenciaDiv.innerHTML = `
        <button class="btn-secondary" id="btnSalvarSimulacao">
            <i class="fas fa-save"></i> Salvar
        </button>
        <button class="btn-secondary" id="btnCarregarSimulacao">
            <i class="fas fa-folder-open"></i> Carregar
        </button>
        <button class="btn-danger" id="btnReiniciarSimulacao">
            <i class="fas fa-trash"></i> Reiniciar
        </button>
    `;
    
    controlesDiv.appendChild(persistenciaDiv);
    
    // Adicionar event listeners
    document.getElementById('btnSalvarSimulacao').addEventListener('click', salvarSimulacao);
    document.getElementById('btnCarregarSimulacao').addEventListener('click', carregarSimulacao);
    document.getElementById('btnReiniciarSimulacao').addEventListener('click', reiniciarSimulacao);
    
    // Verificar se existe save ao iniciar
    if (verificarSaveExistente()) {
        const notificacao = document.createElement('div');
        notificacao.className = 'alert-info';
        notificacao.style.position = 'fixed';
        notificacao.style.bottom = '20px';
        notificacao.style.left = '20px';
        notificacao.style.zIndex = '10000';
        notificacao.style.padding = '15px 20px';
        notificacao.style.borderRadius = '12px';
        notificacao.innerHTML = `
            <i class="fas fa-info-circle"></i>
            Existe um save anterior. 
            <button class="btn-small btn-primary" id="carregarSavePrompt">Carregar</button>
            <button class="btn-small btn-secondary" id="ignorarSavePrompt">Ignorar</button>
        `;
        document.body.appendChild(notificacao);
        
        document.getElementById('carregarSavePrompt').addEventListener('click', () => {
            carregarSimulacao();
            notificacao.remove();
        });
        
        document.getElementById('ignorarSavePrompt').addEventListener('click', () => {
            notificacao.remove();
        });
        
        setTimeout(() => notificacao.remove(), 10000);
    }
}

// ============================================
// 5. CSS ADICIONAL PARA OS NOVOS COMPONENTES
// ============================================

const cssAdicional = `
/* Estilos para os novos painéis */
.acoes-tabs, .carteira-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-dark);
    padding-bottom: 10px;
}

.acoes-tab-panel, .carteira-tab-panel {
    display: none;
}

.acoes-tab-panel.active, .carteira-tab-panel.active {
    display: block;
}

.acoes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 10px;
}

.acao-card-compacto {
    background: var(--bg-soft-black);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    padding: 15px;
    transition: all 0.3s ease;
}

.acao-card-compacto:hover {
    border-color: var(--primary-gold);
    transform: translateY(-3px);
}

.acao-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.acao-ticker {
    font-weight: 700;
    color: var(--primary-gold);
    font-size: 1.1rem;
}

.acao-nome {
    color: var(--text-gray);
    font-size: 0.85rem;
}

.acao-preco-atual {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-white);
    text-align: center;
    margin: 10px 0;
}

.acao-detalhes {
    display: flex;
    justify-content: space-between;
    color: var(--text-dim);
    font-size: 0.8rem;
    margin-bottom: 15px;
}

.acao-compra {
    display: flex;
    gap: 8px;
}

.acao-qtd {
    width: 70px;
    padding: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--primary-white);
}

.carteira-resumo {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: var(--bg-soft-black);
    border-radius: 12px;
}

.resumo-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.valor-destaque {
    color: var(--primary-gold);
    font-weight: 600;
    font-size: 1.1rem;
}

.minhas-acoes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
}

.minha-acao-card {
    background: var(--bg-soft-black);
    border: 1px solid var(--border-dark);
    border-radius: 12px;
    padding: 15px;
}

.acao-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.acao-qtd {
    color: var(--text-gray);
    font-size: 0.9rem;
}

.acao-precos {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    padding: 8px;
    background: var(--bg-card);
    border-radius: 8px;
}

.acao-resultado {
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-weight: 600;
}

.acao-resultado.positivo {
    background: rgba(51, 204, 51, 0.1);
    color: var(--secondary-green);
}

.acao-resultado.negativo {
    background: rgba(204, 51, 51, 0.1);
    color: var(--secondary-red);
}

.acao-acoes {
    display: flex;
    gap: 8px;
}

.acao-venda-qtd {
    width: 80px;
    padding: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-dark);
    border-radius: 8px;
    color: var(--primary-white);
}

/* Painel de Câmbio */
.cambio-info {
    text-align: center;
    margin-bottom: 20px;
}

.cambio-atual {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-gold);
    margin-bottom: 5px;
}

.cambio-rotulo {
    font-size: 1rem;
    color: var(--text-gray);
    margin-right: 10px;
}

.cambio-variacao {
    font-size: 1rem;
    font-weight: 500;
}

.cambio-acoes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.cambio-acao {
    padding: 15px;
    background: var(--bg-soft-black);
    border-radius: 12px;
    border: 1px solid var(--border-dark);
}

.cambio-acao h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    font-size: 1.1rem;
}

.cambio-input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.cambio-info-texto small {
    color: var(--text-dim);
}

.cambio-info-texto span {
    color: var(--primary-gold);
    font-weight: 600;
}

.reservas-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    padding: 15px;
    background: var(--bg-soft-black);
    border-radius: 12px;
}

.reservas-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.reservas-item span:first-child {
    color: var(--text-gray);
    font-size: 0.9rem;
}

/* Carteira Completa */
.carteira-completa {
    margin-bottom: 30px;
    padding: 25px;
}

.carteira-stats-detailed {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 25px;
}

.stat-bloco {
    background: var(--bg-soft-black);
    padding: 15px;
    border-radius: 12px;
    text-align: center;
}

.stat-label {
    display: block;
    color: var(--text-gray);
    font-size: 0.85rem;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-gold);
}

/* Botões de persistência */
.persistencia-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.loading-message, .mensagem-info {
    text-align: center;
    padding: 30px;
    color: var(--text-gray);
    font-style: italic;
}

/* Responsividade */
@media (max-width: 768px) {
    .cambio-acoes {
        grid-template-columns: 1fr;
    }
    
    .carteira-stats-detailed {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .reservas-info {
        grid-template-columns: 1fr;
    }
    
    .persistencia-buttons {
        flex-direction: column;
    }
    
    .persistencia-buttons button {
        width: 100%;
    }
}

@media (max-width: 480px) {
    .carteira-stats-detailed {
        grid-template-columns: 1fr;
    }
}
`;

// ============================================
// 6. INICIALIZAÇÃO DOS NOVOS COMPONENTES
// ============================================

function inicializarComponentesFaltantes() {
    // Adicionar CSS adicional
    const style = document.createElement('style');
    style.textContent = cssAdicional;
    document.head.appendChild(style);
    
    // Criar painéis faltantes
    criarPaineisFaltantes();
    
    // Adicionar botões de persistência
    adicionarBotoesPersistencia();
    
    // Inicializar painéis de ações
    setTimeout(() => {
        atualizarPaineisAcoes();
        atualizarPainelUSD();
    }, 500);
}

// ============================================
// 7. MODIFICAR FUNÇÕES EXISTENTES PARA INCLUIR ATUALIZAÇÕES
// ============================================

// Substituir a função comprarUSD e venderUSD para garantir que atualizem os painéis
const comprarUSDOriginal = window.comprarUSD || comprarUSD;
window.comprarUSD = function(valorUSD) {
    const resultado = comprarUSDOriginal(valorUSD);
    if (resultado) {
        atualizarPainelUSD();
        atualizarPaineisAcoes();
    }
    return resultado;
};

const venderUSDOriginal = window.venderUSD || venderUSD;
window.venderUSD = function(valorUSD) {
    const resultado = venderUSDOriginal(valorUSD);
    if (resultado) {
        atualizarPainelUSD();
        atualizarPaineisAcoes();
    }
    return resultado;
};

const comprarAcaoOriginal = window.comprarAcao || comprarAcao;
window.comprarAcao = function(ticker, quantidade) {
    const resultado = comprarAcaoOriginal(ticker, quantidade);
    if (resultado) {
        atualizarPaineisAcoes();
    }
    return resultado;
};

const venderAcaoOriginal = window.venderAcao || venderAcao;
window.venderAcao = function(ticker, quantidade) {
    const resultado = venderAcaoOriginal(ticker, quantidade);
    if (resultado) {
        atualizarPaineisAcoes();
    }
    return resultado;
};

// Modificar a função passarMes para incluir atualização dos painéis
const passarMesOriginal = passarMes;
passarMes = function() {
    passarMesOriginal();
    atualizarPaineisAcoes();
    atualizarPainelUSD();
};

// Modificar a função atualizarInterface para incluir painéis
const atualizarInterfaceOriginal = atualizarInterface;
atualizarInterface = function() {
    atualizarInterfaceOriginal();
    atualizarPaineisAcoes();
    atualizarPainelUSD();
};

// ============================================
// 8. INICIALIZAÇÃO NO DOMContentLoaded
// ============================================

// Adicionar ao evento DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // Chamar a inicialização dos componentes faltantes
    setTimeout(inicializarComponentesFaltantes, 1000);
});

// ============================================
// 9. EXPORTAÇÃO DAS NOVAS FUNÇÕES
// ============================================

window.SimuladorEconomia = {
    ...window.SimuladorEconomia,
    salvarSimulacao,
    carregarSimulacao,
    reiniciarSimulacao,  
    verificarSaveExistente,
    atualizarPaineisAcoes,
    atualizarPainelUSD
};


// ================================================
// SUPORTE_RESERVAS_INTERNACIONAIS_2026 - Teca Capital
// ================================================
// Este módulo ENFORÇA as regras de negócio para Reservas Internacionais
// Garante que todo movimento em USD afete corretamente as reservas
// Versão: 1.0.0 - 2026
// ================================================

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURAÇÕES E CONSTANTES
    // ============================================
    const DEBUG = false; // Mude para true se quiser ver logs no console
    
    // ============================================
    // FUNÇÕES DE LOG E VALIDAÇÃO
    // ============================================
    
    /**
     * Log condicional para debug
     */
    function logDebug(...args) {
        if (DEBUG) console.log('[RESERVAS]', ...args);
    }
    
    /**
     * Valida se há reservas USD suficientes para uma operação
     * @param {number} valorUSD - Valor em USD necessário
     * @param {string} operacao - Nome da operação para mensagem
     * @returns {boolean} - True se tem saldo suficiente
     */
    function validarReservasUSD(valorUSD, operacao = 'operação') {
        if (typeof valorUSD !== 'number' || isNaN(valorUSD) || valorUSD <= 0) {
            mostrarNotificacao('Valor inválido para operação em USD', 'danger');
            return false;
        }
        
        if (estado.reservasUSD < valorUSD) {
            const mensagem = `Reservas Internacionais insuficientes para ${operacao}. Disponível: ${formatarUSD(estado.reservasUSD)}`;
            mostrarNotificacao(mensagem, 'danger');
            adicionarAoHistorico('ALERTA', mensagem, 'danger');
            return false;
        }
        return true;
    }
    
    /**
     * Valida se há saldo em Kwanzas suficiente para uma operação
     * @param {number} valorKz - Valor em Kz necessário
     * @param {string} operacao - Nome da operação para mensagem
     * @returns {boolean} - True se tem saldo suficiente
     */
    function validarSaldoKz(valorKz, operacao = 'operação') {
        if (typeof valorKz !== 'number' || isNaN(valorKz) || valorKz <= 0) {
            mostrarNotificacao('Valor inválido para operação em Kz', 'danger');
            return false;
        }
        
        if (estado.saldoGovernoKz < valorKz) {
            const mensagem = `Saldo em Kwanzas insuficiente para ${operacao}. Disponível: ${formatarKwanza(estado.saldoGovernoKz)}`;
            mostrarNotificacao(mensagem, 'danger');
            adicionarAoHistorico('ALERTA', mensagem, 'danger');
            return false;
        }
        return true;
    }
    
    // ============================================
    // OVERRIDE: COMPRA DE USD
    // ============================================
    
    /**
     * Versão corrigida da compra de USD
     * Gasta Kz da conta do governo, aumenta reservas USD
     * @param {number} valorUSD - Valor em USD a comprar
     */
    window.comprarUSD = function(valorUSD) {
        logDebug('comprarUSD chamado com valor:', valorUSD);
        
        // Validar entrada
        if (typeof valorUSD !== 'number' || isNaN(valorUSD) || valorUSD <= 0) {
            mostrarNotificacao('Digite um valor válido em USD', 'danger');
            return false;
        }
        
        // Calcular valor em Kz
        const valorKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio];
        
        // Validar saldo em Kz
        if (!validarSaldoKz(valorKz, 'compra de USD')) return false;
        
        // Executar operação
        estado.saldoGovernoKz -= valorKz;
        estado.reservasUSD += valorUSD;
        
        // Impacto no câmbio (Kwanza valoriza)
        estado.indiceCambio = Math.max(0, estado.indiceCambio - 1);
        
        // Logs
        adicionarAoHistorico('Câmbio', 
            `COMPRA USD: ${formatarUSD(valorUSD)} | Gasto: ${formatarKwanza(valorKz)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
        mostrarNotificacao(`Compra de ${formatarUSD(valorUSD)} realizada com sucesso`, 'success');
        
        // Atualizar interfaces
        atualizarInterface();
        atualizarInterfaceExpandida();
        if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
        
        logDebug('compraUSD OK - Reservas:', estado.reservasUSD, 'Saldo Kz:', estado.saldoGovernoKz);
        return true;
    };
    
    // ============================================
    // OVERRIDE: VENDA DE USD
    // ============================================
    
    /**
     * Versão corrigida da venda de USD
     * Gasta reservas USD, aumenta saldo em Kz do governo
     * @param {number} valorUSD - Valor em USD a vender
     */
    window.venderUSD = function(valorUSD) {
        logDebug('venderUSD chamado com valor:', valorUSD);
        
        // Validar entrada
        if (typeof valorUSD !== 'number' || isNaN(valorUSD) || valorUSD <= 0) {
            mostrarNotificacao('Digite um valor válido em USD', 'danger');
            return false;
        }
        
        // Validar reservas USD
        if (!validarReservasUSD(valorUSD, 'venda de USD')) return false;
        
        // Calcular valor em Kz
        const valorKz = valorUSD * VALORES_CAMBIO[estado.indiceCambio];
        
        // Executar operação
        estado.reservasUSD -= valorUSD;
        estado.saldoGovernoKz += valorKz;
        
        // Impacto no câmbio (Kwanza desvaloriza)
        estado.indiceCambio = Math.min(VALORES_CAMBIO.length - 1, estado.indiceCambio + 1);
        
        // Logs
        adicionarAoHistorico('Câmbio', 
            `VENDA USD: ${formatarUSD(valorUSD)} | Receita: ${formatarKwanza(valorKz)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
        mostrarNotificacao(`Venda de ${formatarUSD(valorUSD)} realizada com sucesso`, 'success');
        
        // Atualizar interfaces
        atualizarInterface();
        atualizarInterfaceExpandida();
        if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
        
        logDebug('vendaUSD OK - Reservas:', estado.reservasUSD, 'Saldo Kz:', estado.saldoGovernoKz);
        return true;
    };
    
    // ============================================
    // OVERRIDE: COMPRA DE AÇÕES (CORREÇÃO DO BUG DE QUANTIDADE)
    // ============================================
    
    // Guardar referência da função original
    const comprarAcaoOriginal = window.comprarAcao;
    
    /**
     * Versão corrigida da compra de ações
     * AGORA RESPEITA A QUANTIDADE DIGITADA PELO USUÁRIO
     */
    window.comprarAcao = function(ticker, quantidade) {
        logDebug('comprarAcao chamado com ticker:', ticker, 'quantidade:', quantidade);
        
        // Validar quantidade (CORREÇÃO DO BUG)
        if (typeof quantidade !== 'number' || isNaN(quantidade) || quantidade <= 0) {
            mostrarNotificacao('Quantidade inválida. Digite um número maior que zero.', 'danger');
            return false;
        }
        
        // Encontrar a ação
        const acao = estado.carteiraInternacional.acoesDisponiveis.find(a => a.ticker === ticker);
        if (!acao) {
            mostrarNotificacao('Ação não encontrada', 'danger');
            return false;
        }
        
        // Calcular custo total
        const custoTotal = acao.precoAtual * quantidade;
        
        // VALIDAÇÃO CRÍTICA: Usar reservas USD
        if (!validarReservasUSD(custoTotal, `compra de ${quantidade} ${ticker}`)) return false;
        
        // Executar a compra (chamar função original ou implementar aqui)
        let resultado;
        
        if (typeof comprarAcaoOriginal === 'function') {
            // Se a função original existe, usa ela
            resultado = comprarAcaoOriginal(ticker, quantidade);
        } else {
            // Implementação fallback (caso a original não exista)
            let acaoExistente = estado.carteiraInternacional.acoes.find(a => a.ticker === ticker);
            
            if (acaoExistente) {
                const quantidadeAnterior = acaoExistente.quantidade;
                acaoExistente.quantidade += quantidade;
                acaoExistente.precoMedioCompra = (acaoExistente.precoMedioCompra * quantidadeAnterior + acao.precoAtual * quantidade) / acaoExistente.quantidade;
            } else {
                const novaAcao = new AcaoInternacional(acao.nome, acao.ticker, acao.setor, acao.pais, acao.precoAtual, acao.volatilidade);
                novaAcao.quantidade = quantidade;
                novaAcao.precoMedioCompra = acao.precoAtual;
                estado.carteiraInternacional.acoes.push(novaAcao);
            }
            resultado = true;
        }
        
        if (resultado) {
            // Registrar a operação (a dedução das reservas já deve ter ocorrido na função original)
            adicionarAoHistorico('Ações', 
                `COMPRA ${quantidade} ${ticker} | Total: ${formatarUSD(custoTotal)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
            
            // Atualizar interfaces
            if (typeof atualizarPaineisAcoes === 'function') atualizarPaineisAcoes();
            atualizarInterfaceExpandida();
        }
        
        return resultado;
    };
    
    // ============================================
    // OVERRIDE: VENDA DE AÇÕES
    // ============================================
    
    const venderAcaoOriginal = window.venderAcao;
    
    window.venderAcao = function(ticker, quantidade) {
        logDebug('venderAcao chamado com ticker:', ticker, 'quantidade:', quantidade);
        
        if (typeof quantidade !== 'number' || isNaN(quantidade) || quantidade <= 0) {
            mostrarNotificacao('Quantidade inválida', 'danger');
            return false;
        }
        
        // Calcular valor da venda antes de executar
        const acao = estado.carteiraInternacional.acoes.find(a => a.ticker === ticker);
        if (!acao) {
            mostrarNotificacao('Ação não encontrada na carteira', 'danger');
            return false;
        }
        
        if (quantidade > acao.quantidade) {
            mostrarNotificacao('Quantidade insuficiente', 'danger');
            return false;
        }
        
        const valorVenda = acao.precoAtual * quantidade;
        
        // Executar venda
        let resultado;
        if (typeof venderAcaoOriginal === 'function') {
            resultado = venderAcaoOriginal(ticker, quantidade);
        } else {
            acao.quantidade -= quantidade;
            if (acao.quantidade === 0) {
                estado.carteiraInternacional.acoes = estado.carteiraInternacional.acoes.filter(a => a.ticker !== ticker);
            }
            resultado = true;
        }
        
        if (resultado) {
            // O dinheiro já deve ter entrado nas reservas pela função original
            adicionarAoHistorico('Ações', 
                `VENDA ${quantidade} ${ticker} | Valor: ${formatarUSD(valorVenda)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
            
            if (typeof atualizarPaineisAcoes === 'function') atualizarPaineisAcoes();
            atualizarInterfaceExpandida();
        }
        
        return resultado;
    };
    
    // ============================================
    // OVERRIDE: COMPRA DE TÍTULOS ESTRANGEIROS
    // ============================================
    
    const comprarTituloEstrangeiroOriginal = window.comprarTituloEstrangeiro;
    
    window.comprarTituloEstrangeiro = function(pais, valor, prazo) {
        logDebug('comprarTituloEstrangeiro chamado:', pais, valor, prazo);
        
        if (!pais || typeof valor !== 'number' || isNaN(valor) || valor <= 0) {
            mostrarNotificacao('Valor inválido para compra de título', 'danger');
            return false;
        }
        
        // VALIDAÇÃO CRÍTICA: Usar reservas USD
        if (!validarReservasUSD(valor, `título de ${pais}`)) return false;
        
        let resultado;
        if (typeof comprarTituloEstrangeiroOriginal === 'function') {
            resultado = comprarTituloEstrangeiroOriginal(pais, valor, prazo);
        }
        
        if (resultado !== false) {
            adicionarAoHistorico('Títulos', 
                `COMPRA título ${pais} | Valor: ${formatarUSD(valor)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
            atualizarInterfaceExpandida();
        }
        
        return resultado;
    };
    
    // ============================================
    // OVERRIDE: COMPRA DE OURO
    // ============================================
    
    const comprarOuroOriginal = window.comprarOuro;
    
    window.comprarOuro = function(valorUSD) {
        logDebug('comprarOuro chamado:', valorUSD);
        
        if (!validarReservasUSD(valorUSD, 'compra de ouro')) return false;
        
        let resultado;
        if (typeof comprarOuroOriginal === 'function') {
            resultado = comprarOuroOriginal(valorUSD);
        }
        
        if (resultado) {
            adicionarAoHistorico('Ouro', 
                `COMPRA OURO | Valor: ${formatarUSD(valorUSD)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
            atualizarInterfaceExpandida();
        }
        
        return resultado;
    };
    
    // ============================================
    // OVERRIDE: VENDA DE OURO
    // ============================================
    
    const venderOuroOriginal = window.venderOuro;
    
    window.venderOuro = function(oncas) {
        logDebug('venderOuro chamado:', oncas);
        
        let resultado;
        if (typeof venderOuroOriginal === 'function') {
            resultado = venderOuroOriginal(oncas);
        }
        
        if (resultado) {
            adicionarAoHistorico('Ouro', 
                `VENDA OURO | Onças: ${oncas.toFixed(2)} | Reservas: ${formatarUSD(estado.reservasUSD)}`);
            atualizarInterfaceExpandida();
        }
        
        return resultado;
    };
    
    // ============================================
    // PROXY PARA MONITORAR RESERVAS E SALDO
    // ============================================
    
    /**
     * Cria um proxy para monitorar alterações em propriedades críticas
     */
    function criarProxyEstado() {
        if (!estado) {
            console.error('ERRO: estado não encontrado!');
            return;
        }
        
        // Guardar referência ao estado original
        const estadoOriginal = estado;
        
        // Criar handler para o proxy
        const handler = {
            set(target, prop, value) {
                const oldValue = target[prop];
                target[prop] = value;
                
                // Monitorar propriedades críticas
                if (prop === 'reservasUSD') {
                    logDebug(`reservasUSD alterado: ${formatarUSD(oldValue)} -> ${formatarUSD(value)}`);
                    
                    // Atualizar interfaces
                    if (typeof atualizarInterface === 'function') atualizarInterface();
                    if (typeof atualizarInterfaceExpandida === 'function') atualizarInterfaceExpandida();
                    if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
                    if (typeof atualizarPaineisAcoes === 'function') atualizarPaineisAcoes();
                    
                    // Registrar mudança significativa (opcional)
                    if (Math.abs(value - oldValue) > 1000000) { // Mais de 1M
                        adicionarAoHistorico('Reservas', 
                            `VARIAÇÃO: ${formatarUSD(oldValue)} → ${formatarUSD(value)}`);
                    }
                }
                
                if (prop === 'saldoGovernoKz') {
                    logDebug(`saldoGovernoKz alterado: ${formatarKwanza(oldValue)} -> ${formatarKwanza(value)}`);
                    
                    // Atualizar interfaces
                    if (typeof atualizarInterfaceExpandida === 'function') atualizarInterfaceExpandida();
                    if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
                }
                
                if (prop === 'indiceCambio') {
                    logDebug(`indiceCambio alterado: ${VALORES_CAMBIO[oldValue]} -> ${VALORES_CAMBIO[value]}`);
                    
                    if (typeof atualizarInterface === 'function') atualizarInterface();
                    if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
                }
                
                return true;
            }
        };
        
        // Substituir estado pelo proxy
        window.estado = new Proxy(estadoOriginal, handler);
        logDebug('Proxy de estado ativado');
    }
    
    // ============================================
    // FUNÇÃO DE APLICAÇÃO DAS REGRAS
    // ============================================
    
    function aplicarRegrasReservas() {
        console.log('%c🔒 SUPORTE_RESERVAS_INTERNACIONAIS_2026 ATIVADO', 'color: #d6ae64; font-weight: bold; font-size: 14px');
        console.log('• Reservas Internacionais:', formatarUSD(estado.reservasUSD));
        console.log('• Saldo do Governo:', formatarKwanza(estado.saldoGovernoKz));
        console.log('• Câmbio Atual:', VALORES_CAMBIO[estado.indiceCambio], 'Kz/USD');
        
        // Criar proxy para monitoramento
        criarProxyEstado();
        
        // Adicionar entradas iniciais no histórico
        adicionarAoHistorico('Sistema', 'Módulo de Reservas Internacionais ativado');
        adicionarAoHistorico('Reservas', `Reservas iniciais: ${formatarUSD(estado.reservasUSD)}`);
        adicionarAoHistorico('Câmbio', `Taxa inicial: ${VALORES_CAMBIO[estado.indiceCambio]} Kz/USD (Regime: ${estado.regimeCambial})`);
        
        // Forçar atualização de todos os painéis
        if (typeof atualizarInterface === 'function') atualizarInterface();
        if (typeof atualizarInterfaceExpandida === 'function') atualizarInterfaceExpandida();
        if (typeof atualizarPainelUSD === 'function') atualizarPainelUSD();
        if (typeof atualizarPaineisAcoes === 'function') atualizarPaineisAcoes();
        
        logDebug('Regras de reservas aplicadas com sucesso');
    }
    
    // ============================================
    // EXPOR FUNÇÕES PARA DEBUG (OPCIONAL)
    // ============================================
    
    window.ReservasInternacionais = {
        validar: validarReservasUSD,
        saldo: () => estado.reservasUSD,
        comprarUSD: window.comprarUSD,
        venderUSD: window.venderUSD,
        aplicarRegras: aplicarRegrasReservas
    };
    
    // ============================================
    // AGUARDAR DOM E APLICAR
    // ============================================
    
    // Se o DOM já estiver carregado, aplica imediatamente
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(aplicarRegrasReservas, 500);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(aplicarRegrasReservas, 500);
        });
    }
    
    // Backup: aplicar depois de um tempo (garantia)
    setTimeout(aplicarRegrasReservas, 1000);
    
})();