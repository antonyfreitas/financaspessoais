import { useAppStore } from '../../store/useAppStore';
import { CATS, R$, dtF } from '../../lib/formatters';
import { db } from '../../lib/supabase';
import styles from './TxModal.module.css';

export function TxModal() {
  const {
    txSelecionada, setTxSelecionada,
    contas, txs, invalidCache, mostrarToast,
    setTxEditando, setTela,
    carregarTxs,
  } = useAppStore();

  if (!txSelecionada) return null;
  const t = txSelecionada;
  const info = CATS[t.categoria] || { n: t.categoria, i: '📦' };
  const sinal = t.tipo === 'receita' ? '+' : '-';
  const contaObj = contas.find(c => c.id === t.conta_id);
  const nomeConta = contaObj?.nome || '-';

  async function excluir() {
    if (!confirm('Excluir esta transação?')) return;
    const { error } = await db.from('transacoes').delete().eq('id', t.id);
    if (error) { mostrarToast('Erro ao excluir.', 'err'); return; }
    mostrarToast('Excluída.', 'ok');
    setTxSelecionada(null);
    invalidCache();
    await carregarTxs(true);
  }

  function editar() {
    setTxEditando(t);
    setTxSelecionada(null);
    setTela('lancamento');
  }

  return (
    <div className="modal-overlay" onClick={() => setTxSelecionada(null)}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-drag" />
        <h3 className="modal-titulo">{info.i} {t.descricao}</h3>
        <div className={styles.body}>
          <Row label="Valor">
            <span style={{ color: t.tipo === 'receita' ? 'var(--grn)' : 'var(--red)' }}>
              {sinal}{R$(t.valor)}
            </span>
          </Row>
          <Row label="Data">{dtF(t.data)}</Row>
          <Row label="Tipo"><span style={{ textTransform: 'capitalize' }}>{t.tipo}</span></Row>
          <Row label="Categoria">{info.n}</Row>
          <Row label="Conta"><span style={{ color: 'var(--acc)' }}>{nomeConta}</span></Row>
          {t.local_ou_pessoa && <Row label="Local/Pessoa">{t.local_ou_pessoa}</Row>}
          {(t.total_parcelas || 0) > 1 && (
            <Row label="Parcela">{t.parcela_atual}/{t.total_parcelas}</Row>
          )}
          {t.recorrente && (
            <Row label="Recorrência"><span style={{ color: 'var(--acc)' }}>↻ Mensal</span></Row>
          )}
        </div>
        <div className="modal-btns">
          <button className="mbtn mbtn-edit" onClick={editar}>✏ Editar</button>
          <button className="mbtn mbtn-del" onClick={excluir}>🗑 Excluir</button>
        </div>
        <button className="mbtn mbtn-close" onClick={() => setTxSelecionada(null)}>Fechar</button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--brd-lo)' }}>
      <span style={{ color: 'var(--txt-mute)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{children}</span>
    </div>
  );
}
