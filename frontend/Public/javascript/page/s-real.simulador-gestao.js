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
  lucroMes: 0
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

// Financeiro
let emprestimos = [];
let investimentos = {
  depositosPrazo: [],
  titulosPublicos: [],
  acoes: {
    bfa: { nome: 'BFA', precoBase: 50000, precoAtual: 50000, moeda: 'Kz', quantidade: 0 },
    bai: { nome: 'BAI', precoBase: 20000, precoAtual: 20000, moeda: 'Kz', quantidade: 0 },
    bodiva: { nome: 'BODIVA', precoBase: 5000, precoAtual: 5000, moeda: 'Kz', quantidade: 0 },
    microsoft: { nome: 'Microsoft', precoBase: 250, precoAtual: 250, moeda: 'USD', quantidade: 0 },
    apple: { nome: 'Apple', precoBase: 170, precoAtual: 170, moeda: 'USD', quantidade: 0 },
    tesla: { nome: 'Tesla', precoBase: 130, precoAtual: 130, moeda: 'USD', quantidade: 0 }
  },
  propriedades: {
    angola: { tipoA: 500000000, tipoB: 50000000, tipoC: 5000000 },
    internacional: { tipoA: 50000000, tipoB: 5000000, tipoC: 250000 }
  }
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
let producoesPendentes = [];
let entregasPendentes = [];

// Marketing e Clientes
let campanhasMarketing = [];
let clientes = {
  nacionais: 0,
  estrangeiros: 0,
  historico: []
};

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

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================

async function iniciarSimulador() {
  // Carregar dados do JSON
  dadosMundo = await carregarDadosJSON();
  
  // Verificar save
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
  
  // Se não tiver save ou usuário escolheu novo jogo
  mostrarFormularioCriacaoEmpresa();
}

function iniciarNovaSimulacao() {
  // Reset completo
  localStorage.removeItem('simuladorSave');
  
  // Resetar todas as variáveis
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
    lucroMes: 0
  };
  
  funcionarios = {
    classeA: { homens: 0, mulheres: 0, salario: 700000, produtividade: 0.02 },
    classeB: { homens: 0, mulheres: 0, salario: 200000, produtividade: 0.005 },
    classeC: { homens: 0, mulheres: 0, salario: 50000, produtividade: 0.0001 },
    classeD: { homens: 0, mulheres: 0, salario: 30000, produtividade: 0 }
  };
  
  emprestimos = [];
  estoque = [];
  historicoTransacoes = [];
  historicoMensal = [];
  historicoAnual = [];
  clientes.nacionais = 0;
  clientes.estrangeiros = 0;
  
  taxaCambio = 1800;
  inflacaoAtual = 23.4;
  
  // Reiniciar intervalo de tempo se existir
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
    return null;
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
          <input type="text" id="nome-empresa" required placeholder="Ex: Tech Solutions Lda">
        </div>
        
        <div class="form-group">
          <label>Dimensão da Empresa</label>
          <select id="dimensao-empresa" onchange="atualizarOpcoesSaldo()" required>
            <option value="">Selecione...</option>
            <option value="micro">Micro Empresa</option>
            <option value="pequena">Pequena Empresa</option>
            <option value="media">Média Empresa</option>
            <option value="grande">Grande Empresa</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Saldo Inicial</label>
          <select id="saldo-inicial" required>
            <option value="">Selecione a dimensão primeiro</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Área de Atuação</label>
          <select id="area-atuacao" required>
            <option value="">Selecione...</option>
            <option value="servicos">Prestação de Serviços</option>
            <option value="produtos">Venda de Produtos</option>
            <option value="hibrido">Híbrido (Serviços + Produtos)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Natureza Jurídica</label>
          <select id="natureza-juridica" required>
            <option value="">Selecione...</option>
            <option value="unipessoal">Unipessoal</option>
            <option value="lda">Sociedade por Quotas (Lda)</option>
            <option value="sa">Sociedade Anónima (SA)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Nº Máximo de Funcionários</label>
          <select id="max-funcionarios" required>
            <option value="">Selecione...</option>
            <option value="5">5 Funcionários</option>
            <option value="20">20 Funcionários</option>
            <option value="50">50 Funcionários</option>
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
  
  // Validar
  if (!nome || !dimensao || !saldo || !area || !natureza || !maxFunc) {
    notificar('Preencha todos os campos!');
    return;
  }
  
  // Configurar estado do jogo
  estadoJogo.empresaCriada = true;
  estadoJogo.nomeEmpresa = nome;
  estadoJogo.dimensao = dimensao;
  estadoJogo.naturezaJuridica = natureza;
  estadoJogo.areaAtuacao = area;
  estadoJogo.carteiraKz = saldo;
  estadoJogo.saldoInicial = saldo;
  estadoJogo.maxFuncionarios = maxFunc;
  
  // Atualizar interface
  document.getElementById('empresaNome').textContent = nome;
  document.getElementById('empresaDimensao').textContent = dimensao.toUpperCase();
  atualizarCarteiras();
  
  // Iniciar tempo
  iniciarTempoSimulador();
  
  // Mostrar dashboard inicial
  mostrarDashboardInicial();
  
  notificar(`Empresa ${nome} criada com sucesso!`);
  salvarEstadoSimulacao();
}

function mostrarDashboardInicial() {
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
  
  intervaloPrincipal = setInterval(() => {
    tempoDecorrido += 1;
    
    // Verificar mudança de dia (30 segundos)
    if (tempoDecorrido % TEMPO.dia === 0) {
      processarDia();
    }
    
    // Verificar mudança de mês (900 segundos)
    if (tempoDecorrido % TEMPO.mes === 0) {
      processarMes();
    }
    
    // Verificar mudança de trimestre (2700 segundos)
    if (tempoDecorrido % TEMPO.trimestre === 0) {
      processarTrimestre();
    }
    
    // Verificar mudança de ano (10800 segundos)
    if (tempoDecorrido % TEMPO.ano === 0) {
      processarAno();
    }
    
    // Atualizar display
    atualizarDataDisplay();
    verificarEventos();
    
  }, 1000); // 1 segundo real = 1 segundo no simulador
}

function processarDia() {
  // Avançar um dia
  dataSimulador.setDate(dataSimulador.getDate() + 1);
  
  // Processar vendas diárias
  processarVendasDiarias();
  
  // Verificar entregas pendentes
  verificarEntregas();
  
  // Verificar produções pendentes
  verificarProducoes();
  
  // Verificar vencimentos
  verificarVencimentos();
  
  // Atualizar dashboard
  atualizarDashboard();
}

function processarMes() {
  // Calcular faturamento do mês
  calcularFaturamentoMensal();
  
  // Resetar contadores mensais
  estadoJogo.faturamentoMes = 0;
  estadoJogo.custosMes = 0;
  
  // Verificar pagamentos obrigatórios
  verificarPagamentosMensais();
  
  // Registrar no histórico mensal
  registrarHistoricoMensal();
  
  notificar(`📅 Mês ${dataSimulador.getMonth() + 1} finalizado`);
}

function processarTrimestre() {
  // Atualizar taxa de câmbio
  atualizarTaxaCambio();
  
  // Atualizar preços das propriedades
  atualizarPrecosPropriedades();
  
  notificar('💰 Taxa de câmbio atualizada');
}

