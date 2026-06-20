import { useAppStore } from '../../store/useAppStore';
import styles from './Nav.module.css';

type Tab = { id: string; icon: string; label: string };

const TABS: Tab[] = [
  { id: 'dashboard',   icon: '◈',  label: 'Início'    },
  { id: 'calendario',  icon: '📅', label: 'Agenda'    },
  { id: 'lancamento',  icon: '+',  label: ''           },
  { id: 'assinaturas', icon: '🔄', label: 'Assina'    },
  { id: 'historico',   icon: '≡',  label: 'Histórico' },
];

export function Nav() {
  const { tela, setTela } = useAppStore();

  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.btn} ${tela === tab.id ? styles.active : ''}`}
          onClick={() => setTela(tab.id as any)}
          aria-label={tab.label || 'Nova transação'}
        >
          {tab.id === 'lancamento' ? (
            <span className={styles.fab}>{tab.icon}</span>
          ) : (
            <>
              <span className={styles.ico}>{tab.icon}</span>
              <span className={styles.lbl}>{tab.label}</span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
}
