import styles from "./ConnectionStatus.module.css";
import { useStatus } from "../partyworks.config";

export const ConnectionStatus = () => {
  const status = useStatus();

  return (
    <div className={styles.status} data-status={status}>
      <div className={styles.statusCircle} />
      <div className={styles.statusText}>{status}</div>
    </div>
  );
};
