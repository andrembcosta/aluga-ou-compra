# Calculadora SFH - Sistema de Financiamento Habitacional

Calculadora web para comparar cenários de compra de imóvel via financiamento SFH versus aluguel com investimento.

## Funcionalidades

### Parâmetros Configuráveis
- Valor do imóvel
- Taxa de juros (10%, 11% ou 12% ao ano)
- Percentual de entrada (mínimo 20%)
- Número de parcelas
- Sistema de amortização (SAC ou Price)
- Inflação anual
- Valor do aluguel mensal
- Saldo atual e depósito mensal do FGTS
- Taxa de rentabilidade dos investimentos

### Uso do FGTS
A calculadora implementa as regras oficiais do FGTS para financiamentos SFH:
- Uso na entrada do financiamento
- Duas estratégias disponíveis:
  - **Pagamento de parcelas**: Usar até 80% do valor de 12 parcelas consecutivas, renovável a cada 12 meses
  - **Amortização**: Amortizar o saldo devedor a cada 24 meses

### Cenários Comparados

**Cenário 1: Aluguel + Investimento**
- Pessoa aluga o imóvel pagando aluguel mensal (reajustado pela inflação)
- Diferença entre o gasto de financiamento e aluguel é investida
- Investimentos rendem inflação + taxa escolhida
- Imposto de renda de 15% sobre ganhos
- FGTS acumula e rende inflação

**Cenário 2: Financiamento SFH**
- Pessoa compra o imóvel via financiamento
- Usa FGTS ao máximo (entrada e estratégia escolhida)
- Patrimônio final = valor do imóvel corrigido pela inflação

## Como usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:5173

### Build para produção

```bash
npm run build
```

## Tecnologias

- React 18
- Vite
- CSS puro (design minimalista)

## Regras do SFH (2026)

- Limite de imóvel: até R$ 2,25 milhões
- Taxa de juros máxima: 12% ao ano
- Entrada mínima: 20% do valor do imóvel
- Permite uso de FGTS conforme regras da Caixa

## Fontes

- [FGTS poderá ser usado em financiamentos imobiliários de até R$ 2,25 milhões](https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/novembro/fgts-podera-ser-usado-em-financiamentos-imobiliarios-de-ate-r-2-25-milhoes)
- [Novas regras do SFH 2026](https://ademiniteroi.com.br/2026/01/06/novas-regras-do-sfh-trazem-mudancas-importantes-para-o-credito-imobiliario-a-partir-de-2025-2026/)
- [Tabela SAC vs Price](https://larya.com.br/blog/tabela-sac-ou-price-qual-melhor/)
