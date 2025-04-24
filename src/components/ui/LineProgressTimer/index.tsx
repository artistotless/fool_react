import { useEffect, useRef, useState } from "react";
import styles from "./progressTimer.module.scss";

interface ProgressTimerProps {
  moveTime: string; // Формат "HH:mm:ss"
  movedAt: string; // ISO 8601 дата и время
  className?: string; // Дополнительный класс для контейнера
  updateInterval?: number; // Интервал обновления в мс (по умолчанию 10мс)
}

const LineProgressTimer = ({
  moveTime,
  movedAt,
  className,
  updateInterval = 100
}: ProgressTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (moveTime && movedAt) {
      // Сбрасываем флаг воспроизведения при новых значениях времени
      const updateProgress = () => {
        const movedAtTime = new Date(movedAt).getTime();
        const [hours, minutes, seconds] = moveTime.split(":").map(Number);
        const totalMoveTimeMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        const elapsed = Date.now() - movedAtTime;
        const remainingPercent = Math.max(0, 100 - (elapsed / totalMoveTimeMs * 100));
        setProgress(remainingPercent);
        
        // Остановка таймера при достижении 0
        if (remainingPercent === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
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
      className={`${styles.progress_container} ${progress < 60 ? styles.warning : ''} ${className || ''}`}
      style={style}
    >
      <div className={styles.progress_bar} />
    </div>
  );
};

export default LineProgressTimer; 