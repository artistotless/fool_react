import React, { useState, useEffect } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from 'src/components/shared/GameField/gamefield.module.scss';

interface PlayerCompactProps extends IFoolPlayer {
   isAttacking?: boolean;
   isDefending?: boolean;
   isPassed?: boolean;
   isCurrentUser?: boolean;
   isActive?: boolean;
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
   id
}: PlayerCompactProps) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   
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
   
   let statusClass = '';
   if (isAttacking) statusClass = styles.attacking;
   if (isDefending) statusClass = styles.defending;
   if (isPassed) statusClass = styles.passed;

   return (
      <div 
         className={`${styles.player_compact} ${isCurrentUser ? styles.current : ''} ${isActive ? styles.active : ''}`}
         id={`player-${id}`}
      >
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
         {(isAttacking || isDefending || isPassed) && (
            <div className={`${styles.status_indicator} ${statusClass}`} />
         )}
      </div>
   );
};

export default PlayerCompact; 