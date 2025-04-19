import { useEffect, useRef, useState } from "react";
import styles from "./progressTimer.module.scss";

import { useAudio } from "src/contexts/AudioContext";
import { Sounds } from "src/utils/sounds";

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
  updateInterval = 100
}: ProgressTimerProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(100);
  const { play, stop } = useAudio();
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (moveTime && movedAt) {
      // Сбрасываем флаг воспроизведения при новых значениях времени
      soundPlayedRef.current = false;
      
      const updateProgress = () => {
        const movedAtTime = new Date(movedAt).getTime();
        const [hours, minutes, seconds] = moveTime.split(":").map(Number);
        const totalMoveTimeMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        const elapsed = Date.now() - movedAtTime;
        const remainingPercent = Math.max(0, 100 - (elapsed / totalMoveTimeMs * 100));
        setProgress(remainingPercent);
        
        // Управление звуком тикания часов
        if (remainingPercent <= 60 && !soundPlayedRef.current) {
          play(Sounds.Timer, true);
          soundPlayedRef.current = true;
        }
        
        if(remainingPercent > 60 && soundPlayedRef.current) {
          stop(Sounds.Timer.id);
          soundPlayedRef.current = false;
        }
        
        // Остановка таймера при достижении 0
        if (remainingPercent === 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          stop(Sounds.Timer.id);
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
  }, [moveTime, movedAt, updateInterval, play]);

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

export default ProgressTimer; 