import { create } from 'zustand';
import { db } from '../lib/supabase';
import type { Transacao, Conta, Assinatura, Meta, OrcamentoMap } from '../types';

type Tela = 'dashboard' | 'lancamento' | 'historico' | 'calendario' | 'assinaturas' | 'metas';
type ToastTipo = 'ok' | 'err' | 'inf';

interface ToastState {
  msg: string;
  tipo: ToastTipo;
  visible: boolean;
}

interface AppState {
  // Navegação
  tela: Tela;
  setTela: (t: Tela) => void;

  // Mês/Ano
  mes: number;
  ano: number;
  setMes: (m: number) => void;
  setAno: (a: number) => void;
  navMes: (dir: -1 | 1) => void;

  // Dados
  txs: Transacao[];
  contas: Conta[];
  assinaturas: Assinatura[];
  metas: Meta[];
  orc: OrcamentoMap;

  // Cache
  cacheTs: number;
  invalidCache: () => void;

  // Loaders
  carregarTxs: (force?: boolean) => Promise<void>;
  carregarContas: () => Promise<void>;
  carregarAssinaturas: () => Promise<void>;
  carregarMetas: () => Promise<void>;
  carregarOrc: () => void;
  salvarOrc: (o: OrcamentoMap) => void;

  // Toast
  toast: ToastState;
  mostrarToast: (msg: string, tipo?: ToastTipo) => void;

  // Modal detalhe tx
  txSelecionada: Transacao | null;
  setTxSelecionada: (t: Transacao | null) => void;

  // Edição tx
  txEditando: Transacao | null;
  setTxEditando: (t: Transacao | null) => void;
}

const TTL = 5 * 60 * 1000;
const CK = 'kelo_txs';
const CT = 'kelo_ts';

function lerCacheLocal(): Transacao[] | null {
  try {
    const ts = +(localStorage.getItem(CT) || 0);
    const raw = localStorage.getItem(CK);
    if (!raw || Date.now() - ts > TTL) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function salvarCacheLocal(lst: Transacao[]) {
  try {
    localStorage.setItem(CK, JSON.stringify(lst));
    localStorage.setItem(CT, String(Date.now()));
  } catch { /* ignore */ }
}

function limparCacheLocal() {
  localStorage.removeItem(CK);
  localStorage.removeItem(CT);
}

export const useAppStore = create<AppState>((set, get) => ({
  tela: 'dashboard',
  setTela: (t) => set({ tela: t }),

  mes: new Date().getMonth(),
  ano: new Date().getFullYear(),
  setMes: (m) => set({ mes: m }),
  setAno: (a) => set({ ano: a }),
  navMes: (dir) => {
    const { mes, ano } = get();
    let nm = mes + dir;
    let na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    set({ mes: nm, ano: na });
  },

  txs: [],
  contas: [],
  assinaturas: [],
  metas: [],
  orc: {},
  cacheTs: 0,

  invalidCache: () => {
    limparCacheLocal();
    set({ cacheTs: 0 });
  },

  carregarTxs: async (force = false) => {
    if (!force) {
      const cached = lerCacheLocal();
      if (cached) { set({ txs: cached }); return; }
    }
    const { data, error } = await db
      .from('transacoes')
      .select('*')
      .order('data', { ascending: false });
    if (!error && data) {
      const lst = data as Transacao[];
      salvarCacheLocal(lst);
      set({ txs: lst, cacheTs: Date.now() });
    }
  },

  carregarContas: async () => {
    const { data, error } = await db
      .from('contas')
      .select('*')
      .order('nome');
    if (!error && data) set({ contas: data as Conta[] });
  },

  carregarAssinaturas: async () => {
    const { data, error } = await db
      .from('assinaturas')
      .select('*')
      .order('nome');
    if (!error && data) set({ assinaturas: data as Assinatura[] });
  },

  carregarMetas: async () => {
    const { data, error } = await db
      .from('metas')
      .select('*')
      .order('tipo', { ascending: false });
    if (!error && data) set({ metas: data as Meta[] });
  },

  carregarOrc: () => {
    try {
      const o = JSON.parse(localStorage.getItem('orc') || '{}');
      set({ orc: o });
    } catch { set({ orc: {} }); }
  },

  salvarOrc: (o) => {
    localStorage.setItem('orc', JSON.stringify(o));
    set({ orc: o });
  },

  toast: { msg: '', tipo: 'ok', visible: false },
  mostrarToast: (msg, tipo = 'ok') => {
    set({ toast: { msg, tipo, visible: true } });
    setTimeout(() => set({ toast: { msg: '', tipo: 'ok', visible: false } }), 3200);
  },

  txSelecionada: null,
  setTxSelecionada: (t) => set({ txSelecionada: t }),

  txEditando: null,
  setTxEditando: (t) => set({ txEditando: t }),
}));