function processarAno() {
  // Avançar ano
  dataSimulador.setFullYear(dataSimulador.getFullYear() + 1);
  
  // Processar relatório anual
  processarRelatorioAnual();
  
  // Verificar licença de exportação
  verificarLicencaExportacao();
  
  // Atualizar geopolítica
  atualizarRelacoesDiplomaticas();
  
  // Verificar crise global (2 vezes por década)
  verificarCriseGlobal();
  
  notificar(`🎉 Ano ${dataSimulador.getFullYear()} iniciado!`);
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

// Variável de controle para pagamentos do mês
let pagamentosMes = {
    salariosPagos: false,
    inssPago: false,
    mesReferencia: null,
    anoReferencia: null
};

function verificarPagamentosMes() {
    const mesAtual = dataSimulador.getMonth();
    const anoAtual = dataSimulador.getFullYear();
    
    // Resetar se mudou de mês
    if (pagamentosMes.mesReferencia !== mesAtual || pagamentosMes.anoReferencia !== anoAtual) {
        pagamentosMes = {
            salariosPagos: false,
            inssPago: false,
            mesReferencia: mesAtual,
            anoReferencia: anoAtual
        };
    }
}

function mostrarRH() {
    if (!estadoJogo.empresaCriada) {
        notificar('Crie uma empresa primeiro!');
        return;
    }
    
    verificarPagamentosMes();
    
    const totalSalarios = calcularTotalSalarios();
    const totalINSS = totalSalarios * 0.11;
    
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
                    <tbody id="corpo-tabela-funcionarios">
                        ${gerarLinhasTabelaFuncionarios()}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2"><strong>Total H: ${calcularTotalHomens()}</strong></td>
                            <td><strong>Total M: ${calcularTotalMulheres()}</strong></td>
                            <td></td>
                            <td><strong>Total: ${formatarMoeda(totalSalarios)} Kz</strong></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colspan="5"><strong>Segurança Social (11%):</strong></td>
                            <td><strong>${formatarMoeda(totalINSS)} Kz</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="campanhas-grid" style="margin-top: 30px;">
                <div class="campanha-card">
                    <h3>📝 Contratar</h3>
                    <select id="classe-contratar">
                        <option value="A">Classe A (700k Kz) +2% prod</option>
                        <option value="B">Classe B (200k Kz) +0.5% prod</option>
                        <option value="C">Classe C (50k Kz) +0.01% prod</option>
                        <option value="D">Classe D (30k Kz) 0% prod</option>
                    </select>
                    
                    <div class="rh-input-group">
                        <label>Homens:</label>
                        <input type="number" id="homens-contratar" min="0" value="0" placeholder="Qtd">
                    </div>
                    
                    <div class="rh-input-group">
                        <label>Mulheres:</label>
                        <input type="number" id="mulheres-contratar" min="0" value="0" placeholder="Qtd">
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
                    <select id="classe-demitir">
                        <option value="A">Classe A</option>
                        <option value="B">Classe B</option>
                        <option value="C">Classe C</option>
                        <option value="D">Classe D</option>
                    </select>
                    
                    <div class="rh-input-group">
                        <label>Quantidade:</label>
                        <input type="number" id="quantidade-demitir" min="1" value="1" placeholder="Qtd">
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
    
    // Adicionar listeners para preview
    document.getElementById('homens-contratar').addEventListener('input', atualizarPreviewContratacao);
    document.getElementById('mulheres-contratar').addEventListener('input', atualizarPreviewContratacao);
    document.getElementById('classe-contratar').addEventListener('change', atualizarPreviewContratacao);
    
    document.getElementById('quantidade-demitir').addEventListener('input', atualizarPreviewDemissao);
    document.getElementById('classe-demitir').addEventListener('change', atualizarPreviewDemissao);
    
    // Inicializar previews
    atualizarPreviewContratacao();
    atualizarPreviewDemissao();
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
    
    const salarioUnitario = funcionarios[classe].salario;
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
    
    const indemnizacao = quantidade * funcionarios[classe].salario * 4;
    document.getElementById('preview-indemnizacao').textContent = formatarMoeda(indemnizacao) + ' Kz';
}

function gerarLinhasTabelaFuncionarios() {
  let linhas = '';
  for (let classe in funcionarios) {
    const total = funcionarios[classe].homens + funcionarios[classe].mulheres;
    if (total > 0) {
      linhas += `
        <tr>
          <td><strong>Classe ${classe.toUpperCase()}</strong></td>
          <td>${funcionarios[classe].homens}</td>
          <td>${funcionarios[classe].mulheres}</td>
          <td>${formatarMoeda(funcionarios[classe].salario)} Kz</td>
          <td>${formatarMoeda(total * funcionarios[classe].salario)} Kz</td>
          <td>+${funcionarios[classe].produtividade * 100}%</td>
        </tr>
      `;
    }
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

function contratarFuncionarios() {
    const classe = document.getElementById('classe-contratar').value;
    const homens = parseInt(document.getElementById('homens-contratar').value) || 0;
    const mulheres = parseInt(document.getElementById('mulheres-contratar').value) || 0;
    const total = homens + mulheres;
    
    if (total === 0) {
        notificar('❌ Selecione pelo menos 1 funcionário');
        return;
    }
    
    // Verificar limite
    const totalAtual = calcularTotalFuncionarios();
    if (totalAtual + total > estadoJogo.maxFuncionarios) {
        notificar(`❌ Limite máximo de ${estadoJogo.maxFuncionarios} funcionários atingido`);
        return;
    }
    
    // Calcular custo (primeiro mês de salário)
    const salarioTotal = total * funcionarios[classe].salario;
    
    if (estadoJogo.carteiraKz < salarioTotal) {
        notificar('❌ Saldo insuficiente para pagar o primeiro mês');
        return;
    }
    
    // Confirmar
    if (!confirm(`Confirmar contratação?
        \nClasse: ${classe}
        \nHomens: ${homens}
        \nMulheres: ${mulheres}
        \nTotal: ${total} funcionários
        \nSalário mensal: ${formatarMoeda(salarioTotal)} Kz
        \nINSS mensal: ${formatarMoeda(salarioTotal * 0.11)} Kz`)) {
        return;
    }
    
    // Contratar
    funcionarios[classe].homens += homens;
    funcionarios[classe].mulheres += mulheres;
    
    // Debitar custo (primeiro mês)
    estadoJogo.carteiraKz -= salarioTotal;
    estadoJogo.custosMes += salarioTotal;
    contadoresMensais.custos.salarios += salarioTotal;
    
    // Registrar transação
    registrarTransacao('rh', 'saida', salarioTotal, 'Kz', 
        `Contratação de ${total} funcionários classe ${classe} (1º mês)`);
    
    notificar(`✅ ${total} funcionários classe ${classe} contratados!`);
    
    salvarEstadoSimulacao();
    mostrarRH();
    atualizarCarteiras();
    atualizarDashboard();
}

function demitirFuncionarios() {
    const classe = document.getElementById('classe-demitir').value;
    const quantidade = parseInt(document.getElementById('quantidade-demitir').value);
    
    if (quantidade <= 0) {
        notificar('❌ Quantidade inválida');
        return;
    }
    
    const disponiveis = funcionarios[classe].homens + funcionarios[classe].mulheres;
    if (quantidade > disponiveis) {
        notificar('❌ Não há funcionários suficientes nesta classe');
        return;
    }
    
    // Calcular indemnização (4 salários)
    const indemnizacao = quantidade * funcionarios[classe].salario * 4;
    
    if (estadoJogo.carteiraKz < indemnizacao) {
        notificar('❌ Não podes demitir sem pagar a indemnização total');
        return;
    }
    
    // Confirmar
    if (!confirm(`Confirmar demissão?
        \nClasse: ${classe}
        \nQuantidade: ${quantidade}
        \nIndemnização: ${formatarMoeda(indemnizacao)} Kz
        \n(4 salários por funcionário)`)) {
        return;
    }
    
    // Demitir (distribuir proporcionalmente)
    const proporcaoHomens = funcionarios[classe].homens / disponiveis;
    const demitirHomens = Math.floor(quantidade * proporcaoHomens);
    const demitirMulheres = quantidade - demitirHomens;
    
    funcionarios[classe].homens -= demitirHomens;
    funcionarios[classe].mulheres -= demitirMulheres;
    
    // Pagar indemnização
    estadoJogo.carteiraKz -= indemnizacao;
    estadoJogo.custosMes += indemnizacao;
    
    registrarTransacao('rh', 'saida', indemnizacao, 'Kz', 
        `Demissão de ${quantidade} funcionários classe ${classe} (indemnização)`);
    
    notificar(`✅ ${quantidade} funcionários demitidos. Indemnização: ${formatarMoeda(indemnizacao)} Kz`);
    
    salvarEstadoSimulacao();
    mostrarRH();
    atualizarCarteiras();
    atualizarDashboard();
}

function pagarSalarios() {
    verificarPagamentosMes();
    
    if (pagamentosMes.salariosPagos) {
        notificar('⚠️ Salários já foram pagos este mês! Próximo pagamento no mês seguinte.');
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
    contadoresMensais.custos.salarios += totalSalarios;
    
    pagamentosMes.salariosPagos = true;
    
    registrarTransacao('rh', 'saida', totalSalarios, 'Kz', 'Pagamento de salários');
    
    notificar(`✅ Salários pagos: ${formatarMoeda(totalSalarios)} Kz`);
    
    salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarRH(); // Recarregar para atualizar status
}

function pagarSegurancaSocial() {
    verificarPagamentosMes();
    
    if (pagamentosMes.inssPago) {
        notificar('⚠️ INSS já foi pago este mês! Próximo pagamento no mês seguinte.');
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
    contadoresMensais.custos.segurancaSocial += segSocial;
    
    pagamentosMes.inssPago = true;
    
    registrarTransacao('rh', 'saida', segSocial, 'Kz', 'Pagamento Segurança Social (INSS)');
    
    notificar(`✅ INSS pago: ${formatarMoeda(segSocial)} Kz`);
    
    salvarEstadoSimulacao();
    atualizarCarteiras();
    mostrarRH(); // Recarregar para atualizar status
}

// ProcessarMes para resetar pagamentos
const originalProcessarMes = processarMes;
processarMes = function() {
    // Chamar função original
    if (originalProcessarMes) originalProcessarMes();
    
    // Resetar pagamentos para o novo mês
    pagamentosMes = {
        salariosPagos: false,
        inssPago: false,
        mesReferencia: dataSimulador.getMonth(),
        anoReferencia: dataSimulador.getFullYear()
    };
};

function fazerFormacao() {
  const custo = 3500000;
  
  if (estadoJogo.carteiraKz < custo) {
    notificar('Saldo insuficiente para formação');
    return;
  }
  
  estadoJogo.carteiraKz -= custo;
  estadoJogo.custosMes += custo;
  
  // Aumentar produtividade do mês (será aplicado nas vendas)
  estadoJogo.bonusProdutividade = 0.05;
  
  registrarTransacao('rh', 'saida', custo, 'Kz', 'Formação da equipa');
  
  notificar('Formação realizada! +5% produtividade neste mês');
  atualizarCarteiras();
  salvarEstadoSimulacao();
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
          <input type="number" id="valor-credito-kz" placeholder="Valor desejado">
          <select id="prazo-credito-kz">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <button onclick="solicitarCreditoNacional()">Solicitar Crédito</button>
        </div>
        
        <div class="campanha-card">
          <h4>Crédito Internacional (USD)</h4>
          <p>Taxa de Juro: 30% ao ano</p>
          <input type="number" id="valor-credito-usd" placeholder="Valor desejado">
          <select id="prazo-credito-usd">
            <option value="0.5">6 meses</option>
            <option value="1">1 ano</option>
            <option value="3">3 anos</option>
            <option value="8">8 anos</option>
          </select>
          <select id="pais-credito">
            <option value="eua">EUA</option>
            <option value="china">China</option>
            <option value="portugal">Portugal</option>
          </select>
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
              <th>Próx. Pagamento</th>
              <th>Vencimento</th>
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
    return '<tr><td colspan="7" style="text-align: center;">Nenhum crédito ativo</td></tr>';
  }
  
  return emprestimos.map(credito => `
    <tr>
      <td>${credito.tipo === 'nacional' ? '🇦🇴 Nacional' : '🌍 Internacional'}</td>
      <td>${credito.moeda === 'Kz' ? formatarMoeda(credito.valor) + ' Kz' : formatarMoeda(credito.valor, 'USD') + ' USD'}</td>
      <td>${credito.prazo} ano(s)</td>
      <td>${formatarMoeda(credito.jurosTotais)} ${credito.moeda}</td>
      <td>${credito.proximoPagamento || '-'}</td>
      <td>${credito.dataVencimento}</td>
      <td><span class="text-success">${credito.status}</span></td>
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
  
  // Verificar condição 65%
  const garantiaNecessaria = valor * 0.65;
  if (estadoJogo.carteiraKz < garantiaNecessaria) {
    notificar('Crédito rejeitado: precisa de 65% do valor em saldo');
    return;
  }
  
  // Calcular juros
  const taxaJuros = 0.195; // 19.5% ao ano
  const jurosTotais = valor * taxaJuros * prazo;
  
  // Criar crédito
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
    status: 'ativo',
    proximoPagamento: calcularProximoPagamentoJuros()
  };
  
  // Bloquear garantia
  estadoJogo.carteiraKz -= garantiaNecessaria;
  estadoJogo.garantiasKz += garantiaNecessaria;
  
  // Adicionar valor à carteira
  estadoJogo.carteiraKz += valor;
  
  // Registrar
  emprestimos.push(credito);
  registrarTransacao('credito', 'entrada', valor, 'Kz', `Crédito de ${formatarMoeda(valor)} Kz`);
  
  notificar(`✅ Crédito de ${formatarMoeda(valor)} Kz concedido!`);
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
  
  // Verificar condição 85% em USD
  const garantiaNecessaria = valor * 0.85;
  if (estadoJogo.carteiraUsd < garantiaNecessaria) {
    notificar('Crédito rejeitado: precisa de 85% do valor em reservas USD');
    return;
  }
  
  // Calcular juros
  const taxaJuros = 0.30; // 30% ao ano
  const jurosTotais = valor * taxaJuros * prazo;
  
  // Criar crédito
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
    status: 'ativo',
    proximoPagamento: calcularProximoPagamentoJuros()
  };
  
  // Bloquear garantia
  estadoJogo.carteiraUsd -= garantiaNecessaria;
  estadoJogo.garantiasUsd += garantiaNecessaria;
  
  // Adicionar valor à carteira
  estadoJogo.carteiraUsd += valor;
  
  // Registrar
  emprestimos.push(credito);
  registrarTransacao('credito', 'entrada', valor, 'USD', `Crédito de ${formatarMoeda(valor, 'USD')} USD`);
  
  notificar(`✅ Crédito de ${formatarMoeda(valor, 'USD')} USD concedido!`);
  salvarEstadoSimulacao();
  mostrarFinanceiro();
  atualizarCarteiras();
}

function calcularProximoPagamentoJuros() {
  const hoje = dataSimulador;
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  
  // Pagamentos em 1 de Junho e 1 de Dezembro
  if (mes < 5) { // Antes de Junho
    return `01/06/${ano}`;
  } else if (mes < 11) { // Antes de Dezembro
    return `01/12/${ano}`;
  } else {
    return `01/06/${ano + 1}`;
  }
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
          <input type="number" id="quantidade-usd-comprar" min="1" placeholder="Quantidade USD">
          <p>Total a pagar: <span id="total-pagar-comprar">0</span> Kz</p>
          <button onclick="comprarUSD()">Comprar USD</button>
        </div>
        
        <div class="campanha-card">
          <h4>Vender USD</h4>
          <p>Taxa de Câmbio Atual: 1 USD = ${formatarMoeda(taxaCambio)} Kz</p>
          <input type="number" id="quantidade-usd-vender" min="1" placeholder="Quantidade USD">
          <p>Total a receber: <span id="total-receber-vender">0</span> Kz</p>
          <button onclick="venderUSD()">Vender USD</button>
        </div>
      </div>
      
      <div class="clientes-stats" style="margin-top: 20px;">
        <div class="stat">Saldo Kz: ${formatarMoeda(estadoJogo.carteiraKz)}</div>
        <div class="stat">Saldo USD: ${formatarMoeda(estadoJogo.carteiraUsd, 'USD')}</div>
        <div class="stat">Taxa Câmbio: ${formatarMoeda(taxaCambio)}</div>
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
  
  // Adicionar listeners para calcular automaticamente
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
  // Variação aleatória entre -20% e +20%
  const variacao = (Math.random() * 40) - 20; // -20% a +20%
  const fator = 1 + (variacao / 100);
  taxaCambio = Math.round(taxaCambio * fator);
  
  // Limites
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
  
  // Ações Angolanas
  html += '<h3>🇦🇴 Ações Angolanas (Kz)</h3>';
  html += '<div class="tabela-container">';
  html += '<table>';
  html += '<thead><tr><th>Ação</th><th>Preço Atual</th><th>Variação</th><th>Quantidade</th><th>Ações</th></tr></thead>';
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
          <td>
            <button class="btn-comprar" onclick="comprarAcao('${acaoId}')">Comprar</button>
            ${acao.quantidade > 0 ? `<button class="btn-vender" onclick="venderAcao('${acaoId}')">Vender</button>` : ''}
          </td>
        </tr>
      `;
    }
  }
  
  html += '</tbody></table></div>';
  
  // Ações Internacionais
  html += '<h3 style="margin-top: 30px;">🌍 Ações Internacionais (USD)</h3>';
  html += '<div class="tabela-container">';
  html += '<table>';
  html += '<thead><tr><th>Ação</th><th>Preço Atual</th><th>Variação</th><th>Quantidade</th><th>Ações</th></tr></thead>';
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
  // Atualizar preços das ações a cada 10 segundos
  setInterval(() => {
    for (let acaoId in investimentos.acoes) {
      const acao = investimentos.acoes[acaoId];
      
      // Variação aleatória
      let variacao;
      if (acao.moeda === 'Kz') {
        // Ações angolanas: -100% a +1000%
        variacao = (Math.random() * 1100) - 100;
      } else {
        // Ações internacionais: -40% a +1000%
        variacao = (Math.random() * 1040) - 40;
      }
      
      const fator = 1 + (variacao / 100);
      acao.precoAtual = Math.round(acao.precoBase * fator);
    }
    
    // Se estiver na view de ações, atualizar
    if (document.getElementById('investimentos-conteudo')) {
      mostrarAcoes();
    }
  }, 10000);
}

function comprarAcao(acaoId) {
  const acao = investimentos.acoes[acaoId];
  const quantidade = parseInt(prompt(`Quantas ações ${acao.nome} deseja comprar?`));
  
  if (!quantidade || quantidade <= 0) {
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
  
  registrarTransacao('investimento', 'saida', custoTotal, acao.moeda, `Compra de ${quantidade} ações ${acao.nome}`);
  
  notificar(`Compra de ${quantidade} ações ${acao.nome} realizada!`);
  salvarEstadoSimulacao();
  mostrarAcoes();
  atualizarCarteiras();
}

function venderAcao(acaoId) {
  const acao = investimentos.acoes[acaoId];
  const quantidade = parseInt(prompt(`Quantas ações ${acao.nome} deseja vender?`));
  
  if (!quantidade || quantidade <= 0 || quantidade > acao.quantidade) {
    notificar('Quantidade inválida');
    return;
  }
  
  const valorTotal = acao.precoAtual * quantidade;
  
  if (acao.moeda === 'Kz') {
    estadoJogo.carteiraKz += valorTotal;
  } else {
    estadoJogo.carteiraUsd += valorTotal;
  }
  
  acao.quantidade -= quantidade;
  
  registrarTransacao('investimento', 'entrada', valorTotal, acao.moeda, `Venda de ${quantidade} ações ${acao.nome}`);
  
  notificar(`Venda de ${quantidade} ações ${acao.nome} realizada!`);
  salvarEstadoSimulacao();
  mostrarAcoes();
  atualizarCarteiras();
}

function mostrarAcoes() {
  document.getElementById('investimentos-conteudo').innerHTML = gerarAcoesHTML();
  
  // Atualizar tabs
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
          <input type="number" id="qtd-propriedade-a" min="1" value="1">
          <button onclick="comprarPropriedade('angola', 'A')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo B</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoB)} Kz</p>
          <input type="number" id="qtd-propriedade-b" min="1" value="1">
          <button onclick="comprarPropriedade('angola', 'B')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo C</h4>
          <p>Preço: ${formatarMoeda(investimentos.propriedades.angola.tipoC)} Kz</p>
          <input type="number" id="qtd-propriedade-c" min="1" value="1">
          <button onclick="comprarPropriedade('angola', 'C')">Comprar</button>
        </div>
      </div>
      
      <h3 style="margin-top: 30px;">🌍 Propriedades Internacionais (USD)</h3>
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h4>Tipo A</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoA, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-a" min="1" value="1">
          <button onclick="comprarPropriedade('internacional', 'A')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo B</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoB, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-b" min="1" value="1">
          <button onclick="comprarPropriedade('internacional', 'B')">Comprar</button>
        </div>
        <div class="campanha-card">
          <h4>Tipo C</h4>
          <p>Preço: USD ${formatarMoeda(investimentos.propriedades.internacional.tipoC, 'USD')}</p>
          <input type="number" id="qtd-propriedade-int-c" min="1" value="1">
          <button onclick="comprarPropriedade('internacional', 'C')">Comprar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('investimentos-conteudo').innerHTML = html;
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
  
  registrarTransacao('investimento', 'saida', preco * quantidade, moeda, `Compra de ${quantidade} propriedade(s) Tipo ${tipo} ${local === 'angola' ? '🇦🇴' : '🌍'}`);
  
  notificar(`Compra de propriedade(s) realizada!`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
}

function atualizarPrecosPropriedades() {
  // Variação de -80% a +200%
  for (let tipo in investimentos.propriedades.angola) {
    const variacao = (Math.random() * 280) - 80; // -80% a +200%
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
  document.getElementById('investimentos-conteudo').innerHTML = '<p>Funcionalidade de Depósitos a Prazo em desenvolvimento</p>';
}

function mostrarTitulos() {
  document.getElementById('investimentos-conteudo').innerHTML = '<p>Funcionalidade de Títulos Públicos em desenvolvimento</p>';
}

// ============================================
// DEPÓSITOS A PRAZO
// ============================================

let depositosPrazo = [];

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
                    <input type="number" id="valor-deposito-3m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)">
                    <p class="text-gold">Rendimento: <span id="rendimento-3m">0</span> Kz</p>
                    <button onclick="criarDeposito(3)">📥 Aplicar</button>
                </div>
                
                <div class="campanha-card">
                    <h4>6 Meses</h4>
                    <p>Taxa: 4% (total)</p>
                    <input type="number" id="valor-deposito-6m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)">
                    <p class="text-gold">Rendimento: <span id="rendimento-6m">0</span> Kz</p>
                    <button onclick="criarDeposito(6)">📥 Aplicar</button>
                </div>
                
                <div class="campanha-card">
                    <h4>12 Meses</h4>
                    <p>Taxa: 8% (total)</p>
                    <input type="number" id="valor-deposito-12m" min="100000" step="10000" placeholder="Valor (mín. 100k Kz)">
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
                            <th>Taxa</th>
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
    
    // Adicionar listeners
    document.getElementById('valor-deposito-3m')?.addEventListener('input', () => calcularRendimento(3));
    document.getElementById('valor-deposito-6m')?.addEventListener('input', () => calcularRendimento(6));
    document.getElementById('valor-deposito-12m')?.addEventListener('input', () => calcularRendimento(12));
}

function calcularRendimento(meses) {
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
        status: 'ativo',
        resgatado: false
    };
    
    // Debitar valor
    estadoJogo.carteiraKz -= valor;
    depositosPrazo.push(deposito);
    
    registrarTransacao('deposito', 'saida', valor, 'Kz', 
        `Depósito a prazo de ${formatarMoeda(valor)} Kz (${meses} meses)`);
    
    notificar(`✅ Depósito de ${formatarMoeda(valor)} Kz realizado! Vencimento: ${deposito.dataVencimento}`);
    
    salvarEstadoSimulacao();
    mostrarDepositos();
    atualizarCarteiras();
}

function gerarDepositosAtivos() {
    if (depositosPrazo.length === 0) {
        return '<tr><td colspan="8" style="text-align: center;">Nenhum depósito ativo</td></tr>';
    }
    
    return depositosPrazo.filter(d => d.status === 'ativo').map(d => {
        const diasRestantes = calcularDiasRestantes(d.dataVencimento);
        
        return `
            <tr>
                <td>${formatarMoeda(d.valor)} Kz</td>
                <td>${d.prazoMeses} meses</td>
                <td>${(d.taxa * 100).toFixed(1)}%</td>
                <td class="text-success">+${formatarMoeda(d.rendimento)} Kz</td>
                <td>${d.dataAplicacao}</td>
                <td>${d.dataVencimento}</td>
                <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
                <td>
                    ${diasRestantes <= 0 ? 
                        `<button onclick="resgatarDeposito(${d.id})">Resgatar</button>` : 
                        `<button onclick="resgatarAntecipado(${d.id})" class="btn-danger">Resgatar (com multa)</button>`}
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
    
    registrarTransacao('deposito', 'entrada', valorTotal, 'Kz', 
        `Resgate de depósito + rendimentos`);
    
    notificar(`💰 Depósito resgatado: ${formatarMoeda(valorTotal)} Kz`);
    
    salvarEstadoSimulacao();
    mostrarDepositos();
    atualizarCarteiras();
}

function resgatarAntecipado(id) {
    const deposito = depositosPrazo.find(d => d.id === id);
    if (!deposito) return;
    
    if (!confirm('Resgate antecipado perde 50% dos juros. Confirmar?')) return;
    
    const rendimentoReduzido = deposito.rendimento * 0.5;
    const valorTotal = deposito.valor + rendimentoReduzido;
    
    estadoJogo.carteiraKz += valorTotal;
    deposito.status = 'resgatado_antecipado';
    
    registrarTransacao('deposito', 'entrada', valorTotal, 'Kz', 
        `Resgate antecipado de depósito (com multa)`);
    
    notificar(`💰 Depósito resgatado antecipadamente: ${formatarMoeda(valorTotal)} Kz`);
    
    salvarEstadoSimulacao();
    mostrarDepositos();
    atualizarCarteiras();
}

// ============================================
// TÍTULOS PÚBLICOS
// ============================================

let titulosPublicos = [];

function mostrarTitulos() {
    // Dados do BNA para títulos
    const titulosDisponiveis = [
        {
            id: 'ot-1ano',
            nome: 'Obrigações do Tesouro 1 ano',
            prazo: 12,
            taxa: 0.12, // 12% ao ano
            risco: 'baixo',
            minimo: 1000000
        },
        {
            id: 'ot-3anos',
            nome: 'Obrigações do Tesouro 3 anos',
            prazo: 36,
            taxa: 0.15, // 15% ao ano
            risco: 'baixo',
            minimo: 5000000
        },
        {
            id: 'bt-6meses',
            nome: 'Bilhetes do Tesouro 6 meses',
            prazo: 6,
            taxa: 0.09, // 9% ao ano (4.5% no período)
            risco: 'baixo',
            minimo: 500000
        }
    ];
    
    const html = `
        <div class="titulos-container">
            <h3>📜 Títulos Públicos (BNA)</h3>
            
            <div class="info-box">
                <p>🏛️ Emitidos pelo Banco Nacional de Angola</p>
                <p>🛡️ Risco: Baixo (garantidos pelo Estado)</p>
                <p>💰 Rendimento isento de imposto de selo</p>
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
                               placeholder="Valor (mín. ${formatarMoeda(t.minimo)})">
                        
                        <p class="text-gold">Rendimento: <span id="rendimento-${t.id}">0</span> Kz</p>
                        
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
                            <th>Rendimento</th>
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
    
    // Adicionar listeners
    titulosDisponiveis.forEach(t => {
        document.getElementById(`valor-titulo-${t.id}`)?.addEventListener('input', 
            () => calcularRendimentoTitulo(t.id, t.taxa, t.prazo));
    });
}

function calcularRendimentoTitulo(tituloId, taxaAnual, prazoMeses) {
    const input = document.getElementById(`valor-titulo-${tituloId}`);
    const valor = parseFloat(input?.value) || 0;
    const rendSpan = document.getElementById(`rendimento-${tituloId}`);
    
    if (valor <= 0) {
        rendSpan.textContent = '0';
        return;
    }
    
    // Rendimento proporcional ao prazo
    const rendimento = valor * taxaAnual * (prazoMeses / 12);
    rendSpan.textContent = formatarMoeda(rendimento);
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
    
    const rendimento = valor * taxaAnual * (prazoMeses / 12);
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
        rendimento: rendimento,
        dataCompra: dataSimulador.toLocaleDateString(),
        dataVencimento: dataVencimento.toLocaleDateString(),
        status: 'ativo'
    };
    
    estadoJogo.carteiraKz -= valor;
    titulosPublicos.push(titulo);
    
    registrarTransacao('titulo', 'saida', valor, 'Kz', 
        `Compra de ${titulo.nome} - ${formatarMoeda(valor)} Kz`);
    
    notificar(`✅ Título adquirido! Vencimento: ${titulo.dataVencimento}`);
    
    salvarEstadoSimulacao();
    mostrarTitulos();
    atualizarCarteiras();
}

function gerarTitulosAtivos() {
    const ativos = titulosPublicos.filter(t => t.status === 'ativo');
    
    if (ativos.length === 0) {
        return '<tr><td colspan="8" style="text-align: center;">Nenhum título em carteira</td></tr>';
    }
    
    return ativos.map(t => {
        const diasRestantes = calcularDiasRestantes(t.dataVencimento);
        
        return `
            <tr>
                <td>${t.nome}</td>
                <td>${formatarMoeda(t.valor)} Kz</td>
                <td>${t.prazoMeses} meses</td>
                <td class="text-success">+${formatarMoeda(t.rendimento)} Kz</td>
                <td>${t.dataCompra}</td>
                <td>${t.dataVencimento}</td>
                <td>${diasRestantes > 0 ? `⏳ ${diasRestantes} dias` : '✅ Vencido'}</td>
                <td>
                    ${diasRestantes <= 0 ? 
                        `<button onclick="resgatarTitulo(${t.id})">Resgatar</button>` : 
                        '⏳ Aguardar vencimento'}
                </td>
            </tr>
        `;
    }).join('');
}

function resgatarTitulo(id) {
    const titulo = titulosPublicos.find(t => t.id === id);
    if (!titulo) return;
    
    const valorTotal = titulo.valor + titulo.rendimento;
    estadoJogo.carteiraKz += valorTotal;
    titulo.status = 'resgatado';
    
    registrarTransacao('titulo', 'entrada', valorTotal, 'Kz', 
        `Resgate de título + rendimentos`);
    
    notificar(`💰 Título resgatado: ${formatarMoeda(valorTotal)} Kz`);
    
    salvarEstadoSimulacao();
    mostrarTitulos();
    atualizarCarteiras();
}

// Adicionar link para câmbio no menu financeiro
function mostrarFinanceiroCompleto() {
    const html = `
        <div class="financeiro-container">
            <h2>💰 Gestão Financeira</h2>
            
            <div class="tabs-container">
                <button class="tab-btn" onclick="mostrarCreditos()">Créditos</button>
                <button class="tab-btn" onclick="mostrarDepositos()">Depósitos</button>
                <button class="tab-btn" onclick="mostrarTitulos()">Títulos Públicos</button>
                <button class="tab-btn active" onclick="mostrarCambio()">Câmbio</button>
            </div>
            
            <div id="financeiro-conteudo">
                ${gerarCambioHTML()}
            </div>
        </div>
    `;
    
    document.getElementById('conteudoPrincipal').innerHTML = html;
}

// Atualizar a função mostrarFinanceiro para usar a nova versão
mostrarFinanceiro = mostrarFinanceiroCompleto;


// ============================================
// MÓDULO FORNECEDORES E ESTOQUE
// ============================================

let producoesServico = [];

function mostrarFornecedores() {
  const html = `
    <div class="fornecedores-container">
      <h2>📦 Fornecedores</h2>
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarFornecedoresNacionais()">Nacionais (Kz)</button>
        <button class="tab-btn" onclick="mostrarFornecedoresInternacionais()">Internacionais (USD)</button>
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
        <input type="number" id="preco-produto-a" placeholder="Preço unitário (Kz)">
        <input type="number" id="quantidade-produto-a" min="100" placeholder="Quantidade (mín. 100)">
        <p class="text-gold" id="total-pagar-a">Total: 0 Kz</p>
        <button onclick="comprarNacional('A')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Nacional Classe B</h4>
        <p>⏱️ Entrega: 7 dias</p>
        <p>📦 Mínimo: 40 unidades</p>
        <input type="number" id="preco-produto-b" placeholder="Preço unitário (Kz)">
        <input type="number" id="quantidade-produto-b" min="40" placeholder="Quantidade (mín. 40)">
        <p class="text-gold" id="total-pagar-b">Total: 0 Kz</p>
        <button onclick="comprarNacional('B')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Nacional Classe C</h4>
        <p>⏱️ Entrega: 15 dias</p>
        <p>📦 Mínimo: 10 unidades</p>
        <input type="number" id="preco-produto-c" placeholder="Preço unitário (Kz)">
        <input type="number" id="quantidade-produto-c" min="10" placeholder="Quantidade (mín. 10)">
        <p class="text-gold" id="total-pagar-c">Total: 0 Kz</p>
        <button onclick="comprarNacional('C')">Comprar</button>
      </div>
    </div>
  `;
}

function mostrarFornecedoresNacionais() {
  document.getElementById('fornecedores-conteudo').innerHTML = gerarFornecedoresNacionaisHTML();
  
  // Atualizar tabs
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function mostrarFornecedoresInternacionais() {
  const html = `
    <div class="fornecedores-grid">
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe A</h4>
        <p>⏱️ Entrega: 7 dias</p>
        <p>📦 Mínimo: 50 unidades</p>
        <select id="pais-importacao-a">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-a" placeholder="Preço unitário (USD)">
        <input type="number" id="quantidade-produto-int-a" min="50" placeholder="Quantidade (mín. 50)">
        <p class="text-gold" id="total-pagar-int-a">Total: 0 USD</p>
        <button onclick="comprarInternacional('A')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe B</h4>
        <p>⏱️ Entrega: 30 dias</p>
        <p>📦 Mínimo: 20 unidades</p>
        <select id="pais-importacao-b">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-b" placeholder="Preço unitário (USD)">
        <input type="number" id="quantidade-produto-int-b" min="20" placeholder="Quantidade (mín. 20)">
        <p class="text-gold" id="total-pagar-int-b">Total: 0 USD</p>
        <button onclick="comprarInternacional('B')">Comprar</button>
      </div>
      
      <div class="fornecedor-card">
        <h4>Fornecedor Internacional Classe C</h4>
        <p>⏱️ Entrega: 90 dias</p>
        <p>📦 Mínimo: 5 unidades</p>
        <select id="pais-importacao-c">
          <option value="china">🇨🇳 China</option>
          <option value="portugal">🇵🇹 Portugal</option>
          <option value="eua">🇺🇸 EUA</option>
          <option value="brasil">🇧🇷 Brasil</option>
        </select>
        <input type="number" id="preco-produto-int-c" placeholder="Preço unitário (USD)">
        <input type="number" id="quantidade-produto-int-c" min="5" placeholder="Quantidade (mín. 5)">
        <p class="text-gold" id="total-pagar-int-c">Total: 0 USD</p>
        <button onclick="comprarInternacional('C')">Comprar</button>
      </div>
    </div>
  `;
  
  document.getElementById('fornecedores-conteudo').innerHTML = html;
  
  // Atualizar tabs
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
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
  
  // Debitar
  estadoJogo.carteiraKz -= total;
  estadoJogo.custosMes += total;
  
  // Adicionar à entrega pendente
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
  
  // Verificar relação diplomática
  const relacao = dadosMundo?.relacoesDiplomaticas?.[pais] || 'normal';
  let diasEntrega = fornecedores.internacional[classe].prazo;
  
  if (relacao === 'ruim') {
    diasEntrega += 90;
  } else if (relacao === 'normal') {
    diasEntrega += 30;
  }
  
  // Debitar
  estadoJogo.carteiraUsd -= total;
  
  // Adicionar à entrega pendente
  const dataEntrega = new Date(dataSimulador);
  dataEntrega.setDate(dataEntrega.getDate() + diasEntrega);
  
  entregasPendentes.push({
    id: Date.now(),
    tipo: 'produto',
    classe: `Internacional ${classe} (${pais})`,
    quantidade,
    precoUnitario: preco,
    total,
    dataEntrega: dataEntrega.toLocaleDateString(),
    diasRestantes: diasEntrega
  });
  
  registrarTransacao('importacao', 'saida', total, 'USD', `Importação de ${quantidade} unidades de ${pais}`);
  
  notificar(`Importação realizada! Entrega em ${diasEntrega} dias`);
  salvarEstadoSimulacao();
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
            <input type="number" id="margem-${item.id}" min="0" max="30" placeholder="Margem 0-30%">
            <button onclick="definirMargem(${item.id})">Definir</button>
          ` : `
            <button onclick="venderProduto(${item.id})">Vender</button>
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
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Fornecedor</th><th>Quantidade</th><th>Total</th><th>Data Entrega</th><th>Status</th></tr></thead><tbody>';
  
  entregasPendentes.forEach(entrega => {
    const diasRestantes = calcularDiasRestantes(entrega.dataEntrega);
    html += `
      <tr>
        <td>${entrega.classe}</td>
        <td>${entrega.quantidade}</td>
        <td>${entrega.moeda === 'USD' ? formatarMoeda(entrega.total, 'USD') + ' USD' : formatarMoeda(entrega.total) + ' Kz'}</td>
        <td>${entrega.dataEntrega}</td>
        <td>${diasRestantes <= 0 ? '✅ Entregue' : `⏳ ${diasRestantes} dias`}</td>
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
      // Adicionar ao estoque
      estoque.push({
        id: Date.now(),
        nome: 'Produto',
        quantidade: entrega.quantidade,
        custoUnitario: entrega.precoUnitario,
        precoVenda: null,
        margem: null,
        dataEntrada: hoje
      });
      
      notificar(`📦 Entrega recebida: ${entrega.quantidade} unidades`);
      return false; // Remove da lista de pendentes
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
    notificar('Margem definida! Produto pronto para venda');
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
}

function mostrarEntregasPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = gerarEntregasPendentesHTML();
}

function mostrarProducoesPendentes() {
  document.getElementById('estoque-conteudo').innerHTML = '<p>Funcionalidade de produção em desenvolvimento</p>';
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
          <input type="number" id="qtd-digital" min="1" value="1" placeholder="Quantidade de lotes">
          <p class="text-gold" id="total-digital">Total: 50.000 Kz</p>
          <button onclick="investirMarketing('digital')">Investir</button>
        </div>
        
        <div class="campanha-card">
          <h3>📰 Marketing Tradicional</h3>
          <p>Alcance: 30 pessoas / 10.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-tradicional" min="1" value="1" placeholder="Quantidade de lotes">
          <p class="text-gold" id="total-tradicional">Total: 10.000 Kz</p>
          <button onclick="investirMarketing('tradicional')">Investir</button>
        </div>
        
        <div class="campanha-card">
          <h3>🌍 Marketing Internacional</h3>
          <p>Alcance: 50 pessoas / 100.000 Kz</p>
          <p>Fidelização: 2% dos alcançados</p>
          <input type="number" id="qtd-internacional" min="1" value="1" placeholder="Quantidade de lotes">
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
}

function investirMarketing(tipo) {
  let alcancePorLote, custoPorLote, qtd;
  
  switch(tipo) {
    case 'digital':
      qtd = parseInt(document.getElementById('qtd-digital').value) || 1;
      alcancePorLote = 100;
      custoPorLote = 50000;
      break;
    case 'tradicional':
      qtd = parseInt(document.getElementById('qtd-tradicional').value) || 1;
      alcancePorLote = 30;
      custoPorLote = 10000;
      break;
    case 'internacional':
      qtd = parseInt(document.getElementById('qtd-internacional').value) || 1;
      alcancePorLote = 50;
      custoPorLote = 100000;
      break;
  }
  
  const custoTotal = custoPorLote * qtd;
  const alcanceTotal = alcancePorLote * qtd;
  
  if (estadoJogo.carteiraKz < custoTotal) {
    notificar('Saldo insuficiente');
    return;
  }
  
  // Debitar
  estadoJogo.carteiraKz -= custoTotal;
  estadoJogo.custosMes += custoTotal;
  
  // Calcular clientes fidelizados (2%)
  const novosClientes = Math.floor(alcanceTotal * 0.02);
  
  if (tipo === 'internacional') {
    clientes.estrangeiros += novosClientes;
  } else {
    clientes.nacionais += novosClientes;
  }
  
  // Registrar
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

function processarVendasDiarias() {
  // Vendas baseadas no número de clientes
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  
  if (totalClientes === 0) return;
  
  // Produtos disponíveis para venda
  const produtosVenda = estoque.filter(item => item.status === 'venda' && item.quantidade > 0);
  
  if (produtosVenda.length === 0) return;
  
  // Calcular vendas do dia (10 unidades base + clientes/100)
  const vendasBase = 10;
  const vendasAdicionais = Math.floor(totalClientes / 100);
  const totalVendasDia = Math.min(vendasBase + vendasAdicionais, produtosVenda.reduce((sum, p) => sum + p.quantidade, 0));
  
  if (totalVendasDia <= 0) return;
  
  let vendasRealizadas = 0;
  let faturamentoDia = 0;
  
  // Distribuir vendas entre os produtos disponíveis
  for (let produto of produtosVenda) {
    if (vendasRealizadas >= totalVendasDia) break;
    
    const venderHoje = Math.min(produto.quantidade, Math.ceil(totalVendasDia / produtosVenda.length));
    if (venderHoje > 0) {
      produto.quantidade -= venderHoje;
      faturamentoDia += venderHoje * produto.precoVenda;
      vendasRealizadas += venderHoje;
    }
  }
  
  // Aplicar bônus de produtividade se houver
  if (estadoJogo.bonusProdutividade) {
    faturamentoDia *= (1 + estadoJogo.bonusProdutividade);
  }
  
  // Aplicar efeito da inflação
  if (inflacaoAtual > 15) {
    faturamentoDia *= (1 - inflacaoAtual / 100);
  }
  
  // Adicionar à carteira
  estadoJogo.carteiraKz += faturamentoDia;
  estadoJogo.faturamentoMes += faturamentoDia;
  
  // Registrar transação consolidada do dia
  registrarTransacao('venda', 'entrada', faturamentoDia, 'Kz', `Vendas do dia ${dataSimulador.toLocaleDateString()}`);
  
  // Limpar produtos com estoque zero
  estoque = estoque.filter(item => item.quantidade > 0);
  
  if (estoque.length === 0) {
    notificar('⚠️ Estoque vazio! Compre mais produtos.');
  }
}

// ============================================
// MÓDULO ESTRATÉGIA
// ============================================

function mostrarEstrategia() {
  const condicoes = verificarCondicoesExpansao();
  
  const html = `
    <div class="estrategia-container">
      <h2>🎯 Estratégia Empresarial</h2>
      
      <div class="campanhas-grid">
        <div class="campanha-card">
          <h3>🤝 Parcerias Estratégicas</h3>
          <p>Parceiro Tipo A: 350k clientes - +50M Kz</p>
          <p>Parceiro Tipo B: 20k clientes - +20M Kz</p>
          <p>Parceiro Tipo C: 2k clientes - +10M Kz</p>
          <p>Parceiro Tipo D: 500 clientes - +2M Kz</p>
          <select id="tipo-parceiro">
            <option value="A">Tipo A (350k clientes)</option>
            <option value="B">Tipo B (20k clientes)</option>
            <option value="C">Tipo C (2k clientes)</option>
            <option value="D">Tipo D (500 clientes)</option>
          </select>
          <button onclick="fecharParceria()">Fechar Parceria</button>
        </div>
        
        <div class="campanha-card">
          <h3>📈 Expansão da Empresa</h3>
          <p class="${condicoes.saldo ? 'text-success' : 'text-danger'}">✓ Saldo 3x inicial: ${condicoes.saldo ? '✅' : '❌'}</p>
          <p class="${condicoes.clientes ? 'text-success' : 'text-danger'}">✓ Clientes 5x original: ${condicoes.clientes ? '✅' : '❌'}</p>
          <p class="${condicoes.reservaUSD ? 'text-success' : 'text-danger'}">✓ Reserva USD ≥ 10.000: ${condicoes.reservaUSD ? '✅' : '❌'}</p>
          <p class="${condicoes.investimentos ? 'text-success' : 'text-danger'}">✓ Tem investimentos: ${condicoes.investimentos ? '✅' : '❌'}</p>
          <p class="${condicoes.lucro ? 'text-success' : 'text-danger'}">✓ Lucro acumulado ≥ 10M: ${condicoes.lucro ? '✅' : '❌'}</p>
          
          <button onclick="expandirEmpresa()" ${condicoes.todas ? '' : 'disabled'} class="btn-submit" style="margin-top: 15px;">
            Expandir Empresa
          </button>
        </div>
        
        <div class="campanha-card">
          <h3>🌍 Exportação</h3>
          ${estadoJogo.licencaExportacao ? 
            `<p class="text-success">✅ Licença ativa até: ${estadoJogo.licencaExpiracao}</p>` :
            `<p class="text-danger">❌ Sem licença de exportação</p>
             <p>Custo: 10.000.000 Kz</p>
             <button onclick="comprarLicencaExportacao()">Comprar Licença</button>`
          }
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('conteudoPrincipal').innerHTML = html;
}

function verificarCondicoesExpansao() {
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  const clientesIniciais = estadoJogo.clientesIniciais || 100;
  
  const condicoes = {
    saldo: estadoJogo.carteiraKz >= estadoJogo.saldoInicial * 3,
    clientes: totalClientes >= clientesIniciais * 5,
    reservaUSD: estadoJogo.carteiraUsd >= 10000,
    investimentos: Object.values(investimentos.acoes).some(a => a.quantidade > 0),
    lucro: calcularLucroAcumulado() >= 10000000
  };
  
  condicoes.todas = Object.values(condicoes).every(Boolean);
  return condicoes;
}

function calcularLucroAcumulado() {
  // Simplificado - pegar últimos 12 meses de lucro
  return historicoMensal.slice(-12).reduce((sum, mes) => sum + (mes.lucro || 0), 0);
}

function fecharParceria() {
  const tipo = document.getElementById('tipo-parceiro').value;
  const totalClientes = clientes.nacionais + clientes.estrangeiros;
  
  const requisitos = {
    A: 350000,
    B: 20000,
    C: 2000,
    D: 500
  };
  
  const valores = {
    A: 50000000,
    B: 20000000,
    C: 10000000,
    D: 2000000
  };
  
  if (totalClientes < requisitos[tipo]) {
    notificar(`❌ Precisa de ${requisitos[tipo]} clientes para parceria Tipo ${tipo}`);
    return;
  }
  
  // Adicionar valor à carteira
  estadoJogo.carteiraKz += valores[tipo];
  
  registrarTransacao('parceria', 'entrada', valores[tipo], 'Kz', `Parceria Tipo ${tipo}`);
  
  notificar(`✅ Parceria Tipo ${tipo} fechada! +${formatarMoeda(valores[tipo])} Kz`);
  salvarEstadoSimulacao();
  atualizarCarteiras();
}

function expandirEmpresa() {
  const condicoes = verificarCondicoesExpansao();
  
  if (!condicoes.todas) {
    notificar('❌ Não tens condições para expandir');
    return;
  }
  
  // Registrar expansão
  estadoJogo.nivelExpansao = (estadoJogo.nivelExpansao || 0) + 1;
  
  // Aumentar clientes baseado no nível
  if (estadoJogo.nivelExpansao === 1) {
    const novosClientes = Math.floor((clientes.nacionais + clientes.estrangeiros) * 0.05);
    clientes.nacionais += novosClientes;
    notificar(`✅ Expansão nível 1! +5% clientes (${novosClientes})`);
  } else if (estadoJogo.nivelExpansao === 2) {
    const novosClientes = Math.floor((clientes.nacionais + clientes.estrangeiros) * 0.20);
    clientes.nacionais += novosClientes;
    notificar(`✅ Expansão nível 2! +20% clientes (${novosClientes})`);
  } else if (estadoJogo.nivelExpansao === 3) {
    const novosClientes = Math.floor((clientes.nacionais + clientes.estrangeiros) * 0.50);
    clientes.nacionais += novosClientes;
    notificar(`✅ Expansão nível 3! +50% clientes (${novosClientes})`);
  }
  
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

// ============================================
// MÓDULO HISTÓRICO
// ============================================

function mostrarHistorico() {
  const html = `
    <div class="historico-container">
      <h2>📊 Históricos e Relatórios</h2>
      
      <div class="tabs-container">
        <button class="tab-btn active" onclick="mostrarHistoricoTransacoes()">Transações</button>
        <button class="tab-btn" onclick="mostrarHistoricoMensal()">Mensal</button>
        <button class="tab-btn" onclick="mostrarHistoricoAnual()">Anual</button>
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
  
  let html = '<div class="historico-lista">';
  
  historicoTransacoes.slice(0, 50).forEach(trans => {
    const classe = trans.operacao === 'entrada' ? 'entrada' : 'saida';
    html += `
      <div class="historico-item">
        <span>${trans.data}</span>
        <span>${trans.descricao}</span>
        <span class="${classe}">${trans.operacao === 'entrada' ? '+' : '-'}${formatarMoeda(trans.valor)}</span>
        <span>${trans.moeda}</span>
        <span>${trans.tipo}</span>
      </div>
    `;
  });
  
  html += '</div>';
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
    return '<p style="text-align: center; padding: 50px;">📭 Nenhum dado anual disponível</p>';
  }
  
  let html = '<div class="tabela-container"><table><thead><tr><th>Ano</th><th>Receita</th><th>Custos</th><th>Lucro Antes</th><th>Imposto</th><th>Lucro Líquido</th></tr></thead><tbody>';
  
  historicoAnual.slice(-10).forEach(ano => {
    const classe = ano.lucroLiquido >= 0 ? 'text-success' : 'text-danger';
    html += `
      <tr>
        <td>${ano.ano}</td>
        <td>${formatarMoeda(ano.receita)} Kz</td>
        <td>${formatarMoeda(ano.custos)} Kz</td>
        <td>${formatarMoeda(ano.lucroAntes)} Kz</td>
        <td>${formatarMoeda(ano.imposto)} Kz</td>
        <td class="${classe}">${formatarMoeda(ano.lucroLiquido)} Kz</td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  return html;
}

function mostrarHistoricoTransacoes() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoTransacoesHTML();
}

function mostrarHistoricoMensal() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoMensalHTML();
}

function mostrarHistoricoAnual() {
  document.getElementById('historico-conteudo').innerHTML = gerarHistoricoAnualHTML();
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
  
  // Manter apenas últimas 100
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
}

function registrarHistoricoMensal() {
  // Já feito no calcularFaturamentoMensal
}

function processarRelatorioAnual() {
  const ano = dataSimulador.getFullYear() - 1; // Ano anterior
  
  // Calcular totais do ano
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
  
  if (lucroAntes < 0) {
    notificar(`⚠️ Prejuízo no ano ${ano}: ${formatarMoeda(Math.abs(lucroAntes))} Kz`);
  }
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
    clientes,
    emprestimos,
    investimentos,
    estoque,
    entregasPendentes,
    historicoTransacoes: historicoTransacoes.slice(0, 50),
    historicoMensal,
    historicoAnual,
    taxaCambio,
    inflacaoAtual
  };
  
  localStorage.setItem('simuladorSave', JSON.stringify(estado));
  console.log('💾 Simulação salva:', new Date().toLocaleTimeString());
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
      clientes = estado.clientes;
      emprestimos = estado.emprestimos || [];
      investimentos = estado.investimentos;
      estoque = estado.estoque || [];
      entregasPendentes = estado.entregasPendentes || [];
      historicoTransacoes = estado.historicoTransacoes || [];
      historicoMensal = estado.historicoMensal || [];
      historicoAnual = estado.historicoAnual || [];
      taxaCambio = estado.taxaCambio || 1800;
      inflacaoAtual = estado.inflacaoAtual || 23.4;
      
      // Atualizar interface
      document.getElementById('empresaNome').textContent = estadoJogo.nomeEmpresa;
      document.getElementById('empresaDimensao').textContent = estadoJogo.dimensao.toUpperCase();
      atualizarDataDisplay();
      atualizarCarteiras();
      atualizarDashboard();
      
      // Reiniciar tempo
      if (intervaloPrincipal) {
        clearInterval(intervaloPrincipal);
      }
      iniciarTempoSimulador();
      
      notificar('✅ Simulação carregada com sucesso!');
      
      // Mostrar dashboard
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
  const [dia, mes, ano] = dataString.split('/').map(Number);
  const dataAlvo = new Date(ano, mes - 1, dia);
  const diff = dataAlvo - dataSimulador;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function verificarEventos() {
  // Verificar pagamento de juros (1 Junho e 1 Dezembro)
  if (dataSimulador.getDate() === 1 && (dataSimulador.getMonth() === 5 || dataSimulador.getMonth() === 11)) {
    processarPagamentoJuros();
  }
  
  // Verificar se precisa pagar contabilista
  if (dataSimulador.getMonth() === 2 && dataSimulador.getDate() === 10) { // 10 de Março
    verificarObrigacaoContabilista();
  }
}

function processarPagamentoJuros() {
  emprestimos.forEach(credito => {
    if (credito.status === 'ativo') {
      const jurosParcela = credito.jurosTotais / (credito.prazo * 2); // 2x por ano
      
      if (credito.moeda === 'Kz') {
        if (estadoJogo.carteiraKz >= jurosParcela) {
          estadoJogo.carteiraKz -= jurosParcela;
          credito.jurosPagos += jurosParcela;
          registrarTransacao('juros', 'saida', jurosParcela, 'Kz', `Juros de crédito`);
        } else {
          // Acionar garantias
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
  // Usar garantias bloqueadas
  if (estadoJogo.garantiasKz >= valor) {
    estadoJogo.garantiasKz -= valor;
    notificar(`⚠️ Garantias utilizadas para pagar juros: ${formatarMoeda(valor)} Kz`);
  } else {
    // Liquidar investimentos
    liquidarInvestimentos(valor - estadoJogo.garantiasKz);
  }
}

function liquidarInvestimentos(valorNecessario) {
  let valorLiquidado = 0;
  
  // Liquidar ações primeiro
  for (let acaoId in investimentos.acoes) {
    const acao = investimentos.acoes[acaoId];
    if (acao.moeda === 'Kz' && acao.quantidade > 0) {
      const valorAcao = acao.precoAtual * acao.quantidade;
      if (valorLiquidado + valorAcao <= valorNecessario) {
        valorLiquidado += valorAcao;
        acao.quantidade = 0;
      } else {
        const qtdNecessaria = Math.ceil((valorNecessario - valorLiquidado) / acao.precoAtual);
        acao.quantidade -= qtdNecessaria;
        valorLiquidado += qtdNecessaria * acao.precoAtual;
        break;
      }
    }
  }
  
  if (valorLiquidado < valorNecessario) {
    notificar('❌ FALÊNCIA: Incapacidade de pagar dívidas');
    declararFalencia();
  }
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
}

function verificarPagamentosMensais() {
  // Verificar se pagou salários
  const totalSalarios = calcularTotalSalarios();
  if (totalSalarios > 0) {
    const pagouSalario = historicoTransacoes.some(t => 
      t.tipo === 'rh' && t.descricao.includes('salários') && 
      t.data === dataSimulador.toLocaleDateString()
    );
    
    if (!pagouSalario) {
      notificar('⚠️ Salários em atraso! Os funcionários estão a reclamar.');
    }
  }
}

function verificarObrigacaoContabilista() {
  notificar('⚠️ Data limite para pagar contabilista: 10 de Março');
}

function atualizarRelacoesDiplomaticas() {
  // Simular mudanças anuais nas relações
  if (dadosMundo) {
    for (let pais in dadosMundo.relacoesDiplomaticas) {
      const rand = Math.random();
      if (rand < 0.1) { // 10% de chance de mudar
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
  
  // 2 crises por década (10 anos)
  if (contadorCrise >= 5) { // A cada 5 anos simula crise
    contadorCrise = 0;
    
    if (Math.random() < 0.4) { // 40% de chance de crise
      cicloEconomico = 'crise';
      inflacaoAtual += 15;
      
      notificar('⚠️⚠️⚠️ CRISE GLOBAL! ⚠️⚠️⚠️');
      notificar('Taxas de juro vão aumentar, inflação elevada');
      
      // Aumentar custos de importação em 20%
      // Isso será aplicado nas próximas compras
    }
  } else {
    cicloEconomico = 'estavel';
  }
}

// ============================================
// CONTROLE DE VELOCIDADE DO TEMPO
// ============================================

let velocidadeTempo = 1; // 1 = normal (1 segundo real = 1 segundo jogo)
let intervaloVelocidade = null;

function iniciarControleTempo() {
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
    
    // Inserir no cabeçalho
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        headerRight.innerHTML += controleHTML;
    } else {
        // Criar se não existir
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
    
    // Parar intervalo atual
    if (intervaloPrincipal) {
        clearInterval(intervaloPrincipal);
        intervaloPrincipal = null;
    }
    
    // Reiniciar com nova velocidade
    // 1000ms / velocidade = intervalo em ms
    const intervaloMs = 1000 / velocidadeTempo;
    
    intervaloPrincipal = setInterval(() => {
        tempoDecorrido += 1;
        
        // Usar a mesma lógica mas com tempo real ajustado
        if (tempoDecorrido % TEMPO.dia === 0) processarDia();
        if (tempoDecorrido % TEMPO.mes === 0) processarMes();
        if (tempoDecorrido % TEMPO.trimestre === 0) processarTrimestre();
        if (tempoDecorrido % TEMPO.ano === 0) processarAno();
        
        atualizarDataDisplay();
        verificarEventos();
        
    }, intervaloMs);
    
    // Atualizar UI
    document.querySelectorAll('.velocidade-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.textContent) === novaVelocidade) {
            btn.classList.add('active');
        }
    });
    
    document.querySelector('.velocidade-atual').textContent = `${novaVelocidade}x`;
    
    notificar(`⏱️ Velocidade alterada para ${novaVelocidade}x`);
}

// CSS para o controle de tempo (adicione ao seu CSS)
const styleTempo = document.createElement('style');
styleTempo.textContent = `
    .controle-tempo {
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--bg-tertiary);
        padding: 5px 15px;
        border-radius: 30px;
        border: 1px solid var(--border-color);
    }
    
    .velocidade-label {
        color: var(--accent-gold);
        font-weight: bold;
    }
    
    .velocidade-botoes {
        display: flex;
        gap: 5px;
    }
    
    .velocidade-btn {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        padding: 3px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
        transition: all 0.3s;
    }
    
    .velocidade-btn:hover {
        border-color: var(--accent-gold);
        color: var(--accent-gold);
    }
    
    .velocidade-btn.active {
        background: var(--accent-gold);
        color: var(--bg-primary);
        border-color: var(--accent-gold);
    }
    
    .velocidade-atual {
        color: var(--accent-green);
        font-weight: bold;
        min-width: 40px;
        text-align: center;
    }
`;
document.head.appendChild(styleTempo);

// ============================================
// INICIALIZAÇÃO
// ============================================

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  iniciarSimulador();
});

// ============================================
// FUNÇÃO PARA VERIFICAR ROLAGEM DO MENU
// ============================================

function verificarRolagemMenu() {
  const menu = document.querySelector('.menu-conteudo');
  if (menu) {
    // Verifica se o conteúdo excede a altura do menu
    if (menu.scrollHeight > menu.clientHeight) {
      menu.classList.add('scrollable');
    } else {
      menu.classList.remove('scrollable');
    }
  }
}

// Executar quando o menu for aberto (hover)
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
  menuToggle.addEventListener('mouseenter', function() {
    // Pequeno delay para o menu abrir completamente
    setTimeout(verificarRolagemMenu, 150);
  });
}

// Executar quando a janela for redimensionada
window.addEventListener('resize', function() {
  // Verifica se o menu está visível
  const menu = document.querySelector('.menu-conteudo');
  if (menu && menu.style.display === 'flex') {
    verificarRolagemMenu();
  }
});

// Executar quando o menu for aberto por clique (alternativa ao hover)
menuToggle.addEventListener('click', function() {
  // Pequeno delay para o menu abrir
  setTimeout(verificarRolagemMenu, 100);
});

// ============================================
// FUNÇÃO PARA DESTACAR ITEM ATIVO NO MENU
// ============================================

function destacarItemMenuAtivo() {
  const menuBotoes = document.querySelectorAll('.menu-conteudo button');
  const conteudoAtual = document.getElementById('conteudoPrincipal').innerHTML;
  
  // Remove a classe active de todos os botões
  menuBotoes.forEach(btn => btn.classList.remove('active'));
  
  // Determina qual botão deve ficar ativo baseado no conteúdo atual
  if (conteudoAtual.includes('Recursos Humanos') || conteudoAtual.includes('RH')) {
    document.querySelector('button[onclick="mostrarRH()"]')?.classList.add('active');
  } else if (conteudoAtual.includes('Financeiro')) {
    document.querySelector('button[onclick="mostrarFinanceiro()"]')?.classList.add('active');
  } else if (conteudoAtual.includes('Investimentos')) {
    document.querySelector('button[onclick="mostrarInvestimentos()"]')?.classList.add('active');
  }
  // Adicione mais condições conforme necessário
}

// Chamar a função sempre que o conteúdo mudar
const observer = new MutationObserver(destacarItemMenuAtivo);
observer.observe(document.getElementById('conteudoPrincipal'), {
  childList: true,
  subtree: true
});

