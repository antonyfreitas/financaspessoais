import { useAppStore } from '../../store/useAppStore';
import styles from './Toast.module.css';

export function Toast() {
  const { toast } = useAppStore();
  if (!toast.visible) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.tipo]}`}>
      {toast.msg}
    </div>
  );
}
