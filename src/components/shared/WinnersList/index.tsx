import React, { useEffect, useState, useRef } from 'react';
import styles from './winnersList.module.scss';
import useGameStore from 'src/store/gameStore';
import useConnectionStore from 'src/store/connectionStore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from 'src/contexts/UserContext';
import victorySound from '../../../assets/sounds/victory.mp3';
import { useAudio } from 'src/contexts/AudioContext';
import { Sounds } from 'src/utils/sounds';

// Компонент для отображения аватарки с поддержкой запасных вариантов
const PlayerAvatar = ({ playerId, playerName, avatar }: { playerId: string, playerName: string, avatar: string }) => {
  const [avatarSrc, setAvatarSrc] = useState<string>(avatar || '');

  useEffect(() => {
    // Если аватарка отсутствует, загружаем случайную с DiceBear API
    if (!avatar || avatar.trim() === '') {
      // Используем id игрока как seed для получения одинаковой аватарки
      const seed = playerId || playerName || Math.random().toString(36).substring(2, 8);
      const style = 'open-peeps';
      setAvatarSrc(`https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
    } else {
      setAvatarSrc(avatar);
    }
  }, [avatar, playerId, playerName]);

  return (
    <img
      src={avatarSrc}
      alt={playerName}
      onError={() => {
        // Запасной вариант, если даже DiceBear не загрузился
        const fallbackSeed = Math.random().toString(36).substring(2, 8);
        setAvatarSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`);
      }}
    />
  );
};

const WinnersList: React.FC = () => {
  const { players, winnersIds, status, clearState } = useGameStore();
  const { setHubDetails } = useConnectionStore();
  const { user } = useUser();
  const { play } = useAudio();
  const [showAnimation, setShowAnimation] = useState(false);
  const effectsTriggeredRef = useRef(false);

  // Список победителей
  const winners = players && winnersIds && Array.isArray(winnersIds)
    ? players.filter(player => winnersIds.includes(player.id))
    : [];

  // Проверяем, является ли текущий игрок победителем
  const isCurrentPlayerWinner = user && winnersIds?.includes(user.id);

  // Обработчик закрытия панели победителей
  const handleClose = () => {
    setHubDetails(null);
    clearState();
  };

  useEffect(() => {
    // Показываем анимацию только когда игра имеет статус Finished
    if (status === 'Finished' && winners.length > 0) {
      setShowAnimation(true);

      // Запускаем конфетти только если текущий игрок - победитель и эффекты еще не были запущены
      if (isCurrentPlayerWinner && !effectsTriggeredRef.current) {
        effectsTriggeredRef.current = true; // Отмечаем, что эффекты уже запущены
        play(Sounds.Victory, false, 0.5);
        launchConfetti();
      }

      // Через некоторое время скрываем анимацию конфетти
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
    
    // Сбрасываем флаг при изменении статуса игры
    return () => {
      if (status !== 'Finished') {
        effectsTriggeredRef.current = false;
      }
    };
  }, [status, winnersIds, winners, isCurrentPlayerWinner]);

  // Функция для запуска анимации конфетти
  const launchConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.zIndex = '1000';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true
    });

    const colors = ['#FFD700', '#E5C100', '#FFC0CB', '#87CEFA', '#7FFF00'];

    myConfetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['circle', 'square'],
      ticks: 200
    });

    // Удаляем canvas после завершения анимации
    setTimeout(() => {
      document.body.removeChild(canvas);
    }, 4000);
  };

  // Показываем компонент только когда игра закончена
  if (status !== 'Finished') return null;

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          className={styles.winnersListContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <h3 className={styles.title}>
            {winners.length === 1 ? 'Победитель' : 'Победители'}
          </h3>

          <ul className={styles.winnersList}>
            {winners.map((winner) => (
              <motion.li
                key={winner.id}
                className={styles.winnerItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={styles.winnerAvatar}>
                  <PlayerAvatar
                    playerId={winner.id}
                    playerName={winner.name}
                    avatar={winner.avatar}
                  />
                </div>
                <span className={styles.winnerName}>{winner.name}</span>

                {/* Добавляем особое выделение если это текущий игрок */}
                {winner.id === user.id && (
                  <div className={styles.currentPlayerBadge}>Вы</div>
                )}
              </motion.li>
            ))}
          </ul>

          <motion.button
            className={styles.closeButton}
            onClick={handleClose}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Закрыть
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
 
export default WinnersList; 