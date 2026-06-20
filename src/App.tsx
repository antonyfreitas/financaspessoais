import { useAppStore } from './store/useAppStore';
import { Nav } from './components/Nav/Nav';
import { Toast } from './components/Toast/Toast';
import { TxModal } from './components/Modal/TxModal';
import { Dashboard } from './screens/Dashboard/Dashboard';
import { Lancamento } from './screens/Lancamento/Lancamento';
import { Historico } from './screens/Historico/Historico';
import { Calendario } from './screens/Calendario/Calendario';
import { Assinaturas } from './screens/Assinaturas/Assinaturas';
import { Metas } from './screens/Metas/Metas';
import styles from './App.module.css';

export default function App() {
  const { tela, txSelecionada } = useAppStore();

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        {tela === 'dashboard'   && <Dashboard />}
        {tela === 'lancamento'  && <Lancamento />}
        {tela === 'historico'   && <Historico />}
        {tela === 'calendario'  && <Calendario />}
        {tela === 'assinaturas' && <Assinaturas />}
        {tela === 'metas'       && <Metas />}
      </main>

      <Nav />
      <Toast />
      {txSelecionada && <TxModal />}
    </div>
  );
}
