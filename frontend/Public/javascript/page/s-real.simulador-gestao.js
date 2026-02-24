// ============================================
// SIMULADOR DE GESTÃO EMPRESARIAL - VERSÃO FINAL 100% FUNCIONAL
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
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

async function iniciarSimulador() {
  dadosMundo = await carregarDadosJSON();
  
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
      
      <div class="flex-center gap-20 mt-20">
        <button onclick="mostrarRH()" class="btn-grande">👥 Contratar Funcionários</button>
        <button onclick="mostrarFornecedores()" class="btn-grande">📦 Comprar Produtos</button>
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
      
      <div class="campanhas-grid" style="margin-top: 30px;">
        <div class="campanha-card">
          <h3>📝 Contratar</h3>
          <select id="classe-contratar" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="A">Classe A (700k Kz) +2% prod</option>
            <option value="B">Classe B (200k Kz) +0.5% prod</option>
            <option value="C">Classe C (50k Kz) +0.01% prod</option>
            <option value="D">Classe D (30k Kz) 0% prod</option>
          </select>
          
          <div class="rh-input-group">
            <label>Homens:</label>
            <input type="number" id="homens-contratar" min="0" value="0" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary);">
          </div>
          
          <div class="rh-input-group">
            <label>Mulheres:</label>
            <input type="number" id="mulheres-contratar" min="0" value="0" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary);">
          </div>
          
          <div class="rh-calculo" id="calculo-contratacao">
            <p>💰 Salário: <span id="preview-salario">0</span> Kz</p>
            <p>🏥 INSS: <span id="preview-inss">0</span> Kz</p>
            <p class="text-gold">💵 Total: <span id="preview-total">0</span> Kz</p>
          </div>
          
          <button onclick="contratarFuncionarios()" class="btn-submit">Contratar</button>
        </div>
        
        <div class="campanha-card">
          <h3>⚠️ Demitir</h3>
          <select id="classe-demitir" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="A">Classe A</option>
            <option value="B">Classe B</option>
            <option value="C">Classe C</option>
            <option value="D">Classe D</option>
          </select>
          
          <div class="rh-input-group">
            <label>Quantidade:</label>
            <input type="number" id="quantidade-demitir" min="1" value="1" placeholder="Qtd" style="color: var(--text-primary); background: var(--bg-secondary);">
          </div>
          
          <div class="rh-calculo">
            <p class="text-danger">⚠️ Indemnização: 4 salários</p>
            <p id="preview-indemnizacao">0 Kz</p>
          </div>
          
          <button onclick="demitirFuncionarios()" class="btn-danger">Demitir</button>
        </div>
        
        <div class="campanha-card">
          <h3>📚 Formação</h3>
          <p>Custo: 3.500.000 Kz</p>
          <p>Ganha +5% produtividade no mês</p>
          <button onclick="fazerFormacao()" class="btn-submit">Realizar Formação</button>
        </div>
      </div>
      
      <div class="flex-between mt-20">
        <button onclick="pagarSalarios()" class="btn-pagar ${pagamentosMes.salariosPagos ? 'disabled' : ''}" 
                ${pagamentosMes.salariosPagos ? 'disabled' : ''}>
          💰 Pagar Salários (${formatarMoeda(totalSalarios)} Kz)
        </button>
        <button onclick="pagarSegurancaSocial()" class="btn-pagar ${pagamentosMes.inssPago ? 'disabled' : ''}"
                ${pagamentosMes.inssPago ? 'disabled' : ''}>
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
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarFornecedoresNacionais()">Nacionais (Kz)</button>
        <button class="tab-btn" onclick="mostrarFornecedoresInternacionais()">Internacionais (USD)</button>
        <button class="tab-btn" onclick="mostrarProducaoServicos()">Produção de Serviços</button>
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
    <div class="fornecedores-grid">
      <div class="fornecedor-card">
        <h4>Fornecedor Nacional Classe A</h4>
        <p>⏱️ Entrega: 1 dia</p>
        <p>📦 Mínimo: 100 unidades</p>
        <input type="number" id="preco-produto-a" placeholder="Preço unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-a" min="100" placeholder="Quantidade (mín. 100)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-a">Total: 0 Kz</p>
        <button onclick="comprarNacional('A')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Nacional Classe B</h4>
        <p>⏱️ Entrega: 7 dias</p>
        <p>📦 Mínimo: 40 unidades</p>
        <input type="number" id="preco-produto-b" placeholder="Preço unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-b" min="40" placeholder="Quantidade (mín. 40)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-b">Total: 0 Kz</p>
        <button onclick="comprarNacional('B')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Nacional Classe C</h4>
        <p>⏱️ Entrega: 15 dias</p>
        <p>📦 Mínimo: 10 unidades</p>
        <input type="number" id="preco-produto-c" placeholder="Preço unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-c" min="10" placeholder="Quantidade (mín. 10)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-c">Total: 0 Kz</p>
        <button onclick="comprarNacional('C')">Comprar</button>
      </div>
    </div>
  `;
}

function gerarFornecedoresInternacionaisHTML() {
  return `
    <div class="fornecedores-grid">
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe A</h4>
        <p>⏱️ Entrega: 7 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 50 unidades</p>
        <select id="pais-importacao-a" style="color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-a" placeholder="Preço unitário (USD)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-a" min="50" placeholder="Quantidade (mín. 50)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-int-a">Total: 0 USD</p>
        <button onclick="comprarInternacional('A')">Importar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe B</h4>
        <p>⏱️ Entrega: 30 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 20 unidades</p>
        <select id="pais-importacao-b" style="color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-b" placeholder="Preço unitário (USD)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-b" min="20" placeholder="Quantidade (mín. 20)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-int-b">Total: 0 USD</p>
        <button onclick="comprarInternacional('B')">Importar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe C</h4>
        <p>⏱️ Entrega: 90 dias (+var. diplomacia)</p>
        <p>📦 Mínimo: 5 unidades</p>
        <select id="pais-importacao-c" style="color: var(--text-primary); background: var(--bg-secondary);">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-c" placeholder="Preço unitário (USD)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-produto-int-c" min="5" placeholder="Quantidade (mín. 5)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-int-c">Total: 0 USD</p>
        <button onclick="comprarInternacional('C')">Importar</button>
      </div>
    </div>
  `;
}

function gerarProducaoServicosHTML() {
  return `
    <div class="fornecedores-grid">
      <div class="fornecedor-card">
        <h4>Serviço Classe A</h4>
        <p>⏱️ Produção: 30 dias</p>
        <p>📦 Mínimo: 5 unidades</p>
        <input type="number" id="preco-servico-a" placeholder="Custo unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-a" min="5" placeholder="Quantidade (mín. 5)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-servico-a">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('A')">Iniciar Produção</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Serviço Classe B</h4>
        <p>⏱️ Produção: 15 dias</p>
        <p>📦 Mínimo: 10 unidades</p>
        <input type="number" id="preco-servico-b" placeholder="Custo unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-b" min="10" placeholder="Quantidade (mín. 10)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-servico-b">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('B')">Iniciar Produção</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Serviço Classe C</h4>
        <p>⏱️ Produção: 7 dias</p>
        <p>📦 Mínimo: 20 unidades</p>
        <input type="number" id="preco-servico-c" placeholder="Custo unitário (Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <input type="number" id="quantidade-servico-c" min="20" placeholder="Quantidade (mín. 20)" style="color: var(--text-primary); background: var(--bg-secondary);">
        <p class="text-gold" id="total-pagar-servico-c">Total: 0 Kz</p>
        <button onclick="iniciarProducaoServico('C')">Iniciar Produção</button>
      </div>
    </div>
  `;
}

function mostrarFornecedoresNacionais() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarFornecedoresNacionaisHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  adicionarListenersNacionais();
}

function mostrarFornecedoresInternacionais() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarFornecedoresInternacionaisHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  adicionarListenersInternacionais();
}

function mostrarProducaoServicos() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarProducaoServicosHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
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
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarEstoqueDisponivel()">Estoque Disponível</button>
        <button class="tab-btn" onclick="mostrarEntregasPendentes()">Entregas Pendentes</button>
        <button class="tab-btn" onclick="mostrarProducoesPendentes()">Produções Pendentes</button>
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
            <input type="number" id="margem-${item.id}" min="0" max="30" placeholder="Margem 0-30%" style="width: 80px; color: var(--text-primary); background: var(--bg-secondary);">
            <button onclick="definirMargem(${item.id})">Definir</button>
          ` : `
            <button onclick="venderProduto(${item.id})" class="btn-success">Vender</button>
            ${estadoJogo.licencaExportacao ? `<button onclick="prepararExportacao(${item.id})" class="btn-export">🌍 Exportar</button>` : ''}
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
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarEntregasPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = gerarEntregasPendentesHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarProducoesPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = gerarProducoesPendentesHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
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
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h3>📱 Marketing Digital</h3>
          <p>Alcance: 100 pessoas / 50.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-digital" min="1" value="1" placeholder="Quantidade de lotes" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold" id="total-digital">Total: 50.000 Kz</p>
          <button onclick="investirMarketing('digital')">Investir</button>
        </div>
        
        <div class="campanha-card">
          <h3>📰 Marketing Tradicional</h3>
          <p>Alcance: 30 pessoas / 10.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-tradicional" min="1" value="1" placeholder="Quantidade de lotes" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold" id="total-tradicional">Total: 10.000 Kz</p>
          <button onclick="investirMarketing('tradicional')">Investir</button>
        </div>
        
        <div class="campanha-card">
          <h3>🌍 Marketing Internacional</h3>
          <p>Alcance: 50 pessoas / 100.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-internacional" min="1" value="1" placeholder="Quantidade de lotes" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold" id="total-internacional">Total: 100.000 Kz</p>
          <button onclick="investirMarketing('internacional')">Investir</button>
        </div>
      </div>
      
      <div class="clientes-stats">
        <div class="stat">
          <h4>Clientes Nacionais</h4>
          <span class="text-gold">${clientes.nacionais}</span>
        </div>
        <div class="stat">
          <h4>Clientes Estrangeiros</h4>
          <span class="text-gold">${clientes.estrangeiros}</span>
        </div>
        <div class="stat">
          <h4>Total</h4>
          <span class="text-gold">${clientes.nacionais + clientes.estrangeiros}</span>
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
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarCreditos()">Créditos</button>
        <button class="tab-btn" onclick="mostrarDepositos()">Depósitos</button>
        <button class="tab-btn" onclick="mostrarTitulos()">Títulos Públicos</button>
        <button class="tab-btn" onclick="mostrarCambio()">Câmbio</button>
        <button class="tab-btn" onclick="mostrarHistoricoInvestimentos()">Histórico Invest.</button>
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
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>Crédito Nacional (Kz)</h4>
          <p>Taxa de Juro: 19.5% ao ano</p>
          <p>Requisito: 65% do valor em Kz (bloqueado)</p>
          <input type="number" id="valor-credito-kz" placeholder="Valor desejado" style="color: var(--text-primary); background: var(--bg-secondary);">
          <select id="prazo-credito-kz" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <p id="juros-credito-kz">Juros total: 0 Kz</p>
          <button onclick="solicitarCreditoNacional()">Solicitar Crédito</button>
        </div>
        
        <div class="campanha-card">
          <h4>Crédito Internacional (USD)</h4>
          <p>Taxa de Juro: 30% ao ano</p>
          <p>Requisito: 85% do valor em USD (bloqueado)</p>
          <input type="number" id="valor-credito-usd" placeholder="Valor desejado" style="color: var(--text-primary); background: var(--bg-secondary);">
          <select id="prazo-credito-usd" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <select id="pais-credito" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="eua">EUA</option>
            <option value="china">China</option>
            <option value="portugal">Portugal</option>
          </select>
          <p id="juros-credito-usd">Juros total: 0 USD</p>
          <button onclick="solicitarCreditoInternacional()">Solicitar Crédito</button>
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
      <td><span class="${credito.status === 'ativo' ? 'text-success' : 'text-danger'}">${credito.status}</span></td>
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
    <div class="welcome-screen" style="color: var(--accent-red);">
      <h2>💔 FALÊNCIA DECRETADA</h2>
      <p>A empresa não tem condições de continuar</p>
      <p>Dívidas não pagas levaram ao encerramento</p>
      <button onclick="reiniciarSimulacao()" class="btn-grande">🔄 Recomeçar</button>
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
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>Comprar USD</h4>
          <p>Taxa de Câmbio Atual: 1 USD = ${formatarMoeda(taxaCambio)} Kz</p>
          <input type="number" id="quantidade-usd-comprar" min="1" placeholder="Quantidade USD" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p>Total a pagar: <span id="total-pagar-comprar">0</span> Kz</p>
          <button onclick="comprarUSD()">Comprar USD</button>
        </div>
        
        <div class="campanha-card">
          <h4>Vender USD</h4>
          <p>Taxa de Câmbio Atual: 1 USD = ${formatarMoeda(taxaCambio)} Kz</p>
          <input type="number" id="quantidade-usd-vender" min="1" placeholder="Quantidade USD" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p>Total a receber: <span id="total-receber-vender">0</span> Kz</p>
          <button onclick="venderUSD()">Vender USD</button>
        </div>
      </div>
      
      <div class="clientes-stats" style="margin-top: 20px;">
        <div class="stat">Saldo Kz: ${formatarMoeda(estadoJogo.carteiraKz)}</div>
        <div class="stat">Saldo USD: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')}</div>
        <div class="stat">Garantias Kz: ${formatarMoeda(estadoJogo.garantiasKz)}</div>
        <div class="stat">Garantias USD: ${formatarMoeda(estadoJogo.garantiasUsd, 'USD')}</div>
      </div>
      
      <div class="historico-cambio mt-20">
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
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarAcoes()">Ações</button>
        <button class="tab-btn" onclick="mostrarPropriedades()">Propriedades</button>
        <button class="tab-btn" onclick="mostrarDepositos()">Depósitos</button>
        <button class="tab-btn" onclick="mostrarTitulos()">Títulos</button>
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
          <td class="${classeVariacao}">${formatarMoeda(acao.precoAtual)} Kz</td>
          <td class="${classeVariacao}">${variacao}%</td>
          <td>${acao.quantidade}</td>
          <td>${acao.minimo}</td>
          <td>
            <button class="btn-comprar" onclick="comprarAcao('${acaoId}')">Comprar</button>
            ${acao.quantidade > 0 ? `<button class="btn-vender" onclick="venderAcao('${acaoId}')">Vender</button>` : ''}
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
          <td class="${classeVariacao}">USD ${formatarMoeda(acao.precoAtual, 'USD')}</td>
          <td class="${classeVariacao}">${variacao}%</td>
          <td>${acao.quantidade}</td>
          <td>${acao.minimo}</td>
          <td>
            <button class="btn-comprar" onclick="comprarAcao('${acaoId}')">Comprar</button>
            ${acao.quantidade > 0 ? `<button class="btn-vender" onclick="venderAcao('${acaoId}')">Vender</button>` : ''}
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
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarPropriedades() {
  const html = `
    <div class="propriedades-container">
      <h3>🏢 Propriedades Angola (Kz)</h3>
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>Tipo A</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoA)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-a" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'A')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo B</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoB)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-b" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'B')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo C</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoC)} Kz</p>
          <p>Taxas venda: Escritura 1.5% + Comissão 5%</p>
          <input type="number" id="qtd-propriedade-c" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('angola', 'C')">Comprar</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">🌍 Propriedades Internacionais (USD)</h3>
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>Tipo A</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoA, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-a" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'A')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo B</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoB, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-b" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'B')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo C</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoC, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-c" min="1" value="1" style="color: var(--text-primary); background: var(--bg-secondary);">
          <button onclick="comprarPropriedade('internacional', 'C')">Comprar</button>
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
        <button class="btn-vender" onclick="venderPropriedade('${g.local}', '${g.tipo}', ${g.quantidade})">Vender Tudo</button>
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
      <h3>🏦 Depósitos a Prazo</h3>
      
      <div class="info-box">
        <p>💰 Taxa de juro: 8% ao ano (0.67% ao mês)</p>
        <p>⏱️ Prazo mínimo: 3 meses</p>
        <p>⚠️ Resgate antecipado: perde 50% dos juros</p>
      </div>
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>3 Meses</h4>
          <p>Taxa: 2% (total)</p>
          <input type="number" id="valor-deposito-3m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold">Rendimento: <span id="rendimento-3m">0</span> Kz</p>
          <button onclick="criarDeposito(3)">📥 Aplicar</button>
        </div>
        
        <div class="campanha-card">
          <h4>6 Meses</h4>
          <p>Taxa: 4% (total)</p>
          <input type="number" id="valor-deposito-6m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold">Rendimento: <span id="rendimento-6m">0</span> Kz</p>
          <button onclick="criarDeposito(6)">📥 Aplicar</button>
        </div>
        
        <div class="campanha-card">
          <h4>12 Meses</h4>
          <p>Taxa: 8% (total)</p>
          <input type="number" id="valor-deposito-12m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)" style="color: var(--text-primary); background: var(--bg-secondary);">
          <p class="text-gold">Rendimento: <span id="rendimento-12m">0</span> Kz</p>
          <button onclick="criarDeposito(12)">📥 Aplicar</button>
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
        <td class="text-success">+${formatarMoeda(d.rendimento)} Kz</td>
        <td>${d.dataAplicacao}</td>
        <td>${d.dataVencimento}</td>
        <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
        <td>
          ${diasRestantes <= 0 ? 
            `<button onclick="resgatarDeposito(${d.id})">Resgatar</button>` : 
            `<button onclick="resgatarDepositoAntecipado(${d.id})" class="btn-danger">Resgatar (com multa)</button>`}
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
      <h3>📜 Títulos Públicos (BNA)</h3>
      
      <div class="info-box">
        <p>🏛️ Emitidos pelo Banco Nacional de Angola</p>
        <p>💰 IAC de 10% sobre juros + taxas</p>
      </div>
      
      <div class="campanhas-grid">
        ${titulosDisponiveis.map(t => `
          <div class="campanha-card">
            <h4>${t.nome}</h4>
            <p>Prazo: ${t.prazo} meses</p>
            <p>Taxa: ${(t.taxa * 100).toFixed(1)}% ao ano</p>
            <p>Mínimo: ${formatarMoeda(t.minimo)} Kz</p>
            
            <input type="number" id="valor-titulo-${t.id}" 
                   min="${t.minimo}" step="100000" 
                   placeholder="Valor" style="color: var(--text-primary); background: var(--bg-secondary);">
            
            <p class="text-gold">Rendimento bruto: <span id="rendimento-${t.id}">0</span> Kz</p>
            <p class="text-gold">Rendimento líquido: <span id="liquido-${t.id}">0</span> Kz</p>
            
            <button onclick="comprarTitulo('${t.id}', ${t.taxa}, ${t.prazo}, ${t.minimo})">
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
        <td class="text-success">+${formatarMoeda(t.rendimentoBruto)} Kz</td>
        <td class="text-success">+${formatarMoeda(t.rendimentoLiquido)} Kz</td>
        <td>${t.dataCompra}</td>
        <td>${t.dataVencimento}</td>
        <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
        <td>
          ${diasRestantes <= 0 ? 
            `<button onclick="resgatarTitulo(${t.id})">Resgatar</button>` : 
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
      
      <div class="clientes-stats" style="margin-top: 20px;">
        <div class="stat">
          <h4>Total Investido</h4>
          <span class="text-gold">${calcularTotalInvestido()}</span>
        </div>
        <div class="stat">
          <h4>Total em Ações</h4>
          <span class="text-gold">${calcularTotalAcoes()}</span>
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
  
  const html = `
    <div class="estrategia-container">
      <h2>🎯 Estratégia Empresarial</h2>
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h3>🤝 Parcerias Estratégicas</h3>
          <div class="parceria-item ${clientes.nacionais + clientes.estrangeiros >= 350000 ? 'condicao-ok' : 'condicao-ruim'}">
            <p>Tipo A: 350k clientes - +50M Kz/trimestre</p>
          </div>
          <div class="parceria-item ${clientes.nacionais + clientes.estrangeiros >= 20000 ? 'condicao-ok' : 'condicao-ruim'}">
            <p>Tipo B: 20k clientes - +20M Kz/trimestre</p>
          </div>
          <div class="parceria-item ${clientes.nacionais + clientes.estrangeiros >= 2000 ? 'condicao-ok' : 'condicao-ruim'}">
            <p>Tipo C: 2k clientes - +10M Kz/trimestre</p>
          </div>
          <div class="parceria-item ${clientes.nacionais + clientes.estrangeiros >= 500 ? 'condicao-ok' : 'condicao-ruim'}">
            <p>Tipo D: 500 clientes - +2M Kz/trimestre</p>
          </div>
          <select id="tipo-parceiro" style="color: var(--text-primary); background: var(--bg-secondary); margin-top: 10px;">
            <option value="A">Tipo A (350k clientes)</option>
            <option value="B">Tipo B (20k clientes)</option>
            <option value="C">Tipo C (2k clientes)</option>
            <option value="D">Tipo D (500 clientes)</option>
          </select>
          <button onclick="fecharParceria()" style="margin-top: 10px;">Fechar Parceria</button>
          
          <div style="margin-top: 15px;">
            <h4>Parcerias Ativas</h4>
            ${gerarParceriasAtivas()}
          </div>
        </div>
        
        <div class="campanha-card">
          <h3>📈 Expansão da Empresa</h3>
          <p class="${condicoes.saldo ? 'text-success' : 'text-danger'}">✓ Saldo 3x inicial: ${condicoes.saldo ? '✅' : '❌'}</p>
          <p class="${condicoes.clientes ? 'text-success' : 'text-danger'}">✓ Clientes 5x original: ${condicoes.clientes ? '✅' : '❌'}</p>
          <p class="${condicoes.reservaUSD ? 'text-success' : 'text-danger'}">✓ Reserva USD ≥ 10.000: ${condicoes.reservaUSD ? '✅' : '❌'}</p>
          <p class="${condicoes.investimentos ? 'text-success' : 'text-danger'}">✓ Tem investimentos: ${condicoes.investimentos ? '✅' : '❌'}</p>
          <p class="${condicoes.lucro ? 'text-success' : 'text-danger'}">✓ Lucro acumulado ≥ 10M: ${condicoes.lucro ? '✅' : '❌'}</p>
          
          <button onclick="expandirEmpresa()" ${condicoes.todas ? '' : 'disabled'} class="btn-submit" style="margin-top: 15px;">
            Expandir Empresa (Nível ${estadoJogo.nivelExpansao}/3)
          </button>
          ${estadoJogo.nivelExpansao >= 3 ? '<p class="text-success">✅ Expansão máxima atingida! Crescimento anual de 1%.</p>' : ''}
        </div>
        
        <div class="campanha-card">
          <h3>🌍 Exportação</h3>
          ${licencaAtiva ? 
            `<p class="text-success">✅ Licença ativa até: ${estadoJogo.licencaExpiracao}</p>` :
            `<p class="text-danger">❌ Sem licença de exportação</p>
             <p>Custo: 10.000.000 Kz (válida 5 anos)</p>
             <button onclick="comprarLicencaExportacao()">Comprar Licença</button>`
          }
        </div>
      </div>
      
      ${contabilista.multa > 0 ? `
        <div class="campanha-card" style="margin-top: 20px; border-color: var(--accent-red);">
          <h3 class="text-danger">⚠️ Multa AGT</h3>
          <p>Valor da multa: ${formatarMoeda(contabilista.multa)} Kz</p>
          ${!contabilista.multaParcelada ? 
            `<button onclick="negociarMulta()">Negociar em 12 prestações</button>` :
            `<p>Parcelado: ${contabilista.parcelasRestantes}/12 prestações de ${formatarMoeda(contabilista.valorParcela)} Kz</p>`
          }
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function gerarParceriasAtivas() {
  if (parcerias.length === 0) {
    return '<p>Nenhuma parceria ativa</p>';
  }
  
  return parcerias.map(p => {
    const diasRestantes = calcularDiasRestantes(p.dataExpiracao);
    return `
      <div class="parceria-ativa">
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
  
  exportacoesPendentes.forEach(exp => {
    if (!exp.concluida && exp.dataConclusao === hoje) {
      estadoJogo.carteiraUsd += exp.valorLiquidoUSD;
      exp.concluida = true;
      
      registrarTransacao('exportacao', 'entrada', exp.valorLiquidoUSD, 'USD', 
        `Exportação de ${exp.quantidade} ${exp.nome} para ${exp.pais} concluída`);
      
      notificar(`✅ Exportação concluída! Recebeste ${formatarMoeda(exp.valorLiquidoUSD, 'USD')} USD`);
    }
  });
}

// ============================================
// MÓDULO CONTABILIDADE E OBRIGAÇÕES FISCAIS
// ============================================

function mostrarContabilista() {
  const html = `
    <div class="contabilista-container">
      <h2>📋 Contabilista e Obrigações Fiscais</h2>
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h3>👤 Contratar Contabilista</h3>
          <select id="classe-contabilista" style="color: var(--text-primary); background: var(--bg-secondary);">
            <option value="S">Classe S - 1.500.000 Kz (20 dias)</option>
            <option value="A">Classe A - 500.000 Kz (35 dias)</option>
            <option value="B">Classe B - 200.000 Kz (45 dias)</option>
            <option value="C">Classe C - 100.000 Kz (60 dias)</option>
          </select>
          <button onclick="pagarContabilista()">Contratar</button>
        </div>
        
        <div class="campanha-card">
          <h3>📊 Status Fiscal</h3>
          <p>Contabilista: ${contabilista.contratado ? '✅ Contratado' : '❌ Não contratado'}</p>
          ${contabilista.contratado ? `
            <p>Classe: ${contabilista.classe}</p>
            <p>Data pagamento: ${contabilista.dataPagamento}</p>
            <p>Previsão entrega: ${contabilista.dataEntrega}</p>
            <p>Dias restantes: ${calcularDiasRestantes(contabilista.dataEntrega)}</p>
          ` : ''}
          ${contabilista.multa > 0 ? `
            <p class="text-danger">⚠️ Multa AGT: ${formatarMoeda(contabilista.multa)} Kz</p>
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
          <div style="margin-top: 20px;">
            <canvas id="graficoAnual"></canvas>
          </div>
        </div>
      ` : '<p style="text-align: center; padding: 20px;">Contrate um contabilista para ver o histórico anual</p>'}
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
  
  if (contabilista.contratado && calcularDiasRestantes(contabilista.dataEntrega) <= 0) {
    setTimeout(() => {
      gerarGraficoAnual();
    }, 100);
  }
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
// MÓDULO HISTÓRICOS
// ============================================

function mostrarHistorico() {
  const html = `
    <div class="historico-container">
      <h2>📊 Históricos e Relatórios</h2>
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarHistoricoTransacoes()">Transações</button>
        <button class="tab-btn" onclick="mostrarHistoricoMensal()">Mensal</button>
        <button class="tab-btn" onclick="mostrarHistoricoAnualView()">Anual</button>
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
        <td class="${classe}">${trans.operacao === 'entrada' ? '+' : '-'}${formatarMoeda(trans.valor)} ${trans.moeda}</td>
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
        <td class="${classe}">${formatarMoeda(mes.lucro)} Kz</td>
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
        <td class="${classe}">${formatarMoeda(ano.lucroLiquido)} Kz</td>
      </tr>
    `;
  }).join('');
}

function mostrarHistoricoTransacoes() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoTransacoesHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarHistoricoMensal() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoMensalHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarHistoricoAnualView() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoAnualHTML();
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
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

function gerarGraficoAnual() {
  const ctx = document.getElementById('graficoAnual')?.getContext('2d');
  if (!ctx) return;
  
  const anos = historicoAnual.slice(-10).map(a => a.ano);
  const receitas = historicoAnual.slice(-10).map(a => a.receita / 1000000);
  const custos = historicoAnual.slice(-10).map(a => a.custos / 1000000);
  const lucros = historicoAnual.slice(-10).map(a => a.lucroLiquido / 1000000);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: anos,
      datasets: [
        { label: 'Receita (M Kz)', data: receitas, borderColor: '#4CAF50', fill: false },
        { label: 'Custos (M Kz)', data: custos, borderColor: '#F44336', fill: false },
        { label: 'Lucro Líquido (M Kz)', data: lucros, borderColor: '#FFC107', fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Evolução Anual (em milhões Kz)' }
      }
    }
  });
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
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarRelatorioMensal()">Mensal</button>
        <button class="tab-btn" onclick="mostrarRelatorioAnual()">Anual</button>
        <button class="tab-btn" onclick="mostrarRelatorioClientes()">Clientes</button>
        <button class="tab-btn" onclick="mostrarRelatorioProdutividade()">Produtividade</button>
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
        <td class="${classe}">${formatarMoeda(mes.lucro)} Kz</td>
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
            <td><strong class="${totalLucro >= 0 ? 'text-success' : 'text-danger'}">${formatarMoeda(totalLucro)} Kz</strong></td>
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
        <td class="${classe}">${formatarMoeda(ano.lucroLiquido)} Kz</td>
        <td>${roi}%</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
    <div style="margin-top: 30px;">
      <canvas id="graficoEvolucao"></canvas>
    </div>
  `;
  
  setTimeout(() => {
    const ctx = document.getElementById('graficoEvolucao')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: historicoAnual.slice(-10).map(a => a.ano),
          datasets: [
            { label: 'Receita (M Kz)', data: historicoAnual.slice(-10).map(a => a.receita / 1000000), borderColor: '#4CAF50' },
            { label: 'Lucro Líquido (M Kz)', data: historicoAnual.slice(-10).map(a => a.lucroLiquido / 1000000), borderColor: '#FFC107' }
          ]
        }
      });
    }
  }, 100);
  
  return html;
}

