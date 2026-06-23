import { useEffect, useState } from 'react';
import { db } from './lib/supabase';
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
import { Login } from './screens/Login/Login';
import styles from './App.module.css';

const EMAILS_AUTORIZADOS = [
  'antonyquinh@gmail.com',
  'an.nazari.magalhaes@gmail.com',
];

export default function App() {
  const { tela, txSelecionada } = useAppStore();
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      checarSessao(data.session);
    });

    const { data: listener } = db.auth.onAuthStateChange((_event, session) => {
      checarSessao(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function checarSessao(session: any) {
    const email = session?.user?.email;
    if (email && EMAILS_AUTORIZADOS.includes(email)) {
      setAutorizado(true);
    } else {
      setAutorizado(false);
      // Se logou com um email não autorizado, desloga na hora
      if (session) db.auth.signOut();
    }
    setCarregando(false);
  }

  if (carregando) return null; // ou um spinner, se preferir

  if (!autorizado) return <Login />;

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
