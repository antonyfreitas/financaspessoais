import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { CATS, R$, dtF, MESES_CURTOS } from '../../lib/formatters';
import styles from './Historico.module.css';

export function Historico() {
  const { txs, contas, carregarTxs, setTxSelecionada } = useAppStore();
  const [fMes, setFMes]   = useState('');
  const [fCat, setFCat]   = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fConta, setFConta] = useState('');
  const [fBusca, setFBusca] = useState('');

  useEffect(() => { carregarTxs(); }, []);

  let filtradas = txs;
  if (fMes) {
    const [a, m] = fMes.split('-').map(Number);
    filtradas = filtradas.filter(t => {
      const d = new Date(t.data + 'T00:00:00');
      return d.getFullYear() === a && d.getMonth() === m - 1;
    });
  }
  if (fCat)   filtradas = filtradas.filter(t => t.categoria === fCat);
  if (fTipo)  filtradas = filtradas.filter(t => t.tipo === fTipo);
  if (fConta) filtradas = filtradas.filter(t => t.conta_id === fConta);
  if (fBusca) filtradas = filtradas.filter(t =>
    t.descricao?.toLowerCase().includes(fBusca.toLowerCase()) ||
    t.local_ou_pessoa?.toLowerCase().includes(fBusca.toLowerCase())
  );

  const hoje = new Date();
  const mesesOpts = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MESES_CURTOS[d.getMonth()]} ${d.getFullYear()}`,
    };
  });

  function exportarCSV() {
    if (!filtradas.length) return;
    const h = ['Data','Tipo','Descrição','Valor','Categoria'];
    const rows = filtradas.map(t => [dtF(t.data), t.tipo, `"${t.descricao}"`, t.valor.toFixed(2).replace('.',','), CATS[t.categoria]?.n || t.categoria]);
    const csv = [h, ...rows].map(r => r.join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `kelo_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Histórico</h1>
        <button className={styles.exportBtn} onClick={exportarCSV}>↓ CSV</button>
      </header>

      <div className={styles.filtros}>
        <div className={styles.buscaWrap}>
          <span className={styles.buscaIco}>⌕</span>
          <input
            type="text"
            className={`input-base ${styles.buscaInput}`}
            placeholder="Buscar..."
            value={fBusca}
            onChange={e => setFBusca(e.target.value)}
          />
        </div>
        <div className={styles.filtrosRow}>
          <select className={`input-base select-base ${styles.sm}`} value={fMes} onChange={e => setFMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {mesesOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={`input-base select-base ${styles.sm}`} value={fCat} onChange={e => setFCat(e.target.value)}>
            <option value="">Categorias</option>
            <optgroup label="Despesas">
              {Object.entries(CATS).filter(([k]) => k in { alimentacao:1, transporte:1, compras:1, saude:1, moradia:1, lazer:1, educacao:1, outros:1 }).map(([k,c]) => (
                <option key={k} value={k}>{c.i} {c.n}</option>
              ))}
            </optgroup>
            <optgroup label="Receitas">
              {Object.entries(CATS).filter(([k]) => !(k in { alimentacao:1, transporte:1, compras:1, saude:1, moradia:1, lazer:1, educacao:1, outros:1 })).map(([k,c]) => (
                <option key={k} value={k}>{c.i} {c.n}</option>
              ))}
            </optgroup>
          </select>
          <select className={`input-base select-base ${styles.sm}`} value={fTipo} onChange={e => setFTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="despesa">↓ Despesa</option>
            <option value="receita">↑ Receita</option>
          </select>
          <select className={`input-base select-base ${styles.sm}`} value={fConta} onChange={e => setFConta(e.target.value)}>
            <option value="">Todas as contas</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <p className={styles.count}>
          {filtradas.length} transaç{filtradas.length !== 1 ? 'ões' : 'ão'} encontrada{filtradas.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ul className={styles.lista}>
        {filtradas.map(t => {
          const info = CATS[t.categoria] || { n: t.categoria, i: '📦' };
          return (
            <li key={t.id} onClick={() => setTxSelecionada(t)}>
              <div className={styles.ico}>{info.i}</div>
              <div className={styles.info}>
                <div className={styles.desc}>{t.descricao}</div>
                <div className={styles.meta}>{dtF(t.data)} · {info.n}</div>
              </div>
              <div className={`${styles.val} ${styles[t.tipo]}`}>
                {t.tipo === 'receita' ? '+' : '-'}{R$(t.valor)}
              </div>
            </li>
          );
        })}
        {filtradas.length === 0 && (
          <li className={styles.empty}><span>Nenhuma transação encontrada</span></li>
        )}
      </ul>
    </section>
  );
}
