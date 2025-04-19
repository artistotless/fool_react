import { useState, useEffect } from 'react';
import { IFoolPlayer } from 'src/types';
import styles from './playercompact.module.scss';
import ProgressTimer from '../ProgressTimer';
import { testMode } from 'src/environments/environment';
import useGameStore from 'src/store/gameStore';
// import { testMode } from 'src/environments/environment';
// import ProgressTimer from '../ProgressTimer';
// import useGameStore from 'src/store/gameStore';

interface PlayerCompactProps extends IFoolPlayer {
   isAttacking?: boolean;
   isDefending?: boolean;
   isPassed?: boolean;
   isCurrentUser?: boolean;
   isActive?: boolean;
   isWaiting?: boolean;
   timeLeft?: number;
   passedPlayers?: string[]; // Массив ID игроков, которые "пасанули"
   unbeatenCardsCount?: number; // Количество непобитых карт на столе
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
   id,
   passedPlayers = [],
   unbeatenCardsCount = 0
}: PlayerCompactProps) => {
   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   const [shouldShowTimer, setShouldShowTimer] = useState<boolean>(false);
   const { state } = useGameStore();

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

   // Определяем, должен ли отображаться таймер по новым правилам
   useEffect(() => {
      const isPlayerPassed = id ? passedPlayers.includes(id) : false;
      let showTimer = false;

      if(testMode().enabled) {
         showTimer = true;
      } else if (isAttacking && !isPlayerPassed && unbeatenCardsCount === 0) {
         // Таймер для атакующего, если он не в списке пасанувших
         showTimer = true;
      } else if (isDefending && !isPlayerPassed && unbeatenCardsCount > 0) {
         // Таймер для защищающегося, если он не в списке пасанувших И есть непобитые карты
         showTimer = true;
      } else if (!isAttacking && !isDefending && 
                 passedPlayers.some(pId => document.getElementById(`player-${pId}`)?.classList.contains(styles.attacking)) &&
                 !isPlayerPassed) {
         // Таймер для других игроков, если атакующий пасанул и этот игрок не пасанул
         showTimer = true;
      }
      else if (!isDefending && passedPlayers.length > 0 && passedPlayers.length === (document.querySelectorAll('[id^="player-"]').length - 1) && !isPlayerPassed) {
         showTimer = true;
      }

      setShouldShowTimer(showTimer);
   }, [id, isAttacking, isDefending, passedPlayers, unbeatenCardsCount]);


   // let statusClass = '';
   // if (isAttacking) statusClass = styles.attacking;
   // if (isDefending) statusClass = styles.defending;
   // if (isPassed) statusClass = styles.passed;

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
         {false && shouldShowTimer && (testMode().enabled || (state.moveTime && state.movedAt)) && (
               <ProgressTimer 
                  moveTime={testMode().enabled ? testMode().testMoveTime : (state.moveTime ?? "00:00:30")} 
                  movedAt={testMode().enabled ? testMode().testMovedAt : (state.movedAt ?? new Date().toISOString())}
                  className={styles.progress}
               />
            )}
      </div>
   );
};

export default PlayerCompact; 