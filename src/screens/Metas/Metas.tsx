import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { R$ } from '../../lib/formatters';
import { db } from '../../lib/supabase';
import type { Meta } from '../../types';
import styles from './Metas.module.css';

export function Metas() {
  const { metas, carregarMetas, mostrarToast } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'grande' | 'simples'>('grande');
  const [nome, setNome] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { carregarMetas(); }, []);

  const grandes = metas.filter(m => m.tipo === 'sonho_grande');
  const simples = metas.filter(m => m.tipo === 'lista_simples');

  function abrirModal(tipo: 'grande' | 'simples') {
    setModalTipo(tipo);
    setNome('');
    setValorAlvo('');
    setModalOpen(true);
  }

  async function salvar() {
    if (!nome.trim()) { mostrarToast('Informe o nome', 'err'); return; }
    if (modalTipo === 'grande' && (!valorAlvo || parseFloat(valorAlvo) <= 0)) {
      mostrarToast('Informe o valor alvo', 'err'); return;
    }
    setSaving(true);
    const { error } = await db.from('metas').insert([{
      titulo: nome.trim(),
      tipo: modalTipo === 'grande' ? 'sonho_grande' : 'lista_simples',
      valor_alvo: modalTipo === 'grande' ? parseFloat(valorAlvo) : null,
      valor_guardado: 0,
    }]);
    setSaving(false);
    if (error) { mostrarToast('Erro ao salvar', 'err'); return; }
    mostrarToast('Meta adicionada! 🎯', 'ok');
    setModalOpen(false);
    carregarMetas();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta meta?')) return;
    await db.from('metas').delete().eq('id', id);
    mostrarToast('Excluída', 'ok');
    carregarMetas();
  }

  async function adicionarSaldo(m: Meta) {
    const val = prompt(`Quanto guardar para "${m.titulo}"?\n(Atual: ${R$(m.valor_guardado)})`);
    if (!val) return;
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num) || num <= 0) { mostrarToast('Valor inválido', 'err'); return; }
    await db.from('metas').update({ valor_guardado: m.valor_guardado + num }).eq('id', m.id);
    mostrarToast('Guardado! 🚀', 'ok');
    carregarMetas();
  }

  async function toggleSimples(m: Meta) {
    const novo = m.valor_guardado >= 1 ? 0 : 1;
    await db.from('metas').update({ valor_guardado: novo }).eq('id', m.id);
    carregarMetas();
  }

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>Metas e Sonhos</h1>
      </header>

      {/* Alvos grandes */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Alvos Grandes</h3>
          <button className="btn-link" onClick={() => abrirModal('grande')}>+ Adicionar</button>
        </div>
        {grandes.length === 0 ? (
          <div className={styles.empty}>Nenhum alvo definido</div>
        ) : (
          <div className={styles.grid}>
            {grandes.map(m => {
              const pct = m.valor_alvo! > 0 ? Math.min((m.valor_guardado / m.valor_alvo!) * 100, 100) : 0;
              return (
                <div key={m.id} className={styles.metaCard} onClick={() => adicionarSaldo(m)}>
                  <div className={styles.metaHead}>
                    <span className={styles.metaTitulo}>{m.titulo}</span>
                    <span className={styles.metaVals}>{R$(m.valor_guardado)} / {R$(m.valor_alvo!)}</span>
                  </div>
                  <div className={styles.track}>
                    <div className={`${styles.fill} ${pct >= 100 ? styles.done : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.metaFooter}>
                    <span className={styles.metaHint}>+ Guardar dinheiro</span>
                    <button
                      className={styles.metaDel}
                      onClick={e => { e.stopPropagation(); excluir(m.id); }}
                    >Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista de desejos */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Lista de Desejos</h3>
          <button className="btn-link" onClick={() => abrirModal('simples')}>+ Adicionar</button>
        </div>
        <div className={styles.checkCard}>
          {simples.length === 0 ? (
            <div className={styles.emptyInner}>Lista vazia</div>
          ) : (
            <ul className={styles.checklist}>
              {simples.map(m => {
                const feito = m.valor_guardado >= 1;
                return (
                  <li key={m.id}>
                    <div className={`${styles.checkItem} ${feito ? styles.checkDone : ''}`} onClick={() => toggleSimples(m)}>
                      <div className={styles.checkBox}>✓</div>
                      <span className={styles.checkTexto}>{m.titulo}</span>
                    </div>
                    <button className={styles.checkDel} onClick={() => excluir(m.id)}>🗑</button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <h3 className="modal-titulo">{modalTipo === 'grande' ? '🎯 Sonho Grande' : '✅ Coisa Simples'}</h3>
            <p className="modal-sub">{modalTipo === 'grande' ? 'Ex: Casa nova, Viagem...' : 'Ex: Livro, fone de ouvido...'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <input
                type="text"
                className="input-base"
                placeholder="O que você quer?"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
              {modalTipo === 'grande' && (
                <input
                  type="number"
                  inputMode="decimal"
                  className="input-base"
                  placeholder="Valor alvo (R$)"
                  value={valorAlvo}
                  onChange={e => setValorAlvo(e.target.value)}
                />
              )}
            </div>
            <div className="modal-btns">
              <button className="mbtn mbtn-save" onClick={salvar} disabled={saving}>
                {saving ? '⏳' : 'Salvar'}
              </button>
              <button className="mbtn mbtn-close" onClick={() => setModalOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
