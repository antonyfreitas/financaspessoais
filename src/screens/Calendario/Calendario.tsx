import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { R$, MESES, CORES } from '../../lib/formatters';
import styles from './Calendario.module.css';

interface DiaInfo {
  date: Date;
  txs: any[];
  assinaturas: any[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function Calendario() {
  const { txs, assinaturas, carregarTxs, carregarAssinaturas, setTxSelecionada } = useAppStore();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<DiaInfo | null>(null);

  useEffect(() => {
    carregarTxs();
    carregarAssinaturas();
  }, []);

  function navMes(dir: -1 | 1) {
    let nm = mes + dir, na = ano;
    if (nm < 0) { nm = 11; na--; }
    if (nm > 11) { nm = 0; na++; }
    setMes(nm);
    setAno(na);
    setDiaSelecionado(null);
  }

  // Gera grade do mês
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia   = new Date(ano, mes + 1, 0);
  const startDay    = primeiroDia.getDay(); // 0=Dom
  const totalCells  = Math.ceil((startDay + ultimoDia.getDate()) / 7) * 7;

  const dias: DiaInfo[] = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(ano, mes, i - startDay + 1);
    const iso = d.toISOString().split('T')[0];

    const txsDia = txs.filter(t => t.data === iso);
    const assDia = assinaturas.filter(a => {
      if (!a.ativo) return false;
      if (!a.dia_cobranca) return false;
      return a.dia_cobranca === d.getDate() && d.getMonth() === mes;
    });

    return {
      date: d,
      txs: txsDia,
      assinaturas: assDia,
      isToday: d.toDateString() === hoje.toDateString(),
      isCurrentMonth: d.getMonth() === mes,
    };
  });

  // Próximas cobranças (assinaturas)
  const proximasCobrancas = assinaturas
    .filter(a => a.ativo && a.dia_cobranca)
    .map(a => {
      const dia = a.dia_cobranca!;
      let dataCobranca = new Date(ano, mes, dia);
      if (dataCobranca < hoje) dataCobranca = new Date(ano, mes + 1, dia);
      return { ...a, dataCobranca };
    })
    .sort((a, b) => a.dataCobranca.getTime() - b.dataCobranca.getTime())
    .slice(0, 5);

  // Gastos fixos do mês (txs recorrentes)
  const recorrentes = txs.filter(t => t.recorrente).slice(0, 5);

  const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Agenda Financeira</h1>
      </header>

      {/* Nav mês */}
      <div className={styles.mesNav}>
        <button className={styles.arrow} onClick={() => navMes(-1)}>‹</button>
        <span className={styles.mesLabel}>{MESES[mes]} {ano}</span>
        <button className={styles.arrow} onClick={() => navMes(1)}>›</button>
      </div>

      {/* Calendário grid */}
      <div className={styles.calCard}>
        <div className={styles.semanaLabels}>
          {DIAS_SEMANA.map((d, i) => (
            <div key={i} className={styles.semanaLabel}>{d}</div>
          ))}
        </div>
        <div className={styles.calGrid}>
          {dias.map((dia, i) => {
            const temDesp = dia.txs.some(t => t.tipo === 'despesa');
            const temRec  = dia.txs.some(t => t.tipo === 'receita');
            const temAss  = dia.assinaturas.length > 0;
            const isSel   = diaSelecionado?.date.toDateString() === dia.date.toDateString();

            return (
              <button
                key={i}
                className={`
                  ${styles.diaCell}
                  ${!dia.isCurrentMonth ? styles.outMonth : ''}
                  ${dia.isToday ? styles.today : ''}
                  ${isSel ? styles.selected : ''}
                `}
                onClick={() => setDiaSelecionado(dia)}
              >
                <span className={styles.diaNr}>{dia.date.getDate()}</span>
                <div className={styles.dotRow}>
                  {temDesp && <span className={styles.dotRed} />}
                  {temRec  && <span className={styles.dotGrn} />}
                  {temAss  && <span className={styles.dotAcc} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className={styles.legenda}>
          <span><span className={styles.dotRed} /> Despesa</span>
          <span><span className={styles.dotGrn} /> Receita</span>
          <span><span className={styles.dotAcc} /> Assinatura</span>
        </div>
      </div>

      {/* Painel do dia selecionado */}
      {diaSelecionado && (
        <div className={styles.diaPanel}>
          <h3 className={styles.diaPanelTitulo}>
            {diaSelecionado.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {diaSelecionado.assinaturas.length > 0 && (
            <div className={styles.panelSection}>
              <span className={styles.panelLabel}>🔄 Cobranças</span>
              {diaSelecionado.assinaturas.map(a => (
                <div key={a.id} className={styles.assItem}>
                  <div className={styles.assAvatar} style={{ background: a.cor || '#7c6ff7' }}>
                    {a.nome[0].toUpperCase()}
                  </div>
                  <span className={styles.assNome}>{a.nome}</span>
                  <span className={styles.assValor} style={{ color: 'var(--red)' }}>-{R$(a.valor)}</span>
                </div>
              ))}
            </div>
          )}

          {diaSelecionado.txs.length > 0 ? (
            <div className={styles.panelSection}>
              <span className={styles.panelLabel}>📋 Transações</span>
              {diaSelecionado.txs.map(t => (
                <div key={t.id} className={styles.txItem} onClick={() => setTxSelecionada(t)}>
                  <span className={styles.txDesc}>{t.descricao}</span>
                  <span className={`${styles.txVal} ${t.tipo === 'receita' ? styles.grn : styles.red}`}>
                    {t.tipo === 'receita' ? '+' : '-'}{R$(t.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : diaSelecionado.assinaturas.length === 0 && (
            <p className={styles.vazio}>Nenhum evento neste dia.</p>
          )}
        </div>
      )}

      {/* Próximas cobranças */}
      {proximasCobrancas.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}><h3>Próximas Cobranças</h3></div>
          <div className={styles.cobrancasList}>
            {proximasCobrancas.map((a, i) => {
              const diasAte = Math.ceil((a.dataCobranca.getTime() - hoje.getTime()) / 86400000);
              return (
                <div key={a.id} className={styles.cobrancaItem}>
                  <div className={styles.cobrancaAvatar} style={{ background: a.cor || CORES[i % CORES.length] }}>
                    {a.nome[0].toUpperCase()}
                  </div>
                  <div className={styles.cobrancaInfo}>
                    <div className={styles.cobrancaNome}>{a.nome}</div>
                    <div className={styles.cobrancaData}>
                      {diasAte === 0 ? 'Hoje!' : diasAte === 1 ? 'Amanhã' : `Em ${diasAte} dias`}
                    </div>
                  </div>
                  <div className={`${styles.cobrancaVal} ${styles.red}`}>-{R$(a.valor)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transações recorrentes */}
      {recorrentes.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}><h3>Gastos Fixos</h3></div>
          <div className={styles.cobrancasList}>
            {recorrentes.map(t => (
              <div key={t.id} className={styles.cobrancaItem} onClick={() => setTxSelecionada(t)} style={{ cursor: 'pointer' }}>
                <div className={styles.recIco}>↻</div>
                <div className={styles.cobrancaInfo}>
                  <div className={styles.cobrancaNome}>{t.descricao}</div>
                  <div className={styles.cobrancaData}>Recorrente mensal</div>
                </div>
                <div className={`${styles.cobrancaVal} ${t.tipo === 'receita' ? styles.grn : styles.red}`}>
                  {t.tipo === 'receita' ? '+' : '-'}{R$(t.valor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
