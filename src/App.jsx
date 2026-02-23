import { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts'

function App() {
  const [valorImovel, setValorImovel] = useState(500000)
  const [taxaJuros, setTaxaJuros] = useState(9)
  const [taxaTR, setTaxaTR] = useState(2)
  const [jurosCustom, setJurosCustom] = useState(false)
  const [percEntrada, setPercEntrada] = useState(20)
  const [numParcelas, setNumParcelas] = useState(360)
  const [inflacao, setInflacao] = useState(4)
  const [valorAluguel, setValorAluguel] = useState(2000)
  const [saldoFGTS, setSaldoFGTS] = useState(50000)
  const [depositoFGTS, setDepositoFGTS] = useState(800)
  const [taxaInvestimento, setTaxaInvestimento] = useState(6)
  const [tipoAmortizacao, setTipoAmortizacao] = useState('SAC')
  const [estrategiaFGTS, setEstrategiaFGTS] = useState('otimizada') // 'parcelas', 'amortizacao' ou 'otimizada'

  // Custos adicionais do financiamento
  const [incluirCustosIniciais, setIncluirCustosIniciais] = useState(false)
  const [percCustosIniciais, setPercCustosIniciais] = useState(4.5)
  const [incluirCustosMensais, setIncluirCustosMensais] = useState(false)
  const [custoMensalAdicional, setCustoMensalAdicional] = useState(200)
  const [incluirReformas, setIncluirReformas] = useState(false)
  const [periodoReformaAnos, setPeriodoReformaAnos] = useState(10)
  const [percReforma, setPercReforma] = useState(7)

  const [resultado, setResultado] = useState(null)

  const calcular = () => {
    // Validações
    const valorEntrada = (percEntrada / 100) * valorImovel
    const valorFinanciado = valorImovel - valorEntrada
    const taxaMensal = taxaJuros / 100 / 12
    const taxaTRMensal = Math.pow(1 + taxaTR / 100, 1 / 12) - 1
    const taxaInflacaoMensal = inflacao / 100 / 12
    const taxaInvestimentoMensal = (inflacao + taxaInvestimento) / 100 / 12

    // ========== CALCULAR AMBOS CENÁRIOS ==========
    const resultado = calcularCenarios(
      valorImovel,
      valorEntrada,
      valorFinanciado,
      taxaMensal,
      taxaTRMensal,
      numParcelas,
      saldoFGTS,
      depositoFGTS,
      taxaInflacaoMensal,
      tipoAmortizacao,
      estrategiaFGTS,
      valorAluguel,
      taxaInvestimentoMensal,
      incluirCustosIniciais,
      percCustosIniciais,
      incluirCustosMensais,
      custoMensalAdicional,
      incluirReformas,
      periodoReformaAnos,
      percReforma
    )

    // Agrupar dados por ano para o gráfico
    const dadosAnuais = agruparDadosPorAno(resultado.dadosGrafico)

    setResultado({
      cenario1: resultado.cenario1,
      cenario2: resultado.cenario2,
      dadosGrafico: dadosAnuais,
      meses: numParcelas
    })
  }

  const agruparDadosPorAno = (dadosMensais) => {
    const dadosAnuais = []
    const numAnos = Math.ceil(dadosMensais.length / 12)

    for (let ano = 0; ano < numAnos; ano++) {
      const mesesDoAno = dadosMensais.slice(ano * 12, (ano + 1) * 12)

      if (mesesDoAno.length === 0) continue

      // Calcular totais anuais
      const somaCash = mesesDoAno.reduce((acc, m) => acc + m.parcelaCash, 0)
      const somaFGTS = mesesDoAno.reduce((acc, m) => acc + m.parcelaFGTS, 0)
      const somaAluguel = mesesDoAno.reduce((acc, m) => acc + m.aluguel, 0)
      const somaAmortizacao = mesesDoAno.reduce((acc, m) => acc + m.amortizacao, 0)
      const somaCustosAdicionais = mesesDoAno.reduce((acc, m) => acc + (m.custosAdicionais || 0), 0)

      dadosAnuais.push({
        ano: ano + 1,
        parcelaCashAnual: somaCash,
        parcelaFGTSAnual: somaFGTS,
        aluguelAnual: somaAluguel,
        amortizacaoAnual: somaAmortizacao,
        custosAdicionaisAnual: somaCustosAdicionais,
        // Guardar valores mensais para o tooltip
        parcelaCashMensal: somaCash / mesesDoAno.length,
        parcelaFGTSMensal: somaFGTS / mesesDoAno.length,
        aluguelMensal: somaAluguel / mesesDoAno.length,
        custosAdicionaisMensal: somaCustosAdicionais / mesesDoAno.length
      })
    }

    return dadosAnuais
  }

  const calcularCenarios = (
    valorImovel,
    valorEntrada,
    valorFinanciado,
    taxaMensal,
    taxaTRMensal,
    numParcelas,
    saldoFGTSInicial,
    depositoFGTS,
    taxaInflacaoMensal,
    tipoAmortizacao,
    estrategiaFGTS,
    valorAluguel,
    taxaInvestimentoMensal,
    incluirCustosIniciais,
    percCustosIniciais,
    incluirCustosMensais,
    custoMensalAdicional,
    incluirReformas,
    periodoReformaAnos,
    percReforma
  ) => {
    // ========== CENÁRIO 2: FINANCIAMENTO ==========
    let saldoDevedor = valorFinanciado
    let saldoFGTS_C2 = saldoFGTSInicial
    let saldoInvestimento_C2 = 0
    let totalAplicado_C2 = 0

    // Usar FGTS na entrada
    const fgtsUsadoEntrada = Math.min(saldoFGTS_C2, valorEntrada)
    const entradaCash = valorEntrada - fgtsUsadoEntrada
    saldoFGTS_C2 -= fgtsUsadoEntrada

    // Custos iniciais do financiamento (ITBI, registro, etc)
    let custosIniciaisPagos = 0
    if (incluirCustosIniciais) {
      custosIniciaisPagos = valorImovel * (percCustosIniciais / 100)
      // Esses custos são pagos em cash no início
      // Para comparação justa, o Cenário 1 investe esse valor
    }

    // Variáveis para controle de uso do FGTS (não mais necessário controle de ciclos)
    let totalCustosMensaisAdicionais = 0
    let totalReformasPagas = 0

    // ========== CENÁRIO 1: ALUGUEL ==========
    let saldoFGTS_C1 = saldoFGTSInicial
    let saldoInvestimento_C1 = 0
    let totalAplicado_C1 = 0

    // Cenário 1 investe a entrada (não precisa pagar)
    saldoInvestimento_C1 += entradaCash
    totalAplicado_C1 += entradaCash

    // Cenário 1 também investe os custos iniciais que não precisa pagar
    if (incluirCustosIniciais) {
      saldoInvestimento_C1 += custosIniciaisPagos
      totalAplicado_C1 += custosIniciaisPagos
    }

    // Arrays para armazenar gastos mensais e dados para gráfico
    let gastosMensais_C2 = []
    let dadosGrafico = []
    let aluguelAtual = valorAluguel

    // Pré-calcular parcela base do Price (sem TR) — a TR é somada mensalmente sobre o saldo
    const parcelaBasePrice = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, numParcelas)) /
      (Math.pow(1 + taxaMensal, numParcelas) - 1)

    // Simular mês a mês
    for (let mes = 1; mes <= numParcelas; mes++) {
      if (saldoDevedor <= 0) break

      // ========== CALCULAR PARCELA DO CENÁRIO 2 ==========
      let juros = saldoDevedor * taxaMensal
      let amortizacao
      let parcela

      const correcaoTR = saldoDevedor * taxaTRMensal

      if (tipoAmortizacao === 'SAC') {
        amortizacao = valorFinanciado / numParcelas
        parcela = amortizacao + juros + correcaoTR
      } else { // Price
        amortizacao = parcelaBasePrice - juros
        parcela = parcelaBasePrice + correcaoTR
      }

      // Recebe depósito mensal do FGTS em ambos cenários
      saldoFGTS_C2 += depositoFGTS
      saldoFGTS_C2 *= (1 + taxaInflacaoMensal)

      saldoFGTS_C1 += depositoFGTS
      saldoFGTS_C1 *= (1 + taxaInflacaoMensal)

      let gastoCash_C2 = parcela
      let amortizacaoFGTSMes = 0 // Para rastrear amortização neste mês
      let custosAdicionaisMes = 0 // Para rastrear custos adicionais (seguros, reformas, etc)

      // ========== USAR FGTS NO CENÁRIO 2 ==========

      if (estrategiaFGTS === 'parcelas') {
        // ESTRATÉGIA: PAGAMENTO DE PARCELAS
        // Usa FGTS continuamente todo mês, limitado a 80% da parcela
        const valorAUsar = Math.min(saldoFGTS_C2, parcela * 0.8)
        if (valorAUsar > 0) {
          saldoFGTS_C2 -= valorAUsar
          gastoCash_C2 = parcela - valorAUsar
        }
      }
      else if (estrategiaFGTS === 'amortizacao') {
        // ESTRATÉGIA: AMORTIZAÇÃO
        // Acumula FGTS e amortiza TODO o saldo a cada 24 meses
        if (mes % 24 === 0) {
          const fgtsParaAmortizar = saldoFGTS_C2
          if (fgtsParaAmortizar > 0) {
            amortizacaoFGTSMes = fgtsParaAmortizar
            saldoDevedor -= fgtsParaAmortizar
            saldoFGTS_C2 = 0
          }
        }
      }
      else if (estrategiaFGTS === 'otimizada') {
        // ESTRATÉGIA OTIMIZADA
        // 1. Usa FGTS continuamente todo mês para pagar até 80% das parcelas
        // 2. O saldo que acumular é usado para amortização a cada 24 meses
        const valorAUsar = Math.min(saldoFGTS_C2, parcela * 0.8)
        if (valorAUsar > 0) {
          saldoFGTS_C2 -= valorAUsar
          gastoCash_C2 = parcela - valorAUsar
        }

        // Amortização a cada 24 meses
        if (mes % 24 === 0) {
          const fgtsParaAmortizar = saldoFGTS_C2
          if (fgtsParaAmortizar > 0) {
            amortizacaoFGTSMes = fgtsParaAmortizar
            saldoDevedor -= fgtsParaAmortizar
            saldoFGTS_C2 = 0
          }
        }
      }

      // ========== CUSTOS ADICIONAIS DO FINANCIAMENTO ==========

      // Custos mensais (seguros, taxas administrativas)
      if (incluirCustosMensais) {
        custosAdicionaisMes += custoMensalAdicional
        totalCustosMensaisAdicionais += custoMensalAdicional
      }

      // Reformas periódicas (a cada X anos)
      // Usa percentual do valor do imóvel corrigido pela inflação até o momento
      if (incluirReformas && mes % (periodoReformaAnos * 12) === 0) {
        const valorImovelAtual = valorImovel * Math.pow(1 + taxaInflacaoMensal, mes)
        const custoReforma = valorImovelAtual * (percReforma / 100)
        custosAdicionaisMes += custoReforma
        totalReformasPagas += custoReforma
      }

      // Adicionar custos adicionais ao gasto cash
      gastoCash_C2 += custosAdicionaisMes

      gastosMensais_C2.push(gastoCash_C2)

      // ========== CALCULAR ALUGUEL DO CENÁRIO 1 ==========
      // Reajustar aluguel pela inflação anualmente
      if (mes > 1 && mes % 12 === 1) {
        aluguelAtual *= Math.pow(1 + taxaInflacaoMensal, 12)
      }

      // Armazenar dados para o gráfico
      // Separar: parcela cash (sem custos adicionais), parcela FGTS, custos adicionais
      const parcelaCashSemCustos = gastoCash_C2 - custosAdicionaisMes
      const parcelaFGTSUsada = parcela - parcelaCashSemCustos
      dadosGrafico.push({
        mes: mes,
        parcelaCash: parcelaCashSemCustos,
        parcelaFGTS: parcelaFGTSUsada,
        custosAdicionais: custosAdicionaisMes,
        aluguel: aluguelAtual,
        amortizacao: amortizacaoFGTSMes
      })

      // ========== COMPARAR E INVESTIR ==========
      // Quem gasta MENOS investe a diferença
      if (aluguelAtual < gastoCash_C2) {
        // Cenário 1 gasta menos, investe a diferença
        const economia = gastoCash_C2 - aluguelAtual
        saldoInvestimento_C1 += economia
        totalAplicado_C1 += economia
      } else if (gastoCash_C2 < aluguelAtual) {
        // Cenário 2 gasta menos, investe a diferença
        const economia = aluguelAtual - gastoCash_C2
        saldoInvestimento_C2 += economia
        totalAplicado_C2 += economia
      }
      // Se gastoCash_C2 === aluguelAtual, ninguém investe neste mês

      // Investimentos rendem (inflação + taxa)
      saldoInvestimento_C1 *= (1 + taxaInvestimentoMensal)
      saldoInvestimento_C2 *= (1 + taxaInvestimentoMensal)

      // Atualizar saldo devedor: aplica correção TR e desconta amortização
      saldoDevedor = saldoDevedor * (1 + taxaTRMensal) - amortizacao
      if (saldoDevedor < 0) saldoDevedor = 0
    }

    // ========== CALCULAR IMPOSTO DE RENDA ==========
    const ganhos_C1 = Math.max(0, saldoInvestimento_C1 - totalAplicado_C1)
    const impostoRenda_C1 = ganhos_C1 * 0.15
    const saldoInvestimentoLiquido_C1 = saldoInvestimento_C1 - impostoRenda_C1

    const ganhos_C2 = Math.max(0, saldoInvestimento_C2 - totalAplicado_C2)
    const impostoRenda_C2 = ganhos_C2 * 0.15
    const saldoInvestimentoLiquido_C2 = saldoInvestimento_C2 - impostoRenda_C2

    // ========== PATRIMÔNIO FINAL ==========
    const valorImovelFinal = valorImovel * Math.pow(1 + taxaInflacaoMensal, numParcelas)

    // Cenário 1: FGTS + Investimentos
    const patrimonioFinal_C1 = saldoFGTS_C1 + saldoInvestimentoLiquido_C1

    // Cenário 2: Imóvel + FGTS + Investimentos
    const patrimonioFinal_C2 = valorImovelFinal + saldoFGTS_C2 + saldoInvestimentoLiquido_C2

    return {
      cenario1: {
        patrimonioFinal: patrimonioFinal_C1,
        saldoFGTS: saldoFGTS_C1,
        saldoInvestimentoLiquido: saldoInvestimentoLiquido_C1,
        impostoRenda: impostoRenda_C1
      },
      cenario2: {
        patrimonioFinal: patrimonioFinal_C2,
        valorImovelFinal: valorImovelFinal,
        saldoFGTSFinal: saldoFGTS_C2,
        saldoInvestimentoLiquido: saldoInvestimentoLiquido_C2,
        impostoRenda: impostoRenda_C2,
        entradaCash: entradaCash,
        fgtsUsadoEntrada: fgtsUsadoEntrada,
        gastosMensaisPorMes: gastosMensais_C2,
        custosIniciaisPagos: custosIniciaisPagos,
        totalCustosMensaisAdicionais: totalCustosMensaisAdicionais,
        totalReformasPagas: totalReformasPagas
      },
      dadosGrafico: dadosGrafico
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <div className="container">
      <header>
        <h1>Calculadora SFH</h1>
        <p>Sistema de Financiamento Habitacional</p>
      </header>

      <div className="form-section">
        <h2>Parâmetros do Financiamento</h2>

        <div className="form-group">
          <label>Valor do Imóvel</label>
          <input
            type="number"
            value={valorImovel}
            onChange={(e) => setValorImovel(Number(e.target.value))}
            step="1"
          />
        </div>

        <div className="form-group">
          <label>Taxa de Juros Nominal (a.a.) + TR</label>
          <select
            value={jurosCustom ? 'custom' : taxaJuros}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setJurosCustom(true)
              } else {
                setJurosCustom(false)
                setTaxaJuros(Number(e.target.value))
              }
            }}
          >
            <option value={9}>9% + TR (Pró-Cotista FGTS)</option>
            <option value={10.26}>10,26% + TR (SFH Correntista Caixa)</option>
            <option value={11.75}>11,75% + TR (SFH Bancos Privados)</option>
            <option value="custom">Personalizado</option>
          </select>
          {jurosCustom && (
            <input
              type="number"
              value={taxaJuros}
              onChange={(e) => setTaxaJuros(Number(e.target.value))}
              step="0.01"
              min="0"
              max="30"
              placeholder="Taxa % ao ano"
              style={{ marginTop: '8px' }}
            />
          )}
          <small>Taxa nominal conforme contrato. A TR é cobrada separadamente sobre o saldo devedor.</small>
        </div>

        <div className="form-group">
          <label>TR Projetada (% ao ano)</label>
          <input
            type="number"
            value={taxaTR}
            onChange={(e) => setTaxaTR(Number(e.target.value))}
            step="0.1"
            min="0"
            max="10"
          />
          <small>TR atual (12 meses): ~2% a.a. A TR é variável e imprevisível — ajuste conforme seu cenário. Use 0% para ver o piso sem correção.</small>
        </div>

        <div className="form-group">
          <label>Entrada (% do valor do imóvel)</label>
          <input
            type="number"
            value={percEntrada}
            onChange={(e) => setPercEntrada(Number(e.target.value))}
            min="20"
            max="100"
          />
          <small>Mínimo: 20%</small>
        </div>

        <div className="form-group">
          <label>Número de Parcelas (meses)</label>
          <input
            type="number"
            value={numParcelas}
            onChange={(e) => setNumParcelas(Number(e.target.value))}
            step="1"
            min="12"
            max="420"
          />
        </div>

        <div className="form-group">
          <label>Sistema de Amortização</label>
          <select value={tipoAmortizacao} onChange={(e) => setTipoAmortizacao(e.target.value)}>
            <option value="SAC">SAC (Parcelas Decrescentes)</option>
            <option value="PRICE">Price (Parcelas Fixas)</option>
          </select>
        </div>

        <h2>FGTS</h2>

        <div className="form-group">
          <label>Saldo Atual do FGTS</label>
          <input
            type="number"
            value={saldoFGTS}
            onChange={(e) => setSaldoFGTS(Number(e.target.value))}
            step="1"
          />
        </div>

        <div className="form-group">
          <label>Depósito Mensal no FGTS</label>
          <input
            type="number"
            value={depositoFGTS}
            onChange={(e) => setDepositoFGTS(Number(e.target.value))}
            step="1"
          />
        </div>

        <div className="form-group">
          <label>Estratégia de Uso do FGTS</label>
          <select value={estrategiaFGTS} onChange={(e) => setEstrategiaFGTS(e.target.value)}>
            <option value="otimizada">Otimizada (Parcelas + Amortização) - Recomendado</option>
            <option value="parcelas">Pagamento de Parcelas (até 80% todo mês)</option>
            <option value="amortizacao">Amortização a cada 24 meses</option>
          </select>
          <small>
            {estrategiaFGTS === 'otimizada' && 'Usa FGTS todo mês para pagar até 80% das parcelas. O saldo que acumular é usado para amortização a cada 24 meses.'}
            {estrategiaFGTS === 'parcelas' && 'Usa FGTS continuamente todo mês para reduzir até 80% das parcelas.'}
            {estrategiaFGTS === 'amortizacao' && 'Acumula FGTS e usa TODO o saldo para amortizar o saldo devedor a cada 24 meses.'}
          </small>
        </div>

        <h2>Custos Adicionais do Financiamento</h2>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={incluirCustosIniciais}
              onChange={(e) => setIncluirCustosIniciais(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Incluir custos iniciais (ITBI, registro, escritura, etc)
          </label>
          {incluirCustosIniciais && (
            <div style={{ marginLeft: '24px', marginTop: '8px' }}>
              <label>Percentual dos custos iniciais (% do valor do imóvel)</label>
              <input
                type="number"
                value={percCustosIniciais}
                onChange={(e) => setPercCustosIniciais(Number(e.target.value))}
                step="0.5"
                min="0"
                max="10"
              />
              <small>Típico: 4% a 5% (ITBI ~2,5%, Registro ~0,75%, Escritura, Avaliação, Certidões)</small>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={incluirCustosMensais}
              onChange={(e) => setIncluirCustosMensais(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Incluir custos mensais (seguros e taxas)
          </label>
          {incluirCustosMensais && (
            <div style={{ marginLeft: '24px', marginTop: '8px' }}>
              <label>Valor mensal adicional (R$)</label>
              <input
                type="number"
                value={custoMensalAdicional}
                onChange={(e) => setCustoMensalAdicional(Number(e.target.value))}
                step="10"
                min="0"
              />
              <small>Típico: R$ 150-250/mês (Seguro DFI ~R$100, Seguro MIP ~R$50, Taxa adm ~R$30)</small>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={incluirReformas}
              onChange={(e) => setIncluirReformas(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Incluir reformas periódicas
          </label>
          {incluirReformas && (
            <div style={{ marginLeft: '24px', marginTop: '8px' }}>
              <label>Período entre reformas (anos)</label>
              <input
                type="number"
                value={periodoReformaAnos}
                onChange={(e) => setPeriodoReformaAnos(Number(e.target.value))}
                step="1"
                min="5"
                max="30"
              />
              <label style={{ marginTop: '8px' }}>Custo da reforma (% do valor do imóvel corrigido)</label>
              <input
                type="number"
                value={percReforma}
                onChange={(e) => setPercReforma(Number(e.target.value))}
                step="0.5"
                min="0"
                max="20"
              />
              <small>Reformas necessárias para manter o valor do imóvel (pintura, revisão elétrica/hidráulica, etc). Típico: 5-10% do valor do imóvel a cada 10 anos.</small>
            </div>
          )}
        </div>

        <h2>Cenário de Aluguel e Investimento</h2>

        <div className="form-group">
          <label>Valor do Aluguel Mensal</label>
          <input
            type="number"
            value={valorAluguel}
            onChange={(e) => setValorAluguel(Number(e.target.value))}
            step="100"
          />
        </div>

        <div className="form-group">
          <label>Inflação Anual (%)</label>
          <input
            type="number"
            value={inflacao}
            onChange={(e) => setInflacao(Number(e.target.value))}
            step="0.5"
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Taxa de Investimento (% acima da inflação)</label>
          <input
            type="number"
            value={taxaInvestimento}
            onChange={(e) => setTaxaInvestimento(Number(e.target.value))}
            step="0.5"
            min="0"
          />
          <small>Rentabilidade = Inflação + {taxaInvestimento}% = {inflacao + taxaInvestimento}% ao ano</small>
        </div>

        <button className="btn-calcular" onClick={calcular}>
          Calcular
        </button>
      </div>

      {resultado && (
        <div className="results-section">
          <h2>Resultados da Simulação</h2>
          <p className="subtitle">Patrimônio ao final de {resultado.meses} meses ({Math.floor(resultado.meses / 12)} anos)</p>

          <div className="results-grid">
            <div className="result-card cenario1">
              <h3>Cenário 1: Aluguel + Investimento</h3>
              <div className="result-item">
                <span className="label">Patrimônio Final:</span>
                <span className="value destaque">{formatarMoeda(resultado.cenario1.patrimonioFinal)}</span>
              </div>
              <div className="result-item">
                <span className="label">Saldo FGTS:</span>
                <span className="value">{formatarMoeda(resultado.cenario1.saldoFGTS)}</span>
              </div>
              <div className="result-item">
                <span className="label">Investimentos (líquido de IR):</span>
                <span className="value">{formatarMoeda(resultado.cenario1.saldoInvestimentoLiquido)}</span>
              </div>
              <div className="result-item">
                <span className="label">Imposto de Renda pago:</span>
                <span className="value">{formatarMoeda(resultado.cenario1.impostoRenda)}</span>
              </div>
            </div>

            <div className="result-card cenario2">
              <h3>Cenário 2: Financiamento SFH</h3>
              <div className="result-item">
                <span className="label">Patrimônio Final:</span>
                <span className="value destaque">{formatarMoeda(resultado.cenario2.patrimonioFinal)}</span>
              </div>
              <div className="result-item">
                <span className="label">Valor do Imóvel (corrigido):</span>
                <span className="value">{formatarMoeda(resultado.cenario2.valorImovelFinal)}</span>
              </div>
              <div className="result-item">
                <span className="label">Saldo FGTS:</span>
                <span className="value">{formatarMoeda(resultado.cenario2.saldoFGTSFinal)}</span>
              </div>
              <div className="result-item">
                <span className="label">Investimentos (líquido de IR):</span>
                <span className="value">{formatarMoeda(resultado.cenario2.saldoInvestimentoLiquido)}</span>
              </div>
              <div className="result-item">
                <span className="label">Imposto de Renda pago:</span>
                <span className="value">{formatarMoeda(resultado.cenario2.impostoRenda)}</span>
              </div>
              {incluirCustosIniciais && resultado.cenario2.custosIniciaisPagos > 0 && (
                <div className="result-item">
                  <span className="label">Custos iniciais pagos:</span>
                  <span className="value" style={{ color: '#e67e22' }}>{formatarMoeda(resultado.cenario2.custosIniciaisPagos)}</span>
                </div>
              )}
              {incluirCustosMensais && resultado.cenario2.totalCustosMensaisAdicionais > 0 && (
                <div className="result-item">
                  <span className="label">Total seguros e taxas:</span>
                  <span className="value" style={{ color: '#e67e22' }}>{formatarMoeda(resultado.cenario2.totalCustosMensaisAdicionais)}</span>
                </div>
              )}
              {incluirReformas && resultado.cenario2.totalReformasPagas > 0 && (
                <div className="result-item">
                  <span className="label">Total reformas:</span>
                  <span className="value" style={{ color: '#e67e22' }}>{formatarMoeda(resultado.cenario2.totalReformasPagas)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="chart-section">
            <h3>Evolução Anual: Gasto Total por Ano</h3>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart
                data={resultado.dadosGrafico}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barCategoryGap="5%"
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="ano"
                  label={{ value: 'Ano', position: 'insideBottom', offset: -10 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Valor Anual (R$)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name, props) => {
                    const formatarMoeda = (val) => {
                      return new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(val)
                    }

                    // Mostrar valor anual e mensal
                    const nomeMap = {
                      'parcelaCashAnual': 'Parcela Cash',
                      'parcelaFGTSAnual': 'Parcela FGTS',
                      'aluguelAnual': 'Aluguel',
                      'amortizacaoAnual': 'Amortização FGTS',
                      'custosAdicionaisAnual': 'Custos Adicionais'
                    }

                    const valorAnual = formatarMoeda(value)
                    const valorMensal = formatarMoeda(value / 12)

                    return [`${valorAnual} (${valorMensal}/mês)`, nomeMap[name] || name]
                  }}
                  labelFormatter={(label) => `Ano ${label}`}
                  contentStyle={{ fontSize: '0.9rem' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                />
                <Bar
                  dataKey="parcelaCashAnual"
                  stackId="parcelas"
                  fill="#e74c3c"
                  name="Parcela Anual (Cash)"
                />
                <Bar
                  dataKey="parcelaFGTSAnual"
                  stackId="parcelas"
                  fill="#3498db"
                  name="Parcela Anual (FGTS)"
                />
                <Bar
                  dataKey="amortizacaoAnual"
                  stackId="parcelas"
                  fill="#9b59b6"
                  name="Amortização Anual (FGTS)"
                />
                <Bar
                  dataKey="custosAdicionaisAnual"
                  stackId="parcelas"
                  fill="#e67e22"
                  name="Custos Adicionais Anuais (Seguros/Reformas)"
                />
                <Line
                  type="monotone"
                  dataKey="aluguelAnual"
                  stroke="#2ecc71"
                  strokeWidth={3}
                  name="Aluguel Anual"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#7f8c8d', marginTop: '1rem' }}>
              Barras empilhadas mostram gastos anuais com financiamento (vermelho=parcela cash, azul=FGTS, roxo=amortização, laranja=custos adicionais). Linha verde mostra gasto anual com aluguel. Passe o mouse para ver valores mensais.
            </p>
          </div>

          <div className="comparison">
            <h3>Comparação</h3>
            <div className="comparison-item">
              <span className="label">Diferença de Patrimônio:</span>
              <span className={`value ${resultado.cenario2.patrimonioFinal > resultado.cenario1.patrimonioFinal ? 'positivo' : 'negativo'}`}>
                {formatarMoeda(resultado.cenario2.patrimonioFinal - resultado.cenario1.patrimonioFinal)}
              </span>
            </div>
            <div className="comparison-result">
              {resultado.cenario2.patrimonioFinal > resultado.cenario1.patrimonioFinal ? (
                <p className="veredito positivo">✓ Financiar é mais vantajoso</p>
              ) : (
                <p className="veredito negativo">✓ Alugar é mais vantajoso</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
