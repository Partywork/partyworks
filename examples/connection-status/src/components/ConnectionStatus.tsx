import styles from "./ConnectionStatus.module.css";
import { useOthers, useStatus } from "../partyworks.config";

export const ConnectionStatus = () => {
  const status = useStatus();
  const activeUsersCount = useOthers((others) => others.length + 1);

  return (
    <div>
      <p className={styles.userCount}>{activeUsersCount} active users</p>
      <div className={styles.status} data-status={status}>
        <div className={styles.statusCircle} />
        <div className={styles.statusText}>{status}</div>
      </div>
    </div>
  );
};
