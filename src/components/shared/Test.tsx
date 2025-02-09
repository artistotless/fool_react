import animationService from "src/contexts/animationService";
import { useGame } from "src/contexts/GameContext";
import { useSignalR } from "src/contexts/SignalRContext";
import useAnimateElement, {
   animateElements,
} from "src/hooks/useAnimateElement";
import { Ranks, RankValues, Suits, SuitsSymbols } from "src/types";
import { clearTableAnimated, moveCardFromDeck } from "src/utils";

const Test = () => {
   const { clearTable, slots, addCardToHand } = useGame();
   const animate = useAnimateElement();

   const { tableCardsRef } = animationService;
   const { pass } = useSignalR();

   return (
      <div
         style={{
            position: "fixed",
            left: "0",
            top: "0",
            zIndex: 2300,
            background: "white",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
         }}
      >
          <button
          style={{'display':'none'}}
            onClick={() => {
               clearTableAnimated(tableCardsRef, () => {
                  // clearTable();
               });
            }}
         >
            Смахнуть карты со стола
         </button>
         <button
         style={{'display':'none'}}
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
         </button>
         <button
         style={{'display':'none'}}
            onClick={() => {
               moveCardFromDeck(
                  "playercards",
                  animationService.deckRef,
                  400
               );
            }}
         >
            Анимация карты из колоды
         </button>
         <button
         style={{'display':'none'}}
            onClick={() => {
               
               let randomSuit = Math.floor(Math.random() * 4)
               let randomRank = Math.floor(Math.random() * 13)

               addCardToHand({
                  suit: {iconChar : Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit]} ,
                  rank: {name: Object.values(Ranks)[randomRank], value: Object.values(RankValues)[randomRank] as number, shortName :Object.values(Ranks)[randomRank]},
                  id: Math.floor(Math.random() * 1000),
               });
            }}
         >
            Карта в руку
         </button> 
         <button onClick={pass}>
            Пасс
         </button>
      </div>
   );
};

export default Test;
