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
   const { state, addCardToHand } = useGameStore();
   const { user } = useUser();

   // Количество карт в колоде
   const deckCount = state.deckCardsCount || 0;

   // Рефы для контейнера игроков и проверки возможности скроллинга
   const playersContainerRef = useRef<HTMLDivElement>(null);
   const [canScrollLeft, setCanScrollLeft] = useState(false);
   const [canScrollRight, setCanScrollRight] = useState(false);
   const [needScroll, setNeedScroll] = useState(false);

   // Функция для проверки возможности скроллинга влево и вправо
   const checkScrollability = () => {
      const container = playersContainerRef.current;
      if (container) {
         // Проверяем, нужен ли скроллинг вообще
         const needToScroll = container.scrollWidth > container.clientWidth;
         setNeedScroll(needToScroll);

         setCanScrollLeft(container.scrollLeft > 0);
         setCanScrollRight(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 5
         );
      }
   };

   // Обработчик прокрутки влево
   const scrollLeft = () => {
      const container = playersContainerRef.current;
      if (container) {
         container.scrollBy({
            left: -100,
            behavior: 'smooth'
         });
      }
   };

   // Обработчик прокрутки вправо
   const scrollRight = () => {
      const container = playersContainerRef.current;
      if (container) {
         container.scrollBy({
            left: 100,
            behavior: 'smooth'
         });
      }
   };

   // Проверка скроллинга при инициализации и изменении размера окна
   useEffect(() => {
      // Начальная проверка возможности скроллинга
      const initialCheck = () => {
         checkScrollability();
      };

      // Проверяем после полной загрузки DOM и изображений
      window.addEventListener('load', initialCheck);

      // Резервный таймаут на случай, если событие load уже произошло
      const timer = setTimeout(initialCheck, 500);

      const handleResize = () => {
         checkScrollability();
      };

      // Добавляем слушатель для скроллинга контейнера
      const handleScroll = () => {
         checkScrollability();
      };

      const container = playersContainerRef.current;
      if (container) {
         container.addEventListener('scroll', handleScroll);
      }

      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('load', initialCheck);
         window.removeEventListener('resize', handleResize);
         clearTimeout(timer);
         if (container) {
            container.removeEventListener('scroll', handleScroll);
         }
      };
   }, []);

   let isRed = state.trumpCard?.suit.iconChar == SuitsSymbols.Diamond || state.trumpCard?.suit.iconChar == SuitsSymbols.Heart;

   // Проверяем скроллинг при изменении количества игроков
   useEffect(() => {
      checkScrollability();
   }, [state.players.length]);

   const testDeckMethod = () => {
      if (testMode().enabled) {
         moveCardFromDeck("playercards", "deck", 300, () => {
            addCardToHand(createRandomCard());
         });
      }
   }

   return (
      <div className={styles.top_panel}>
         <div className={styles.left_section}>
            <div className={styles.deck_info}>
               <div onClick={testDeckMethod}
                  className={styles.deck_container} id="deck">
                  <img src={cardBack} alt="Колода" className={styles.deck_image} />
                  {state.trumpCard && (
                     <div className={`${styles.trump_overlay} ${isRed ? styles.dark : ''}`}>
                        <div className={`${styles.trump_suit} ${isRed ? styles.red : ''}`}>{state.trumpCard.suit.iconChar}</div>
                     </div>
                  )}
               </div>
               <div className={styles.deck_count}>{deckCount}</div>
            </div>

            {/* <div className={styles.action_buttons}>
               <button className={styles.action_button} onClick={pass}>
                  Пасс
               </button>
               <button className={`${styles.action_button} ${styles.take}`}>
                  Взять
               </button>
            </div> */}
         </div>

         <div className={styles.center_section}>
            {needScroll && (
               <div
                  className={`${styles.scroll_arrow} ${styles.left} ${canScrollLeft ? styles.visible : ''}`}
                  onClick={scrollLeft}
               >
                  &#8249;
               </div>
            )}

            <div
               className={styles.players_compact}
               ref={playersContainerRef}
            >
               {state.players.map((player, index) => (
                  <PlayerCompact
                     key={index}
                     {...player}
                     isCurrentUser={player.id === user.id}
                     isActive={player.id === state.attackerId}
                     isAttacking={player.id === state.attackerId}
                     isDefending={player.id === state.defenderId}
                     isPassed={player.passed}
                     isWaiting={true}
                  />
               ))}
            </div>

            {needScroll && (
               <div
                  className={`${styles.scroll_arrow} ${styles.right} ${canScrollRight ? styles.visible : ''}`}
                  onClick={scrollRight}
               >
                  &#8250;
               </div>
            )}
         </div>
      </div>
   );
};

export default TopPanel; 