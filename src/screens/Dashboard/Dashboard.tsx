import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { R$, mlb, CATS, CORES, MESES_CURTOS, CAT_DESP } from '../../lib/formatters';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import styles from './Dashboard.module.css';

function filtMes(lst: any[], m: number, a: number) {
  return lst.filter(t => {
    const d = new Date(t.data + 'T00:00:00');
    return d.getMonth() === m && d.getFullYear() === a;
  });
}

const dtF = (s: string) => { const [, m, d] = s.split('-'); return `${d}/${m}`; };

function OrcRing({ pct, cor }: { pct: number; cor: string }) {
  const r = 18, c = 2 * Math.PI * r;
  const offset = c - (Math.min(pct, 100) / 100) * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--depth-4)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={cor} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--txt)">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export function Dashboard() {
  const {
    txs, contas, mes, ano, orc, assinaturas,
    navMes, setTela, setTxSelecionada,
    carregarTxs, carregarContas, carregarAssinaturas, carregarOrc,
  } = useAppStore();

  useEffect(() => {
    carregarContas();
    carregarOrc();
    carregarAssinaturas();
    carregarTxs();
  }, []);

  const doMes = filtMes(txs, mes, ano);
  const rec  = doMes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const desp = doMes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);

  const orcamentoTotal = Object.values(orc).reduce((s, v) => s + (v as number), 0) || 0;
  const pctOrcamento = orcamentoTotal > 0 ? Math.min((desp / orcamentoTotal) * 100, 100) : 0;

  const custoAssinaturas = assinaturas
    .filter(a => a.ativo)
    .reduce((s, a) => {
      if (a.periodicidade === 'mensal') return s + a.valor;
      if (a.periodicidade === 'anual')  return s + a.valor / 12;
      if (a.periodicidade === 'semanal') return s + a.valor * 4.33;
      return s;
    }, 0);

  const porCat: Record<string, number> = {};
  doMes.filter(t => t.tipo === 'despesa').forEach(t => {
    porCat[t.categoria] = (porCat[t.categoria] || 0) + t.valor;
  });
  const catLabels = Object.keys(porCat);
  const catTotal  = Object.values(porCat).reduce((s, v) => s + v, 0);

  const pieData = catLabels.map((cat, i) => ({
    name: CATS[cat]?.n || cat,
    value: porCat[cat],
    color: CORES[i % CORES.length],
  }));

  const hoje = new Date();
  const meses6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
    return { m: d.getMonth(), a: d.getFullYear(), label: MESES_CURTOS[d.getMonth()] };
  });
  const barData = meses6.map(x => ({
    label: x.label,
    rec:  filtMes(txs, x.m, x.a).filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
    desp: filtMes(txs, x.m, x.a).filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
  }));

  const orcEntries = Object.entries(orc).map(([cat, lim]) => ({
    cat,
    lim: lim as number,
    gasto: porCat[cat] || 0,
    info: CAT_DESP[cat] || { n: cat, i: '📦' },
  }));

  const saldosContas = contas
    .filter(c => {
      const tipo = (c.tipo || '').toLowerCase();
      const nome = (c.nome || '').toLowerCase();
      return tipo !== 'credito' && !nome.includes('crédito') && !nome.includes('credito');
    })
    .map((c, i) => {
      let saldo = parseFloat(String(c.saldo_inicial || c.saldo_atual || 0));
      txs.forEach(t => {
        if (t.conta_id === c.id) {
          if (t.tipo === 'receita') saldo += t.valor;
          if (t.tipo === 'despesa') saldo -= t.valor;
        }
      });
      return { ...c, saldo_calc: saldo, cor: CORES[i % CORES.length] };
    });

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <div>
          <p className={styles.saudacao}>{saudacao()}</p>
          <h1 className={styles.titulo}>Visão Geral</h1>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.mesPill} onClick={() => navMes(1)}>
            {mlb(mes, ano).split(' ')[0]} <span className={styles.chev}>▾</span>
          </div>
        </div>
      </header>

      <div className={styles.mesNav}>
        <button className={styles.arrow} onClick={() => navMes(-1)}>‹</button>
        <span className={styles.mesLabel}>{mlb(mes, ano)}</span>
        <button className={styles.arrow} onClick={() => navMes(1)}>›</button>
      </div>

      {/* CARD PRETO — Orçamento mensal */}
      <div className={styles.cardDestaque}>
        <div className={styles.cardDestaqueTop}>
          <span className={styles.cardLabel}>Orçamento Mensal</span>
          <span className={styles.cardLabelPill}>{MESES_CURTOS[mes].toUpperCase()}</span>
        </div>
        <div className={styles.cardValorMain}>{R$(orcamentoTotal || desp)}</div>
        <div className={styles.cardTrack}>
          <div
            className={`${styles.cardFill} ${pctOrcamento >= 100 ? styles.over : ''}`}
            style={{ width: `${orcamentoTotal > 0 ? pctOrcamento : 0}%` }}
          />
        </div>
        <div className={styles.cardFooterRow}>
          <div className={styles.cardFooterItem}>
            <span className={styles.cardFooterLbl}>Gasto</span>
            <span className={styles.cardFooterVal}>{R$(desp)}</span>
          </div>
          <div className={`${styles.cardFooterItem}`} style={{ alignItems: 'flex-end' }}>
            <span className={styles.cardFooterLbl}>Receitas</span>
            <span className={`${styles.cardFooterVal} ${styles.right}`} style={{ color: 'var(--grn)' }}>{R$(rec)}</span>
          </div>
        </div>
      </div>

      {/* Row rec/desp */}
      <div className={styles.kpiRow}>
        <div className={`${styles.kpiCard} ${styles.kpiRec}`}>
          <span className={styles.kpiLabel}>↑ Receitas</span>
          <div className={styles.kpiSm}>{R$(rec)}</div>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiDesp}`}>
          <span className={styles.kpiLabel}>↓ Despesas</span>
          <div className={styles.kpiSm}>{R$(desp)}</div>
        </div>
      </div>

      {/* Assinaturas */}
      {assinaturas.filter(a => a.ativo).length > 0 && (
        <button className={styles.assKpi} onClick={() => setTela('assinaturas')}>
          <span className={styles.kpiLabel}>🔄 Assinaturas Ativas</span>
          <div className={styles.assKpiRow}>
            <span className={styles.assKpiVal}>{R$(custoAssinaturas)}<small>/mês</small></span>
            <span className={styles.assKpiCount}>{assinaturas.filter(a => a.ativo).length} serviços →</span>
          </div>
        </button>
      )}

      {/* Contas */}
      {saldosContas.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}><h3>Contas</h3></div>
          <div className={styles.contasList}>
            {saldosContas.map((c, i) => (
              <div key={c.id} className={styles.contaItem} style={{ animationDelay: `${i * 40}ms` }}>
                <div className={styles.contaAvatar} style={{ '--cor': c.cor } as any}>
                  {(c.nome || '?')[0].toUpperCase()}
                </div>
                <div className={styles.contaInfo}>
                  <div className={styles.contaNome}>{c.nome}</div>
                  {c.instituicao && <div className={styles.contaInst}>{c.instituicao}</div>}
                </div>
                <div className={`${styles.contaSaldo} ${c.saldo_calc >= 0 ? styles.pos : styles.neg}`}>
                  {R$(c.saldo_calc)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orçamentos com anel */}
      {orcEntries.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}><h3>Metas de Gasto</h3></div>
          <div className={styles.orcGrid}>
            {orcEntries.map(({ cat, lim, gasto, info }) => {
              const pct = (gasto / lim) * 100;
              const cor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--ylw)' : 'var(--grn)';
              return (
                <div key={cat} className={styles.orcItem}>
                  <div className={styles.orcRing}><OrcRing pct={pct} cor={cor} /></div>
                  <div className={styles.orcInfo}>
                    <div className={styles.orcNome}>{info.i} {info.n}</div>
                    <div className={styles.orcVals}><strong>{R$(gasto)}</strong> / {R$(lim)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donut categorias */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Por Categoria</h3>
          <span className={styles.hint}>despesas do mês</span>
        </div>
        {pieData.length === 0 ? (
          <div className={styles.chartEmpty}>Sem despesas no período</div>
        ) : (
          <>
            <div className={styles.chartDonut}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => R$(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className={styles.legenda}>
              {pieData.map((entry, i) => (
                <li key={i} className={styles.legendaItem}>
                  <div className={styles.legendaL}>
                    <div className={styles.legendaDot} style={{ background: entry.color }} />
                    <span>{entry.name}</span>
                  </div>
                  <div className={styles.legendaR}>
                    <div className={styles.legendaVal}>{R$(entry.value)}</div>
                    <div className={styles.legendaPct}>{((entry.value / catTotal) * 100).toFixed(0)}%</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Barras 6 meses */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Evolução Mensal</h3>
          <span className={styles.hint}>últimos 6 meses</span>
        </div>
        <div className={styles.chartBar}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={barData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--txt-mute)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--txt-mute)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
              <Tooltip formatter={(v: any) => R$(v)} contentStyle={{ background: '#1c1d24', border: 'none', borderRadius: 10 }} />
              <Bar dataKey="rec"  name="Receitas" fill="var(--grn)" radius={[6,6,0,0]} />
              <Bar dataKey="desp" name="Despesas" fill="var(--red)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimas transações */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Últimas Transações</h3>
          <button className="btn-link" onClick={() => setTela('historico')}>Ver todas</button>
        </div>
        <ul className={styles.listaTx}>
          {doMes.slice(0, 5).map(t => {
            const info = CATS[t.categoria] || { n: t.categoria, i: '📦' };
            return (
              <li key={t.id} onClick={() => setTxSelecionada(t)}>
                <div className={styles.txIco}>{info.i}</div>
                <div className={styles.txInfo}>
                  <div className={styles.txDesc}>{t.descricao}</div>
                  <div className={styles.txMeta}>{info.n} · {dtF(t.data)}</div>
                </div>
                <div className={`${styles.txVal} ${styles[t.tipo]}`}>
                  {t.tipo === 'receita' ? '+' : '-'}{R$(t.valor)}
                </div>
              </li>
            );
          })}
          {doMes.length === 0 && (
            <li className={styles.txEmpty}><span>Nenhuma transação no período.</span></li>
          )}
        </ul>
      </div>
    </section>
  );
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
