import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { R$, ASS_CORES, PERIODICIDADE_LABEL } from '../../lib/formatters';
import { db } from '../../lib/supabase';
import type { Assinatura, Periodicidade } from '../../types';
import styles from './Assinaturas.module.css';

const ICONES_SUGESTAO = ['🎬', '🎵', '☁️', '📺', '🎮', '📰', '💪', '📦', '🌐', '🎙️', '📚', '🔒'];

interface FormState {
  nome: string;
  valor: string;
  periodicidade: Periodicidade;
  dia_cobranca: string;
  cor: string;
}

const FORM_INICIAL: FormState = {
  nome: '',
  valor: '',
  periodicidade: 'mensal',
  dia_cobranca: '',
  cor: ASS_CORES[0],
};

export function Assinaturas() {
  const { assinaturas, carregarAssinaturas, mostrarToast } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Assinatura | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { carregarAssinaturas(); }, []);

  const ativas   = assinaturas.filter(a => a.ativo);
  const inativas = assinaturas.filter(a => !a.ativo);

  const custoMensal = ativas.reduce((s, a) => {
    if (a.periodicidade === 'mensal')  return s + a.valor;
    if (a.periodicidade === 'anual')   return s + a.valor / 12;
    if (a.periodicidade === 'semanal') return s + a.valor * 4.33;
    return s;
  }, 0);
  const custoAnual = custoMensal * 12;

  function abrirNova() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setModalOpen(true);
  }

  function abrirEditar(a: Assinatura) {
    setEditando(a);
    setForm({
      nome: a.nome,
      valor: String(a.valor),
      periodicidade: a.periodicidade,
      dia_cobranca: String(a.dia_cobranca || ''),
      cor: a.cor || ASS_CORES[0],
    });
    setModalOpen(true);
  }

  async function salvar() {
    if (!form.nome.trim() || !form.valor || parseFloat(form.valor) <= 0) {
      mostrarToast('Preencha nome e valor', 'err');
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      valor: parseFloat(form.valor),
      periodicidade: form.periodicidade,
      dia_cobranca: parseInt(form.dia_cobranca) || null,
      cor: form.cor,
      ativo: true,
    };

    let error: any;
    if (editando) {
      ({ error } = await db.from('assinaturas').update(payload).eq('id', editando.id));
    } else {
      ({ error } = await db.from('assinaturas').insert([payload]));
    }
    setSaving(false);
    if (error) { mostrarToast('Erro ao salvar', 'err'); return; }
    mostrarToast(editando ? 'Atualizado ✓' : 'Assinatura adicionada ✓', 'ok');
    setModalOpen(false);
    carregarAssinaturas();
  }

  async function toggleAtivo(a: Assinatura) {
    const { error } = await db.from('assinaturas').update({ ativo: !a.ativo }).eq('id', a.id);
    if (!error) carregarAssinaturas();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta assinatura?')) return;
    await db.from('assinaturas').delete().eq('id', id);
    mostrarToast('Excluída', 'ok');
    carregarAssinaturas();
  }

  return (
    <section className={styles.tela}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.titulo}>Assinaturas</h1>
          <p className={styles.sub}>Serviços recorrentes</p>
        </div>
        <button className={styles.addBtn} onClick={abrirNova}>+ Nova</button>
      </header>

      {/* Resumo custo */}
      {ativas.length > 0 && (
        <div className={styles.resumo}>
          <div className={styles.resumoItem}>
            <span className={styles.resumoLabel}>Custo Mensal</span>
            <span className={styles.resumoVal}>{R$(custoMensal)}</span>
          </div>
          <div className={styles.resumoDivider} />
          <div className={styles.resumoItem}>
            <span className={styles.resumoLabel}>Custo Anual</span>
            <span className={styles.resumoValSm}>{R$(custoAnual)}</span>
          </div>
          <div className={styles.resumoDivider} />
          <div className={styles.resumoItem}>
            <span className={styles.resumoLabel}>Ativas</span>
            <span className={styles.resumoCount}>{ativas.length}</span>
          </div>
        </div>
      )}

      {/* Lista ativas */}
      {ativas.length === 0 ? (
        <div className={styles.empty}>
          <span>🔄</span>
          <p>Nenhuma assinatura ativa</p>
          <button className={styles.emptyBtn} onClick={abrirNova}>Adicionar primeira</button>
        </div>
      ) : (
        <div className={styles.lista}>
          {ativas.map((a, i) => (
            <AssCard
              key={a.id}
              ass={a}
              delay={i * 50}
              onEdit={() => abrirEditar(a)}
              onToggle={() => toggleAtivo(a)}
              onDelete={() => excluir(a.id)}
            />
          ))}
        </div>
      )}

      {/* Inativas */}
      {inativas.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}><h3>Pausadas</h3></div>
          <div className={styles.lista}>
            {inativas.map((a, i) => (
              <AssCard
                key={a.id}
                ass={a}
                delay={i * 50}
                inativa
                onEdit={() => abrirEditar(a)}
                onToggle={() => toggleAtivo(a)}
                onDelete={() => excluir(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-drag" />
            <h3 className="modal-titulo">{editando ? 'Editar Assinatura' : 'Nova Assinatura'}</h3>

            <div className={styles.formGrupo}>
              <label className={styles.formLbl}>Nome do serviço</label>
              <input
                type="text"
                className="input-base"
                placeholder="Ex: Netflix, Spotify..."
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGrupo} style={{ flex: 1 }}>
                <label className={styles.formLbl}>Valor (R$)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input-base"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div className={styles.formGrupo} style={{ flex: 1 }}>
                <label className={styles.formLbl}>Periodicidade</label>
                <select
                  className="input-base select-base"
                  value={form.periodicidade}
                  onChange={e => setForm(f => ({ ...f, periodicidade: e.target.value as Periodicidade }))}
                >
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>
            </div>

            <div className={styles.formGrupo}>
              <label className={styles.formLbl}>Dia de cobrança (opcional)</label>
              <input
                type="number"
                min="1" max="31"
                className="input-base"
                placeholder="Ex: 15"
                value={form.dia_cobranca}
                onChange={e => setForm(f => ({ ...f, dia_cobranca: e.target.value }))}
              />
            </div>

            <div className={styles.formGrupo}>
              <label className={styles.formLbl}>Cor</label>
              <div className={styles.coresPicker}>
                {ASS_CORES.map(cor => (
                  <button
                    key={cor}
                    className={`${styles.corBtn} ${form.cor === cor ? styles.corSel : ''}`}
                    style={{ background: cor }}
                    onClick={() => setForm(f => ({ ...f, cor }))}
                  />
                ))}
              </div>
            </div>

            <div className="modal-btns" style={{ marginTop: '1.5rem' }}>
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

function AssCard({
  ass, delay, inativa = false, onEdit, onToggle, onDelete
}: {
  ass: Assinatura;
  delay: number;
  inativa?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cor = ass.cor || '#7c6ff7';
  const [open, setOpen] = useState(false);

  const valorMensal = ass.periodicidade === 'anual' ? ass.valor / 12
    : ass.periodicidade === 'semanal' ? ass.valor * 4.33
    : ass.valor;

  return (
    <div
      className={`${styles.assCard} ${inativa ? styles.assInativa : ''}`}
      style={{ animationDelay: `${delay}ms`, '--cor': cor } as any}
    >
      <div className={styles.assLeft} onClick={() => setOpen(o => !o)}>
        <div className={styles.assAvatar}>{ass.nome[0].toUpperCase()}</div>
        <div className={styles.assInfo}>
          <div className={styles.assNome}>{ass.nome}</div>
          <div className={styles.assPerio}>
            {PERIODICIDADE_LABEL[ass.periodicidade]}
            {ass.dia_cobranca ? ` · dia ${ass.dia_cobranca}` : ''}
          </div>
        </div>
        <div className={styles.assValores}>
          <div className={styles.assValPrincipal}>{R$(ass.valor)}</div>
          {ass.periodicidade !== 'mensal' && (
            <div className={styles.assValSec}>{R$(valorMensal)}/mês</div>
          )}
        </div>
      </div>

      {open && (
        <div className={styles.assAcoes}>
          <button className={styles.acaoBtn} onClick={onEdit}>✏ Editar</button>
          <button className={styles.acaoBtn} onClick={onToggle}>
            {inativa ? '▶ Ativar' : '⏸ Pausar'}
          </button>
          <button className={`${styles.acaoBtn} ${styles.acaoDel}`} onClick={onDelete}>🗑 Excluir</button>
        </div>
      )}
    </div>
  );
}
