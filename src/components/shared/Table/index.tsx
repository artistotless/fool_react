import Card from "src/components/ui/Card";
import styles from "./table.module.scss";
import { ISlot as ISlot, useGame } from "src/contexts/GameContext";
import { useDroppable } from "@dnd-kit/core";
import animationService from "src/contexts/animationService";
import { useUser } from "src/contexts/UserContext";
import { ICard } from "src/types";

interface SlotProps {
   slot: ISlot;
   playerId: string | null,
   defenderId: string | null,
   trumpCard: ICard | null
}

const Slot = ({ slot, playerId, defenderId, trumpCard }: SlotProps, key: number) => {
   const { isOver, setNodeRef, active } = useDroppable({
      id: `slot-${slot.id}`,
      disabled: !slot.cards.length,
   });

   const isDropping = isOver && slot.cards.length;
   const draggingCard = active?.data?.current?.card as ICard;
   const isSameSuit = draggingCard?.suit.name == slot.cards[0]?.suit.name;
   const isHigherRank = draggingCard?.rank.value > slot.cards[0]?.rank.value;
   const isDefender = playerId == defenderId;
   const isTrumpCard = draggingCard?.suit.name == trumpCard?.suit.name;

   return (
      <div
         className={`${styles.slot} ${isDropping && isDefender && slot.cards.length < 2 && ((isSameSuit && isHigherRank) || isTrumpCard) ? styles.drop : ""}`}
         key={key}
         ref={setNodeRef}
      >
         {slot.cards.map((card, index) => (
            <Card
               key={index}
               {...card}
               ref={(node: HTMLDivElement | null) => {
                  if (node) {
                     animationService.tableCardsRef.current[`${slot.id}-${index}`] = node;
                  }
               }}
               randomRotate
            />
         ))}
      </div>
   );
};

const Table = () => {
   const { slots, state } = useGame();
   const { user } = useUser();

   return (
      <div className={`${styles.table_container} ${user.id != state.defenderId ? styles.drop : ""}`} >
         <div className={`${styles.table}`}>
            {slots.map((slot, index) => (
               <Slot key={index} slot={slot} trumpCard={state.trumpCard} defenderId={state.defenderId} playerId={user.id} />
            ))}
         </div>
      </div>
   );
};

export default Table;