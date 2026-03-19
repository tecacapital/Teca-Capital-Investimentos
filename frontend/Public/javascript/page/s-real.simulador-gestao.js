// ============================================
// SIMULADOR DE GESTÃO EMPRESARIAL - VERSÃO COMPLETA + SUPORTE
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// ============================================

const TEMPO = {
  dia: 30,
  semana: 210,
  mes: 900,
  trimestre: 2700,
  semestre: 5400,
  ano: 10800
};

// Estado Global do Jogo
let estadoJogo = {
  empresaCriada: false,
  nomeEmpresa: '',
  dimensao: '',
  naturezaJuridica: '',
  areaAtuacao: '',
  carteiraKz: 0,
  carteiraUsd: 0,
  garantiasKz: 0,
  garantiasUsd: 0,
  saldoInicial: 0,
  clientesNacionais: 0,
  clientesEstrangeiros: 0,
  licencaExportacao: false,
  licencaExpiracao: null,
  faturamentoMes: 0,
  custosMes: 0,
  lucroMes: 0,
  maxFuncionarios: 0,
  bonusProdutividade: 0,
  nivelExpansao: 0,
  clientesIniciais: 100
};

// Dados da Empresa
let dataSimulador = new Date(2025, 0, 1);
let tempoDecorrido = 0;
let intervaloPrincipal = null;

// RH
let funcionarios = {
  classeA: { homens: 0, mulheres: 0, salario: 700000, produtividade: 0.02 },
  classeB: { homens: 0, mulheres: 0, salario: 200000, produtividade: 0.005 },
  classeC: { homens: 0, mulheres: 0, salario: 50000, produtividade: 0.0001 },
  classeD: { homens: 0, mulheres: 0, salario: 30000, produtividade: 0 }
};

let pagamentosMes = {
  salariosPagos: false,
  inssPago: false,
  mesReferencia: null,
  anoReferencia: null
};

// Financeiro
let emprestimos = [];
let depositosPrazo = [];
let titulosPublicos = [];

let investimentos = {
  acoes: {
    bfa: { nome: 'BFA', precoBase: 50000, precoAtual: 50000, moeda: 'Kz', quantidade: 0, minimo: 5 },
    bai: { nome: 'BAI', precoBase: 20000, precoAtual: 20000, moeda: 'Kz', quantidade: 0, minimo: 10 },
    bodiva: { nome: 'BODIVA', precoBase: 5000, precoAtual: 5000, moeda: 'Kz', quantidade: 0, minimo: 10 },
    microsoft: { nome: 'Microsoft', precoBase: 250, precoAtual: 250, moeda: 'USD', quantidade: 0, minimo: 1 },
    apple: { nome: 'Apple', precoBase: 170, precoAtual: 170, moeda: 'USD', quantidade: 0, minimo: 1 },
    tesla: { nome: 'Tesla', precoBase: 130, precoAtual: 130, moeda: 'USD', quantidade: 0, minimo: 1 }
  },
  propriedades: {
    angola: { tipoA: 500000000, tipoB: 50000000, tipoC: 5000000 },
    internacional: { tipoA: 50000000, tipoB: 5000000, tipoC: 250000 }
  },
  historico: []
};

// Fornecedores e Estoque
let fornecedores = {
  nacional: {
    A: { prazo: 1, minimo: 100 },
    B: { prazo: 7, minimo: 40 },
    C: { prazo: 15, minimo: 10 }
  },
  internacional: {
    A: { prazo: 7, minimo: 50 },
    B: { prazo: 30, minimo: 20 },
    C: { prazo: 90, minimo: 5 }
  }
};

let estoque = [];
let entregasPendentes = [];
let producoesPendentes = [];

// Marketing e Clientes
let campanhasMarketing = [];
let clientes = {
  nacionais: 0,
  estrangeiros: 0,
  historico: []
};

// Contabilista
let contabilista = {
  contratado: false,
  classe: null,
  dataPagamento: null,
  dataEntrega: null,
  custo: 0,
  multa: 0,
  multaParcelada: false,
  parcelasRestantes: 0,
  valorParcela: 0
};

// Parcerias
let parcerias = [];

// Exportação
let exportacoesPendentes = [];

// Históricos
let historicoTransacoes = [];
let historicoMensal = [];
let historicoAnual = [];

// Dados do Mundo
let dadosMundo = null;

// Taxas e Câmbio
let taxaCambio = 1800;
let inflacaoAtual = 23.4;
let cicloEconomico = 'estavel';
let contadorCrise = 0;

// Velocidade do tempo
let velocidadeTempo = 1;
let autoSaveInterval = null;

// ============================================
// DADOS EXTRAS PARA SUPORTE
// ============================================

// Array para notícias
let noticiasSimulador = [];
// Array para depósitos USD
let depositosPrazoUsd = [];
// Array para títulos USD
let titulosPublicosUsd = [];
// Array para histórico cambial
let historicoCambioMensal = [];

// Controlo de prestações já debitadas (em memória)
const _prestacoesDebitadas = {};

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

async function iniciarSimulador() {
  dadosMundo = await carregarDadosJSON();
  
  // Tentar carregar dados extras primeiro
  try {
    const extra = JSON.parse(localStorage.getItem('simuladorSaveExtra') || '{}');
    depositosPrazoUsd = extra.depositosPrazoUsd || [];
    titulosPublicosUsd = extra.titulosPublicosUsd || [];
    historicoCambioMensal = extra.historicoCambioMensal || [];
    noticiasSimulador = extra.noticiasSimulador || [];
  } catch(e) {
    console.error('Erro ao carregar dados extras:', e);
  }
  
  const saveExiste = localStorage.getItem('simuladorSave');
  if (saveExiste) {
    const save = JSON.parse(saveExiste);
    const dataSave = new Date(save.dataSave);
    const diasDesdeSave = Math.floor((Date.now() - dataSave) / (1000 * 60 * 60 * 24));
    
    if (diasDesdeSave < 1 && confirm('Deseja continuar a simulação anterior?')) {
      carregarEstadoSimulacao();
      return;
    }
  }
  
  mostrarFormularioCriacaoEmpresa();
  inicializarControleTempo();
  inicializarAtalhos();
  
  if (localStorage.getItem('autoSave') !== 'false') {
    iniciarAutoSave();
  }
}

function iniciarNovaSimulacao() {
  localStorage.removeItem('simuladorSave');
  localStorage.removeItem('simuladorSaveExtra');
  
  dataSimulador = new Date(2025, 0, 1);
  tempoDecorrido = 0;
  estadoJogo = {
    empresaCriada: false,
    nomeEmpresa: '',
    dimensao: '',
    naturezaJuridica: '',
    areaAtuacao: '',
    carteiraKz: 0,
    carteiraUsd: 0,
    garantiasKz: 0,
    garantiasUsd: 0,
    saldoInicial: 0,
    clientesNacionais: 0,
    clientesEstrangeiros: 0,
    licencaExportacao: false,
    licencaExpiracao: null,
    faturamentoMes: 0,
    custosMes: 0,
    lucroMes: 0,
    maxFuncionarios: 0,
    bonusProdutividade: 0,
    nivelExpansao: 0,
    clientesIniciais: 100
  };
  
  funcionarios = {
    classeA: { homens: 0, mulheres: 0, salario: 700000, produtividade: 0.02 },
    classeB: { homens: 0, mulheres: 0, salario: 200000, produtividade: 0.005 },
    classeC: { homens: 0, mulheres: 0, salario: 50000, produtividade: 0.0001 },
    classeD: { homens: 0, mulheres: 0, salario: 30000, produtividade: 0 }
  };
  
  pagamentosMes = {
    salariosPagos: false,
    inssPago: false,
    mesReferencia: null,
    anoReferencia: null
  };
  
  emprestimos = [];
  depositosPrazo = [];
  titulosPublicos = [];
  depositosPrazoUsd = [];
  titulosPublicosUsd = [];
  noticiasSimulador = [];
  historicoCambioMensal = [];
  
  investimentos.acoes.bfa.quantidade = 0;
  investimentos.acoes.bai.quantidade = 0;
  investimentos.acoes.bodiva.quantidade = 0;
  investimentos.acoes.microsoft.quantidade = 0;
  investimentos.acoes.apple.quantidade = 0;
  investimentos.acoes.tesla.quantidade = 0;
  investimentos.historico = [];
  
  estoque = [];
  entregasPendentes = [];
  producoesPendentes = [];
  exportacoesPendentes = [];
  parcerias = [];
  
  clientes.nacionais = 0;
  clientes.estrangeiros = 0;
  historicoTransacoes = [];
  historicoMensal = [];
  historicoAnual = [];
  
  contabilista = {
    contratado: false,
    classe: null,
    dataPagamento: null,
    dataEntrega: null,
    custo: 0,
    multa: 0,
    multaParcelada: false,
    parcelasRestantes: 0,
    valorParcela: 0
  };
  
  taxaCambio = 1800;
  inflacaoAtual = 23.4;
  
  if (intervaloPrincipal) {
    clearInterval(intervaloPrincipal);
    intervaloPrincipal = null;
  }
  
  mostrarFormularioCriacaoEmpresa();
  notificar('Nova simulação iniciada!');
}

async function carregarDadosJSON() {
  try {
    const response = await fetch('dados.json');
    const dados = await response.json();
    return dados;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return {
      relacoesDiplomaticas: {
        china: 'normal',
        portugal: 'boa',
        eua: 'normal',
        brasil: 'boa'
      },
      tarifas: {
        china: 0.15,
        portugal: 0.05,
        eua: 0.10,
        brasil: 0.12
      }
    };
  }
}

// ============================================
// FUNÇÕES AUXILIARES DE SUPORTE
// ============================================

function _adicionarNoticia(titulo, descricao, categoria = 'geral', importante = false) {
    noticiasSimulador.unshift({
        id: Date.now() + Math.random(),
        titulo: titulo,
        descricao: descricao,
        categoria: categoria,
        importante: importante,
        data: dataSimulador ? dataSimulador.toLocaleDateString() : new Date().toLocaleDateString(),
        lida: false
    });
    if (noticiasSimulador.length > 60) {
        noticiasSimulador = noticiasSimulador.slice(0, 60);
    }
}

function _fecharEmpresaPorMulta(valorMulta) {
    if (intervaloPrincipal) {
        clearInterval(intervaloPrincipal);
        intervaloPrincipal = null;
    }
    
    notificar('❌ Por incumprimento, a sua empresa foi fechada pela AGT!');
    
    document.getElementById('conteudoPrincipal').innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <h2 style="color:var(--accent-red);font-size:2rem;margin-bottom:20px;">
                🏛️ EMPRESA ENCERRADA PELA AGT
            </h2>
            <p style="color:var(--text-secondary);margin-bottom:10px;">
                Por incumprimento das obrigações fiscais, a sua empresa foi encerrada.
            </p>
            <p style="color:var(--accent-gold);margin-bottom:30px;">
                Multa não paga: ${formatarMoeda(valorMulta)} Kz
            </p>
            <button onclick="reiniciarSimulacao()"
                    style="background:var(--accent-gold);color:#000;
                           border:none;padding:15px 40px;
                           border-radius:8px;font-size:1.1rem;
                           font-weight:700;cursor:pointer;">
                🔄 Recomeçar Simulação
            </button>
        </div>
    `;
}

// ============================================
// FORMULÁRIO DE CRIAÇÃO DA EMPRESA
// ============================================

function mostrarFormularioCriacaoEmpresa() {
  const conteudo = `
    <div class="form-container">
      <h2>🏢 Criar Nova Empresa</h2>
      <form id="form-empresa" onsubmit="criarEmpresa(event)">
        <div class="form-group">
          <label>Nome da Empresa</label>
          <input type="text" id="nome-empresa" required placeholder="Ex: Tech Solutions Lda" style="color: var(--text-primary); background: var(--bg-secondary);">
        </div>
        
        <div class="form-group">
          <label>Dimensão da Empresa</label>
          <select id="dimensao-empresa" onchange="atualizarOpcoesSaldo()" required style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione...</option>
            <option value="micro">Micro Empresa</option>
            <option value="pequena">Pequena Empresa</option>
            <option value="media">Média Empresa</option>
            <option value="grande">Grande Empresa</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Saldo Inicial</label>
          <select id="saldo-inicial" required style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione a dimensão primeiro</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Área de Atuação</label>
          <select id="area-atuacao" required style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione...</option>
            <option value="servicos">Prestação de Serviços</option>
            <option value="produtos">Venda de Produtos</option>
            <option value="hibrido">Híbrido (Serviços + Produtos)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Natureza Jurídica</label>
          <select id="natureza-juridica" required style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione...</option>
            <option value="unipessoal">Unipessoal</option>
            <option value="lda">Sociedade por Quotas (Lda)</option>
            <option value="sa">Sociedade Anónima (SA)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Nº Máximo de Funcionários</label>
          <select id="max-funcionarios" required style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione...</option>
            <option value="5">5 Funcionários</option>
            <option value="20">20 Funcionários</option>
            <option value="100">100 Funcionários</option>
            <option value="300">300 Funcionários</option>
            <option value="500">500 Funcionários</option>
          </select>
        </div>
        
        <button type="submit" class="btn-submit">🚀 Iniciar Simulação</button>
      </form>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = conteudo;
}

function atualizarOpcoesSaldo() {
  const dimensao = document.getElementById('dimensao-empresa').value;
  const selectSaldo = document.getElementById('saldo-inicial');
  
  let opcoes = '<option value="">Selecione o saldo</option>';
  
  switch(dimensao) {
    case 'micro':
      opcoes += '<option value="1000000">1.000.000 Kz</option>';
      break;
    case 'pequena':
      opcoes += '<option value="1000000">1.000.000 Kz</option>';
      opcoes += '<option value="5000000">5.000.000 Kz</option>';
      break;
    case 'media':
      opcoes += '<option value="25000000">25.000.000 Kz</option>';
      opcoes += '<option value="50000000">50.000.000 Kz</option>';
      break;
    case 'grande':
      opcoes += '<option value="100000000">100.000.000 Kz</option>';
      opcoes += '<option value="500000000">500.000.000 Kz</option>';
      opcoes += '<option value="5000000000">5.000.000.000 Kz</option>';
      break;
  }
  
  selectSaldo.innerHTML = opcoes;
}

function criarEmpresa(event) {
  event.preventDefault();
  
  const nome = document.getElementById('nome-empresa').value;
  const dimensao = document.getElementById('dimensao-empresa').value;
  const saldo = parseFloat(document.getElementById('saldo-inicial').value);
  const area = document.getElementById('area-atuacao').value;
  const natureza = document.getElementById('natureza-juridica').value;
  const maxFunc = parseInt(document.getElementById('max-funcionarios').value);
  
  if (!nome || !dimensao || !saldo || !area || !natureza || !maxFunc) {
    notificar('Preencha todos os campos!');
    return;
  }
  
  estadoJogo.empresaCriada = true;
  estadoJogo.nomeEmpresa = nome;
  estadoJogo.dimensao = dimensao;
  estadoJogo.naturezaJuridica = natureza;
  estadoJogo.areaAtuacao = area;
  estadoJogo.carteiraKz = saldo;
  estadoJogo.saldoInicial = saldo;
  estadoJogo.maxFuncionarios = maxFunc;
  estadoJogo.clientesIniciais = 100;
  
  document.getElementById('empresaNome').textContent = nome;
  document.getElementById('empresaDimensao').textContent = dimensao.toUpperCase();
  atualizarCarteiras();
  
  iniciarTempoSimulador();
  mostrarDashboardInicial();
  
  notificar(`Empresa ${nome} criada com sucesso!`);
  salvarEstadoSimulacao();
}

function mostrarDashboardInicial() {
  atualizarDashboard();
  const conteudo = `
    <div class="welcome-screen">
      <h2>🎉 Empresa Criada com Sucesso!</h2>
      <p><strong>${estadoJogo.nomeEmpresa}</strong> - ${estadoJogo.dimensao.toUpperCase()}</p>
      <p>Saldo Inicial: ${formatarMoeda(estadoJogo.carteiraKz)} Kz</p>
      <p>Use o menu ☰ para começar a gerir a sua empresa.</p>
      
      <div style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
        <button onclick="mostrarRH()" style="padding:15px 30px; font-size:16px; background:var(--accent-gold); color:#000; border:none; border-radius:8px; cursor:pointer;">👥 Contratar Funcionários</button>
        <button onclick="mostrarFornecedores()" style="padding:15px 30px; font-size:16px; background:var(--accent-gold); color:#000; border:none; border-radius:8px; cursor:pointer;">📦 Comprar Produtos</button>
        <button onclick="mostrarNoticias()" style="padding:15px 30px; font-size:16px; background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:8px; cursor:pointer;">📰 Notícias</button>
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = conteudo;
}

// ============================================
// SISTEMA DE TEMPO
// ============================================

function iniciarTempoSimulador() {
  if (intervaloPrincipal) {
    clearInterval(intervaloPrincipal);
  }
  
  const intervaloMs = 1000 / velocidadeTempo;
  
  intervaloPrincipal = setInterval(() => {
    tempoDecorrido += 1;
    
    if (tempoDecorrido % TEMPO.dia === 0) {
      processarDia();
    }
    
    if (tempoDecorrido % TEMPO.mes === 0) {
      processarMes();
    }
    
    if (tempoDecorrido % TEMPO.trimestre === 0) {
      processarTrimestre();
    }
    
    if (tempoDecorrido % TEMPO.ano === 0) {
      processarAno();
    }
    
    atualizarDataDisplay();
    verificarEventos();
    verificarProducoesConcluidas();
    verificarExportacoesConcluidas();
    
  }, intervaloMs);
}

function processarDia() {
  dataSimulador.setDate(dataSimulador.getDate() + 1);
  
  processarVendasDiarias();
  verificarEntregas();
  verificarProducoesConcluidas();
  verificarExportacoesConcluidas();
  verificarVencimentos();
  verificarPagamentosParcelados();
  
  // Módulo Fiscal
  _verificarPrazoFiscal();
  _verificarPagamentoContabilistaEntrega();
  _verificarPagamentoImpostoAutomatico();
  _verificarMultaPrestacaoMensal();
  
  // Módulo USD
  _verificarVencimentosDepositosUsd();
  _verificarVencimentosTitulosUsd();
  
  atualizarDashboard();
}

function processarMes() {
  const mesAtual = dataSimulador.getMonth();
  const anoAtual = dataSimulador.getFullYear();
  
  pagamentosMes = {
    salariosPagos: false,
    inssPago: false,
    mesReferencia: mesAtual,
    anoReferencia: anoAtual
  };
  
  pagarAguaLuz();
  pagarImpostoSelo();
  
  calcularFaturamentoMensal();
  registrarHistoricoMensal();
  
  clientes.historico.push(clientes.nacionais + clientes.estrangeiros);
  if (clientes.historico.length > 24) {
    clientes.historico = clientes.historico.slice(-24);
  }
  
  estadoJogo.faturamentoMes = 0;
  estadoJogo.custosMes = 0;
  estadoJogo.bonusProdutividade = 0;
  
  // Módulos de Suporte
  _atualizarCambioMensal();
  _sortearEventosMensais();
  _gerarNoticiasMercadoMensal();
  
  notificar(`📅 Mês ${mesAtual + 1}/${anoAtual} finalizado`);
  salvarEstadoSimulacao();
}

function processarTrimestre() {
  atualizarTaxaCambio();
  atualizarPrecosPropriedades();
  processarPagamentosParcerias();
  
  notificar('💰 Taxa de câmbio e preços de propriedades atualizados');
}

function processarAno() {
  dataSimulador.setFullYear(dataSimulador.getFullYear() + 1);
  
  verificarLicencaExportacao();
  atualizarRelacoesDiplomaticas();
  verificarCriseGlobal();
  
  if (estadoJogo.nivelExpansao >= 3) {
    const novosClientes = Math.floor((clientes.nacionais + clientes.estrangeiros) * 0.01);
    clientes.nacionais += novosClientes;
    notificar(`📈 Crescimento anual de 1%: +${novosClientes} clientes`);
  }
  
  // Relatório Anual
  _executarRelatorioAnual();
  
  notificar(`🎉 Ano ${dataSimulador.getFullYear()} iniciado!`);
  salvarEstadoSimulacao();
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE
// ============================================

function atualizarDataDisplay() {
  const dia = dataSimulador.getDate().toString().padStart(2, '0');
  const mes = (dataSimulador.getMonth() + 1).toString().padStart(2, '0');
  const ano = dataSimulador.getFullYear();
  document.getElementById('dataDisplay').textContent = `${dia}/${mes}/${ano}`;
}

function atualizarCarteiras() {
  document.getElementById('carteiraKz').textContent = `Kz: ${formatarMoeda(estadoJogo.carteiraKz)}`;
  document.getElementById('carteiraUsd').textContent = `USD: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')}`;
}

function atualizarDashboard() {
  document.getElementById('totalClientes').textContent = clientes.nacionais + clientes.estrangeiros;
  document.getElementById('totalFuncionarios').textContent = calcularTotalFuncionarios();
  document.getElementById('lucroMes').textContent = formatarMoeda(estadoJogo.lucroMes);
  document.getElementById('totalEstoque').textContent = calcularTotalEstoque();
  document.getElementById('reservaUsd').textContent = formatarMoeda(estadoJogo.carteiraUsd, 'USD');
  document.getElementById('statusLicenca').textContent = estadoJogo.licencaExportacao ? '✅' : '❌';
}

function formatarMoeda(valor, moeda = 'Kz') {
  if (moeda === 'USD') {
    return valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return valor.toLocaleString('pt-PT');
}

// ============================================
// MÓDULO RH
// ============================================

function mostrarRH() {
  if (!estadoJogo.empresaCriada) {
    notificar('Crie uma empresa primeiro!');
    return;
  }
  
  verificarPagamentosMes();
  
  const totalSalarios = calcularTotalSalarios();
  const totalINSS = totalSalarios * 0.11;
  const totalHomens = calcularTotalHomens();
  const totalMulheres = calcularTotalMulheres();
  const totalFunc = totalHomens + totalMulheres;
  
  const html = `
    <div class="rh-container">
      <h2>👥 Recursos Humanos</h2>
      
      <div class="rh-status-bar">
        <div class="status-item ${pagamentosMes.salariosPagos ? 'pago' : 'pendente'}">
          <span>💰 Salários:</span>
          <span>${pagamentosMes.salariosPagos ? '✅ PAGO' : '⏳ PENDENTE'}</span>
        </div>
        <div class="status-item ${pagamentosMes.inssPago ? 'pago' : 'pendente'}">
          <span>🏥 INSS:</span>
          <span>${pagamentosMes.inssPago ? '✅ PAGO' : '⏳ PENDENTE'}</span>
        </div>
        <div class="status-item">
          <span>📅 Mês:</span>
          <span>${dataSimulador.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
      
      <div class="tabela-container">
        <table class="tabela-funcionarios">
          <thead>
            <tr>
              <th>Classe</th>
              <th>Homens</th>
              <th>Mulheres</th>
              <th>Salário Unitário</th>
              <th>Salário Total</th>
              <th>Produtividade</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhasTabelaFuncionarios()}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Totais</strong></td>
              <td><strong>${totalHomens}</strong></td>
              <td><strong>${totalMulheres}</strong></td>
              <td></td>
              <td><strong>${formatarMoeda(totalSalarios)} Kz</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-top:30px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>📝 Contratar</h3>
          <select id="classe-contratar" style="color: var(--text-primary); background: var(--bg-secondary); width:100%; padding:5px; margin-bottom:10px;">
            <option value="A">Classe A (700k Kz) +2% prod</option>
            <option value="B">Classe B (200k Kz) +0.5% prod</option>
            <option value="C">Classe C (50k Kz) +0.01% prod</option>
            <option value="D">Classe D (30k Kz) 0% prod</option>
          </select>
          
          <div style="margin:10px 0;">
            <label>Homens:</label>
            <input type="number" id="homens-contratar" min="0" value="0" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary); width:100%; padding:5px;">
          </div>
          
          <div style="margin:10px 0;">
            <label>Mulheres:</label>
            <input type="number" id="mulheres-contratar" min="0" value="0" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary); width:100%; padding:5px;">
          </div>
          
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; margin:10px 0;">
            <p>💰 Salário: <span id="preview-salario">0</span> Kz</p>
            <p>🏥 INSS: <span id="preview-inss">0</span> Kz</p>
            <p style="color:var(--accent-gold);">💵 Total: <span id="preview-total">0</span> Kz</p>
          </div>
          
          <button onclick="contratarFuncionarios()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Contratar</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>⚠️ Demitir</h3>
          <select id="classe-demitir" style="color: var(--text-primary); background: var(--bg-secondary); width:100%; padding:5px; margin-bottom:10px;">
            <option value="A">Classe A</option>
            <option value="B">Classe B</option>
            <option value="C">Classe C</option>
            <option value="D">Classe D</option>
          </select>
          
          <div style="margin:10px 0;">
            <label>Quantidade:</label>
            <input type="number" id="quantidade-demitir" min="1" value="1" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary); width:100%; padding:5px;">
          </div>
          
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; margin:10px 0;">
            <p style="color:var(--accent-red);">⚠️ Indemnização: 4 salários</p>
            <p id="preview-indemnizacao">0 Kz</p>
          </div>
          
          <button onclick="demitirFuncionarios()" style="width:100%; padding:10px; background:var(--accent-red); color:#fff; border:none; border-radius:4px; cursor:pointer;">Demitir</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>📚 Formação</h3>
          <p>Custo: 3.500.000 Kz</p>
          <p>Ganha +5% produtividade no mês</p>
          <button onclick="fazerFormacao()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Realizar Formação</button>
        </div>
      </div>
      
      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        <button onclick="pagarSalarios()" style="padding:15px; background:${pagamentosMes.salariosPagos ? 'var(--bg-tertiary)' : 'var(--accent-green)'}; color:#fff; border:none; border-radius:4px; cursor:${pagamentosMes.salariosPagos ? 'not-allowed' : 'pointer'}; flex:1; margin-right:10px;" ${pagamentosMes.salariosPagos ? 'disabled' : ''}>
          💰 Pagar Salários (${formatarMoeda(totalSalarios)} Kz)
        </button>
        <button onclick="pagarSegurancaSocial()" style="padding:15px; background:${pagamentosMes.inssPago ? 'var(--bg-tertiary)' : 'var(--accent-green)'}; color:#fff; border:none; border-radius:4px; cursor:${pagamentosMes.inssPago ? 'not-allowed' : 'pointer'}; flex:1;" ${pagamentosMes.inssPago ? 'disabled' : ''}>
          🏥 Pagar Seg. Social (${formatarMoeda(totalINSS)} Kz)
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  
  document.getElementById('homens-contratar').addEventListener('input', atualizarPreviewContratacao);
  document.getElementById('mulheres-contratar').addEventListener('input', atualizarPreviewContratacao);
  document.getElementById('classe-contratar').addEventListener('change', atualizarPreviewContratacao);
  document.getElementById('quantidade-demitir').addEventListener('input', atualizarPreviewDemissao);
  document.getElementById('classe-demitir').addEventListener('change', atualizarPreviewDemissao);
  
  atualizarPreviewContratacao();
  atualizarPreviewDemissao();
}

function verificarPagamentosMes() {
  const mesAtual = dataSimulador.getMonth();
  const anoAtual = dataSimulador.getFullYear();
  
  if (pagamentosMes.mesReferencia !== mesAtual || pagamentosMes.anoReferencia !== anoAtual) {
    pagamentosMes = {
      salariosPagos: false,
      inssPago: false,
      mesReferencia: mesAtual,
      anoReferencia: anoAtual
    };
  }
}

function gerarLinhasTabelaFuncionarios() {
  let linhas = '';
  for (let classe in funcionarios) {
    const total = funcionarios[classe].homens + funcionarios[classe].mulheres;
    linhas += `
      <tr>
        <td><strong>Classe ${classe.replace('classe', '').toUpperCase()}</strong></td>
        <td>${funcionarios[classe].homens}</td>
        <td>${funcionarios[classe].mulheres}</td>
        <td>${formatarMoeda(funcionarios[classe].salario)} Kz</td>
        <td>${formatarMoeda(total * funcionarios[classe].salario)} Kz</td>
        <td>+${(funcionarios[classe].produtividade * 100).toFixed(2)}%</td>
      </tr>
    `;
  }
  return linhas || '<tr><td colspan="6" style="text-align: center;">Nenhum funcionário contratado</td></tr>';
}

function calcularTotalFuncionarios() {
  let total = 0;
  for (let classe in funcionarios) {
    total += funcionarios[classe].homens + funcionarios[classe].mulheres;
  }
  return total;
}

function calcularTotalHomens() {
  let total = 0;
  for (let classe in funcionarios) {
    total += funcionarios[classe].homens;
  }
  return total;
}

function calcularTotalMulheres() {
  let total = 0;
  for (let classe in funcionarios) {
    total += funcionarios[classe].mulheres;
  }
  return total;
}

function calcularTotalSalarios() {
  let total = 0;
  for (let classe in funcionarios) {
    const qtd = funcionarios[classe].homens + funcionarios[classe].mulheres;
    total += qtd * funcionarios[classe].salario;
  }
  return total;
}

function atualizarPreviewContratacao() {
  const classe = document.getElementById('classe-contratar').value;
  const homens = parseInt(document.getElementById('homens-contratar').value) || 0;
  const mulheres = parseInt(document.getElementById('mulheres-contratar').value) || 0;
  const total = homens + mulheres;
  
  if (total === 0) {
    document.getElementById('preview-salario').textContent = '0';
    document.getElementById('preview-inss').textContent = '0';
    document.getElementById('preview-total').textContent = '0';
    return;
  }
  
  const salarioUnitario = funcionarios['classe' + classe].salario;
  const salarioTotal = total * salarioUnitario;
  const inssTotal = salarioTotal * 0.11;
  const totalGeral = salarioTotal + inssTotal;
  
  document.getElementById('preview-salario').textContent = formatarMoeda(salarioTotal);
  document.getElementById('preview-inss').textContent = formatarMoeda(inssTotal);
  document.getElementById('preview-total').textContent = formatarMoeda(totalGeral);
}

function atualizarPreviewDemissao() {
  const classe = document.getElementById('classe-demitir').value;
  const quantidade = parseInt(document.getElementById('quantidade-demitir').value) || 0;
  
  if (quantidade === 0) {
    document.getElementById('preview-indemnizacao').textContent = '0 Kz';
    return;
  }
  
  const indemnizacao = quantidade * funcionarios['classe' + classe].salario * 4;
  document.getElementById('preview-indemnizacao').textContent = formatarMoeda(indemnizacao) + ' Kz';
}

function contratarFuncionarios() {
  const classe = document.getElementById('classe-contratar').value;
  const homens = parseInt(document.getElementById('homens-contratar').value) || 0;
  const mulheres = parseInt(document.getElementById('mulheres-contratar').value) || 0;
  const total = homens + mulheres;
  
  if (total === 0) {
    notificar('❌ Selecione pelo menos 1 funcionário');
    return;
  }
  
  const totalAtual = calcularTotalFuncionarios();
  if (totalAtual + total > estadoJogo.maxFuncionarios) {
    notificar(`❌ Limite máximo de ${estadoJogo.maxFuncionarios} funcionários atingido`);
    return;
  }
  
  const salarioTotal = total * funcionarios['classe' + classe].salario;
  
  if (estadoJogo.carteiraKz < salarioTotal) {
    notificar('❌ Saldo insuficiente para pagar o primeiro mês');
    return;
  }
  
  if (!confirm(`Confirmar contratação?\nClasse: ${classe}\nHomens: ${homens}\nMulheres: ${mulheres}\nTotal: ${total} funcionários\nSalário mensal: ${formatarMoeda(salarioTotal)} Kz`)) {
    return;
  }
  
  funcionarios['classe' + classe].homens += homens;
  funcionarios['classe' + classe].mulheres += mulheres;
  
  estadoJogo.carteiraKz -= salarioTotal;
  estadoJogo.custosMes += salarioTotal;
  
  registrarTransacao('rh', 'saida', salarioTotal, 'Kz', `Contratação de ${total} funcionários classe ${classe} (1º mês)`);
  
  notificar(`✅ ${total} funcionários classe ${classe} contratados!`);
  salvarEstadoSimulacao();
  mostrarRH();
  atualizarCarteiras();
}

function demitirFuncionarios() {
  const classe = document.getElementById('classe-demitir').value;
  const quantidade = parseInt(document.getElementById('quantidade-demitir').value);
  
  if (quantidade <= 0) {
    notificar('❌ Quantidade inválida');
    return;
  }
  
  const disponiveis = funcionarios['classe' + classe].homens + funcionarios['classe' + classe].mulheres;
  if (quantidade > disponiveis) {
    notificar('❌ Não há funcionários suficientes nesta classe');
    return;
  }
  
  const indemnizacao = quantidade * funcionarios['classe' + classe].salario * 4;
  
  if (estadoJogo.carteiraKz < indemnizacao) {
    notificar('❌ Não podes demitir sem pagar a indemnização total');
    return;
  }
  
  if (!confirm(`Confirmar demissão?\nClasse: ${classe}\nQuantidade: ${quantidade}\nIndemnização: ${formatarMoeda(indemnizacao)} Kz`)) {
    return;
  }
  
  const proporcaoHomens = funcionarios['classe' + classe].homens / disponiveis;
  const demitirHomens = Math.floor(quantidade * proporcaoHomens);
  const demitirMulheres = quantidade - demitirHomens;
  
  funcionarios['classe' + classe].homens -= demitirHomens;
  funcionarios['classe' + classe].mulheres -= demitirMulheres;
  
  estadoJogo.carteiraKz -= indemnizacao;
  estadoJogo.custosMes += indemnizacao;
  
  registrarTransacao('rh', 'saida', indemnizacao, 'Kz', `Demissão de ${quantidade} funcionários classe ${classe} (indemnização)`);
  
  notificar(`✅ ${quantidade} funcionários demitidos. Indemnização: ${formatarMoeda(indemnizacao)} Kz`);
  salvarEstadoSimulacao();
  mostrarRH();
  atualizarCarteiras();
}

function pagarSalarios() {
  verificarPagamentosMes();
  
  if (pagamentosMes.salariosPagos) {
    notificar('⚠️ Salários já foram pagos este mês!');
    return;
  }
  
  const totalSalarios = calcularTotalSalarios();
  
  if (totalSalarios === 0) {
    notificar('Nenhum funcionário para pagar');
    return;
  }
  
  if (estadoJogo.carteiraKz < totalSalarios) {
    notificar('❌ Saldo insuficiente para pagar salários');
    return;
  }
  
  estadoJogo.carteiraKz -= totalSalarios;
  estadoJogo.custosMes += totalSalarios;
  pagamentosMes.salariosPagos = true;
  
  registrarTransacao('rh', 'saida', totalSalarios, 'Kz', 'Pagamento de salários');
  notificar(`✅ Salários pagos: ${formatarMoeda(totalSalarios)} Kz`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
  mostrarRH();
}

function pagarSegurancaSocial() {
  verificarPagamentosMes();
  
  if (pagamentosMes.inssPago) {
    notificar('⚠️ INSS já foi pago este mês!');
    return;
  }
  
  const totalSalarios = calcularTotalSalarios();
  
  if (totalSalarios === 0) {
    notificar('Nenhum funcionário registrado');
    return;
  }
  
  const segSocial = totalSalarios * 0.11;
  
  if (estadoJogo.carteiraKz < segSocial) {
    notificar('❌ Saldo insuficiente para pagar Segurança Social');
    return;
  }
  
  estadoJogo.carteiraKz -= segSocial;
  estadoJogo.custosMes += segSocial;
  pagamentosMes.inssPago = true;
  
  registrarTransacao('rh', 'saida', segSocial, 'Kz', 'Pagamento Segurança Social (INSS)');
  notificar(`✅ INSS pago: ${formatarMoeda(segSocial)} Kz`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
  mostrarRH();
}

function fazerFormacao() {
  const custo = 3500000;
  
  if (estadoJogo.carteiraKz < custo) {
    notificar('Saldo insuficiente para formação');
    return;
  }
  
  estadoJogo.carteiraKz -= custo;
  estadoJogo.custosMes += custo;
  estadoJogo.bonusProdutividade = 0.05;
  
  registrarTransacao('rh', 'saida', custo, 'Kz', 'Formação da equipa');
  notificar('Formação realizada! +5% produtividade neste mês');
  atualizarCarteiras();
  salvarEstadoSimulacao();
}

// ============================================
// MÓDULO FORNECEDORES E ESTOQUE
// ============================================

function mostrarFornecedores() {
  const html = `
    <div class="fornecedores-container">
      <h2>📦 Fornecedores</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px;">
        <button style="flex:1; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarFornecedoresNacionais()">Nacionais (Kz)</button>
        <button style="flex:1; padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarFornecedoresInternacionais()">Internacionais (USD)</button>
        <button style="flex:1; padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarProducaoServicos()">Produção de Serviços</button>
      </div>
      
      <div id="fornecedores-conteudo">
        ${gerarFornecedoresNacionaisHTML()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarFornecedoresNacionaisHTML() {
  return `
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Nacional Classe A</h4>
        <p>⏱️ Entrega: 1 dia</p>
        <p>📦 Mínimo: 100 unidades</p>
        <input type="number" id="preco-produto-a" placeholder="Preço unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-a" min="100" placeholder="Quantidade (mín. 100)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-a">Total: 0 Kz</p>
        <button onclick="comprarNacional('A')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Nacional Classe B</h4>
        <p>⏱️ Entrega: 7 dias</p>
        <p>📦 Mínimo: 40 unidades</p>
        <input type="number" id="preco-produto-b" placeholder="Preço unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-b" min="40" placeholder="Quantidade (mín. 40)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-b">Total: 0 Kz</p>
        <button onclick="comprarNacional('B')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Nacional Classe C</h4>
        <p>⏱️ Entrega: 15 dias</p>
        <p>📦 Mínimo: 10 unidades</p>
        <input type="number" id="preco-produto-c" placeholder="Preço unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-c" min="10" placeholder="Quantidade (mín. 10)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-c">Total: 0 Kz</p>
        <button onclick="comprarNacional('C')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
      </div>
    </div>
  `;
}

function gerarFornecedoresInternacionaisHTML() {
  return `
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Internacional Classe A</h4>
        <p>⏱️ Entrega: 7 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 50 unidades</p>
        <select id="pais-importacao-a" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-a" placeholder="Preço unitário (USD)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-a" min="50" placeholder="Quantidade (mín. 50)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-int-a">Total: 0 USD</p>
        <button onclick="comprarInternacional('A')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Importar</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Internacional Classe B</h4>
        <p>⏱️ Entrega: 30 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 20 unidades</p>
        <select id="pais-importacao-b" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-b" placeholder="Preço unitário (USD)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-b" min="20" placeholder="Quantidade (mín. 20)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-int-b">Total: 0 USD</p>
        <button onclick="comprarInternacional('B')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Importar</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Fornecedor Internacional Classe C</h4>
        <p>⏱️ Entrega: 90 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 5 unidades</p>
        <select id="pais-importacao-c" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-c" placeholder="Preço unitário (USD)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-c" min="5" placeholder="Quantidade (mín. 5)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-int-c">Total: 0 USD</p>
        <button onclick="comprarInternacional('C')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Importar</button>
      </div>
    </div>
  `;
}

function gerarProducaoServicosHTML() {
  return `
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Serviço Classe A</h4>
        <p>⏱️ Produção: 30 dias</p>
        <p>📦 Mínimo: 5 unidades</p>
        <input type="number" id="preco-servico-a" placeholder="Custo unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-a" min="5" placeholder="Quantidade (mín. 5)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-servico-a">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('A')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Iniciar Produção</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Serviço Classe B</h4>
        <p>⏱️ Produção: 15 dias</p>
        <p>📦 Mínimo: 10 unidades</p>
        <input type="number" id="preco-servico-b" placeholder="Custo unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-b" min="10" placeholder="Quantidade (mín. 10)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-servico-b">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('B')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Iniciar Produção</button>
      </div>
      
      <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
        <h4>Serviço Classe C</h4>
        <p>⏱️ Produção: 7 dias</p>
        <p>📦 Mínimo: 20 unidades</p>
        <input type="number" id="preco-servico-c" placeholder="Custo unitário (Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-c" min="20" placeholder="Quantidade (mín. 20)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
        <p style="color:var(--accent-gold);" id="total-pagar-servico-c">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('C')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Iniciar Produção</button>
      </div>
    </div>
  `;
}

function mostrarFornecedoresNacionais() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarFornecedoresNacionaisHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  adicionarListenersNacionais();
}

function mostrarFornecedoresInternacionais() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarFornecedoresInternacionaisHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  adicionarListenersInternacionais();
}

function mostrarProducaoServicos() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarProducaoServicosHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  adicionarListenersProducao();
}

function adicionarListenersNacionais() {
  document.getElementById('preco-produto-a')?.addEventListener('input', () => atualizarTotalNacional('A'));
  document.getElementById('quantidade-produto-a')?.addEventListener('input', () => atualizarTotalNacional('A'));
  document.getElementById('preco-produto-b')?.addEventListener('input', () => atualizarTotalNacional('B'));
  document.getElementById('quantidade-produto-b')?.addEventListener('input', () => atualizarTotalNacional('B'));
  document.getElementById('preco-produto-c')?.addEventListener('input', () => atualizarTotalNacional('C'));
  document.getElementById('quantidade-produto-c')?.addEventListener('input', () => atualizarTotalNacional('C'));
}

function adicionarListenersInternacionais() {
  document.getElementById('preco-produto-int-a')?.addEventListener('input', () => atualizarTotalInternacional('A'));
  document.getElementById('quantidade-produto-int-a')?.addEventListener('input', () => atualizarTotalInternacional('A'));
  document.getElementById('preco-produto-int-b')?.addEventListener('input', () => atualizarTotalInternacional('B'));
  document.getElementById('quantidade-produto-int-b')?.addEventListener('input', () => atualizarTotalInternacional('B'));
  document.getElementById('preco-produto-int-c')?.addEventListener('input', () => atualizarTotalInternacional('C'));
  document.getElementById('quantidade-produto-int-c')?.addEventListener('input', () => atualizarTotalInternacional('C'));
}

function adicionarListenersProducao() {
  document.getElementById('preco-servico-a')?.addEventListener('input', () => atualizarTotalProducao('A'));
  document.getElementById('quantidade-servico-a')?.addEventListener('input', () => atualizarTotalProducao('A'));
  document.getElementById('preco-servico-b')?.addEventListener('input', () => atualizarTotalProducao('B'));
  document.getElementById('quantidade-servico-b')?.addEventListener('input', () => atualizarTotalProducao('B'));
  document.getElementById('preco-servico-c')?.addEventListener('input', () => atualizarTotalProducao('C'));
  document.getElementById('quantidade-servico-c')?.addEventListener('input', () => atualizarTotalProducao('C'));
}

function atualizarTotalNacional(classe) {
  const preco = parseFloat(document.getElementById(`preco-produto-${classe.toLowerCase()}`).value) || 0;
  const quantidade = parseInt(document.getElementById(`quantidade-produto-${classe.toLowerCase()}`).value) || 0;
  const total = preco * quantidade;
  document.getElementById(`total-pagar-${classe.toLowerCase()}`).textContent = `Total: ${formatarMoeda(total)} Kz`;
}

function atualizarTotalInternacional(classe) {
  const preco = parseFloat(document.getElementById(`preco-produto-int-${classe.toLowerCase()}`).value) || 0;
  const quantidade = parseInt(document.getElementById(`quantidade-produto-int-${classe.toLowerCase()}`).value) || 0;
  const total = preco * quantidade;
  document.getElementById(`total-pagar-int-${classe.toLowerCase()}`).textContent = `Total: ${formatarMoeda(total, 'USD')} USD`;
}

function atualizarTotalProducao(classe) {
  const preco = parseFloat(document.getElementById(`preco-servico-${classe.toLowerCase()}`).value) || 0;
  const quantidade = parseInt(document.getElementById(`quantidade-servico-${classe.toLowerCase()}`).value) || 0;
  const total = preco * quantidade;
  document.getElementById(`total-pagar-servico-${classe.toLowerCase()}`).textContent = `Total: ${formatarMoeda(total)} Kz`;
}

function comprarNacional(classe) {
  const preco = parseFloat(document.getElementById(`preco-produto-${classe.toLowerCase()}`).value);
  const quantidade = parseInt(document.getElementById(`quantidade-produto-${classe.toLowerCase()}`).value);
  const minimo = fornecedores.nacional[classe].minimo;
  
  if (!preco || preco <= 0) {
    notificar('Preço inválido');
    return;
  }
  
  if (!quantidade || quantidade < minimo) {
    notificar(`Quantidade mínima é ${minimo}`);
    return;
  }
  
  const total = preco * quantidade;
  
  if (estadoJogo.carteiraKz < total) {
    notificar('Saldo insuficiente');
    return;
  }
  
  estadoJogo.carteiraKz -= total;
  estadoJogo.custosMes += total;
  
  const dataEntrega = new Date(dataSimulador);
  dataEntrega.setDate(dataEntrega.getDate() + fornecedores.nacional[classe].prazo);
  
  entregasPendentes.push({
    id: Date.now(),
    tipo: 'produto',
    classe: `Nacional ${classe}`,
    quantidade,
    precoUnitario: preco,
    total,
    dataEntrega: dataEntrega.toLocaleDateString(),
    diasRestantes: fornecedores.nacional[classe].prazo
  });
  
  registrarTransacao('compra', 'saida', total, 'Kz', `Compra de ${quantidade} unidades (Nacional ${classe})`);
  notificar(`Compra realizada! Entrega em ${fornecedores.nacional[classe].prazo} dia(s)`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
}

function comprarInternacional(classe) {
  const pais = document.getElementById(`pais-importacao-${classe.toLowerCase()}`).value;
  const preco = parseFloat(document.getElementById(`preco-produto-int-${classe.toLowerCase()}`).value);
  const quantidade = parseInt(document.getElementById(`quantidade-produto-int-${classe.toLowerCase()}`).value);
  const minimo = fornecedores.internacional[classe].minimo;
  
  if (!preco || preco <= 0) {
    notificar('Preço inválido');
    return;
  }
  
  if (!quantidade || quantidade < minimo) {
    notificar(`Quantidade mínima é ${minimo}`);
    return;
  }
  
  const total = preco * quantidade;
  
  if (estadoJogo.carteiraUsd < total) {
    notificar('Saldo USD insuficiente');
    return;
  }
  
  const relacao = dadosMundo?.relacoesDiplomaticas?.[pais] || 'normal';
  let diasEntrega = fornecedores.internacional[classe].prazo;
  
  if (relacao === 'ruim') diasEntrega += 90;
  else if (relacao === 'normal') diasEntrega += 30;
  
  estadoJogo.carteiraUsd -= total;
  
  const dataEntrega = new Date(dataSimulador);
  dataEntrega.setDate(dataEntrega.getDate() + diasEntrega);
  
  entregasPendentes.push({
    id: Date.now(),
    tipo: 'produto',
    classe: `Internacional ${classe} (${pais})`,
    quantidade,
    precoUnitario: preco,
    total,
    moeda: 'USD',
    dataEntrega: dataEntrega.toLocaleDateString(),
    diasRestantes: diasEntrega
  });
  
  registrarTransacao('importacao', 'saida', total, 'USD', `Importação de ${quantidade} unidades de ${pais}`);
  notificar(`Importação realizada! Entrega em ${diasEntrega} dias`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
}

function iniciarProducaoServico(classe) {
  const prazos = { A: 30, B: 15, C: 7 };
  const minimos = { A: 5, B: 10, C: 20 };
  
  const preco = parseFloat(document.getElementById(`preco-servico-${classe.toLowerCase()}`).value);
  const quantidade = parseInt(document.getElementById(`quantidade-servico-${classe.toLowerCase()}`).value);
  
  if (!preco || preco <= 0) {
    notificar('❌ Custo unitário inválido');
    return;
  }
  
  if (!quantidade || quantidade < minimos[classe]) {
    notificar(`❌ Quantidade mínima é ${minimos[classe]}`);
    return;
  }
  
  const total = preco * quantidade;
  
  if (estadoJogo.carteiraKz < total) {
    notificar('❌ Saldo insuficiente');
    return;
  }
  
  estadoJogo.carteiraKz -= total;
  estadoJogo.custosMes += total;
  
  const dataConclusao = new Date(dataSimulador);
  dataConclusao.setDate(dataConclusao.getDate() + prazos[classe]);
  
  producoesPendentes.push({
    id: Date.now(),
    classe,
    quantidade,
    custoUnitario: preco,
    total,
    dataConclusao: dataConclusao.toLocaleDateString(),
    prazoTotal: prazos[classe],
    diasRestantes: prazos[classe]
  });
  
  registrarTransacao('producao', 'saida', total, 'Kz', `Início de produção: ${quantidade} serviços Classe ${classe}`);
  notificar(`✅ Produção iniciada! Conclusão em ${prazos[classe]} dias`);
  salvarEstadoSimulacao();
  mostrarProducaoServicos();
  atualizarCarteiras();
}

function mostrarEstoque() {
  const html = `
    <div class="estoque-container">
      <h2>📋 Gestão de Estoque</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px;">
        <button style="flex:1; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarEstoqueDisponivel()">Estoque Disponível</button>
        <button style="flex:1; padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarEntregasPendentes()">Entregas Pendentes</button>
        <button style="flex:1; padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarProducoesPendentes()">Produções Pendentes</button>
      </div>
      
      <div id="estoque-conteudo">
        ${gerarEstoqueDisponivelHTML()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarEstoqueDisponivelHTML() {
  if (estoque.length === 0) {
    return '<p style="text-align: center; padding: 50px;">📦 Nenhum produto em estoque</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Produto</th><th>Quantidade</th><th>Custo Unit.</th><th>Preço Venda</th><th>Margem</th><th>Ações</th></tr></thead><tbody>';
  
  estoque.forEach(item => {
    html += `
      <tr>
        <td>${item.nome || 'Produto'}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoeda(item.custoUnitario)} Kz</td>
        <td>${item.precoVenda ? formatarMoeda(item.precoVenda) + ' Kz' : 'Não definido'}</td>
        <td>${item.margem ? item.margem + '%' : '-'}</td>
        <td>
          ${!item.precoVenda ? `
            <input type="number" id="margem-${item.id}" min="0" max="30" placeholder="Margem 0-30%" style="width:80px; color: var(--text-primary); background: var(--bg-secondary);">
            <button onclick="definirMargem(${item.id})" style="padding:5px 10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Definir</button>
          ` : `
            <button onclick="venderProduto(${item.id})" style="padding:5px 10px; background:var(--accent-green); color:#fff; border:none; border-radius:4px; cursor:pointer;">Vender</button>
            ${estadoJogo.licencaExportacao ? `<button onclick="prepararExportacao(${item.id})" style="padding:5px 10px; background:var(--accent-blue); color:#fff; border:none; border-radius:4px; cursor:pointer;">🌍 Exportar</button>` : ''}
          `}
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function gerarEntregasPendentesHTML() {
  if (entregasPendentes.length === 0) {
    return '<p style="text-align: center; padding: 50px;">⏳ Nenhuma entrega pendente</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Fornecedor</th><th>Quantidade</th><th>Total</th><th>Data Entrega</th><th>Dias Restantes</th></tr></thead><tbody>';
  
  entregasPendentes.forEach(entrega => {
    const diasRestantes = calcularDiasRestantes(entrega.dataEntrega);
    html += `
      <tr>
        <td>${entrega.classe}</td>
        <td>${entrega.quantidade}</td>
        <td>${entrega.moeda === 'USD' ? formatarMoeda(entrega.total, 'USD') + ' USD' : formatarMoeda(entrega.total) + ' Kz'}</td>
        <td>${entrega.dataEntrega}</td>
        <td>${diasRestantes > 0 ? diasRestantes : 0} dias</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function gerarProducoesPendentesHTML() {
  if (producoesPendentes.length === 0) {
    return '<p style="text-align: center; padding: 50px;">⏳ Nenhuma produção pendente</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Classe</th><th>Quantidade</th><th>Custo Total</th><th>Data Conclusão</th><th>Dias Restantes</th></tr></thead><tbody>';
  
  producoesPendentes.forEach(prod => {
    const diasRestantes = calcularDiasRestantes(prod.dataConclusao);
    html += `
      <tr>
        <td>Serviço Classe ${prod.classe}</td>
        <td>${prod.quantidade}</td>
        <td>${formatarMoeda(prod.total)} Kz</td>
        <td>${prod.dataConclusao}</td>
        <td>${diasRestantes > 0 ? diasRestantes : 0} dias</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function verificarEntregas() {
  const hoje = dataSimulador.toLocaleDateString();
  
  entregasPendentes = entregasPendentes.filter(entrega => {
    if (entrega.dataEntrega === hoje) {
      const itemExistente = estoque.find(i => i.nome === entrega.classe && Math.abs(i.custoUnitario - entrega.precoUnitario) < 0.01);
      
      if (itemExistente) {
        const totalQuantidade = itemExistente.quantidade + entrega.quantidade;
        const custoTotal = (itemExistente.custoUnitario * itemExistente.quantidade) + (entrega.precoUnitario * entrega.quantidade);
        const custoMedio = custoTotal / totalQuantidade;
        
        itemExistente.quantidade = totalQuantidade;
        itemExistente.custoUnitario = custoMedio;
        
        if (itemExistente.precoVenda) {
          itemExistente.precoVenda = custoMedio * (1 + (itemExistente.margem / 100));
        }
      } else {
        estoque.push({
          id: Date.now(),
          nome: entrega.classe,
          quantidade: entrega.quantidade,
          custoUnitario: entrega.precoUnitario,
          precoVenda: null,
          margem: null,
          dataEntrada: hoje
        });
      }
      
      notificar(`📦 Entrega recebida: ${entrega.quantidade} unidades de ${entrega.classe}`);
      return false;
    }
    return true;
  });
}

function verificarProducoesConcluidas() {
  const hoje = dataSimulador.toLocaleDateString();
  
  producoesPendentes = producoesPendentes.filter(prod => {
    if (prod.dataConclusao === hoje) {
      const itemExistente = estoque.find(i => i.nome === `Serviço Classe ${prod.classe}` && Math.abs(i.custoUnitario - prod.custoUnitario) < 0.01);
      
      if (itemExistente) {
        const totalQuantidade = itemExistente.quantidade + prod.quantidade;
        const custoTotal = (itemExistente.custoUnitario * itemExistente.quantidade) + (prod.custoUnitario * prod.quantidade);
        const custoMedio = custoTotal / totalQuantidade;
        
        itemExistente.quantidade = totalQuantidade;
        itemExistente.custoUnitario = custoMedio;
        
        if (itemExistente.precoVenda) {
          itemExistente.precoVenda = custoMedio * (1 + (itemExistente.margem / 100));
        }
      } else {
        estoque.push({
          id: Date.now(),
          nome: `Serviço Classe ${prod.classe}`,
          quantidade: prod.quantidade,
          custoUnitario: prod.custoUnitario,
          precoVenda: null,
          margem: null,
          dataEntrada: hoje
        });
      }
      
      notificar(`✅ Serviço produzido: ${prod.quantidade} unidades Classe ${prod.classe}`);
      return false;
    }
    return true;
  });
}

function definirMargem(itemId) {
  const margem = parseFloat(document.getElementById(`margem-${itemId}`).value);
  
  if (isNaN(margem) || margem < 0 || margem > 30) {
    notificar('Margem deve ser entre 0% e 30%');
    return;
  }
  
  const item = estoque.find(i => i.id === itemId);
  if (item) {
    item.margem = margem;
    item.precoVenda = item.custoUnitario * (1 + margem / 100);
    notificar('Margem definida! Clique em "Vender" para colocar à venda');
    mostrarEstoqueDisponivel();
    salvarEstadoSimulacao();
  }
}

function venderProduto(itemId) {
  const item = estoque.find(i => i.id === itemId);
  if (!item || !item.precoVenda) {
    notificar('Produto não está pronto para venda');
    return;
  }
  
  item.status = 'venda';
  notificar(`✅ Produto colocado à venda por ${formatarMoeda(item.precoVenda)} Kz`);
  salvarEstadoSimulacao();
}

function mostrarEstoqueDisponivel() {
  document.getElementById('estoque-conteudo').innerHTML = gerarEstoqueDisponivelHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarEntregasPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = gerarEntregasPendentesHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarProducoesPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = gerarProducoesPendentesHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function calcularTotalEstoque() {
  return estoque.reduce((total, item) => total + item.quantidade, 0);
}

// ============================================
// MÓDULO MARKETING E CLIENTES
// ============================================

function mostrarMarketing() {
  const html = `
    <div class="marketing-container">
      <h2>📢 Campanhas de Marketing</h2>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>📱 Marketing Digital</h3>
          <p>Alcance: 100 pessoas / 50.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-digital" min="1" value="1" placeholder="Quantidade de lotes" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);" id="total-digital">Total: 50.000 Kz</p>
          <button onclick="investirMarketing('digital')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Investir</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>📰 Marketing Tradicional</h3>
          <p>Alcance: 30 pessoas / 10.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-tradicional" min="1" value="1" placeholder="Quantidade de lotes" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);" id="total-tradicional">Total: 10.000 Kz</p>
          <button onclick="investirMarketing('tradicional')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Investir</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>🌍 Marketing Internacional</h3>
          <p>Alcance: 50 pessoas / 100.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-internacional" min="1" value="1" placeholder="Quantidade de lotes" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);" id="total-internacional">Total: 100.000 Kz</p>
          <button onclick="investirMarketing('internacional')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Investir</button>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-top:20px;">
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
          <h4>Clientes Nacionais</h4>
          <span style="color:var(--accent-gold); font-size:24px;">${clientes.nacionais}</span>
        </div>
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
          <h4>Clientes Estrangeiros</h4>
          <span style="color:var(--accent-gold); font-size:24px;">${clientes.estrangeiros}</span>
        </div>
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
          <h4>Total</h4>
          <span style="color:var(--accent-gold); font-size:24px;">${clientes.nacionais + clientes.estrangeiros}</span>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  
  document.getElementById('qtd-digital').addEventListener('input', () => atualizarTotalMarketing('digital'));
  document.getElementById('qtd-tradicional').addEventListener('input', () => atualizarTotalMarketing('tradicional'));
  document.getElementById('qtd-internacional').addEventListener('input', () => atualizarTotalMarketing('internacional'));
}

function atualizarTotalMarketing(tipo) {
  const qtd = parseInt(document.getElementById(`qtd-${tipo}`).value) || 1;
  let custo = 0;
  
  switch(tipo) {
    case 'digital': custo = 50000; break;
    case 'tradicional': custo = 10000; break;
    case 'internacional': custo = 100000; break;
  }
  
  document.getElementById(`total-${tipo}`).textContent = `Total: ${formatarMoeda(qtd * custo)} Kz`;
}

function investirMarketing(tipo) {
  const alcancePorLote = { digital: 100, tradicional: 30, internacional: 50 };
  const custoPorLote = { digital: 50000, tradicional: 10000, internacional: 100000 };
  
  const qtd = parseInt(document.getElementById(`qtd-${tipo}`).value) || 1;
  const custoTotal = custoPorLote[tipo] * qtd;
  const alcanceTotal = alcancePorLote[tipo] * qtd;
  
  if (estadoJogo.carteiraKz < custoTotal) {
    notificar('Saldo insuficiente');
    return;
  }
  
  estadoJogo.carteiraKz -= custoTotal;
  estadoJogo.custosMes += custoTotal;
  
  const novosClientes = Math.floor(alcanceTotal * 0.02);
  
  if (tipo === 'internacional') {
    clientes.estrangeiros += novosClientes;
  } else {
    clientes.nacionais += novosClientes;
  }
  
  campanhasMarketing.push({
    data: dataSimulador.toLocaleDateString(),
    tipo,
    alcance: alcanceTotal,
    custo: custoTotal,
    novosClientes
  });
  
  registrarTransacao('marketing', 'saida', custoTotal, 'Kz', `Campanha ${tipo} (${qtd} lote(s))`);
  notificar(`✅ Campanha realizada! +${novosClientes} novos clientes`);
  salvarEstadoSimulacao();
  mostrarMarketing();
  atualizarCarteiras();
  atualizarDashboard();
}

// ============================================
// MÓDULO VENDAS
// ============================================

function processarVendasDiarias() {
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  
  if (totalClientes === 0) return;
  
  const produtosVenda = estoque.filter(item => item.status === 'venda' && item.quantidade > 0);
  
  if (produtosVenda.length === 0) {
    if (estoque.length > 0) {
      notificar('⚠️ Estoque cheio mas nenhum produto marcado como "à venda"!');
    } else {
      notificar('⚠️ Estoque de produto/serviço vazio');
    }
    return;
  }
  
  const vendasBase = 10;
  const vendasAdicionais = Math.floor(totalClientes / 100);
  const totalVendasDia = Math.min(vendasBase + vendasAdicionais, produtosVenda.reduce((sum, p) => sum + p.quantidade, 0));
  
  if (totalVendasDia <= 0) return;
  
  let vendasRealizadas = 0;
  let faturamentoDia = 0;
  
  for (let produto of produtosVenda) {
    if (vendasRealizadas >= totalVendasDia) break;
    
    const venderHoje = Math.min(produto.quantidade, Math.ceil(totalVendasDia / produtosVenda.length));
    if (venderHoje > 0) {
      produto.quantidade -= venderHoje;
      faturamentoDia += venderHoje * produto.precoVenda;
      vendasRealizadas += venderHoje;
    }
  }
  
  if (estadoJogo.bonusProdutividade) {
    faturamentoDia *= (1 + estadoJogo.bonusProdutividade);
  }
  
  if (inflacaoAtual > 15) {
    faturamentoDia *= (1 - (inflacaoAtual / 1000));
  }
  
  estadoJogo.carteiraKz += faturamentoDia;
  estadoJogo.faturamentoMes += faturamentoDia;
  
  registrarTransacao('venda', 'entrada', faturamentoDia, 'Kz', `Vendas do dia ${dataSimulador.toLocaleDateString()}`);
  
  estoque = estoque.filter(item => item.quantidade > 0);
  
  if (estoque.length === 0) {
    notificar('⚠️ Estoque de produto/serviço vazio');
  }
}

// ============================================
// MÓDULO FINANCEIRO
// ============================================

function mostrarFinanceiro() {
  const html = `
    <div class="financeiro-container">
      <h2>💰 Gestão Financeira</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px; flex-wrap:wrap;">
        <button style="padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarCreditos()">Créditos</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarDepositos()">Depósitos</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarTitulos()">Títulos Públicos</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarCambio()">Câmbio</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarHistoricoInvestimentos()">Histórico Invest.</button>
      </div>
      
      <div id="financeiro-conteudo">
        ${gerarCreditosHTML()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarCreditosHTML() {
  return `
    <div class="creditos-container">
      <h3>Solicitar Crédito</h3>
      
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Crédito Nacional (Kz)</h4>
          <p>Taxa de Juro: 19.5% ao ano</p>
          <p>Requisito: 65% do valor em Kz (bloqueado)</p>
          <input type="number" id="valor-credito-kz" placeholder="Valor desejado" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <select id="prazo-credito-kz" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <p id="juros-credito-kz">Juros total: 0 Kz</p>
          <button onclick="solicitarCreditoNacional()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Solicitar Crédito</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Crédito Internacional (USD)</h4>
          <p>Taxa de Juro: 30% ao ano</p>
          <p>Requisito: 85% do valor em USD (bloqueado)</p>
          <input type="number" id="valor-credito-usd" placeholder="Valor desejado" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <select id="prazo-credito-usd" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <select id="pais-credito" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            <option value="eua">EUA</option>
            <option value="china">China</option>
            <option value="portugal">Portugal</option>
          </select>
          <p id="juros-credito-usd">Juros total: 0 USD</p>
          <button onclick="solicitarCreditoInternacional()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Solicitar Crédito</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">Créditos Ativos</h3>
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Prazo</th>
              <th>Juros Total</th>
              <th>Juros Pagos</th>
              <th>Vencimento</th>
              <th>Garantia</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${gerarLinhasCreditos()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function gerarLinhasCreditos() {
  if (emprestimos.length === 0) {
    return '<tr><td colspan="8" style="text-align: center;">Nenhum crédito ativo</td></tr>';
  }
  
  return emprestimos.map(credito => `
    <tr>
      <td>${credito.tipo === 'nacional' ? '🇦🇴 Nacional' : '🌍 Internacional'}</td>
      <td>${credito.moeda === 'Kz' ? formatarMoeda(credito.valor) + ' Kz' : formatarMoeda(credito.valor, 'USD') + ' USD'}</td>
      <td>${credito.prazo} ano(s)</td>
      <td>${formatarMoeda(credito.jurosTotais)} ${credito.moeda}</td>
      <td>${formatarMoeda(credito.jurosPagos)} ${credito.moeda}</td>
      <td>${credito.dataVencimento}</td>
      <td>${formatarMoeda(credito.garantia)} ${credito.moeda}</td>
      <td><span style="color:${credito.status === 'ativo' ? 'var(--accent-green)' : 'var(--accent-red)'};">${credito.status}</span></td>
    </tr>
  `).join('');
}

function solicitarCreditoNacional() {
  const valor = parseFloat(document.getElementById('valor-credito-kz').value);
  const prazo = parseFloat(document.getElementById('prazo-credito-kz').value);
  
  if (!valor || valor <= 0) {
    notificar('Valor inválido');
    return;
  }
  
  const garantiaNecessaria = valor * 0.65;
  if (estadoJogo.carteiraKz < garantiaNecessaria) {
    notificar('❌ Crédito rejeitado: precisa de 65% do valor em saldo Kz');
    return;
  }
  
  const taxaJuros = 0.195;
  const jurosTotais = valor * taxaJuros * prazo;
  
  const dataVencimento = new Date(dataSimulador);
  dataVencimento.setFullYear(dataVencimento.getFullYear() + prazo);
  
  const credito = {
    id: Date.now(),
    tipo: 'nacional',
    moeda: 'Kz',
    valor,
    prazo,
    taxa: taxaJuros,
    jurosTotais,
    jurosPagos: 0,
    dataContracao: dataSimulador.toLocaleDateString(),
    dataVencimento: dataVencimento.toLocaleDateString(),
    garantia: garantiaNecessaria,
    status: 'ativo'
  };
  
  estadoJogo.carteiraKz -= garantiaNecessaria;
  estadoJogo.garantiasKz += garantiaNecessaria;
  estadoJogo.carteiraKz += valor;
  
  emprestimos.push(credito);
  registrarTransacao('credito', 'entrada', valor, 'Kz', `Crédito de ${formatarMoeda(valor)} Kz`);
  
  notificar(`✅ Crédito de ${formatarMoeda(valor)} Kz concedido! Vencimento: ${credito.dataVencimento}`);
  salvarEstadoSimulacao();
  mostrarFinanceiro();
  atualizarCarteiras();
}

function solicitarCreditoInternacional() {
  const valor = parseFloat(document.getElementById('valor-credito-usd').value);
  const prazo = parseFloat(document.getElementById('prazo-credito-usd').value);
  
  if (!valor || valor <= 0) {
    notificar('Valor inválido');
    return;
  }
  
  const garantiaNecessaria = valor * 0.85;
  if (estadoJogo.carteiraUsd < garantiaNecessaria) {
    notificar('❌ Crédito rejeitado: precisa de 85% do valor em reservas USD');
    return;
  }
  
  const taxaJuros = 0.30;
  const jurosTotais = valor * taxaJuros * prazo;
  
  const dataVencimento = new Date(dataSimulador);
  dataVencimento.setFullYear(dataVencimento.getFullYear() + prazo);
  
  const credito = {
    id: Date.now(),
    tipo: 'internacional',
    moeda: 'USD',
    valor,
    prazo,
    taxa: taxaJuros,
    jurosTotais,
    jurosPagos: 0,
    dataContracao: dataSimulador.toLocaleDateString(),
    dataVencimento: dataVencimento.toLocaleDateString(),
    garantia: garantiaNecessaria,
    status: 'ativo'
  };
  
  estadoJogo.carteiraUsd -= garantiaNecessaria;
  estadoJogo.garantiasUsd += garantiaNecessaria;
  estadoJogo.carteiraUsd += valor;
  
  emprestimos.push(credito);
  registrarTransacao('credito', 'entrada', valor, 'USD', `Crédito de ${formatarMoeda(valor, 'USD')} USD`);
  
  notificar(`✅ Crédito de ${formatarMoeda(valor, 'USD')} USD concedido!`);
  salvarEstadoSimulacao();
  mostrarFinanceiro();
  atualizarCarteiras();
}

function processarPagamentoJuros() {
  emprestimos.forEach(credito => {
    if (credito.status === 'ativo') {
      const prestacoesJuros = credito.prazo * 2;
      const jurosParcela = credito.jurosTotais / prestacoesJuros;
      
      if (credito.moeda === 'Kz') {
        if (estadoJogo.carteiraKz >= jurosParcela) {
          estadoJogo.carteiraKz -= jurosParcela;
          credito.jurosPagos += jurosParcela;
          registrarTransacao('juros', 'saida', jurosParcela, 'Kz', `Juros de crédito nacional`);
        } else {
          acionarGarantias(credito, jurosParcela);
        }
      } else {
        if (estadoJogo.carteiraUsd >= jurosParcela) {
          estadoJogo.carteiraUsd -= jurosParcela;
          credito.jurosPagos += jurosParcela;
          registrarTransacao('juros', 'saida', jurosParcela, 'USD', `Juros de crédito internacional`);
        } else {
          acionarGarantiasInternacionais(credito, jurosParcela);
        }
      }
    }
  });
}

function acionarGarantias(credito, valor) {
  if (estadoJogo.garantiasKz >= valor) {
    estadoJogo.garantiasKz -= valor;
    notificar(`⚠️ Garantias utilizadas para pagar juros: ${formatarMoeda(valor)} Kz`);
  } else {
    liquidarInvestimentos(valor - estadoJogo.garantiasKz, 'Kz');
  }
}

function acionarGarantiasInternacionais(credito, valor) {
  if (estadoJogo.garantiasUsd >= valor) {
    estadoJogo.garantiasUsd -= valor;
    notificar(`⚠️ Garantias USD utilizadas para pagar juros: ${formatarMoeda(valor, 'USD')} USD`);
  } else {
    liquidarInvestimentos(valor - estadoJogo.garantiasUsd, 'USD');
  }
}

function liquidarInvestimentos(valorNecessario, moeda) {
  let valorLiquidado = 0;
  
  for (let acaoId in investimentos.acoes) {
    const acao = investimentos.acoes[acaoId];
    if (acao.moeda === moeda && acao.quantidade > 0) {
      const valorAcao = acao.precoAtual * acao.quantidade;
      if (valorLiquidado + valorAcao <= valorNecessario) {
        valorLiquidado += valorAcao;
        investimentos.historico.push({
          data: dataSimulador.toLocaleDateString(),
          tipo: 'ação',
          nome: acao.nome,
          operacao: 'venda_forcada',
          quantidade: acao.quantidade,
          preco: acao.precoAtual,
          total: valorAcao
        });
        acao.quantidade = 0;
      } else {
        const qtdNecessaria = Math.ceil((valorNecessario - valorLiquidado) / acao.precoAtual);
        acao.quantidade -= qtdNecessaria;
        valorLiquidado += qtdNecessaria * acao.precoAtual;
        investimentos.historico.push({
          data: dataSimulador.toLocaleDateString(),
          tipo: 'ação',
          nome: acao.nome,
          operacao: 'venda_forcada',
          quantidade: qtdNecessaria,
          preco: acao.precoAtual,
          total: qtdNecessaria * acao.precoAtual
        });
        break;
      }
    }
  }
  
  if (valorLiquidado < valorNecessario) {
    if (moeda === 'Kz') {
      if (estadoJogo.garantiasKz >= (valorNecessario - valorLiquidado)) {
        estadoJogo.garantiasKz -= (valorNecessario - valorLiquidado);
      } else {
        declararFalencia();
      }
    } else {
      if (estadoJogo.garantiasUsd >= (valorNecessario - valorLiquidado)) {
        estadoJogo.garantiasUsd -= (valorNecessario - valorLiquidado);
      } else {
        declararFalencia();
      }
    }
  }
}

function verificarVencimentos() {
  const hoje = dataSimulador.toLocaleDateString();
  
  emprestimos.forEach(credito => {
    if (credito.status === 'ativo' && credito.dataVencimento === hoje) {
      if (credito.moeda === 'Kz') {
        if (estadoJogo.carteiraKz >= credito.valor) {
          estadoJogo.carteiraKz -= credito.valor;
          estadoJogo.garantiasKz += credito.garantia;
          credito.status = 'pago';
          registrarTransacao('credito', 'saida', credito.valor, 'Kz', `Pagamento final de crédito`);
          notificar(`✅ Crédito nacional quitado! Garantias de ${formatarMoeda(credito.garantia)} Kz liberadas`);
        } else {
          liquidarInvestimentos(credito.valor, 'Kz');
        }
      } else {
        if (estadoJogo.carteiraUsd >= credito.valor) {
          estadoJogo.carteiraUsd -= credito.valor;
          estadoJogo.garantiasUsd += credito.garantia;
          credito.status = 'pago';
          registrarTransacao('credito', 'saida', credito.valor, 'USD', `Pagamento final de crédito internacional`);
          notificar(`✅ Crédito internacional quitado! Garantias de ${formatarMoeda(credito.garantia, 'USD')} USD liberadas`);
        } else {
          liquidarInvestimentos(credito.valor, 'USD');
        }
      }
    }
  });
}

function declararFalencia() {
  clearInterval(intervaloPrincipal);
  intervaloPrincipal = null;
  
  const conteudo = `
    <div style="text-align:center;color:var(--accent-red);padding:60px 20px;">
      <h2 style="font-size:2rem;margin-bottom:20px;">💔 FALÊNCIA DECRETADA</h2>
      <p>A empresa não tem condições de continuar</p>
      <p>Dívidas não pagas levaram ao encerramento</p>
      <button onclick="reiniciarSimulacao()" style="padding:15px 40px; background:var(--accent-gold); color:#000; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer;">🔄 Recomeçar</button>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = conteudo;
  notificar('❌ FALÊNCIA - A empresa foi encerrada');
}

// ============================================
// MÓDULO CÂMBIO
// ============================================

function mostrarCambio() {
  const html = `
    <div class="cambio-container">
      <h3>💱 Câmbio de Moeda</h3>
      
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Comprar USD</h4>
          <p>Taxa de Câmbio Atual: 1 USD = ${formatarMoeda(taxaCambio)} Kz</p>
          <input type="number" id="quantidade-usd-comprar" min="1" placeholder="Quantidade USD" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p>Total a pagar: <span id="total-pagar-comprar">0</span> Kz</p>
          <button onclick="comprarUSD()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar USD</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Vender USD</h4>
          <p>Taxa de Câmbio Atual: 1 USD = ${formatarMoeda(taxaCambio)} Kz</p>
          <input type="number" id="quantidade-usd-vender" min="1" placeholder="Quantidade USD" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p>Total a receber: <span id="total-receber-vender">0</span> Kz</p>
          <button onclick="venderUSD()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Vender USD</button>
        </div>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:20px;">
        <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; text-align:center;">Saldo Kz: ${formatarMoeda(estadoJogo.carteiraKz)}</div>
        <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; text-align:center;">Saldo USD: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')}</div>
        <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; text-align:center;">Garantias Kz: ${formatarMoeda(estadoJogo.garantiasKz)}</div>
        <div style="background:var(--bg-tertiary); padding:10px; border-radius:4px; text-align:center;">Garantias USD: ${formatarMoeda(estadoJogo.garantiasUsd, 'USD')}</div>
      </div>
      
      <div style="margin-top:20px;">
        <h4>Histórico de Câmbio</h4>
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Operação</th>
                <th>Quantidade</th>
                <th>Taxa</th>
                <th>Valor Kz</th>
              </tr>
            </thead>
            <tbody>
              ${gerarHistoricoCambio()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('financeiro-conteudo').innerHTML = html;
  
  document.getElementById('quantidade-usd-comprar').addEventListener('input', function() {
    const qtd = parseFloat(this.value) || 0;
    document.getElementById('total-pagar-comprar').textContent = formatarMoeda(qtd * taxaCambio);
  });
  
  document.getElementById('quantidade-usd-vender').addEventListener('input', function() {
    const qtd = parseFloat(this.value) || 0;
    document.getElementById('total-receber-vender').textContent = formatarMoeda(qtd * taxaCambio);
  });
}

function gerarHistoricoCambio() {
  const historico = historicoTransacoes.filter(t => t.tipo === 'cambio').slice(0, 10);
  
  if (historico.length === 0) {
    return '<tr><td colspan="5" style="text-align: center;">Nenhuma operação de câmbio</td></tr>';
  }
  
  return historico.map(op => `
    <tr>
      <td>${op.data}</td>
      <td>${op.operacao === 'entrada' ? 'Venda USD' : 'Compra USD'}</td>
      <td>${op.descricao.split(' ')[2] || '-'}</td>
      <td>${formatarMoeda(taxaCambio)}</td>
      <td>${op.operacao === 'entrada' ? '+' : '-'}${formatarMoeda(op.valor)}</td>
    </tr>
  `).join('');
}

function comprarUSD() {
  const quantidade = parseFloat(document.getElementById('quantidade-usd-comprar').value);
  
  if (!quantidade || quantidade <= 0) {
    notificar('Quantidade inválida');
    return;
  }
  
  const custoKz = quantidade * taxaCambio;
  
  if (estadoJogo.carteiraKz < custoKz) {
    notificar('Saldo insuficiente em Kz');
    return;
  }
  
  estadoJogo.carteiraKz -= custoKz;
  estadoJogo.carteiraUsd += quantidade;
  
  registrarTransacao('cambio', 'saida', custoKz, 'Kz', `Compra de ${quantidade} USD`);
  notificar(`Compra de ${quantidade} USD realizada!`);
  salvarEstadoSimulacao();
  mostrarCambio();
  atualizarCarteiras();
}

function venderUSD() {
  const quantidade = parseFloat(document.getElementById('quantidade-usd-vender').value);
  
  if (!quantidade || quantidade <= 0) {
    notificar('Quantidade inválida');
    return;
  }
  
  if (estadoJogo.carteiraUsd < quantidade) {
    notificar('Saldo insuficiente em USD');
    return;
  }
  
  const valorKz = quantidade * taxaCambio;
  
  estadoJogo.carteiraUsd -= quantidade;
  estadoJogo.carteiraKz += valorKz;
  
  registrarTransacao('cambio', 'entrada', valorKz, 'Kz', `Venda de ${quantidade} USD`);
  notificar(`Venda de ${quantidade} USD realizada!`);
  salvarEstadoSimulacao();
  mostrarCambio();
  atualizarCarteiras();
}

function atualizarTaxaCambio() {
  const variacao = (Math.random() * 40) - 20;
  const fator = 1 + (variacao / 100);
  taxaCambio = Math.round(taxaCambio * fator);
  
  if (taxaCambio < 500) taxaCambio = 500;
  if (taxaCambio > 3000) taxaCambio = 3000;
  
  registrarTransacao('cambio', 'info', taxaCambio, 'Kz', `Taxa de câmbio atualizada para ${taxaCambio}`);
}

// ============================================
// MÓDULO INVESTIMENTOS
// ============================================

function mostrarInvestimentos() {
  const html = `
    <div class="investimentos-container">
      <h2>📈 Investimentos</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px; flex-wrap:wrap;">
        <button style="padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarAcoes()">Ações</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarPropriedades()">Propriedades</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarDepositos()">Depósitos Kz</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarTitulos()">Títulos Kz</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarDepositosInternacionais()">Depósitos USD</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarTitulosInternacionais()">Títulos USD</button>
      </div>
      
      <div id="investimentos-conteudo">
        ${gerarAcoesHTML()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  iniciarAtualizacaoAcoes();
}

function gerarAcoesHTML() {
  let html = '<div class="acoes-container">';
  
  html += '<h3>🇦🇴 Ações Angolanas (Kz)</h3>';
  html += '<div class="tabela-container">';
  html += '<table>';
  html += '<thead><tr><th>Ação</th><th>Preço Atual</th><th>Variação</th><th>Quantidade</th><th>Mínimo</th><th>Ações</th></tr></thead>';
  html += '<tbody>';
  
  for (let acaoId in investimentos.acoes) {
    const acao = investimentos.acoes[acaoId];
    if (acao.moeda === 'Kz') {
      const variacao = ((acao.precoAtual - acao.precoBase) / acao.precoBase * 100).toFixed(2);
      const classeVariacao = variacao >= 0 ? 'preco-positivo' : 'preco-negativo';
      
      html += `
        <tr>
          <td><strong>${acao.nome}</strong></td>
          <td style="color:${variacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(acao.precoAtual)} Kz</td>
          <td style="color:${variacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${variacao}%</td>
          <td>${acao.quantidade}</td>
          <td>${acao.minimo}</td>
          <td>
            <button onclick="comprarAcao('${acaoId}')" style="padding:5px 10px; background:var(--accent-green); color:#fff; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
            ${acao.quantidade > 0 ? `<button onclick="venderAcao('${acaoId}')" style="padding:5px 10px; background:var(--accent-red); color:#fff; border:none; border-radius:4px; cursor:pointer;">Vender</button>` : ''}
          </td>
        </tr>
      `;
    }
  }
  
  html += '</tbody></table></div>';
  
  html += '<h3 style="margin-top: 30px;">🌍 Ações Internacionais (USD)</h3>';
  html += '<div class="tabela-container">';
  html += '<table>';
  html += '<thead><tr><th>Ação</th><th>Preço Atual</th><th>Variação</th><th>Quantidade</th><th>Mínimo</th><th>Ações</th></tr></thead>';
  html += '<tbody>';
  
  for (let acaoId in investimentos.acoes) {
    const acao = investimentos.acoes[acaoId];
    if (acao.moeda === 'USD') {
      const variacao = ((acao.precoAtual - acao.precoBase) / acao.precoBase * 100).toFixed(2);
      const classeVariacao = variacao >= 0 ? 'preco-positivo' : 'preco-negativo';
      
      html += `
        <tr>
          <td><strong>${acao.nome}</strong></td>
          <td style="color:${variacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">USD ${formatarMoeda(acao.precoAtual, 'USD')}</td>
          <td style="color:${variacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${variacao}%</td>
          <td>${acao.quantidade}</td>
          <td>${acao.minimo}</td>
          <td>
            <button onclick="comprarAcao('${acaoId}')" style="padding:5px 10px; background:var(--accent-green); color:#fff; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
            ${acao.quantidade > 0 ? `<button onclick="venderAcao('${acaoId}')" style="padding:5px 10px; background:var(--accent-red); color:#fff; border:none; border-radius:4px; cursor:pointer;">Vender</button>` : ''}
          </td>
        </tr>
      `;
    }
  }
  
  html += '</tbody></table></div>';
  html += '</div>';
  
  return html;
}

function iniciarAtualizacaoAcoes() {
  setInterval(() => {
    for (let acaoId in investimentos.acoes) {
      const acao = investimentos.acoes[acaoId];
      
      let variacao;
      if (acao.moeda === 'Kz') {
        variacao = (Math.random() * 1100) - 100;
      } else {
        variacao = (Math.random() * 1040) - 40;
      }
      
      const fator = 1 + (variacao / 100);
      acao.precoAtual = Math.round(acao.precoBase * fator);
      
      if (acao.precoAtual < 1) acao.precoAtual = 1;
    }
    
    if (document.getElementById('investimentos-conteudo') && 
        document.querySelector('.tab-btn.active')?.textContent.includes('Ações')) {
      mostrarAcoes();
    }
  }, 10000);
}

function comprarAcao(acaoId) {
  const acao = investimentos.acoes[acaoId];
  const quantidade = parseInt(prompt(`Quantas ações ${acao.nome} deseja comprar? (mín. ${acao.minimo})`));
  
  if (!quantidade || quantidade < acao.minimo) {
    notificar(`Quantidade mínima é ${acao.minimo}`);
    return;
  }
  
  const custoTotal = acao.precoAtual * quantidade;
  
  if (acao.moeda === 'Kz') {
    if (estadoJogo.carteiraKz < custoTotal) {
      notificar('Saldo insuficiente em Kz');
      return;
    }
    estadoJogo.carteiraKz -= custoTotal;
  } else {
    if (estadoJogo.carteiraUsd < custoTotal) {
      notificar('Saldo insuficiente em USD');
      return;
    }
    estadoJogo.carteiraUsd -= custoTotal;
  }
  
  acao.quantidade += quantidade;
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'ação',
    nome: acao.nome,
    operacao: 'compra',
    quantidade,
    preco: acao.precoAtual,
    total: custoTotal
  });
  
  registrarTransacao('investimento', 'saida', custoTotal, acao.moeda, `Compra de ${quantidade} ações ${acao.nome}`);
  notificar(`Compra de ${quantidade} ações ${acao.nome} realizada!`);
  salvarEstadoSimulacao();
  mostrarAcoes();
  atualizarCarteiras();
}

function venderAcao(acaoId) {
  const acao = investimentos.acoes[acaoId];
  const quantidade = parseInt(prompt(`Quantas ações ${acao.nome} deseja vender? (máx. ${acao.quantidade})`));
  
  if (!quantidade || quantidade <= 0 || quantidade > acao.quantidade) {
    notificar('Quantidade inválida');
    return;
  }
  
  const valorTotal = acao.precoAtual * quantidade;
  let valorLiquido = valorTotal;
  let taxasDetalhes = '';
  
  if (acao.moeda === 'Kz') {
    const iac = valorTotal * 0.10;
    const curetagem = valorTotal * 0.0014;
    const cevama = valorTotal * 0.001;
    const bodiva = valorTotal * 0.002;
    
    valorLiquido = valorTotal - iac - curetagem - cevama - bodiva;
    taxasDetalhes = ` (IAC: ${formatarMoeda(iac)}, Curetagem: ${formatarMoeda(curetagem)}, CEVAMA: ${formatarMoeda(cevama)}, BODIVA: ${formatarMoeda(bodiva)})`;
    
    estadoJogo.carteiraKz += valorLiquido;
  } else {
    estadoJogo.carteiraUsd += valorTotal;
  }
  
  acao.quantidade -= quantidade;
  
  const lucroPrejuizo = valorTotal - (acao.precoBase * quantidade);
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'ação',
    nome: acao.nome,
    operacao: 'venda',
    quantidade,
    preco: acao.precoAtual,
    total: valorTotal,
    liquido: valorLiquido,
    lucroPrejuizo,
    taxas: taxasDetalhes
  });
  
  registrarTransacao('investimento', 'entrada', valorLiquido, acao.moeda, `Venda de ${quantidade} ações ${acao.nome}${taxasDetalhes}`);
  notificar(`Venda de ${quantidade} ações ${acao.nome} realizada!`);
  salvarEstadoSimulacao();
  mostrarAcoes();
  atualizarCarteiras();
}

function mostrarAcoes() {
  document.getElementById('investimentos-conteudo').innerHTML = gerarAcoesHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarPropriedades() {
  const html = `
    <div class="propriedades-container">
      <h3>🏢 Propriedades Angola (Kz)</h3>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo A</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoA)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-a" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'A')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo B</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoB)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-b" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'B')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo C</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoC)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-c" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'C')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">🌍 Propriedades Internacionais (USD)</h3>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo A</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoA, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-a" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'A')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo B</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoB, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-b" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'B')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>Tipo C</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoC, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-c" min="1" value="1" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'C')" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">📋 Propriedades Adquiridas</h3>
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Preço Médio</th>
              <th>Total Investido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${gerarPropriedadesAdquiridas()}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  document.getElementById('investimentos-conteudo').innerHTML = html;
}

function gerarPropriedadesAdquiridas() {
  const adquiridas = investimentos.historico.filter(h => h.tipo === 'propriedade' && h.operacao === 'compra');
  
  if (adquiridas.length === 0) {
    return '<tr><td colspan="5" style="text-align: center;">Nenhuma propriedade adquirida</td></tr>';
  }
  
  const grouped = {};
  adquiridas.forEach(p => {
    const key = `${p.local}_${p.tipo}`;
    if (!grouped[key]) {
      grouped[key] = { local: p.local, tipo: p.tipo, quantidade: 0, total: 0 };
    }
    grouped[key].quantidade += p.quantidade;
    grouped[key].total += p.total;
  });
  
  return Object.values(grouped).map(g => `
    <tr>
      <td>${g.local === 'angola' ? '🇦🇴' : '🌍'} Tipo ${g.tipo}</td>
      <td>${g.quantidade}</td>
      <td>${formatarMoeda(g.total / g.quantidade)} ${g.local === 'angola' ? 'Kz' : 'USD'}</td>
      <td>${formatarMoeda(g.total)} ${g.local === 'angola' ? 'Kz' : 'USD'}</td>
      <td>
        <button onclick="venderPropriedade('${g.local}', '${g.tipo}', ${g.quantidade})" style="padding:5px 10px; background:var(--accent-red); color:#fff; border:none; border-radius:4px; cursor:pointer;">Vender Tudo</button>
      </td>
    </tr>
  `).join('');
}

function comprarPropriedade(local, tipo) {
  let preco, moeda, quantidade;
  
  if (local === 'angola') {
    preco = investimentos.propriedades.angola[`tipo${tipo}`];
    moeda = 'Kz';
    quantidade = parseInt(document.getElementById(`qtd-propriedade-${tipo.toLowerCase()}`).value);
    
    if (estadoJogo.carteiraKz < preco * quantidade) {
      notificar('Saldo insuficiente');
      return;
    }
    
    estadoJogo.carteiraKz -= preco * quantidade;
  } else {
    preco = investimentos.propriedades.internacional[`tipo${tipo}`];
    moeda = 'USD';
    quantidade = parseInt(document.getElementById(`qtd-propriedade-int-${tipo.toLowerCase()}`).value);
    
    if (estadoJogo.carteiraUsd < preco * quantidade) {
      notificar('Saldo insuficiente');
      return;
    }
    
    estadoJogo.carteiraUsd -= preco * quantidade;
  }
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'propriedade',
    local,
    tipo,
    operacao: 'compra',
    quantidade,
    precoUnitario: preco,
    total: preco * quantidade
  });
  
  registrarTransacao('investimento', 'saida', preco * quantidade, moeda, `Compra de ${quantidade} propriedade(s) Tipo ${tipo} ${local === 'angola' ? '🇦🇴' : '🌍'}`);
  notificar(`Compra de propriedade(s) realizada!`);
  salvarEstadoSimulacao();
  mostrarPropriedades();
  atualizarCarteiras();
}

function venderPropriedade(local, tipo, quantidade) {
  if (!confirm(`Confirmar venda de ${quantidade} propriedade(s) Tipo ${tipo}?`)) return;
  
  let precoAtual;
  let moeda;
  
  if (local === 'angola') {
    precoAtual = investimentos.propriedades.angola[`tipo${tipo}`];
    moeda = 'Kz';
    
    const valorTotal = precoAtual * quantidade;
    const escritura = valorTotal * 0.015;
    const comissao = valorTotal * 0.05;
    const valorLiquido = valorTotal - escritura - comissao;
    
    estadoJogo.carteiraKz += valorLiquido;
    
    investimentos.historico.push({
      data: dataSimulador.toLocaleDateString(),
      tipo: 'propriedade',
      local,
      tipo,
      operacao: 'venda',
      quantidade,
      precoUnitario: precoAtual,
      total: valorTotal,
      liquido: valorLiquido,
      taxas: `Escritura: ${formatarMoeda(escritura)}, Comissão: ${formatarMoeda(comissao)}`
    });
    
    registrarTransacao('investimento', 'entrada', valorLiquido, moeda, 
      `Venda de ${quantidade} propriedade(s) Tipo ${tipo} (líquido após taxas)`);
    
    notificar(`Venda realizada! Líquido: ${formatarMoeda(valorLiquido)} Kz`);
  } else {
    precoAtual = investimentos.propriedades.internacional[`tipo${tipo}`];
    moeda = 'USD';
    const valorTotal = precoAtual * quantidade;
    
    estadoJogo.carteiraUsd += valorTotal;
    
    investimentos.historico.push({
      data: dataSimulador.toLocaleDateString(),
      tipo: 'propriedade',
      local,
      tipo,
      operacao: 'venda',
      quantidade,
      precoUnitario: precoAtual,
      total: valorTotal
    });
    
    registrarTransacao('investimento', 'entrada', valorTotal, moeda, 
      `Venda de ${quantidade} propriedade(s) internacionais Tipo ${tipo}`);
    
    notificar(`Venda realizada! Total: ${formatarMoeda(valorTotal, 'USD')} USD`);
  }
  
  salvarEstadoSimulacao();
  mostrarPropriedades();
  atualizarCarteiras();
}

function atualizarPrecosPropriedades() {
  for (let tipo in investimentos.propriedades.angola) {
    const variacao = (Math.random() * 280) - 80;
    const fator = 1 + (variacao / 100);
    investimentos.propriedades.angola[tipo] = Math.round(investimentos.propriedades.angola[tipo] * fator);
  }
  
  for (let tipo in investimentos.propriedades.internacional) {
    const variacao = (Math.random() * 280) - 80;
    const fator = 1 + (variacao / 100);
    investimentos.propriedades.internacional[tipo] = Math.round(investimentos.propriedades.internacional[tipo] * fator);
  }
}

function mostrarDepositos() {
  const html = `
    <div class="depositos-container">
      <h3>🏦 Depósitos a Prazo (Kz)</h3>
      
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; margin-bottom:20px;">
        <p>💰 Taxa de juro: 8% ao ano (0.67% ao mês)</p>
        <p>⏱️ Prazo mínimo: 3 meses</p>
        <p>⚠️ Resgate antecipado: perde 50% dos juros</p>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>3 Meses</h4>
          <p>Taxa: 2% (total)</p>
          <input type="number" id="valor-deposito-3m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);">Rendimento: <span id="rendimento-3m">0</span> Kz</p>
          <button onclick="criarDeposito(3)" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">📥 Aplicar</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>6 Meses</h4>
          <p>Taxa: 4% (total)</p>
          <input type="number" id="valor-deposito-6m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);">Rendimento: <span id="rendimento-6m">0</span> Kz</p>
          <button onclick="criarDeposito(6)" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">📥 Aplicar</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>12 Meses</h4>
          <p>Taxa: 8% (total)</p>
          <input type="number" id="valor-deposito-12m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
          <p style="color:var(--accent-gold);">Rendimento: <span id="rendimento-12m">0</span> Kz</p>
          <button onclick="criarDeposito(12)" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">📥 Aplicar</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">📋 Depósitos Ativos</h3>
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Valor</th>
              <th>Prazo</th>
              <th>Rendimento</th>
              <th>Data Aplicação</th>
              <th>Data Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${gerarDepositosAtivos()}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  document.getElementById('investimentos-conteudo').innerHTML = html;
  
  document.getElementById('valor-deposito-3m')?.addEventListener('input', () => calcularRendimentoDeposito(3));
  document.getElementById('valor-deposito-6m')?.addEventListener('input', () => calcularRendimentoDeposito(6));
  document.getElementById('valor-deposito-12m')?.addEventListener('input', () => calcularRendimentoDeposito(12));
}

function calcularRendimentoDeposito(meses) {
  const input = document.getElementById(`valor-deposito-${meses}m`);
  const valor = parseFloat(input?.value) || 0;
  const rendSpan = document.getElementById(`rendimento-${meses}m`);
  
  if (valor < 100000) {
    rendSpan.textContent = '0';
    return;
  }
  
  let taxa = 0;
  if (meses === 3) taxa = 0.02;
  else if (meses === 6) taxa = 0.04;
  else if (meses === 12) taxa = 0.08;
  
  const rendimento = valor * taxa;
  rendSpan.textContent = formatarMoeda(rendimento);
}

function criarDeposito(meses) {
  const input = document.getElementById(`valor-deposito-${meses}m`);
  const valor = parseFloat(input?.value);
  
  if (!valor || valor < 100000) {
    notificar('❌ Valor mínimo: 100.000 Kz');
    return;
  }
  
  if (estadoJogo.carteiraKz < valor) {
    notificar('❌ Saldo insuficiente');
    return;
  }
  
  let taxa = 0;
  if (meses === 3) taxa = 0.02;
  else if (meses === 6) taxa = 0.04;
  else if (meses === 12) taxa = 0.08;
  
  const rendimento = valor * taxa;
  const dataVencimento = new Date(dataSimulador);
  dataVencimento.setMonth(dataVencimento.getMonth() + meses);
  
  const deposito = {
    id: Date.now(),
    valor: valor,
    prazoMeses: meses,
    taxa: taxa,
    rendimento: rendimento,
    dataAplicacao: dataSimulador.toLocaleDateString(),
    dataVencimento: dataVencimento.toLocaleDateString(),
    status: 'ativo'
  };
  
  estadoJogo.carteiraKz -= valor;
  depositosPrazo.push(deposito);
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'deposito',
    operacao: 'aplicacao',
    valor,
    prazo: meses,
    rendimento
  });
  
  registrarTransacao('deposito', 'saida', valor, 'Kz', `Depósito a prazo de ${formatarMoeda(valor)} Kz (${meses} meses)`);
  notificar(`✅ Depósito de ${formatarMoeda(valor)} Kz realizado! Vencimento: ${deposito.dataVencimento}`);
  salvarEstadoSimulacao();
  mostrarDepositos();
  atualizarCarteiras();
}

function gerarDepositosAtivos() {
  if (depositosPrazo.length === 0) {
    return '<tr><td colspan="7" style="text-align: center;">Nenhum depósito ativo</td></tr>';
  }
  
  return depositosPrazo.filter(d => d.status === 'ativo').map(d => {
    const diasRestantes = calcularDiasRestantes(d.dataVencimento);
    
    return `
      <tr>
        <td>${formatarMoeda(d.valor)} Kz</td>
        <td>${d.prazoMeses} meses</td>
        <td style="color:var(--accent-green);">+${formatarMoeda(d.rendimento)} Kz</td>
        <td>${d.dataAplicacao}</td>
        <td>${d.dataVencimento}</td>
        <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
        <td>
          ${diasRestantes <= 0 ? 
            `<button onclick="resgatarDeposito(${d.id})" style="padding:5px 10px; background:var(--accent-green); color:#fff; border:none; border-radius:4px; cursor:pointer;">Resgatar</button>` : 
            `<button onclick="resgatarDepositoAntecipado(${d.id})" style="padding:5px 10px; background:var(--accent-red); color:#fff; border:none; border-radius:4px; cursor:pointer;">Resgatar (multa)</button>`}
        </td>
      </tr>
    `;
  }).join('');
}

function resgatarDeposito(id) {
  const deposito = depositosPrazo.find(d => d.id === id);
  if (!deposito) return;
  
  const valorTotal = deposito.valor + deposito.rendimento;
  estadoJogo.carteiraKz += valorTotal;
  deposito.status = 'resgatado';
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'deposito',
    operacao: 'resgate',
    valor: deposito.valor,
    rendimento: deposito.rendimento,
    total: valorTotal
  });
  
  registrarTransacao('deposito', 'entrada', valorTotal, 'Kz', `Resgate de depósito + rendimentos`);
  notificar(`💰 Depósito resgatado: ${formatarMoeda(valorTotal)} Kz`);
  salvarEstadoSimulacao();
  mostrarDepositos();
  atualizarCarteiras();
}

function resgatarDepositoAntecipado(id) {
  const deposito = depositosPrazo.find(d => d.id === id);
  if (!deposito) return;
  
  if (!confirm('Resgate antecipado perde 50% dos juros. Confirmar?')) return;
  
  const rendimentoReduzido = deposito.rendimento * 0.5;
  const valorTotal = deposito.valor + rendimentoReduzido;
  
  estadoJogo.carteiraKz += valorTotal;
  deposito.status = 'resgatado_antecipado';
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'deposito',
    operacao: 'resgate_antecipado',
    valor: deposito.valor,
    rendimento: rendimentoReduzido,
    total: valorTotal
  });
  
  registrarTransacao('deposito', 'entrada', valorTotal, 'Kz', `Resgate antecipado de depósito (com multa)`);
  notificar(`💰 Depósito resgatado antecipadamente: ${formatarMoeda(valorTotal)} Kz`);
  salvarEstadoSimulacao();
  mostrarDepositos();
  atualizarCarteiras();
}

function mostrarTitulos() {
  const titulosDisponiveis = [
    { id: 'ot-1ano', nome: 'Obrigações do Tesouro 1 ano', prazo: 12, taxa: 0.12, minimo: 1000000 },
    { id: 'ot-3anos', nome: 'Obrigações do Tesouro 3 anos', prazo: 36, taxa: 0.15, minimo: 5000000 },
    { id: 'bt-6meses', nome: 'Bilhetes do Tesouro 6 meses', prazo: 6, taxa: 0.09, minimo: 500000 }
  ];
  
  const html = `
    <div class="titulos-container">
      <h3>📜 Títulos Públicos (Kz)</h3>
      
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; margin-bottom:20px;">
        <p>🏛️ Emitidos pelo Banco Nacional de Angola</p>
        <p>💰 IAC de 10% sobre juros + taxas</p>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        ${titulosDisponiveis.map(t => `
          <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
            <h4>${t.nome}</h4>
            <p>Prazo: ${t.prazo} meses</p>
            <p>Taxa: ${(t.taxa * 100).toFixed(1)}% ao ano</p>
            <p>Mínimo: ${formatarMoeda(t.minimo)} Kz</p>
            
            <input type="number" id="valor-titulo-${t.id}" 
                   min="${t.minimo}" step="100000" 
                   placeholder="Valor" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            
            <p style="color:var(--accent-gold);">Rendimento bruto: <span id="rendimento-${t.id}">0</span> Kz</p>
            <p style="color:var(--accent-gold);">Rendimento líquido: <span id="liquido-${t.id}">0</span> Kz</p>
            
            <button onclick="comprarTitulo('${t.id}', ${t.taxa}, ${t.prazo}, ${t.minimo})" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">
              📥 Comprar
            </button>
          </div>
        `).join('')}
      </div>
      
      <h3 style="margin-top: 30px;">📋 Títulos em Carteira</h3>
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Valor</th>
              <th>Prazo</th>
              <th>Rendimento Bruto</th>
              <th>Rendimento Líquido</th>
              <th>Data Compra</th>
              <th>Data Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${gerarTitulosAtivos()}
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  document.getElementById('investimentos-conteudo').innerHTML = html;
  
  titulosDisponiveis.forEach(t => {
    document.getElementById(`valor-titulo-${t.id}`)?.addEventListener('input', 
      () => calcularRendimentoTitulo(t.id, t.taxa, t.prazo));
  });
}

function calcularRendimentoTitulo(tituloId, taxaAnual, prazoMeses) {
  const input = document.getElementById(`valor-titulo-${tituloId}`);
  const valor = parseFloat(input?.value) || 0;
  const rendSpan = document.getElementById(`rendimento-${tituloId}`);
  const liqSpan = document.getElementById(`liquido-${tituloId}`);
  
  if (valor < 100000) {
    rendSpan.textContent = '0';
    liqSpan.textContent = '0';
    return;
  }
  
  const rendimentoBruto = valor * taxaAnual * (prazoMeses / 12);
  const iac = rendimentoBruto * 0.10;
  const curetagem = valor * 0.0014;
  const cevama = valor * 0.001;
  const bodiva = valor * 0.002;
  const rendimentoLiquido = rendimentoBruto - iac - curetagem - cevama - bodiva;
  
  rendSpan.textContent = formatarMoeda(rendimentoBruto);
  liqSpan.textContent = formatarMoeda(rendimentoLiquido);
}

function comprarTitulo(tituloId, taxaAnual, prazoMeses, minimo) {
  const input = document.getElementById(`valor-titulo-${tituloId}`);
  const valor = parseFloat(input?.value);
  
  if (!valor || valor < minimo) {
    notificar(`❌ Valor mínimo: ${formatarMoeda(minimo)} Kz`);
    return;
  }
  
  if (estadoJogo.carteiraKz < valor) {
    notificar('❌ Saldo insuficiente');
    return;
  }
  
  const rendimentoBruto = valor * taxaAnual * (prazoMeses / 12);
  const iac = rendimentoBruto * 0.10;
  const curetagem = valor * 0.0014;
  const cevama = valor * 0.001;
  const bodiva = valor * 0.002;
  const rendimentoLiquido = rendimentoBruto - iac - curetagem - cevama - bodiva;
  
  const dataVencimento = new Date(dataSimulador);
  dataVencimento.setMonth(dataVencimento.getMonth() + prazoMeses);
  
  const titulo = {
    id: Date.now(),
    tituloId: tituloId,
    nome: tituloId === 'ot-1ano' ? 'OT 1 ano' : 
          tituloId === 'ot-3anos' ? 'OT 3 anos' : 'BT 6 meses',
    valor: valor,
    prazoMeses: prazoMeses,
    taxaAnual: taxaAnual,
    rendimentoBruto: rendimentoBruto,
    rendimentoLiquido: rendimentoLiquido,
    iac, curetagem, cevama, bodiva,
    dataCompra: dataSimulador.toLocaleDateString(),
    dataVencimento: dataVencimento.toLocaleDateString(),
    status: 'ativo'
  };
  
  estadoJogo.carteiraKz -= valor;
  titulosPublicos.push(titulo);
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'titulo',
    operacao: 'compra',
    valor,
    prazo: prazoMeses,
    rendimentoBruto,
    rendimentoLiquido,
    taxas: { iac, curetagem, cevama, bodiva }
  });
  
  registrarTransacao('titulo', 'saida', valor, 'Kz', `Compra de ${titulo.nome} - ${formatarMoeda(valor)} Kz`);
  notificar(`✅ Título adquirido! Vencimento: ${titulo.dataVencimento}`);
  salvarEstadoSimulacao();
  mostrarTitulos();
  atualizarCarteiras();
}

function gerarTitulosAtivos() {
  const ativos = titulosPublicos.filter(t => t.status === 'ativo');
  
  if (ativos.length === 0) {
    return '<tr><td colspan="9" style="text-align: center;">Nenhum título em carteira</td></tr>';
  }
  
  return ativos.map(t => {
    const diasRestantes = calcularDiasRestantes(t.dataVencimento);
    
    return `
      <tr>
        <td>${t.nome}</td>
        <td>${formatarMoeda(t.valor)} Kz</td>
        <td>${t.prazoMeses} meses</td>
        <td style="color:var(--accent-green);">+${formatarMoeda(t.rendimentoBruto)} Kz</td>
        <td style="color:var(--accent-green);">+${formatarMoeda(t.rendimentoLiquido)} Kz</td>
        <td>${t.dataCompra}</td>
        <td>${t.dataVencimento}</td>
        <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
        <td>
          ${diasRestantes <= 0 ? 
            `<button onclick="resgatarTitulo(${t.id})" style="padding:5px 10px; background:var(--accent-green); color:#fff; border:none; border-radius:4px; cursor:pointer;">Resgatar</button>` : 
            '⏳ Aguardar'}
        </td>
      </tr>
    `;
  }).join('');
}

function resgatarTitulo(id) {
  const titulo = titulosPublicos.find(t => t.id === id);
  if (!titulo) return;
  
  const valorTotal = titulo.valor + titulo.rendimentoLiquido;
  estadoJogo.carteiraKz += valorTotal;
  titulo.status = 'resgatado';
  
  investimentos.historico.push({
    data: dataSimulador.toLocaleDateString(),
    tipo: 'titulo',
    operacao: 'resgate',
    valor: titulo.valor,
    rendimento: titulo.rendimentoLiquido,
    total: valorTotal
  });
  
  registrarTransacao('titulo', 'entrada', valorTotal, 'Kz', `Resgate de título + rendimentos líquidos`);
  notificar(`💰 Título resgatado: ${formatarMoeda(valorTotal)} Kz`);
  salvarEstadoSimulacao();
  mostrarTitulos();
  atualizarCarteiras();
}

function mostrarHistoricoInvestimentos() {
  const html = `
    <div class="historico-investimentos">
      <h3>📊 Histórico de Investimentos</h3>
      
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Operação</th>
              <th>Detalhes</th>
              <th>Quantidade</th>
              <th>Preço</th>
              <th>Total</th>
              <th>Líquido</th>
            </tr>
          </thead>
          <tbody>
            ${gerarHistoricoInvestimentos()}
          </tbody>
        </table>
      </div>
      
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-top:20px;">
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
          <h4>Total Investido</h4>
          <span style="color:var(--accent-gold);">${calcularTotalInvestido()}</span>
        </div>
        <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
          <h4>Total em Ações</h4>
          <span style="color:var(--accent-gold);">${calcularTotalAcoes()}</span>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('financeiro-conteudo').innerHTML = html;
}

function gerarHistoricoInvestimentos() {
  if (investimentos.historico.length === 0) {
    return '<tr><td colspan="8" style="text-align: center;">Nenhum investimento realizado</td></tr>';
  }
  
  return investimentos.historico.slice(-20).reverse().map(h => `
    <tr>
      <td>${h.data}</td>
      <td>${h.tipo}</td>
      <td>${h.operacao}</td>
      <td>${h.nome || `${h.local || ''} ${h.tipo || ''}`}</td>
      <td>${h.quantidade || '-'}</td>
      <td>${h.preco ? formatarMoeda(h.preco) + (h.tipo === 'ação' && h.moeda ? ' ' + h.moeda : ' Kz') : '-'}</td>
      <td>${h.total ? formatarMoeda(h.total) + (h.tipo === 'ação' && h.moeda === 'USD' ? ' USD' : ' Kz') : '-'}</td>
      <td>${h.liquido ? formatarMoeda(h.liquido) + (h.moeda === 'USD' ? ' USD' : ' Kz') : '-'}</td>
    </tr>
  `).join('');
}

function calcularTotalInvestido() {
  let total = 0;
  
  for (let acao in investimentos.acoes) {
    total += investimentos.acoes[acao].quantidade * investimentos.acoes[acao].precoAtual;
  }
  
  depositosPrazo.forEach(d => {
    if (d.status === 'ativo') total += d.valor;
  });
  
  titulosPublicos.forEach(t => {
    if (t.status === 'ativo') total += t.valor;
  });
  
  return formatarMoeda(total) + ' Kz';
}

function calcularTotalAcoes() {
  let total = 0;
  
  for (let acao in investimentos.acoes) {
    if (investimentos.acoes[acao].moeda === 'Kz') {
      total += investimentos.acoes[acao].quantidade * investimentos.acoes[acao].precoAtual;
    }
  }
  
  return formatarMoeda(total) + ' Kz';
}

// ============================================
// MÓDULO ESTRATÉGIA
// ============================================

function mostrarEstrategia() {
  const condicoes = verificarCondicoesExpansao();
  const licencaAtiva = estadoJogo.licencaExportacao && 
                       calcularDiasRestantes(estadoJogo.licencaExpiracao) > 0;
  
  let html = `
    <div class="estrategia-container">
      <h2>🎯 Estratégia Empresarial</h2>
      
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>🤝 Parcerias Estratégicas</h3>
          <div style="margin:10px 0;">
            <p style="color:${clientes.nacionais + clientes.estrangeiros >= 350000 ? 'var(--accent-green)' : 'var(--accent-red)'};">Tipo A: 350k clientes - +50M Kz/trimestre</p>
            <p style="color:${clientes.nacionais + clientes.estrangeiros >= 20000 ? 'var(--accent-green)' : 'var(--accent-red)'};">Tipo B: 20k clientes - +20M Kz/trimestre</p>
            <p style="color:${clientes.nacionais + clientes.estrangeiros >= 2000 ? 'var(--accent-green)' : 'var(--accent-red)'};">Tipo C: 2k clientes - +10M Kz/trimestre</p>
            <p style="color:${clientes.nacionais + clientes.estrangeiros >= 500 ? 'var(--accent-green)' : 'var(--accent-red)'};">Tipo D: 500 clientes - +2M Kz/trimestre</p>
          </div>
          <select id="tipo-parceiro" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            <option value="A">Tipo A (350k clientes)</option>
            <option value="B">Tipo B (20k clientes)</option>
            <option value="C">Tipo C (2k clientes)</option>
            <option value="D">Tipo D (500 clientes)</option>
          </select>
          <button onclick="fecharParceria()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Fechar Parceria</button>
          
          <div style="margin-top: 15px;">
            <h4>Parcerias Ativas</h4>
            ${gerarParceriasAtivas()}
          </div>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>📈 Expansão da Empresa</h3>
          <p style="color:${condicoes.saldo ? 'var(--accent-green)' : 'var(--accent-red)'};">✓ Saldo 3x inicial: ${condicoes.saldo ? '✅' : '❌'}</p>
          <p style="color:${condicoes.clientes ? 'var(--accent-green)' : 'var(--accent-red)'};">✓ Clientes 5x original: ${condicoes.clientes ? '✅' : '❌'}</p>
          <p style="color:${condicoes.reservaUSD ? 'var(--accent-green)' : 'var(--accent-red)'};">✓ Reserva USD ≥ 10.000: ${condicoes.reservaUSD ? '✅' : '❌'}</p>
          <p style="color:${condicoes.investimentos ? 'var(--accent-green)' : 'var(--accent-red)'};">✓ Tem investimentos: ${condicoes.investimentos ? '✅' : '❌'}</p>
          <p style="color:${condicoes.lucro ? 'var(--accent-green)' : 'var(--accent-red)'};">✓ Lucro acumulado ≥ 10M: ${condicoes.lucro ? '✅' : '❌'}</p>
          
          <button onclick="expandirEmpresa()" ${condicoes.todas ? '' : 'disabled'} style="width:100%; padding:10px; margin-top:15px; background:${condicoes.todas ? 'var(--accent-gold)' : 'var(--bg-tertiary)'}; color:#000; border:none; border-radius:4px; cursor:${condicoes.todas ? 'pointer' : 'not-allowed'};">
            Expandir Empresa (Nível ${estadoJogo.nivelExpansao}/3)
          </button>
          ${estadoJogo.nivelExpansao >= 3 ? '<p style="color:var(--accent-green);">✅ Expansão máxima atingida! Crescimento anual de 1%.</p>' : ''}
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>🌍 Exportação</h3>
          ${licencaAtiva ? 
            `<p style="color:var(--accent-green);">✅ Licença ativa até: ${estadoJogo.licencaExpiracao}</p>` :
            `<p style="color:var(--accent-red);">❌ Sem licença de exportação</p>
             <p>Custo: 10.000.000 Kz (válida 5 anos)</p>
             <button onclick="comprarLicencaExportacao()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Comprar Licença</button>`
          }
        </div>
      </div>
      
      ${contabilista.multa > 0 ? `
        <div style="margin-top:20px; background:var(--bg-secondary); padding:15px; border-radius:8px; border:2px solid var(--accent-red);">
          <h3 style="color:var(--accent-red);">⚠️ Multa AGT</h3>
          <p>Valor da multa: ${formatarMoeda(contabilista.multa)} Kz</p>
          ${!contabilista.multaParcelada ? 
            `<button onclick="negociarMulta()" style="padding:10px 20px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Negociar em 12 prestações</button>` :
            `<p>Parcelado: ${contabilista.parcelasRestantes}/12 prestações de ${formatarMoeda(contabilista.valorParcela)} Kz</p>`
          }
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  
  // Adicionar painel de negociação se houver multa não parcelada
  setTimeout(() => {
    const registoComMulta = historicoAnual.find(
      r => r.multaAplicada && !r.multaPaga && !r.multaParcelada
    );
    
    if (registoComMulta) {
      const container = document.getElementById('conteudoPrincipal');
      const painelMulta = document.createElement('div');
      painelMulta.style.cssText = `
        margin-top:20px;
        background:linear-gradient(145deg,#1a0505,#0a0000);
        border:2px solid var(--accent-red);
        border-radius:12px;padding:24px;
      `;
      painelMulta.innerHTML = `
        <h3 style="color:var(--accent-red);margin-bottom:15px;">
          ⚖️ Negociar Multa com a AGT
        </h3>
        <p style="color:var(--text-secondary);margin-bottom:8px;">
          Ano: ${registoComMulta.ano}
        </p>
        <p style="color:var(--accent-red);font-size:1.2rem;
                  font-weight:700;margin-bottom:8px;">
          Multa total: ${formatarMoeda(registoComMulta.multaValor)} Kz
        </p>
        <p style="color:var(--text-secondary);margin-bottom:20px;">
          Ao negociar, a multa será dividida em 12 prestações mensais
          de ${formatarMoeda(Math.round(registoComMulta.multaValor / 12))} Kz,
          pagas automaticamente no dia 1 de cada mês.
        </p>
        <div style="display:flex;gap:15px;flex-wrap:wrap;">
          <button onclick="negociarMultaAGT()"
                  style="flex:1;padding:14px;
                         background:var(--accent-gold);color:#000;
                         border:none;border-radius:8px;
                         font-weight:700;cursor:pointer;
                         min-width:180px;">
            🤝 Negociar em 12 Prestações
          </button>
          <button onclick="pagarMultaAGTVista()"
                  style="flex:1;padding:14px;
                         background:var(--accent-red);color:#fff;
                         border:none;border-radius:8px;
                         font-weight:700;cursor:pointer;
                         min-width:180px;">
            💳 Pagar à Vista (desconto 10%)
          </button>
        </div>
      `;
      container.appendChild(painelMulta);
    }
  }, 150);
}

function gerarParceriasAtivas() {
  if (parcerias.length === 0) {
    return '<p>Nenhuma parceria ativa</p>';
  }
  
  return parcerias.map(p => {
    const diasRestantes = calcularDiasRestantes(p.dataExpiracao);
    return `
      <div style="background:var(--bg-tertiary); padding:8px; margin:5px 0; border-radius:4px;">
        <p>🤝 Tipo ${p.tipo} - ${diasRestantes} dias restantes</p>
        <p>Próx. pagamento: ${p.proximoPagamento}</p>
      </div>
    `;
  }).join('');
}

function verificarCondicoesExpansao() {
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  const clientesIniciais = estadoJogo.clientesIniciais || 100;
  const lucroAcumulado = historicoMensal.slice(-12).reduce((sum, mes) => sum + (mes.lucro || 0), 0);
  
  const temInvestimentos = Object.values(investimentos.acoes).some(a => a.quantidade > 0) ||
                          depositosPrazo.length > 0 ||
                          titulosPublicos.length > 0;
  
  const condicoes = {
    saldo: estadoJogo.carteiraKz >= estadoJogo.saldoInicial * 3,
    clientes: totalClientes >= clientesIniciais * 5,
    reservaUSD: estadoJogo.carteiraUsd >= 10000,
    investimentos: temInvestimentos,
    lucro: lucroAcumulado >= 10000000
  };
  
  condicoes.todas = Object.values(condicoes).every(Boolean);
  return condicoes;
}

function fecharParceria() {
  const tipo = document.getElementById('tipo-parceiro').value;
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  
  const requisitos = { A: 350000, B: 20000, C: 2000, D: 500 };
  const valores = { A: 50000000, B: 20000000, C: 10000000, D: 2000000 };
  
  if (totalClientes < requisitos[tipo]) {
    notificar(`❌ Precisa de ${requisitos[tipo]} clientes para parceria Tipo ${tipo}`);
    return;
  }
  
  if (parcerias.some(p => p.tipo === tipo && p.ativa)) {
    notificar(`❌ Já tens uma parceria Tipo ${tipo} ativa`);
    return;
  }
  
  const dataExpiracao = new Date(dataSimulador);
  dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 1);
  
  const datasPagamento = [
    new Date(dataSimulador.getFullYear(), 2, 30), // 30 Mar
    new Date(dataSimulador.getFullYear(), 5, 30), // 30 Jun
    new Date(dataSimulador.getFullYear(), 8, 30), // 30 Set
    new Date(dataSimulador.getFullYear(), 11, 30) // 30 Dez
  ];
  
  const proximoPagamento = datasPagamento.find(d => d > dataSimulador) || 
                          new Date(dataSimulador.getFullYear() + 1, 2, 30);
  
  parcerias.push({
    tipo,
    valor: valores[tipo],
    dataInicio: dataSimulador.toLocaleDateString(),
    dataExpiracao: dataExpiracao.toLocaleDateString(),
    proximoPagamento: proximoPagamento.toLocaleDateString(),
    pagamentosRealizados: 0,
    ativa: true
  });
  
  notificar(`✅ Parceria Tipo ${tipo} fechada! Receberás ${formatarMoeda(valores[tipo])} Kz por trimestre`);
  salvarEstadoSimulacao();
  mostrarEstrategia();
}

function processarPagamentosParcerias() {
  const hoje = dataSimulador.toLocaleDateString();
  
  parcerias.forEach(p => {
    if (p.ativa && p.proximoPagamento === hoje) {
      estadoJogo.carteiraKz += p.valor;
      p.pagamentosRealizados++;
      
      const proximasDatas = [
        new Date(dataSimulador.getFullYear(), 2, 30),
        new Date(dataSimulador.getFullYear(), 5, 30),
        new Date(dataSimulador.getFullYear(), 8, 30),
        new Date(dataSimulador.getFullYear(), 11, 30)
      ];
      
      const proximo = proximasDatas.find(d => d > dataSimulador);
      if (proximo && p.pagamentosRealizados < 4) {
        p.proximoPagamento = proximo.toLocaleDateString();
      } else {
        p.ativa = false;
      }
      
      registrarTransacao('parceria', 'entrada', p.valor, 'Kz', `Pagamento de parceria Tipo ${p.tipo}`);
      notificar(`💰 Recebeste ${formatarMoeda(p.valor)} Kz da parceria Tipo ${p.tipo}`);
    }
  });
}

function expandirEmpresa() {
  const condicoes = verificarCondicoesExpansao();
  
  if (!condicoes.todas) {
    notificar('❌ Não tens condições para expandir');
    return;
  }
  
  if (estadoJogo.nivelExpansao >= 3) {
    notificar('❌ Já atingiste o nível máximo de expansão');
    return;
  }
  
  estadoJogo.nivelExpansao++;
  
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  let novosClientes = 0;
  
  if (estadoJogo.nivelExpansao === 1) {
    novosClientes = Math.floor(totalClientes * 0.05);
    notificar(`✅ Expansão nível 1! +5% clientes (${novosClientes})`);
  } else if (estadoJogo.nivelExpansao === 2) {
    novosClientes = Math.floor(totalClientes * 0.20);
    notificar(`✅ Expansão nível 2! +20% clientes (${novosClientes})`);
  } else if (estadoJogo.nivelExpansao === 3) {
    novosClientes = Math.floor(totalClientes * 0.50);
    notificar(`✅ Expansão nível 3! +50% clientes (${novosClientes})`);
  }
  
  clientes.nacionais += novosClientes;
  estadoJogo.saldoInicial *= 3;
  
  salvarEstadoSimulacao();
  mostrarEstrategia();
  atualizarDashboard();
}

function comprarLicencaExportacao() {
  const custo = 10000000;
  
  if (estadoJogo.carteiraKz < custo) {
    notificar('Saldo insuficiente');
    return;
  }
  
  estadoJogo.carteiraKz -= custo;
  
  const dataExpiracao = new Date(dataSimulador);
  dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 5);
  
  estadoJogo.licencaExportacao = true;
  estadoJogo.licencaExpiracao = dataExpiracao.toLocaleDateString();
  
  registrarTransacao('licenca', 'saida', custo, 'Kz', 'Licença de Exportação');
  notificar('✅ Licença de exportação adquirida! Válida por 5 anos');
  salvarEstadoSimulacao();
  mostrarEstrategia();
  atualizarCarteiras();
  atualizarDashboard();
}

function verificarLicencaExportacao() {
  if (estadoJogo.licencaExportacao && estadoJogo.licencaExpiracao) {
    const hoje = dataSimulador.toLocaleDateString();
    if (hoje === estadoJogo.licencaExpiracao) {
      estadoJogo.licencaExportacao = false;
      estadoJogo.licencaExpiracao = null;
      notificar('⚠️ Licença de exportação expirada');
    }
  }
}

function prepararExportacao(itemId) {
  const item = estoque.find(i => i.id === itemId);
  if (!item || !item.precoVenda) {
    notificar('Produto não está pronto para venda');
    return;
  }
  
  if (!estadoJogo.licencaExportacao) {
    notificar('❌ Precisa de licença de exportação');
    return;
  }
  
  const paises = [
    { nome: 'China', tarifa: 0.15 },
    { nome: 'Portugal', tarifa: 0.05 },
    { nome: 'EUA', tarifa: 0.10 },
    { nome: 'Brasil', tarifa: 0.12 }
  ];
  
  const quantidade = parseInt(prompt(`Quantas unidades exportar? (máx. ${item.quantidade})`));
  if (!quantidade || quantidade <= 0 || quantidade > item.quantidade) {
    notificar('Quantidade inválida');
    return;
  }
  
  const paisSelect = prompt(`Escolha o país:\n1 - China (15% tarifa)\n2 - Portugal (5% tarifa)\n3 - EUA (10% tarifa)\n4 - Brasil (12% tarifa)`);
  const pais = paises[parseInt(paisSelect) - 1];
  
  if (!pais) {
    notificar('País inválido');
    return;
  }
  
  const precoUSD = item.precoVenda / taxaCambio;
  const valorTotalUSD = precoUSD * quantidade;
  const tarifa = valorTotalUSD * pais.tarifa;
  const valorLiquidoUSD = valorTotalUSD - tarifa;
  
  const dataConclusao = new Date(dataSimulador);
  dataConclusao.setDate(dataConclusao.getDate() + 35); // 35 dias para produto
  
  item.quantidade -= quantidade;
  
  exportacoesPendentes.push({
    id: Date.now(),
    itemId,
    nome: item.nome,
    quantidade,
    precoVendaKz: item.precoVenda,
    precoUSD,
    valorTotalUSD,
    tarifa,
    valorLiquidoUSD,
    pais: pais.nome,
    dataConclusao: dataConclusao.toLocaleDateString(),
    prazoTotal: 35,
    diasRestantes: 35,
    concluida: false
  });
  
  notificar(`🌍 Exportação iniciada para ${pais.nome}! Conclusão em 35 dias`);
  salvarEstadoSimulacao();
  mostrarEstoque();
}

function verificarExportacoesConcluidas() {
  const hoje = dataSimulador.toLocaleDateString();
  const antes = exportacoesPendentes.map(e => e.id);
  
  exportacoesPendentes.forEach(exp => {
    if (!exp.concluida && exp.dataConclusao === hoje) {
      estadoJogo.carteiraUsd += exp.valorLiquidoUSD;
      exp.concluida = true;
      
      registrarTransacao('exportacao', 'entrada', exp.valorLiquidoUSD, 'USD', 
        `Exportação de ${exp.quantidade} ${exp.nome} para ${exp.pais} concluída`);
      
      notificar(`✅ Exportação concluída! Recebeste ${formatarMoeda(exp.valorLiquidoUSD, 'USD')} USD`);
    }
  });
  
  const depois = exportacoesPendentes.map(e => e.id);
  const concluidas = antes.filter(id => !depois.includes(id));
  
  concluidas.forEach(id => {
    _adicionarNoticia(
      '✅ Exportação Concluída',
      'Uma exportação foi concluída com sucesso. O valor em USD foi creditado.',
      'exportacao',
      false
    );
  });
}

// ============================================
// MÓDULO CONTABILIDADE E OBRIGAÇÕES FISCAIS
// ============================================

function mostrarContabilista() {
  const html = `
    <div class="contabilista-container">
      <h2>📋 Contabilista e Obrigações Fiscais</h2>
      
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h3>👤 Contratar Contabilista</h3>
          <select id="classe-contabilista" style="width:100%; padding:5px; margin:5px 0; color: var(--text-primary); background: var(--bg-secondary);">
            <option value="S">Classe S - 1.500.000 Kz (20 dias)</option>
            <option value="A">Classe A - 500.000 Kz (35 dias)</option>
            <option value="B">Classe B - 200.000 Kz (45 dias)</option>
            <option value="C">Classe C - 100.000 Kz (60 dias)</option>
          </select>
          <button onclick="pagarContabilista()" style="width:100%; padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Contratar</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;" class="status-fiscal">
          <h3>📊 Status Fiscal</h3>
          <p>Contabilista: ${contabilista.contratado ? '✅ Contratado' : '❌ Não contratado'}</p>
          ${contabilista.contratado ? `
            <p>Classe: ${contabilista.classe}</p>
            <p>Data pagamento: ${contabilista.dataPagamento}</p>
            <p>Previsão entrega: ${contabilista.dataEntrega}</p>
            <p>Dias restantes: ${calcularDiasRestantes(contabilista.dataEntrega)}</p>
          ` : ''}
          ${contabilista.multa > 0 ? `
            <p style="color:var(--accent-red);">⚠️ Multa AGT: ${formatarMoeda(contabilista.multa)} Kz</p>
          ` : ''}
        </div>
      </div>
      
      ${contabilista.contratado && calcularDiasRestantes(contabilista.dataEntrega) <= 0 ? `
        <div style="margin-top: 20px;">
          <h3>📊 Histórico Anual de Resultados</h3>
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>Receita</th>
                  <th>Custos</th>
                  <th>Lucro Antes</th>
                  <th>Imposto 25%</th>
                  <th>Lucro Líquido</th>
                </tr>
              </thead>
              <tbody>
                ${gerarHistoricoAnualHTML()}
              </tbody>
            </table>
          </div>
        </div>
      ` : '<p style="text-align: center; padding: 20px;">Contrate um contabilista para ver o histórico anual</p>'}
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  
  // Adicionar botões de pagamento de imposto se necessário
  setTimeout(() => {
    const registoAnual = historicoAnual[historicoAnual.length - 1];
    if (!registoAnual) return;
    
    const podeVerRelatorio = contabilista.contratado &&
        calcularDiasRestantes(contabilista.dataEntrega) <= 0;
    
    if (!podeVerRelatorio) return;
    
    const statusDiv = document.querySelector('.status-fiscal');
    if (!statusDiv) return;
    
    if (registoAnual.imposto > 0 && !registoAnual.impostoPago && !registoAnual.multaAplicada) {
      const btnPagar = document.createElement('button');
      btnPagar.textContent = `💳 Pagar Imposto (${formatarMoeda(registoAnual.imposto)} Kz)`;
      btnPagar.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:var(--accent-gold);color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer;';
      btnPagar.onclick = function() { pagarImpostoAnualSemMulta(); };
      statusDiv.appendChild(btnPagar);
    }
    
    if (registoAnual.multaAplicada && !registoAnual.multaPaga) {
      const btnPagarMulta = document.createElement('button');
      btnPagarMulta.textContent = `💳 Pagar Multa (${formatarMoeda(registoAnual.multaValor)} Kz)`;
      btnPagarMulta.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:var(--accent-red);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;';
      btnPagarMulta.onclick = function() { pagarImpostoAnualComMulta(); };
      statusDiv.appendChild(btnPagarMulta);
    }
  }, 100);
}

function pagarContabilista() {
  const classe = document.getElementById('classe-contabilista').value;
  const custos = { S: 1500000, A: 500000, B: 200000, C: 100000 };
  const prazos = { S: 20, A: 35, B: 45, C: 60 };
  
  if (estadoJogo.carteiraKz < custos[classe]) {
    notificar('Saldo insuficiente');
    return;
  }
  
  estadoJogo.carteiraKz -= custos[classe];
  estadoJogo.custosMes += custos[classe];
  
  const dataEntrega = new Date(dataSimulador);
  dataEntrega.setDate(dataEntrega.getDate() + prazos[classe]);
  
  contabilista = {
    contratado: true,
    classe,
    dataPagamento: dataSimulador.toLocaleDateString(),
    dataEntrega: dataEntrega.toLocaleDateString(),
    custo: custos[classe],
    multa: 0,
    multaParcelada: false,
    parcelasRestantes: 0,
    valorParcela: 0
  };
  
  registrarTransacao('contabilista', 'saida', custos[classe], 'Kz', `Pagamento contabilista Classe ${classe}`);
  notificar(`✅ Contabilista contratado! Relatório pronto em ${prazos[classe]} dias`);
  salvarEstadoSimulacao();
  mostrarContabilista();
  atualizarCarteiras();
}

function verificarPrazoContabilista() {
  if (!contabilista.contratado) return;
  
  const dataLimite = new Date(dataSimulador.getFullYear(), 2, 10); // 10 de Março
  const hoje = dataSimulador;
  
  if (hoje > dataLimite && !contabilista.multa && calcularDiasRestantes(contabilista.dataEntrega) > 0) {
    const lucroAntes = historicoAnual[historicoAnual.length - 1]?.lucroAntes || 0;
    const impostoDevido = lucroAntes > 0 ? lucroAntes * 0.25 : 0;
    const multa = impostoDevido * 2;
    
    contabilista.multa = multa;
    
    notificar(`⚠️ Relatório atrasado! Multa de ${formatarMoeda(multa)} Kz aplicada`);
    salvarEstadoSimulacao();
  }
}

function negociarMulta() {
  if (!contabilista.multa || contabilista.multaParcelada) return;
  
  contabilista.multaParcelada = true;
  contabilista.parcelasRestantes = 12;
  contabilista.valorParcela = contabilista.multa / 12;
  
  notificar(`✅ Multa parcelada em 12x de ${formatarMoeda(contabilista.valorParcela)} Kz`);
  salvarEstadoSimulacao();
  mostrarEstrategia();
}

function verificarPagamentosParcelados() {
  if (contabilista.multaParcelada && contabilista.parcelasRestantes > 0) {
    if (dataSimulador.getDate() === 1) {
      if (estadoJogo.carteiraKz >= contabilista.valorParcela) {
        estadoJogo.carteiraKz -= contabilista.valorParcela;
        contabilista.parcelasRestantes--;
        
        registrarTransacao('multa', 'saida', contabilista.valorParcela, 'Kz', 
          `Prestação ${12 - contabilista.parcelasRestantes}/12 da multa AGT`);
        
        if (contabilista.parcelasRestantes === 0) {
          contabilista.multa = 0;
          contabilista.multaParcelada = false;
          notificar('✅ Multa AGT totalmente paga!');
        }
      } else {
        notificar('❌ Não pagaste a prestação da multa! A AGT vai fechar a empresa...');
        declararFalencia();
      }
    }
  }
}

function pagarAguaLuz() {
  let valor = 0;
  
  switch(estadoJogo.dimensao) {
    case 'micro':
    case 'pequena':
      valor = 10000;
      break;
    case 'media':
      valor = 20000;
      break;
    case 'grande':
      valor = 50000;
      break;
  }
  
  estadoJogo.carteiraKz -= valor;
  estadoJogo.custosMes += valor;
  
  registrarTransacao('utilidades', 'saida', valor, 'Kz', 'Água e Luz');
}

function pagarImpostoSelo() {
  const valor = estadoJogo.faturamentoMes * 0.01;
  
  estadoJogo.carteiraKz -= valor;
  estadoJogo.custosMes += valor;
  
  registrarTransacao('imposto', 'saida', valor, 'Kz', 'Imposto de Selo (1%)');
}

// ============================================
// MÓDULO FISCAL AVANÇADO (SUPORTE)
// ============================================

function _executarRelatorioAnual() {
    const anoFechado = dataSimulador.getFullYear() - 1;
    
    // Evitar duplicado
    if (historicoAnual.some(a => a.ano === anoFechado)) return;
    
    // Filtrar meses do ano fechado
    const mesesDoAno = historicoMensal.filter(m =>
        m && m.mes && m.mes.includes(String(anoFechado))
    );
    
    const receita   = mesesDoAno.reduce((s, m) => s + (m.faturacao || 0), 0);
    const custos    = mesesDoAno.reduce((s, m) => s + (m.custos || 0), 0);
    const lucroAntes = receita - custos;
    const imposto   = lucroAntes > 0 ? Math.round(lucroAntes * 0.25) : 0;
    const lucroLiquido = lucroAntes - imposto;
    
    const registoAnual = {
        ano:          anoFechado,
        receita:      receita,
        custos:       custos,
        lucroAntes:   lucroAntes,
        imposto:      imposto,
        lucroLiquido: lucroLiquido,
        impostoPago:  false,
        multaAplicada: false,
        multaValor:   0,
        multaPaga:    false,
        multaParcelada: false,
        parcelasRestantes: 0,
        valorParcela: 0,
        dataFecho:    dataSimulador.toLocaleDateString()
    };
    
    historicoAnual.push(registoAnual);
    if (historicoAnual.length > 10) historicoAnual = historicoAnual.slice(-10);
    
    // Gerar notícia de fecho do ano
    _adicionarNoticia(
        `📅 Ano ${anoFechado} encerrado`,
        lucroAntes >= 0
            ? `Receita: ${formatarMoeda(receita)} Kz | Lucro: ${formatarMoeda(lucroLiquido)} Kz | Imposto a pagar: ${formatarMoeda(imposto)} Kz até 10/03/${dataSimulador.getFullYear()}`
            : `Receita: ${formatarMoeda(receita)} Kz | Prejuízo: ${formatarMoeda(Math.abs(lucroAntes))} Kz | Sem imposto a pagar`,
        'fiscal',
        true
    );
    
    if (imposto > 0) {
        notificar(`⚠️ Imposto ${anoFechado}: ${formatarMoeda(imposto)} Kz — pague até 10/03/${dataSimulador.getFullYear()}`);
    }
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
}

function _verificarPrazoFiscal() {
    const mes   = dataSimulador.getMonth();
    const dia   = dataSimulador.getDate();
    const ano   = dataSimulador.getFullYear();
    
    if (mes !== 2 || dia !== 10) return;
    
    historicoAnual.forEach(registo => {
        if (registo.ano !== ano - 1) return;
        if (registo.impostoPago) return;
        if (registo.multaAplicada) return;
        if (registo.imposto <= 0) return;
        
        const contabEntregou = contabilista.contratado &&
            calcularDiasRestantes(contabilista.dataEntrega) <= 0;
        
        if (!contabEntregou) {
            const multa = registo.imposto * 2;
            registo.multaAplicada = true;
            registo.multaValor    = multa;
            contabilista.multa    = multa;
            
            _adicionarNoticia(
                '⚠️ MULTA AGT APLICADA',
                `Relatório fiscal do ano ${registo.ano} fora do prazo. Multa: ${formatarMoeda(multa)} Kz. Pague até 01/06/${ano} ou negocie no menu Estratégia.`,
                'fiscal',
                true
            );
            
            notificar(`🚨 MULTA AGT: ${formatarMoeda(multa)} Kz aplicada! Negoceie no menu Estratégia.`);
            if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
        }
    });
}

function _verificarPagamentoContabilistaEntrega() {
    if (!contabilista.contratado) return;
    if (calcularDiasRestantes(contabilista.dataEntrega) > 0) return;
    
    const hoje = dataSimulador.toLocaleDateString();
    if (hoje !== contabilista.dataEntrega) return;
    
    if (contabilista._entregueNotificado) return;
    contabilista._entregueNotificado = true;
    
    notificar('✅ Contabilista tratou de todos os assuntos fiscais com a AGT');
    
    _adicionarNoticia(
        '📋 Relatório Fiscal Entregue',
        `O contabilista Classe ${contabilista.classe} entregou o relatório anual à AGT. Consulte o Histórico Anual.`,
        'fiscal',
        false
    );
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
}

function _verificarPagamentoImpostoAutomatico() {
    const mes = dataSimulador.getMonth();
    const dia = dataSimulador.getDate();
    
    if (mes !== 5 || dia !== 1) return;
    
    const registoComMulta = historicoAnual.find(r =>
        r.multaAplicada && !r.multaPaga && !r.multaParcelada
    );
    
    if (!registoComMulta) return;
    
    if (estadoJogo.carteiraKz >= registoComMulta.multaValor) {
        estadoJogo.carteiraKz -= registoComMulta.multaValor;
        registoComMulta.multaPaga = true;
        contabilista.multa = 0;
        
        registrarTransacao('multa', 'saida', registoComMulta.multaValor, 'Kz',
            `Pagamento multa AGT ano ${registoComMulta.ano}`);
        
        notificar(`✅ Multa AGT paga: ${formatarMoeda(registoComMulta.multaValor)} Kz`);
        if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    } else {
        _fecharEmpresaPorMulta(registoComMulta.multaValor);
    }
}

function _verificarMultaPrestacaoMensal() {
    if (dataSimulador.getDate() !== 1) return;
    
    const registo = historicoAnual.find(r =>
        r.multaParcelada && r.parcelasRestantes > 0 && !r.multaPaga
    );
    if (!registo) return;
    
    // Usar controlo em memória
    const chave = `multa_${dataSimulador.getMonth()}_${dataSimulador.getFullYear()}_${registo.ano}`;
    if (_prestacoesDebitadas[chave]) return;
    _prestacoesDebitadas[chave] = true;
    
    if (estadoJogo.carteiraKz < registo.valorParcela) {
        notificar('❌ Sem saldo para pagar prestação da multa AGT! Empresa em risco!');
        if (!registo._avisosNaoPagamento) registo._avisosNaoPagamento = 0;
        registo._avisosNaoPagamento++;
        if (registo._avisosNaoPagamento >= 2) {
            _fecharEmpresaPorMulta(registo.multaValor);
        }
        return;
    }
    
    estadoJogo.carteiraKz -= registo.valorParcela;
    registo.parcelasRestantes--;
    contabilista.parcelasRestantes = registo.parcelasRestantes;
    
    const parcelaPaga = 12 - registo.parcelasRestantes;
    
    registrarTransacao('multa', 'saida', registo.valorParcela, 'Kz',
        `Prestação multa AGT ${parcelaPaga}/12`);
    
    notificar(`💰 Descontado ${formatarMoeda(registo.valorParcela)} Kz da multa. Prestação ${parcelaPaga}/12`);
    
    if (registo.parcelasRestantes === 0) {
        registo.multaPaga   = true;
        contabilista.multa  = 0;
        contabilista.multaParcelada   = false;
        contabilista.parcelasRestantes = 0;
        notificar('✅ Multa AGT totalmente paga!');
        
        _adicionarNoticia(
            '✅ Multa AGT Liquidada',
            'Todas as 12 prestações da multa foram pagas. Empresa em conformidade fiscal.',
            'fiscal',
            false
        );
    }
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
}

// Pagar imposto sem multa
function pagarImpostoAnualSemMulta() {
    const registo = historicoAnual.find(r => !r.impostoPago && r.imposto > 0);
    if (!registo) { notificar('Sem imposto pendente'); return; }
    
    if (estadoJogo.carteiraKz < registo.imposto) {
        notificar('❌ Saldo insuficiente para pagar imposto');
        return;
    }
    
    estadoJogo.carteiraKz -= registo.imposto;
    registo.impostoPago = true;
    registo.dataPagamento = dataSimulador.toLocaleDateString();
    
    registrarTransacao('imposto', 'saida', registo.imposto, 'Kz',
        `Imposto Industrial 25% — Ano ${registo.ano}`);
    
    notificar(`✅ Imposto de ${formatarMoeda(registo.imposto)} Kz pago à AGT`);
    
    _adicionarNoticia(
        '✅ Imposto Industrial Pago',
        `Imposto do ano ${registo.ano} no valor de ${formatarMoeda(registo.imposto)} Kz pago com sucesso à AGT.`,
        'fiscal',
        false
    );
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarContabilista();
}

// Pagar imposto com multa
function pagarImpostoAnualComMulta() {
    const registo = historicoAnual.find(r => r.multaAplicada && !r.multaPaga);
    if (!registo) { notificar('Sem multa pendente'); return; }
    
    const total = registo.imposto + registo.multaValor;
    
    if (estadoJogo.carteiraKz < total) {
        notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(total)} Kz`);
        return;
    }
    
    estadoJogo.carteiraKz -= total;
    registo.impostoPago = true;
    registo.multaPaga   = true;
    contabilista.multa  = 0;
    
    registrarTransacao('imposto', 'saida', total, 'Kz',
        `Imposto + Multa AGT — Ano ${registo.ano}`);
    
    notificar(`✅ Imposto + Multa pagos: ${formatarMoeda(total)} Kz`);
    
    _adicionarNoticia(
        '✅ Imposto + Multa Liquidados',
        `Imposto do ano ${registo.ano} e respetiva multa foram pagos à AGT. Total: ${formatarMoeda(total)} Kz.`,
        'fiscal',
        false
    );
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarContabilista();
}

// Negociar multa AGT
function negociarMultaAGT() {
    const registo = historicoAnual.find(
        r => r.multaAplicada && !r.multaPaga && !r.multaParcelada
    );
    if (!registo) { notificar('Sem multa para negociar'); return; }
    
    const parcela = Math.round(registo.multaValor / 12);
    
    registo.multaParcelada     = true;
    registo.parcelasRestantes  = 12;
    registo.valorParcela       = parcela;
    
    contabilista.multa             = registo.multaValor;
    contabilista.multaParcelada    = true;
    contabilista.parcelasRestantes = 12;
    contabilista.valorParcela      = parcela;
    
    _adicionarNoticia(
        '🤝 Multa AGT Parcelada',
        `Multa de ${formatarMoeda(registo.multaValor)} Kz negociada em 12x de ${formatarMoeda(parcela)} Kz. Primeira prestação no próximo dia 1.`,
        'fiscal',
        true
    );
    
    notificar(`✅ Multa parcelada! 12x de ${formatarMoeda(parcela)} Kz`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    mostrarEstrategia();
}

// Pagar multa à vista com desconto
function pagarMultaAGTVista() {
    const registo = historicoAnual.find(
        r => r.multaAplicada && !r.multaPaga
    );
    if (!registo) { notificar('Sem multa para pagar'); return; }
    
    const valorComDesconto = Math.round(registo.multaValor * 0.90);
    
    if (estadoJogo.carteiraKz < valorComDesconto) {
        notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(valorComDesconto)} Kz`);
        return;
    }
    
    estadoJogo.carteiraKz -= valorComDesconto;
    registo.multaPaga   = true;
    registo.impostoPago = true;
    contabilista.multa  = 0;
    contabilista.multaParcelada   = false;
    contabilista.parcelasRestantes = 0;
    
    registrarTransacao('multa', 'saida', valorComDesconto, 'Kz',
        `Multa AGT paga à vista (10% desconto) — Ano ${registo.ano}`);
    
    notificar(`✅ Multa paga à vista: ${formatarMoeda(valorComDesconto)} Kz (10% desconto aplicado)`);
    
    _adicionarNoticia(
        '✅ Multa AGT Liquidada',
        `Multa do ano ${registo.ano} paga à vista com desconto de 10%. Total pago: ${formatarMoeda(valorComDesconto)} Kz.`,
        'fiscal',
        false
    );
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarEstrategia();
}

// ============================================
// MÓDULO INVESTIMENTOS INTERNACIONAIS USD
// ============================================

function mostrarDepositosInternacionais() {
    if (!estadoJogo.empresaCriada) {
        notificar('Crie uma empresa primeiro!');
        return;
    }
    
    const ativos = depositosPrazoUsd.filter(d => d.status === 'ativo');
    
    const html = `
        <div style="padding:20px;">
            <h2 style="color:var(--accent-gold);margin-bottom:15px;">🌍 Depósitos Internacionais (USD)</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">
                Saldo disponível: <span style="color:var(--accent-green);font-weight:700;">${formatarMoeda(estadoJogo.carteiraUsd, 'USD')} USD</span>
            </p>
            
            <div style="background:var(--bg-tertiary);padding:15px;border-radius:8px;margin-bottom:20px;">
                <p>💰 Taxa: 4% ao ano | Mínimo: 1.000 USD</p>
                <p>⚠️ Resgate antecipado: perde 50% dos juros</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px;">
                <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
                    <h3 style="color:var(--accent-gold);">3 Meses</h3>
                    <p>Taxa: 1%</p>
                    <input type="number" id="dep-usd-3" min="1000" step="100" placeholder="Valor (mín. 1000 USD)" 
                           style="width:100%;padding:8px;margin:10px 0;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px;">
                    <button onclick="criarDepositoUsd(3, 0.01)" style="width:100%;padding:10px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Aplicar</button>
                </div>
                <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
                    <h3 style="color:var(--accent-gold);">6 Meses</h3>
                    <p>Taxa: 2%</p>
                    <input type="number" id="dep-usd-6" min="1000" step="100" placeholder="Valor (mín. 1000 USD)" 
                           style="width:100%;padding:8px;margin:10px 0;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px;">
                    <button onclick="criarDepositoUsd(6, 0.02)" style="width:100%;padding:10px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Aplicar</button>
                </div>
                <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
                    <h3 style="color:var(--accent-gold);">12 Meses</h3>
                    <p>Taxa: 4%</p>
                    <input type="number" id="dep-usd-12" min="1000" step="100" placeholder="Valor (mín. 1000 USD)" 
                           style="width:100%;padding:8px;margin:10px 0;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px;">
                    <button onclick="criarDepositoUsd(12, 0.04)" style="width:100%;padding:10px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Aplicar</button>
                </div>
            </div>
            
            <h3 style="color:var(--accent-gold);margin-bottom:15px;">Depósitos Ativos</h3>
            <div class="tabela-container">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Valor</th>
                            <th>Prazo</th>
                            <th>Rendimento</th>
                            <th>Vencimento</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ativos.length === 0 
                            ? '<tr><td colspan="5" style="text-align:center;">Nenhum depósito ativo</td></tr>'
                            : ativos.map(d => {
                                const dias = calcularDiasRestantes(d.dataVencimento);
                                return `
                                    <tr>
                                        <td>${formatarMoeda(d.valor, 'USD')} USD</td>
                                        <td>${d.prazoMeses} meses</td>
                                        <td style="color:var(--accent-green);">+${formatarMoeda(d.rendimento, 'USD')} USD</td>
                                        <td>${d.dataVencimento} (${dias > 0 ? dias + ' dias' : 'vencido'})</td>
                                        <td>
                                            ${dias <= 0 
                                                ? `<button onclick="resgatarDepositoUsd(${d.id})" style="padding:5px 10px;background:var(--accent-green);color:#fff;border:none;border-radius:4px;cursor:pointer;">Resgatar</button>`
                                                : `<button onclick="resgatarDepositoUsdAntecipado(${d.id})" style="padding:5px 10px;background:var(--accent-red);color:#fff;border:none;border-radius:4px;cursor:pointer;">Resgatar (multa)</button>`}
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
            <div style="margin-top:20px;">
                <button onclick="mostrarInvestimentos()" style="padding:10px 20px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Voltar</button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

function criarDepositoUsd(meses, taxa) {
    const input = document.getElementById(`dep-usd-${meses}`);
    const valor = parseFloat(input?.value);
    
    if (!valor || valor < 1000) {
        notificar('❌ Valor mínimo: 1.000 USD');
        return;
    }
    if (estadoJogo.carteiraUsd < valor) {
        notificar('❌ Saldo USD insuficiente');
        return;
    }
    
    const rendimento = Math.round(valor * taxa * 100) / 100;
    const dataVenc = new Date(dataSimulador);
    dataVenc.setMonth(dataVenc.getMonth() + meses);
    
    const deposito = {
        id:            Date.now(),
        valor:         valor,
        prazoMeses:    meses,
        taxa:          taxa,
        rendimento:    rendimento,
        dataAplicacao: dataSimulador.toLocaleDateString(),
        dataVencimento: dataVenc.toLocaleDateString(),
        status:        'ativo'
    };
    
    estadoJogo.carteiraUsd -= valor;
    depositosPrazoUsd.push(deposito);
    
    registrarTransacao('deposito_usd', 'saida', valor, 'USD',
        `Depósito internacional ${meses} meses — ${formatarMoeda(valor, 'USD')} USD`);
    
    _adicionarNoticia(
        '🏦 Depósito Internacional Aplicado',
        `${formatarMoeda(valor, 'USD')} USD aplicados por ${meses} meses. Rendimento esperado: ${formatarMoeda(rendimento, 'USD')} USD.`,
        'investimento',
        false
    );
    
    notificar(`✅ Depósito USD realizado! Vencimento: ${deposito.dataVencimento}`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarDepositosInternacionais();
}

function resgatarDepositoUsd(id) {
    const dep = depositosPrazoUsd.find(d => d.id === id);
    if (!dep) return;
    
    const total = dep.valor + dep.rendimento;
    estadoJogo.carteiraUsd += total;
    dep.status = 'resgatado';
    
    registrarTransacao('deposito_usd', 'entrada', total, 'USD', 'Resgate depósito internacional + rendimentos');
    notificar(`💰 Depósito resgatado: ${formatarMoeda(total, 'USD')} USD`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarDepositosInternacionais();
}

function resgatarDepositoUsdAntecipado(id) {
    const dep = depositosPrazoUsd.find(d => d.id === id);
    if (!dep) return;
    
    if (!confirm('Resgate antecipado perde 50% dos juros. Confirmar?')) return;
    
    const rendReduzido = dep.rendimento * 0.5;
    const total = dep.valor + rendReduzido;
    
    estadoJogo.carteiraUsd += total;
    dep.status = 'resgatado_antecipado';
    
    registrarTransacao('deposito_usd', 'entrada', total, 'USD', 'Resgate antecipado depósito USD (50% juros perdidos)');
    notificar(`💰 Resgate antecipado: ${formatarMoeda(total, 'USD')} USD (metade dos juros perdida)`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarDepositosInternacionais();
}

function mostrarTitulosInternacionais() {
    if (!estadoJogo.empresaCriada) {
        notificar('Crie uma empresa primeiro!');
        return;
    }
    
    const ativos = titulosPublicosUsd.filter(t => t.status === 'ativo');
    
    const titulosDisponiveis = [
        { id: 'tbill-6m', nome: 'T-Bill 6 Meses', taxa: 0.055, prazo: 6, minimo: 500 },
        { id: 'eurobond-1', nome: 'Eurobond 1 Ano', taxa: 0.05, prazo: 12, minimo: 500 },
        { id: 'bund-2', nome: 'Bund Alemão 2 Anos', taxa: 0.06, prazo: 24, minimo: 500 }
    ];
    
    const html = `
        <div style="padding:20px;">
            <h2 style="color:var(--accent-gold);margin-bottom:15px;">📜 Títulos Internacionais (USD)</h2>
            <p style="color:var(--text-secondary);margin-bottom:20px;">
                Saldo disponível: <span style="color:var(--accent-green);font-weight:700;">${formatarMoeda(estadoJogo.carteiraUsd, 'USD')} USD</span>
            </p>
            
            <div style="background:var(--bg-tertiary);padding:15px;border-radius:8px;margin-bottom:20px;">
                <p>🏛️ Taxas: 5% a 7% ao ano | Mínimo: 500 USD</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:30px;">
                ${titulosDisponiveis.map(t => `
                    <div style="background:var(--bg-secondary);padding:15px;border-radius:8px;">
                        <h3 style="color:var(--accent-gold);">${t.nome}</h3>
                        <p>Taxa: ${(t.taxa * 100).toFixed(1)}% aa</p>
                        <p>Prazo: ${t.prazo} meses</p>
                        <input type="number" id="titulo-${t.id}" min="${t.minimo}" step="100" placeholder="Valor (mín. ${t.minimo} USD)" 
                               style="width:100%;padding:8px;margin:10px 0;background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px;">
                        <button onclick="comprarTituloUsd('${t.id}', '${t.nome}', ${t.taxa}, ${t.prazo}, ${t.minimo})" style="width:100%;padding:10px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Comprar</button>
                    </div>
                `).join('')}
            </div>
            
            <h3 style="color:var(--accent-gold);margin-bottom:15px;">Títulos Ativos</h3>
            <div class="tabela-container">
                <table style="width:100%;">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Valor</th>
                            <th>Rendimento</th>
                            <th>Vencimento</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ativos.length === 0
                            ? '<tr><td colspan="5" style="text-align:center;">Nenhum título ativo</td></tr>'
                            : ativos.map(t => {
                                const dias = calcularDiasRestantes(t.dataVencimento);
                                return `
                                    <tr>
                                        <td>${t.nome}</td>
                                        <td>${formatarMoeda(t.valor, 'USD')} USD</td>
                                        <td style="color:var(--accent-green);">+${formatarMoeda(t.rendimento, 'USD')} USD</td>
                                        <td>${t.dataVencimento} (${dias > 0 ? dias + ' dias' : 'vencido'})</td>
                                        <td>
                                            ${dias <= 0
                                                ? `<button onclick="resgatarTituloUsd(${t.id})" style="padding:5px 10px;background:var(--accent-green);color:#fff;border:none;border-radius:4px;cursor:pointer;">Resgatar</button>`
                                                : '<span style="color:var(--text-secondary);">⏳ Aguardar</span>'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
            <div style="margin-top:20px;">
                <button onclick="mostrarInvestimentos()" style="padding:10px 20px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Voltar</button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

function comprarTituloUsd(id, nome, taxa, prazoMeses, minimo) {
    const input = document.getElementById(`titulo-${id}`);
    const valor = parseFloat(input?.value);
    
    if (!valor || valor < minimo) {
        notificar(`❌ Valor mínimo: ${minimo} USD`);
        return;
    }
    if (estadoJogo.carteiraUsd < valor) {
        notificar('❌ Saldo USD insuficiente');
        return;
    }
    
    const rendimento = Math.round(valor * taxa * (prazoMeses / 12) * 100) / 100;
    const dataVenc = new Date(dataSimulador);
    dataVenc.setMonth(dataVenc.getMonth() + prazoMeses);
    
    const titulo = {
        id:           Date.now(),
        nome:         nome,
        valor:        valor,
        prazoMeses:   prazoMeses,
        taxa:         taxa,
        rendimento:   rendimento,
        dataCompra:   dataSimulador.toLocaleDateString(),
        dataVencimento: dataVenc.toLocaleDateString(),
        status:       'ativo'
    };
    
    estadoJogo.carteiraUsd -= valor;
    titulosPublicosUsd.push(titulo);
    
    if (investimentos && investimentos.historico) {
        investimentos.historico.push({
            data: dataSimulador.toLocaleDateString(),
            tipo: 'titulo_internacional',
            operacao: 'compra',
            nome: nome,
            valor: valor,
            prazo: prazoMeses,
            rendimento: rendimento,
            moeda: 'USD'
        });
    }
    
    registrarTransacao('titulo_usd', 'saida', valor, 'USD',
        `Compra de ${nome} — ${formatarMoeda(valor, 'USD')} USD`);
    
    _adicionarNoticia(
        '📜 Título Internacional Adquirido',
        `${formatarMoeda(valor, 'USD')} USD investidos em ${nome}. Rendimento: ${formatarMoeda(rendimento, 'USD')} USD em ${prazoMeses} meses.`,
        'investimento',
        false
    );
    
    notificar(`✅ ${nome} adquirido! Vencimento: ${titulo.dataVencimento}`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarTitulosInternacionais();
}

function resgatarTituloUsd(id) {
    const titulo = titulosPublicosUsd.find(t => t.id === id);
    if (!titulo) return;
    
    const total = titulo.valor + titulo.rendimento;
    estadoJogo.carteiraUsd += total;
    titulo.status = 'resgatado';
    
    if (investimentos && investimentos.historico) {
        investimentos.historico.push({
            data: dataSimulador.toLocaleDateString(),
            tipo: 'titulo_internacional',
            operacao: 'resgate',
            nome: titulo.nome,
            valor: titulo.valor,
            rendimento: titulo.rendimento,
            total: total,
            moeda: 'USD'
        });
    }
    
    registrarTransacao('titulo_usd', 'entrada', total, 'USD',
        `Resgate ${titulo.nome} + rendimentos`);
    
    notificar(`💰 Título resgatado: ${formatarMoeda(total, 'USD')} USD`);
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarTitulosInternacionais();
}

function _verificarVencimentosDepositosUsd() {
    const hoje = dataSimulador.toLocaleDateString();
    depositosPrazoUsd
        .filter(d => d.status === 'ativo' && d.dataVencimento === hoje)
        .forEach(d => {
            notificar(`⏰ Depósito USD de ${formatarMoeda(d.valor, 'USD')} USD venceu! Acede aos depósitos internacionais para resgatar.`);
            
            _adicionarNoticia(
                '⏰ Depósito Internacional Vencido',
                `O depósito de ${formatarMoeda(d.valor, 'USD')} USD venceu hoje. Rendimento disponível: ${formatarMoeda(d.rendimento, 'USD')} USD.`,
                'investimento',
                true
            );
        });
}

function _verificarVencimentosTitulosUsd() {
    const hoje = dataSimulador.toLocaleDateString();
    titulosPublicosUsd
        .filter(t => t.status === 'ativo' && t.dataVencimento === hoje)
        .forEach(t => {
            notificar(`⏰ Título ${t.nome} venceu! Acede aos títulos internacionais para resgatar.`);
            
            _adicionarNoticia(
                `⏰ Título ${t.nome} Vencido`,
                `O título ${t.nome} de ${formatarMoeda(t.valor, 'USD')} USD venceu hoje. Rendimento: ${formatarMoeda(t.rendimento, 'USD')} USD.`,
                'investimento',
                true
            );
        });
}

// ============================================
// MÓDULO VARIAÇÃO CAMBIAL E EVENTOS
// ============================================

function _atualizarCambioMensal() {
    const taxaAnterior = taxaCambio;
    
    const variacaoBase = (Math.random() * 35) - 15;
    const tendencia    = 2;
    const variacaoFinal = variacaoBase + tendencia;
    
    const fator = 1 + (variacaoFinal / 100);
    taxaCambio = Math.round(taxaCambio * fator);
    
    if (taxaCambio < 900)  taxaCambio = 900;
    if (taxaCambio > 4000) taxaCambio = 4000;
    
    historicoCambioMensal.push({
        data:         dataSimulador.toLocaleDateString(),
        mes:          dataSimulador.toLocaleDateString('pt-PT', {month:'long', year:'numeric'}),
        taxa:         taxaCambio,
        taxaAnterior: taxaAnterior,
        variacao:     variacaoFinal.toFixed(2)
    });
    
    if (historicoCambioMensal.length > 24) {
        historicoCambioMensal = historicoCambioMensal.slice(-24);
    }
    
    const sentido = taxaCambio > taxaAnterior ? 'subiu' : 'desceu';
    
    _adicionarNoticia(
        `💱 Dólar ${sentido}`,
        `USD/Kz ${sentido} de ${formatarMoeda(taxaAnterior)} para ${formatarMoeda(taxaCambio)} Kz (${variacaoFinal > 0 ? '+' : ''}${variacaoFinal.toFixed(1)}%). ${taxaCambio > taxaAnterior ? 'Importações ficam mais caras.' : 'Bom momento para comprar USD.'}`,
        'cambio',
        Math.abs(variacaoFinal) > 10
    );
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
}

const _poolEventosAngola = [
    {
        titulo: '🛢️ Queda no Preço do Petróleo',
        descricao: 'Barril Brent abaixo de USD 70. Pressão sobre o Kwanza esperada.',
        efeito: () => { taxaCambio = Math.round(taxaCambio * 1.06); inflacaoAtual = Math.min(inflacaoAtual + 3, 80); },
        prob: 0.04, categoria: 'economia'
    },
    {
        titulo: '📈 Angola Cresce Acima do Esperado',
        descricao: 'PIB angolano supera previsões. Consumo interno sobe.',
        efeito: () => { if(clientes) clientes.nacionais = Math.round((clientes.nacionais||0) * 1.03); },
        prob: 0.04, categoria: 'economia'
    },
    {
        titulo: '🏦 BNA Sobe Taxa de Juro',
        descricao: 'Banco Nacional de Angola eleva taxa directora. Crédito fica mais caro.',
        efeito: () => { inflacaoAtual = Math.max(inflacaoAtual - 2, 5); },
        prob: 0.03, categoria: 'economia', importante: true
    },
    {
        titulo: '💰 Entrada de Divisas Aumenta',
        descricao: 'Exportações aumentam entrada de USD. Kwanza aprecia.',
        efeito: () => { taxaCambio = Math.round(taxaCambio * 0.96); },
        prob: 0.04, categoria: 'cambio'
    },
    {
        titulo: '🇨🇳 China Reforça Investimento em Angola',
        descricao: 'Novo acordo de financiamento chinês anunciado.',
        efeito: () => { if(dadosMundo?.relacoesDiplomaticas) dadosMundo.relacoesDiplomaticas.china = 'boa'; },
        prob: 0.03, categoria: 'diplomacia', importante: true
    },
    {
        titulo: '🌍 Crise Financeira Global',
        descricao: 'Mercados internacionais em turbulência. Atenção às divisas.',
        efeito: () => { taxaCambio = Math.round(taxaCambio * 1.12); inflacaoAtual = Math.min(inflacaoAtual + 6, 80); },
        prob: 0.01, categoria: 'global', importante: true
    }
];

function _sortearEventosMensais() {
    _poolEventosAngola.forEach(evento => {
        if (Math.random() < evento.prob) {
            try { evento.efeito(); } catch(e) {}
            _adicionarNoticia(evento.titulo, evento.descricao, evento.categoria, evento.importante || false);
            notificar(`📢 ${evento.titulo}`);
        }
    });
}

function _gerarNoticiasMercadoMensal() {
    // Ações angolanas
    const acoes = ['bfa','bai','bodiva'];
    acoes.forEach(id => {
        const acao = investimentos?.acoes?.[id];
        if (!acao) return;
        const variacao = ((acao.precoAtual - acao.precoBase) / acao.precoBase * 100).toFixed(1);
        const sentido  = parseFloat(variacao) >= 0 ? '📈' : '📉';
        _adicionarNoticia(
            `${sentido} ${acao.nome}: ${formatarMoeda(acao.precoAtual)} Kz`,
            `Variação: ${variacao}% face ao preço base.`,
            'bolsa',
            Math.abs(parseFloat(variacao)) > 200
        );
    });
    
    // Ações internacionais
    const acoesInt = ['microsoft','apple','tesla'];
    acoesInt.forEach(id => {
        const acao = investimentos?.acoes?.[id];
        if (!acao) return;
        const variacao = ((acao.precoAtual - acao.precoBase) / acao.precoBase * 100).toFixed(1);
        const sentido  = parseFloat(variacao) >= 0 ? '📈' : '📉';
        _adicionarNoticia(
            `${sentido} ${acao.nome}: USD ${formatarMoeda(acao.precoAtual, 'USD')}`,
            `Variação: ${variacao}% face ao preço base.`,
            'bolsa_internacional',
            false
        );
    });
}

// ============================================
// MÓDULO NOTÍCIAS
// ============================================

function mostrarNoticias() {
    const naoLidas = noticiasSimulador.filter(n => !n.lida).length;
    
    let html = `
        <div style="padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2 style="color:var(--accent-gold);">📰 Notícias do Simulador</h2>
                <span style="background:var(--accent-gold);color:#000;padding:5px 15px;border-radius:20px;">
                    ${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}
                </span>
            </div>
            <div style="margin-bottom:15px;">
                <button onclick="_marcarTodasNoticiasLidas()" style="padding:8px 15px;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-color);border-radius:4px;cursor:pointer;">
                    ✅ Marcar todas como lidas
                </button>
            </div>
    `;
    
    if (noticiasSimulador.length === 0) {
        html += '<p style="text-align:center;padding:40px;">Nenhuma notícia disponível</p>';
    } else {
        noticiasSimulador.forEach(n => {
            html += `
                <div onclick="_marcarNoticiaLida(${n.id})"
                     style="background:${n.lida ? 'var(--bg-tertiary)' : '#1a1500'};
                            border-left:4px solid ${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'};
                            padding:15px;margin-bottom:10px;border-radius:8px;cursor:pointer;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                        <strong style="color:${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'};">${n.titulo}</strong>
                        <span style="color:var(--text-secondary);font-size:12px;">${n.data}</span>
                    </div>
                    <p style="color:var(--text-secondary);margin:0;">${n.descricao}</p>
                    ${!n.lida ? '<span style="display:inline-block;width:8px;height:8px;background:var(--accent-gold);border-radius:50%;margin-top:8px;"></span>' : ''}
                </div>
            `;
        });
    }
    
    html += `<div style="margin-top:20px;"><button onclick="mostrarDashboardInicial()" style="padding:10px 20px;background:var(--accent-gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Voltar</button></div></div>`;
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

function _marcarNoticiaLida(id) {
    const n = noticiasSimulador.find(x => x.id === id);
    if (n) n.lida = true;
    mostrarNoticias();
}

function _marcarTodasNoticiasLidas() {
    noticiasSimulador.forEach(n => { n.lida = true; });
    mostrarNoticias();
}

// ============================================
// MÓDULO HISTÓRICOS
// ============================================

function mostrarHistorico() {
  const html = `
    <div class="historico-container">
      <h2>📊 Históricos e Relatórios</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px;">
        <button style="padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarHistoricoTransacoes()">Transações</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarHistoricoMensal()">Mensal</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarHistoricoAnualView()">Anual</button>
      </div>
      
      <div id="historico-conteudo">
        ${gerarHistoricoTransacoesHTML()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarHistoricoTransacoesHTML() {
  if (historicoTransacoes.length === 0) {
    return '<p style="text-align: center; padding: 50px;">📭 Nenhuma transação registrada</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>';
  
  historicoTransacoes.slice(0, 50).forEach(trans => {
    const classe = trans.operacao === 'entrada' ? 'text-success' : 'text-danger';
    html += `
      <tr>
        <td>${trans.data}</td>
        <td>${trans.tipo}</td>
        <td>${trans.descricao}</td>
        <td style="color:${trans.operacao === 'entrada' ? 'var(--accent-green)' : 'var(--accent-red)'};">${trans.operacao === 'entrada' ? '+' : '-'}${formatarMoeda(trans.valor)} ${trans.moeda}</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function gerarHistoricoMensalHTML() {
  if (historicoMensal.length === 0) {
    return '<p style="text-align: center; padding: 50px;">📭 Nenhum dado mensal disponível</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Mês</th><th>Faturação</th><th>Custos</th><th>Lucro/Prejuízo</th></tr></thead><tbody>';
  
  historicoMensal.slice(-12).forEach(mes => {
    const classe = mes.lucro >= 0 ? 'text-success' : 'text-danger';
    html += `
      <tr>
        <td>${mes.mes}</td>
        <td>${formatarMoeda(mes.faturacao)} Kz</td>
        <td>${formatarMoeda(mes.custos)} Kz</td>
        <td style="color:${mes.lucro >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(mes.lucro)} Kz</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function gerarHistoricoAnualHTML() {
  if (historicoAnual.length === 0) {
    return '<tr><td colspan="6" style="text-align: center;">Nenhum dado anual disponível</td></tr>';
  }
  
  return historicoAnual.slice(-10).map(ano => {
    const classe = ano.lucroLiquido >= 0 ? 'text-success' : 'text-danger';
    return `
      <tr>
        <td>${ano.ano}</td>
        <td>${formatarMoeda(ano.receita)} Kz</td>
        <td>${formatarMoeda(ano.custos)} Kz</td>
        <td>${formatarMoeda(ano.lucroAntes)} Kz</td>
        <td>${formatarMoeda(ano.imposto)} Kz</td>
        <td style="color:${ano.lucroLiquido >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(ano.lucroLiquido)} Kz</td>
      </tr>
    `;
  }).join('');
}

function mostrarHistoricoTransacoes() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoTransacoesHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarHistoricoMensal() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoMensalHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarHistoricoAnualView() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoAnualHTML();
  
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function registrarTransacao(tipo, operacao, valor, moeda, descricao) {
  historicoTransacoes.unshift({
    data: dataSimulador.toLocaleDateString(),
    tipo,
    operacao,
    valor,
    moeda,
    descricao,
    timestamp: Date.now()
  });
  
  if (historicoTransacoes.length > 100) {
    historicoTransacoes.pop();
  }
}

function calcularFaturamentoMensal() {
  const mes = dataSimulador.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  
  historicoMensal.push({
    mes,
    faturacao: estadoJogo.faturamentoMes,
    custos: estadoJogo.custosMes,
    lucro: estadoJogo.faturamentoMes - estadoJogo.custosMes
  });
  
  estadoJogo.lucroMes = estadoJogo.faturamentoMes - estadoJogo.custosMes;
  
  if (historicoMensal.length > 24) {
    historicoMensal = historicoMensal.slice(-24);
  }
}

function processarRelatorioAnual() {
  const ano = dataSimulador.getFullYear() - 1;
  
  const dadosAno = historicoMensal.filter(m => m.mes.includes(ano));
  
  const receita = dadosAno.reduce((sum, m) => sum + m.faturacao, 0);
  const custos = dadosAno.reduce((sum, m) => sum + m.custos, 0);
  const lucroAntes = receita - custos;
  const imposto = lucroAntes > 0 ? lucroAntes * 0.25 : 0;
  const lucroLiquido = lucroAntes - imposto;
  
  historicoAnual.push({
    ano,
    receita,
    custos,
    lucroAntes,
    imposto,
    lucroLiquido
  });
  
  if (historicoAnual.length > 10) {
    historicoAnual = historicoAnual.slice(-10);
  }
  
  if (lucroAntes < 0) {
    notificar(`⚠️ Prejuízo no ano ${ano}: ${formatarMoeda(Math.abs(lucroAntes))} Kz`);
  }
  
  verificarPrazoContabilista();
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function notificar(mensagem) {
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao';
  notificacao.textContent = mensagem;
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.remove();
  }, 5000);
}

function salvarEstadoSimulacao() {
  const estado = {
    dataSave: new Date().toISOString(),
    dataSimulador: dataSimulador.toISOString(),
    tempoDecorrido,
    estadoJogo,
    funcionarios,
    pagamentosMes,
    clientes,
    emprestimos,
    depositosPrazo,
    titulosPublicos,
    investimentos,
    estoque,
    entregasPendentes,
    producoesPendentes,
    exportacoesPendentes,
    parcerias,
    contabilista,
    historicoTransacoes: historicoTransacoes.slice(0, 100),
    historicoMensal,
    historicoAnual,
    taxaCambio,
    inflacaoAtual,
    velocidadeTempo
  };
  
  localStorage.setItem('simuladorSave', JSON.stringify(estado));
  
  // Salvar dados extras
  try {
    const extra = {
      depositosPrazoUsd,
      titulosPublicosUsd,
      historicoCambioMensal,
      noticiasSimulador
    };
    localStorage.setItem('simuladorSaveExtra', JSON.stringify(extra));
  } catch(e) {
    console.error('Erro ao salvar dados extras:', e);
  }
}

function carregarEstadoSimulacao() {
  const save = localStorage.getItem('simuladorSave');
  if (save) {
    try {
      const estado = JSON.parse(save);
      dataSimulador = new Date(estado.dataSimulador);
      tempoDecorrido = estado.tempoDecorrido;
      estadoJogo = estado.estadoJogo;
      funcionarios = estado.funcionarios;
      pagamentosMes = estado.pagamentosMes;
      clientes = estado.clientes;
      emprestimos = estado.emprestimos || [];
      depositosPrazo = estado.depositosPrazo || [];
      titulosPublicos = estado.titulosPublicos || [];
      investimentos = estado.investimentos;
      estoque = estado.estoque || [];
      entregasPendentes = estado.entregasPendentes || [];
      producoesPendentes = estado.producoesPendentes || [];
      exportacoesPendentes = estado.exportacoesPendentes || [];
      parcerias = estado.parcerias || [];
      contabilista = estado.contabilista || {
        contratado: false,
        classe: null,
        dataPagamento: null,
        dataEntrega: null,
        custo: 0,
        multa: 0,
        multaParcelada: false,
        parcelasRestantes: 0,
        valorParcela: 0
      };
      historicoTransacoes = estado.historicoTransacoes || [];
      historicoMensal = estado.historicoMensal || [];
      historicoAnual = estado.historicoAnual || [];
      taxaCambio = estado.taxaCambio || 1800;
      inflacaoAtual = estado.inflacaoAtual || 23.4;
      velocidadeTempo = estado.velocidadeTempo || 1;
      
      // Carregar dados extras
      try {
        const extra = JSON.parse(localStorage.getItem('simuladorSaveExtra') || '{}');
        depositosPrazoUsd = extra.depositosPrazoUsd || [];
        titulosPublicosUsd = extra.titulosPublicosUsd || [];
        historicoCambioMensal = extra.historicoCambioMensal || [];
        noticiasSimulador = extra.noticiasSimulador || [];
      } catch(e) {
        console.error('Erro ao carregar dados extras:', e);
      }
      
      document.getElementById('empresaNome').textContent = estadoJogo.nomeEmpresa;
      document.getElementById('empresaDimensao').textContent = estadoJogo.dimensao.toUpperCase();
      atualizarDataDisplay();
      atualizarCarteiras();
      atualizarDashboard();
      
      if (intervaloPrincipal) {
        clearInterval(intervaloPrincipal);
      }
      iniciarTempoSimulador();
      
      notificar('✅ Simulação carregada com sucesso!');
      mostrarDashboardInicial();
      
    } catch (e) {
      console.error('Erro ao carregar save:', e);
      notificar('❌ Erro ao carregar simulação');
    }
  }
}

function reiniciarSimulacao() {
  if (confirm('Tem certeza? Todo o progresso será perdido!')) {
    localStorage.removeItem('simuladorSave');
    localStorage.removeItem('simuladorSaveExtra');
    window.location.reload();
  }
}

function calcularDiasRestantes(dataString) {
  if (!dataString) return 0;
  const [dia, mes, ano] = dataString.split('/').map(Number);
  const dataAlvo = new Date(ano, mes - 1, dia);
  const diff = dataAlvo - dataSimulador;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function verificarEventos() {
  if (dataSimulador.getDate() === 1 && (dataSimulador.getMonth() === 5 || dataSimulador.getMonth() === 11)) {
    processarPagamentoJuros();
  }
  
  verificarVencimentos();
}

function atualizarRelacoesDiplomaticas() {
  if (dadosMundo) {
    for (let pais in dadosMundo.relacoesDiplomaticas) {
      const rand = Math.random();
      if (rand < 0.1) {
        const estados = ['boa', 'normal', 'ruim'];
        const atual = dadosMundo.relacoesDiplomaticas[pais];
        let novo;
        do {
          novo = estados[Math.floor(Math.random() * estados.length)];
        } while (novo === atual);
        dadosMundo.relacoesDiplomaticas[pais] = novo;
        notificar(`🌍 Relação com ${pais} mudou para ${novo}`);
      }
    }
  }
}

function verificarCriseGlobal() {
  contadorCrise++;
  
  if (contadorCrise >= 5) {
    contadorCrise = 0;
    
    if (Math.random() < 0.4) {
      cicloEconomico = 'crise';
      inflacaoAtual += 15;
      notificar('⚠️⚠️⚠️ CRISE GLOBAL! ⚠️⚠️⚠️');
      notificar('Taxas de juro vão aumentar, inflação elevada');
    } else {
      cicloEconomico = 'estavel';
    }
  }
}

// ============================================
// CONTROLE DE VELOCIDADE DO TEMPO
// ============================================

function inicializarControleTempo() {
  const controleHTML = `
    <div class="controle-tempo">
      <span class="velocidade-label">⏱️ Velocidade:</span>
      <div class="velocidade-botoes">
        <button class="velocidade-btn ${velocidadeTempo === 1 ? 'active' : ''}" onclick="alterarVelocidade(1)" title="Normal">1x</button>
        <button class="velocidade-btn ${velocidadeTempo === 7 ? 'active' : ''}" onclick="alterarVelocidade(7)" title="1 semana = 30s">7x</button>
        <button class="velocidade-btn ${velocidadeTempo === 30 ? 'active' : ''}" onclick="alterarVelocidade(30)" title="1 mês = 30s">30x</button>
        <button class="velocidade-btn ${velocidadeTempo === 90 ? 'active' : ''}" onclick="alterarVelocidade(90)" title="1 trimestre = 30s">90x</button>
        <button class="velocidade-btn ${velocidadeTempo === 180 ? 'active' : ''}" onclick="alterarVelocidade(180)" title="1 semestre = 30s">180x</button>
        <button class="velocidade-btn ${velocidadeTempo === 300 ? 'active' : ''}" onclick="alterarVelocidade(300)" title="1 ano = 36s">300x</button>
      </div>
      <span class="velocidade-atual">${velocidadeTempo}x</span>
    </div>
  `;
  
  const headerRight = document.querySelector('.header-right');
  if (headerRight) {
    headerRight.innerHTML += controleHTML;
  } else {
    const header = document.querySelector('.simulador-header');
    if (header) {
      const rightDiv = document.createElement('div');
      rightDiv.className = 'header-right';
      rightDiv.innerHTML = controleHTML;
      header.appendChild(rightDiv);
    }
  }
}

function alterarVelocidade(novaVelocidade) {
  if (velocidadeTempo === novaVelocidade) return;
  
  velocidadeTempo = novaVelocidade;
  
  if (intervaloPrincipal) {
    clearInterval(intervaloPrincipal);
    intervaloPrincipal = null;
  }
  
  iniciarTempoSimulador();
  
  document.querySelectorAll('.velocidade-btn').forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.textContent) === novaVelocidade) {
      btn.classList.add('active');
    }
  });
  
  document.querySelector('.velocidade-atual').textContent = `${novaVelocidade}x`;
  notificar(`⏱️ Velocidade alterada para ${novaVelocidade}x`);
}

function iniciarAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  
  autoSaveInterval = setInterval(() => {
    if (estadoJogo.empresaCriada && localStorage.getItem('autoSave') !== 'false') {
      salvarEstadoSimulacao();
    }
  }, 300000);
}

function inicializarAtalhos() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      return;
    }
    
    switch(e.key) {
      case '1': if (estadoJogo.empresaCriada) mostrarRH(); break;
      case '2': if (estadoJogo.empresaCriada) mostrarFornecedores(); break;
      case '3': if (estadoJogo.empresaCriada) mostrarMarketing(); break;
      case '4': if (estadoJogo.empresaCriada) mostrarFinanceiro(); break;
      case '5': if (estadoJogo.empresaCriada) mostrarInvestimentos(); break;
      case '6': if (estadoJogo.empresaCriada) mostrarEstrategia(); break;
      case '7': if (estadoJogo.empresaCriada) mostrarContabilista(); break;
      case '8': if (estadoJogo.empresaCriada) mostrarRelatorios(); break;
      case '9': if (estadoJogo.empresaCriada) mostrarHistorico(); break;
      case '0': case 'H': case 'h': mostrarAjuda(); break;
      case 'S': case 's': salvarEstadoSimulacao(); notificar('💾 Jogo salvo!'); break;
      case 'L': case 'l': if (confirm('Carregar último save?')) carregarEstadoSimulacao(); break;
      case 'R': case 'r': reiniciarSimulacao(); break;
      case ' ': 
        e.preventDefault();
        if (intervaloPrincipal) {
          clearInterval(intervaloPrincipal);
          intervaloPrincipal = null;
          notificar('⏸️ Pausado');
        } else {
          iniciarTempoSimulador();
          notificar('▶️ Continuar');
        }
        break;
      case 'ArrowUp': e.preventDefault(); if (velocidadeTempo < 300) alterarVelocidade(Math.min(velocidadeTempo * 2, 300)); break;
      case 'ArrowDown': e.preventDefault(); if (velocidadeTempo > 1) alterarVelocidade(Math.max(velocidadeTempo / 2, 1)); break;
    }
  });
}

// ============================================
// MÓDULO RELATÓRIOS
// ============================================

function mostrarRelatorios() {
  const html = `
    <div class="relatorios-container">
      <h2>📊 Relatórios Gerenciais</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px;">
        <button style="padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarRelatorioMensal()">Mensal</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarRelatorioAnual()">Anual</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarRelatorioClientes()">Clientes</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarRelatorioProdutividade()">Produtividade</button>
      </div>
      
      <div id="relatorios-conteudo">
        ${gerarRelatorioMensal()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarRelatorioMensal() {
  const ultimos12 = historicoMensal.slice(-12);
  
  if (ultimos12.length === 0) {
    return '<p style="text-align: center; padding: 50px;">📭 Nenhum dado mensal disponível</p>';
  }
  
  let html = `
    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Faturação</th>
            <th>Custos</th>
            <th>Lucro/Prejuízo</th>
            <th>Margem</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  ultimos12.forEach(mes => {
    const margem = mes.faturacao > 0 ? ((mes.lucro / mes.faturacao) * 100).toFixed(1) : '0.0';
    const classe = mes.lucro >= 0 ? 'text-success' : 'text-danger';
    
    html += `
      <tr>
        <td>${mes.mes}</td>
        <td>${formatarMoeda(mes.faturacao)} Kz</td>
        <td>${formatarMoeda(mes.custos)} Kz</td>
        <td style="color:${mes.lucro >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(mes.lucro)} Kz</td>
        <td>${margem}%</td>
      </tr>
    `;
  });
  
  const totalFaturacao = ultimos12.reduce((sum, m) => sum + m.faturacao, 0);
  const totalCustos = ultimos12.reduce((sum, m) => sum + m.custos, 0);
  const totalLucro = ultimos12.reduce((sum, m) => sum + m.lucro, 0);
  const margemMedia = totalFaturacao > 0 ? ((totalLucro / totalFaturacao) * 100).toFixed(1) : '0.0';
  
  html += `
        </tbody>
        <tfoot>
          <tr>
            <td><strong>Total (12 meses)</strong></td>
            <td><strong>${formatarMoeda(totalFaturacao)} Kz</strong></td>
            <td><strong>${formatarMoeda(totalCustos)} Kz</strong></td>
            <td><strong style="color:${totalLucro >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(totalLucro)} Kz</strong></td>
            <td><strong>${margemMedia}%</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  
  return html;
}

function gerarRelatorioAnual() {
  if (historicoAnual.length === 0) {
    return '<p style="text-align: center; padding: 50px;">📭 Nenhum dado anual disponível</p>';
  }
  
  let html = `
    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Ano</th>
            <th>Receita</th>
            <th>Custos</th>
            <th>Lucro Antes</th>
            <th>Imposto 25%</th>
            <th>Lucro Líquido</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  historicoAnual.slice(-10).forEach(ano => {
    const roi = ano.custos > 0 ? ((ano.lucroLiquido / ano.custos) * 100).toFixed(1) : '0.0';
    const classe = ano.lucroLiquido >= 0 ? 'text-success' : 'text-danger';
    
    html += `
      <tr>
        <td>${ano.ano}</td>
        <td>${formatarMoeda(ano.receita)} Kz</td>
        <td>${formatarMoeda(ano.custos)} Kz</td>
        <td>${formatarMoeda(ano.lucroAntes)} Kz</td>
        <td>${formatarMoeda(ano.imposto)} Kz</td>
        <td style="color:${ano.lucroLiquido >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatarMoeda(ano.lucroLiquido)} Kz</td>
        <td>${roi}%</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}

function gerarRelatorioClientes() {
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  const crescimentoMensal = clientes.historico.length > 1 ? 
    ((clientes.historico[clientes.historico.length - 1] - clientes.historico[0]) / clientes.historico[0] * 100).toFixed(1) : 0;
  
  return `
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin-bottom:20px;">
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Clientes Nacionais</h4>
        <span style="color:var(--accent-gold); font-size:24px;">${clientes.nacionais}</span>
      </div>
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Clientes Estrangeiros</h4>
        <span style="color:var(--accent-gold); font-size:24px;">${clientes.estrangeiros}</span>
      </div>
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Total</h4>
        <span style="color:var(--accent-gold); font-size:24px;">${totalClientes}</span>
      </div>
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Crescimento</h4>
        <span style="color:${crescimentoMensal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${crescimentoMensal}%</span>
      </div>
    </div>
    
    <h3>Histórico de Campanhas de Marketing</h3>
    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Alcance</th>
            <th>Custo</th>
            <th>Clientes Fidelizados</th>
          </tr>
        </thead>
        <tbody>
          ${campanhasMarketing.slice(-10).map(c => `
            <tr>
              <td>${c.data}</td>
              <td>${c.tipo}</td>
              <td>${c.alcance}</td>
              <td>${formatarMoeda(c.custo)} Kz</td>
              <td style="color:var(--accent-green);">+${c.novosClientes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function gerarRelatorioProdutividade() {
  const totalFunc = calcularTotalFuncionarios();
  const faturacaoMedia = historicoMensal.slice(-3).reduce((sum, m) => sum + m.faturacao, 0) / 3;
  const produtividadeMedia = totalFunc > 0 ? faturacaoMedia / totalFunc : 0;
  
  return `
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin-bottom:20px;">
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Total Funcionários</h4>
        <span style="color:var(--accent-gold); font-size:24px;">${totalFunc}</span>
      </div>
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Faturação Média (3m)</h4>
        <span style="color:var(--accent-gold); font-size:18px;">${formatarMoeda(faturacaoMedia)} Kz</span>
      </div>
      <div style="background:var(--bg-tertiary); padding:15px; border-radius:8px; text-align:center;">
        <h4>Produtividade Média</h4>
        <span style="color:var(--accent-gold); font-size:18px;">${formatarMoeda(produtividadeMedia)} Kz/func</span>
      </div>
    </div>
    
    <h3>Composição da Força de Trabalho</h3>
    <div class="tabela-container">
      <table>
        <thead>
          <tr>
            <th>Classe</th>
            <th>Homens</th>
            <th>Mulheres</th>
            <th>Total</th>
            <th>Salário Médio</th>
            <th>Produtividade</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(funcionarios).map(key => {
            const f = funcionarios[key];
            const total = f.homens + f.mulheres;
            if (total === 0) return '';
            return `
              <tr>
                <td>${key.replace('classe', 'Classe ')}</td>
                <td>${f.homens}</td>
                <td>${f.mulheres}</td>
                <td>${total}</td>
                <td>${formatarMoeda(f.salario)} Kz</td>
                <td>+${(f.produtividade * 100).toFixed(2)}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function mostrarRelatorioMensal() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioMensal();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioAnual() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioAnual();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioClientes() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioClientes();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioProdutividade() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioProdutividade();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ============================================
// MÓDULO AJUDA
// ============================================

function mostrarAjuda() {
  const html = `
    <div class="ajuda-container">
      <h2>📚 Ajuda e Documentação</h2>
      
      <div style="display:flex; gap:5px; margin-bottom:20px;">
        <button style="padding:10px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;" onclick="mostrarTutorialBasico()">Tutorial Básico</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarExplicacaoModulos()">Módulos</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarDicasEstrategicas()">Dicas Estratégicas</button>
        <button style="padding:10px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;" onclick="mostrarAtalhos()">Atalhos</button>
      </div>
      
      <div id="ajuda-conteudo">
        ${gerarTutorialBasico()}
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarTutorialBasico() {
  return `
    <div class="tutorial-content">
      <h3>🎯 Primeiros Passos</h3>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>1. Criação da Empresa</h4><p>Escolha a dimensão, área de atuação e saldo inicial.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>2. Recursos Humanos</h4><p>Contrate funcionários, pague salários e INSS mensalmente.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>3. Fornecedores</h4><p>Compre produtos, defina margem e coloque à venda.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>4. Marketing</h4><p>Invista para aumentar base de clientes.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>5. Finanças</h4><p>Gerencie créditos, câmbio e investimentos.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>6. Estratégia</h4><p>Expanda, feche parcerias e exporte.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border-left:4px solid var(--accent-gold); border-radius:5px;">
        <h4>7. Obrigações Fiscais</h4><p>Contrate contabilista e evite multas.</p>
      </div>
    </div>
  `;
}

function gerarExplicacaoModulos() {
  return `
    <div class="modulos-content">
      <h3>📦 Módulos</h3>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:15px;">
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>👥 RH</h4>
          <ul style="margin:0; padding-left:20px;">
            <li>Classe A: 700k Kz, +2% prod</li>
            <li>Classe B: 200k Kz, +0.5% prod</li>
            <li>Classe C: 50k Kz, +0.01% prod</li>
            <li>Classe D: 30k Kz, 0% prod</li>
          </ul>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>📦 Fornecedores</h4>
          <ul style="margin:0; padding-left:20px;">
            <li>Nacional: prazos 1-15 dias</li>
            <li>Internacional: prazos +30-90 dias</li>
          </ul>
        </div>
        <div style="background:var(--bg-secondary); padding:15px; border-radius:8px;">
          <h4>📈 Investimentos</h4>
          <ul style="margin:0; padding-left:20px;">
            <li>Ações: variação -100% a +1000%</li>
            <li>Propriedades: -80% a +200%</li>
            <li>Depósitos: 8% a.a.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function gerarDicasEstrategicas() {
  return `
    <div class="dicas-content">
      <h3>💡 Dicas</h3>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border:1px solid var(--border-color); position:relative;">
        <div style="position:absolute; top:-10px; left:15px; background:var(--bg-primary); padding:0 5px;">💡</div>
        <h4>💰 Caixa</h4><p>Mantenha 65% para crédito.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border:1px solid var(--border-color); position:relative;">
        <div style="position:absolute; top:-10px; left:15px; background:var(--bg-primary); padding:0 5px;">💡</div>
        <h4>📈 Crescimento</h4><p>Invista em marketing regularmente.</p>
      </div>
      <div style="background:var(--bg-secondary); padding:15px; margin:10px 0; border:1px solid var(--border-color); position:relative;">
        <div style="position:absolute; top:-10px; left:15px; background:var(--bg-primary); padding:0 5px;">💡</div>
        <h4>⚖️ RH</h4><p>Misture classes A e D.</p>
      </div>
    </div>
  `;
}

function gerarAtalhos() {
  return `
    <div class="atalhos-content">
      <h3>⌨️ Atalhos</h3>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px;">
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">1</span>
          <span>RH</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">2</span>
          <span>Fornecedores</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">3</span>
          <span>Marketing</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">4</span>
          <span>Financeiro</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">5</span>
          <span>Investimentos</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">6</span>
          <span>Estratégia</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">7</span>
          <span>Contabilista</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">8</span>
          <span>Relatórios</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">9</span>
          <span>Histórico</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">0/H</span>
          <span>Ajuda</span>
        </div>
        <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-secondary); border-radius:5px;">
          <span style="background:var(--bg-tertiary); padding:3px 8px; border-radius:3px; font-weight:bold; color:var(--accent-gold); min-width:40px; text-align:center;">Espaço</span>
          <span>Pausar</span>
        </div>
      </div>
    </div>
  `;
}

function mostrarTutorialBasico() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarTutorialBasico();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarExplicacaoModulos() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarExplicacaoModulos();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarDicasEstrategicas() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarDicasEstrategicas();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarAtalhos() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarAtalhos();
  document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ============================================
// CSS ADICIONAL
// ============================================

const estiloAdicional = document.createElement('style');
estiloAdicional.textContent = `
  .notificacao {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-gold);
    color: #000;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .velocidade-botoes {
    display: inline-flex;
    gap: 5px;
    margin: 0 10px;
  }
  
  .velocidade-btn {
    padding: 5px 10px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .velocidade-btn.active {
    background: var(--accent-gold);
    color: #000;
    border-color: var(--accent-gold);
  }
  
  .velocidade-atual {
    color: var(--accent-gold);
    font-weight: 700;
    margin-left: 10px;
  }
  
  .tabela-container {
    overflow-x: auto;
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 5px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th {
    background: var(--bg-tertiary);
    padding: 12px;
    text-align: left;
    color: var(--accent-gold);
  }
  
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .text-success {
    color: var(--accent-green) !important;
  }
  
  .text-danger {
    color: var(--accent-red) !important;
  }
  
  .text-gold {
    color: var(--accent-gold) !important;
  }
  
  .btn-submit, .btn-pagar, .btn-danger, .btn-success {
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .btn-submit, .btn-pagar {
    background: var(--accent-gold);
    color: #000;
  }
  
  .btn-danger {
    background: var(--accent-red);
    color: #fff;
  }
  
  .btn-success {
    background: var(--accent-green);
    color: #fff;
  }
  
  .btn-submit:disabled, .btn-pagar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .form-container {
    max-width: 600px;
    margin: 50px auto;
    background: var(--bg-secondary);
    padding: 30px;
    border-radius: 12px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    color: var(--accent-gold);
  }
  
  .form-group input, .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
  }
  
  .welcome-screen {
    text-align: center;
    padding: 60px 20px;
  }
  
  .rh-status-bar {
    display: flex;
    justify-content: space-between;
    background: var(--bg-tertiary);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  
  .rh-input-group {
    margin: 10px 0;
  }
  
  .rh-input-group input {
    width: 100%;
    padding: 8px;
    margin-top: 5px;
  }
  
  .rh-calculo {
    background: var(--bg-tertiary);
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
  }
`;

document.head.appendChild(estiloAdicional);

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.mostrarRH = mostrarRH;
window.mostrarFornecedores = mostrarFornecedores;
window.mostrarMarketing = mostrarMarketing;
window.mostrarFinanceiro = mostrarFinanceiro;
window.mostrarInvestimentos = mostrarInvestimentos;
window.mostrarEstrategia = mostrarEstrategia;
window.mostrarContabilista = mostrarContabilista;
window.mostrarRelatorios = mostrarRelatorios;
window.mostrarHistorico = mostrarHistorico;
window.mostrarAjuda = mostrarAjuda;
window.mostrarNoticias = mostrarNoticias;
window.mostrarFornecedoresNacionais = mostrarFornecedoresNacionais;
window.mostrarFornecedoresInternacionais = mostrarFornecedoresInternacionais;
window.mostrarProducaoServicos = mostrarProducaoServicos;
window.mostrarEstoque = mostrarEstoque;
window.mostrarEstoqueDisponivel = mostrarEstoqueDisponivel;
window.mostrarEntregasPendentes = mostrarEntregasPendentes;
window.mostrarProducoesPendentes = mostrarProducoesPendentes;
window.mostrarCreditos = mostrarFinanceiro;
window.mostrarDepositos = mostrarDepositos;
window.mostrarTitulos = mostrarTitulos;
window.mostrarCambio = mostrarCambio;
window.mostrarAcoes = mostrarAcoes;
window.mostrarPropriedades = mostrarPropriedades;
window.mostrarHistoricoInvestimentos = mostrarHistoricoInvestimentos;
window.mostrarDepositosInternacionais = mostrarDepositosInternacionais;
window.mostrarTitulosInternacionais = mostrarTitulosInternacionais;
window.mostrarTutorialBasico = mostrarTutorialBasico;
window.mostrarExplicacaoModulos = mostrarExplicacaoModulos;
window.mostrarDicasEstrategicas = mostrarDicasEstrategicas;
window.mostrarAtalhos = mostrarAtalhos;
window.mostrarRelatorioMensal = mostrarRelatorioMensal;
window.mostrarRelatorioAnual = mostrarRelatorioAnual;
window.mostrarRelatorioClientes = mostrarRelatorioClientes;
window.mostrarRelatorioProdutividade = mostrarRelatorioProdutividade;

window.contratarFuncionarios = contratarFuncionarios;
window.demitirFuncionarios = demitirFuncionarios;
window.pagarSalarios = pagarSalarios;
window.pagarSegurancaSocial = pagarSegurancaSocial;
window.fazerFormacao = fazerFormacao;
window.comprarNacional = comprarNacional;
window.comprarInternacional = comprarInternacional;
window.iniciarProducaoServico = iniciarProducaoServico;
window.definirMargem = definirMargem;
window.venderProduto = venderProduto;
window.prepararExportacao = prepararExportacao;
window.investirMarketing = investirMarketing;
window.solicitarCreditoNacional = solicitarCreditoNacional;
window.solicitarCreditoInternacional = solicitarCreditoInternacional;
window.comprarUSD = comprarUSD;
window.venderUSD = venderUSD;
window.comprarAcao = comprarAcao;
window.venderAcao = venderAcao;
window.comprarPropriedade = comprarPropriedade;
window.venderPropriedade = venderPropriedade;
window.criarDeposito = criarDeposito;
window.resgatarDeposito = resgatarDeposito;
window.resgatarDepositoAntecipado = resgatarDepositoAntecipado;
window.comprarTitulo = comprarTitulo;
window.resgatarTitulo = resgatarTitulo;
window.criarDepositoUsd = criarDepositoUsd;
window.resgatarDepositoUsd = resgatarDepositoUsd;
window.resgatarDepositoUsdAntecipado = resgatarDepositoUsdAntecipado;
window.comprarTituloUsd = comprarTituloUsd;
window.resgatarTituloUsd = resgatarTituloUsd;
window.fecharParceria = fecharParceria;
window.expandirEmpresa = expandirEmpresa;
window.comprarLicencaExportacao = comprarLicencaExportacao;
window.pagarContabilista = pagarContabilista;
window.negociarMulta = negociarMulta;
window.pagarImpostoAnualSemMulta = pagarImpostoAnualSemMulta;
window.pagarImpostoAnualComMulta = pagarImpostoAnualComMulta;
window.negociarMultaAGT = negociarMultaAGT;
window.pagarMultaAGTVista = pagarMultaAGTVista;
window._marcarNoticiaLida = _marcarNoticiaLida;
window._marcarTodasNoticiasLidas = _marcarTodasNoticiasLidas;
window.reiniciarSimulacao = reiniciarSimulacao;
window.alterarVelocidade = alterarVelocidade;

// ============================================
// CÓDIGO DE SUPORTE - NOTÍCIAS EM TEMPO REAL + CÂMBIO
// ============================================

// ============================================
// CONFIGURAÇÕES ADICIONAIS
// ============================================

// Container para notícias (será criado dinamicamente)
let noticiasContainer = null;
let noticiasVisiveis = true;
let ultimaAtualizacaoNoticias = 0;

// Histórico de câmbio para gráfico
let historicoCambioDetalhado = [];

// ============================================
// INICIALIZAÇÃO DO PAINEL DE NOTÍCIAS
// ============================================

function inicializarPainelNoticias() {
    // Criar estrutura do painel se não existir
    if (!document.getElementById('painelNoticias')) {
        const mainContainer = document.querySelector('.simulador-main') || document.body;
        
        // Criar layout de dois painéis se não existir
        if (!document.querySelector('.dashboard-layout')) {
            const dashboardLayout = document.createElement('div');
            dashboardLayout.className = 'dashboard-layout';
            dashboardLayout.style.cssText = `
                display: flex;
                gap: 20px;
                padding: 20px;
                height: calc(100vh - 120px);
                overflow: hidden;
            `;
            
            // Mover conteúdo principal para dentro do layout
            const conteudoPrincipal = document.getElementById('conteudoPrincipal');
            const pai = conteudoPrincipal.parentNode;
            
            // Criar painel esquerdo (dashboard principal)
            const painelEsquerdo = document.createElement('div');
            painelEsquerdo.id = 'painelEsquerdo';
            painelEsquerdo.style.cssText = `
                flex: 2;
                overflow-y: auto;
                padding-right: 10px;
            `;
            
            // Criar painel direito (notícias)
            const painelDireito = document.createElement('div');
            painelDireito.id = 'painelNoticias';
            painelDireito.style.cssText = `
                flex: 1;
                background: var(--bg-secondary);
                border-radius: 12px;
                padding: 15px;
                overflow-y: auto;
                border-left: 1px solid var(--border-color);
                box-shadow: -2px 0 10px rgba(0,0,0,0.3);
                position: relative;
                min-width: 300px;
            `;
            
            // Mover elementos
            painelEsquerdo.appendChild(conteudoPrincipal);
            dashboardLayout.appendChild(painelEsquerdo);
            dashboardLayout.appendChild(painelDireito);
            pai.appendChild(dashboardLayout);
            
            // Adicionar botão toggle
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'toggleNoticias';
            toggleBtn.innerHTML = '📰';
            toggleBtn.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 50px;
                height: 50px;
                border-radius: 25px;
                background: var(--accent-gold);
                color: #000;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s;
            `;
            toggleBtn.onclick = togglePainelNoticias;
            document.body.appendChild(toggleBtn);
        }
        
        noticiasContainer = document.getElementById('painelNoticias');
    }
    
    // Iniciar atualização automática
    iniciarAtualizacaoNoticias();
}

function togglePainelNoticias() {
    if (!noticiasContainer) return;
    
    noticiasVisiveis = !noticiasVisiveis;
    noticiasContainer.style.display = noticiasVisiveis ? 'block' : 'none';
    
    const btn = document.getElementById('toggleNoticias');
    if (btn) {
        btn.style.transform = noticiasVisiveis ? 'rotate(0deg)' : 'rotate(180deg)';
        btn.title = noticiasVisiveis ? 'Ocultar Notícias' : 'Mostrar Notícias';
    }
}

function iniciarAtualizacaoNoticias() {
    // Atualizar a cada 30 segundos
    setInterval(() => {
        if (noticiasContainer && noticiasVisiveis) {
            atualizarPainelNoticias();
        }
    }, 30000);
    
    // Primeira atualização
    setTimeout(atualizarPainelNoticias, 1000);
}

function atualizarPainelNoticias() {
    if (!noticiasContainer) return;
    
    const naoLidas = noticiasSimulador.filter(n => !n.lida).length;
    const ultimasNoticias = noticiasSimulador.slice(0, 15);
    
    // Dados de câmbio para o mini-gráfico
    const dadosCambio = historicoCambioMensal.slice(-12);
    const variacaoCambio = dadosCambio.length > 1 ? 
        ((dadosCambio[dadosCambio.length-1].taxa - dadosCambio[0].taxa) / dadosCambio[0].taxa * 100).toFixed(1) : 0;
    
    let html = `
        <div class="noticias-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid var(--border-color);">
            <h3 style="color:var(--accent-gold); margin:0;">📰 Notícias em Tempo Real</h3>
            <span style="background:${naoLidas > 0 ? 'var(--accent-red)' : 'var(--bg-tertiary)'}; color:${naoLidas > 0 ? '#fff' : 'var(--text-secondary)'}; padding:3px 10px; border-radius:12px; font-size:12px;">
                ${naoLidas} nova${naoLidas !== 1 ? 's' : ''}
            </span>
        </div>
        
        <div class="cambio-mini" style="background:var(--bg-tertiary); padding:10px; border-radius:8px; margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="color:var(--text-secondary);">USD/Kz</span>
                    <h4 style="color:var(--accent-gold); margin:5px 0; font-size:20px;">${formatarMoeda(taxaCambio)}</h4>
                </div>
                <div style="text-align:right;">
                    <span style="color:${variacaoCambio >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size:14px;">
                        ${variacaoCambio >= 0 ? '▲' : '▼'} ${Math.abs(variacaoCambio)}%
                    </span>
                    <p style="color:var(--text-secondary); font-size:12px; margin:2px 0 0;">Últimos 12 meses</p>
                </div>
            </div>
            <div style="margin-top:10px;">
                <canvas id="miniGraficoCambio" width="250" height="60"></canvas>
            </div>
        </div>
        
        <div class="acoes-rapidas" style="display:flex; gap:5px; margin-bottom:15px;">
            <button onclick="mostrarNoticiasCompleta()" style="flex:1; padding:8px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer; font-size:12px;">
                📰 Ver Todas
            </button>
            <button onclick="_marcarTodasNoticiasLidas()" style="flex:1; padding:8px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer; font-size:12px;">
                ✅ Marcar Lidas
            </button>
        </div>
        
        <div class="noticias-lista" style="overflow-y:auto; max-height:calc(100vh - 350px);">
    `;
    
    if (ultimasNoticias.length === 0) {
        html += '<p style="text-align:center; color:var(--text-secondary); padding:20px;">Nenhuma notícia disponível</p>';
    } else {
        ultimasNoticias.forEach(n => {
            const tempo = calcularTempoDecorrido(n.data);
            html += `
                <div class="noticia-item" onclick="_marcarNoticiaLida(${n.id})" 
                     style="background:${n.lida ? 'var(--bg-tertiary)' : 'linear-gradient(145deg,#1a1500,#0f0c00)'};
                            border-left:4px solid ${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'};
                            padding:10px;
                            margin-bottom:8px;
                            border-radius:6px;
                            cursor:pointer;
                            transition:transform 0.2s;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'}; font-size:13px;">
                            ${n.titulo}
                        </strong>
                        <span style="color:var(--text-secondary); font-size:10px;">${tempo}</span>
                    </div>
                    <p style="color:var(--text-secondary); margin:0; font-size:12px;">${n.descricao}</p>
                    ${!n.lida ? '<span style="display:inline-block; width:6px; height:6px; background:var(--accent-gold); border-radius:50%; margin-top:5px;"></span>' : ''}
                </div>
            `;
        });
    }
    
    html += `
        </div>
        <div class="noticias-footer" style="margin-top:15px; padding-top:10px; border-top:1px solid var(--border-color);">
            <p style="color:var(--text-secondary); font-size:11px; text-align:center;">
                ⏱️ Atualizado: ${new Date().toLocaleTimeString()}
            </p>
        </div>
    `;
    
    noticiasContainer.innerHTML = html;
    
    // Desenhar mini gráfico
    setTimeout(() => desenharMiniGraficoCambio(), 100);
}

function calcularTempoDecorrido(dataString) {
    if (!dataString) return 'agora';
    
    const hoje = new Date();
    const dataNoticia = new Date(dataString.split('/').reverse().join('-'));
    const diffMs = hoje - dataNoticia;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras} h atrás`;
    if (diffDias < 7) return `${diffDias} d atrás`;
    return dataString;
}

function desenharMiniGraficoCambio() {
    const canvas = document.getElementById('miniGraficoCambio');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dados = historicoCambioMensal.slice(-12);
    
    if (dados.length < 2) return;
    
    const valores = dados.map(d => d.taxa);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const altura = canvas.height - 10;
    const largura = canvas.width - 20;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar linha
    ctx.beginPath();
    ctx.strokeStyle = 'var(--accent-gold)';
    ctx.lineWidth = 2;
    
    dados.forEach((d, i) => {
        const x = 10 + (i * (largura / (dados.length - 1)));
        const y = 5 + altura - ((d.taxa - min) / (max - min || 1) * altura);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Preencher área
    ctx.lineTo(10 + largura, canvas.height - 5);
    ctx.lineTo(10, canvas.height - 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
    ctx.fill();
}

// ============================================
// SISTEMA DE CÂMBIO MELHORADO
// ============================================

function _atualizarCambioMensalMelhorado() {
    const taxaAnterior = taxaCambio;
    
    // Variação mais realista baseada em eventos econômicos
    let variacaoBase = 0;
    
    // Influência do ciclo econômico
    if (cicloEconomico === 'crise') {
        variacaoBase += (Math.random() * 15) + 5; // Desvalorização em crise
    } else if (cicloEconomico === 'estavel') {
        variacaoBase += (Math.random() * 8) - 2;
    }
    
    // Influência da inflação
    variacaoBase += (inflacaoAtual / 100) * (Math.random() * 2);
    
    // Eventos aleatórios
    const eventoRaro = Math.random();
    if (eventoRaro < 0.05) {
        // Evento extremo (5% de chance)
        variacaoBase += (Math.random() * 30) - 15;
        _adicionarNoticia(
            '⚠️ Volatilidade Cambial Extrema',
            `O Kwanza sofreu uma variação atípica de ${variacaoBase > 0 ? '+' : ''}${variacaoBase.toFixed(1)}% neste mês.`,
            'cambio',
            true
        );
    }
    
    const fator = 1 + (variacaoBase / 100);
    taxaCambio = Math.round(taxaCambio * fator);
    
    // Limites mais realistas
    if (taxaCambio < 500) taxaCambio = 500;
    if (taxaCambio > 4500) taxaCambio = 4500;
    
    // Registrar histórico detalhado
    const registroCambio = {
        data: dataSimulador.toLocaleDateString(),
        mes: dataSimulador.toLocaleDateString('pt-PT', {month:'long', year:'numeric'}),
        taxa: taxaCambio,
        taxaAnterior: taxaAnterior,
        variacao: variacaoBase.toFixed(2),
        variacaoPercentual: ((taxaCambio - taxaAnterior) / taxaAnterior * 100).toFixed(2)
    };
    
    historicoCambioMensal.push(registroCambio);
    historicoCambioDetalhado.push(registroCambio);
    
    if (historicoCambioMensal.length > 24) {
        historicoCambioMensal = historicoCambioMensal.slice(-24);
    }
    if (historicoCambioDetalhado.length > 60) {
        historicoCambioDetalhado = historicoCambioDetalhado.slice(-60);
    }
    
    const sentido = taxaCambio > taxaAnterior ? 'subiu' : 'desceu';
    const variacaoAbs = Math.abs(((taxaCambio - taxaAnterior) / taxaAnterior * 100)).toFixed(1);
    
    // Notícia sobre câmbio
    _adicionarNoticia(
        `💱 Dólar ${sentido} para ${formatarMoeda(taxaCambio)} Kz`,
        `O dólar americano ${sentido} ${variacaoAbs}% neste mês. ${taxaCambio > taxaAnterior ? 'Importações ficam mais caras.' : 'Bom momento para comprar USD.'}`,
        'cambio',
        variacaoAbs > 8
    );
    
    // Verificar se precisa notificar sobre saldo USD
    if (estadoJogo.carteiraUsd > 0) {
        const valorEmKz = estadoJogo.carteiraUsd * taxaCambio;
        if (taxaCambio > taxaAnterior * 1.1) {
            _adicionarNoticia(
                '💰 Momento de Vender USD',
                `Com o dólar a ${formatarMoeda(taxaCambio)} Kz, suas reservas de ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')} USD valem ${formatarMoeda(valorEmKz)} Kz.`,
                'cambio',
                false
            );
        } else if (taxaCambio < taxaAnterior * 0.9) {
            _adicionarNoticia(
                '💵 Momento de Comprar USD',
                `Dólar mais barato: ${formatarMoeda(taxaCambio)} Kz. Oportunidade para aumentar reservas.`,
                'cambio',
                false
            );
        }
    }
    
    if (typeof salvarEstadoSimulacao === 'function') salvarEstadoSimulacao();
}

// ============================================
// FUNÇÕES DE CÂMBIO CORRIGIDAS
// ============================================

function comprarUSDCorrigido() {
    const quantidade = parseFloat(document.getElementById('quantidade-usd-comprar')?.value);
    
    if (!quantidade || quantidade <= 0) {
        notificar('❌ Quantidade inválida');
        return;
    }
    
    const custoKz = quantidade * taxaCambio;
    
    if (estadoJogo.carteiraKz < custoKz) {
        notificar('❌ Saldo insuficiente em Kz');
        return;
    }
    
    // Registrar transação
    estadoJogo.carteiraKz -= custoKz;
    estadoJogo.carteiraUsd += quantidade;
    
    registrarTransacao('cambio', 'saida', custoKz, 'Kz', `Compra de ${quantidade} USD à taxa ${formatarMoeda(taxaCambio)}`);
    
    // Notícia da operação
    _adicionarNoticia(
        '💱 Operação de Câmbio',
        `Comprou ${formatarMoeda(quantidade, 'USD')} USD por ${formatarMoeda(custoKz)} Kz.`,
        'cambio',
        false
    );
    
    notificar(`✅ Compra de ${quantidade} USD realizada! Saldo USD: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')}`);
    salvarEstadoSimulacao();
    
    // Atualizar interface
    if (typeof mostrarCambio === 'function') mostrarCambio();
    atualizarCarteiras();
    atualizarPainelNoticias();
}

function venderUSDCorrigido() {
    const quantidade = parseFloat(document.getElementById('quantidade-usd-vender')?.value);
    
    if (!quantidade || quantidade <= 0) {
        notificar('❌ Quantidade inválida');
        return;
    }
    
    if (estadoJogo.carteiraUsd < quantidade) {
        notificar(`❌ Saldo USD insuficiente. Disponível: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')} USD`);
        return;
    }
    
    const valorKz = quantidade * taxaCambio;
    
    // Registrar transação
    estadoJogo.carteiraUsd -= quantidade;
    estadoJogo.carteiraKz += valorKz;
    
    registrarTransacao('cambio', 'entrada', valorKz, 'Kz', `Venda de ${quantidade} USD à taxa ${formatarMoeda(taxaCambio)}`);
    
    // Notícia da operação
    _adicionarNoticia(
        '💱 Operação de Câmbio',
        `Vendeu ${formatarMoeda(quantidade, 'USD')} USD por ${formatarMoeda(valorKz)} Kz.`,
        'cambio',
        false
    );
    
    notificar(`✅ Venda de ${quantidade} USD realizada! Recebeu ${formatarMoeda(valorKz)} Kz`);
    salvarEstadoSimulacao();
    
    // Atualizar interface
    if (typeof mostrarCambio === 'function') mostrarCambio();
    atualizarCarteiras();
    atualizarPainelNoticias();
}

// ============================================
// FUNÇÃO PARA MOSTRAR NOTÍCIAS COMPLETAS
// ============================================

function mostrarNoticiasCompleta() {
    const naoLidas = noticiasSimulador.filter(n => !n.lida).length;
    
    let html = `
        <div style="padding:20px; max-width:1200px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <h2 style="color:var(--accent-gold);">📰 Central de Notícias</h2>
                <div style="display:flex; gap:10px;">
                    <span style="background:var(--bg-tertiary); color:var(--text-secondary); padding:5px 15px; border-radius:20px;">
                        Total: ${noticiasSimulador.length}
                    </span>
                    <span style="background:${naoLidas > 0 ? 'var(--accent-red)' : 'var(--bg-tertiary)'}; color:${naoLidas > 0 ? '#fff' : 'var(--text-secondary)'}; padding:5px 15px; border-radius:20px;">
                        ${naoLidas} não lida${naoLidas !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:30px;">
                <div style="background:var(--bg-secondary); padding:20px; border-radius:12px;">
                    <h3 style="color:var(--accent-gold); margin-bottom:15px;">📊 Resumo Cambial</h3>
                    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px;">
                        <div>
                            <p style="color:var(--text-secondary);">Taxa Atual</p>
                            <p style="color:var(--accent-gold); font-size:24px; font-weight:700;">${formatarMoeda(taxaCambio)}</p>
                        </div>
                        <div>
                            <p style="color:var(--text-secondary);">Variação Mensal</p>
                            <p style="color:${historicoCambioMensal.length > 1 ? 
                                (historicoCambioMensal[historicoCambioMensal.length-1].taxa > historicoCambioMensal[0].taxa ? 'var(--accent-green)' : 'var(--accent-red)') 
                                : 'var(--text-secondary)'}; font-size:20px;">
                                ${historicoCambioMensal.length > 1 ? 
                                    ((historicoCambioMensal[historicoCambioMensal.length-1].taxa - historicoCambioMensal[0].taxa) / historicoCambioMensal[0].taxa * 100).toFixed(1) + '%' 
                                    : '0%'}
                            </p>
                        </div>
                    </div>
                    <canvas id="graficoCambioCompleto" style="margin-top:20px; width:100%; height:200px;"></canvas>
                </div>
                
                <div style="background:var(--bg-secondary); padding:20px; border-radius:12px;">
                    <h3 style="color:var(--accent-gold); margin-bottom:15px;">📈 Estatísticas</h3>
                    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px;">
                        <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
                            <p style="color:var(--text-secondary); font-size:12px;">Notícias Importantes</p>
                            <p style="color:var(--accent-red); font-size:20px; font-weight:700;">${noticiasSimulador.filter(n => n.importante).length}</p>
                        </div>
                        <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
                            <p style="color:var(--text-secondary); font-size:12px;">Categoria Economia</p>
                            <p style="color:var(--accent-gold); font-size:20px; font-weight:700;">${noticiasSimulador.filter(n => n.categoria === 'economia').length}</p>
                        </div>
                        <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
                            <p style="color:var(--text-secondary); font-size:12px;">Categoria Cambio</p>
                            <p style="color:var(--accent-gold); font-size:20px; font-weight:700;">${noticiasSimulador.filter(n => n.categoria === 'cambio').length}</p>
                        </div>
                        <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
                            <p style="color:var(--text-secondary); font-size:12px;">Categoria Bolsa</p>
                            <p style="color:var(--accent-gold); font-size:20px; font-weight:700;">${noticiasSimulador.filter(n => n.categoria === 'bolsa').length}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background:var(--bg-secondary); border-radius:12px; padding:20px;">
                <h3 style="color:var(--accent-gold); margin-bottom:20px;">📋 Todas as Notícias</h3>
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <button onclick="filtrarNoticias('todas')" class="filtro-btn ativo" style="padding:8px 15px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Todas</button>
                    <button onclick="filtrarNoticias('naolidas')" class="filtro-btn" style="padding:8px 15px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;">Não Lidas</button>
                    <button onclick="filtrarNoticias('importantes')" class="filtro-btn" style="padding:8px 15px; background:var(--bg-tertiary); color:var(--text-primary); border:none; border-radius:4px; cursor:pointer;">Importantes</button>
                </div>
                
                <div id="listaNoticiasCompleta" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px,1fr)); gap:15px;">
                    ${gerarListaNoticiasHTML(noticiasSimulador)}
                </div>
            </div>
            
            <div style="margin-top:20px; text-align:center;">
                <button onclick="mostrarDashboardInicial()" style="padding:10px 30px; background:var(--accent-gold); color:#000; border:none; border-radius:4px; cursor:pointer;">Voltar ao Dashboard</button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Desenhar gráfico completo
    setTimeout(() => {
        const canvas = document.getElementById('graficoCambioCompleto');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const dados = historicoCambioMensal.slice(-24);
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dados.map(d => d.mes),
                    datasets: [{
                        label: 'Taxa de Câmbio USD/Kz',
                        data: dados.map(d => d.taxa),
                        borderColor: '#d4af37',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            ticks: { color: '#b0b0b0' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#b0b0b0', maxRotation: 45 }
                        }
                    }
                }
            });
        }
    }, 100);
}

function gerarListaNoticiasHTML(noticias) {
    if (noticias.length === 0) {
        return '<p style="text-align:center; padding:40px; color:var(--text-secondary);">Nenhuma notícia encontrada</p>';
    }
    
    return noticias.map(n => `
        <div class="noticia-card" style="background:${n.lida ? 'var(--bg-tertiary)' : 'linear-gradient(145deg,#1a1500,#0f0c00)'}; 
                    border-left:4px solid ${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'};
                    padding:15px; border-radius:8px; cursor:pointer;"
             onclick="_marcarNoticiaLida(${n.id})">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="color:${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'}; font-weight:700;">${n.titulo}</span>
                <span style="color:var(--text-secondary); font-size:12px;">${n.data}</span>
            </div>
            <p style="color:var(--text-secondary); margin-bottom:10px; font-size:14px;">${n.descricao}</p>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="background:var(--bg-secondary); color:var(--text-secondary); padding:3px 8px; border-radius:12px; font-size:11px;">
                    ${n.categoria}
                </span>
                ${!n.lida ? '<span style="color:var(--accent-gold); font-size:11px;">● Nova</span>' : ''}
            </div>
        </div>
    `).join('');
}

function filtrarNoticias(tipo) {
    // Atualizar botões
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.color = 'var(--text-primary)';
    });
    event.target.style.background = 'var(--accent-gold)';
    event.target.style.color = '#000';
    
    // Filtrar notícias
    let noticiasFiltradas = [];
    switch(tipo) {
        case 'naolidas':
            noticiasFiltradas = noticiasSimulador.filter(n => !n.lida);
            break;
        case 'importantes':
            noticiasFiltradas = noticiasSimulador.filter(n => n.importante);
            break;
        default:
            noticiasFiltradas = noticiasSimulador;
    }
    
    document.getElementById('listaNoticiasCompleta').innerHTML = gerarListaNoticiasHTML(noticiasFiltradas);
}

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM O SIMULADOR
// ============================================


const _comprarUSDOriginal = comprarUSD;
comprarUSD = comprarUSDCorrigido;

const _venderUSDOriginal = venderUSD;
venderUSD = venderUSDCorrigido;

// Adicionar atalho para notícias
document.addEventListener('keydown', (e) => {
    if (e.key === 'N' || e.key === 'n') {
        if (noticiasVisiveis) {
            mostrarNoticiasCompleta();
        } else {
            togglePainelNoticias();
        }
    }
});

// ============================================
// INICIALIZAÇÃO DO PAINEL
// ============================================

// Executar após carregamento completo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarPainelNoticias, 1500);
    });
} else {
    setTimeout(inicializarPainelNoticias, 1500);
}

// Exportar funções
window.mostrarNoticiasCompleta = mostrarNoticiasCompleta;
window.filtrarNoticias = filtrarNoticias;
window.togglePainelNoticias = togglePainelNoticias;
window.comprarUSD = comprarUSDCorrigido;
window.venderUSD = venderUSDCorrigido;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  iniciarSimulador();
});

// ============================================
// SISTEMA AVANÇADO DE NOTÍCIAS, EVENTOS E INDICADORES ECONÔMICOS
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

// Indicadores Econômicos Globais
let indicadoresEconomicos = {
    inflacao: 23.4,
    pibCrescimento: 2.1,
    dividaPublica: 68.5,
    reservasInternacionais: 15000000000, // 15 bilhões USD
    balancaComercial: -500000000, // -500 milhões (déficit)
    precoPetroleo: 75,
    taxaBNA: 19.5,
    confiancaConsumidor: 45, // 0-100
    riscoPais: 850, // pontos base
    investimentoEstrangeiro: 2000000000 // 2 bilhões USD
};

// Relações Diplomáticas Detalhadas
let relacoesDiplomaticas = {
    china: { nivel: 'boa', tarifa: 0.02, prazoMultiplicador: 1.0, creditoDisponivel: true, jurosBonus: -0.02 },
    portugal: { nivel: 'boa', tarifa: 0.02, prazoMultiplicador: 1.0, creditoDisponivel: true, jurosBonus: -0.02 },
    brasil: { nivel: 'boa', tarifa: 0.02, prazoMultiplicador: 1.0, creditoDisponivel: true, jurosBonus: -0.02 },
    russia: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    eua: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    africaSul: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    alemanha: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    reinoUnido: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    franca: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 },
    india: { nivel: 'normal', tarifa: 0.15, prazoMultiplicador: 1.3, creditoDisponivel: true, jurosBonus: 0 }
};

// Eventos Ativos
let eventosAtivos = [];
let historicoEventos = [];

// Timer para eventos
let intervaloEventos = null;

// ============================================
// SISTEMA DE INDICADORES ECONÔMICOS
// ============================================

function atualizarIndicadoresEconomicos() {
    const indicadoresAnteriores = {...indicadoresEconomicos};
    
    // Atualizar inflação (variação suave)
    const variacaoInflacao = (Math.random() * 2) - 0.5;
    indicadoresEconomicos.inflacao = Math.max(5, Math.min(80, 
        indicadoresEconomicos.inflacao + variacaoInflacao));
    
    // Atualizar preço do petróleo
    const variacaoPetroleo = (Math.random() * 8) - 4;
    indicadoresEconomicos.precoPetroleo = Math.max(40, Math.min(120,
        indicadoresEconomicos.precoPetroleo + variacaoPetroleo));
    
    // Atualizar PIB (anual)
    if (dataSimulador.getMonth() === 0 && dataSimulador.getDate() === 1) {
        const variacaoPIB = (Math.random() * 4) - 1;
        indicadoresEconomicos.pibCrescimento = Math.max(-5, Math.min(8,
            indicadoresEconomicos.pibCrescimento + variacaoPIB));
        
        _adicionarNoticia(
            '📊 PIB Anual Divulgado',
            `O PIB de Angola ${indicadoresEconomicos.pibCrescimento >= 0 ? 'cresceu' : 'contraiu'} ${Math.abs(indicadoresEconomicos.pibCrescimento).toFixed(1)}% no último ano.`,
            'economia',
            Math.abs(indicadoresEconomicos.pibCrescimento) > 3
        );
    }
    
    // Atualizar dívida pública (semestral)
    if (dataSimulador.getMonth() === 5 && dataSimulador.getDate() === 1) {
        const variacaoDivida = (Math.random() * 5) - 2;
        indicadoresEconomicos.dividaPublica = Math.max(40, Math.min(120,
            indicadoresEconomicos.dividaPublica + variacaoDivida));
        
        if (indicadoresEconomicos.dividaPublica > 70) {
            _adicionarNoticia(
                '⚠️ Dívida Pública Preocupa',
                `Dívida pública atinge ${indicadoresEconomicos.dividaPublica.toFixed(1)}% do PIB. Acima do limite recomendado de 70%.`,
                'economia',
                true
            );
        }
    }
    
    // Atualizar taxa BNA (quando necessário)
    if (deveAtualizarTaxaBNA()) {
        atualizarTaxaBNA();
    }
    
    // Verificar impactos nos negócios do jogador
    verificarImpactosEconomicos(indicadoresAnteriores);
    
    return indicadoresEconomicos;
}

function deveAtualizarTaxaBNA() {
    // BNA atualiza taxa quando inflação muda significativamente
    return Math.random() < 0.1 || // 10% chance diária
           Math.abs(indicadoresEconomicos.inflacao - 15) > 5; // Inflação muito fora da meta
}

function atualizarTaxaBNA() {
    const taxaAnterior = indicadoresEconomicos.taxaBNA;
    
    // Taxa base = 15% (meta) + (inflação - 15) * 0.5
    let novaTaxa = 15 + (indicadoresEconomicos.inflacao - 15) * 0.5;
    
    // Adicionar prêmio de risco
    if (indicadoresEconomicos.dividaPublica > 70) {
        novaTaxa += 3;
    }
    if (indicadoresEconomicos.reservasInternacionais < 10000000000) {
        novaTaxa += 2;
    }
    
    novaTaxa = Math.max(10, Math.min(35, Math.round(novaTaxa * 10) / 10));
    indicadoresEconomicos.taxaBNA = novaTaxa;
    
    if (Math.abs(novaTaxa - taxaAnterior) > 0.5) {
        const direcao = novaTaxa > taxaAnterior ? 'subiu' : 'desceu';
        _adicionarNoticia(
            '🏦 BNA Altera Taxa de Juro',
            `Banco Nacional de Angola ${direcao} a taxa directora para ${novaTaxa}% ao ano. Crédito fica ${novaTaxa > taxaAnterior ? 'mais caro' : 'mais barato'}.`,
            'economia',
            Math.abs(novaTaxa - taxaAnterior) > 2
        );
    }
}

// ============================================
// POOL DE EVENTOS COMPLETO
// ============================================

const poolEventos = [
    // 1. CRISE CAMBIAL
    {
        id: 'crise_cambial',
        titulo: '💱 Crise Cambial',
        descricao: 'O kwanza desvalorizou 30% face ao dólar devido à instabilidade.',
        categoria: 'economia',
        probabilidade: 0.05,
        condicao: () => indicadoresEconomicos.inflacao > 25 || indicadoresEconomicos.dividaPublica > 70,
        impacto: {
            taxaCambioMultiplier: 1.30,
            inflacaoMultiplier: 1.20,
            vendasMultiplier: 0.90,
            exportacoesMultiplier: 1.40,
            importacoesMultiplier: 0.60,
            duracao: 90
        },
        noticia: '🇦🇴 BNA anuncia intervenção cambial após pressão externa sobre o Kwanza.'
    },
    
    // 2. BOOM DE CONSUMO
    {
        id: 'boom_consumo',
        titulo: '🛍️ Boom de Consumo',
        descricao: 'Aumento do poder de compra impulsiona vendas.',
        categoria: 'economia',
        probabilidade: 0.08,
        condicao: () => indicadoresEconomicos.inflacao < 15 && indicadoresEconomicos.pibCrescimento > 3,
        impacto: {
            vendasMultiplier: 1.25,
            clientesNacionaisMultiplier: 1.30,
            marketingEfetividade: 1.50,
            duracao: 60
        },
        noticia: '📈 Confiança do consumidor atinge máximo histórico em Angola.'
    },
    
    // 3. RECESSÃO ECONÓMICA
    {
        id: 'recessao',
        titulo: '📉 Recessão Económica',
        descricao: 'Queda generalizada na atividade económica.',
        categoria: 'economia',
        probabilidade: 0.03,
        condicao: () => indicadoresEconomicos.pibCrescimento < 0,
        impacto: {
            vendasMultiplier: 0.70,
            clientesMultiplier: 0.80,
            creditoDisponivelMultiplier: 0.50,
            demissoesObrigatorias: true,
            duracao: 180
        },
        noticia: '🏛️ Governo anuncia pacote de estímulo para combater recessão.'
    },
    
    // 4. INFLAÇÃO ELEVADA
    {
        id: 'inflacao_alta',
        titulo: '🔥 Inflação Elevada',
        descricao: 'Aumento generalizado de preços afeta poder de compra.',
        categoria: 'economia',
        probabilidade: 0.06,
        condicao: () => indicadoresEconomicos.inflacao > 20,
        impacto: {
            custosFornecedoresMultiplier: 1.20,
            vendasMultiplier: 0.85,
            salariosReajuste: 1.15,
            duracao: 120
        },
        noticia: `📊 Taxa de inflação ultrapassa ${indicadoresEconomicos.inflacao.toFixed(1)}% ao ano.`
    },
    
    // 5. ACORDO DIPLOMÁTICO
    {
        id: 'acordo_diplomatico',
        titulo: '🤝 Acordo Diplomático',
        descricao: 'Angola assina acordo comercial com bloco de países.',
        categoria: 'diplomacia',
        probabilidade: 0.04,
        condicao: () => true,
        impacto: {
            paisesAfetados: ['china', 'portugal', 'brasil'],
            novaRelacao: 'boa',
            tarifaMultiplier: 0.50,
            creditoJurosBonus: -0.03,
            duracao: 365
        },
        noticia: '🌍 Novo acordo reduz tarifas para parceiros estratégicos.'
    },
    
    // 6. TENSÕES DIPLOMÁTICAS
    {
        id: 'tensoes_diplomaticas',
        titulo: '⚔️ Tensões Diplomáticas',
        descricao: 'Desentendimento político afeta relações comerciais.',
        categoria: 'diplomacia',
        probabilidade: 0.03,
        condicao: () => true,
        impacto: {
            paisAleatorio: true,
            novaRelacao: 'ruim',
            tarifaMultiplier: 2.0,
            prazoMultiplier: 1.5,
            creditoBloqueado: true,
            duracao: 180
        },
        noticia: '⚠️ Embaixador convocado para consultas após declarações polémicas.'
    },
    
    // 7. AVANÇO TECNOLÓGICO
    {
        id: 'inovacao_tecnologica',
        titulo: '💻 Avanço Tecnológico',
        descricao: 'Nova tecnologia aumenta produtividade do setor.',
        categoria: 'setorial',
        probabilidade: 0.02,
        condicao: () => estadoJogo.areaAtuacao === 'servicos' || estadoJogo.areaAtuacao === 'hibrido',
        impacto: {
            produtividadeServicosMultiplier: 1.15,
            tempoProducaoMultiplier: 0.80,
            custoProducaoMultiplier: 0.90,
            duracao: 0 // Permanente
        },
        noticia: '🚀 Startup angolana desenvolve solução inovadora para serviços.'
    },
    
    // 8. ESCASSEZ DE INSUMOS
    {
        id: 'escassez_insumos',
        titulo: '📦 Escassez de Insumos',
        descricao: 'Problemas logísticos afetam fornecimento.',
        categoria: 'setorial',
        probabilidade: 0.04,
        condicao: () => true,
        impacto: {
            prazosFornecedoresMultiplier: 1.50,
            custosFornecedoresMultiplier: 1.30,
            estoqueMinimoMultiplier: 2.0,
            duracao: 90
        },
        noticia: '⛴️ Atrasos no Porto de Luanda afetam importações e fornecimento.'
    },
    
    // 9. CRISE FINANCEIRA GLOBAL
    {
        id: 'crise_financeira_global',
        titulo: '🌍 CRISE FINANCEIRA GLOBAL',
        descricao: 'Mercados internacionais em colapso. Efeitos sentidos globalmente.',
        categoria: 'global',
        probabilidade: 0.01,
        condicao: () => true,
        impacto: {
            vendasMultiplier: 0.50,
            creditoDisponivelMultiplier: 0.30,
            jurosMultiplier: 2.0,
            acoesMultiplier: 0.50,
            imoveisMultiplier: 0.70,
            duracao: 365
        },
        noticia: '🚨 ALERTA GLOBAL: Bancos centrais coordenam esforços para conter crise.'
    },
    
    // 10. PANDEMIA
    {
        id: 'pandemia',
        titulo: '🦠 Pandemia Global',
        descricao: 'Crise sanitária afeta economia mundial.',
        categoria: 'global',
        probabilidade: 0.005,
        condicao: () => true,
        impacto: {
            vendasMultiplier: 0.40,
            custosLogisticaMultiplier: 2.0,
            funcionariosDisponiveisMultiplier: 0.60,
            auxilioGoverno: true,
            duracao: 540
        },
        noticia: '🏥 OMS declara emergência de saúde pública internacional.'
    },
    
    // 11. VALORIZAÇÃO DO PETRÓLEO
    {
        id: 'petroleo_alta',
        titulo: '🛢️ Petróleo em Alta',
        descricao: 'Preço do barril dispara no mercado internacional.',
        categoria: 'economia',
        probabilidade: 0.05,
        condicao: () => true,
        impacto: {
            petroleoMultiplier: 1.30,
            reservasInternacionaisMultiplier: 1.15,
            investimentoEstrangeiroMultiplier: 1.25,
            duracao: 60
        },
        noticia: `💰 Brent atinge $${(indicadoresEconomicos.precoPetroleo * 1.3).toFixed(2)} com tensões no Oriente Médio.`
    },
    
    // 12. QUEDA DO PETRÓLEO
    {
        id: 'petroleo_baixa',
        titulo: '📉 Petróleo em Queda',
        descricao: 'Excesso de oferta pressiona preços.',
        categoria: 'economia',
        probabilidade: 0.05,
        condicao: () => true,
        impacto: {
            petroleoMultiplier: 0.70,
            reservasInternacionaisMultiplier: 0.85,
            investimentoEstrangeiroMultiplier: 0.75,
            duracao: 90
        },
        noticia: `📊 Brent cai para $${(indicadoresEconomicos.precoPetroleo * 0.7).toFixed(2)} com aumento de produção.`
    },
    
    // 13. INVESTIMENTO CHINÊS
    {
        id: 'investimento_chines',
        titulo: '🇨🇳 Investimento Chinês',
        descricao: 'China anuncia novo pacote de investimentos em Angola.',
        categoria: 'diplomacia',
        probabilidade: 0.03,
        condicao: () => relacoesDiplomaticas.china.nivel === 'boa',
        impacto: {
            investimentoEstrangeiroMultiplier: 1.50,
            creditoInternacionalDisponivel: true,
            relacaoChina: 'boa',
            duracao: 180
        },
        noticia: '🤝 China reforça parceria estratégica com Angola em infraestruturas.'
    },
    
    // 14. GREVE GERAL
    {
        id: 'greve_geral',
        titulo: '✊ Greve Geral',
        descricao: 'Sindicatos organizam paralisação nacional.',
        categoria: 'politica',
        probabilidade: 0.02,
        condicao: () => indicadoresEconomicos.inflacao > 25,
        impacto: {
            produtividadeMultiplier: 0.50,
            vendasMultiplier: 0.60,
            duracao: 15
        },
        noticia: '⚠️ Greve geral afeta comércio e serviços em todo o país.'
    },
    
    // 15. QUEBRA DE SAFRA
    {
        id: 'quebra_safra',
        titulo: '🌾 Quebra de Safra',
        descricao: 'Condições climáticas adversas afetam produção agrícola.',
        categoria: 'setorial',
        probabilidade: 0.03,
        condicao: () => estadoJogo.areaAtuacao === 'produtos' || estadoJogo.areaAtuacao === 'hibrido',
        impacto: {
            custosMateriaPrimaMultiplier: 1.40,
            prazosFornecedoresMultiplier: 1.30,
            duracao: 120
        },
        noticia: '🌧️ Estiagem afeta produção agrícola no sul de Angola.'
    }
];

// ============================================
// GESTÃO DE EVENTOS
// ============================================

function verificarEventosEconomicos() {
    // Verificar cada evento no pool
    poolEventos.forEach(evento => {
        // Verificar probabilidade e condição
        if (Math.random() < evento.probabilidade && evento.condicao()) {
            ativarEvento(evento);
        }
    });
    
    // Verificar eventos diplomáticos (mudanças graduais)
    verificarMudancasDiplomaticas();
}

function ativarEvento(evento) {
    const idEvento = `${evento.id}_${Date.now()}`;
    
    // Criar cópia do impacto
    const impacto = {...evento.impacto};
    
    // Processar impactos especiais
    if (impacto.paisAleatorio) {
        const paises = Object.keys(relacoesDiplomaticas);
        const paisEscolhido = paises[Math.floor(Math.random() * paises.length)];
        impacto.paisAfetado = paisEscolhido;
        delete impacto.paisAleatorio;
    }
    
    // Registrar evento ativo
    eventosAtivos.push({
        id: idEvento,
        eventoId: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        impacto: impacto,
        dataInicio: dataSimulador.toLocaleDateString(),
        dataFim: new Date(dataSimulador.getTime() + (impacto.duracao || 30) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        diasRestantes: impacto.duracao || 30,
        ativo: true
    });
    
    // Registrar no histórico
    historicoEventos.push({
        id: idEvento,
        titulo: evento.titulo,
        descricao: evento.descricao,
        data: dataSimulador.toLocaleDateString(),
        impacto: impacto
    });
    
    // Aplicar impactos imediatos
    aplicarImpactosEvento(evento, impacto);
    
    // Gerar notícia
    _adicionarNoticia(
        evento.titulo,
        evento.noticia || evento.descricao,
        evento.categoria,
        evento.categoria === 'global' || evento.categoria === 'crise'
    );
    
    // Notificação especial
    notificar(`📢 ${evento.titulo}: ${evento.descricao}`);
    
    // Atualizar painel de indicadores
    atualizarPainelIndicadores();
}

function aplicarImpactosEvento(evento, impacto) {
    // Impacto na taxa de câmbio
    if (impacto.taxaCambioMultiplier) {
        taxaCambio = Math.round(taxaCambio * impacto.taxaCambioMultiplier);
    }
    
    // Impacto na inflação
    if (impacto.inflacaoMultiplier) {
        indicadoresEconomicos.inflacao = Math.min(80, 
            indicadoresEconomicos.inflacao * impacto.inflacaoMultiplier);
    }
    
    // Impacto no preço do petróleo
    if (impacto.petroleoMultiplier) {
        indicadoresEconomicos.precoPetroleo = Math.min(120,
            indicadoresEconomicos.precoPetroleo * impacto.petroleoMultiplier);
    }
    
    // Impacto nas reservas internacionais
    if (impacto.reservasInternacionaisMultiplier) {
        indicadoresEconomicos.reservasInternacionais *= impacto.reservasInternacionaisMultiplier;
    }
    
    // Impacto diplomático
    if (impacto.paisesAfetados) {
        impacto.paisesAfetados.forEach(pais => {
            if (relacoesDiplomaticas[pais]) {
                relacoesDiplomaticas[pais].nivel = impacto.novaRelacao || 'boa';
                relacoesDiplomaticas[pais].tarifa = impacto.novaRelacao === 'boa' ? 0.02 : 0.15;
                relacoesDiplomaticas[pais].jurosBonus = impacto.novaRelacao === 'boa' ? -0.02 : 0;
            }
        });
    }
    
    if (impacto.paisAfetado && relacoesDiplomaticas[impacto.paisAfetado]) {
        relacoesDiplomaticas[impacto.paisAfetado].nivel = impacto.novaRelacao || 'ruim';
        relacoesDiplomaticas[impacto.paisAfetado].tarifa = impacto.novaRelacao === 'ruim' ? 0.50 : 0.15;
        relacoesDiplomaticas[impacto.paisAfetado].prazoMultiplicador = impacto.prazoMultiplier || 1.5;
        relacoesDiplomaticas[impacto.paisAfetado].creditoDisponivel = !impacto.creditoBloqueado;
    }
}

function verificarEventosExpirados() {
    const hoje = dataSimulador.toLocaleDateString();
    
    eventosAtivos = eventosAtivos.filter(evento => {
        if (evento.dataFim === hoje) {
            // Remover impactos do evento
            removerImpactosEvento(evento);
            return false;
        }
        
        // Atualizar dias restantes
        evento.diasRestantes = calcularDiasRestantes(evento.dataFim);
        return true;
    });
}

function removerImpactosEvento(evento) {
    // Implementar remoção gradual dos impactos
    // (Voltar aos valores normais)
    notificar(`✅ Fim do evento: ${evento.titulo}`);
}

function verificarMudancasDiplomaticas() {
    // 10% chance por trimestre de mudança diplomática
    if (dataSimulador.getMonth() % 3 === 0 && dataSimulador.getDate() === 1) {
        if (Math.random() < 0.1) {
            const paises = Object.keys(relacoesDiplomaticas);
            const pais = paises[Math.floor(Math.random() * paises.length)];
            
            // Países que nunca ficam ruins
            const paisesProtegidos = ['china', 'portugal', 'brasil'];
            
            if (!paisesProtegidos.includes(pais)) {
                const niveis = ['boa', 'normal', 'ruim'];
                const nivelAtual = relacoesDiplomaticas[pais].nivel;
                let novoNivel;
                
                do {
                    novoNivel = niveis[Math.floor(Math.random() * niveis.length)];
                } while (novoNivel === nivelAtual);
                
                relacoesDiplomaticas[pais].nivel = novoNivel;
                
                // Atualizar tarifas e prazos
                switch(novoNivel) {
                    case 'boa':
                        relacoesDiplomaticas[pais].tarifa = 0.02;
                        relacoesDiplomaticas[pais].prazoMultiplicador = 1.0;
                        relacoesDiplomaticas[pais].creditoDisponivel = true;
                        relacoesDiplomaticas[pais].jurosBonus = -0.02;
                        break;
                    case 'normal':
                        relacoesDiplomaticas[pais].tarifa = 0.15;
                        relacoesDiplomaticas[pais].prazoMultiplicador = 1.3;
                        relacoesDiplomaticas[pais].creditoDisponivel = true;
                        relacoesDiplomaticas[pais].jurosBonus = 0;
                        break;
                    case 'ruim':
                        relacoesDiplomaticas[pais].tarifa = 0.50;
                        relacoesDiplomaticas[pais].prazoMultiplicador = 1.8;
                        relacoesDiplomaticas[pais].creditoDisponivel = false;
                        relacoesDiplomaticas[pais].jurosBonus = 0.05;
                        break;
                }
                
                _adicionarNoticia(
                    '🌍 Mudança Diplomática',
                    `Relações com ${pais.toUpperCase()} agora são ${novoNivel}. Tarifas ajustadas.`,
                    'diplomacia',
                    novoNivel === 'ruim'
                );
            }
        }
    }
}

// ============================================
// IMPACTOS NOS NEGÓCIOS DO JOGADOR
// ============================================

function verificarImpactosEconomicos(indicadoresAnteriores) {
    // Impacto da inflação nas vendas
    if (indicadoresEconomicos.inflacao > 30) {
        // Inflação > 30%: Bancos internacionais rejeitam créditos
        if (emprestimos.length > 0) {
            _adicionarNoticia(
                '🏦 Crédito Internacional Bloqueado',
                'Com inflação acima de 30%, bancos internacionais suspendem novas linhas de crédito.',
                'economia',
                true
            );
        }
    }
    
    if (indicadoresEconomicos.inflacao >= 15 && indicadoresEconomicos.inflacao <= 25) {
        // Redução de (inflação)% nas vendas
        const impactoVendas = 1 - (indicadoresEconomicos.inflacao / 1000);
        // Aplicado em processarVendasDiarias
    }
    
    if (indicadoresEconomicos.inflacao < 10) {
        // Bónus de +5% nas vendas
        _adicionarNoticia(
            '📈 Ambiente Económico Favorável',
            'Inflação controlada estimula consumo. Bónus de 5% nas vendas.',
            'economia',
            false
        );
    }
    
    // Impacto do câmbio nas exportações/importações
    const variacaoCambio = (taxaCambio - 1800) / 1800;
    
    if (Math.abs(variacaoCambio) > 0.2) {
        const direcao = variacaoCambio > 0 ? 'desvalorizou' : 'valorizou';
        const impacto = Math.abs(variacaoCambio * 100).toFixed(0);
        
        _adicionarNoticia(
            `💱 Kwanza ${direcao} ${impacto}%`,
            variacaoCambio > 0 
                ? `Exportações mais competitivas. Importações ${impacto}% mais caras.`
                : `Importações mais baratas. Exportações menos competitivas.`,
            'cambio',
            true
        );
    }
    
    // Verificar oportunidades baseadas em indicadores
    if (indicadoresEconomicos.precoPetroleo > 90) {
        _adicionarNoticia(
            '🛢️ Petróleo em Alta',
            'Momento favorável para empresas do setor de energia e serviços relacionados.',
            'economia',
            false
        );
    }
    
    if (indicadoresEconomicos.confiancaConsumidor > 70) {
        _adicionarNoticia(
            '📊 Confiança do Consumidor em Alta',
            'Excelente momento para investir em marketing e expansão.',
            'economia',
            false
        );
    }
}

// ============================================
// PAINEL DE INDICADORES EM TEMPO REAL
// ============================================

function criarPainelIndicadores() {
    const painel = document.createElement('div');
    painel.id = 'painelIndicadores';
    painel.className = 'painel-indicadores';
    painel.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-secondary);
        padding: 10px 20px;
        border-bottom: 1px solid var(--border-color);
        font-size: 13px;
        flex-wrap: wrap;
        gap: 10px;
    `;
    
    atualizarPainelIndicadores(painel);
    
    // Inserir no topo da página
    const header = document.querySelector('.simulador-header');
    if (header) {
        header.parentNode.insertBefore(painel, header.nextSibling);
    }
}

function atualizarPainelIndicadores(painelExistente) {
    const painel = painelExistente || document.getElementById('painelIndicadores');
    if (!painel) return;
    
    // Cores baseadas nos valores
    const corInflacao = indicadoresEconomicos.inflacao < 10 ? 'var(--accent-green)' : 
                       (indicadoresEconomicos.inflacao < 20 ? 'var(--accent-yellow)' : 'var(--accent-red)');
    
    const corDivida = indicadoresEconomicos.dividaPublica < 50 ? 'var(--accent-green)' :
                     (indicadoresEconomicos.dividaPublica < 70 ? 'var(--accent-yellow)' : 'var(--accent-red)');
    
    const corCambio = Math.abs((taxaCambio - 1800) / 1800) < 0.05 ? 'var(--accent-green)' :
                     (Math.abs((taxaCambio - 1800) / 1800) < 0.15 ? 'var(--accent-yellow)' : 'var(--accent-red)');
    
    painel.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">💱 USD/Kz:</span>
                <span style="color: ${corCambio}; font-weight: 700;">${formatarMoeda(taxaCambio)}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">📊 Inflação:</span>
                <span style="color: ${corInflacao}; font-weight: 700;">${indicadoresEconomicos.inflacao.toFixed(1)}%</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">🏦 BNA:</span>
                <span style="color: ${indicadoresEconomicos.taxaBNA > 19 ? 'var(--accent-red)' : 'var(--accent-yellow)'}; font-weight: 700;">${indicadoresEconomicos.taxaBNA}%</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">📈 PIB:</span>
                <span style="color: ${indicadoresEconomicos.pibCrescimento > 3 ? 'var(--accent-green)' : 
                                      (indicadoresEconomicos.pibCrescimento > 0 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                       font-weight: 700;">
                    ${indicadoresEconomicos.pibCrescimento > 0 ? '+' : ''}${indicadoresEconomicos.pibCrescimento.toFixed(1)}%
                </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">🛢️ Petróleo:</span>
                <span style="color: ${indicadoresEconomicos.precoPetroleo > 80 ? 'var(--accent-green)' : 
                                      (indicadoresEconomicos.precoPetroleo > 60 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                       font-weight: 700;">
                    $${indicadoresEconomicos.precoPetroleo}
                </span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 5px;">
                <span style="color: var(--text-secondary);">🏛️ Dívida:</span>
                <span style="color: ${corDivida}; font-weight: 700;">${indicadoresEconomicos.dividaPublica.toFixed(1)}%</span>
            </div>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button onclick="mostrarDetalhesEconomicos()" 
                    style="background: var(--bg-tertiary); color: var(--text-primary); 
                           border: 1px solid var(--border-color); border-radius: 4px;
                           padding: 5px 10px; cursor: pointer; font-size: 12px;">
                📊 Detalhes
            </button>
            <button onclick="mostrarRelaçõesDiplomaticas()"
                    style="background: var(--bg-tertiary); color: var(--text-primary); 
                           border: 1px solid var(--border-color); border-radius: 4px;
                           padding: 5px 10px; cursor: pointer; font-size: 12px;">
                🌍 Diplomacia
            </button>
        </div>
    `;
}

// ============================================
// TELAS DE DETALHES
// ============================================

function mostrarDetalhesEconomicos() {
    const eventosRecentes = historicoEventos.slice(-10).reverse();
    
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">📊 Painel Económico Detalhado</h2>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                    <h4 style="color: var(--text-secondary); margin-bottom: 5px;">Inflação</h4>
                    <p style="color: ${indicadoresEconomicos.inflacao < 10 ? 'var(--accent-green)' : 
                                       (indicadoresEconomicos.inflacao < 20 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                              font-size: 24px; font-weight: 700;">
                        ${indicadoresEconomicos.inflacao.toFixed(1)}%
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px;">
                        Meta BNA: 15% | ${indicadoresEconomicos.inflacao > 15 ? 'Acima da meta' : 'Dentro da meta'}
                    </p>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                    <h4 style="color: var(--text-secondary); margin-bottom: 5px;">Taxa BNA</h4>
                    <p style="color: ${indicadoresEconomicos.taxaBNA < 15 ? 'var(--accent-green)' : 
                                       (indicadoresEconomicos.taxaBNA < 19 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                              font-size: 24px; font-weight: 700;">
                        ${indicadoresEconomicos.taxaBNA}%
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px;">
                        Crédito: ${indicadoresEconomicos.taxaBNA > 19 ? 'mais caro' : 'normal'}
                    </p>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                    <h4 style="color: var(--text-secondary); margin-bottom: 5px;">Dívida Pública</h4>
                    <p style="color: ${indicadoresEconomicos.dividaPublica < 50 ? 'var(--accent-green)' : 
                                       (indicadoresEconomicos.dividaPublica < 70 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                              font-size: 24px; font-weight: 700;">
                        ${indicadoresEconomicos.dividaPublica.toFixed(1)}%
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px;">
                        Limite UE: 60% | ${indicadoresEconomicos.dividaPublica > 70 ? 'Risco elevado' : 'Controlada'}
                    </p>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                    <h4 style="color: var(--text-secondary); margin-bottom: 5px;">Reservas Internacionais</h4>
                    <p style="color: ${indicadoresEconomicos.reservasInternacionais > 15000000000 ? 'var(--accent-green)' : 
                                       (indicadoresEconomicos.reservasInternacionais > 10000000000 ? 'var(--accent-yellow)' : 'var(--accent-red)')}; 
                              font-size: 20px; font-weight: 700;">
                        $${(indicadoresEconomicos.reservasInternacionais / 1000000000).toFixed(1)}B
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px;">
                        Cobertura: ${(indicadoresEconomicos.reservasInternacionais / 3000000000).toFixed(1)} meses de importações
                    </p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📈 Evolução do Câmbio</h3>
                    <canvas id="graficoCambioDetalhado" style="width: 100%; height: 250px;"></canvas>
                </div>
                
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📊 Indicadores Chave</h3>
                    <div style="display: grid; gap: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">PIB Crescimento:</span>
                            <span style="color: ${indicadoresEconomicos.pibCrescimento > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                ${indicadoresEconomicos.pibCrescimento > 0 ? '+' : ''}${indicadoresEconomicos.pibCrescimento.toFixed(1)}%
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Preço Petróleo:</span>
                            <span>$${indicadoresEconomicos.precoPetroleo}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Balança Comercial:</span>
                            <span style="color: ${indicadoresEconomicos.balancaComercial > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                ${indicadoresEconomicos.balancaComercial > 0 ? '+' : '-'}$${Math.abs(indicadoresEconomicos.balancaComercial / 1000000).toFixed(0)}M
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Confiança Consumidor:</span>
                            <span style="color: ${indicadoresEconomicos.confiancaConsumidor > 50 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                ${indicadoresEconomicos.confiancaConsumidor}/100
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Risco País:</span>
                            <span style="color: ${indicadoresEconomicos.riscoPais < 500 ? 'var(--accent-green)' : 
                                                   (indicadoresEconomicos.riscoPais < 800 ? 'var(--accent-yellow)' : 'var(--accent-red)')};">
                                ${indicadoresEconomicos.riscoPais} pontos
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">IED (anual):</span>
                            <span>$${(indicadoresEconomicos.investimentoEstrangeiro / 1000000).toFixed(0)}M</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">⚡ Eventos Ativos</h3>
                ${eventosAtivos.length === 0 ? 
                    '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento ativo no momento.</p>' :
                    eventosAtivos.map(e => `
                        <div style="background: var(--bg-tertiary); padding: 10px; margin-bottom: 5px; border-radius: 4px; border-left: 4px solid var(--accent-red);">
                            <div style="display: flex; justify-content: space-between;">
                                <strong style="color: var(--accent-red);">${e.titulo}</strong>
                                <span style="color: var(--text-secondary);">⏳ ${e.diasRestantes} dias</span>
                            </div>
                            <p style="color: var(--text-secondary); margin-top: 5px;">${e.descricao}</p>
                        </div>
                    `).join('')
                }
            </div>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📋 Histórico de Eventos</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${eventosRecentes.length === 0 ?
                        '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum evento registrado.</p>' :
                        eventosRecentes.map(e => `
                            <div style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between;">
                                    <span style="color: var(--accent-gold);">${e.titulo}</span>
                                    <span style="color: var(--text-secondary); font-size: 12px;">${e.data}</span>
                                </div>
                                <p style="color: var(--text-secondary); font-size: 13px; margin-top: 3px;">${e.descricao}</p>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="mostrarDashboardInicial()" 
                        style="padding: 10px 30px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    Voltar ao Dashboard
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Desenhar gráfico
    setTimeout(() => desenharGraficoCambioDetalhado(), 100);
}

function mostrarRelaçõesDiplomaticas() {
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">🌍 Relações Diplomáticas</h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">Legenda</h3>
                <div style="display: flex; gap: 20px;">
                    <div><span style="color: var(--accent-green);">🟢 Boa</span> - Tarifa 2%, prazo normal, crédito facilitado</div>
                    <div><span style="color: var(--accent-yellow);">🟡 Normal</span> - Tarifa 15%, prazo +30%, crédito normal</div>
                    <div><span style="color: var(--accent-red);">🔴 Ruim</span> - Tarifa 50%, prazo +80%, crédito bloqueado</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
    `;
    
    Object.entries(relacoesDiplomaticas).forEach(([pais, info]) => {
        const corNivel = info.nivel === 'boa' ? 'var(--accent-green)' : 
                        (info.nivel === 'normal' ? 'var(--accent-yellow)' : 'var(--accent-red)');
        
        html += `
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="color: ${corNivel}; font-size: 20px;">●</span>
                    <h4 style="color: var(--accent-gold); text-transform: uppercase; margin: 0;">${pais}</h4>
                </div>
                
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-secondary);">Relação:</span>
                        <span style="color: ${corNivel};">${info.nivel.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-secondary);">Tarifa:</span>
                        <span>${(info.tarifa * 100).toFixed(0)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-secondary);">Prazo:</span>
                        <span>${info.prazoMultiplicador > 1 ? '+' : ''}${((info.prazoMultiplicador - 1) * 100).toFixed(0)}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: var(--text-secondary);">Crédito:</span>
                        <span style="color: ${info.creditoDisponivel ? 'var(--accent-green)' : 'var(--accent-red)'};">
                            ${info.creditoDisponivel ? '✅ Disponível' : '❌ Bloqueado'}
                        </span>
                    </div>
                    ${info.jurosBonus ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-secondary);">Juros:</span>
                            <span style="color: ${info.jurosBonus < 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                ${info.jurosBonus > 0 ? '+' : ''}${(info.jurosBonus * 100).toFixed(0)}%
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="mostrarDashboardInicial()" 
                        style="padding: 10px 30px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    Voltar ao Dashboard
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

function desenharGraficoCambioDetalhado() {
    const canvas = document.getElementById('graficoCambioDetalhado');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dados = historicoCambioMensal.slice(-24);
    
    if (dados.length < 2) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(d => d.mes),
            datasets: [{
                label: 'Taxa de Câmbio USD/Kz',
                data: dados.map(d => d.taxa),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#b0b0b0' } }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#b0b0b0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#b0b0b0', maxRotation: 45 }
                }
            }
        }
    });
}

// ============================================
// INTEGRAÇÃO COM O SISTEMA DE TEMPO
// ============================================

// Sobrescrever funções originais
const _processarDiaOriginal = processarDia;
processarDia = function() {
    const resultado = _processarDiaOriginal.apply(this, arguments);
    
    // Atualizar indicadores econômicos
    atualizarIndicadoresEconomicos();
    
    // Verificar eventos
    verificarEventosEconomicos();
    
    // Verificar eventos expirados
    verificarEventosExpirados();
    
    // Atualizar painel
    atualizarPainelIndicadores();
    
    return resultado;
};

const _processarMesOriginal = processarMes;
processarMes = function() {
    const resultado = _processarMesOriginal.apply(this, arguments);
    
    // Atualizar balança comercial
    atualizarBalancaComercial();
    
    return resultado;
};

function atualizarBalancaComercial() {
    // Simular balança comercial baseada em exportações/importações
    const exportacoes = exportacoesPendentes.reduce((sum, e) => sum + (e.valorLiquidoUSD || 0), 0);
    const importacoes = entregasPendentes.filter(e => e.moeda === 'USD')
                                         .reduce((sum, e) => sum + e.total, 0);
    
    indicadoresEconomicos.balancaComercial = exportacoes - importacoes;
    
    if (Math.abs(indicadoresEconomicos.balancaComercial) > 10000000) {
        const sinal = indicadoresEconomicos.balancaComercial > 0 ? 'superavit' : 'deficit';
        _adicionarNoticia(
            '💰 Balança Comercial',
            `Angola registra ${sinal} comercial de $${(Math.abs(indicadoresEconomicos.balancaComercial) / 1000000).toFixed(1)}M no mês.`,
            'economia',
            false
        );
    }
}

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.mostrarDetalhesEconomicos = mostrarDetalhesEconomicos;
window.mostrarRelaçõesDiplomaticas = mostrarRelaçõesDiplomaticas;
window.indicadoresEconomicos = indicadoresEconomicos;
window.relacoesDiplomaticas = relacoesDiplomaticas;
window.eventosAtivos = eventosAtivos;
window.historicoEventos = historicoEventos;

// ============================================
// INICIALIZAÇÃO
// ============================================

// Criar painel de indicadores após carregamento
setTimeout(() => {
    criarPainelIndicadores();
}, 2000);


// ============================================
// SISTEMA DE NOTÍCIAS DE MERCADO - AÇÕES, PROPRIEDADES E CÂMBIO
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

// Histórico detalhado para gráficos
let historicoAcoes = {
    bfa: [],
    bai: [],
    bodiva: [],
    microsoft: [],
    apple: [],
    tesla: []
};

let historicoPropriedades = {
    angola: { tipoA: [], tipoB: [], tipoC: [] },
    internacional: { tipoA: [], tipoB: [], tipoC: [] }
};

let historicoCambioMinuto = []; // Para variações em tempo real
let ultimaAtualizacaoAcoes = Date.now();
let intervaloMercado = null;

// Alertas de preço configurados pelo usuário
let alertasPreco = [];

// ============================================
// SISTEMA DE VARIAÇÃO DE PREÇOS EM TEMPO REAL
// ============================================

function iniciarMercadoTempoReal() {
    if (intervaloMercado) clearInterval(intervaloMercado);
    
    // Atualizar a cada 30 segundos (simula minutos no mercado)
    intervaloMercado = setInterval(() => {
        if (estadoJogo.empresaCriada) {
            atualizarPrecosTempoReal();
            verificarAlertasPreco();
        }
    }, 30000);
}

function atualizarPrecosTempoReal() {
    const timestamp = Date.now();
    const variacaoMinuto = (Math.random() * 2) - 1; // -1% a +1%
    
    // Atualizar ações
    for (let acaoId in investimentos.acoes) {
        const acao = investimentos.acoes[acaoId];
        const precoAnterior = acao.precoAtual;
        
        // Variação mais volátil para ações (-3% a +3%)
        let variacao;
        if (acao.moeda === 'Kz') {
            // Ações angolanas mais voláteis
            variacao = (Math.random() * 6) - 3;
        } else {
            // Ações internacionais menos voláteis
            variacao = (Math.random() * 4) - 2;
        }
        
        // Aplicar influência de eventos globais
        eventosAtivos.forEach(evento => {
            if (evento.impacto.acoesMultiplier) {
                variacao *= evento.impacto.acoesMultiplier;
            }
        });
        
        const fator = 1 + (variacao / 100);
        acao.precoAtual = Math.round(acao.precoAtual * fator);
        
        // Garantir preço mínimo
        if (acao.precoAtual < 1) acao.precoAtual = 1;
        
        // Registrar histórico
        if (!historicoAcoes[acaoId]) historicoAcoes[acaoId] = [];
        historicoAcoes[acaoId].push({
            timestamp,
            preco: acao.precoAtual,
            variacao,
            hora: new Date().toLocaleTimeString()
        });
        
        // Manter apenas últimas 100 entradas
        if (historicoAcoes[acaoId].length > 100) {
            historicoAcoes[acaoId] = historicoAcoes[acaoId].slice(-100);
        }
        
        // Gerar notícia se variação significativa
        if (Math.abs(variacao) > 2.5) {
            gerarNoticiaAcao(acaoId, acao, precoAnterior, variacao);
        }
    }
    
    // Atualizar propriedades (menos frequente, a cada 5 minutos)
    if (Math.random() < 0.2) { // 20% chance a cada atualização
        atualizarPrecosPropriedadesTempoReal();
    }
    
    // Atualizar câmbio em tempo real
    atualizarCambioTempoReal();
}

function atualizarPrecosPropriedadesTempoReal() {
    const timestamp = Date.now();
    
    // Propriedades em Angola
    for (let tipo in investimentos.propriedades.angola) {
        const precoAnterior = investimentos.propriedades.angola[tipo];
        
        // Variação mais estável para imóveis (-1% a +1.5%)
        const variacao = (Math.random() * 2.5) - 1;
        const fator = 1 + (variacao / 100);
        
        investimentos.propriedades.angola[tipo] = Math.round(
            investimentos.propriedades.angola[tipo] * fator
        );
        
        // Registrar histórico
        historicoPropriedades.angola[tipo].push({
            timestamp,
            preco: investimentos.propriedades.angola[tipo],
            variacao,
            hora: new Date().toLocaleTimeString()
        });
        
        if (historicoPropriedades.angola[tipo].length > 50) {
            historicoPropriedades.angola[tipo] = historicoPropriedades.angola[tipo].slice(-50);
        }
        
        // Gerar notícia se variação significativa
        if (Math.abs(variacao) > 1.5) {
            gerarNoticiaPropriedade('angola', tipo, precoAnterior, variacao);
        }
    }
    
    // Propriedades internacionais
    for (let tipo in investimentos.propriedades.internacional) {
        const precoAnterior = investimentos.propriedades.internacional[tipo];
        
        const variacao = (Math.random() * 2) - 0.8;
        const fator = 1 + (variacao / 100);
        
        investimentos.propriedades.internacional[tipo] = Math.round(
            investimentos.propriedades.internacional[tipo] * fator * 100
        ) / 100;
        
        historicoPropriedades.internacional[tipo].push({
            timestamp,
            preco: investimentos.propriedades.internacional[tipo],
            variacao,
            hora: new Date().toLocaleTimeString()
        });
        
        if (historicoPropriedades.internacional[tipo].length > 50) {
            historicoPropriedades.internacional[tipo] = historicoPropriedades.internacional[tipo].slice(-50);
        }
        
        if (Math.abs(variacao) > 1.2) {
            gerarNoticiaPropriedade('internacional', tipo, precoAnterior, variacao);
        }
    }
}

function atualizarCambioTempoReal() {
    const timestamp = Date.now();
    const taxaAnterior = taxaCambio;
    
    // Variação minuto a minuto (-0.5% a +0.5%)
    const variacaoMinuto = (Math.random() * 1) - 0.5;
    const variacaoPercentual = variacaoMinuto / 100;
    
    // Aplicar tendência macroeconômica
    let tendencia = 0;
    if (indicadoresEconomicos) {
        // Inflação alta tende a desvalorizar
        if (indicadoresEconomicos.inflacao > 25) tendencia += 0.2;
        // Preço do petróleo alto tende a valorizar
        if (indicadoresEconomicos.precoPetroleo > 80) tendencia -= 0.15;
    }
    
    const variacaoTotal = variacaoMinuto + tendencia;
    const fator = 1 + (variacaoTotal / 100);
    
    taxaCambio = Math.round(taxaCambio * fator);
    
    // Limites
    if (taxaCambio < 900) taxaCambio = 900;
    if (taxaCambio > 4500) taxaCambio = 4500;
    
    // Registrar histórico minuto
    historicoCambioMinuto.push({
        timestamp,
        taxa: taxaCambio,
        variacao: variacaoTotal,
        hora: new Date().toLocaleTimeString()
    });
    
    if (historicoCambioMinuto.length > 200) {
        historicoCambioMinuto = historicoCambioMinuto.slice(-200);
    }
    
    // Gerar notícia de câmbio se variação significativa
    if (Math.abs(variacaoTotal) > 0.8) {
        gerarNoticiaCambioTempoReal(taxaAnterior, variacaoTotal);
    }
    
    // Atualizar display se estiver na página de câmbio
    if (document.getElementById('financeiro-conteudo')?.innerHTML.includes('Câmbio')) {
        mostrarCambio();
    }
}

// ============================================
// GERADOR DE NOTÍCIAS DE MERCADO
// ============================================

function gerarNoticiaAcao(acaoId, acao, precoAnterior, variacao) {
    const sentido = variacao > 0 ? 'sobe' : 'desce';
    const intensidade = Math.abs(variacao);
    let adjetivo = '';
    
    if (intensidade > 5) adjetivo = 'fortemente';
    else if (intensidade > 3) adjetivo = 'moderadamente';
    
    const titulos = [
        `${acao.nome} ${adjetivo} ${sentido}`,
        `Ações da ${acao.nome} registram ${sentido === 'sobe' ? 'alta' : 'baixa'} de ${Math.abs(variacao).toFixed(1)}%`,
        `Movimento no mercado: ${acao.nome} ${sentido} ${Math.abs(variacao).toFixed(1)}%`
    ];
    
    const descricoes = [
        `${acao.nome} negociada a ${formatarMoeda(acao.precoAtual)} ${acao.moeda}. Volume acima da média.`,
        `Investidores reagem a notícias do setor. Preço atual: ${formatarMoeda(acao.precoAtual)} ${acao.moeda}.`,
        `Analistas apontam ${sentido === 'sobe' ? 'otimismo' : 'cautela'} com o papel. Cotação: ${formatarMoeda(acao.precoAtual)} ${acao.moeda}.`
    ];
    
    _adicionarNoticia(
        titulos[Math.floor(Math.random() * titulos.length)],
        descricoes[Math.floor(Math.random() * descricoes.length)],
        'bolsa',
        intensidade > 4
    );
    
    // Verificar se o jogador tem ações desta empresa
    if (acao.quantidade > 0) {
        const valorAnterior = precoAnterior * acao.quantidade;
        const valorAtual = acao.precoAtual * acao.quantidade;
        const ganhoPerda = valorAtual - valorAnterior;
        
        if (Math.abs(ganhoPerda) > 100000) {
            _adicionarNoticia(
                '💰 Impacto na sua carteira',
                `Suas ações da ${acao.nome} ${ganhoPerda > 0 ? 'valorizaram' : 'desvalorizaram'} ${formatarMoeda(Math.abs(ganhoPerda))} ${acao.moeda}.`,
                'pessoal',
                Math.abs(ganhoPerda) > 500000
            );
        }
    }
}

function gerarNoticiaPropriedade(local, tipo, precoAnterior, variacao) {
    const sentido = variacao > 0 ? 'sobem' : 'descem';
    const localNome = local === 'angola' ? 'em Angola' : 'internacionais';
    const tipoNome = `Tipo ${tipo}`;
    
    const titulo = `🏢 Preços de imóveis ${tipoNome} ${sentido} ${localNome}`;
    const descricao = `Valorização de ${Math.abs(variacao).toFixed(1)}% no período. Preço atual: ${
        local === 'angola' 
            ? formatarMoeda(investimentos.propriedades.angola[`tipo${tipo}`]) + ' Kz'
            : 'USD ' + formatarMoeda(investimentos.propriedades.internacional[`tipo${tipo}`], 'USD')
    }`;
    
    _adicionarNoticia(
        titulo,
        descricao,
        'imobiliario',
        Math.abs(variacao) > 2
    );
}

function gerarNoticiaCambioTempoReal(taxaAnterior, variacao) {
    const sentido = variacao > 0 ? 'desvaloriza' : 'valoriza';
    const intensidade = Math.abs(variacao);
    
    let titulo, descricao;
    
    if (intensidade > 1) {
        titulo = `💱 Dólar ${sentido} ${intensidade.toFixed(1)}% em minutos`;
        descricao = `Volatilidade no mercado cambial. USD/Kz vai a ${formatarMoeda(taxaCambio)}. ${
            variacao > 0 
                ? 'Importações ficam mais caras.' 
                : 'Oportunidade para comprar dólar.'
        }`;
    } else {
        titulo = `💱 Câmbio: USD ${formatarMoeda(taxaCambio)} Kz`;
        descricao = `Dólar americano ${sentido} ${Math.abs(variacao).toFixed(1)}% no mercado interbancário.`;
    }
    
    _adicionarNoticia(
        titulo,
        descricao,
        'cambio',
        intensidade > 1.5
    );
    
    // Verificar impacto nas reservas do jogador
    if (estadoJogo.carteiraUsd > 0) {
        const valorEmKzAntes = estadoJogo.carteiraUsd * taxaAnterior;
        const valorEmKzAgora = estadoJogo.carteiraUsd * taxaCambio;
        const diferenca = valorEmKzAgora - valorEmKzAntes;
        
        if (Math.abs(diferenca) > 100000) {
            _adicionarNoticia(
                '💵 Impacto nas suas reservas',
                `Suas reservas em USD ${diferenca > 0 ? 'valorizaram' : 'desvalorizaram'} ${formatarMoeda(Math.abs(diferenca))} Kz com a variação cambial.`,
                'pessoal',
                Math.abs(diferenca) > 500000
            );
        }
    }
}

// ============================================
// SISTEMA DE ALERTAS DE PREÇO
// ============================================

function configurarAlertaPreco() {
    const tipos = ['Ação', 'Propriedade', 'Câmbio'];
    const acoes = Object.keys(investimentos.acoes).map(id => investimentos.acoes[id].nome);
    
    let html = `
        <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">🔔 Configurar Alerta de Preço</h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                <div style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Tipo:</label>
                    <select id="alerta-tipo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="acao">Ação</option>
                        <option value="propriedade">Propriedade</option>
                        <option value="cambio">Câmbio USD/Kz</option>
                    </select>
                </div>
                
                <div id="alerta-ativo-container" style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Ativo:</label>
                    <select id="alerta-ativo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        ${Object.values(investimentos.acoes).map(acao => 
                            `<option value="acao_${acao.nome.toLowerCase()}">${acao.nome} (${acao.moeda})</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Condição:</label>
                    <select id="alerta-condicao" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="acima">Acima de</option>
                        <option value="abaixo">Abaixo de</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Valor alvo:</label>
                    <input type="number" id="alerta-valor" step="0.01" min="0" 
                           style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                </div>
                
                <button onclick="salvarAlertaPreco()" 
                        style="width: 100%; padding: 12px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                    🔔 Criar Alerta
                </button>
            </div>
            
            <div style="margin-top: 30px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">Seus Alertas</h3>
                <div id="lista-alertas">
                    ${gerarListaAlertas()}
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="mostrarInvestimentos()" 
                        style="padding: 10px 30px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Adicionar listener para mudar opções de ativo baseado no tipo
    document.getElementById('alerta-tipo').addEventListener('change', function() {
        const tipo = this.value;
        const container = document.getElementById('alerta-ativo-container');
        
        if (tipo === 'cambio') {
            container.innerHTML = `
                <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Ativo:</label>
                <select id="alerta-ativo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                    <option value="cambio_usd">Dólar Americano (USD/Kz)</option>
                </select>
            `;
        } else if (tipo === 'propriedade') {
            container.innerHTML = `
                <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Ativo:</label>
                <select id="alerta-ativo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                    <option value="prop_angola_a">Angola Tipo A</option>
                    <option value="prop_angola_b">Angola Tipo B</option>
                    <option value="prop_angola_c">Angola Tipo C</option>
                    <option value="prop_int_a">Internacional Tipo A</option>
                    <option value="prop_int_b">Internacional Tipo B</option>
                    <option value="prop_int_c">Internacional Tipo C</option>
                </select>
            `;
        } else {
            container.innerHTML = `
                <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Ativo:</label>
                <select id="alerta-ativo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                    ${Object.values(investimentos.acoes).map(acao => 
                        `<option value="acao_${acao.nome.toLowerCase()}">${acao.nome} (${acao.moeda})</option>`
                    ).join('')}
                </select>
            `;
        }
    });
}

function gerarListaAlertas() {
    if (alertasPreco.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhum alerta configurado.</p>';
    }
    
    return alertasPreco.map((alerta, index) => `
        <div style="background: var(--bg-tertiary); padding: 10px; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: var(--accent-gold);">${alerta.nome}</strong>
                <p style="color: var(--text-secondary); font-size: 12px; margin: 2px 0;">
                    ${alerta.condicao === 'acima' ? '⬆️ Acima de' : '⬇️ Abaixo de'} ${formatarMoeda(alerta.valor)} ${alerta.moeda}
                </p>
            </div>
            <button onclick="removerAlerta(${index})" 
                    style="padding: 5px 10px; background: var(--accent-red); color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                ✕
            </button>
        </div>
    `).join('');
}

function salvarAlertaPreco() {
    const tipo = document.getElementById('alerta-tipo').value;
    const ativo = document.getElementById('alerta-ativo').value;
    const condicao = document.getElementById('alerta-condicao').value;
    const valor = parseFloat(document.getElementById('alerta-valor').value);
    
    if (!valor || valor <= 0) {
        notificar('❌ Valor inválido');
        return;
    }
    
    let nome = '';
    let moeda = 'Kz';
    
    if (tipo === 'cambio') {
        nome = 'USD/Kz';
        moeda = 'Kz';
    } else if (tipo === 'propriedade') {
        const partes = ativo.split('_');
        const local = partes[1];
        const tipoProp = partes[2].toUpperCase();
        nome = `${local === 'angola' ? '🇦🇴' : '🌍'} Propriedade Tipo ${tipoProp}`;
        moeda = local === 'angola' ? 'Kz' : 'USD';
    } else {
        const acaoNome = ativo.replace('acao_', '').toUpperCase();
        nome = acaoNome;
        const acao = Object.values(investimentos.acoes).find(a => a.nome.toLowerCase() === acaoNome.toLowerCase());
        moeda = acao ? acao.moeda : 'Kz';
    }
    
    alertasPreco.push({
        id: Date.now(),
        tipo,
        ativo,
        nome,
        condicao,
        valor,
        moeda,
        ativo: true
    });
    
    notificar(`✅ Alerta criado para ${nome}`);
    configurarAlertaPreco(); // Recarregar página
}

function removerAlerta(index) {
    alertasPreco.splice(index, 1);
    configurarAlertaPreco();
}

function verificarAlertasPreco() {
    alertasPreco.forEach(alerta => {
        if (!alerta.ativo) return;
        
        let precoAtual = 0;
        let atingido = false;
        
        if (alerta.tipo === 'cambio') {
            precoAtual = taxaCambio;
            atingido = alerta.condicao === 'acima' ? precoAtual >= alerta.valor : precoAtual <= alerta.valor;
        } else if (alerta.tipo === 'propriedade') {
            const partes = alerta.ativo.split('_');
            const local = partes[1];
            const tipo = partes[2];
            
            if (local === 'angola') {
                precoAtual = investimentos.propriedades.angola[`tipo${tipo.toUpperCase()}`];
            } else {
                precoAtual = investimentos.propriedades.internacional[`tipo${tipo.toUpperCase()}`];
            }
            atingido = alerta.condicao === 'acima' ? precoAtual >= alerta.valor : precoAtual <= alerta.valor;
        } else {
            const acaoNome = alerta.ativo.replace('acao_', '');
            const acao = Object.values(investimentos.acoes).find(a => a.nome.toLowerCase() === acaoNome);
            if (acao) {
                precoAtual = acao.precoAtual;
                atingido = alerta.condicao === 'acima' ? precoAtual >= alerta.valor : precoAtual <= alerta.valor;
            }
        }
        
        if (atingido) {
            notificar(`🔔 ALERTA: ${alerta.nome} ${alerta.condicao === 'acima' ? 'atingiu' : 'caiu para'} ${formatarMoeda(precoAtual)} ${alerta.moeda}`);
            alerta.ativo = false; // Desativar após disparar
        }
    });
}

// ============================================
// PAINEL DE MERCADO EM TEMPO REAL
// ============================================

function mostrarPainelMercado() {
    const ultimasAtualizacoes = historicoCambioMinuto.slice(-20);
    
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">📈 Mercado em Tempo Real</h2>
            
            <!-- Câmbio ao Vivo -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: var(--accent-gold);">💱 Câmbio USD/Kz</h3>
                    <span style="font-size: 28px; font-weight: 700; color: var(--accent-gold);">
                        ${formatarMoeda(taxaCambio)}
                    </span>
                </div>
                
                <div style="height: 200px; margin-bottom: 15px;">
                    <canvas id="graficoCambioAoVivo"></canvas>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; text-align: center;">
                        <span style="color: var(--text-secondary);">Mín. Hoje</span>
                        <span style="color: var(--accent-gold); display: block; font-weight: 700;">
                            ${formatarMoeda(Math.min(...historicoCambioMinuto.slice(-10).map(h => h.taxa)))}
                        </span>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; text-align: center;">
                        <span style="color: var(--text-secondary);">Máx. Hoje</span>
                        <span style="color: var(--accent-gold); display: block; font-weight: 700;">
                            ${formatarMoeda(Math.max(...historicoCambioMinuto.slice(-10).map(h => h.taxa)))}
                        </span>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; text-align: center;">
                        <span style="color: var(--text-secondary);">Variação</span>
                        <span style="color: ${ultimasAtualizacoes.length > 1 && 
                            ultimasAtualizacoes[ultimasAtualizacoes.length-1].taxa > ultimasAtualizacoes[0].taxa 
                            ? 'var(--accent-green)' : 'var(--accent-red)'}; display: block; font-weight: 700;">
                            ${ultimasAtualizacoes.length > 1 ? 
                                ((ultimasAtualizacoes[ultimasAtualizacoes.length-1].taxa - ultimasAtualizacoes[0].taxa) / ultimasAtualizacoes[0].taxa * 100).toFixed(2) + '%' 
                                : '0%'}
                        </span>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 4px; text-align: center;">
                        <span style="color: var(--text-secondary);">Atualizado</span>
                        <span style="color: var(--accent-gold); display: block; font-weight: 700;">
                            ${new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Ações em Destaque -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📊 Ações em Movimento</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                    ${gerarCardsAcoes()}
                </div>
            </div>
            
            <!-- Últimas Notícias do Mercado -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📰 Últimas do Mercado</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${gerarNoticiasMercado()}
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="configurarAlertaPreco()" 
                        style="padding: 10px 20px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    🔔 Configurar Alertas
                </button>
                <button onclick="mostrarInvestimentos()" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar aos Investimentos
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Desenhar gráficos
    setTimeout(() => {
        desenharGraficoCambioAoVivo();
        desenharGraficosAcoes();
    }, 100);
}

function gerarCardsAcoes() {
    let html = '';
    
    Object.entries(investimentos.acoes).forEach(([id, acao]) => {
        const historico = historicoAcoes[id] || [];
        const ultimaVariacao = historico.length > 0 ? historico[historico.length-1].variacao : 0;
        const tendencia = ultimaVariacao > 0 ? '📈' : '📉';
        
        html += `
            <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: var(--accent-gold);">${acao.nome}</strong>
                    <span style="color: ${ultimaVariacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                        ${tendencia} ${Math.abs(ultimaVariacao).toFixed(2)}%
                    </span>
                </div>
                <div style="font-size: 20px; font-weight: 700; color: var(--accent-gold); margin-bottom: 5px;">
                    ${formatarMoeda(acao.precoAtual)} ${acao.moeda}
                </div>
                <div style="display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 12px;">
                    <span>Min: ${formatarMoeda(Math.min(...(historico.slice(-10).map(h => h.preco) || [acao.precoAtual])))}</span>
                    <span>Max: ${formatarMoeda(Math.max(...(historico.slice(-10).map(h => h.preco) || [acao.precoAtual])))}</span>
                </div>
                <canvas id="grafico-${id}" style="height: 50px; width: 100%; margin-top: 10px;"></canvas>
                ${acao.quantidade > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">Sua posição:</span>
                        <span style="color: var(--accent-gold); float: right;">${acao.quantidade} ações</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    return html;
}

function gerarNoticiasMercado() {
    const noticiasMercado = noticiasSimulador
        .filter(n => ['bolsa', 'cambio', 'imobiliario', 'pessoal'].includes(n.categoria))
        .slice(0, 15);
    
    if (noticiasMercado.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhuma notícia recente.</p>';
    }
    
    return noticiasMercado.map(n => `
        <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: ${n.importante ? 'var(--accent-red)' : 'var(--accent-gold)'}; font-weight: 700;">
                    ${n.titulo}
                </span>
                <span style="color: var(--text-secondary); font-size: 11px;">${n.data}</span>
            </div>
            <p style="color: var(--text-secondary); margin: 0; font-size: 13px;">${n.descricao}</p>
        </div>
    `).join('');
}

function desenharGraficoCambioAoVivo() {
    const canvas = document.getElementById('graficoCambioAoVivo');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dados = historicoCambioMinuto.slice(-60);
    
    if (dados.length < 2) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(d => d.hora),
            datasets: [{
                label: 'USD/Kz',
                data: dados.map(d => d.taxa),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#b0b0b0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#b0b0b0', maxRotation: 45, maxTicksLimit: 8 }
                }
            }
        }
    });
}

function desenharGraficosAcoes() {
    Object.keys(investimentos.acoes).forEach(id => {
        const canvas = document.getElementById(`grafico-${id}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dados = historicoAcoes[id]?.slice(-30) || [];
        
        if (dados.length < 2) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dados.map(d => d.hora),
                datasets: [{
                    data: dados.map(d => d.preco),
                    borderColor: dados[dados.length-1].variacao >= 0 ? '#4CAF50' : '#F44336',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { display: false }
                },
                elements: { line: { fill: false } }
            }
        });
    });
}

// ============================================
// INTEGRAÇÃO COM O SISTEMA EXISTENTE
// ============================================

// Modificar a função iniciarAtualizacaoAcoes para incluir o sistema em tempo real
const _iniciarAtualizacaoAcoesOriginal = iniciarAtualizacaoAcoes;
iniciarAtualizacaoAcoes = function() {
    _iniciarAtualizacaoAcoesOriginal.apply(this, arguments);
    iniciarMercadoTempoReal();
};

// Modificar mostrarInvestimentos para incluir botão do painel de mercado
const _mostrarInvestimentosOriginal = mostrarInvestimentos;
mostrarInvestimentos = function() {
    _mostrarInvestimentosOriginal.apply(this, arguments);
    
    // Adicionar botão do painel de mercado
    setTimeout(() => {
        const botoesContainer = document.querySelector('.investimentos-container > div:first-child');
        if (botoesContainer) {
            const btnMercado = document.createElement('button');
            btnMercado.textContent = '📈 Mercado Ao Vivo';
            btnMercado.style.cssText = 'padding: 10px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px;';
            btnMercado.onclick = mostrarPainelMercado;
            botoesContainer.appendChild(btnMercado);
        }
    }, 100);
};

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.mostrarPainelMercado = mostrarPainelMercado;
window.configurarAlertaPreco = configurarAlertaPreco;
window.salvarAlertaPreco = salvarAlertaPreco;
window.removerAlerta = removerAlerta;
window.historicoAcoes = historicoAcoes;
window.historicoPropriedades = historicoPropriedades;
window.historicoCambioMinuto = historicoCambioMinuto;
window.alertasPreco = alertasPreco;

// ============================================
// INICIALIZAÇÃO
// ============================================

// Carregar alertas salvos
try {
    const alertasSalvos = localStorage.getItem('alertasPreco');
    if (alertasSalvos) {
        alertasPreco = JSON.parse(alertasSalvos);
    }
} catch(e) {
    console.error('Erro ao carregar alertas:', e);
}

// Salvar alertas ao salvar o jogo
const _salvarEstadoOriginal = salvarEstadoSimulacao;
salvarEstadoSimulacao = function() {
    _salvarEstadoOriginal.apply(this, arguments);
    localStorage.setItem('alertasPreco', JSON.stringify(alertasPreco));
};

console.log('✅ Sistema de Mercado em Tempo Real ativado!');

// ============================================
// FORMULÁRIO DE CRIAÇÃO DE EMPRESA - VERSÃO CORRIGIDA
// ============================================

// Função para mostrar o formulário de criação de empresa
function mostrarFormularioCriacaoEmpresa() {
  console.log('mostrarFormularioCriacaoEmpresa chamada'); // Para debug
  
  const conteudo = `
    <div class="form-container">
      <h2>🏢 Criar Nova Empresa</h2>
      <form id="form-empresa" onsubmit="return criarEmpresa(event)">
        <div class="form-group">
          <label for="nome-empresa">Nome da Empresa</label>
          <input type="text" id="nome-empresa" name="nome-empresa" required 
                 placeholder="Ex: Tech Solutions Lda" 
                 style="color: var(--text-primary); background: var(--bg-secondary);">
        </div>
        
        <div class="form-group">
          <label for="dimensao-empresa">Dimensão da Empresa</label>
          <select id="dimensao-empresa" name="dimensao-empresa" onchange="atualizarOpcoesSaldo()" required 
                  style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione a dimensão</option>
            <option value="micro">Micro Empresa</option>
            <option value="pequena">Pequena Empresa</option>
            <option value="media">Média Empresa</option>
            <option value="grande">Grande Empresa</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="saldo-inicial">Saldo Inicial (Kz)</label>
          <select id="saldo-inicial" name="saldo-inicial" required 
                  style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Primeiro selecione a dimensão</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="area-atuacao">Área de Atuação</label>
          <select id="area-atuacao" name="area-atuacao" required 
                  style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione a área</option>
            <option value="servicos">Prestação de Serviços</option>
            <option value="produtos">Venda de Produtos</option>
            <option value="hibrido">Híbrido (Serviços + Produtos)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="natureza-juridica">Natureza Jurídica</label>
          <select id="natureza-juridica" name="natureza-juridica" required 
                  style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione a natureza</option>
            <option value="unipessoal">Unipessoal Lda</option>
            <option value="lda">Sociedade por Quotas (Lda)</option>
            <option value="sa">Sociedade Anónima (SA)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="max-funcionarios">Nº Máximo de Funcionários</label>
          <select id="max-funcionarios" name="max-funcionarios" required 
                  style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="">Selecione o limite</option>
            <option value="5">5 Funcionários</option>
            <option value="20">20 Funcionários</option>
            <option value="100">100 Funcionários</option>
            <option value="300">300 Funcionários</option>
            <option value="500">500 Funcionários</option>
          </select>
        </div>
        
        <button type="submit" class="btn-submit">🚀 Iniciar Simulação</button>
      </form>
    </div>
  `;
  
  // Injetar o conteúdo no elemento principal
  const conteudoPrincipal = document.getElementById('conteudoPrincipal');
  if (conteudoPrincipal) {
    conteudoPrincipal.innerHTML = conteudo;
    console.log('Formulário injetado com sucesso');
  } else {
    console.error('Elemento conteudoPrincipal não encontrado');
  }
}

// Função para atualizar as opções de saldo baseado na dimensão
function atualizarOpcoesSaldo() {
  console.log('atualizarOpcoesSaldo chamada');
  
  const dimensaoSelect = document.getElementById('dimensao-empresa');
  const saldoSelect = document.getElementById('saldo-inicial');
  
  if (!dimensaoSelect || !saldoSelect) {
    console.error('Elementos não encontrados');
    return;
  }
  
  const dimensao = dimensaoSelect.value;
  console.log('Dimensão selecionada:', dimensao);
  
  let opcoes = '<option value="">Selecione o saldo inicial</option>';
  
  switch(dimensao) {
    case 'micro':
      opcoes += '<option value="1000000">1.000.000 Kz</option>';
      break;
    case 'pequena':
      opcoes += '<option value="1000000">1.000.000 Kz (Básico)</option>';
      opcoes += '<option value="5000000">5.000.000 Kz (Avançado)</option>';
      break;
    case 'media':
      opcoes += '<option value="25000000">25.000.000 Kz (Básico)</option>';
      opcoes += '<option value="50000000">50.000.000 Kz (Avançado)</option>';
      break;
    case 'grande':
      opcoes += '<option value="100000000">100.000.000 Kz (Básico)</option>';
      opcoes += '<option value="500000000">500.000.000 Kz (Avançado)</option>';
      opcoes += '<option value="5000000000">5.000.000.000 Kz (Corporativo)</option>';
      break;
    default:
      opcoes = '<option value="">Primeiro selecione a dimensão</option>';
  }
  
  saldoSelect.innerHTML = opcoes;
  console.log('Opções de saldo atualizadas');
}

// Função para criar a empresa (chamada no submit do formulário)
function criarEmpresa(event) {
  console.log('criarEmpresa chamada');
  
  // Prevenir o comportamento padrão do formulário
  if (event) {
    event.preventDefault();
  }
  
  // Obter os valores do formulário
  const nomeInput = document.getElementById('nome-empresa');
  const dimensaoSelect = document.getElementById('dimensao-empresa');
  const saldoSelect = document.getElementById('saldo-inicial');
  const areaSelect = document.getElementById('area-atuacao');
  const naturezaSelect = document.getElementById('natureza-juridica');
  const maxFuncSelect = document.getElementById('max-funcionarios');
  
  // Verificar se todos os elementos existem
  if (!nomeInput || !dimensaoSelect || !saldoSelect || !areaSelect || !naturezaSelect || !maxFuncSelect) {
    console.error('Elementos do formulário não encontrados');
    notificar('❌ Erro ao carregar formulário');
    return false;
  }
  
  // Obter os valores
  const nome = nomeInput.value.trim();
  const dimensao = dimensaoSelect.value;
  const saldo = parseFloat(saldoSelect.value);
  const area = areaSelect.value;
  const natureza = naturezaSelect.value;
  const maxFunc = parseInt(maxFuncSelect.value);
  
  console.log('Valores do formulário:', { nome, dimensao, saldo, area, natureza, maxFunc });
  
  // Validar campos
  if (!nome) {
    notificar('❌ Por favor, insira o nome da empresa');
    nomeInput.focus();
    return false;
  }
  
  if (!dimensao) {
    notificar('❌ Por favor, selecione a dimensão da empresa');
    dimensaoSelect.focus();
    return false;
  }
  
  if (!saldo || isNaN(saldo) || saldo <= 0) {
    notificar('❌ Por favor, selecione um saldo inicial válido');
    saldoSelect.focus();
    return false;
  }
  
  if (!area) {
    notificar('❌ Por favor, selecione a área de atuação');
    areaSelect.focus();
    return false;
  }
  
  if (!natureza) {
    notificar('❌ Por favor, selecione a natureza jurídica');
    naturezaSelect.focus();
    return false;
  }
  
  if (!maxFunc || isNaN(maxFunc) || maxFunc <= 0) {
    notificar('❌ Por favor, selecione o número máximo de funcionários');
    maxFuncSelect.focus();
    return false;
  }
  
  // Criar o objeto estadoJogo se não existir
  if (typeof estadoJogo === 'undefined') {
    window.estadoJogo = {
      empresaCriada: false,
      nomeEmpresa: '',
      dimensao: '',
      naturezaJuridica: '',
      areaAtuacao: '',
      carteiraKz: 0,
      carteiraUsd: 0,
      garantiasKz: 0,
      garantiasUsd: 0,
      saldoInicial: 0,
      clientesNacionais: 0,
      clientesEstrangeiros: 0,
      licencaExportacao: false,
      licencaExpiracao: null,
      faturamentoMes: 0,
      custosMes: 0,
      lucroMes: 0,
      maxFuncionarios: 0,
      bonusProdutividade: 0,
      nivelExpansao: 0,
      clientesIniciais: 100
    };
  }
  
  // Inicializar outros objetos necessários
  if (typeof clientes === 'undefined') {
    window.clientes = {
      nacionais: 0,
      estrangeiros: 0,
      historico: []
    };
  }
  
  if (typeof funcionarios === 'undefined') {
    window.funcionarios = {
      classeA: { homens: 0, mulheres: 0, salario: 700000, produtividade: 0.02 },
      classeB: { homens: 0, mulheres: 0, salario: 200000, produtividade: 0.005 },
      classeC: { homens: 0, mulheres: 0, salario: 50000, produtividade: 0.0001 },
      classeD: { homens: 0, mulheres: 0, salario: 30000, produtividade: 0 }
    };
  }
  
  if (typeof dataSimulador === 'undefined') {
    window.dataSimulador = new Date(2025, 0, 1);
  }
  
  if (typeof tempoDecorrido === 'undefined') {
    window.tempoDecorrido = 0;
  }
  
  if (typeof historicoTransacoes === 'undefined') {
    window.historicoTransacoes = [];
  }
  
  if (typeof noticiasSimulador === 'undefined') {
    window.noticiasSimulador = [];
  }
  
  // Definir os valores da empresa
  estadoJogo.empresaCriada = true;
  estadoJogo.nomeEmpresa = nome;
  estadoJogo.dimensao = dimensao;
  estadoJogo.naturezaJuridica = natureza;
  estadoJogo.areaAtuacao = area;
  estadoJogo.carteiraKz = saldo;
  estadoJogo.saldoInicial = saldo;
  estadoJogo.maxFuncionarios = maxFunc;
  estadoJogo.clientesIniciais = 100;
  
  // Atualizar a interface
  const empresaNomeEl = document.getElementById('empresaNome');
  const empresaDimensaoEl = document.getElementById('empresaDimensao');
  
  if (empresaNomeEl) empresaNomeEl.textContent = nome;
  if (empresaDimensaoEl) empresaDimensaoEl.textContent = dimensao.toUpperCase();
  
  // Atualizar as carteiras
  atualizarCarteiras();
  
  // Iniciar o temporizador da simulação
  if (typeof iniciarTempoSimulador === 'function') {
    iniciarTempoSimulador();
  } else {
    console.warn('Função iniciarTempoSimulador não encontrada');
    // Criar um temporizador simples se a função não existir
    if (window.intervaloPrincipal) {
      clearInterval(window.intervaloPrincipal);
    }
    window.intervaloPrincipal = setInterval(() => {
      if (typeof tempoDecorrido !== 'undefined') {
        tempoDecorrido++;
        atualizarDataDisplay();
      }
    }, 1000);
  }
  
  // Mostrar o dashboard inicial
  mostrarDashboardInicial();
  
  // Registrar a transação inicial
  if (typeof registrarTransacao === 'function') {
    registrarTransacao('inicial', 'entrada', saldo, 'Kz', 'Saldo inicial da empresa');
  }
  
  // Adicionar notícia de boas-vindas
  if (typeof _adicionarNoticia === 'function') {
    _adicionarNoticia(
      '🎉 Nova Empresa Criada',
      `${nome} foi fundada com sucesso! Saldo inicial: ${formatarMoeda(saldo)} Kz. Boa sorte nos negócios!`,
      'empresa',
      true
    );
  }
  
  // Salvar o estado
  if (typeof salvarEstadoSimulacao === 'function') {
    salvarEstadoSimulacao();
  }
  
  // Notificar o usuário
  notificar(`✅ Empresa ${nome} criada com sucesso!`);
  
  console.log('Empresa criada com sucesso:', estadoJogo);
  return false; // Prevenir comportamento padrão
}

// Função para mostrar o dashboard inicial após criar a empresa
function mostrarDashboardInicial() {
  console.log('mostrarDashboardInicial chamada');
  
  // Atualizar o dashboard com os valores atuais
  if (typeof atualizarDashboard === 'function') {
    atualizarDashboard();
  }
  
  const conteudo = `
    <div class="welcome-screen">
      <h2>🎉 Empresa Criada com Sucesso!</h2>
      <p><strong>${estadoJogo?.nomeEmpresa || 'Empresa'}</strong> - ${estadoJogo?.dimensao?.toUpperCase() || 'MICRO'}</p>
      <p>Saldo Inicial: ${formatarMoeda(estadoJogo?.carteiraKz || 0)} Kz</p>
      <p>Máximo de Funcionários: ${estadoJogo?.maxFuncionarios || 0}</p>
      <p>Área de Atuação: ${traduzirAreaAtuacao(estadoJogo?.areaAtuacao || '')}</p>
      <p>Use o menu ☰ para começar a gerir a sua empresa.</p>
      
      <div style="display:flex; gap:20px; justify-content:center; margin-top:30px; flex-wrap:wrap;">
        <button onclick="mostrarRH()" 
                style="padding:15px 30px; 
                       background:rgb(214,174,100); 
                       color:#000; 
                       border:none; 
                       border-radius:8px; 
                       cursor:pointer; 
                       font-weight:600;
                       min-width:200px;">
          👥 Contratar Funcionários
        </button>
        <button onclick="mostrarFornecedores()" 
                style="padding:15px 30px; 
                       background:rgb(214,174,100); 
                       color:#000; 
                       border:none; 
                       border-radius:8px; 
                       cursor:pointer; 
                       font-weight:600;
                       min-width:200px;">
          📦 Comprar Produtos
        </button>
        <button onclick="mostrarFinanceiro()" 
                style="padding:15px 30px; 
                       background:rgb(214,174,100); 
                       color:#000; 
                       border:none; 
                       border-radius:8px; 
                       cursor:pointer; 
                       font-weight:600;
                       min-width:200px;">
          💰 Gestão Financeira
        </button>
      </div>
      
      <div style="margin-top:20px; color: #888; font-size:14px;">
        <p>Dica: Comece contratando funcionários e comprando produtos para iniciar suas vendas!</p>
      </div>
    </div>
  `;
  
  const conteudoPrincipal = document.getElementById('conteudoPrincipal');
  if (conteudoPrincipal) {
    conteudoPrincipal.innerHTML = conteudo;
  }
}

// Função auxiliar para traduzir área de atuação
function traduzirAreaAtuacao(area) {
  const traducoes = {
    'servicos': 'Prestação de Serviços',
    'produtos': 'Venda de Produtos',
    'hibrido': 'Híbrido (Serviços + Produtos)'
  };
  return traducoes[area] || area;
}

// Função para formatar moeda (caso não exista)
function formatarMoeda(valor, moeda = 'Kz') {
  if (typeof valor !== 'number') valor = 0;
  
  if (moeda === 'USD') {
    return valor.toLocaleString('pt-PT', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  return valor.toLocaleString('pt-PT', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
}

// Função para notificar (caso não exista)
function notificar(mensagem) {
  console.log('NOTIFICAÇÃO:', mensagem);
  
  // Criar elemento de notificação se não existir
  let notificacao = document.createElement('div');
  notificacao.className = 'notificacao';
  notificacao.textContent = mensagem;
  notificacao.style.cssText = `
    position: fixed;
    top: 90px;
    right: 30px;
    background: linear-gradient(145deg, #1a1a1a, #121212);
    color: white;
    padding: 16px 28px;
    border-radius: 50px;
    box-shadow: 0 15px 35px rgba(0,0,0,0.6);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    border-left: 4px solid rgb(214,174,100);
    max-width: 400px;
    font-size: 14px;
  `;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

// Função para atualizar as carteiras (caso não exista)
function atualizarCarteiras() {
  const carteiraKzEl = document.getElementById('carteiraKz');
  const carteiraUsdEl = document.getElementById('carteiraUsd');
  
  if (carteiraKzEl && estadoJogo) {
    carteiraKzEl.textContent = `Kz: ${formatarMoeda(estadoJogo.carteiraKz || 0)}`;
  }
  
  if (carteiraUsdEl && estadoJogo) {
    carteiraUsdEl.textContent = `USD: ${formatarMoeda(estadoJogo.carteiraUsd || 0, 'USD')}`;
  }
}

// Função para atualizar o display da data (caso não exista)
function atualizarDataDisplay() {
  const dataDisplay = document.getElementById('dataDisplay');
  if (dataDisplay && typeof dataSimulador !== 'undefined' && dataSimulador) {
    const dia = dataSimulador.getDate().toString().padStart(2, '0');
    const mes = (dataSimulador.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataSimulador.getFullYear();
    dataDisplay.textContent = `${dia}/${mes}/${ano}`;
  }
}

// Função para atualizar o dashboard (caso não exista)
function atualizarDashboard() {
  const elementos = {
    'totalClientes': clientes?.nacionais + clientes?.estrangeiros || 0,
    'totalFuncionarios': calcularTotalFuncionarios(),
    'lucroMes': estadoJogo?.lucroMes || 0,
    'totalEstoque': calcularTotalEstoque(),
    'reservaUsd': estadoJogo?.carteiraUsd || 0,
    'statusLicenca': estadoJogo?.licencaExportacao ? '✅' : '❌'
  };
  
  for (let [id, valor] of Object.entries(elementos)) {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'reservaUsd') {
        el.textContent = formatarMoeda(valor, 'USD');
      } else if (id === 'lucroMes' || id === 'totalClientes' || id === 'totalFuncionarios' || id === 'totalEstoque') {
        el.textContent = typeof valor === 'number' ? formatarMoeda(valor) : valor;
      } else {
        el.textContent = valor;
      }
    }
  }
}

// Função para calcular total de funcionários
function calcularTotalFuncionarios() {
  if (!funcionarios) return 0;
  
  let total = 0;
  for (let classe in funcionarios) {
    total += (funcionarios[classe]?.homens || 0) + (funcionarios[classe]?.mulheres || 0);
  }
  return total;
}

// Função para calcular total de estoque
function calcularTotalEstoque() {
  if (!estoque) return 0;
  
  return estoque.reduce((total, item) => total + (item?.quantidade || 0), 0);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado, inicializando formulário');
  
  // Garantir que o botão "Criar Nova Empresa" funciona
  const btnCriarEmpresa = document.querySelector('.btn-grande, button[onclick="mostrarFormularioCriacaoEmpresa()"]');
  if (btnCriarEmpresa) {
    console.log('Botão "Criar Nova Empresa" encontrado');
    
    // Remover onclick existente e adicionar novo
    btnCriarEmpresa.removeAttribute('onclick');
    btnCriarEmpresa.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Botão clicado');
      mostrarFormularioCriacaoEmpresa();
    });
  } else {
    console.warn('Botão "Criar Nova Empresa" não encontrado');
  }
});

// Exportar funções para o escopo global
window.mostrarFormularioCriacaoEmpresa = mostrarFormularioCriacaoEmpresa;
window.atualizarOpcoesSaldo = atualizarOpcoesSaldo;
window.criarEmpresa = criarEmpresa;
window.mostrarDashboardInicial = mostrarDashboardInicial;
window.formatarMoeda = formatarMoeda;
window.notificar = notificar;

// ============================================
// SISTEMA DE GESTÃO DE PROPRIEDADES ADQUIRIDAS
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

// Estrutura para armazenar propriedades adquiridas
let propriedadesAdquiridas = {
    angola: {
        tipoA: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] },
        tipoB: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] },
        tipoC: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] }
    },
    internacional: {
        tipoA: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] },
        tipoB: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] },
        tipoC: { quantidade: 0, precoMedio: 0, totalInvestido: 0, historico: [] }
    }
};

// Histórico de valorização de propriedades
let historicoValorizacaoPropriedades = [];

// Alertas de valorização
let alertasValorizacao = [];

// ============================================
// FUNÇÕES DE REGISTRO DE PROPRIEDADES
// ============================================

/**
 * Registrar compra de propriedade
 * Chamar na função comprarPropriedade existente
 */
function registrarCompraPropriedade(local, tipo, quantidade, precoUnitario, total) {
    const prop = propriedadesAdquiridas[local][`tipo${tipo}`];
    
    // Calcular novo preço médio
    const investimentoAnterior = prop.totalInvestido;
    const quantidadeAnterior = prop.quantidade;
    const novoInvestimento = investimentoAnterior + total;
    const novaQuantidade = quantidadeAnterior + quantidade;
    
    prop.precoMedio = novoInvestimento / novaQuantidade;
    prop.quantidade = novaQuantidade;
    prop.totalInvestido = novoInvestimento;
    
    // Registrar no histórico
    prop.historico.push({
        data: dataSimulador.toLocaleDateString(),
        operacao: 'compra',
        quantidade,
        precoUnitario,
        total,
        precoMedioApos: prop.precoMedio
    });
    
    // Registrar no histórico global
    historicoValorizacaoPropriedades.push({
        data: dataSimulador.toLocaleDateString(),
        local,
        tipo,
        operacao: 'compra',
        quantidade,
        precoUnitario,
        total,
        moeda: local === 'angola' ? 'Kz' : 'USD'
    });
    
    // Gerar notícia da aquisição
    gerarNoticiaAquisicaoPropriedade(local, tipo, quantidade, precoUnitario, total);
    
    salvarEstadoSimulacao();
}

/**
 * Registrar venda de propriedade
 * Chamar na função venderPropriedade existente
 */
function registrarVendaPropriedade(local, tipo, quantidade, precoUnitario, total, lucroPrejuizo) {
    const prop = propriedadesAdquiridas[local][`tipo${tipo}`];
    
    // Atualizar quantidade e investimento
    prop.quantidade -= quantidade;
    
    // Calcular novo preço médio (permanece o mesmo para as restantes)
    if (prop.quantidade > 0) {
        prop.totalInvestido = prop.precoMedio * prop.quantidade;
    } else {
        prop.precoMedio = 0;
        prop.totalInvestido = 0;
    }
    
    // Registrar no histórico
    prop.historico.push({
        data: dataSimulador.toLocaleDateString(),
        operacao: 'venda',
        quantidade,
        precoUnitario,
        total,
        lucroPrejuizo,
        precoMedioApos: prop.precoMedio
    });
    
    // Registrar no histórico global
    historicoValorizacaoPropriedades.push({
        data: dataSimulador.toLocaleDateString(),
        local,
        tipo,
        operacao: 'venda',
        quantidade,
        precoUnitario,
        total,
        lucroPrejuizo,
        moeda: local === 'angola' ? 'Kz' : 'USD'
    });
    
    // Gerar notícia da venda
    gerarNoticiaVendaPropriedade(local, tipo, quantidade, precoUnitario, total, lucroPrejuizo);
    
    salvarEstadoSimulacao();
}

// ============================================
// FUNÇÕES DE VALORIZAÇÃO E RENDIMENTO
// ============================================

/**
 * Calcular valorização mensal das propriedades
 * Chamar em processarMes()
 */
function calcularValorizacaoPropriedades() {
    const mes = dataSimulador.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    
    Object.keys(propriedadesAdquiridas).forEach(local => {
        Object.keys(propriedadesAdquiridas[local]).forEach(tipo => {
            const prop = propriedadesAdquiridas[local][tipo];
            if (prop.quantidade === 0) return;
            
            // Preço atual do mercado
            const precoAtual = local === 'angola' 
                ? investimentos.propriedades.angola[tipo]
                : investimentos.propriedades.internacional[tipo];
            
            // Calcular valorização
            const valorAtualTotal = precoAtual * prop.quantidade;
            const valorizacao = valorAtualTotal - prop.totalInvestido;
            const percentualValorizacao = (valorizacao / prop.totalInvestido) * 100;
            
            // Registrar no histórico de valorização
            prop.historico.push({
                data: dataSimulador.toLocaleDateString(),
                mes,
                operacao: 'valorizacao',
                precoAtual,
                valorTotal: valorAtualTotal,
                valorizacao,
                percentual: percentualValorizacao
            });
            
            // Gerar alerta se valorização significativa
            if (Math.abs(percentualValorizacao) > 10) {
                gerarAlertaValorizacao(local, tipo, percentualValorizacao, valorizacao);
            }
        });
    });
}

/**
 * Calcular rendimento potencial de aluguel
 * (Opcional - pode ser implementado como feature futura)
 */
function calcularRendimentoAluguel() {
    // Taxa de rendimento anual baseada no tipo de propriedade
    const taxasRendimento = {
        angola: { tipoA: 0.06, tipoB: 0.07, tipoC: 0.08 }, // 6%, 7%, 8% ao ano
        internacional: { tipoA: 0.04, tipoB: 0.05, tipoC: 0.06 } // 4%, 5%, 6% ao ano
    };
    
    let rendimentoMensalTotal = 0;
    
    Object.keys(propriedadesAdquiridas).forEach(local => {
        Object.keys(propriedadesAdquiridas[local]).forEach(tipo => {
            const prop = propriedadesAdquiridas[local][tipo];
            if (prop.quantidade === 0) return;
            
            const precoAtual = local === 'angola' 
                ? investimentos.propriedades.angola[tipo]
                : investimentos.propriedades.internacional[tipo];
            
            const taxaAnual = taxasRendimento[local][tipo];
            const rendimentoAnual = precoAtual * prop.quantidade * taxaAnual;
            const rendimentoMensal = rendimentoAnual / 12;
            
            rendimentoMensalTotal += rendimentoMensal;
        });
    });
    
    return rendimentoMensalTotal;
}

// ============================================
// GERADORES DE NOTÍCIAS E ALERTAS
// ============================================

/**
 * Gerar notícia de aquisição de propriedade
 */
function gerarNoticiaAquisicaoPropriedade(local, tipo, quantidade, precoUnitario, total) {
    const localNome = local === 'angola' ? 'em Angola' : 'internacional';
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    
    _adicionarNoticia(
        '🏢 Nova Propriedade Adquirida',
        `Comprou ${quantidade} propriedade(s) Tipo ${tipo} ${localNome} por ${formatarMoeda(total, moeda)} ${moeda}.`,
        'investimento',
        total > 100000000 // Importante se for muito caro
    );
}

/**
 * Gerar notícia de venda de propriedade
 */
function gerarNoticiaVendaPropriedade(local, tipo, quantidade, precoUnitario, total, lucroPrejuizo) {
    const localNome = local === 'angola' ? 'em Angola' : 'internacional';
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    const resultado = lucroPrejuizo >= 0 ? 'lucro' : 'prejuízo';
    
    _adicionarNoticia(
        `💰 Venda de Propriedade com ${lucroPrejuizo >= 0 ? 'Lucro' : 'Prejuízo'}`,
        `Vendeu ${quantidade} propriedade(s) Tipo ${tipo} ${localNome} por ${formatarMoeda(total, moeda)} ${moeda}. ` +
        `${resultado === 'lucro' ? '✅' : '❌'} ${resultado}: ${formatarMoeda(Math.abs(lucroPrejuizo), moeda)} ${moeda}.`,
        'investimento',
        Math.abs(lucroPrejuizo) > 10000000
    );
}

/**
 * Gerar alerta de valorização significativa
 */
function gerarAlertaValorizacao(local, tipo, percentual, valorizacao) {
    const localNome = local === 'angola' ? 'em Angola' : 'internacional';
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    const direcao = percentual > 0 ? 'valorizaram' : 'desvalorizaram';
    
    _adicionarNoticia(
        `📈 Propriedades ${direcao}`,
        `Suas propriedades Tipo ${tipo} ${localNome} ${direcao} ${Math.abs(percentual).toFixed(1)}% ` +
        `(${percentual > 0 ? '+' : '-'}${formatarMoeda(Math.abs(valorizacao), moeda)} ${moeda}).`,
        'investimento',
        Math.abs(percentual) > 20
    );
    
    // Notificação em tempo real
    notificar(`🔔 Propriedades ${direcao} ${Math.abs(percentual).toFixed(1)}%`);
}

// ============================================
// INTERFACE DE PROPRIEDADES ADQUIRIDAS
// ============================================

/**
 * Mostrar propriedades adquiridas (versão melhorada)
 */
function mostrarPropriedadesAdquiridas() {
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">📋 Propriedades Adquiridas</h2>
            
            <!-- Resumo do Patrimônio -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">💰 Resumo do Patrimônio</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                    ${calcularResumoPatrimonio()}
                </div>
            </div>
            
            <!-- Propriedades em Angola -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">🇦🇴 Propriedades em Angola (Kz)</h3>
                ${gerarTabelaPropriedades('angola')}
            </div>
            
            <!-- Propriedades Internacionais -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">🌍 Propriedades Internacionais (USD)</h3>
                ${gerarTabelaPropriedades('internacional')}
            </div>
            
            <!-- Gráfico de Valorização -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📈 Evolução do Patrimônio</h3>
                <canvas id="graficoPatrimonio" style="width: 100%; height: 300px;"></canvas>
            </div>
            
            <!-- Histórico de Transações -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📊 Histórico de Transações</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${gerarHistoricoTransacoesPropriedades()}
                </div>
            </div>
            
            <!-- Alertas de Valorização -->
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">🔔 Alertas de Valorização</h3>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${gerarAlertasValorizacao()}
                </div>
            </div>
            
            <!-- Botões de Ação -->
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button onclick="configurarAlertaValorizacao()" 
                        style="padding: 10px 20px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    🔔 Configurar Alertas
                </button>
                <button onclick="exportarRelatorioPropriedades()" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    📥 Exportar Relatório
                </button>
                <button onclick="mostrarInvestimentos()" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Desenhar gráfico após carregar
    setTimeout(() => desenharGraficoPatrimonio(), 100);
}

/**
 * Calcular resumo do patrimônio
 */
function calcularResumoPatrimonio() {
    let totalInvestidoKz = 0;
    let totalInvestidoUsd = 0;
    let valorAtualKz = 0;
    let valorAtualUsd = 0;
    let totalValorizacaoKz = 0;
    
    // Propriedades Angola
    Object.keys(propriedadesAdquiridas.angola).forEach(tipo => {
        const prop = propriedadesAdquiridas.angola[tipo];
        if (prop.quantidade === 0) return;
        
        totalInvestidoKz += prop.totalInvestido;
        const precoAtual = investimentos.propriedades.angola[tipo];
        valorAtualKz += precoAtual * prop.quantidade;
    });
    
    // Propriedades Internacionais
    Object.keys(propriedadesAdquiridas.internacional).forEach(tipo => {
        const prop = propriedadesAdquiridas.internacional[tipo];
        if (prop.quantidade === 0) return;
        
        totalInvestidoUsd += prop.totalInvestido;
        const precoAtual = investimentos.propriedades.internacional[tipo];
        valorAtualUsd += precoAtual * prop.quantidade;
    });
    
    totalValorizacaoKz = (valorAtualKz - totalInvestidoKz) + ((valorAtualUsd - totalInvestidoUsd) * (taxaCambio || 1800));
    
    return `
        <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: var(--text-secondary);">Total Investido (Kz)</p>
            <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(totalInvestidoKz)}</p>
            <p style="color: var(--text-secondary); font-size: 12px;">+ USD ${formatarMoeda(totalInvestidoUsd, 'USD')}</p>
        </div>
        <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: var(--text-secondary);">Valor Atual (Kz)</p>
            <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(valorAtualKz)}</p>
            <p style="color: var(--text-secondary); font-size: 12px;">+ USD ${formatarMoeda(valorAtualUsd, 'USD')}</p>
        </div>
        <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
            <p style="color: var(--text-secondary);">Valorização Total</p>
            <p style="color: ${totalValorizacaoKz >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 24px; font-weight: 700;">
                ${totalValorizacaoKz >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(totalValorizacaoKz))}
            </p>
            <p style="color: var(--text-secondary); font-size: 12px;">
                ${((totalValorizacaoKz / (totalInvestidoKz + totalInvestidoUsd * (taxaCambio || 1800)) * 100) || 0).toFixed(1)}%
            </p>
        </div>
    `;
}

/**
 * Gerar tabela de propriedades por local
 */
function gerarTabelaPropriedades(local) {
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    let temPropriedades = false;
    let html = `
        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                        <th>Preço Médio</th>
                        <th>Preço Atual</th>
                        <th>Total Investido</th>
                        <th>Valor Atual</th>
                        <th>Valorização</th>
                        <th>%</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.keys(propriedadesAdquiridas[local]).forEach(tipo => {
        const prop = propriedadesAdquiridas[local][tipo];
        if (prop.quantidade === 0) return;
        
        temPropriedades = true;
        const precoAtual = local === 'angola' 
            ? investimentos.propriedades.angola[tipo]
            : investimentos.propriedades.internacional[tipo];
        
        const valorAtualTotal = precoAtual * prop.quantidade;
        const valorizacao = valorAtualTotal - prop.totalInvestido;
        const percentual = (valorizacao / prop.totalInvestido) * 100;
        
        html += `
            <tr>
                <td><strong>Tipo ${tipo.replace('tipo', '')}</strong></td>
                <td>${prop.quantidade}</td>
                <td>${formatarMoeda(prop.precoMedio, moeda)} ${moeda}</td>
                <td>${formatarMoeda(precoAtual, moeda)} ${moeda}</td>
                <td>${formatarMoeda(prop.totalInvestido, moeda)} ${moeda}</td>
                <td>${formatarMoeda(valorAtualTotal, moeda)} ${moeda}</td>
                <td style="color: ${valorizacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${valorizacao >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(valorizacao), moeda)} ${moeda}
                </td>
                <td style="color: ${percentual >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${percentual >= 0 ? '+' : ''}${percentual.toFixed(1)}%
                </td>
                <td>
                    <button onclick="venderPropriedadeEspecifica('${local}', '${tipo}', 1)" 
                            style="padding: 5px 10px; background: var(--accent-red); color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        Vender 1
                    </button>
                    <button onclick="mostrarDetalhesPropriedade('${local}', '${tipo}')" 
                            style="padding: 5px 10px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                        Detalhes
                    </button>
                </td>
            </tr>
        `;
    });
    
    if (!temPropriedades) {
        html += `
            <tr>
                <td colspan="9" style="text-align: center; padding: 30px;">
                    📭 Nenhuma propriedade adquirida
                </td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

/**
 * Gerar histórico de transações de propriedades
 */
function gerarHistoricoTransacoesPropriedades() {
    const transacoes = historicoValorizacaoPropriedades.slice(-20).reverse();
    
    if (transacoes.length === 0) {
        return '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhuma transação registrada.</p>';
    }
    
    return transacoes.map(t => `
        <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between;">
                <span style="color: ${t.operacao === 'compra' ? 'var(--accent-green)' : 
                                      t.operacao === 'venda' ? 'var(--accent-red)' : 
                                      'var(--accent-gold)'}; font-weight: 700;">
                    ${t.operacao === 'compra' ? '🟢 Compra' : 
                      t.operacao === 'venda' ? '🔴 Venda' : 
                      '📈 Valorização'}
                </span>
                <span style="color: var(--text-secondary); font-size: 12px;">${t.data}</span>
            </div>
            <p style="margin: 5px 0; color: var(--text-primary);">
                ${t.local === 'angola' ? '🇦🇴' : '🌍'} Tipo ${t.tipo} - 
                ${t.operacao === 'valorizacao' ? 
                    `${t.percentual > 0 ? '+' : ''}${t.percentual.toFixed(1)}% (${formatarMoeda(t.valorizacao, t.moeda)} ${t.moeda})` :
                    `${t.quantidade} unidade(s) - ${formatarMoeda(t.total, t.moeda)} ${t.moeda}`
                }
            </p>
            ${t.lucroPrejuizo ? `
                <p style="color: ${t.lucroPrejuizo >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 12px;">
                    ${t.lucroPrejuizo >= 0 ? '✅ Lucro' : '❌ Prejuízo'}: ${formatarMoeda(Math.abs(t.lucroPrejuizo), t.moeda)} ${t.moeda}
                </p>
            ` : ''}
        </div>
    `).join('');
}

/**
 * Gerar alertas de valorização
 */
function gerarAlertasValorizacao() {
    const alertas = alertasValorizacao.slice(-10).reverse();
    
    if (alertas.length === 0) {
        return '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhum alerta configurado.</p>';
    }
    
    return alertas.map(a => `
        <div style="padding: 10px; background: var(--bg-tertiary); margin-bottom: 5px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--accent-gold);">${a.titulo}</span>
                <span style="color: var(--text-secondary); font-size: 11px;">${a.data}</span>
            </div>
            <p style="color: var(--text-secondary); margin: 5px 0 0; font-size: 13px;">${a.descricao}</p>
        </div>
    `).join('');
}

// ============================================
// FUNÇÕES DE VENDA ESPECÍFICA
// ============================================

/**
 * Vender quantidade específica de propriedade
 */
function venderPropriedadeEspecifica(local, tipo, quantidade) {
    const prop = propriedadesAdquiridas[local][tipo];
    
    if (prop.quantidade < quantidade) {
        notificar(`❌ Você só possui ${prop.quantidade} propriedade(s) deste tipo.`);
        return;
    }
    
    const precoAtual = local === 'angola' 
        ? investimentos.propriedades.angola[tipo]
        : investimentos.propriedades.internacional[tipo];
    
    const valorTotal = precoAtual * quantidade;
    const precoMedio = prop.precoMedio;
    const lucroPrejuizo = (precoAtual - precoMedio) * quantidade;
    
    // Calcular taxas
    let valorLiquido = valorTotal;
    let taxas = '';
    
    if (local === 'angola') {
        const escritura = valorTotal * 0.015;
        const comissao = valorTotal * 0.05;
        valorLiquido = valorTotal - escritura - comissao;
        taxas = `Escritura: ${formatarMoeda(escritura)} Kz, Comissão: ${formatarMoeda(comissao)} Kz`;
    }
    
    if (!confirm(`Confirmar venda de ${quantidade} propriedade(s) Tipo ${tipo}?\n\n` +
                 `Preço atual: ${formatarMoeda(precoAtual)} ${local === 'angola' ? 'Kz' : 'USD'}\n` +
                 `Valor total: ${formatarMoeda(valorTotal)} ${local === 'angola' ? 'Kz' : 'USD'}\n` +
                 `Lucro/Prejuízo: ${lucroPrejuizo >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(lucroPrejuizo))} ${local === 'angola' ? 'Kz' : 'USD'}\n` +
                 `Valor líquido (após taxas): ${formatarMoeda(valorLiquido)} ${local === 'angola' ? 'Kz' : 'USD'}`)) {
        return;
    }
    
    // Atualizar saldo
    if (local === 'angola') {
        estadoJogo.carteiraKz += valorLiquido;
    } else {
        estadoJogo.carteiraUsd += valorTotal; // Sem taxas para internacional
    }
    
    // Registrar venda
    registrarVendaPropriedade(local, tipo, quantidade, precoAtual, valorTotal, lucroPrejuizo);
    
    // Atualizar objeto investimentos (para manter compatibilidade)
    // Nota: O objeto investimentos não tem quantidade de propriedades, então não precisa atualizar
    
    notificar(`✅ Venda realizada! ${quantidade} propriedade(s) Tipo ${tipo} vendida(s).`);
    
    // Atualizar interface
    mostrarPropriedadesAdquiridas();
    atualizarCarteiras();
}

// ============================================
// FUNÇÕES DE DETALHES
// ============================================

/**
 * Mostrar detalhes de uma propriedade específica
 */
function mostrarDetalhesPropriedade(local, tipo) {
    const prop = propriedadesAdquiridas[local][tipo];
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    const precoAtual = local === 'angola' 
        ? investimentos.propriedades.angola[tipo]
        : investimentos.propriedades.internacional[tipo];
    
    const valorAtualTotal = precoAtual * prop.quantidade;
    const valorizacao = valorAtualTotal - prop.totalInvestido;
    const percentual = (valorizacao / prop.totalInvestido) * 100;
    
    let html = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">
                ${local === 'angola' ? '🇦🇴' : '🌍'} Detalhes da Propriedade Tipo ${tipo}
            </h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <p style="color: var(--text-secondary);">Quantidade:</p>
                        <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${prop.quantidade}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary);">Preço Médio:</p>
                        <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(prop.precoMedio, moeda)} ${moeda}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary);">Preço Atual:</p>
                        <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(precoAtual, moeda)} ${moeda}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary);">Total Investido:</p>
                        <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(prop.totalInvestido, moeda)} ${moeda}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary);">Valor Atual:</p>
                        <p style="color: var(--accent-gold); font-size: 24px; font-weight: 700;">${formatarMoeda(valorAtualTotal, moeda)} ${moeda}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-secondary);">Valorização:</p>
                        <p style="color: ${valorizacao >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 24px; font-weight: 700;">
                            ${valorizacao >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(valorizacao), moeda)} ${moeda}
                        </p>
                        <p style="color: ${percentual >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                            ${percentual >= 0 ? '+' : ''}${percentual.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📊 Histórico da Propriedade</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${gerarHistoricoPropriedade(local, tipo)}
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📈 Gráfico de Valorização</h3>
                <canvas id="graficoPropriedade" style="width: 100%; height: 250px;"></canvas>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="venderPropriedadeEspecifica('${local}', '${tipo}', 1)" 
                        style="padding: 10px 20px; background: var(--accent-red); color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                    Vender 1 Unidade
                </button>
                ${prop.quantidade > 1 ? `
                    <button onclick="venderPropriedadeEspecifica('${local}', '${tipo}', ${prop.quantidade})" 
                            style="padding: 10px 20px; background: var(--accent-red); color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                        Vender Tudo (${prop.quantidade})
                    </button>
                ` : ''}
                <button onclick="mostrarPropriedadesAdquiridas()" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Desenhar gráfico
    setTimeout(() => desenharGraficoPropriedade(local, tipo), 100);
}

/**
 * Gerar histórico de uma propriedade específica
 */
function gerarHistoricoPropriedade(local, tipo) {
    const prop = propriedadesAdquiridas[local][tipo];
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    
    if (prop.historico.length === 0) {
        return '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhum histórico disponível.</p>';
    }
    
    return prop.historico.slice(-20).reverse().map(h => `
        <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between;">
                <span style="color: ${h.operacao === 'compra' ? 'var(--accent-green)' : 
                                      h.operacao === 'venda' ? 'var(--accent-red)' : 
                                      'var(--accent-gold)'}; font-weight: 700;">
                    ${h.operacao === 'compra' ? '🟢 Compra' : 
                      h.operacao === 'venda' ? '🔴 Venda' : 
                      '📈 Valorização'} - ${h.data}
                </span>
            </div>
            ${h.operacao === 'valorizacao' ? `
                <p style="margin: 5px 0;">Preço: ${formatarMoeda(h.precoAtual, moeda)} ${moeda}</p>
                <p>Valorização: ${h.percentual > 0 ? '+' : ''}${h.percentual.toFixed(2)}% 
                   (${h.valorizacao > 0 ? '+' : ''}${formatarMoeda(h.valorizacao, moeda)} ${moeda})</p>
            ` : `
                <p style="margin: 5px 0;">Quantidade: ${h.quantidade} unidade(s)</p>
                <p>Preço: ${formatarMoeda(h.precoUnitario, moeda)} ${moeda}</p>
                <p>Total: ${formatarMoeda(h.total, moeda)} ${moeda}</p>
                ${h.lucroPrejuizo ? `
                    <p style="color: ${h.lucroPrejuizo >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                        ${h.lucroPrejuizo >= 0 ? '✅ Lucro' : '❌ Prejuízo'}: ${formatarMoeda(Math.abs(h.lucroPrejuizo), moeda)} ${moeda}
                    </p>
                ` : ''}
                <p style="color: var(--text-secondary); font-size: 12px;">Preço médio após: ${formatarMoeda(h.precoMedioApos, moeda)} ${moeda}</p>
            `}
        </div>
    `).join('');
}

// ============================================
// FUNÇÕES DE GRÁFICOS
// ============================================

/**
 * Desenhar gráfico de patrimônio total
 */
function desenharGraficoPatrimonio() {
    const canvas = document.getElementById('graficoPatrimonio');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Coletar dados dos últimos 12 meses
    const ultimos12Meses = [];
    const valoresKz = [];
    const valoresUsd = [];
    
    // Implementar lógica para buscar dados do histórico
    // Por enquanto, dados de exemplo
    for (let i = 11; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        ultimos12Meses.push(data.toLocaleDateString('pt-PT', { month: 'short' }));
        valoresKz.push(Math.random() * 100000000); // Substituir por dados reais
        valoresUsd.push(Math.random() * 50000); // Substituir por dados reais
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ultimos12Meses,
            datasets: [
                {
                    label: 'Patrimônio Kz',
                    data: valoresKz,
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Patrimônio USD',
                    data: valoresUsd,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#b0b0b0' }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { 
                        color: '#b0b0b0',
                        callback: function(value) {
                            return formatarMoeda(value) + ' Kz';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { 
                        color: '#b0b0b0',
                        callback: function(value) {
                            return formatarMoeda(value, 'USD') + ' USD';
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#b0b0b0' }
                }
            }
        }
    });
}

/**
 * Desenhar gráfico de uma propriedade específica
 */
function desenharGraficoPropriedade(local, tipo) {
    const canvas = document.getElementById('graficoPropriedade');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const prop = propriedadesAdquiridas[local][tipo];
    const moeda = local === 'angola' ? 'Kz' : 'USD';
    
    // Filtrar apenas eventos de valorização
    const dados = prop.historico.filter(h => h.operacao === 'valorizacao').slice(-12);
    
    if (dados.length < 2) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#b0b0b0';
        ctx.textAlign = 'center';
        ctx.fillText('Dados insuficientes para gráfico', canvas.width/2, canvas.height/2);
        return;
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.map(d => d.mes),
            datasets: [{
                label: `Valor da Propriedade (${moeda})`,
                data: dados.map(d => d.valorTotal / prop.quantidade),
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#b0b0b0' } }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { 
                        color: '#b0b0b0',
                        callback: function(value) {
                            return formatarMoeda(value, moeda) + ' ' + moeda;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#b0b0b0' }
                }
            }
        }
    });
}

// ============================================
// CONFIGURAÇÃO DE ALERTAS DE VALORIZAÇÃO
// ============================================

/**
 * Configurar alerta de valorização
 */
function configurarAlertaValorizacao() {
    let html = `
        <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">🔔 Configurar Alerta de Valorização</h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px;">
                <div style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Local:</label>
                    <select id="alerta-local" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="angola">Angola (Kz)</option>
                        <option value="internacional">Internacional (USD)</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Tipo:</label>
                    <select id="alerta-tipo" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="tipoA">Tipo A</option>
                        <option value="tipoB">Tipo B</option>
                        <option value="tipoC">Tipo C</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Condição:</label>
                    <select id="alerta-condicao" style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="acima">Valorização acima de</option>
                        <option value="abaixo">Desvalorização abaixo de</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: var(--text-secondary); display: block; margin-bottom: 5px;">Percentual alvo:</label>
                    <input type="number" id="alerta-percentual" min="1" max="100" step="1" value="10"
                           style="width: 100%; padding: 8px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 5px;">Alerta quando variação ultrapassar este percentual</p>
                </div>
                
                <button onclick="salvarAlertaValorizacao()" 
                        style="width: 100%; padding: 12px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                    🔔 Criar Alerta
                </button>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="mostrarPropriedadesAdquiridas()" 
                        style="padding: 10px 30px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

/**
 * Salvar alerta de valorização
 */
function salvarAlertaValorizacao() {
    const local = document.getElementById('alerta-local').value;
    const tipo = document.getElementById('alerta-tipo').value;
    const condicao = document.getElementById('alerta-condicao').value;
    const percentual = parseFloat(document.getElementById('alerta-percentual').value);
    
    if (!percentual || percentual <= 0) {
        notificar('❌ Percentual inválido');
        return;
    }
    
    const alerta = {
        id: Date.now(),
        local,
        tipo,
        condicao,
        percentual,
        ativo: true,
        dataCriacao: dataSimulador.toLocaleDateString()
    };
    
    alertasValorizacao.push(alerta);
    
    notificar(`✅ Alerta configurado para ${local === 'angola' ? '🇦🇴' : '🌍'} Tipo ${tipo}`);
    mostrarPropriedadesAdquiridas();
}

// ============================================
// EXPORTAÇÃO DE RELATÓRIO
// ============================================

/**
 * Exportar relatório de propriedades
 */
function exportarRelatorioPropriedades() {
    let relatorio = "RELATÓRIO DE PROPRIEDADES\n";
    relatorio += "=".repeat(50) + "\n\n";
    relatorio += `Data: ${dataSimulador.toLocaleDateString()}\n`;
    relatorio += `Empresa: ${estadoJogo.nomeEmpresa}\n\n`;
    
    // Propriedades Angola
    relatorio += "PROPRIEDADES EM ANGOLA (Kz)\n";
    relatorio += "-".repeat(30) + "\n";
    
    Object.keys(propriedadesAdquiridas.angola).forEach(tipo => {
        const prop = propriedadesAdquiridas.angola[tipo];
        if (prop.quantidade > 0) {
            const precoAtual = investimentos.propriedades.angola[tipo];
            const valorAtual = precoAtual * prop.quantidade;
            const valorizacao = valorAtual - prop.totalInvestido;
            
            relatorio += `\nTipo ${tipo}:\n`;
            relatorio += `  Quantidade: ${prop.quantidade}\n`;
            relatorio += `  Preço Médio: ${formatarMoeda(prop.precoMedio)} Kz\n`;
            relatorio += `  Preço Atual: ${formatarMoeda(precoAtual)} Kz\n`;
            relatorio += `  Total Investido: ${formatarMoeda(prop.totalInvestido)} Kz\n`;
            relatorio += `  Valor Atual: ${formatarMoeda(valorAtual)} Kz\n`;
            relatorio += `  Valorização: ${valorizacao >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(valorizacao))} Kz\n`;
        }
    });
    
    // Propriedades Internacionais
    relatorio += "\n\nPROPRIEDADES INTERNACIONAIS (USD)\n";
    relatorio += "-".repeat(30) + "\n";
    
    Object.keys(propriedadesAdquiridas.internacional).forEach(tipo => {
        const prop = propriedadesAdquiridas.internacional[tipo];
        if (prop.quantidade > 0) {
            const precoAtual = investimentos.propriedades.internacional[tipo];
            const valorAtual = precoAtual * prop.quantidade;
            const valorizacao = valorAtual - prop.totalInvestido;
            
            relatorio += `\nTipo ${tipo}:\n`;
            relatorio += `  Quantidade: ${prop.quantidade}\n`;
            relatorio += `  Preço Médio: USD ${formatarMoeda(prop.precoMedio, 'USD')}\n`;
            relatorio += `  Preço Atual: USD ${formatarMoeda(precoAtual, 'USD')}\n`;
            relatorio += `  Total Investido: USD ${formatarMoeda(prop.totalInvestido, 'USD')}\n`;
            relatorio += `  Valor Atual: USD ${formatarMoeda(valorAtual, 'USD')}\n`;
            relatorio += `  Valorização: USD ${valorizacao >= 0 ? '+' : '-'}${formatarMoeda(Math.abs(valorizacao), 'USD')}\n`;
        }
    });
    
    // Transações recentes
    relatorio += "\n\nÚLTIMAS TRANSAÇÕES\n";
    relatorio += "-".repeat(30) + "\n";
    
    historicoValorizacaoPropriedades.slice(-10).reverse().forEach(t => {
        relatorio += `\n${t.data} - ${t.operacao.toUpperCase()}: ${t.quantidade || ''} ${t.local} Tipo ${t.tipo}`;
        if (t.total) relatorio += ` - ${formatarMoeda(t.total, t.moeda)} ${t.moeda}`;
        if (t.lucroPrejuizo) relatorio += ` (${t.lucroPrejuizo >= 0 ? 'Lucro' : 'Prejuízo'}: ${formatarMoeda(Math.abs(t.lucroPrejuizo), t.moeda)} ${t.moeda})`;
        relatorio += "\n";
    });
    
    // Criar arquivo para download
    const blob = new Blob([relatorio], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propriedades_${dataSimulador.toLocaleDateString().replace(/\//g, '_')}.txt`;
    a.click();
    
    notificar('📥 Relatório exportado com sucesso!');
}

// ============================================
// INTEGRAÇÃO COM FUNÇÕES EXISTENTES
// ============================================

// Salvar referências originais
const _comprarPropriedadeOriginal = comprarPropriedade;
const _venderPropriedadeOriginal = venderPropriedade;
const _processarMesOriginalProp = processarMes;

// Sobrescrever comprarPropriedade
comprarPropriedade = function(local, tipo) {
    const resultado = _comprarPropriedadeOriginal.apply(this, arguments);
    
    // Registrar a compra no sistema de propriedades adquiridas
    let preco, quantidade, total;
    
    if (local === 'angola') {
        preco = investimentos.propriedades.angola[`tipo${tipo}`];
        quantidade = parseInt(document.getElementById(`qtd-propriedade-${tipo.toLowerCase()}`).value);
        total = preco * quantidade;
    } else {
        preco = investimentos.propriedades.internacional[`tipo${tipo}`];
        quantidade = parseInt(document.getElementById(`qtd-propriedade-int-${tipo.toLowerCase()}`).value);
        total = preco * quantidade;
    }
    
    registrarCompraPropriedade(local, tipo, quantidade, preco, total);
    
    return resultado;
};

// Sobrescrever venderPropriedade
venderPropriedade = function(local, tipo, quantidade) {
    // Calcular lucro/prejuízo antes da venda
    const prop = propriedadesAdquiridas[local][`tipo${tipo}`];
    const precoAtual = local === 'angola' 
        ? investimentos.propriedades.angola[`tipo${tipo}`]
        : investimentos.propriedades.internacional[`tipo${tipo}`];
    
    const lucroPrejuizo = (precoAtual - prop.precoMedio) * quantidade;
    
    const resultado = _venderPropriedadeOriginal.apply(this, arguments);
    
    // Registrar a venda
    const total = precoAtual * quantidade;
    registrarVendaPropriedade(local, `tipo${tipo}`, quantidade, precoAtual, total, lucroPrejuizo);
    
    return resultado;
};

// Sobrescrever processarMes para incluir cálculo de valorização
processarMes = function() {
    const resultado = _processarMesOriginalProp.apply(this, arguments);
    
    // Calcular valorização mensal das propriedades
    calcularValorizacaoPropriedades();
    
    return resultado;
};

// Melhorar mostrarPropriedades para incluir link para propriedades adquiridas
const _mostrarPropriedadesOriginal = mostrarPropriedades;
mostrarPropriedades = function() {
    _mostrarPropriedadesOriginal.apply(this, arguments);
    
    // Adicionar botão para ver propriedades adquiridas
    setTimeout(() => {
        const container = document.querySelector('.propriedades-container');
        if (container) {
            const btnVerAdquiridas = document.createElement('button');
            btnVerAdquiridas.textContent = '📋 Ver Propriedades Adquiridas';
            btnVerAdquiridas.style.cssText = 'width: 100%; padding: 15px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; font-weight: 700;';
            btnVerAdquiridas.onclick = mostrarPropriedadesAdquiridas;
            container.appendChild(btnVerAdquiridas);
        }
    }, 100);
};

// ============================================
// CARREGAR DADOS SALVOS
// ============================================

// Carregar propriedades adquiridas do localStorage
try {
    const propSalvas = localStorage.getItem('propriedadesAdquiridas');
    if (propSalvas) {
        propriedadesAdquiridas = JSON.parse(propSalvas);
    }
    
    const alertasSalvos = localStorage.getItem('alertasValorizacao');
    if (alertasSalvos) {
        alertasValorizacao = JSON.parse(alertasSalvos);
    }
    
    const historicoSalvo = localStorage.getItem('historicoValorizacaoPropriedades');
    if (historicoSalvo) {
        historicoValorizacaoPropriedades = JSON.parse(historicoSalvo);
    }
} catch(e) {
    console.error('Erro ao carregar dados de propriedades:', e);
}

// Salvar dados ao salvar o jogo
const _salvarEstadoOriginalProp = salvarEstadoSimulacao;
salvarEstadoSimulacao = function() {
    _salvarEstadoOriginalProp.apply(this, arguments);
    
    localStorage.setItem('propriedadesAdquiridas', JSON.stringify(propriedadesAdquiridas));
    localStorage.setItem('alertasValorizacao', JSON.stringify(alertasValorizacao));
    localStorage.setItem('historicoValorizacaoPropriedades', JSON.stringify(historicoValorizacaoPropriedades));
};

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.mostrarPropriedadesAdquiridas = mostrarPropriedadesAdquiridas;
window.mostrarDetalhesPropriedade = mostrarDetalhesPropriedade;
window.venderPropriedadeEspecifica = venderPropriedadeEspecifica;
window.configurarAlertaValorizacao = configurarAlertaValorizacao;
window.salvarAlertaValorizacao = salvarAlertaValorizacao;
window.exportarRelatorioPropriedades = exportarRelatorioPropriedades;

console.log('✅ Sistema de Propriedades Adquiridas ativado!');

// ============================================
// CONTROLE DO IMPOSTO DE SELO - APENAS VERIFICAÇÃO DE PREJUÍZO
// ============================================

/**
 * Versão corrigida do pagamento do imposto de selo
 * Só desconta se o mês NÃO tiver prejuízo (lucro >= 0)
 */
function pagarImpostoSeloCorrigido() {
    // Obter o mês atual formatado para buscar no histórico
    const mesAtual = dataSimulador.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    
    // Buscar o registro do mês atual no histórico mensal
    const registroMes = historicoMensal.find(m => m.mes === mesAtual);
    
    // Se encontrou o registro, verificar se houve lucro ou prejuízo
    if (registroMes) {
        const lucroMes = registroMes.lucro || 0;
        
        // SE HOUVE PREJUÍZO (lucro negativo) - NÃO PAGA IMPOSTO
        if (lucroMes < 0) {
            console.log(`📊 Imposto de Selo: Mês ${mesAtual} com prejuízo de ${formatarMoeda(Math.abs(lucroMes))} Kz - isento`);
            
            // Registrar que não pagou (opcional - pode remover se não quiser)
            if (typeof _adicionarNoticia === 'function') {
                _adicionarNoticia(
                    '📊 Imposto de Selo Isento',
                    `Mês ${mesAtual} com prejuízo - isenção de imposto de selo aplicada.`,
                    'fiscal',
                    false
                );
            }
            
            return; // SAI DA FUNÇÃO SEM DESCONTAR NADA
        }
    }
    
    // SE CHEGOU AQUI: Ou não encontrou registro, ou teve lucro (ou zero)
    // Executar o pagamento normal do imposto (1% do faturamento)
    
    const faturamentoMes = estadoJogo?.faturamentoMes || 0;
    
    // Só paga se houver faturamento positivo
    if (faturamentoMes <= 0) {
        return; // Sem faturamento, não paga
    }
    
    const valorImposto = Math.round(faturamentoMes * 0.01);
    
    // Verificar se tem saldo
    if (estadoJogo.carteiraKz < valorImposto) {
        console.log(`⚠️ Imposto de Selo: Saldo insuficiente para pagar ${formatarMoeda(valorImposto)} Kz`);
        return;
    }
    
    // Processar o pagamento normalmente
    estadoJogo.carteiraKz -= valorImposto;
    estadoJogo.custosMes += valorImposto;
    
    // Registrar transação
    registrarTransacao('imposto', 'saida', valorImposto, 'Kz', 
        `Imposto de Selo (1%) - ${mesAtual}`);
    
    // Registrar custo fiscal se a função existir
    if (typeof registrarCustoFiscal === 'function') {
        registrarCustoFiscal('imposto_selo', valorImposto);
    }
    
    console.log(`✅ Imposto de Selo pago: ${formatarMoeda(valorImposto)} Kz`);
}

// ============================================
// SUBSTITUIR A FUNÇÃO ORIGINAL
// ============================================

// Salvar referência original (caso precise)
const _pagarImpostoSeloOriginal = pagarImpostoSelo;

// Substituir pela versão corrigida
pagarImpostoSelo = pagarImpostoSeloCorrigido;

console.log('✅ Controle do Imposto de Selo ativado - só desconta em meses com LUCRO');

// ============================================
// SISTEMA DE RELATÓRIO ANUAL - BASEADO NOS DADOS MENSAIS
// ============================================

// ============================================
// FUNÇÕES DE PROCESSAMENTO DO RELATÓRIO ANUAL
// ============================================

/**
 * Processar relatório anual somando os meses de janeiro a dezembro
 * @param {number} ano - Ano a ser processado (ex: 2025, 2026)
 * @returns {Object} Dados consolidados do ano
 */
function processarRelatorioAnual(ano) {
    console.log(`📊 Processando relatório anual para ${ano}...`);
    
    // Filtrar meses do ano específico (janeiro a dezembro)
    const mesesDoAno = historicoMensal.filter(m => {
        if (!m || !m.mes) return false;
        // Verificar se o mês pertence ao ano solicitado
        return m.mes.includes(ano.toString());
    });
    
    console.log(`Meses encontrados: ${mesesDoAno.length}`);
    
    if (mesesDoAno.length === 0) {
        console.log('Nenhum mês encontrado para o ano', ano);
        return null;
    }
    
    // Inicializar totais
    let receitaTotal = 0;
    let custosTotal = 0;
    let lucroTotal = 0;
    let mesesComLucro = 0;
    let mesesComPrejuizo = 0;
    
    // Array para armazenar detalhes mensais
    const detalhesMensais = [];
    
    // Somar todos os meses
    mesesDoAno.forEach(mes => {
        const faturacao = mes.faturacao || 0;
        const custos = mes.custos || 0;
        const lucro = mes.lucro || 0;
        
        receitaTotal += faturacao;
        custosTotal += custos;
        lucroTotal += lucro;
        
        // Contar meses com lucro/prejuízo
        if (lucro > 0) {
            mesesComLucro++;
        } else if (lucro < 0) {
            mesesComPrejuizo++;
        }
        
        // Guardar detalhe do mês
        detalhesMensais.push({
            mes: mes.mes,
            faturacao: faturacao,
            custos: custos,
            lucro: lucro,
            status: lucro >= 0 ? 'lucro' : 'prejuizo'
        });
    });
    
    // Calcular imposto (25% sobre o lucro total, apenas se houver lucro)
    const impostoDevido = lucroTotal > 0 ? Math.round(lucroTotal * 0.25) : 0;
    const lucroLiquido = lucroTotal - impostoDevido;
    
    // Determinar desempenho da empresa
    let desempenho = '';
    let corDesempenho = '';
    
    if (lucroTotal > 0) {
        if (mesesComPrejuizo === 0) {
            desempenho = 'EXCELENTE - Todos os meses com lucro';
            corDesempenho = 'var(--accent-green)';
        } else if (mesesComLucro > mesesComPrejuizo) {
            desempenho = 'BOM - Maioria dos meses com lucro';
            corDesempenho = 'var(--accent-green)';
        } else if (mesesComLucro === mesesComPrejuizo) {
            desempenho = 'REGULAR - Mesmo número de meses com lucro e prejuízo';
            corDesempenho = 'var(--accent-yellow)';
        } else {
            desempenho = 'FRACO - Maioria dos meses com prejuízo, mas ano fechou com lucro';
            corDesempenho = 'var(--accent-yellow)';
        }
    } else if (lucroTotal < 0) {
        if (mesesComPrejuizo === 12) {
            desempenho = 'CRÍTICO - Todos os meses com prejuízo';
            corDesempenho = 'var(--accent-red)';
        } else {
            desempenho = 'RUIM - Ano fechou com prejuízo';
            corDesempenho = 'var(--accent-red)';
        }
    } else {
        desempenho = 'NEUTRO - Ano fechou com lucro zero';
        corDesempenho = 'var(--accent-yellow)';
    }
    
    // Calcular margens
    const margemBruta = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
    const margemLiquida = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;
    
    // Criar objeto com todos os dados do ano
    const relatorioAnual = {
        ano: ano,
        receitaTotal: receitaTotal,
        custosTotal: custosTotal,
        lucroTotal: lucroTotal,
        impostoDevido: impostoDevido,
        lucroLiquido: lucroLiquido,
        mesesProcessados: mesesDoAno.length,
        mesesComLucro: mesesComLucro,
        mesesComPrejuizo: mesesComPrejuizo,
        desempenho: desempenho,
        corDesempenho: corDesempenho,
        margemBruta: margemBruta.toFixed(2),
        margemLiquida: margemLiquida.toFixed(2),
        detalhesMensais: detalhesMensais,
        status: impostoDevido > 0 ? 'imposto_devido' : 'sem_imposto',
        fiscal: {
            pago: false,
            dataPagamento: null,
            multaAplicada: false,
            multaValor: 0
        }
    };
    
    console.log('✅ Relatório anual processado:', {
        ano: ano,
        receita: formatarMoeda(receitaTotal),
        custos: formatarMoeda(custosTotal),
        lucro: formatarMoeda(lucroTotal),
        imposto: formatarMoeda(impostoDevido),
        desempenho: desempenho
    });
    
    return relatorioAnual;
}

// ============================================
// FUNÇÃO PARA MOSTRAR O RELATÓRIO ANUAL
// ============================================

/**
 * Mostrar relatório anual detalhado com todos os dados
 */
function mostrarRelatorioAnualCompleto() {
    // Obter anos disponíveis no histórico mensal
    const anosDisponiveis = [...new Set(historicoMensal
        .filter(m => m && m.mes)
        .map(m => {
            const partes = m.mes.split(' de ');
            return partes.length > 1 ? parseInt(partes[1]) : null;
        })
        .filter(a => a !== null)
    )].sort((a, b) => b - a); // Do mais recente para o mais antigo
    
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-gold);">📋 Relatórios Anuais</h2>
                <button onclick="mostrarHistorico()" 
                        style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar ao Histórico
                </button>
            </div>
    `;
    
    if (anosDisponiveis.length === 0) {
        html += `
            <div style="background: var(--bg-secondary); padding: 40px; border-radius: 8px; text-align: center;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">📭 Nenhum dado anual disponível</p>
                <p style="color: var(--text-secondary);">Complete pelo menos um ano de simulação para gerar relatórios.</p>
            </div>
        `;
    } else {
        // Para cada ano disponível, processar e mostrar o relatório
        anosDisponiveis.forEach(ano => {
            const relatorio = processarRelatorioAnual(ano);
            if (!relatorio) return;
            
            html += `
                <div style="background: var(--bg-secondary); border-radius: 8px; margin-bottom: 30px; overflow: hidden; border: 1px solid var(--border-color);">
                    <!-- Cabeçalho do Ano -->
                    <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 20px; border-bottom: 2px solid ${relatorio.corDesempenho};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="color: var(--accent-gold); margin: 0; font-size: 1.8rem;">Exercício Fiscal ${ano}</h2>
                            <div style="text-align: right;">
                                <span style="color: ${relatorio.corDesempenho}; font-size: 1.1rem; font-weight: 700; display: block;">
                                    ${relatorio.desempenho}
                                </span>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    ${relatorio.mesesProcessados} meses processados
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px;">
                        <!-- Cards de Resumo Anual -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Receita Total</p>
                                <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">${formatarMoeda(relatorio.receitaTotal)} Kz</p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Custos Totais</p>
                                <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">${formatarMoeda(relatorio.custosTotal)} Kz</p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Lucro/Prejuízo</p>
                                <p style="color: ${relatorio.lucroTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.3rem; font-weight: 700;">
                                    ${relatorio.lucroTotal >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroTotal))} Kz
                                </p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Margem Bruta</p>
                                <p style="color: ${relatorio.margemBruta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.3rem; font-weight: 700;">
                                    ${relatorio.margemBruta}%
                                </p>
                            </div>
                        </div>
                        
                        <!-- Resumo de Impostos e Desempenho -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Imposto Industrial (25%)</p>
                                <p style="color: ${relatorio.impostoDevido > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size: 1.2rem; font-weight: 700;">
                                    ${relatorio.impostoDevido > 0 ? formatarMoeda(relatorio.impostoDevido) + ' Kz' : '0 Kz (isento)'}
                                </p>
                                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 5px;">
                                    ${relatorio.impostoDevido > 0 ? 'Imposto a pagar' : 'Sem imposto devido'}
                                </p>
                            </div>
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Lucro Líquido</p>
                                <p style="color: ${relatorio.lucroLiquido >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.2rem; font-weight: 700;">
                                    ${relatorio.lucroLiquido >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroLiquido))} Kz
                                </p>
                                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 5px;">
                                    Margem líquida: ${relatorio.margemLiquida}%
                                </p>
                            </div>
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Resumo Mensal</p>
                                <div style="display: flex; gap: 10px; justify-content: center;">
                                    <div>
                                        <span style="color: var(--accent-green); font-weight: 700;">${relatorio.mesesComLucro}</span>
                                        <span style="color: var(--text-secondary);"> meses com lucro</span>
                                    </div>
                                    <div>
                                        <span style="color: var(--accent-red); font-weight: 700;">${relatorio.mesesComPrejuizo}</span>
                                        <span style="color: var(--text-secondary);"> meses com prejuízo</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tabela Mensal Detalhada -->
                        <h3 style="color: var(--accent-gold); margin: 20px 0 10px;">📊 Detalhamento Mensal</h3>
                        <div class="tabela-container" style="max-height: 300px; overflow-y: auto;">
                            <table style="width: 100%;">
                                <thead style="position: sticky; top: 0; background: var(--bg-tertiary);">
                                    <tr>
                                        <th>Mês</th>
                                        <th>Faturação</th>
                                        <th>Custos</th>
                                        <th>Lucro/Prejuízo</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            // Adicionar cada mês na tabela
            relatorio.detalhesMensais.forEach(mes => {
                const corLucro = mes.lucro >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
                const statusTexto = mes.lucro >= 0 ? '✅ Lucro' : '❌ Prejuízo';
                
                html += `
                    <tr>
                        <td><strong>${mes.mes}</strong></td>
                        <td>${formatarMoeda(mes.faturacao)} Kz</td>
                        <td>${formatarMoeda(mes.custos)} Kz</td>
                        <td style="color: ${corLucro};">${mes.lucro >= 0 ? '' : '-'}${formatarMoeda(Math.abs(mes.lucro))} Kz</td>
                        <td style="color: ${corLucro};">${statusTexto}</td>
                    </tr>
                `;
            });
            
            // Linha de totais
            html += `
                                </tbody>
                                <tfoot style="background: var(--bg-tertiary); font-weight: 700;">
                                    <tr>
                                        <td><strong>TOTAL</strong></td>
                                        <td><strong>${formatarMoeda(relatorio.receitaTotal)} Kz</strong></td>
                                        <td><strong>${formatarMoeda(relatorio.custosTotal)} Kz</strong></td>
                                        <td style="color: ${relatorio.lucroTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                            <strong>${relatorio.lucroTotal >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroTotal))} Kz</strong>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <!-- Botões de Ação -->
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            <button onclick="exportarRelatorioAnualTexto(${ano})" 
                                    style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                                📥 Exportar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

// ============================================
// FUNÇÃO PARA EXPORTAR RELATÓRIO EM TEXTO
// ============================================

/**
 * Exportar relatório anual para arquivo de texto
 */
function exportarRelatorioAnualTexto(ano) {
    const relatorio = processarRelatorioAnual(ano);
    if (!relatorio) {
        notificar('❌ Dados do relatório não encontrados');
        return;
    }
    
    let conteudo = "=".repeat(80) + "\n";
    conteudo += "RELATÓRIO ANUAL - EXERCÍCIO FISCAL\n";
    conteudo += "=".repeat(80) + "\n\n";
    conteudo += `Empresa: ${estadoJogo.nomeEmpresa}\n`;
    conteudo += `Ano: ${ano}\n`;
    conteudo += `Data de emissão: ${dataSimulador.toLocaleDateString()}\n`;
    conteudo += `Desempenho: ${relatorio.desempenho}\n\n`;
    
    conteudo += "=".repeat(80) + "\n";
    conteudo += "RESUMO DO EXERCÍCIO\n";
    conteudo += "=".repeat(80) + "\n";
    conteudo += `Receita Total: ${formatarMoeda(relatorio.receitaTotal)} Kz\n`;
    conteudo += `Custos Totais: ${formatarMoeda(relatorio.custosTotal)} Kz\n`;
    conteudo += `Lucro/Prejuízo: ${relatorio.lucroTotal >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroTotal))} Kz\n`;
    conteudo += `Margem Bruta: ${relatorio.margemBruta}%\n`;
    conteudo += `Imposto Industrial (25%): ${relatorio.impostoDevido > 0 ? formatarMoeda(relatorio.impostoDevido) + ' Kz' : '0 Kz (isento)'}\n`;
    conteudo += `Lucro Líquido: ${relatorio.lucroLiquido >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroLiquido))} Kz\n`;
    conteudo += `Margem Líquida: ${relatorio.margemLiquida}%\n\n`;
    
    conteudo += "=".repeat(80) + "\n";
    conteudo += "DETALHAMENTO MENSAL\n";
    conteudo += "=".repeat(80) + "\n";
    conteudo += "Mês".padEnd(20) + " | Faturação".padEnd(20) + " | Custos".padEnd(20) + " | Lucro/Prejuízo\n";
    conteudo += "-".repeat(80) + "\n";
    
    relatorio.detalhesMensais.forEach(mes => {
        const linha = 
            mes.mes.padEnd(20) + " | " + 
            formatarMoeda(mes.faturacao).padEnd(18) + " | " + 
            formatarMoeda(mes.custos).padEnd(18) + " | " + 
            (mes.lucro >= 0 ? '' : '-') + formatarMoeda(Math.abs(mes.lucro));
        conteudo += linha + "\n";
    });
    
    conteudo += "-".repeat(80) + "\n";
    conteudo += "TOTAL".padEnd(20) + " | " + 
                formatarMoeda(relatorio.receitaTotal).padEnd(18) + " | " + 
                formatarMoeda(relatorio.custosTotal).padEnd(18) + " | " + 
                (relatorio.lucroTotal >= 0 ? '' : '-') + formatarMoeda(Math.abs(relatorio.lucroTotal)) + "\n";
    
    conteudo += "\n" + "=".repeat(80) + "\n";
    conteudo += "Documento gerado pelo Simulador de Gestão Empresarial\n";
    conteudo += "=".repeat(80) + "\n";
    
    // Criar arquivo para download
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_anual_${ano}_${dataSimulador.toLocaleDateString().replace(/\//g, '_')}.txt`;
    a.click();
    
    notificar(`📥 Relatório anual ${ano} exportado com sucesso!`);
}

// ============================================
// INTEGRAÇÃO COM O SISTEMA EXISTENTE
// ============================================

// Substituir a função mostrarRelatorioAnual original
const _mostrarRelatorioAnualOriginal = mostrarRelatorioAnual;
mostrarRelatorioAnual = function() {
    mostrarRelatorioAnualCompleto();
};

// Adicionar ao menu de histórico
const _mostrarHistoricoOriginal = mostrarHistorico;
mostrarHistorico = function() {
    _mostrarHistoricoOriginal.apply(this, arguments);
    
    // Adicionar botão para ver relatório anual
    setTimeout(() => {
        const container = document.querySelector('.historico-container');
        if (container) {
            const botoesDiv = document.createElement('div');
            botoesDiv.style.cssText = 'display: flex; gap: 10px; margin: 20px 0; justify-content: center;';
            botoesDiv.innerHTML = `
                <button onclick="mostrarRelatorioAnualCompleto()" 
                        style="padding: 10px 20px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    📋 Ver Relatórios Anuais Completos
                </button>
            `;
            container.insertBefore(botoesDiv, container.firstChild);
        }
    }, 100);
};

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.mostrarRelatorioAnualCompleto = mostrarRelatorioAnualCompleto;
window.processarRelatorioAnual = processarRelatorioAnual;
window.exportarRelatorioAnualTexto = exportarRelatorioAnualTexto;

console.log('✅ Sistema de Relatório Anual ativado!');
console.log('📊 Baseado nos dados mensais de janeiro a dezembro');

// ============================================
// SISTEMA DE PAGAMENTO DE IMPOSTO E MULTAS AGT
// ============================================

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

const PRAZO_FISCAL = { mes: 2, dia: 10 }; // 10 de Março (mês 2 = Março)

// Dados da AGT (multas e penalidades)
let dadosAGT = {
    multaAtrasoEntrega: 0,
    multaNaoPagamento: 0,
    jurosMora: 0,
    totalDevido: 0,
    parcelamentoAtivo: false,
    parcelasRestantes: 0,
    valorParcela: 0,
    proximoVencimento: null,
    situacao: 'regular', // 'regular', 'pendente', 'suspenso', 'fechado'
    alertas: []
};

// Histórico de pagamentos de imposto
let historicoPagamentosImposto = [];

// ============================================
// FUNÇÕES DE PAGAMENTO DE IMPOSTO
// ============================================

/**
 * Pagar imposto industrial de um ano específico
 * @param {number} ano - Ano a ser pago
 */
function pagarImpostoAnual(ano) {
    // Processar relatório anual para obter os dados atualizados
    const relatorio = processarRelatorioAnual(ano);
    
    if (!relatorio) {
        notificar('❌ Relatório anual não encontrado');
        return;
    }
    
    // Verificar se já existe no histórico anual
    let registroAnual = historicoAnual.find(h => h.ano === ano);
    
    // Se não existir, criar um novo registro
    if (!registroAnual) {
        registroAnual = {
            ano: ano,
            receita: relatorio.receitaTotal,
            custos: relatorio.custosTotal,
            lucroAntes: relatorio.lucroTotal,
            imposto: relatorio.impostoDevido,
            lucroLiquido: relatorio.lucroLiquido,
            status: 'pendente',
            fiscal: {
                pago: false,
                dataPagamento: null,
                multaAplicada: false,
                multaValor: 0
            }
        };
        historicoAnual.push(registroAnual);
    }
    
    // Verificar se já foi pago
    if (registroAnual.fiscal.pago) {
        notificar(`✅ Imposto do ano ${ano} já foi pago em ${registroAnual.fiscal.dataPagamento}`);
        return;
    }
    
    // Calcular total devido (imposto + multas)
    const totalDevido = relatorio.impostoDevido + 
        (registroAnual.fiscal.multaValor || 0) + 
        dadosAGT.jurosMora;
    
    if (totalDevido === 0) {
        notificar(`ℹ️ Ano ${ano} não tem imposto a pagar (lucro zero ou prejuízo)`);
        registroAnual.fiscal.pago = true;
        registroAnual.fiscal.dataPagamento = dataSimulador.toLocaleDateString();
        registroAnual.status = 'pago';
        salvarEstadoSimulacao();
        mostrarRelatorioAnualCompleto();
        return;
    }
    
    // Verificar saldo
    if (estadoJogo.carteiraKz < totalDevido) {
        notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(totalDevido)} Kz`);
        return;
    }
    
    // Processar pagamento
    estadoJogo.carteiraKz -= totalDevido;
    
    // Registrar transação
    registrarTransacao('imposto', 'saida', totalDevido, 'Kz',
        `Imposto Industrial ${ano} - ${formatarMoeda(relatorio.impostoDevido)} Kz ${registroAnual.fiscal.multaValor > 0 ? '+ multa ' + formatarMoeda(registroAnual.fiscal.multaValor) + ' Kz' : ''}`);
    
    // Registrar no histórico de pagamentos
    historicoPagamentosImposto.push({
        data: dataSimulador.toLocaleDateString(),
        ano: ano,
        imposto: relatorio.impostoDevido,
        multa: registroAnual.fiscal.multaValor || 0,
        juros: dadosAGT.jurosMora,
        total: totalDevido,
        tipo: 'pagamento_normal'
    });
    
    // Atualizar registro anual
    registroAnual.fiscal.pago = true;
    registroAnual.fiscal.dataPagamento = dataSimulador.toLocaleDateString();
    registroAnual.status = 'pago';
    
    // Limpar multas e juros relacionados a este ano
    dadosAGT.multaAtrasoEntrega = 0;
    dadosAGT.multaNaoPagamento = 0;
    dadosAGT.jurosMora = 0;
    dadosAGT.totalDevido = 0;
    dadosAGT.situacao = 'regular';
    
    // Atualizar contabilista se existir
    if (contabilista) {
        contabilista.multa = 0;
    }
    
    notificar(`✅ Imposto ${ano} pago! Total: ${formatarMoeda(totalDevido)} Kz`);
    
    // Gerar notícia
    _adicionarNoticia(
        '✅ Imposto Industrial Pago',
        `Imposto do ano ${ano} no valor de ${formatarMoeda(relatorio.impostoDevido)} Kz foi pago com sucesso.`,
        'fiscal',
        false
    );
    
    atualizarCarteiras();
    salvarEstadoSimulacao();
    mostrarRelatorioAnualCompleto();
}

// ============================================
// FUNÇÕES DE VERIFICAÇÃO DE PRAZO E MULTAS
// ============================================

/**
 * Verificar prazo fiscal (10 de Março) e aplicar multas se necessário
 * Chamar em processarDia()
 */
function verificarPrazoFiscalAGT() {
    const mes = dataSimulador.getMonth();
    const dia = dataSimulador.getDate();
    
    // 10 de Março
    if (mes === PRAZO_FISCAL.mes && dia === PRAZO_FISCAL.dia) {
        console.log('📅 Verificando prazo fiscal - 10 de Março');
        
        const anoAnterior = dataSimulador.getFullYear() - 1;
        
        // Processar relatório do ano anterior
        const relatorio = processarRelatorioAnual(anoAnterior);
        
        if (!relatorio || relatorio.impostoDevido === 0) {
            console.log(`Ano ${anoAnterior} sem imposto devido`);
            return;
        }
        
        // Buscar registro no histórico anual
        let registroAnual = historicoAnual.find(h => h.ano === anoAnterior);
        
        if (!registroAnual) {
            // Criar registro se não existir
            registroAnual = {
                ano: anoAnterior,
                receita: relatorio.receitaTotal,
                custos: relatorio.custosTotal,
                lucroAntes: relatorio.lucroTotal,
                imposto: relatorio.impostoDevido,
                lucroLiquido: relatorio.lucroLiquido,
                status: 'pendente',
                fiscal: {
                    pago: false,
                    dataPagamento: null,
                    multaAplicada: false,
                    multaValor: 0
                }
            };
            historicoAnual.push(registroAnual);
        }
        
        // Verificar se já foi pago
        if (registroAnual.fiscal.pago) {
            console.log(`Imposto ${anoAnterior} já foi pago`);
            return;
        }
        
        // Aplicar multa por não pagamento (100% do imposto)
        const multa = relatorio.impostoDevido;
        
        registroAnual.fiscal.multaAplicada = true;
        registroAnual.fiscal.multaValor = multa;
        registroAnual.status = 'multado';
        
        dadosAGT.multaNaoPagamento = multa;
        dadosAGT.totalDevido += multa;
        dadosAGT.situacao = 'suspenso';
        
        if (contabilista) {
            contabilista.multa = (contabilista.multa || 0) + multa;
        }
        
        notificar(`🚨 MULTA AGT: Não pagamento do imposto ${anoAnterior}. Multa: ${formatarMoeda(multa)} Kz`);
        
        _adicionarNoticia(
            '⚠️ MULTA AGT - NÃO PAGAMENTO',
            `Imposto do ano ${anoAnterior} não foi pago até o prazo de 10/03/${dataSimulador.getFullYear()}. Multa de 100% aplicada: ${formatarMoeda(multa)} Kz.`,
            'fiscal',
            true
        );
        
        salvarEstadoSimulacao();
    }
}

/**
 * Aplicar multa por atraso na entrega do relatório
 * @param {number} ano - Ano do relatório
 * @param {number} imposto - Valor do imposto
 */
function aplicarMultaAtrasoEntrega(ano, imposto) {
    const multa = imposto * 2; // 200%
    
    let registroAnual = historicoAnual.find(h => h.ano === ano);
    
    if (!registroAnual) {
        registroAnual = {
            ano: ano,
            receita: 0,
            custos: 0,
            lucroAntes: 0,
            imposto: imposto,
            lucroLiquido: 0,
            status: 'multado',
            fiscal: {
                pago: false,
                dataPagamento: null,
                multaAplicada: true,
                multaValor: multa
            }
        };
        historicoAnual.push(registroAnual);
    } else {
        registroAnual.fiscal.multaAplicada = true;
        registroAnual.fiscal.multaValor += multa;
        registroAnual.status = 'multado';
    }
    
    dadosAGT.multaAtrasoEntrega = multa;
    dadosAGT.totalDevido += multa;
    dadosAGT.situacao = 'pendente';
    
    if (contabilista) {
        contabilista.multa = (contabilista.multa || 0) + multa;
    }
    
    notificar(`🚨 MULTA AGT: Atraso na entrega do relatório ${ano}. Multa: ${formatarMoeda(multa)} Kz`);
    
    _adicionarNoticia(
        '⚠️ MULTA AGT - ATRASO NA ENTREGA',
        `Relatório do ano ${ano} entregue com atraso. Multa de 200% aplicada: ${formatarMoeda(multa)} Kz.`,
        'fiscal',
        true
    );
    
    salvarEstadoSimulacao();
    
    return multa;
}

/**
 * Calcular juros de mora mensais
 * Chamar em processarDia() no dia 1 de cada mês
 */
function calcularJurosMoraAGT() {
    if (dadosAGT.totalDevido > 0 && !dadosAGT.parcelamentoAtivo) {
        const juros = Math.round(dadosAGT.totalDevido * 0.025); // 2.5% ao mês
        dadosAGT.jurosMora += juros;
        dadosAGT.totalDevido += juros;
        
        notificar(`💰 Juros de mora: +${formatarMoeda(juros)} Kz (2.5% ao mês)`);
        
        _adicionarNoticia(
            '📈 Juros de Mora Aplicados',
            `Foram aplicados ${formatarMoeda(juros)} Kz de juros de mora sobre dívidas com a AGT.`,
            'fiscal',
            false
        );
        
        salvarEstadoSimulacao();
    }
}

// ============================================
// FUNÇÕES DE NEGOCIAÇÃO DE MULTAS
// ============================================

/**
 * Mostrar interface de negociação de multas
 * @param {number} ano - Ano da multa
 */
function negociarMultaAnual(ano) {
    const registro = historicoAnual.find(h => h.ano === ano);
    
    if (!registro || !registro.fiscal.multaValor) {
        notificar('❌ Multa não encontrada');
        return;
    }
    
    const totalMulta = registro.fiscal.multaValor;
    
    let html = `
        <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">⚖️ Negociar Multa - Ano ${ano}</h2>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-red); margin-bottom: 10px;">Resumo da Dívida</h3>
                <div style="display: grid; gap: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Imposto devido:</span>
                        <span>${formatarMoeda(registro.imposto)} Kz</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Multa aplicada:</span>
                        <span style="color: var(--accent-red);">${formatarMoeda(totalMulta)} Kz</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Juros de mora acumulados:</span>
                        <span style="color: var(--accent-red);">${formatarMoeda(dadosAGT.jurosMora)} Kz</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <span style="color: var(--accent-red);">TOTAL DEVIDO:</span>
                        <span style="color: var(--accent-red);">${formatarMoeda(totalMulta + dadosAGT.jurosMora)} Kz</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <button onclick="pagarMultaVista(${ano})" 
                        style="width: 100%; padding: 15px; background: var(--accent-green); color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-bottom: 10px;">
                    💰 Pagar à Vista com 15% DESCONTO
                </button>
                <p style="color: var(--text-secondary); font-size: 12px; text-align: center;">
                    Valor com desconto: ${formatarMoeda(Math.round((totalMulta + dadosAGT.jurosMora) * 0.85))} Kz 
                    (economia de ${formatarMoeda(Math.round((totalMulta + dadosAGT.jurosMora) * 0.15))} Kz)
                </p>
            </div>
            
            <h3 style="color: var(--accent-gold); margin-bottom: 15px;">Ou parcelar em até 12x</h3>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <!-- Opção 3x -->
                <div class="opcao-parcela" onclick="selecionarOpcaoParcela(3, ${totalMulta + dadosAGT.jurosMora})" 
                     style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; text-align: center;">
                    <h4 style="color: var(--accent-gold); margin-bottom: 10px;">3x</h4>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Entrada: 30%</p>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Juros: 5%</p>
                    <p style="color: var(--accent-gold); margin: 10px 0;">Parcela:</p>
                    <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">
                        ${formatarMoeda(Math.round(((totalMulta + dadosAGT.jurosMora) * 0.7 * 1.05) / 3))} Kz
                    </p>
                    <p style="color: var(--text-secondary); font-size: 11px; margin-top: 5px;">
                        Entrada: ${formatarMoeda(Math.round((totalMulta + dadosAGT.jurosMora) * 0.3))} Kz
                    </p>
                </div>
                
                <!-- Opção 6x -->
                <div class="opcao-parcela" onclick="selecionarOpcaoParcela(6, ${totalMulta + dadosAGT.jurosMora})" 
                     style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; text-align: center;">
                    <h4 style="color: var(--accent-gold); margin-bottom: 10px;">6x</h4>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Entrada: 20%</p>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Juros: 8%</p>
                    <p style="color: var(--accent-gold); margin: 10px 0;">Parcela:</p>
                    <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">
                        ${formatarMoeda(Math.round(((totalMulta + dadosAGT.jurosMora) * 0.8 * 1.08) / 6))} Kz
                    </p>
                    <p style="color: var(--text-secondary); font-size: 11px; margin-top: 5px;">
                        Entrada: ${formatarMoeda(Math.round((totalMulta + dadosAGT.jurosMora) * 0.2))} Kz
                    </p>
                </div>
                
                <!-- Opção 12x -->
                <div class="opcao-parcela" onclick="selecionarOpcaoParcela(12, ${totalMulta + dadosAGT.jurosMora})" 
                     style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; text-align: center;">
                    <h4 style="color: var(--accent-gold); margin-bottom: 10px;">12x</h4>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Entrada: 10%</p>
                    <p style="color: var(--text-secondary); margin: 5px 0;">Juros: 12%</p>
                    <p style="color: var(--accent-gold); margin: 10px 0;">Parcela:</p>
                    <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">
                        ${formatarMoeda(Math.round(((totalMulta + dadosAGT.jurosMora) * 0.9 * 1.12) / 12))} Kz
                    </p>
                    <p style="color: var(--text-secondary); font-size: 11px; margin-top: 5px;">
                        Entrada: ${formatarMoeda(Math.round((totalMulta + dadosAGT.jurosMora) * 0.1))} Kz
                    </p>
                </div>
            </div>
            
            <div id="confirmacao-parcela" style="display: none; margin-bottom: 20px;">
                <button onclick="confirmarParcelamento(${ano})" 
                        style="width: 100%; padding: 15px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                    ✅ Confirmar Parcelamento
                </button>
            </div>
            
            <div style="text-align: center;">
                <button onclick="mostrarRelatorioAnualCompleto()" 
                        style="padding: 10px 30px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    Voltar
                </button>
            </div>
        </div>
        
        <style>
            .opcao-parcela:hover, .opcao-parcela.selecionada {
                border-color: var(--accent-gold) !important;
                background: rgba(214, 174, 100, 0.1) !important;
                transform: translateY(-2px);
                transition: all 0.3s;
            }
        </style>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
    
    // Variáveis globais para controle do parcelamento
    window.opcaoParcelaSelecionada = null;
    window.valorTotalParaParcelar = totalMulta + dadosAGT.jurosMora;
    window.anoMultaSelecionado = ano;
}

// Variáveis globais para parcelamento
let opcaoParcelaSelecionada = null;
let valorTotalParaParcelar = 0;
let anoMultaSelecionado = null;

/**
 * Selecionar opção de parcela
 */
window.selecionarOpcaoParcela = function(parcelas, total) {
    opcaoParcelaSelecionada = parcelas;
    valorTotalParaParcelar = total;
    document.querySelectorAll('.opcao-parcela').forEach(el => el.classList.remove('selecionada'));
    event.currentTarget.classList.add('selecionada');
    document.getElementById('confirmacao-parcela').style.display = 'block';
};

/**
 * Pagar multa à vista com desconto
 */
function pagarMultaVista(ano) {
    const registro = historicoAnual.find(h => h.ano === ano);
    if (!registro) return;
    
    const totalMulta = registro.fiscal.multaValor + dadosAGT.jurosMora;
    const valorComDesconto = Math.round(totalMulta * 0.85);
    
    if (estadoJogo.carteiraKz < valorComDesconto) {
        notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(valorComDesconto)} Kz`);
        return;
    }
    
    // Processar pagamento
    estadoJogo.carteiraKz -= valorComDesconto;
    
    registrarTransacao('imposto', 'saida', valorComDesconto, 'Kz',
        `Pagamento multa ${ano} com desconto: ${formatarMoeda(valorComDesconto)} Kz (economia: ${formatarMoeda(totalMulta - valorComDesconto)} Kz)`);
    
    // Registrar no histórico
    historicoPagamentosImposto.push({
        data: dataSimulador.toLocaleDateString(),
        ano: ano,
        imposto: 0,
        multa: registro.fiscal.multaValor,
        juros: dadosAGT.jurosMora,
        total: valorComDesconto,
        desconto: totalMulta - valorComDesconto,
        tipo: 'pagamento_multa_vista'
    });
    
    // Atualizar registros
    registro.fiscal.pago = true;
    registro.fiscal.dataPagamento = dataSimulador.toLocaleDateString();
    registro.fiscal.multaValor = 0;
    registro.status = 'pago';
    
    // Limpar dados AGT
    dadosAGT.multaAtrasoEntrega = 0;
    dadosAGT.multaNaoPagamento = 0;
    dadosAGT.jurosMora = 0;
    dadosAGT.totalDevido = 0;
    dadosAGT.situacao = 'regular';
    
    if (contabilista) {
        contabilista.multa = 0;
    }
    
    notificar(`✅ Multa paga com desconto! Economia: ${formatarMoeda(totalMulta - valorComDesconto)} Kz`);
    
    _adicionarNoticia(
        '💰 Multa AGT Liquidada',
        `Multa do ano ${ano} paga à vista com 15% de desconto. Economia de ${formatarMoeda(totalMulta - valorComDesconto)} Kz.`,
        'fiscal',
        false
    );
    
    atualizarCarteiras();
    salvarEstadoSimulacao();
    mostrarRelatorioAnualCompleto();
}

/**
 * Confirmar parcelamento da multa
 */
function confirmarParcelamento(ano) {
    if (!opcaoParcelaSelecionada) {
        notificar('❌ Selecione uma opção de parcelamento');
        return;
    }
    
    const registro = historicoAnual.find(h => h.ano === ano);
    if (!registro) return;
    
    const opcao = {
        3: { parcelas: 3, entrada: 0.30, juros: 0.05 },
        6: { parcelas: 6, entrada: 0.20, juros: 0.08 },
        12: { parcelas: 12, entrada: 0.10, juros: 0.12 }
    }[opcaoParcelaSelecionada];
    
    const entrada = Math.round(valorTotalParaParcelar * opcao.entrada);
    const saldoParcelado = Math.round((valorTotalParaParcelar - entrada) * (1 + opcao.juros));
    const valorParcela = Math.round(saldoParcelado / opcao.parcelas);
    
    // Verificar saldo para entrada
    if (estadoJogo.carteiraKz < entrada) {
        notificar(`❌ Saldo insuficiente para entrada. Necessário: ${formatarMoeda(entrada)} Kz`);
        return;
    }
    
    // Pagar entrada
    estadoJogo.carteiraKz -= entrada;
    
    registrarTransacao('imposto', 'saida', entrada, 'Kz',
        `Entrada parcelamento multa ${ano} (${opcao.parcelas}x) - ${formatarMoeda(entrada)} Kz`);
    
    // Configurar parcelamento
    dadosAGT.parcelamentoAtivo = true;
    dadosAGT.parcelasRestantes = opcao.parcelas;
    dadosAGT.valorParcela = valorParcela;
    
    // Calcular próximo vencimento (dia 1 do próximo mês)
    const proximoVenc = new Date(dataSimulador);
    proximoVenc.setMonth(proximoVenc.getMonth() + 1);
    proximoVenc.setDate(1);
    dadosAGT.proximoVencimento = proximoVenc.toLocaleDateString();
    
    // Registrar no histórico
    historicoPagamentosImposto.push({
        data: dataSimulador.toLocaleDateString(),
        ano: ano,
        imposto: 0,
        multa: registro.fiscal.multaValor,
        juros: dadosAGT.jurosMora,
        entrada: entrada,
        parcelas: opcao.parcelas,
        valorParcela: valorParcela,
        tipo: 'parcelamento'
    });
    
    // Atualizar registro (multa foi parcelada)
    registro.fiscal.multaValor = 0; // Multa foi parcelada
    registro.status = 'pendente';
    
    notificar(`✅ Parcelamento aprovado! ${opcao.parcelas}x de ${formatarMoeda(valorParcela)} Kz. Primeira parcela: ${dadosAGT.proximoVencimento}`);
    
    _adicionarNoticia(
        '📝 Acordo de Parcelamento AGT',
        `Multa do ano ${ano} parcelada em ${opcao.parcelas}x de ${formatarMoeda(valorParcela)} Kz. Mantenha o pagamento em dia para regularizar sua situação.`,
        'fiscal',
        true
    );
    
    atualizarCarteiras();
    salvarEstadoSimulacao();
    mostrarRelatorioAnualCompleto();
}

/**
 * Processar pagamento automático de parcelas
 * Chamar em processarDia()
 */
function processarParcelamentoAGT() {
    if (!dadosAGT.parcelamentoAtivo) return;
    if (dadosAGT.parcelasRestantes <= 0) return;
    
    // Verificar se é dia de pagamento (dia 1)
    if (dataSimulador.getDate() !== 1) return;
    
    // Verificar se é o mês do vencimento
    if (!dadosAGT.proximoVencimento) return;
    
    const [dia, mes, ano] = dadosAGT.proximoVencimento.split('/').map(Number);
    const dataVencimento = new Date(ano, mes - 1, dia);
    
    if (dataSimulador.toLocaleDateString() !== dadosAGT.proximoVencimento) return;
    
    // Verificar saldo
    if (estadoJogo.carteiraKz < dadosAGT.valorParcela) {
        // Falha no pagamento
        notificar('❌ Parcelamento AGT cancelado por falta de pagamento!');
        
        // Reaplicar multas com acréscimo de 50%
        const multaAdicional = Math.round((dadosAGT.parcelasRestantes * dadosAGT.valorParcela) * 0.5);
        dadosAGT.totalDevido = (dadosAGT.parcelasRestantes * dadosAGT.valorParcela) + multaAdicional;
        
        // Cancelar parcelamento
        dadosAGT.parcelamentoAtivo = false;
        dadosAGT.parcelasRestantes = 0;
        dadosAGT.situacao = 'suspenso';
        
        _adicionarNoticia(
            '❌ Parcelamento Cancelado',
            `Acordo com AGT cancelado por falta de pagamento. Multa adicional de 50% aplicada.`,
            'fiscal',
            true
        );
        
        salvarEstadoSimulacao();
        return;
    }
    
    // Pagar parcela
    estadoJogo.carteiraKz -= dadosAGT.valorParcela;
    dadosAGT.parcelasRestantes--;
    
    const parcelaAtual = (opcaoParcelaSelecionada || 12) - dadosAGT.parcelasRestantes;
    
    registrarTransacao('imposto', 'saida', dadosAGT.valorParcela, 'Kz',
        `Parcela ${parcelaAtual}/${opcaoParcelaSelecionada || 12} - Acordo AGT`);
    
    // Calcular próximo vencimento
    if (dadosAGT.parcelasRestantes > 0) {
        const proximoVenc = new Date(dataSimulador);
        proximoVenc.setMonth(proximoVenc.getMonth() + 1);
        proximoVenc.setDate(1);
        dadosAGT.proximoVencimento = proximoVenc.toLocaleDateString();
        
        notificar(`💰 Parcela paga. Restam ${dadosAGT.parcelasRestantes}x de ${formatarMoeda(dadosAGT.valorParcela)} Kz`);
    } else {
        // Última parcela
        dadosAGT.parcelamentoAtivo = false;
        dadosAGT.totalDevido = 0;
        dadosAGT.situacao = 'regular';
        
        notificar('✅ Parcelamento AGT concluído! Dívida totalmente quitada.');
        
        _adicionarNoticia(
            '✅ Dívida AGT Quitada',
            'Todas as parcelas do acordo com a AGT foram pagas. Situação fiscal regularizada.',
            'fiscal',
            false
        );
    }
    
    atualizarCarteiras();
    salvarEstadoSimulacao();
}

// ============================================
// FUNÇÕES DE VISUALIZAÇÃO
// ============================================

/**
 * Mostrar histórico de pagamentos de imposto
 */
function mostrarHistoricoPagamentos() {
    const pagamentos = historicoPagamentosImposto.slice(-20).reverse();
    
    let html = `
        <div style="padding: 20px; max-width: 1000px; margin: 0 auto;">
            <h2 style="color: var(--accent-gold); margin-bottom: 20px;">📜 Histórico de Pagamentos à AGT</h2>
            
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📊 Resumo da Situação Fiscal</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="color: var(--text-secondary);">Situação AGT</p>
                        <p style="color: ${dadosAGT.situacao === 'regular' ? 'var(--accent-green)' : 
                                        dadosAGT.situacao === 'pendente' ? 'var(--accent-yellow)' : 
                                        'var(--accent-red)'}; font-size: 1.2rem; font-weight: 700;">
                            ${dadosAGT.situacao === 'regular' ? '✅ REGULAR' :
                              dadosAGT.situacao === 'pendente' ? '⏳ PENDENTE' :
                              '⚠️ SUSPENSO'}
                        </p>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="color: var(--text-secondary);">Total Pago</p>
                        <p style="color: var(--accent-gold); font-size: 1.2rem; font-weight: 700;">
                            ${formatarMoeda(historicoPagamentosImposto.reduce((acc, p) => acc + p.total, 0))} Kz
                        </p>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="color: var(--text-secondary);">Dívida Atual</p>
                        <p style="color: ${dadosAGT.totalDevido > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size: 1.2rem; font-weight: 700;">
                            ${dadosAGT.totalDevido > 0 ? formatarMoeda(dadosAGT.totalDevido) + ' Kz' : '0 Kz'}
                        </p>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; text-align: center;">
                        <p style="color: var(--text-secondary);">Parcelamento</p>
                        <p style="color: var(--accent-gold); font-size: 1.2rem; font-weight: 700;">
                            ${dadosAGT.parcelamentoAtivo ? 
                              `${dadosAGT.parcelasRestantes}x de ${formatarMoeda(dadosAGT.valorParcela)} Kz` : 
                              'Inativo'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px;">
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">📋 Últimos Pagamentos</h3>
                <div class="tabela-container">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Ano</th>
                                <th>Tipo</th>
                                <th>Imposto</th>
                                <th>Multa</th>
                                <th>Juros</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    if (pagamentos.length === 0) {
        html += `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px;">
                    📭 Nenhum pagamento registrado
                </td>
            </tr>
        `;
    } else {
        pagamentos.forEach(p => {
            html += `
                <tr>
                    <td>${p.data}</td>
                    <td>${p.ano}</td>
                    <td>${p.tipo === 'pagamento_normal' ? 'Imposto' : 
                           p.tipo === 'pagamento_multa_vista' ? 'Multa (vista)' : 
                           'Parcelamento'}</td>
                    <td>${p.imposto > 0 ? formatarMoeda(p.imposto) + ' Kz' : '-'}</td>
                    <td style="color: var(--accent-red);">${p.multa > 0 ? formatarMoeda(p.multa) + ' Kz' : '-'}</td>
                    <td style="color: var(--accent-red);">${p.juros > 0 ? formatarMoeda(p.juros) + ' Kz' : '-'}</td>
                    <td style="color: var(--accent-gold); font-weight: 700;">${formatarMoeda(p.total)} Kz</td>
                </tr>
            `;
        });
    }
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="mostrarRelatorioAnualCompleto()" 
                        style="padding: 10px 30px; background: var(--accent-gold); color: #000; border: none; border-radius: 4px; cursor: pointer;">
                    Voltar aos Relatórios
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

// ============================================
// INTEGRAÇÃO COM O RELATÓRIO ANUAL
// ============================================

// Modificar a função mostrarRelatorioAnualCompleto para incluir botões de pagamento
const _mostrarRelatorioAnualCompletoOriginal = mostrarRelatorioAnualCompleto;
mostrarRelatorioAnualCompleto = function() {
    _mostrarRelatorioAnualCompletoOriginal.apply(this, arguments);
    
    // Adicionar botões de pagamento e negociação após a renderização
    setTimeout(() => {
        document.querySelectorAll('[data-ano]').forEach(el => {
            const ano = el.getAttribute('data-ano');
            // Já estamos adicionando os botões no HTML gerado
        });
    }, 100);
};

// Modificar a função mostrarRelatorioAnualCompleto para incluir botões nos cards
const _gerarHTMLRelatorioOriginal = mostrarRelatorioAnualCompleto;
mostrarRelatorioAnualCompleto = function() {
    // Obter anos disponíveis
    const anosDisponiveis = [...new Set(historicoMensal
        .filter(m => m && m.mes)
        .map(m => {
            const partes = m.mes.split(' de ');
            return partes.length > 1 ? parseInt(partes[1]) : null;
        })
        .filter(a => a !== null)
    )].sort((a, b) => b - a);
    
    let html = `
        <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-gold);">📋 Relatórios Anuais</h2>
                <div>
                    <button onclick="mostrarHistoricoPagamentos()" 
                            style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; margin-right: 10px;">
                        📜 Histórico de Pagamentos
                    </button>
                    <button onclick="mostrarHistorico()" 
                            style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                        Voltar ao Histórico
                    </button>
                </div>
            </div>
            
            <!-- Status AGT -->
            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${dadosAGT.situacao === 'regular' ? 'var(--accent-green)' : dadosAGT.situacao === 'pendente' ? 'var(--accent-yellow)' : 'var(--accent-red)'};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: var(--text-secondary);">🏛️ Situação na AGT:</span>
                        <span style="color: ${dadosAGT.situacao === 'regular' ? 'var(--accent-green)' : dadosAGT.situacao === 'pendente' ? 'var(--accent-yellow)' : 'var(--accent-red)'}; font-weight: 700; margin-left: 10px;">
                            ${dadosAGT.situacao === 'regular' ? 'REGULAR' : dadosAGT.situacao === 'pendente' ? 'PENDENTE' : 'SUSPENSO'}
                        </span>
                    </div>
                    ${dadosAGT.totalDevido > 0 ? `
                        <div>
                            <span style="color: var(--accent-red);">Dívida: ${formatarMoeda(dadosAGT.totalDevido)} Kz</span>
                        </div>
                    ` : ''}
                </div>
            </div>
    `;
    
    if (anosDisponiveis.length === 0) {
        html += `
            <div style="background: var(--bg-secondary); padding: 40px; border-radius: 8px; text-align: center;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">📭 Nenhum dado anual disponível</p>
                <p style="color: var(--text-secondary);">Complete pelo menos um ano de simulação para gerar relatórios.</p>
            </div>
        `;
    } else {
        anosDisponiveis.forEach(ano => {
            const relatorio = processarRelatorioAnual(ano);
            if (!relatorio) return;
            
            // Buscar registro no histórico anual
            const registroAnual = historicoAnual.find(h => h.ano === ano) || {
                fiscal: { pago: false, multaValor: 0 }
            };
            
            const temImpostoPendente = relatorio.impostoDevido > 0 && !registroAnual.fiscal.pago;
            const temMulta = registroAnual.fiscal.multaValor > 0;
            
            html += `
                <div style="background: var(--bg-secondary); border-radius: 8px; margin-bottom: 30px; overflow: hidden; border: 1px solid var(--border-color);" data-ano="${ano}">
                    <!-- Cabeçalho do Ano -->
                    <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 20px; border-bottom: 2px solid ${relatorio.corDesempenho};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="color: var(--accent-gold); margin: 0; font-size: 1.8rem;">Exercício Fiscal ${ano}</h2>
                            <div style="text-align: right;">
                                <span style="color: ${relatorio.corDesempenho}; font-size: 1.1rem; font-weight: 700; display: block;">
                                    ${relatorio.desempenho}
                                </span>
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                    ${relatorio.mesesProcessados} meses processados
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px;">
                        <!-- Cards de Resumo Anual -->
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Receita Total</p>
                                <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">${formatarMoeda(relatorio.receitaTotal)} Kz</p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Custos Totais</p>
                                <p style="color: var(--accent-gold); font-size: 1.3rem; font-weight: 700;">${formatarMoeda(relatorio.custosTotal)} Kz</p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Lucro/Prejuízo</p>
                                <p style="color: ${relatorio.lucroTotal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.3rem; font-weight: 700;">
                                    ${relatorio.lucroTotal >= 0 ? '' : '-'}${formatarMoeda(Math.abs(relatorio.lucroTotal))} Kz
                                </p>
                            </div>
                            <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 8px; text-align: center;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem;">Margem Bruta</p>
                                <p style="color: ${relatorio.margemBruta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 1.3rem; font-weight: 700;">
                                    ${relatorio.margemBruta}%
                                </p>
                            </div>
                        </div>
                        
                        <!-- Resumo de Impostos e Status -->
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Imposto Industrial (25%)</p>
                                <p style="color: ${relatorio.impostoDevido > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size: 1.2rem; font-weight: 700;">
                                    ${relatorio.impostoDevido > 0 ? formatarMoeda(relatorio.impostoDevido) + ' Kz' : '0 Kz (isento)'}
                                </p>
                                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 5px;">
                                    ${relatorio.impostoDevido > 0 ? 'Imposto a pagar' : 'Sem imposto devido'}
                                </p>
                            </div>
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Status do Pagamento</p>
                                <p style="color: ${registroAnual.fiscal.pago ? 'var(--accent-green)' : (temMulta ? 'var(--accent-red)' : 'var(--accent-yellow)')}; font-size: 1.2rem; font-weight: 700;">
                                    ${registroAnual.fiscal.pago ? '✅ PAGO' : (temMulta ? '⚠️ COM MULTA' : '⏳ PENDENTE')}
                                </p>
                                ${registroAnual.fiscal.dataPagamento ? `
                                    <p style="color: var(--text-secondary); font-size: 0.8rem;">
                                        Pago em: ${registroAnual.fiscal.dataPagamento}
                                    </p>
                                ` : ''}
                            </div>
                            <div style="background: linear-gradient(145deg, #1a1a1a, #121212); padding: 15px; border-radius: 8px;">
                                <p style="color: var(--text-secondary); margin-bottom: 5px;">Multas Aplicadas</p>
                                <p style="color: ${registroAnual.fiscal.multaValor > 0 ? 'var(--accent-red)' : 'var(--accent-green)'}; font-size: 1.2rem; font-weight: 700;">
                                    ${registroAnual.fiscal.multaValor > 0 ? formatarMoeda(registroAnual.fiscal.multaValor) + ' Kz' : '0 Kz'}
                                </p>
                            </div>
                        </div>
                        
                        <!-- Botões de Ação -->
                        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                            ${temImpostoPendente ? `
                                <button onclick="pagarImpostoAnual(${ano})" 
                                        style="padding: 10px 20px; background: var(--accent-green); color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                                    💰 Pagar Imposto (${formatarMoeda(relatorio.impostoDevido)} Kz)
                                </button>
                            ` : ''}
                            
                            ${temMulta ? `
                                <button onclick="negociarMultaAnual(${ano})" 
                                        style="padding: 10px 20px; background: var(--accent-red); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                                    ⚖️ Negociar Multa (${formatarMoeda(registroAnual.fiscal.multaValor)} Kz)
                                </button>
                            ` : ''}
                            
                            <button onclick="exportarRelatorioAnualTexto(${ano})" 
                                    style="padding: 10px 20px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                                📥 Exportar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    document.getElementById('conteudoPrincipal').innerHTML = html;
};

// ============================================
// INTEGRAÇÃO COM O CICLO DE TEMPO
// ============================================

// Sobrescrever processarDia
processarDia = function() {
    const resultado = _processarDiaOriginal.apply(this, arguments);
    
    // Verificar prazo fiscal (10 de Março)
    verificarPrazoFiscalAGT();
    
    // Processar parcelamento se ativo
    processarParcelamentoAGT();
    
    return resultado;
};

// Sobrescrever processarMes
processarMes = function() {
    const resultado = _processarMesOriginal.apply(this, arguments);
    
    // Calcular juros de mora no dia 1 do mês
    if (dataSimulador.getDate() === 1) {
        calcularJurosMoraAGT();
    }
    
    return resultado;
};

// ============================================
// CARREGAR DADOS SALVOS
// ============================================

// Carregar dados da AGT do localStorage
try {
    const dadosAGTSalvos = localStorage.getItem('dadosAGT');
    if (dadosAGTSalvos) {
        dadosAGT = JSON.parse(dadosAGTSalvos);
    }
    
    const historicoPagamentosSalvo = localStorage.getItem('historicoPagamentosImposto');
    if (historicoPagamentosSalvo) {
        historicoPagamentosImposto = JSON.parse(historicoPagamentosSalvo);
    }
} catch(e) {
    console.error('Erro ao carregar dados da AGT:', e);
}

// Salvar dados ao salvar o jogo
 {
    _salvarEstadoOriginal.apply(this, arguments);
    
    localStorage.setItem('dadosAGT', JSON.stringify(dadosAGT));
    localStorage.setItem('historicoPagamentosImposto', JSON.stringify(historicoPagamentosImposto));
};

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.pagarImpostoAnual = pagarImpostoAnual;
window.negociarMultaAnual = negociarMultaAnual;
window.pagarMultaVista = pagarMultaVista;
window.confirmarParcelamento = confirmarParcelamento;
window.mostrarHistoricoPagamentos = mostrarHistoricoPagamentos;
window.verificarPrazoFiscalAGT = verificarPrazoFiscalAGT;
window.aplicarMultaAtrasoEntrega = aplicarMultaAtrasoEntrega;
window.calcularJurosMoraAGT = calcularJurosMoraAGT;
window.processarParcelamentoAGT = processarParcelamentoAGT;

console.log('✅ Sistema de Pagamento de Imposto e Multas AGT ativado!');
console.log('📅 Prazo fiscal: 10 de Março');
console.log('💰 Multa por atraso: 200% do imposto');
console.log('💰 Multa por não pagamento: 100% do imposto');
console.log('📈 Juros de mora: 2.5% ao mês');

// ============================================
// SISTEMA DE MULTAS AGT - CÓDIGO DE SUPORTE
// ============================================
// APENAS para gestão de multas - não substitui funções originais
// Compatível com o sistema existente de relatório anual
// ============================================

// ── FUNÇÃO 1: _verificarPrazoFiscalCorrigido() ─────────────────────────
// Aplica multa de 200% se imposto não pago e contabilista não entregou a tempo
function _verificarPrazoFiscalCorrigido() {
    const mes = dataSimulador.getMonth(); // 0=Jan, 1=Fev, 2=Mar
    const dia = dataSimulador.getDate();
    const anoAtual = dataSimulador.getFullYear();

    // Antes de 10 de Março: nunca aplicar multa
    if (mes < 2) return;
    if (mes === 2 && dia < 10) return;

    // Verificar apenas o ano anterior
    const anoVerificar = anoAtual - 1;

    historicoAnual.forEach(registo => {
        // Apenas o ano anterior ao actual
        if (registo.ano !== anoVerificar) return;

        // SE IMPOSTO JÁ PAGO: garantir que não há multa indevida
        if (registo.impostoPago === true) {
            _anularMultaSeIndevida(registo);
            return;
        }

        // SEM IMPOSTO A PAGAR: nunca multa
        if (!registo.imposto || registo.imposto <= 0) return;
        if (!registo.lucroAntes || registo.lucroAntes <= 0) return;

        // MULTA JÁ APLICADA: não duplicar
        if (registo.multaAplicada === true) return;

        // VERIFICAR SE CONTABILISTA ENTREGOU A TEMPO
        // Entregou a tempo se: contratado E dataEntrega passou E não está marcado como fora do prazo
        const entregouATempo = 
            contabilista.contratado === true &&
            contabilista.dataEntrega &&
            calcularDiasRestantes(contabilista.dataEntrega) <= 0 &&
            !contabilista._entregaForaDoPrazo;

        // Se entregou a tempo, não aplica multa
        if (entregouATempo) return;

        // APLICAR MULTA (Regra 3: multa = imposto × 2)
        const multa = Math.round(registo.imposto * 2);
        
        // Usar campos existentes no historicoAnual
        registo.multaAplicada = true;
        registo.multaValor = multa;
        registo.status = 'multado';
        
        // Sincronizar com contabilista
        if (contabilista) {
            contabilista.multa = multa;
        }

        // Usar _adicionarNoticia do código de suporte anterior
        if (typeof _adicionarNoticia === 'function') {
            _adicionarNoticia(
                '⚠️ MULTA AGT APLICADA',
                `Relatório fiscal do ano ${registo.ano} apresentado fora do prazo. Multa: ${formatarMoeda(multa)} Kz (2× o imposto de ${formatarMoeda(registo.imposto)} Kz). Pague até 01/06/${anoAtual} ou negocie no menu Estratégia.`,
                'fiscal',
                true
            );
        }

        // Notificar usuário
        if (typeof notificar === 'function') {
            notificar(`🚨 MULTA AGT de ${formatarMoeda(multa)} Kz aplicada! Prazo: 01/06/${anoAtual}. Negoceie no menu Estratégia.`);
        }

        // Persistir estado
        if (typeof salvarEstadoSimulacao === 'function') {
            salvarEstadoSimulacao();
        }
    });
}

// ── FUNÇÃO 2: _anularMultaSeIndevida(registo) ─────────────────────────
// Anula multa aplicada indevidamente (quando imposto já estava pago)
function _anularMultaSeIndevida(registo) {
    if (!registo) return;
    if (registo.impostoPago !== true) return;
    if (!registo.multaAplicada) return;
    if (registo.multaPaga === true) return; // Já foi paga legitimamente

    // Anular todos os campos da multa
    registo.multaAplicada = false;
    registo.multaValor = 0;
    registo.multaParcelada = false;
    registo.parcelasRestantes = 0;
    registo.valorParcela = 0;
    
    // Atualizar status se não houver outras pendências
    if (registo.impostoPago) {
        registo.status = 'pago';
    }

    // Sincronizar com contabilista
    if (contabilista) {
        contabilista.multa = 0;
        contabilista.multaParcelada = false;
        contabilista.parcelasRestantes = 0;
        contabilista.valorParcela = 0;
    }

    // Notificar usuário
    if (typeof notificar === 'function') {
        notificar('✅ Multa AGT anulada: o imposto já estava pago dentro do prazo.');
    }

    // Registrar notícia
    if (typeof _adicionarNoticia === 'function') {
        _adicionarNoticia(
            '✅ Multa AGT Anulada',
            `A multa do ano ${registo.ano} foi anulada porque o imposto de ${formatarMoeda(registo.imposto)} Kz foi pago dentro do prazo legal.`,
            'fiscal',
            false
        );
    }

    // Persistir estado
    if (typeof salvarEstadoSimulacao === 'function') {
        salvarEstadoSimulacao();
    }
}

// ── FUNÇÃO 3: _verificarPagamentoImpostoEAnularMulta() ─────────────────
// Chamada APÓS qualquer pagamento de imposto para anular multas indevidas
function _verificarPagamentoImpostoEAnularMulta() {
    if (!historicoAnual || !Array.isArray(historicoAnual)) return;
    
    historicoAnual.forEach(registo => {
        if (registo && registo.impostoPago === true) {
            _anularMultaSeIndevida(registo);
        }
    });
}

// ── FUNÇÃO 4: _verificarPrazoMulta1Junho() ────────────────────────────
// Verifica se é 1 de Junho e encerra empresa se multa não paga/não parcelada
function _verificarPrazoMulta1Junho() {
    const mes = dataSimulador.getMonth(); // 5 = Junho
    const dia = dataSimulador.getDate();

    // Só executa no dia 1 de Junho
    if (mes !== 5 || dia !== 1) return;

    // Procura registo com multa aplicada, não paga e não parcelada
    const registoComMulta = historicoAnual.find(r => 
        r && r.multaAplicada === true && 
        r.multaPaga !== true && 
        r.multaParcelada !== true
    );

    if (!registoComMulta) return;

    // Tentar debitar automaticamente (Regra 4: se tem saldo, paga automaticamente)
    if (estadoJogo.carteiraKz >= registoComMulta.multaValor) {
        estadoJogo.carteiraKz -= registoComMulta.multaValor;
        registoComMulta.multaPaga = true;
        registoComMulta.impostoPago = true;
        registoComMulta.status = 'pago';
        
        if (contabilista) {
            contabilista.multa = 0;
        }

        // Registrar transação
        if (typeof registrarTransacao === 'function') {
            registrarTransacao('multa', 'saida', registoComMulta.multaValor, 'Kz',
                `Multa AGT paga automaticamente (prazo 01/06) — Ano ${registoComMulta.ano}`);
        }

        // Notificar
        if (typeof notificar === 'function') {
            notificar(`✅ Multa AGT de ${formatarMoeda(registoComMulta.multaValor)} Kz paga automaticamente.`);
        }

        // Atualizar interface
        if (typeof atualizarCarteiras === 'function') {
            atualizarCarteiras();
        }
        
        if (typeof salvarEstadoSimulacao === 'function') {
            salvarEstadoSimulacao();
        }

    } else {
        // Sem saldo: empresa encerra (Regra 4)
        _encerrarEmpresaPorMultaAGT(registoComMulta);
    }
}

// ── FUNÇÃO 5: _verificarPrestacoesMensaisMulta() ──────────────────────
// Debita prestação da multa parcelada no dia 1 de cada mês
function _verificarPrestacoesMensaisMulta() {
    // Só executa no dia 1 de cada mês
    if (dataSimulador.getDate() !== 1) return;

    // Procura registo com parcelamento ativo
    const registo = historicoAnual.find(r => 
        r && r.multaParcelada === true && 
        r.parcelasRestantes > 0 && 
        r.multaPaga !== true
    );
    
    if (!registo) return;

    // Evitar débito duplo no mesmo mês usando sessionStorage
    const chave = `multaParcela_${dataSimulador.getMonth()}_${dataSimulador.getFullYear()}`;
    if (sessionStorage.getItem(chave)) return;
    sessionStorage.setItem(chave, '1');

    // Verificar saldo
    if (estadoJogo.carteiraKz < registo.valorParcela) {
        // Sem saldo: empresa encerra (Regra 5)
        if (typeof notificar === 'function') {
            notificar('❌ Sem saldo para prestação da multa AGT. Empresa em risco!');
        }
        
        if (!registo._avisosNaoPagamento) registo._avisosNaoPagamento = 0;
        registo._avisosNaoPagamento++;
        
        // Na primeira falta, encerra (Regra 5)
        if (registo._avisosNaoPagamento >= 1) {
            _encerrarEmpresaPorMultaAGT(registo);
        }
        return;
    }

    // Pagar parcela
    estadoJogo.carteiraKz -= registo.valorParcela;
    registo.parcelasRestantes--;
    
    if (contabilista) {
        contabilista.parcelasRestantes = registo.parcelasRestantes;
    }

    const parcelaPaga = 12 - registo.parcelasRestantes;

    // Registrar transação
    if (typeof registrarTransacao === 'function') {
        registrarTransacao('multa', 'saida', registo.valorParcela, 'Kz',
            `Prestação ${parcelaPaga}/12 da multa AGT — Ano ${registo.ano}`);
    }

    // Notificar
    if (typeof notificar === 'function') {
        notificar(`💰 Multa AGT: prestação ${parcelaPaga}/12 paga — ${formatarMoeda(registo.valorParcela)} Kz`);
    }

    // Verificar se foi a última parcela
    if (registo.parcelasRestantes === 0) {
        registo.multaPaga = true;
        registo.impostoPago = true;
        registo.status = 'pago';
        
        if (contabilista) {
            contabilista.multa = 0;
            contabilista.multaParcelada = false;
            contabilista.parcelasRestantes = 0;
            contabilista.valorParcela = 0;
        }

        if (typeof notificar === 'function') {
            notificar('✅ Multa AGT totalmente liquidada! Empresa em conformidade fiscal.');
        }

        if (typeof _adicionarNoticia === 'function') {
            _adicionarNoticia(
                '✅ Multa AGT Totalmente Paga',
                `As 12 prestações da multa do ano ${registo.ano} foram pagas. Empresa em plena conformidade fiscal.`,
                'fiscal',
                false
            );
        }
    }

    // Atualizar interface e persistir
    if (typeof atualizarCarteiras === 'function') {
        atualizarCarteiras();
    }
    
    if (typeof salvarEstadoSimulacao === 'function') {
        salvarEstadoSimulacao();
    }
}

// ── FUNÇÃO 6: _encerrarEmpresaPorMultaAGT(registo) ────────────────────
// Encerra empresa por incumprimento fiscal (game over)
function _encerrarEmpresaPorMultaAGT(registo) {
    // Parar o temporizador principal
    if (typeof intervaloPrincipal !== 'undefined' && intervaloPrincipal) {
        clearInterval(intervaloPrincipal);
        intervaloPrincipal = null;
    }

    // Notificar
    if (typeof notificar === 'function') {
        notificar('❌ Por incumprimento fiscal, a empresa foi encerrada pela AGT!');
    }

    // Registrar notícia
    if (typeof _adicionarNoticia === 'function') {
        _adicionarNoticia(
            '🏛️ EMPRESA ENCERRADA PELA AGT',
            `Por não liquidar a multa fiscal de ${formatarMoeda(registo.multaValor)} Kz do ano ${registo.ano}, a AGT encerrou a empresa.`,
            'fiscal',
            true
        );
    }

    // Mostrar tela de game over
    const conteudo = document.getElementById('conteudoPrincipal');
    if (conteudo) {
        conteudo.innerHTML = `
            <div style="text-align:center;padding:60px 20px;">
                <h2 style="color:var(--accent-red);font-size:2rem;margin-bottom:20px;">
                    🏛️ EMPRESA ENCERRADA PELA AGT
                </h2>
                <p style="color:var(--text-secondary);margin-bottom:10px;">
                    Por incumprimento das obrigações fiscais,
                    a sua empresa foi encerrada.
                </p>
                <p style="color:var(--accent-red);margin-bottom:8px;">
                    Multa não paga: ${formatarMoeda(registo.multaValor)} Kz
                </p>
                <p style="color:var(--text-secondary);margin-bottom:30px;">
                    Ano em falta: ${registo.ano}
                </p>
                <button onclick="reiniciarSimulacao()"
                        style="background:var(--accent-gold);color:#000;
                               border:none;padding:15px 40px;
                               border-radius:8px;font-size:1.1rem;
                               font-weight:700;cursor:pointer;">
                    🔄 Recomeçar Simulação
                </button>
            </div>
        `;
    }
}

// ── FUNÇÃO 7: window.negociarMultaAGT() ───────────────────────────────
// Parcela a multa em 12 prestações (suspende prazo de encerramento)
window.negociarMultaAGT = function() {
    // Procura registo com multa aplicada, não paga e não parcelada
    const registo = historicoAnual.find(r => 
        r && r.multaAplicada === true && 
        r.multaPaga !== true && 
        r.multaParcelada !== true
    );
    
    if (!registo) {
        if (typeof notificar === 'function') {
            notificar('Sem multa pendente para negociar.');
        }
        return;
    }

    const parcela = Math.round(registo.multaValor / 12);

    // Marcar como parcelado
    registo.multaParcelada = true;
    registo.parcelasRestantes = 12;
    registo.valorParcela = parcela;

    // Sincronizar com contabilista
    if (contabilista) {
        contabilista.multa = registo.multaValor;
        contabilista.multaParcelada = true;
        contabilista.parcelasRestantes = 12;
        contabilista.valorParcela = parcela;
    }

    // Registrar notícia
    if (typeof _adicionarNoticia === 'function') {
        _adicionarNoticia(
            '🤝 Multa AGT Parcelada',
            `Multa de ${formatarMoeda(registo.multaValor)} Kz negociada em 12 prestações mensais de ${formatarMoeda(parcela)} Kz. Prazo de encerramento suspenso. Primeira prestação: dia 1 do próximo mês.`,
            'fiscal',
            true
        );
    }

    // Notificar
    if (typeof notificar === 'function') {
        notificar(`✅ Multa parcelada! 12× de ${formatarMoeda(parcela)} Kz/mês`);
    }

    // Persistir
    if (typeof salvarEstadoSimulacao === 'function') {
        salvarEstadoSimulacao();
    }

    // Actualizar menu estratégia se disponível
    if (typeof window.mostrarEstrategia === 'function') {
        window.mostrarEstrategia();
    }
};

// ── FUNÇÃO 8: window.pagarMultaAGTVista() ─────────────────────────────
// Paga multa à vista com 10% de desconto
window.pagarMultaAGTVista = function() {
    // Procura registo com multa aplicada e não paga
    const registo = historicoAnual.find(r => 
        r && r.multaAplicada === true && 
        r.multaPaga !== true
    );
    
    if (!registo) {
        if (typeof notificar === 'function') {
            notificar('Sem multa para pagar.');
        }
        return;
    }

    const valorComDesconto = Math.round(registo.multaValor * 0.90); // 10% desconto

    // Verificar saldo
    if (estadoJogo.carteiraKz < valorComDesconto) {
        if (typeof notificar === 'function') {
            notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(valorComDesconto)} Kz`);
        }
        return;
    }

    // Processar pagamento
    estadoJogo.carteiraKz -= valorComDesconto;
    
    // Marcar como pago
    registo.multaPaga = true;
    registo.impostoPago = true;
    registo.multaParcelada = false;
    registo.parcelasRestantes = 0;
    registo.valorParcela = 0;
    registo.status = 'pago';
    
    // Sincronizar com contabilista
    if (contabilista) {
        contabilista.multa = 0;
        contabilista.multaParcelada = false;
        contabilista.parcelasRestantes = 0;
        contabilista.valorParcela = 0;
    }

    // Registrar transação
    if (typeof registrarTransacao === 'function') {
        registrarTransacao('multa', 'saida', valorComDesconto, 'Kz',
            `Multa AGT paga à vista (10% desconto) — Ano ${registo.ano}`);
    }

    // Notificar
    if (typeof notificar === 'function') {
        notificar(`✅ Multa paga à vista: ${formatarMoeda(valorComDesconto)} Kz (10% desconto — poupou ${formatarMoeda(registo.multaValor - valorComDesconto)} Kz)`);
    }

    // Registrar notícia
    if (typeof _adicionarNoticia === 'function') {
        _adicionarNoticia(
            '✅ Multa AGT Liquidada à Vista',
            `Multa do ano ${registo.ano} paga à vista com desconto de 10%. Valor pago: ${formatarMoeda(valorComDesconto)} Kz. Empresa em conformidade fiscal.`,
            'fiscal',
            false
        );
    }

    // Atualizar interface
    if (typeof atualizarCarteiras === 'function') {
        atualizarCarteiras();
    }
    
    if (typeof salvarEstadoSimulacao === 'function') {
        salvarEstadoSimulacao();
    }

    // Actualizar menu estratégia se disponível
    if (typeof window.mostrarEstrategia === 'function') {
        window.mostrarEstrategia();
    }
};

// ── FUNÇÃO 9: _injetarPainelMultaEstrategia() ─────────────────────────
// Injeta painel de negociação no menu Estratégia (evita duplicação)
function _injetarPainelMultaEstrategia() {
    // Procura registo com multa aplicada, não paga e não parcelada
    const registo = historicoAnual.find(r => 
        r && r.multaAplicada === true && 
        r.multaPaga !== true && 
        r.multaParcelada !== true
    );
    
    if (!registo) return;

    const container = document.getElementById('conteudoPrincipal');
    if (!container) return;
    
    // Evitar duplicação
    if (document.getElementById('painel-multa-agt')) return;

    const painel = document.createElement('div');
    painel.id = 'painel-multa-agt';
    painel.style.cssText = `
        margin-top:20px;
        background:linear-gradient(145deg,#1a0505,#0a0000);
        border:2px solid var(--accent-red);
        border-radius:12px;
        padding:24px;
    `;
    
    painel.innerHTML = `
        <h3 style="color:var(--accent-red);margin-bottom:15px;">
            ⚖️ Negociar Multa com a AGT — Ano ${registo.ano}
        </h3>
        <div style="display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
                    gap:10px;margin-bottom:16px;">
            <div style="background:rgba(244,67,54,0.1);padding:12px;
                        border-radius:8px;text-align:center;">
                <p style="color:var(--text-secondary);font-size:12px;">Imposto original</p>
                <p style="color:var(--accent-gold);font-weight:700;">
                    ${formatarMoeda(registo.imposto)} Kz
                </p>
            </div>
            <div style="background:rgba(244,67,54,0.1);padding:12px;
                        border-radius:8px;text-align:center;">
                <p style="color:var(--text-secondary);font-size:12px;">Multa (2×)</p>
                <p style="color:var(--accent-red);font-weight:700;font-size:1.1rem;">
                    ${formatarMoeda(registo.multaValor)} Kz
                </p>
            </div>
            <div style="background:rgba(244,67,54,0.1);padding:12px;
                        border-radius:8px;text-align:center;">
                <p style="color:var(--text-secondary);font-size:12px;">
                    Parcela mensal (12×)
                </p>
                <p style="color:var(--accent-yellow);font-weight:700;">
                    ${formatarMoeda(Math.round(registo.multaValor / 12))} Kz
                </p>
            </div>
            <div style="background:rgba(214,174,100,0.1);padding:12px;
                        border-radius:8px;text-align:center;">
                <p style="color:var(--text-secondary);font-size:12px;">
                    À vista (−10%)
                </p>
                <p style="color:var(--accent-green);font-weight:700;">
                    ${formatarMoeda(Math.round(registo.multaValor * 0.90))} Kz
                </p>
            </div>
        </div>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
            ⚠️ Prazo máximo para pagamento ou parcelamento: 01/06/${dataSimulador.getFullYear()}.
            Após esta data a empresa será encerrada pela AGT.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button onclick="negociarMultaAGT()"
                    style="flex:1;padding:14px;min-width:160px;
                           background:var(--accent-gold);color:#000;
                           border:none;border-radius:8px;
                           font-weight:700;cursor:pointer;">
                🤝 Parcelar em 12×
            </button>
            <button onclick="pagarMultaAGTVista()"
                    style="flex:1;padding:14px;min-width:160px;
                           background:var(--accent-green);color:#fff;
                           border:none;border-radius:8px;
                           font-weight:700;cursor:pointer;">
                💳 Pagar à Vista (−10%)
            </button>
        </div>
    `;
    
    container.appendChild(painel);
}

// ============================================
// PONTO ÚNICO DE INTEGRAÇÃO — DOMContentLoaded
// ============================================
document.addEventListener('DOMContentLoaded', function() {

    // Aguardar o simulador carregar completamente
    function aguardarSimulador(cb) {
        if (
            typeof processarDia === 'function' &&
            typeof processarMes === 'function' &&
            typeof salvarEstadoSimulacao === 'function' &&
            typeof historicoAnual !== 'undefined'
        ) {
            cb();
        } else {
            setTimeout(() => aguardarSimulador(cb), 150);
        }
    }

    aguardarSimulador(function() {
        // Guardar referências originais
        const _processarDiaOriginal = processarDia;
        const _mostrarEstrategiaOriginal = typeof window.mostrarEstrategia === 'function' 
            ? window.mostrarEstrategia : () => {};
        const _pagarImpostoAnualSemMultaOriginal = typeof window.pagarImpostoAnualSemMulta === 'function'
            ? window.pagarImpostoAnualSemMulta : () => {};
        const _pagarImpostoAnualComMultaOriginal = typeof window.pagarImpostoAnualComMulta === 'function'
            ? window.pagarImpostoAnualComMulta : () => {};

        // ── PATCH processarDia ── Adicionar verificações de multa
        window.processarDia = function() {
            // Chamar função original primeiro
            const resultado = _processarDiaOriginal.apply(this, arguments);
            
            // Nossas verificações (apenas multas)
            _verificarPrazoFiscalCorrigido();     // Aplicar/anular multa
            _verificarPrazoMulta1Junho();         // Encerrar se não pago
            _verificarPrestacoesMensaisMulta();   // Débito mensal parcelas
            
            return resultado;
        };

        // ── PATCH mostrarEstrategia ── Injectar painel de multa
        window.mostrarEstrategia = function() {
            const resultado = _mostrarEstrategiaOriginal.apply(this, arguments);
            setTimeout(_injetarPainelMultaEstrategia, 200);
            return resultado;
        };

        // ── PATCH pagarImpostoAnualSemMulta ── Anular multa após pagar
        if (typeof window.pagarImpostoAnualSemMulta === 'function') {
            window.pagarImpostoAnualSemMulta = function() {
                const resultado = _pagarImpostoAnualSemMultaOriginal.apply(this, arguments);
                _verificarPagamentoImpostoEAnularMulta();
                return resultado;
            };
        }

        // ── PATCH pagarImpostoAnualComMulta ── Anular multa após pagar
        if (typeof window.pagarImpostoAnualComMulta === 'function') {
            window.pagarImpostoAnualComMulta = function() {
                const resultado = _pagarImpostoAnualComMultaOriginal.apply(this, arguments);
                _verificarPagamentoImpostoEAnularMulta();
                return resultado;
            };
        }

        console.log('✅ Sistema de Multas AGT activado');
        console.log('📅 Prazo: 10 Março | ⚠️ Multa: 200% | 💰 Desconto à vista: 10% | 📦 Parcelamento: 12x');
    });
});

// ============================================
// CORREÇÃO COMPLETA DO SISTEMA FISCAL
// ============================================
// - Impedir multas quando imposto já foi pago
// - Corrigir lógica de pagamento de impostos (ano N pago em N+1)
// - Devolver valores de multas pagas indevidamente
// - Botões de anulação visíveis e funcionais
// ============================================

// ── FUNÇÃO CORRIGIDA: verificarPrazoFiscalAGT() ───────────────────────
// Só aplica multa se imposto NÃO foi pago
function verificarPrazoFiscalAGT_Corrigido() {
    const mes = dataSimulador.getMonth();
    const dia = dataSimulador.getDate();
    
    // 10 de Março
    if (mes === 2 && dia === 10) {
        console.log('📅 Verificando prazo fiscal - 10 de Março');
        
        const anoAnterior = dataSimulador.getFullYear() - 1; // Ex: 2026 → 2025
        
        // Processar relatório do ano anterior
        const relatorio = processarRelatorioAnual(anoAnterior);
        
        if (!relatorio || relatorio.impostoDevido === 0) {
            console.log(`Ano ${anoAnterior} sem imposto devido`);
            return;
        }
        
        // Buscar registro no histórico anual
        let registroAnual = historicoAnual.find(h => h.ano === anoAnterior);
        
        if (!registroAnual) {
            // Criar registro se não existir
            registroAnual = {
                ano: anoAnterior,
                receita: relatorio.receitaTotal,
                custos: relatorio.custosTotal,
                lucroAntes: relatorio.lucroTotal,
                imposto: relatorio.impostoDevido,
                lucroLiquido: relatorio.lucroLiquido,
                impostoPago: false,
                status: 'pendente',
                multaAplicada: false,
                multaValor: 0,
                multaPaga: false,
                multaParcelada: false,
                parcelasRestantes: 0,
                valorParcela: 0,
                fiscal: {
                    pago: false,
                    dataPagamento: null,
                    multaAplicada: false,
                    multaValor: 0
                }
            };
            historicoAnual.push(registroAnual);
        }
        
        // [CORREÇÃO CRÍTICA] Verificar se o imposto JÁ FOI PAGO
        if (registroAnual.impostoPago === true || registroAnual.fiscal?.pago === true) {
            console.log(`✅ Imposto do ano ${anoAnterior} já foi pago. Nenhuma multa aplicada.`);
            
            // Se houver multa indevida, anular
            if (registroAnual.multaAplicada || registroAnual.fiscal?.multaAplicada) {
                _anularMultaComDevolucao(anoAnterior);
            }
            return;
        }
        
        // Verificar se multa já foi aplicada
        if (registroAnual.multaAplicada || registroAnual.fiscal?.multaAplicada) {
            console.log(`⚠️ Multa do ano ${anoAnterior} já foi aplicada anteriormente`);
            return;
        }
        
        // Aplicar multa por não pagamento (100% do imposto)
        const multa = relatorio.impostoDevido;
        
        console.log(`🚨 Aplicando multa de ${formatarMoeda(multa)} Kz ao ano ${anoAnterior}`);
        
        registroAnual.multaAplicada = true;
        registroAnual.multaValor = multa;
        registroAnual.status = 'multado';
        
        if (!registroAnual.fiscal) {
            registroAnual.fiscal = {};
        }
        registroAnual.fiscal.multaAplicada = true;
        registroAnual.fiscal.multaValor = multa;
        
        dadosAGT.multaNaoPagamento = multa;
        dadosAGT.totalDevido += multa;
        dadosAGT.situacao = 'suspenso';
        
        if (contabilista) {
            contabilista.multa = (contabilista.multa || 0) + multa;
        }
        
        notificar(`🚨 MULTA AGT: Não pagamento do imposto ${anoAnterior}. Multa: ${formatarMoeda(multa)} Kz`);
        
        _adicionarNoticia(
            '⚠️ MULTA AGT - NÃO PAGAMENTO',
            `Imposto do ano ${anoAnterior} não foi pago até o prazo de 10/03/${dataSimulador.getFullYear()}. Multa de 100% aplicada: ${formatarMoeda(multa)} Kz.`,
            'fiscal',
            true
        );
        
        salvarEstadoSimulacao();
    }
}

// ── FUNÇÃO CORRIGIDA: pagarImpostoAnual() ─────────────────────────────
// Garante que o imposto do ano N é pago no ano N+1
function pagarImpostoAnual_Corrigido(ano) {
    // Processar relatório anual para obter os dados atualizados
    const relatorio = processarRelatorioAnual(ano);
    
    if (!relatorio) {
        notificar('❌ Relatório anual não encontrado');
        return;
    }
    
    // [CORREÇÃO] Verificar se o ano é elegível para pagamento
    // O imposto do ano N só pode ser pago no ano N+1
    const anoAtual = dataSimulador.getFullYear();
    if (ano === anoAtual) {
        notificar(`❌ O imposto do ano ${ano} só pode ser pago em ${ano + 1}. O ano fiscal ainda não encerrou.`);
        return;
    }
    
    // Verificar se já existe no histórico anual
    let registroAnual = historicoAnual.find(h => h.ano === ano);
    
    // Se não existir, criar um novo registro
    if (!registroAnual) {
        registroAnual = {
            ano: ano,
            receita: relatorio.receitaTotal,
            custos: relatorio.custosTotal,
            lucroAntes: relatorio.lucroTotal,
            imposto: relatorio.impostoDevido,
            lucroLiquido: relatorio.lucroLiquido,
            impostoPago: false,
            status: 'pendente',
            multaAplicada: false,
            multaValor: 0,
            multaPaga: false,
            multaParcelada: false,
            parcelasRestantes: 0,
            valorParcela: 0,
            fiscal: {
                pago: false,
                dataPagamento: null,
                multaAplicada: false,
                multaValor: 0
            }
        };
        historicoAnual.push(registroAnual);
    }
    
    // Verificar se já foi pago
    if (registroAnual.impostoPago || registroAnual.fiscal?.pago) {
        notificar(`✅ Imposto do ano ${ano} já foi pago em ${registroAnual.fiscal?.dataPagamento || registroAnual.dataPagamento}`);
        return;
    }
    
    // Calcular total devido (imposto + multas)
    const totalDevido = relatorio.impostoDevido + 
        (registroAnual.multaValor || registroAnual.fiscal?.multaValor || 0) + 
        dadosAGT.jurosMora;
    
    if (totalDevido === 0) {
        notificar(`ℹ️ Ano ${ano} não tem imposto a pagar (lucro zero ou prejuízo)`);
        registroAnual.impostoPago = true;
        registroAnual.status = 'pago';
        if (!registroAnual.fiscal) registroAnual.fiscal = {};
        registroAnual.fiscal.pago = true;
        registroAnual.fiscal.dataPagamento = dataSimulador.toLocaleDateString();
        salvarEstadoSimulacao();
        mostrarRelatorioAnualCompleto();
        return;
    }
    
    // Verificar saldo
    if (estadoJogo.carteiraKz < totalDevido) {
        notificar(`❌ Saldo insuficiente. Necessário: ${formatarMoeda(totalDevido)} Kz`);
        return;
    }
    
    // Processar pagamento
    estadoJogo.carteiraKz -= totalDevido;
    
    // Registrar transação
    registrarTransacao('imposto', 'saida', totalDevido, 'Kz',
        `Imposto Industrial ${ano} - ${formatarMoeda(relatorio.impostoDevido)} Kz ${(registroAnual.multaValor || 0) > 0 ? '+ multa ' + formatarMoeda(registroAnual.multaValor) + ' Kz' : ''}`);
    
    // Registrar no histórico de pagamentos
    if (typeof historicoPagamentosImposto !== 'undefined') {
        historicoPagamentosImposto.push({
            data: dataSimulador.toLocaleDateString(),
            ano: ano,
            imposto: relatorio.impostoDevido,
            multa: registroAnual.multaValor || 0,
            juros: dadosAGT.jurosMora,
            total: totalDevido,
            tipo: 'pagamento_normal'
        });
    }
    
    // Atualizar registro anual
    registroAnual.impostoPago = true;
    registroAnual.status = 'pago';
    registroAnual.dataPagamento = dataSimulador.toLocaleDateString();
    
    if (!registroAnual.fiscal) registroAnual.fiscal = {};
    registroAnual.fiscal.pago = true;
    registroAnual.fiscal.dataPagamento = dataSimulador.toLocaleDateString();
    
    // Se havia multa, marcar como paga também
    if (registroAnual.multaValor > 0) {
        registroAnual.multaPaga = true;
    }
    
    // Limpar multas e juros relacionados a este ano de dadosAGT
    // Nota: Não zeramos dadosAGT completamente porque pode haver multas de outros anos
    
    // Atualizar contabilista
    if (contabilista && contabilista.multa === registroAnual.multaValor) {
        contabilista.multa = 0;
    }
    
    notificar(`✅ Imposto ${ano} pago! Total: ${formatarMoeda(totalDevido)} Kz`);
    
    _adicionarNoticia(
        '✅ Imposto Industrial Pago',
        `Imposto do ano ${ano} no valor de ${formatarMoeda(relatorio.impostoDevido)} Kz foi pago com sucesso.`,
        'fiscal',
        false
    );
    
    atualizarCarteiras();
    salvarEstadoSimulacao();
    mostrarRelatorioAnualCompleto();
}

// ── FUNÇÃO: _anularMultaComDevolucao(ano) ─────────────────────────────
// Anula multa e devolve dinheiro se já foi pago
function _anularMultaComDevolucao(ano) {
    const registo = historicoAnual.find(r => r.ano === ano);
    
    if (!registo) return;
    
    // Verificar se tem multa aplicada
    const multaValor = registo.multaValor || registo.fiscal?.multaValor || 0;
    if (multaValor === 0) return;
    
    // Verificar se o imposto foi pago
    const impostoPago = registo.impostoPago || registo.fiscal?.pago || false;
    if (!impostoPago) return;
    
    console.log(`💰 Anulando multa de ${formatarMoeda(multaValor)} Kz do ano ${ano} e devolvendo dinheiro se pago`);
    
    // Verificar se a multa foi paga (para devolver)
    const multaPaga = registo.multaPaga || false;
    
    if (multaPaga) {
        // Devolver o valor da multa (ou o que foi pago com desconto)
        // Para simplificar, devolvemos o valor total da multa
        estadoJogo.carteiraKz += multaValor;
        
        registrarTransacao('multa', 'entrada', multaValor, 'Kz', 
            `Devolução de multa do ano ${ano} (imposto já estava pago)`);
        
        notificar(`💰 Devolvidos ${formatarMoeda(multaValor)} Kz referentes à multa paga indevidamente.`);
    }
    
    // Anular todos os campos da multa
    registo.multaAplicada = false;
    registo.multaValor = 0;
    registo.multaPaga = false;
    registo.multaParcelada = false;
    registo.parcelasRestantes = 0;
    registo.valorParcela = 0;
    
    if (registo.fiscal) {
        registo.fiscal.multaAplicada = false;
        registo.fiscal.multaValor = 0;
    }
    
    // Atualizar dadosAGT
    dadosAGT.multaAtrasoEntrega = 0;
    dadosAGT.multaNaoPagamento = 0;
    dadosAGT.totalDevido = Math.max(0, dadosAGT.totalDevido - multaValor);
    
    if (dadosAGT.totalDevido === 0) {
        dadosAGT.situacao = 'regular';
    }
    
    // Atualizar contabilista
    if (contabilista && contabilista.multa === multaValor) {
        contabilista.multa = 0;
    }
    
    _adicionarNoticia(
        '💰 Multa Anulada e Devolvida',
        `A multa de ${formatarMoeda(multaValor)} Kz do ano ${ano} foi anulada porque o imposto já estava pago. O valor foi devolvido à sua conta.`,
        'fiscal',
        false
    );
    
    salvarEstadoSimulacao();
}

// ── FUNÇÃO: anularMultaInjustaComDevolucao(ano) ───────────────────────
// Versão pública para anular multa injusta e devolver dinheiro
window.anularMultaInjustaComDevolucao = function(ano) {
    const registo = historicoAnual.find(r => r.ano === ano);
    
    if (!registo) {
        notificar('❌ Registo anual não encontrado');
        return;
    }
    
    // Verificar se o imposto foi pago
    const impostoPago = registo.impostoPago || registo.fiscal?.pago || false;
    if (!impostoPago) {
        notificar('❌ Esta multa não pode ser anulada porque o imposto ainda não foi pago');
        return;
    }
    
    // Verificar se existe multa para anular
    const multaValor = registo.multaValor || registo.fiscal?.multaValor || 0;
    if (multaValor === 0) {
        notificar('❌ Não há multa para anular neste ano');
        return;
    }
    
    // Verificar se a multa já foi paga
    const multaPaga = registo.multaPaga || false;
    
    let mensagem = `Tem certeza que deseja anular a multa de ${formatarMoeda(multaValor)} Kz do ano ${ano}?`;
    if (multaPaga) {
        mensagem = `Esta multa já foi paga. Ao anular, ${formatarMoeda(multaValor)} Kz serão devolvidos à sua conta. Continuar?`;
    }
    
    if (!confirm(mensagem)) return;
    
    _anularMultaComDevolucao(ano);
    
    // Actualizar a interface
    if (typeof window.mostrarEstrategia === 'function') {
        window.mostrarEstrategia();
    } else if (typeof window.mostrarRelatorioAnualCompleto === 'function') {
        window.mostrarRelatorioAnualCompleto();
    }
};

// ── FUNÇÃO: _injetarBotaoAnularMultaComDevolucao() ────────────────────
// Injeta botão de anulação com devolução
function _injetarBotaoAnularMultaComDevolucao() {
    // Procura registo com multa aplicada E imposto pago
    const registo = historicoAnual.find(r => 
        r && 
        (r.multaAplicada === true || r.fiscal?.multaAplicada === true) && 
        r.multaPaga !== true && 
        (r.impostoPago === true || r.fiscal?.pago === true)
    );
    
    if (!registo) return;
    
    const container = document.getElementById('conteudoPrincipal');
    if (!container) return;
    
    // Evitar duplicação
    if (document.getElementById('botao-anular-multa-devolucao')) return;
    
    const multaValor = registo.multaValor || registo.fiscal?.multaValor || 0;
    
    // Procurar o painel de multa existente
    const painelMulta = document.getElementById('painel-multa-agt');
    
    if (painelMulta) {
        // Adicionar botão ao painel existente
        const botoesDiv = painelMulta.querySelector('div[style*="display:flex"]');
        
        if (botoesDiv) {
            const botaoAnular = document.createElement('button');
            botaoAnular.id = 'botao-anular-multa-devolucao';
            botaoAnular.innerHTML = '💰 Anular Multa e Devolver Dinheiro';
            botaoAnular.style.cssText = `
                flex:1;padding:14px;min-width:200px;
                background:var(--accent-gold);color:#000;
                border:none;border-radius:8px;
                font-weight:700;cursor:pointer;
                margin-top:10px;
                width:100%;
            `;
            botaoAnular.onclick = () => window.anularMultaInjustaComDevolucao(registo.ano);
            
            // Adicionar após os outros botões
            botoesDiv.parentNode.insertBefore(botaoAnular, botoesDiv.nextSibling);
        }
    } else {
        // Criar painel específico para multa injusta
        const painelInjusto = document.createElement('div');
        painelInjusto.id = 'painel-multa-injusta';
        painelInjusto.style.cssText = `
            margin-top:20px;
            background:linear-gradient(145deg,#1a1a1a,#121212);
            border:2px solid var(--accent-gold);
            border-radius:12px;
            padding:24px;
        `;
        
        const impostoPagoEm = registo.fiscal?.dataPagamento || registo.dataPagamento || 'data desconhecida';
        
        painelInjusto.innerHTML = `
            <h3 style="color:var(--accent-gold);margin-bottom:15px;">
                ⚠️ Multa Injusta Detectada — Ano ${registo.ano}
            </h3>
            <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:15px; margin-bottom:20px;">
                <div style="background:rgba(214,174,100,0.1);padding:15px;border-radius:8px;text-align:center;">
                    <p style="color:var(--text-secondary);">Imposto pago</p>
                    <p style="color:var(--accent-green);font-size:1.5rem;font-weight:700;">✅ ${formatarMoeda(registo.imposto)} Kz</p>
                    <p style="color:var(--text-secondary);">em ${impostoPagoEm}</p>
                </div>
                <div style="background:rgba(244,67,54,0.1);padding:15px;border-radius:8px;text-align:center;">
                    <p style="color:var(--text-secondary);">Multa aplicada</p>
                    <p style="color:var(--accent-red);font-size:1.5rem;font-weight:700;">❌ ${formatarMoeda(multaValor)} Kz</p>
                    <p style="color:var(--text-secondary);">injustamente</p>
                </div>
            </div>
            <p style="color:var(--text-secondary);margin-bottom:20px;text-align:center;">
                O imposto do ano ${registo.ano} foi pago dentro do prazo, mas uma multa foi aplicada indevidamente.
                Clique no botão abaixo para anular esta multa e receber o dinheiro de volta.
            </p>
            <button onclick="anularMultaInjustaComDevolucao(${registo.ano})"
                    style="width:100%;padding:16px;
                           background:var(--accent-gold);color:#000;
                           border:none;border-radius:8px;
                           font-weight:700;cursor:pointer;
                           font-size:1.1rem;">
                💰 Anular Multa e Devolver ${multaPaga ? formatarMoeda(multaValor) + ' Kz' : ''}
            </button>
        `;
        
        container.appendChild(painelInjusto);
    }
}

// ── FUNÇÃO: _adicionarBotaoDevolucaoNosRelatorios() ───────────────────
// Adiciona botão de devolução nos relatórios anuais
function _adicionarBotaoDevolucaoNosRelatorios() {
    document.querySelectorAll('[data-ano]').forEach(card => {
        const ano = card.getAttribute('data-ano');
        if (!ano) return;
        
        const registo = historicoAnual.find(r => r.ano === parseInt(ano));
        
        if (registo && 
            (registo.multaAplicada || registo.fiscal?.multaAplicada) && 
            (registo.impostoPago || registo.fiscal?.pago) && 
            !registo.multaPaga) {
            
            if (card.querySelector('.btn-devolver-multa')) return;
            
            const botoesDiv = card.querySelector('div[style*="justify-content: flex-end"]');
            if (botoesDiv) {
                const botaoDevolver = document.createElement('button');
                botaoDevolver.className = 'btn-devolver-multa';
                botaoDevolver.innerHTML = '💰 Anular e Devolver';
                botaoDevolver.style.cssText = `
                    padding: 8px 15px;
                    background: var(--accent-gold);
                    color: #000;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                    font-weight: 700;
                `;
                botaoDevolver.onclick = () => window.anularMultaInjustaComDevolucao(parseInt(ano));
                
                botoesDiv.appendChild(botaoDevolver);
            }
        }
    });
}

// ── FUNÇÃO: _verificarEAnularMultasExistentes() ───────────────────────
// Verifica todo o histórico e anula multas indevidas automaticamente
function _verificarEAnularMultasExistentes() {
    if (!historicoAnual || !Array.isArray(historicoAnual)) return;
    
    let anuladas = 0;
    let totalDevolvido = 0;
    
    historicoAnual.forEach(registo => {
        const impostoPago = registo.impostoPago || registo.fiscal?.pago || false;
        const multaAplicada = registo.multaAplicada || registo.fiscal?.multaAplicada || false;
        const multaValor = registo.multaValor || registo.fiscal?.multaValor || 0;
        
        if (impostoPago && multaAplicada && multaValor > 0) {
            console.log(`ℹ️ Anulando multa do ano ${registo.ano} automaticamente`);
            
            // Se a multa foi paga, devolver
            if (registo.multaPaga) {
                estadoJogo.carteiraKz += multaValor;
                totalDevolvido += multaValor;
            }
            
            registo.multaAplicada = false;
            registo.multaValor = 0;
            registo.multaPaga = false;
            registo.multaParcelada = false;
            registo.parcelasRestantes = 0;
            registo.valorParcela = 0;
            
            if (registo.fiscal) {
                registo.fiscal.multaAplicada = false;
                registo.fiscal.multaValor = 0;
            }
            
            anuladas++;
        }
    });
    
    if (anuladas > 0) {
        console.log(`✅ ${anuladas} multa(s) indevida(s) anulada(s) automaticamente`);
        if (totalDevolvido > 0) {
            notificar(`💰 Foram devolvidos ${formatarMoeda(totalDevolvido)} Kz de multas pagas indevidamente.`);
        }
        salvarEstadoSimulacao();
    }
}

// ── SUBSTITUIR FUNÇÕES ORIGINAIS ─────────────────────────────────────
// Guardar referências originais
const _verificarPrazoFiscalAGT_Original = window.verificarPrazoFiscalAGT || verificarPrazoFiscalAGT;
const _pagarImpostoAnual_Original = window.pagarImpostoAnual || pagarImpostoAnual;
const _processarDia_Original = window.processarDia || processarDia;
const _mostrarEstrategia_Original = window.mostrarEstrategia || mostrarEstrategia;
const _mostrarRelatorioAnualCompleto_Original = window.mostrarRelatorioAnualCompleto || mostrarRelatorioAnualCompleto;

// ── SUBSTITUIR FUNÇÕES GLOBAIS ────────────────────────────────────────
window.verificarPrazoFiscalAGT = verificarPrazoFiscalAGT_Corrigido;
window.pagarImpostoAnual = pagarImpostoAnual_Corrigido;

// ── PATCH DO processarDia ────────────────────────────────────────────
window.processarDia = function() {
    // Chamar função original primeiro
    if (typeof _processarDia_Original === 'function') {
        _processarDia_Original();
    }
    
    // Nossa verificação corrigida (só executa se a original não existir ou se quisermos substituir)
    // Como já substituímos a função global, ela será chamada dentro do original
    // Mas garantimos chamando explicitamente
    verificarPrazoFiscalAGT_Corrigido();
};

// ── PATCH DO mostrarEstrategia ───────────────────────────────────────
window.mostrarEstrategia = function() {
    if (typeof _mostrarEstrategia_Original === 'function') {
        _mostrarEstrategia_Original();
    }
    
    // Injetar nossos botões após a renderização
    setTimeout(() => {
        _injetarBotaoAnularMultaComDevolucao();
        _injetarBotaoAnularTodas();
    }, 300);
};

// ── PATCH DO mostrarRelatorioAnualCompleto ───────────────────────────
window.mostrarRelatorioAnualCompleto = function() {
    if (typeof _mostrarRelatorioAnualCompleto_Original === 'function') {
        _mostrarRelatorioAnualCompleto_Original();
    }
    
    setTimeout(() => {
        _adicionarBotaoDevolucaoNosRelatorios();
        _injetarBotaoAnularTodas();
    }, 300);
};

// ── FUNÇÃO: anularTodasMultasInjustasComDevolucao() ───────────────────
// Anula todas as multas injustas de uma vez e devolve dinheiro
window.anularTodasMultasInjustasComDevolucao = function() {
    const injustas = historicoAnual.filter(r => 
        r && 
        (r.multaAplicada || r.fiscal?.multaAplicada) && 
        (r.impostoPago || r.fiscal?.pago) && 
        !r.multaPaga
    );
    
    if (injustas.length === 0) {
        notificar('✅ Não há multas injustas para anular');
        return;
    }
    
    let totalMultas = 0;
    let totalDevolver = 0;
    
    injustas.forEach(registo => {
        totalMultas++;
        const multaValor = registo.multaValor || registo.fiscal?.multaValor || 0;
        
        if (registo.multaPaga) {
            totalDevolver += multaValor;
            estadoJogo.carteiraKz += multaValor;
        }
        
        registo.multaAplicada = false;
        registo.multaValor = 0;
        registo.multaPaga = false;
        registo.multaParcelada = false;
        registo.parcelasRestantes = 0;
        registo.valorParcela = 0;
        
        if (registo.fiscal) {
            registo.fiscal.multaAplicada = false;
            registo.fiscal.multaValor = 0;
        }
    });
    
    // Atualizar contabilista
    if (contabilista) {
        contabilista.multa = 0;
        contabilista.multaParcelada = false;
        contabilista.parcelasRestantes = 0;
        contabilista.valorParcela = 0;
    }
    
    // Atualizar dadosAGT
    dadosAGT.multaAtrasoEntrega = 0;
    dadosAGT.multaNaoPagamento = 0;
    dadosAGT.totalDevido = 0;
    dadosAGT.situacao = 'regular';
    
    registrarTransacao('multa', 'entrada', totalDevolver, 'Kz', 
        `${totalMultas} multa(s) injusta(s) anulada(s) - Devolução de ${formatarMoeda(totalDevolver)} Kz`);
    
    const mensagem = totalDevolver > 0 
        ? `✅ ${totalMultas} multa(s) anulada(s)! ${formatarMoeda(totalDevolver)} Kz devolvidos à sua conta.`
        : `✅ ${totalMultas} multa(s) anulada(s)!`;
    
    notificar(mensagem);
    
    _adicionarNoticia(
        '💰 Multas Injustas Anuladas',
        `${totalMultas} multa(s) no valor total de ${formatarMoeda(totalDevolver)} Kz foram anuladas e o dinheiro devolvido.`,
        'fiscal',
        false
    );
    
    salvarEstadoSimulacao();
    atualizarCarteiras();
    
    if (typeof window.mostrarEstrategia === 'function') {
        window.mostrarEstrategia();
    }
};

// ── FUNÇÃO: _injetarBotaoAnularTodasComDevolucao() ────────────────────
// Injeta botão para anular todas as multas injustas com devolução
function _injetarBotaoAnularTodasComDevolucao() {
    const injustas = historicoAnual.filter(r => 
        r && 
        (r.multaAplicada || r.fiscal?.multaAplicada) && 
        (r.impostoPago || r.fiscal?.pago) && 
        !r.multaPaga
    );
    
    if (injustas.length === 0) return;
    
    const container = document.getElementById('conteudoPrincipal');
    if (!container) return;
    
    if (document.getElementById('botao-anular-todas-devolucao')) return;
    
    const totalDevolver = injustas.reduce((sum, r) => {
        if (r.multaPaga) {
            return sum + (r.multaValor || r.fiscal?.multaValor || 0);
        }
        return sum;
    }, 0);
    
    const banner = document.createElement('div');
    banner.id = 'botao-anular-todas-devolucao';
    banner.style.cssText = `
        background: linear-gradient(145deg, #1a1a1a, #121212);
        border-left: 4px solid var(--accent-gold);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 15px;
    `;
    
    const totalMultas = injustas.length;
    const totalValor = injustas.reduce((sum, r) => sum + (r.multaValor || r.fiscal?.multaValor || 0), 0);
    
    banner.innerHTML = `
        <div>
            <h3 style="color: var(--accent-gold); margin-bottom: 5px;">⚠️ Multas Injustas Detectadas</h3>
            <p style="color: var(--text-secondary);">
                Foram encontradas ${totalMultas} multa(s) no valor total de ${formatarMoeda(totalValor)} Kz
                que foram aplicadas mesmo com o imposto já pago.
                ${totalDevolver > 0 ? `<br><span style="color: var(--accent-green);">💰 ${formatarMoeda(totalDevolver)} Kz serão devolvidos à sua conta.</span>` : ''}
            </p>
        </div>
        <button onclick="anularTodasMultasInjustasComDevolucao()"
                style="padding: 12px 24px;
                       background: var(--accent-gold);
                       color: #000;
                       border: none;
                       border-radius: 6px;
                       font-weight: 700;
                       cursor: pointer;
                       white-space: nowrap;">
            ✅ Anular Todas ${totalDevolver > 0 ? 'e Receber ' + formatarMoeda(totalDevolver) : ''}
        </button>
    `;
    
    const primeiroCard = container.querySelector('[data-ano]');
    if (primeiroCard) {
        container.insertBefore(banner, primeiroCard);
    } else {
        container.prepend(banner);
    }
}

// ── FUNÇÃO: _corrigirHistoricoAnualExistente() ────────────────────────
// Corrige o formato do histórico anual para garantir campos consistentes
function _corrigirHistoricoAnualExistente() {
    if (!historicoAnual || !Array.isArray(historicoAnual)) return;
    
    let corrigidos = 0;
    
    historicoAnual.forEach(registo => {
        // Garantir que todos os campos existem
        if (registo.impostoPago === undefined) {
            registo.impostoPago = registo.fiscal?.pago || false;
            corrigidos++;
        }
        
        if (registo.multaAplicada === undefined) {
            registo.multaAplicada = registo.fiscal?.multaAplicada || false;
            corrigidos++;
        }
        
        if (registo.multaValor === undefined) {
            registo.multaValor = registo.fiscal?.multaValor || 0;
            corrigidos++;
        }
        
        if (registo.multaPaga === undefined) {
            registo.multaPaga = false;
            corrigidos++;
        }
        
        if (registo.multaParcelada === undefined) {
            registo.multaParcelada = false;
            corrigidos++;
        }
        
        if (registo.parcelasRestantes === undefined) {
            registo.parcelasRestantes = 0;
            corrigidos++;
        }
        
        if (registo.valorParcela === undefined) {
            registo.valorParcela = 0;
            corrigidos++;
        }
        
        if (!registo.fiscal) {
            registo.fiscal = {
                pago: registo.impostoPago || false,
                dataPagamento: registo.dataPagamento || null,
                multaAplicada: registo.multaAplicada || false,
                multaValor: registo.multaValor || 0
            };
            corrigidos++;
        }
    });
    
    if (corrigidos > 0) {
        console.log(`✅ ${corrigidos} campos do histórico anual corrigidos`);
        salvarEstadoSimulacao();
    }
}

// ── FUNÇÃO: _limparEAnularMultasDoAnoCorrente() ───────────────────────
// Garante que o ano corrente (em curso) nunca tenha multas
function _limparEAnularMultasDoAnoCorrente() {
    const anoCorrente = dataSimulador.getFullYear();
    
    historicoAnual.forEach(registo => {
        if (registo.ano === anoCorrente) {
            // Ano corrente não pode ter multas
            if (registo.multaAplicada || registo.fiscal?.multaAplicada) {
                console.log(`ℹ️ Removendo multa do ano corrente ${anoCorrente}`);
                
                registo.multaAplicada = false;
                registo.multaValor = 0;
                registo.multaPaga = false;
                registo.multaParcelada = false;
                registo.parcelasRestantes = 0;
                registo.valorParcela = 0;
                
                if (registo.fiscal) {
                    registo.fiscal.multaAplicada = false;
                    registo.fiscal.multaValor = 0;
                }
            }
        }
    });
}

// ── INICIALIZAÇÃO E VERIFICAÇÕES ─────────────────────────────────────
// Executar correções assim que o script carregar
setTimeout(() => {
    if (typeof historicoAnual !== 'undefined') {
        _corrigirHistoricoAnualExistente();
        _verificarEAnularMultasExistentes();
        _limparEAnularMultasDoAnoCorrente();
    }
}, 500);

// Observar mudanças no DOM para injectar botões quando necessário
const observer = new MutationObserver(() => {
    if (document.getElementById('conteudoPrincipal')) {
        setTimeout(() => {
            _injetarBotaoAnularMultaComDevolucao();
            _injetarBotaoAnularTodasComDevolucao();
            _adicionarBotaoDevolucaoNosRelatorios();
        }, 500);
    }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('✅ Sistema Fiscal Corrigido - v2.0');
console.log('📋 Principais correções:');
console.log('   • Imposto do ano N só pode ser pago no ano N+1');
console.log('   • Multas só aplicadas quando imposto NÃO foi pago');
console.log('   • Botões de anulação com devolução de valores');
console.log('   • Limpeza automática de multas indevidas');
console.log('   • Interface melhorada com feedback claro');


// ============================================
// SIMULADOR DE GESTÃO EMPRESARIAL
// CORREÇÃO FORÇADA PARA MOBILE - VERSÃO DEFINITIVA
// ============================================
// Este script SOBRESCREVE as funções originais do simulador
// para garantir o funcionamento em dispositivos móveis
// ============================================

(function() {
    'use strict';

    // ============================================
    // CONFIGURAÇÕES
    // ============================================
    const CONFIG = {
        MOBILE_MAX_WIDTH: 750,
        MOBILE_MIN_WIDTH: 250,
        TABLET_MAX_WIDTH: 900
    };

    // ============================================
    // DETECÇÃO DE DISPOSITIVO
    // ============================================
    function isMobile() {
        const width = window.innerWidth || document.documentElement.clientWidth;
        return width >= CONFIG.MOBILE_MIN_WIDTH && width <= CONFIG.MOBILE_MAX_WIDTH;
    }

    function isTablet() {
        const width = window.innerWidth || document.documentElement.clientWidth;
        return width > CONFIG.MOBILE_MAX_WIDTH && width <= CONFIG.TABLET_MAX_WIDTH;
    }

    // ============================================
    // SOBRESCREVER FUNÇÃO CRÍTICA: inicializarPainelNoticias
    // ============================================
    const originalInicializarPainelNoticias = window.inicializarPainelNoticias;
    
    window.inicializarPainelNoticias = function() {
        console.log('📱 [MobileFix] interceptando inicializarPainelNoticias');
        
        // Chamar função original primeiro
        if (originalInicializarPainelNoticias) {
            originalInicializarPainelNoticias();
        }
        
        // Forçar correção imediatamente
        setTimeout(forcedMobileLayout, 100);
    };

    // ============================================
    // SOBRESCREVER FUNÇÕES DE NAVEGAÇÃO
    // ============================================
    const funcoesNavegacao = [
        'mostrarRH',
        'mostrarFornecedores',
        'mostrarMarketing',
        'mostrarFinanceiro',
        'mostrarInvestimentos',
        'mostrarEstrategia',
        'mostrarContabilista',
        'mostrarRelatorios',
        'mostrarHistorico',
        'mostrarAjuda',
        'mostrarNoticias',
        'mostrarEstoque',
        'mostrarDashboardInicial'
    ];

    funcoesNavegacao.forEach(nomeFuncao => {
        if (typeof window[nomeFuncao] === 'function') {
            const funcaoOriginal = window[nomeFuncao];
            
            window[nomeFuncao] = function() {
                console.log(`📱 [MobileFix] interceptando ${nomeFuncao}`);
                
                // Chamar função original
                const resultado = funcaoOriginal.apply(this, arguments);
                
                // Forçar correção após renderização
                setTimeout(forcedMobileLayout, 50);
                setTimeout(forcedMobileLayout, 200);
                setTimeout(forcedMobileLayout, 500);
                
                return resultado;
            };
        }
    });

    // ============================================
    // SOBRESCREVER FUNÇÃO processarDia (atualiza interface)
    // ============================================
    if (typeof window.processarDia === 'function') {
        const originalProcessarDia = window.processarDia;
        
        window.processarDia = function() {
            const resultado = originalProcessarDia.apply(this, arguments);
            
            // Se for mobile, forçar correção após atualização
            if (isMobile()) {
                setTimeout(forcedMobileLayout, 50);
            }
            
            return resultado;
        };
    }

    // ============================================
    // FUNÇÃO PRINCIPAL QUE FORÇA O LAYOUT MOBILE
    // ============================================
    function forcedMobileLayout() {
        if (!isMobile()) return;
        
        console.log('📱 [MobileFix] aplicando layout forçado para mobile');
        
        // 1. ENCONTRAR E MODIFICAR O DASHBOARD LAYOUT
        const dashboardLayout = document.querySelector('.dashboard-layout');
        if (dashboardLayout) {
            // SOBRESCREVER COMPLETAMENTE OS ESTILOS INLINE
            dashboardLayout.setAttribute('style', 
                'display: flex !important; ' +
                'flex-direction: column !important; ' +
                'gap: 15px !important; ' +
                'padding: 10px !important; ' +
                'height: auto !important; ' +
                'min-height: auto !important; ' +
                'max-height: none !important; ' +
                'overflow: visible !important; ' +
                'width: 100% !important; ' +
                'max-width: 100% !important;'
            );
        }

        // 2. MODIFICAR PAINEL ESQUERDO (CONTEÚDO PRINCIPAL)
        const painelEsquerdo = document.getElementById('painelEsquerdo');
        if (painelEsquerdo) {
            painelEsquerdo.setAttribute('style',
                'width: 100% !important; ' +
                'max-width: 100% !important; ' +
                'flex: none !important; ' +
                'order: 1 !important; ' +
                'height: auto !important; ' +
                'overflow: visible !important; ' +
                'padding: 5px 0 !important;'
            );
        }

        // 3. MODIFICAR PAINEL DE NOTÍCIAS
        const painelNoticias = document.getElementById('painelNoticias');
        if (painelNoticias) {
            painelNoticias.setAttribute('style',
                'width: 100% !important; ' +
                'max-width: 100% !important; ' +
                'min-width: 100% !important; ' +
                'flex: none !important; ' +
                'order: 2 !important; ' +
                'height: auto !important; ' +
                'max-height: 300px !important; ' +
                'overflow-y: auto !important; ' +
                'margin-top: 15px !important; ' +
                'border-left: none !important; ' +
                'border-top: 1px solid #333 !important; ' +
                'position: relative !important;'
            );

            // Ajustar lista de notícias
            const noticiasLista = painelNoticias.querySelector('.noticias-lista');
            if (noticiasLista) {
                noticiasLista.style.maxHeight = '200px';
                noticiasLista.style.overflowY = 'auto';
            }
        }

        // 4. MODIFICAR PAINEL DE INDICADORES
        const painelIndicadores = document.getElementById('painelIndicadores');
        if (painelIndicadores) {
            painelIndicadores.setAttribute('style',
                'width: 100% !important; ' +
                'max-width: 100% !important; ' +
                'order: 3 !important; ' +
                'position: relative !important; ' +
                'margin-top: 15px !important; ' +
                'border-top: 1px solid #333 !important; ' +
                'padding: 10px 0 !important;'
            );

            // Reorganizar indicadores em grid 2x3
            const indicadoresRow = painelIndicadores.querySelector('div[style*="display: flex"]');
            if (indicadoresRow) {
                indicadoresRow.setAttribute('style',
                    'display: grid !important; ' +
                    'grid-template-columns: repeat(2, 1fr) !important; ' +
                    'gap: 8px !important; ' +
                    'padding: 5px !important;'
                );

                // Ajustar cada indicador
                const indicadores = indicadoresRow.children;
                for (let i = 0; i < indicadores.length; i++) {
                    if (indicadores[i].tagName === 'DIV') {
                        indicadores[i].style.padding = '8px';
                        indicadores[i].style.margin = '0';
                    }
                }
            }

            // Esconder botões para economizar espaço
            const botoes = painelIndicadores.querySelectorAll('button');
            botoes.forEach(btn => {
                btn.style.display = 'none';
            });
        }

        // 5. CORRIGIR TODAS AS TABELAS
        const tabelas = document.querySelectorAll('.tabela-container');
        tabelas.forEach(tabela => {
            tabela.setAttribute('style',
                'overflow-x: auto !important; ' +
                'max-width: 100% !important; ' +
                'margin: 10px 0 !important; ' +
                '-webkit-overflow-scrolling: touch !important;'
            );
        });

        // 6. CORRIGIR TODOS OS GRIDS (RH, FORNECEDORES, ETC)
        const grids = document.querySelectorAll('div[style*="grid-template-columns:repeat(3,1fr)"]');
        grids.forEach(grid => {
            grid.setAttribute('style',
                'display: grid !important; ' +
                'grid-template-columns: 1fr !important; ' +
                'gap: 10px !important;'
            );
        });

        // 7. CORRIGIR FORMULÁRIOS
        const forms = document.querySelectorAll('.form-container, .rh-container, .financeiro-container, ' +
            '.investimentos-container, .estrategia-container, .contabilista-container, ' +
            '.relatorios-container, .historico-container, .fornecedores-container');
        
        forms.forEach(form => {
            form.setAttribute('style',
                'width: 100% !important; ' +
                'max-width: 100% !important; ' +
                'padding: 10px !important; ' +
                'margin: 5px 0 !important;'
            );
        });

        // 8. CORRIGIR BOTÕES PARA TOQUE
        const botoesGerais = document.querySelectorAll('button');
        botoesGerais.forEach(btn => {
            btn.style.minHeight = '44px';
            btn.style.padding = '12px';
        });

        // 9. CORRIGIR INPUTS
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.minHeight = '44px';
            input.style.fontSize = '16px'; // Evita zoom no iOS
        });

        // 10. CORRIGIR BOTÃO TOGGLE DE NOTÍCIAS
        const toggleBtn = document.getElementById('toggleNoticias');
        if (toggleBtn) {
            toggleBtn.setAttribute('style',
                'position: fixed !important; ' +
                'bottom: 20px !important; ' +
                'right: 20px !important; ' +
                'z-index: 9999 !important; ' +
                'width: 45px !important; ' +
                'height: 45px !important; ' +
                'border-radius: 25px !important; ' +
                'background: #D4AF37 !important; ' +
                'color: #000 !important; ' +
                'border: none !important; ' +
                'font-size: 20px !important; ' +
                'cursor: pointer !important; ' +
                'display: flex !important; ' +
                'align-items: center !important; ' +
                'justify-content: center !important; ' +
                'opacity: 0.9 !important;'
            );
        }

        // 11. REMOVER OVERFLOW HIDDEN DO BODY
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'auto';
        document.body.style.height = 'auto';
        document.body.style.minHeight = '100vh';
    }

    // ============================================
    // INJETAR CSS DE EMERGÊNCIA
    // ============================================
    function injectEmergencyCSS() {
        const styleId = 'mobile-emergency-fix';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* FORÇAR LAYOUT MOBILE - PRIORIDADE MÁXIMA */
            @media (max-width: 750px) {
                /* Reset forçado */
                .dashboard-layout,
                #painelEsquerdo,
                #painelNoticias,
                #painelIndicadores {
                    all: initial !important;
                }

                /* Reaplicar com !important */
                .dashboard-layout {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 15px !important;
                    padding: 10px !important;
                    height: auto !important;
                    width: 100% !important;
                }

                #painelEsquerdo {
                    width: 100% !important;
                    flex: none !important;
                    order: 1 !important;
                    height: auto !important;
                    overflow: visible !important;
                }

                #painelNoticias {
                    width: 100% !important;
                    min-width: 100% !important;
                    order: 2 !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    margin-top: 15px !important;
                    border-left: none !important;
                    border-top: 1px solid #333 !important;
                }

                #painelIndicadores {
                    width: 100% !important;
                    order: 3 !important;
                    margin-top: 15px !important;
                    border-top: 1px solid #333 !important;
                }

                /* Grids em 1 coluna */
                [style*="grid-template-columns: repeat(3, 1fr)"] {
                    grid-template-columns: 1fr !important;
                }

                /* Tabelas com scroll */
                .tabela-container {
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    max-width: 100% !important;
                }

                /* Inputs acessíveis */
                input, select, textarea, button {
                    min-height: 44px !important;
                }

                input, select, textarea {
                    font-size: 16px !important;
                }

                /* Remover overflow hidden */
                [style*="overflow: hidden"] {
                    overflow: visible !important;
                }

                body {
                    overflow-x: hidden !important;
                    overflow-y: auto !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ============================================
    // SISTEMA DE MONITORAMENTO CONTÍNUO
    // ============================================
    function iniciarMonitoramentoContinuo() {
        // Verificar a cada 100ms (agressivo, mas necessário)
        setInterval(function() {
            if (isMobile()) {
                forcedMobileLayout();
            }
        }, 100);

        // Observar mudanças no DOM
        const observer = new MutationObserver(function() {
            if (isMobile()) {
                // Aplicar correção imediatamente e depois de um tempo
                forcedMobileLayout();
                setTimeout(forcedMobileLayout, 50);
                setTimeout(forcedMobileLayout, 200);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        // Observar resize
        window.addEventListener('resize', function() {
            if (isMobile()) {
                setTimeout(forcedMobileLayout, 50);
                setTimeout(forcedMobileLayout, 150);
            }
        });

        console.log('📱 [MobileFix] monitoramento contínuo ativo');
    }

    // ============================================
    // FUNÇÃO DE DEBUG
    // ============================================
    window.forcarLayoutMobile = function() {
        console.log('📱 [MobileFix] forçando layout mobile manualmente');
        forcedMobileLayout();
        return 'Layout mobile aplicado';
    };

    window.debugMobileStatus = function() {
        console.log('📱 [MobileFix] STATUS:', {
            isMobile: isMobile(),
            largura: window.innerWidth,
            dashboardLayout: !!document.querySelector('.dashboard-layout'),
            painelEsquerdo: !!document.getElementById('painelEsquerdo'),
            painelNoticias: !!document.getElementById('painelNoticias'),
            painelIndicadores: !!document.getElementById('painelIndicadores')
        });
    };

    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    function init() {
        console.log('📱 [MobileFix] INICIANDO CORREÇÃO FORÇADA PARA MOBILE');
        
        // 1. Injeta CSS de emergência
        injectEmergencyCSS();
        
        // 2. Aplica correção imediatamente
        forcedMobileLayout();
        
        // 3. Aplica novamente após delays (para pegar elementos que demoram)
        setTimeout(forcedMobileLayout, 500);
        setTimeout(forcedMobileLayout, 1000);
        setTimeout(forcedMobileLayout, 2000);
        setTimeout(forcedMobileLayout, 3000);
        setTimeout(forcedMobileLayout, 5000);
        
        // 4. Inicia monitoramento contínuo
        iniciarMonitoramentoContinuo();
        
        console.log('📱 [MobileFix] SISTEMA DE CORREÇÃO ATIVADO');
        console.log('📱 [MobileFix] Use window.forcarLayoutMobile() para aplicar manualmente');
        console.log('📱 [MobileFix] Use window.debugMobileStatus() para verificar estado');
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

/**
 * ============================================
 * TECA CAPITAL - JAVASCRIPT DE PROTEÇÃO ABSOLUTA
 * ============================================
 * Este script PROTEGE o header e footer do site
 * contra qualquer influência do CSS/JS do simulador
 * 
 * VERSÃO: 1.0.0
 * PRIORIDADE: MÁXIMA (DEVE EXECUTAR APÓS O SIMULADOR)
 * ============================================
 */

(function() {
    'use strict';
    
    // ===== CONFIGURAÇÕES =====
    const CONFIG = {
        HEADER_SELECTOR: '.site-header',
        FOOTER_SELECTOR: '.site-footer',
        SIMULATOR_SELECTOR: '#simulador-app, .simulador-container, [class*="simulador"]',
        DEBUG_MODE: false, // Mude para true para ver logs de proteção
        PROTECTION_INTERVAL: 1000, // Verificar a cada 1 segundo (ms)
    };
    
    // ===== UTILITÁRIOS DE LOG =====
    const log = {
        info: (msg) => CONFIG.DEBUG_MODE && console.log('🔒 [Proteção]', msg),
        warn: (msg) => CONFIG.DEBUG_MODE && console.warn('⚠️ [Proteção]', msg),
        error: (msg) => console.error('❌ [Proteção]', msg)
    };
    
    // ===== ESTADO ORIGINAL DOS ELEMENTOS =====
    let originalHeaderStyles = {};
    let originalFooterStyles = {};
    let originalHeaderHTML = '';
    let originalFooterHTML = '';
    
    // ===== FUNÇÃO PARA CAPTURAR ESTADO ORIGINAL =====
    function captureOriginalState() {
        const header = document.querySelector(CONFIG.HEADER_SELECTOR);
        const footer = document.querySelector(CONFIG.FOOTER_SELECTOR);
        
        if (header) {
            // Capturar HTML original
            originalHeaderHTML = header.outerHTML;
            
            // Capturar estilos computados importantes
            const headerStyles = window.getComputedStyle(header);
            originalHeaderStyles = {
                position: headerStyles.position,
                zIndex: headerStyles.zIndex,
                backgroundColor: headerStyles.backgroundColor,
                color: headerStyles.color,
                fontFamily: headerStyles.fontFamily,
                fontSize: headerStyles.fontSize,
                display: headerStyles.display,
                width: headerStyles.width,
                height: headerStyles.height,
                top: headerStyles.top,
                left: headerStyles.left,
                right: headerStyles.right,
                bottom: headerStyles.bottom,
                margin: headerStyles.margin,
                padding: headerStyles.padding,
                border: headerStyles.border,
                boxShadow: headerStyles.boxShadow
            };
            log.info('Estado original do header capturado');
        }
        
        if (footer) {
            // Capturar HTML original
            originalFooterHTML = footer.outerHTML;
            
            // Capturar estilos computados importantes
            const footerStyles = window.getComputedStyle(footer);
            originalFooterStyles = {
                position: footerStyles.position,
                zIndex: footerStyles.zIndex,
                backgroundColor: footerStyles.backgroundColor,
                color: footerStyles.color,
                fontFamily: footerStyles.fontFamily,
                fontSize: footerStyles.fontSize,
                display: footerStyles.display,
                width: footerStyles.width,
                height: footerStyles.height,
                margin: footerStyles.margin,
                padding: footerStyles.padding,
                border: footerStyles.border,
                boxShadow: footerStyles.boxShadow
            };
            log.info('Estado original do footer capturado');
        }
    }
    
    // ===== FUNÇÃO PARA APLICAR PROTEÇÃO CSS-IN-JS =====
    function applyProtectionStyles() {
        const header = document.querySelector(CONFIG.HEADER_SELECTOR);
        const footer = document.querySelector(CONFIG.FOOTER_SELECTOR);
        
        // Criar ou obter elemento de estilo de proteção
        let protectionStyle = document.getElementById('teca-capital-protection-dynamic');
        if (!protectionStyle) {
            protectionStyle = document.createElement('style');
            protectionStyle.id = 'teca-capital-protection-dynamic';
            document.head.appendChild(protectionStyle);
        }
        
        // CSS dinâmico de proteção (redundante com o CSS estático)
        protectionStyle.textContent = `
            /* PROTEÇÃO DINÂMICA GERADA POR JS */
            ${CONFIG.HEADER_SELECTOR},
            ${CONFIG.HEADER_SELECTOR} *,
            ${CONFIG.FOOTER_SELECTOR},
            ${CONFIG.FOOTER_SELECTOR} * {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                color-scheme: light !important;
                all: revert !important;
            }
            
            /* Proteger ícones sociais */
            .social-icons i,
            .social-icons .fab {
                font-family: "Font Awesome 6 Brands", "Font Awesome 5 Brands" !important;
            }
            
            /* Garantir que o menu mobile funcione */
            .menu-toggle.mobile-nav-toggle {
                display: flex !important;
                cursor: pointer !important;
                z-index: 1001 !important;
            }
            
            .mobile-nav-overlay {
                transition: transform 0.3s ease !important;
            }
        `;
        
        log.info('Estilos de proteção dinâmicos aplicados');
    }
    
    // ===== FUNÇÃO PARA REMOVER CLASSES INDEVIDAS =====
    function removeOffendingClasses() {
        const protectedElements = [
            ...document.querySelectorAll(`${CONFIG.HEADER_SELECTOR} *`),
            ...document.querySelectorAll(`${CONFIG.FOOTER_SELECTOR} *`)
        ];
        
        // Lista de classes que NUNCA devem aparecer no header/footer
        const forbiddenClassPatterns = [
            'simulador', 'dashboard', 'card', 'btn', 'rh-', 'financeiro-', 
            'investimento', 'estoque', 'form-', 'container', 'grid',
            'modal', 'popup', 'notificacao', 'loading', 'spinner',
            'animate', 'fade', 'slide', 'zoom', 'pulse'
        ];
        
        protectedElements.forEach(el => {
            if (el.classList && el.classList.length > 0) {
                const classesToRemove = [];
                
                // Verificar cada classe do elemento
                Array.from(el.classList).forEach(className => {
                    // Verificar se a classe corresponde a algum padrão proibido
                    const isForbidden = forbiddenClassPatterns.some(pattern => 
                        className.toLowerCase().includes(pattern.toLowerCase())
                    );
                    
                    // Verificar se a classe NÃO é original do header/footer
                    const isOriginalHeaderClass = className.startsWith('site-') || 
                                                  className.startsWith('header-') ||
                                                  className.startsWith('logo-') ||
                                                  className.startsWith('nav-') ||
                                                  className.startsWith('menu-') ||
                                                  className.startsWith('hamburger') ||
                                                  className.startsWith('footer-') ||
                                                  className.startsWith('social-') ||
                                                  className.startsWith('contact-') ||
                                                  className.startsWith('copyright-');
                    
                    if (isForbidden && !isOriginalHeaderClass) {
                        classesToRemove.push(className);
                    }
                });
                
                // Remover classes ofensivas
                if (classesToRemove.length > 0) {
                    el.classList.remove(...classesToRemove);
                    log.info(`Removidas classes de ${el.tagName}: ${classesToRemove.join(', ')}`);
                }
            }
        });
    }
    
    // ===== FUNÇÃO PARA RESTAURAR ESTILOS INLINE INDEVIDOS =====
    function restoreInlineStyles() {
        const header = document.querySelector(CONFIG.HEADER_SELECTOR);
        const footer = document.querySelector(CONFIG.FOOTER_SELECTOR);
        
        // Lista de propriedades que NÃO devem ser alteradas por scripts
        const protectedProperties = [
            'position', 'zIndex', 'backgroundColor', 'color', 'fontFamily',
            'fontSize', 'display', 'width', 'height', 'margin', 'padding',
            'border', 'boxShadow', 'transform', 'transition', 'animation',
            'opacity', 'visibility', 'overflow'
        ];
        
        if (header && header.style.length > 0) {
            protectedProperties.forEach(prop => {
                const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                if (header.style[camelProp] && !isOriginalStyle(header, prop)) {
                    header.style[camelProp] = '';
                    log.info(`Resetado estilo inline ${prop} do header`);
                }
            });
        }
        
        if (footer && footer.style.length > 0) {
            protectedProperties.forEach(prop => {
                const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                if (footer.style[camelProp] && !isOriginalStyle(footer, prop)) {
                    footer.style[camelProp] = '';
                    log.info(`Resetado estilo inline ${prop} do footer`);
                }
            });
        }
    }
    
    // ===== FUNÇÃO AUXILIAR PARA VERIFICAR SE ESTILO É ORIGINAL =====
    function isOriginalStyle(element, property) {
        // Implementar lógica para verificar se o estilo atual corresponde ao original
        // Por simplicidade, retorna false para sempre resetar
        return false;
    }
    
    // ===== FUNÇÃO PARA GARANTIR INTEGRIDADE DO HTML =====
    function ensureHTMLIntegrity() {
        const header = document.querySelector(CONFIG.HEADER_SELECTOR);
        const footer = document.querySelector(CONFIG.FOOTER_SELECTOR);
        
        // Verificar se o header ainda existe e tem a estrutura esperada
        if (header && originalHeaderHTML) {
            // Verificar se elementos críticos ainda existem
            const criticalHeaderElements = [
                '.logo-container',
                '.main-nav',
                '.menu-toggle',
                '.mobile-nav-overlay'
            ];
            
            criticalHeaderElements.forEach(selector => {
                if (!header.querySelector(selector)) {
                    log.warn(`Elemento crítico perdido: ${selector} no header`);
                    // Aqui você poderia restaurar parcialmente se necessário
                }
            });
        }
        
        // Verificar se o footer ainda existe e tem a estrutura esperada
        if (footer && originalFooterHTML) {
            // Verificar se elementos críticos ainda existem
            const criticalFooterElements = [
                '.social-section',
                '.contact-section',
                '.copyright-section'
            ];
            
            criticalFooterElements.forEach(selector => {
                if (!footer.querySelector(selector)) {
                    log.warn(`Elemento crítico perdido: ${selector} no footer`);
                    // Aqui você poderia restaurar parcialmente se necessário
                }
            });
        }
    }
    
    // ===== FUNÇÃO PARA PROTEGER EVENTOS =====
    function protectEventListeners() {
        // Proteger o botão do menu mobile
        const menuToggle = document.querySelector('.menu-toggle.mobile-nav-toggle');
        const mobileNav = document.querySelector('.mobile-nav-overlay');
        
        if (menuToggle && mobileNav) {
            // Remover event listeners existentes (não é possível diretamente)
            // Clonar e substituir para remover listeners
            const newMenuToggle = menuToggle.cloneNode(true);
            menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);
            
            // Adicionar listener protegido
            newMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                mobileNav.classList.toggle('active');
                
                // Disparar evento customizado para outros scripts
                const event = new CustomEvent('mobileMenuToggled', { 
                    detail: { isOpen: mobileNav.classList.contains('active') }
                });
                document.dispatchEvent(event);
            });
            
            log.info('Event listeners do menu mobile protegidos');
        }
    }
    
    // ===== FUNÇÃO PARA OBSERVAR MUTAÇÕES =====
    function observeMutations() {
        const targetNode = document.body;
        
        const observer = new MutationObserver((mutations) => {
            let needsProtection = false;
            
            mutations.forEach(mutation => {
                // Verificar se as mutações afetam header ou footer
                if (mutation.target && (
                    mutation.target.closest(CONFIG.HEADER_SELECTOR) ||
                    mutation.target.closest(CONFIG.FOOTER_SELECTOR)
                )) {
                    needsProtection = true;
                }
                
                // Verificar se novos nós foram adicionados dentro do header/footer
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.closest && (
                                node.closest(CONFIG.HEADER_SELECTOR) ||
                                node.closest(CONFIG.FOOTER_SELECTOR)
                            )) {
                                needsProtection = true;
                            }
                        }
                    });
                }
            });
            
            if (needsProtection) {
                log.info('Mutações detectadas no header/footer, aplicando proteção...');
                removeOffendingClasses();
                restoreInlineStyles();
            }
        });
        
        observer.observe(targetNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        log.info('MutationObserver iniciado');
    }
    
    // ===== FUNÇÃO DE PROTEÇÃO PERIÓDICA =====
    function periodicProtection() {
        removeOffendingClasses();
        restoreInlineStyles();
        ensureHTMLIntegrity();
        log.info('Proteção periódica executada');
    }
    
    // ===== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO =====
    function initProtection() {
        log.info('Inicializando sistema de proteção...');
        
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(setupProtection, 100);
            });
        } else {
            setTimeout(setupProtection, 100);
        }
    }
    
    function setupProtection() {
        log.info('Configurando proteção...');
        
        // Capturar estado original
        captureOriginalState();
        
        // Aplicar estilos de proteção
        applyProtectionStyles();
        
        // Remover classes indevidas
        removeOffendingClasses();
        
        // Restaurar estilos inline
        restoreInlineStyles();
        
        // Proteger event listeners
        protectEventListeners();
        
        // Observar mutações
        observeMutations();
        
        // Proteção periódica
        setInterval(periodicProtection, CONFIG.PROTECTION_INTERVAL);
        
        // Proteger contra carregamento assíncrono do simulador
        window.addEventListener('load', function() {
            log.info('Window loaded, aplicando proteção final...');
            removeOffendingClasses();
            restoreInlineStyles();
            ensureHTMLIntegrity();
        });
        
        log.info('✅ Sistema de proteção iniciado com sucesso!');
    }
    
    // ===== INICIAR PROTEÇÃO =====
    initProtection();
    
})();
