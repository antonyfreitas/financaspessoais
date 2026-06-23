import { db } from '../../lib/supabase';
import styles from './Login.module.css';

export function Login() {
  const entrarComGoogle = async () => {
    await db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className={styles.tela}>
      <div className={styles.card}>
        <h1 className={styles.titulo}>Minhas Finanças</h1>
        <p className={styles.sub}>Acesso restrito</p>
        <button className={styles.btnGoogle} onClick={entrarComGoogle}>
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
