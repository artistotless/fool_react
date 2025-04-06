import { useRef, useState } from "react";
import animationService from "src/contexts/animationService";
import { useAudio } from "src/contexts/AudioContext";
import { useGame } from "src/contexts/GameContext";
import { testMode } from "src/environments/environment";
// import useAnimateElement, {
//    animateElements,
// } from "src/hooks/useAnimateElement";
import { Ranks, RankValues, Suits, SuitsSymbols } from "src/types";
import { clearTableAnimated, moveCardFromDeck, moveElementTo, Sounds } from "src/utils";

const Test = () => {
   const { clearTable, slots, addCardToSlot, pass, addCardToHand } = useGame();
   // const animate = useAnimateElement();
   const { play } = useAudio();
   const { tableCardsRef } = animationService;
   const [slot, setSlot] = useState(0);
   const elementRef = useRef<HTMLDivElement>(null);

   return (
      <div
         ref={elementRef}
         style={{
            position: "fixed",
            left: "0",
            display: testMode().testButtons ? 'flex' : 'none',
            top: "0",
            zIndex: 2300,
            background: "white",
            padding: "10px",
            flexDirection: "column",
            gap: "5px",
         }}
      >
         <button
            onClick={() => {
               if (elementRef.current) {
                  elementRef.current.style.display = elementRef.current.style.display == 'none' ? 'flex' : 'none';
               }
            }}
         >
            Спрятать
         </button>
         <button
            onClick={() => {
               clearTableAnimated(tableCardsRef,
                  () => play(Sounds.CardSlideLeft), clearTable);
            }}
         >
            Смахнуть карты со стола
         </button>
         {/* <button
            onClick={() => {
               animateElements(
                  tableCardsRef.current,
                  {
                     toElement: "playercards",
                     animationOptions: {
                        animationDuration: 500,
                     },
                  },
                  animate
               ).then(() => {
                  slots.forEach((slot) => {
                     addCardToHand(slot.cards);
                  });
                  clearTable();
                  tableCardsRef.current = {};
               });
            }}
         >
            Смахнуть карты игроку
         </button> */}
         {/* <button
            onClick={() => {
               moveCardFromDeck(
                  "playercards",
                  "deck",
                  400
               );
            }}
         >
            Анимация карты из колоды
         </button> */}
         <button
            onClick={() => {

               let randomSuit = Math.floor(Math.random() * 4)
               let randomRank = Math.floor(Math.random() * 9)

               const numericRankValues = Object.values(RankValues).filter(value => typeof value === 'number') as number[];
               const suit = { iconChar: Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit] };
               const rank = { name: Object.values(Ranks)[randomRank], value: numericRankValues[randomRank] as number, shortName: Object.values(Ranks)[randomRank] };

               addCardToHand({ suit, rank});
            }}
         >
            Карта в руку
         </button>

         <button
            onClick={() => {
               let randomSuit = Math.floor(Math.random() * 4)
               let randomRank = Math.floor(Math.random() * 9)


               if (slots[slot].cards) {
                  setSlot(1 + (slot == 5 ? -1 : slot))
               }

               const numericRankValues = Object.values(RankValues).filter(value => typeof value === 'number') as number[];
               const suit = { iconChar: Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit] };
               const rank = { name: Object.values(Ranks)[randomRank], value: numericRankValues[randomRank] as number, shortName: Object.values(Ranks)[randomRank] };

               addCardToSlot({ suit, rank}, slot);
            }}
         >
            Карта на стол
         </button>
         <button onClick={pass}>
            Пасс
         </button>
      </div>
   );
};

export default Test;
