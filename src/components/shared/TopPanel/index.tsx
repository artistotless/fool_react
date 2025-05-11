import { useState, useEffect, useRef } from 'react';
import styles from './toppanel.module.scss';
import { useUser } from 'src/contexts/UserContext';
import PlayerCompact from 'src/components/ui/PlayerCompact';
import cardBack from 'src/assets/cards/backs/blue.png';
import { SuitsSymbols } from 'src/types';
import { createRandomCard, moveCardFromDeck } from 'src/utils';
import { testMode } from 'src/environments/environment';
import useGameStore from 'src/store/gameStore';

const TopPanel = () => {
   const {
      players,
      addCardToHand,
      deckCardsCount,
      trumpCard,
   } = useGameStore();
   
   const { user } = useUser();

   // Рефы для контейнера игроков и проверки возможности скроллинга
   const playersContainerRef = useRef<HTMLDivElement>(null);
   const [isMobile, setIsMobile] = useState(false);

   // Проверка, является ли устройство мобильным
   useEffect(() => {
      const checkMobile = () => {
         setIsMobile(window.innerWidth <= 768);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

      return () => {
         window.removeEventListener('resize', checkMobile);
      };
   }, []);

   let isRed = trumpCard?.suit.iconChar == SuitsSymbols.Diamond || trumpCard?.suit.iconChar == SuitsSymbols.Heart;

   const testDeckMethod = () => {
      if (testMode().enabled) {
         moveCardFromDeck("playercards", "deck", 300, () => {
            addCardToHand(createRandomCard());
         });
      }
   }

   // Фильтруем список игроков, исключая текущего игрока
   const opponents = players.filter(player => player.id !== user.id);
   const isSingleOpponent = opponents.length === 1;

   return (
      <div className={`${styles.top_panel} ${isMobile ? styles.mobile : ''}`}>
         <div className={styles.left_section}>
            <div className={styles.deck_info}>
               <div onClick={testDeckMethod}
                  className={styles.deck_container} id="deck">
                  <img src={cardBack} alt="Колода" className={styles.deck_image} />
                  {trumpCard && (
                     <div className={`${styles.trump_overlay} ${isRed ? styles.dark : ''}`}>
                        <div className={`${styles.trump_suit} ${isRed ? styles.red : ''}`}>{trumpCard.suit.iconChar}</div>
                     </div>
                  )}
               </div>
               <div className={styles.deck_count}>{deckCardsCount}</div>
            </div>
         </div>

         <div className={styles.center_section}>
            <div
               className={styles.players_compact}
               ref={playersContainerRef}
            >
               {opponents.map((player, _) => (
                  <PlayerCompact
                     key={player.id}
                     {...player}
                     isSingleOpponent={isSingleOpponent}
                  />
               ))}
            </div>
         </div>
      </div>
   );
};

export default TopPanel; 