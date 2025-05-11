import { useState, useEffect, useRef, useCallback } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from './playercompact.module.scss';
import LineProgressTimer from '../LineProgressTimer';
import { testMode } from 'src/environments/environment';
import useGameStore from 'src/store/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// Иконка отключения для неподключенных игроков
const DisconnectIcon = () => (
<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#e3e3e3"><path d="m666-397-52-51q16-21 24-45.5t8-50.5q0-33-14-62t-35-55l51-51q32 35 51 77.5t19 90.5q0 40-13.5 77.5T666-397ZM564-498 434-628q11-6 22.5-9t23.5-3q40 0 68 28t28 68q0 12-3 23.5t-9 22.5Zm205 206-50-52q35-42 54-93.5T792-544q0-63-24-119.5T701-765l51-51q54 55 83 125t29 147q0 70-24 135t-71 117Zm34 236L516-343v231h-72v-303L314-545q3 33 14.5 64t34.5 54l-51 51q-33-34-51.5-77T242-544q0-17 1.5-33t7.5-31l-58-58q-13 29-19 59.5t-6 62.5q0 62 24 118.5T259-324l-51 51q-54-54-83-124T96-544q0-46 10.5-90.5T139-720l-83-83 51-50 746 746-50 51Z"/></svg>
);

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
   isSingleOpponent = false,
}: IFoolPlayer & { isSingleOpponent?: boolean }) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   const playerRef = useRef<HTMLDivElement>(null);
   const { defenderId, moveTime, movedAt, passedPlayers, slots, activePlayers, winnersIds, status, connectedPlayers } = useGameStore();

   const isConnected = connectedPlayers.includes(id);
   const isPassed = passedPlayers.includes(id);
   const showBadge = isPassed;
   const badgePosition = useUpdateBadgePosition(playerRef, showBadge);
   
   // Проверяем, является ли игрок победителем
   const isWinner = winnersIds?.includes(id) && status !== 'Finished';

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
      <div className={`${styles.player_compact} ${isWinner ? styles.winner : ''} ${!isConnected ? styles.disconnected : ''} ${isSingleOpponent ? styles.single_opponent : ''}`} id={`player-${id}`} ref={playerRef}>
         <div className={styles.avatar_mini}>
            {isConnected ? (
               <img src={avatarSrc} alt={name} onError={() => {
                  // Запасной вариант, если даже DiceBear не загрузился
                  const fallbackSeed = Math.random().toString(36).substring(2, 8);
                  setAvatarSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`);
               }} />
            ) : (
               <div className={styles.disconnect_icon_container}>
                  <DisconnectIcon />
               </div>
            )}
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