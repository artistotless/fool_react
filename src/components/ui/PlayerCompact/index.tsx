import { useState, useEffect } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from './playercompact.module.scss';
import LineProgressTimer from '../LineProgressTimer';
import { testMode } from 'src/environments/environment';
import useGameStore from 'src/store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';

const PlayerCompact = ({
   name,
   avatar,
   cardsCount,
   id,
}: IFoolPlayer) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   const { defenderId, moveTime, movedAt, passedPlayers, slots, activePlayers } = useGameStore();

   const isPassed = passedPlayers.includes(id);
   const unbeatenCardsCount = slots.filter(slot => slot.cards.length === 1).length;
   
   useEffect(() => {
      // Если аватарка отсутствует, загружаем случайную с DiceBear API
      if (!avatar || avatar.trim() === '') {
         // Используем id игрока как seed для получения одинаковой аватарки для одного и того же игрока
         const seed = id || name || Math.random().toString(36).substring(2, 8);
         // Можно выбрать другие стили: bottts, identicon, avataaars, human, big-smile, lorelei, pixel-art и т.д.
         const style = 'open-peeps';
         setAvatarSrc(`https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
      } else {
         setAvatarSrc(avatar);
      }
   }, [avatar, id, name]);

   // Показываем таймер только для текущего атакующего или защищающегося игрока
   const shouldShowTimer =
   // testMode().enabled ? (currentPlayer.id === attackerId || currentPlayer.id === defenderId) :
       (moveTime && movedAt && activePlayers.includes(id));

   return (
      <div className={styles.player_compact} id={`player-${id}`}>
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
         {shouldShowTimer && (
            <LineProgressTimer
               moveTime={testMode().enabled ? testMode().testMoveTime : (moveTime ?? "00:00:30")}
               movedAt={testMode().enabled ? testMode().testMovedAt : (movedAt ?? new Date().toISOString())}
               className={styles.progress}
            />
         )}
         <AnimatePresence>
            {isPassed && (
               <motion.div
                  className={styles.passed_badge}
                  initial={{ opacity: 0, top: -100 }}
                  animate={{ opacity: 1, top: 40 }}
                  exit={{ opacity: 0, top: 40 }}
                  transition={{ duration: 0.3 }}
               > 
                  {id === defenderId ? 'Беру' : (unbeatenCardsCount > 0 ? 'Пасс' : 'Бито')}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default PlayerCompact; 