function gerarRelatorioClientes() {
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  const crescimentoMensal = clientes.historico.length > 1 ? 
    ((clientes.historico[clientes.historico.length - 1] - clientes.historico[0]) / clientes.historico[0] * 100).toFixed(1) : 0;
  
  return `
    <div class="clientes-stats" style="margin-bottom: 20px;">
      <div class="stat">
        <h4>Clientes Nacionais</h4>
        <span class="text-gold">${clientes.nacionais}</span>
      </div>
      <div class="stat">
        <h4>Clientes Estrangeiros</h4>
        <span class="text-gold">${clientes.estrangeiros}</span>
      </div>
      <div class="stat">
        <h4>Total</h4>
        <span class="text-gold">${totalClientes}</span>
      </div>
      <div class="stat">
        <h4>Crescimento</h4>
        <span class="${crescimentoMensal >= 0 ? 'text-success' : 'text-danger'}">${crescimentoMensal}%</span>
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
              <td class="text-success">+${c.novosClientes}</td>
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
    <div class="clientes-stats" style="margin-bottom: 20px;">
      <div class="stat">
        <h4>Total Funcionários</h4>
        <span class="text-gold">${totalFunc}</span>
      </div>
      <div class="stat">
        <h4>Faturação Média (3m)</h4>
        <span class="text-gold">${formatarMoeda(faturacaoMedia)} Kz</span>
      </div>
      <div class="stat">
        <h4>Produtividade Média</h4>
        <span class="text-gold">${formatarMoeda(produtividadeMedia)} Kz/func</span>
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
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioAnual() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioAnual();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioClientes() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioClientes();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarRelatorioProdutividade() {
  document.getElementById('relatorios-conteudo').innerHTML = gerarRelatorioProdutividade();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ============================================
// MÓDULO AJUDA
// ============================================

function mostrarAjuda() {
  const html = `
    <div class="ajuda-container">
      <h2>📚 Ajuda e Documentação</h2>
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarTutorialBasico()">Tutorial Básico</button>
        <button class="tab-btn" onclick="mostrarExplicacaoModulos()">Módulos</button>
        <button class="tab-btn" onclick="mostrarDicasEstrategicas()">Dicas Estratégicas</button>
        <button class="tab-btn" onclick="mostrarAtalhos()">Atalhos</button>
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
      <div class="tutorial-card"><h4>1. Criação da Empresa</h4><p>Escolha a dimensão, área de atuação e saldo inicial.</p></div>
      <div class="tutorial-card"><h4>2. Recursos Humanos</h4><p>Contrate funcionários, pague salários e INSS mensalmente.</p></div>
      <div class="tutorial-card"><h4>3. Fornecedores</h4><p>Compre produtos, defina margem e coloque à venda.</p></div>
      <div class="tutorial-card"><h4>4. Marketing</h4><p>Invista para aumentar base de clientes.</p></div>
      <div class="tutorial-card"><h4>5. Finanças</h4><p>Gerencie créditos, câmbio e investimentos.</p></div>
      <div class="tutorial-card"><h4>6. Estratégia</h4><p>Expanda, feche parcerias e exporte.</p></div>
      <div class="tutorial-card"><h4>7. Obrigações Fiscais</h4><p>Contrate contabilista e evite multas.</p></div>
    </div>
  `;
}

function gerarExplicacaoModulos() {
  return `
    <div class="modulos-content">
      <h3>📦 Módulos</h3>
      <div class="modulo-grid">
        <div class="modulo-card"><h4>👥 RH</h4><ul><li>Classe A: 700k Kz, +2% prod</li><li>Classe B: 200k Kz, +0.5% prod</li><li>Classe C: 50k Kz, +0.01% prod</li><li>Classe D: 30k Kz, 0% prod</li></ul></div>
        <div class="modulo-card"><h4>📦 Fornecedores</h4><ul><li>Nacional: prazos 1-15 dias</li><li>Internacional: prazos +30-90 dias</li></ul></div>
        <div class="modulo-card"><h4>📈 Investimentos</h4><ul><li>Ações: variação -100% a +1000%</li><li>Propriedades: -80% a +200%</li><li>Depósitos: 8% a.a.</li></ul></div>
      </div>
    </div>
  `;
}

function gerarDicasEstrategicas() {
  return `
    <div class="dicas-content">
      <h3>💡 Dicas</h3>
      <div class="dica-card"><h4>💰 Caixa</h4><p>Mantenha 65% para crédito.</p></div>
      <div class="dica-card"><h4>📈 Crescimento</h4><p>Invista em marketing regularmente.</p></div>
      <div class="dica-card"><h4>⚖️ RH</h4><p>Misture classes A e D.</p></div>
    </div>
  `;
}

function gerarAtalhos() {
  return `
    <div class="atalhos-content">
      <h3>⌨️ Atalhos</h3>
      <div class="atalho-grid">
        <div class="atalho-item"><span class="tecla">1</span><span>RH</span></div>
        <div class="atalho-item"><span class="tecla">2</span><span>Fornecedores</span></div>
        <div class="atalho-item"><span class="tecla">3</span><span>Marketing</span></div>
        <div class="atalho-item"><span class="tecla">4</span><span>Financeiro</span></div>
        <div class="atalho-item"><span class="tecla">5</span><span>Investimentos</span></div>
        <div class="atalho-item"><span class="tecla">6</span><span>Estratégia</span></div>
        <div class="atalho-item"><span class="tecla">7</span><span>Contabilista</span></div>
        <div class="atalho-item"><span class="tecla">8</span><span>Relatórios</span></div>
        <div class="atalho-item"><span class="tecla">9</span><span>Histórico</span></div>
        <div class="atalho-item"><span class="tecla">0/H</span><span>Ajuda</span></div>
        <div class="atalho-item"><span class="tecla">Espaço</span><span>Pausar</span></div>
      </div>
    </div>
  `;
}

function mostrarTutorialBasico() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarTutorialBasico();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarExplicacaoModulos() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarExplicacaoModulos();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarDicasEstrategicas() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarDicasEstrategicas();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarAtalhos() {
  document.getElementById('ajuda-conteudo').innerHTML = gerarAtalhos();
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// ============================================
// CSS ADICIONAL
// ============================================

const estiloAdicional = document.createElement('style');
estiloAdicional.textContent = `
  .atalho-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .atalho-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: var(--bg-secondary); border-radius: 5px; }
  .tecla { background: var(--bg-tertiary); padding: 3px 8px; border-radius: 3px; font-weight: bold; color: var(--accent-gold); min-width: 40px; text-align: center; }
  .tutorial-card { background: var(--bg-secondary); padding: 15px; margin: 10px 0; border-left: 4px solid var(--accent-gold); border-radius: 5px; }
  .modulo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
  .modulo-card { background: var(--bg-secondary); padding: 15px; border-radius: 8px; }
  .dica-card { background: var(--bg-secondary); padding: 15px; margin: 10px 0; border: 1px solid var(--border-color); position: relative; }
  .dica-card:before { content: "💡"; position: absolute; top: -10px; left: 15px; background: var(--bg-primary); padding: 0 5px; }
  .parceria-ativa { background: var(--bg-tertiary); padding: 8px; margin: 5px 0; border-radius: 4px; }
  .condicao-ok { color: var(--accent-green); }
  .condicao-ruim { color: var(--accent-red); }
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
window.fecharParceria = fecharParceria;
window.expandirEmpresa = expandirEmpresa;
window.comprarLicencaExportacao = comprarLicencaExportacao;
window.pagarContabilista = pagarContabilista;
window.negociarMulta = negociarMulta;
window.reiniciarSimulacao = reiniciarSimulacao;
window.alterarVelocidade = alterarVelocidade;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  iniciarSimulador();
});

