import { useOthers, useSelf } from "../partyworks.config";
import { getProfileUrl } from "../utils/getProfileUrl";
import styles from "./Players.module.css";

export const Players = () => {
  const others = useOthers();
  const self = useSelf();

  return (
    <>
      <div className={styles.container}>
        {self && (
          <div className={styles.userContainer}>
            <img
              className={styles.userProfileImg}
              src={getProfileUrl(self.info)}
              alt="user profile img"
            />
            <div className={styles.userProfileName}>
              {self.info.username} {"(you)"}
            </div>
          </div>
        )}
        {others.map((other) => {
          return (
            <div className={styles.userContainer} key={other.userId}>
              <img
                className={styles.userProfileImg}
                src={getProfileUrl(other.info)}
                alt="user profile img"
              />
              <div className={styles.userProfileName}>
                {other.info.username}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
