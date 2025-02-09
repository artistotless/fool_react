import styles from "./playercards.module.scss";
import { useGame } from "src/contexts/GameContext";
import DraggableCard from "src/components/ui/Card/DraggableCard";
import { CSSProperties } from "react";

interface PlayerCardsProps {
   isDraggingEnabled?: boolean;
}

const PlayerCards = ({ isDraggingEnabled = true }: PlayerCardsProps) => {
   const { hand } = useGame();

   let gap = 154;
   const length = hand.length;

   if (length >= 30) gap = 154;
   else if (length >= 20) gap = 152;
   else if (length >= 15) gap = 148;
   else if (length >= 10) gap = 141;
   else if (length >= 8) gap = 135;
   else if (length >= 5) gap = 122;
   else if (length >= 3) gap = 90;
   else if (length >= 2) gap = 40;

   return (
      <div className={styles.cards_wrapper}>
         <div
            className={styles.root}
            id="playercards"
            style={
               {
                  "--gap": -gap + "px",
               } as CSSProperties
            }
         >
            {hand.map((card, index) => (
               <DraggableCard
                  index={index}
                  elementId={`playercard-${card.id}`}
                  draggable={isDraggingEnabled}
                  {...card}
                  key={index}
               />
            ))}
         </div>
      </div>
   );
};

export default PlayerCards;
