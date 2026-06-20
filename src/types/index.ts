export type TipoTx = 'despesa' | 'receita';
export type Periodicidade = 'semanal' | 'mensal' | 'anual';

export interface Conta {
  id: string;
  nome: string;
  instituicao?: string;
  tipo?: string;
  saldo_inicial?: number;
  saldo_atual?: number;
}

export interface Transacao {
  id: string;
  tipo: TipoTx;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  conta_id?: string;
  local_ou_pessoa?: string;
  meio_pagamento?: string;
  parcela_atual?: number;
  total_parcelas?: number;
  recorrente?: boolean;
  compra_grupo_id?: string;
}

export interface Assinatura {
  id: string;
  nome: string;
  valor: number;
  periodicidade: Periodicidade;
  dia_cobranca?: number;
  categoria?: string;
  cor?: string;
  ativo: boolean;
  created_at?: string;
}

export interface Meta {
  id: string;
  titulo: string;
  tipo: 'sonho_grande' | 'lista_simples';
  valor_alvo?: number;
  valor_guardado: number;
}

export interface OrcamentoMap {
  [categoria: string]: number;
}
