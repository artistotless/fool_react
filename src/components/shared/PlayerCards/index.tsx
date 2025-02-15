import styles from "./playercards.module.scss";
import DraggableCard from "src/components/ui/Card/DraggableCard";
import { CSSProperties } from "react";
import { ICard } from "src/types";

interface PlayerCardsProps {
   isDraggingEnabled?: boolean;
   cards: ICard[]
}

const PlayerCards = (props: PlayerCardsProps) => {
   let gap = 154;
   const length = props.cards.length;
   const cards = props.cards && props.cards.length ? props.cards : []

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
            {cards.map((card, index) => (
               <DraggableCard
                  index={index}
                  elementId={`playercard-${index}`}
                  draggable={props.isDraggingEnabled}
                  {...card}
                  key={index}
               />
            ))}
         </div>
      </div>
   );
};

export default PlayerCards;
