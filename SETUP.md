# Kelo — Setup no StackBlitz

## 1. Criar projeto no StackBlitz

Acesse **stackblitz.com/create** e escolha:
- Template: **Vite + React + TypeScript**

## 2. Substituir arquivos

Copie a estrutura abaixo para o seu projeto StackBlitz:

```
kelo/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    App.module.css
    styles/
      globals.css
      tokens.css
    types/index.ts
    lib/
      supabase.ts
      formatters.ts
    store/
      useAppStore.ts
    components/
      Nav/Nav.tsx + Nav.module.css
      Toast/Toast.tsx + Toast.module.css
      Modal/TxModal.tsx + TxModal.module.css
    screens/
      Dashboard/Dashboard.tsx + Dashboard.module.css
      Lancamento/Lancamento.tsx + Lancamento.module.css
      Historico/Historico.tsx + Historico.module.css
      Calendario/Calendario.tsx + Calendario.module.css
      Assinaturas/Assinaturas.tsx + Assinaturas.module.css
      Metas/Metas.tsx + Metas.module.css
```

## 3. Supabase — migration

Execute o arquivo `MIGRATION_assinaturas.sql` no **SQL Editor** do seu projeto Supabase.
A tabela `transacoes`, `contas` e `metas` já existem do projeto anterior.

## 4. Instalar dependências

O StackBlitz instala automaticamente ao detectar o `package.json`.
Se necessário, rode no terminal:
```
npm install
```

## 5. Rodar

```
npm run dev
```

---

## Funcionalidades incluídas

| Tela | O que tem |
|---|---|
| **Dashboard** | KPI saldo/rec/desp, card de custo de assinaturas, saldos por conta, gráfico donut por categoria, orçamentos, barras 6 meses, últimas txs |
| **Agenda** | Calendário mensal interativo com dots de evento, painel do dia, próximas cobranças, gastos fixos |
| **+ Lançamento** | Form despesa/receita, parcelas, recorrente, edição inline |
| **Assinaturas** | Cards por serviço, custo mensal/anual, periodicidade, dia de cobrança, cores, pausar/ativar |
| **Histórico** | Filtros multi-critério, busca, export CSV |
| **Metas** | Alvos com barra de progresso, checklist de desejos |
