import React, { useEffect, useState } from "react";
import styles from "./TimeoutBar.module.css";

interface TimeoutBarProps {
  totalTime: number; // The total time in milliseconds
  remainingTime: number; // The remaining time in milliseconds
}

export const TimeoutBar: React.FC<TimeoutBarProps> = ({
  totalTime,
  remainingTime,
}) => {
  const [currentTime, setCurrentTime] = useState(remainingTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        return Math.max(prevTime - 60, 0);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [remainingTime]);

  const progress = (currentTime / totalTime) * 100;

  return (
    <div className={styles.timeoutBar}>
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />
    </div>
  );
};
