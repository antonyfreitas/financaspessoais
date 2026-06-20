export const R$ = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dtF = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

export const mlb = (m: number, a: number) => {
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${MESES[m]} ${a}`;
};

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export const CAT_DESP: Record<string, { n: string; i: string }> = {
  alimentacao: { n: 'Alimentação', i: '🍔' },
  transporte:  { n: 'Transporte',  i: '🚗' },
  compras:     { n: 'Compras',     i: '🛍️' },
  saude:       { n: 'Saúde',       i: '💊' },
  moradia:     { n: 'Moradia',     i: '🏠' },
  lazer:       { n: 'Lazer',       i: '🎮' },
  educacao:    { n: 'Educação',    i: '📚' },
  outros:      { n: 'Outros',      i: '📦' },
};

export const CAT_REC: Record<string, { n: string; i: string }> = {
  salario:      { n: 'Salário',     i: '💼' },
  freelance:    { n: 'Freelance',   i: '💻' },
  investimento: { n: 'Investimento',i: '📈' },
  aluguel:      { n: 'Aluguel',     i: '🏘️' },
  bonus:        { n: 'Bônus',       i: '🎁' },
  reembolso:    { n: 'Reembolso',   i: '↩️' },
  presente:     { n: 'Presente',    i: '🎀' },
  outros_rec:   { n: 'Outros',      i: '💰' },
};

export const CATS = { ...CAT_DESP, ...CAT_REC };
export const CORES = ['#7c6ff7','#1ec99a','#f0566e','#f0a030','#38bdf8','#a78bfa','#fb923c','#4ade80'];

export const PERIODICIDADE_LABEL: Record<string, string> = {
  semanal: 'Semanal',
  mensal:  'Mensal',
  anual:   'Anual',
};

export const ASS_CORES = [
  '#7c6ff7','#f0566e','#1ec99a','#f0a030',
  '#38bdf8','#a78bfa','#fb923c','#4ade80',
  '#e879f9','#34d399',
];
