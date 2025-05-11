import { useState, useEffect } from 'react';
import useGameStore from 'src/store/gameStore';
import styles from './cancellationtimer.module.scss';
import { formatTimeLeft } from 'src/utils';

const CancellationTimer = () => {
  const { 
    cancellationTime, 
    created, 
    status, 
    connectedPlayers, 
    players 
  } = useGameStore();
  const [timeLeft, setTimeLeft] = useState<string>('--:--');

  useEffect(() => {
    if (!cancellationTime || !created || status !== 'WaitingForPlayers') return;

    // Функция для преобразования строки времени "HH:MM:SS" в миллисекунды
    const parseTimeToMs = (timeStr: string) => {
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    };

    // Функция для обновления оставшегося времени
    const updateTimeLeft = () => {
      try {
        const now = new Date();
        const createdDate = new Date(created);

        // Проверка валидности даты
        if (isNaN(createdDate.getTime())) {
          setTimeLeft('--:--');
          return;
        }

        // Рассчитываем дату отмены: created + cancellationTime
        const durationMs = parseTimeToMs(cancellationTime);
        const cancelTimeMs = createdDate.getTime() + durationMs;
        const cancelDate = new Date(cancelTimeMs);

        const diff = cancelDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('0:00');
          return;
        }

        // Форматируем время
        setTimeLeft(formatTimeLeft(diff));
      } catch (error) {
        console.error('Ошибка при рассчете времени отмены:', error);
        setTimeLeft('--:--');
      }
    };

    // Вызываем сразу и устанавливаем интервал
    updateTimeLeft();
    const intervalId = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(intervalId);
  }, [cancellationTime, created, status]);

  // Если это не начало игры или нет времени отмены, не отображаем компонент
  if (status !== 'WaitingForPlayers' || !cancellationTime || !created)
    return null;

  // Формирование информации о подключенных игроках
  const connectedCount = connectedPlayers?.length || 0;
  const totalPlayers = players?.length || 0;
  const playersRatio = `${connectedCount}/${totalPlayers}`;

  return (
    <div className={styles.cancellation_timer}>
      <div className={styles.info_panel}>
        <div className={styles.waiting_message}>
          Ожидание других игроков...
        </div>
        
        <div className={styles.players_info}>
          <div className={styles.players_icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.players_count}>
            Игроки: <span className={styles.players_ratio}>{playersRatio}</span>
          </div>
        </div>
        
        <div className={styles.time_section}>
          <div className={styles.timer_icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.timer_label}>Матч будет отменен через:</div>
          <div className={styles.time_value}>{timeLeft}</div>
        </div>
      </div>
    </div>
  );
};

export default CancellationTimer; 