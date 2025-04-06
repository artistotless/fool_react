import { animate } from "framer-motion";
import { useRef, useState } from "react";
import animationService from "src/contexts/animationService";
import { useAudio } from "src/contexts/AudioContext";
import { useGame } from "src/contexts/GameContext";
import { testMode } from "src/environments/environment";
// import useAnimateElement, {
//    animateElements,
// } from "src/hooks/useAnimateElement";
import { Ranks, RankValues, Suits, SuitsSymbols } from "src/types";
import { clearTableAnimated, moveElementTo, Sounds } from "src/utils";

const Test = () => {
   const { clearTable, slots, addCardToSlot, addCardToHand, removeFromSlot } = useGame();
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
            right: "0",
            display: testMode().testButtons ? 'flex' : 'none',
            top: "0",
            zIndex: 2300,
            background: "#0000009e",
            padding: "10px",
            flexDirection: "row",
            gap: "5px",
         }}
      >
         <button
            onClick={() => {
               clearTableAnimated(tableCardsRef,
                  () => play(Sounds.CardSlideLeft), clearTable);
            }}
         >
            Clear
         </button>
         <button
            onClick={() => {

               slots.filter((slot) => slot.cards.length > 0).forEach((slot) => {

                  const slotElement = document.getElementById(`slot-${slot.id}`);
                  if (!slotElement) return;

                  Array.from(slotElement.children).forEach((card, index) => {
                     moveElementTo(card as HTMLElement, "playercards", 200, undefined, { x: 0, y: 800 }, () => {
                        addCardToHand(slot.cards[index]);
                        removeFromSlot(slot.id, `${slot.cards[index].suit.name}-${slot.cards[index].rank.name}`);
                        // card.remove();
                     });
                  });
               });
            }}
         >
            Down
         </button>
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
         {/* <button
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
         </button> */}

         {/* <button
            onClick={() => {
               let randomSuit = Math.floor(Math.random() * 4)
               let randomRank = Math.floor(Math.random() * 9)


               if (slots[slot].cards) {
                  setSlot(1 + (slot == 5 ? -1 : slot))
               }

               const numericRankValues = Object.values(RankValues).filter(value => typeof value === 'number') as number[];
               const suit = { iconChar: Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit] };
               const rank = { name: Object.values(Ranks)[randomRank], value: numericRankValues[randomRank] as number, shortName: Object.values(Ranks)[randomRank] };

               addCardToSlot({ suit, rank }, slot);
            }}
         >
            Карта на стол
         </button> */}
         {/* <button onClick={pass}>
            Пасс
         </button> */}

         <button
            onClick={() => {
               if (elementRef.current) {
                  elementRef.current.style.display = elementRef.current.style.display == 'none' ? 'flex' : 'none';
               }
            }}
         >
            X
         </button>
      </div>
   );
};

export default Test;
