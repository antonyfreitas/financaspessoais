import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CAT_DESP, CAT_REC, R$ } from '../../lib/formatters';
import { db } from '../../lib/supabase';
import styles from './Lancamento.module.css';

type TipoTx = 'despesa' | 'receita';

const hoje = () => new Date().toISOString().split('T')[0];

export function Lancamento() {
  const { contas, txEditando, setTxEditando, invalidCache, carregarTxs, mostrarToast, setTela, carregarContas } = useAppStore();

  const [tipo, setTipo]         = useState<TipoTx>('despesa');
  const [valor, setValor]       = useState('');
  const [data, setData]         = useState(hoje());
  const [desc, setDesc]         = useState('');
  const [local, setLocal]       = useState('');
  const [catDesp, setCatDesp]   = useState('alimentacao');
  const [catRec, setCatRec]     = useState('salario');
  const [contaId, setContaId]   = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [recorrente, setRec]    = useState(false);
  const [loading, setLoading]   = useState(false);
  const [erros, setErros]       = useState<Record<string, boolean>>({});
  const [editId, setEditId]     = useState<string | null>(null);

  useEffect(() => { carregarContas(); }, []);

  useEffect(() => {
    if (contas.length > 0 && !contaId) setContaId(contas[0].id);
  }, [contas]);

  // Preencher form se editando
  useEffect(() => {
    if (txEditando) {
      setEditId(txEditando.id);
      setTipo(txEditando.tipo);
      setValor(String(txEditando.valor));
      setData(txEditando.data);
      setDesc(txEditando.descricao);
      setLocal(txEditando.local_ou_pessoa || '');
      if (txEditando.tipo === 'despesa') setCatDesp(txEditando.categoria);
      else setCatRec(txEditando.categoria);
      setContaId(txEditando.conta_id || '');
      setRec(!!txEditando.recorrente);
    } else {
      resetForm();
    }
  }, [txEditando]);

  function resetForm() {
    setEditId(null);
    setTipo('despesa');
    setValor('');
    setData(hoje());
    setDesc('');
    setLocal('');
    setCatDesp('alimentacao');
    setCatRec('salario');
    setContaId(contas[0]?.id || '');
    setParcelas(1);
    setRec(false);
    setErros({});
    setTxEditando(null);
  }

  function validar() {
    const e: Record<string, boolean> = {};
    if (!valor || parseFloat(valor) <= 0) e.valor = true;
    if (!data) e.data = true;
    if (!desc.trim()) e.desc = true;
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    if (!validar()) return;
    setLoading(true);

    const cat = tipo === 'despesa' ? catDesp : catRec;
    const payload: any = {
      tipo, data, descricao: desc.trim(),
      local_ou_pessoa: local.trim(),
      valor: parseFloat(valor),
      conta_id: contaId,
      categoria: cat,
      recorrente,
    };

    let error: any;
    if (editId) {
      ({ error } = await db.from('transacoes').update(payload).eq('id', editId));
    } else {
      const v = parseFloat(valor);
      const nParc = tipo === 'despesa' ? parcelas : 1;
      const vParc = parseFloat((v / nParc).toFixed(2));
      const grupoId = nParc > 1 ? crypto.randomUUID() : null;
      const lista = Array.from({ length: nParc }, (_, i) => {
        const dp = new Date(data + 'T00:00:00');
        dp.setMonth(dp.getMonth() + i);
        return {
          ...payload,
          valor: vParc,
          data: dp.toISOString().split('T')[0],
          parcela_atual: i + 1,
          total_parcelas: nParc,
          compra_grupo_id: grupoId,
        };
      });
      ({ error } = await db.from('transacoes').insert(lista));
    }

    setLoading(false);
    if (error) { mostrarToast(`Erro: ${error.message}`, 'err'); return; }
    mostrarToast(editId ? 'Alterações salvas ✓' : 'Salvo ✓', 'ok');
    invalidCache();
    await carregarTxs(true);
    resetForm();
    setTimeout(() => setTela('dashboard'), 600);
  }

  const catDesp_entries = Object.entries(CAT_DESP);
  const catRec_entries  = Object.entries(CAT_REC);
  const v = parseFloat(valor);
  const parcUnit = parcelas > 1 && v > 0 ? R$(v / parcelas) + ' cada' : '';

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>{editId ? 'Editar Transação' : 'Nova Transação'}</h1>
        {editId && (
          <button className={styles.cancelarEdit} onClick={resetForm}>✕ Cancelar</button>
        )}
      </header>

      {/* Toggle tipo */}
      <div className={styles.tipoSwitcher}>
        <button
          className={`${styles.tipoBtn} ${tipo === 'despesa' ? styles.tipoDesp : ''}`}
          onClick={() => setTipo('despesa')}
        >
          <span className={styles.tipoIco}>↓</span> Despesa
        </button>
        <button
          className={`${styles.tipoBtn} ${tipo === 'receita' ? styles.tipoRec : ''}`}
          onClick={() => setTipo('receita')}
        >
          <span className={styles.tipoIco}>↑</span> Receita
        </button>
      </div>

      {/* Valor */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>Valor</label>
        <div className={`${styles.valorWrap} ${tipo === 'despesa' ? styles.valorDesp : styles.valorRec} ${erros.valor ? styles.err : ''}`}>
          <span className={styles.prefix}>R$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0,00"
            value={valor}
            onChange={e => setValor(e.target.value)}
            className={styles.valorInput}
          />
        </div>
        {erros.valor && <span className="campo-erro">Informe um valor válido</span>}
      </div>

      {/* Data */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>Data</label>
        <input
          type="date"
          className={`input-base ${erros.data ? 'err' : ''}`}
          value={data}
          onChange={e => setData(e.target.value)}
        />
        {erros.data && <span className="campo-erro">Informe a data</span>}
      </div>

      {/* Descrição */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>{tipo === 'despesa' ? 'O que foi?' : 'Descrição'}</label>
        <input
          type="text"
          className={`input-base ${erros.desc ? 'err' : ''}`}
          placeholder={tipo === 'despesa' ? 'Ex: Mercado, iFood...' : 'Ex: Salário Junho...'}
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
        {erros.desc && <span className="campo-erro">Informe uma descrição</span>}
      </div>

      {/* Local/Fonte */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>{tipo === 'despesa' ? 'Onde foi?' : 'De onde veio?'}</label>
        <input
          type="text"
          className="input-base"
          placeholder={tipo === 'despesa' ? 'Ex: Supermercado Extra...' : 'Ex: Empresa XYZ...'}
          value={local}
          onChange={e => setLocal(e.target.value)}
        />
      </div>

      {/* Categoria */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>Categoria</label>
        <div className={styles.catGrid}>
          {(tipo === 'despesa' ? catDesp_entries : catRec_entries).map(([k, c]) => (
            <button
              key={k}
              type="button"
              className={`${styles.catBtn} ${(tipo === 'despesa' ? catDesp : catRec) === k ? styles.catActive : ''} ${tipo === 'receita' ? styles.catRec : ''}`}
              onClick={() => tipo === 'despesa' ? setCatDesp(k) : setCatRec(k)}
            >
              <span>{c.i}</span>
              <span className={styles.catLbl}>{c.n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conta */}
      <div className={styles.campoGrupo}>
        <label className={styles.lbl}>{tipo === 'despesa' ? 'De qual conta saiu?' : 'Para qual conta foi?'}</label>
        <select
          className="input-base select-base"
          value={contaId}
          onChange={e => setContaId(e.target.value)}
        >
          {contas.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {/* Parcelas (só despesa) */}
      {tipo === 'despesa' && !recorrente && (
        <div className={styles.campoGrupo}>
          <label className={styles.lbl}>Parcelas</label>
          <div className={styles.stepper}>
            <button type="button" className={styles.stepBtn} onClick={() => setParcelas(p => Math.max(1, p - 1))}>−</button>
            <span className={styles.stepVal}>{parcelas}x</span>
            <button type="button" className={styles.stepBtn} onClick={() => setParcelas(p => Math.min(24, p + 1))}>+</button>
            {parcUnit && <span className={styles.stepHint}>{parcUnit}</span>}
          </div>
        </div>
      )}

      {/* Recorrente */}
      <div className={styles.campoGrupo}>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLbl}>Transação recorrente</span>
            <span className={styles.toggleHint}>Repete todo mês</span>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={recorrente}
              onChange={e => {
                setRec(e.target.checked);
                if (e.target.checked) setParcelas(1);
              }}
            />
            <span className={styles.swTrack}><span className={styles.swThumb} /></span>
          </label>
        </div>
      </div>

      <button
        className={styles.btnSubmit}
        onClick={salvar}
        disabled={loading}
      >
        {loading ? '⏳' : editId ? 'Salvar Alterações' : 'Salvar'}
      </button>
    </section>
  );
}
