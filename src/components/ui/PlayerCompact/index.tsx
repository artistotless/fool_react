import { useState, useEffect, useRef, useCallback } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from './playercompact.module.scss';
import LineProgressTimer from '../LineProgressTimer';
import { testMode } from 'src/environments/environment';
import useGameStore from 'src/store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useUser } from 'src/contexts/UserContext';
import { useGameService } from 'src/contexts/GameServiceContext';

// Хук для обновления позиции бэджа при прокрутке
const useUpdateBadgePosition = (
   playerRef: React.RefObject<HTMLDivElement>,
   isVisible: boolean
) => {
   const [position, setPosition] = useState({ left: 0, top: 0 });

   const updatePosition = useCallback(() => {
      if (playerRef.current) {
         const rect = playerRef.current.getBoundingClientRect();
         setPosition({
            left: rect.left + rect.width / 2,
            top: rect.top + rect.height + 5
         });
      }
   }, [playerRef]);

   useEffect(() => {
      if (!playerRef.current || !isVisible) return;

      // Начальное обновление позиции
      updatePosition();

      // Обновление позиции при скролле и изменении размера окна
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });

      // Также обновляем позицию по интервалу на случай динамических изменений в DOM
      const intervalId = setInterval(updatePosition, 300);

      return () => {
         window.removeEventListener('scroll', updatePosition);
         window.removeEventListener('resize', updatePosition);
         clearInterval(intervalId);
      };
   }, [playerRef, isVisible, updatePosition]);

   return position;
};

const PlayerCompact = ({
   name,
   avatar,
   cardsCount,
   id,
}: IFoolPlayer) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   const playerRef = useRef<HTMLDivElement>(null);
   const { defenderId, moveTime, movedAt, passedPlayers, slots, activePlayers } = useGameStore();

   const isPassed = passedPlayers.includes(id);
   const showBadge = isPassed;
   const badgePosition = useUpdateBadgePosition(playerRef, showBadge);

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
   
      const isDefender = id === defenderId;
      const allBeaten = slots.every(slot => slot.cards.length === 2 || slot.cards.length === 0) && slots.some(slot => slot.cards.length > 0);
      const hasUnbeatenCards = slots.some(slot => slot.cards.length === 1);
   
      let passBtnTitle = '';
   
      // Кнопка "Беру" - игрок в составе activePlayers и игрок является defender
      if (isDefender && !allBeaten) {
         passBtnTitle = 'Беру';
      }
      // Кнопка "Бито" - игрок в составе activePlayers и все карты на столе биты и игрок не является defender
      else if (allBeaten && !isDefender) {
         passBtnTitle = 'Бито';
      }
      // Кнопка "Пас" - игрок в составе activePlayers и на столе есть хотя бы одна небитая карта и игрок не является defender
      else if (hasUnbeatenCards && !isDefender) {
         passBtnTitle = 'Пасс';
      }

   return (
      <div className={styles.player_compact} id={`player-${id}`} ref={playerRef}>
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
         {showBadge && document.body && createPortal(
            <AnimatePresence>
               <motion.div
                  className={styles.passed_badge}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                     position: 'fixed',
                     left: badgePosition.left,
                     top: badgePosition.top,
                     transform: 'translateX(-50%)',
                     zIndex: 1000
                  }}
               >
                  {passBtnTitle}
               </motion.div>
            </AnimatePresence>,
            document.body
         )}
      </div>
   );
};

export default PlayerCompact; 