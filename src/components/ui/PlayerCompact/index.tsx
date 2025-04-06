import { useState, useEffect } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from './playercompact.module.scss';

interface PlayerCompactProps extends IFoolPlayer {
   isAttacking?: boolean;
   isDefending?: boolean;
   isPassed?: boolean;
   isCurrentUser?: boolean;
   isActive?: boolean;
   isWaiting?: boolean;
   timeLeft?: number;
}

const PlayerCompact = ({
   name,
   avatar,
   cardsCount,
   isAttacking,
   isDefending,
   isPassed,
   isCurrentUser,
   isActive,
   isWaiting,
   timeLeft = 40,
   id
}: PlayerCompactProps) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   const [timer, setTimer] = useState<number>(timeLeft);

   useEffect(() => {
      // Если аватарка отсутствует, загружаем случайную с DiceBear API
      if (!avatar || avatar.trim() === '') {
         // Используем id игрока как seed для получения одинаковой аватарки для одного и того же игрока
         const seed = id || name || Math.random().toString(36).substring(2, 8);
         // Можно выбрать другие стили: bottts, identicon, avataaars, human, big-smile, lorelei, pixel-art и т.д.
         const style = 'fun-emoji';
         setAvatarSrc(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
      } else {
         setAvatarSrc(avatar);
      }
   }, [avatar, id, name]);

   useEffect(() => {
      let intervalId: NodeJS.Timeout | null = null;
      
      if (isWaiting && timer > 0) {
         intervalId = setInterval(() => {
            setTimer(prev => Math.max(0, prev - 1));
         }, 1000);
      }
      
      return () => {
         if (intervalId) clearInterval(intervalId);
      };
   }, [isWaiting, timer]);

   useEffect(() => {
      setTimer(timeLeft);
   }, [timeLeft, isWaiting]);

   let statusClass = '';
   if (isAttacking) statusClass = styles.attacking;
   if (isDefending) statusClass = styles.defending;
   if (isPassed) statusClass = styles.passed;

   const playerClass = [
      styles.player_compact,
      isCurrentUser && styles.current,
      isActive && styles.active,
      isPassed && styles.passed,
      isAttacking && styles.attacking,
      isDefending && styles.defending,
      isWaiting && styles.waiting
   ].filter(Boolean).join(' ');

   return (
      <div className={playerClass} id={`player-${id}`}>
         <div className={styles.avatar_mini}>
            <img src={avatarSrc} alt={name} onError={() => {
               // Запасной вариант, если даже DiceBear не загрузился
               const fallbackSeed = Math.random().toString(36).substring(2, 8);
               setAvatarSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`);
            }} />
         </div>
         <div className={styles.player_info}>
            <div className={styles.name}>{name}</div>
            <div className={styles.cards_count}>{cardsCount}</div>
         </div>
         {isWaiting && <div className={styles.timer_bar} style={{ width: `${(timer / timeLeft) * 100}%` }} />}
      </div>
   );
};

export default PlayerCompact; 