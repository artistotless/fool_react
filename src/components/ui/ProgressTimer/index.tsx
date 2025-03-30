import { useEffect, useRef, useState } from "react";
import styles from "./progressTimer.module.scss";

interface ProgressTimerProps {
  moveTime: string; // Формат "HH:mm:ss"
  movedAt: string; // ISO 8601 дата и время
  className?: string; // Дополнительный класс для контейнера
  updateInterval?: number; // Интервал обновления в мс (по умолчанию 10мс)
}

const ProgressTimer = ({
  moveTime,
  movedAt,
  className,
  updateInterval = 10
}: ProgressTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (moveTime && movedAt) {
      const updateProgress = () => {
        const movedAtTime = new Date(movedAt).getTime();
        const [hours, minutes, seconds] = moveTime.split(":").map(Number);
        const totalMoveTimeMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        const elapsed = Date.now() - movedAtTime;
        const newProgress = Math.min(100, (elapsed / totalMoveTimeMs * 100));
        setProgress(newProgress);
      };

      updateProgress();
      intervalRef.current = setInterval(updateProgress, updateInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [moveTime, movedAt, updateInterval]);

  const style = {
    '--progress': `${progress}%`
  } as React.CSSProperties;

  return (
    <div 
      className={`${styles.progress_container} ${progress > 30 ? styles.warning : ''} ${className || ''}`}
      style={style}
    />
  );
};

export default ProgressTimer; 