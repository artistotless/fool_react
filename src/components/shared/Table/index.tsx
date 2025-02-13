import Card from "src/components/ui/Card";
import styles from "./table.module.scss";
import { ISlot as ISlot, useGame } from "src/contexts/GameContext";
import { useDroppable } from "@dnd-kit/core";
import animationService from "src/contexts/animationService";
import { useUser } from "src/contexts/UserContext";

interface SlotProps {
   slot: ISlot;
   playerId: string | null,
   defenderId: string | null
}

const Slot = ({ slot, playerId, defenderId }: SlotProps, key: number) => {
   const { isOver, setNodeRef } = useDroppable({
      id: `slot-${slot.id}`,
      disabled: !slot.cards.length,
   });
   const isDropping = isOver && slot.cards.length;
   return (
      <div
         className={`${styles.slot} ${isDropping && playerId == defenderId && slot.cards.length < 2 ? styles.drop : ""}`}
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
   const { slots, state} = useGame();
   const { isOver, setNodeRef } = useDroppable({ id: "table" });
   const {user} = useUser();

   return (
      <div className={`${styles.table_container} ${isOver && user.id != state.defenderId ? styles.drop : ""}`} ref={setNodeRef}>
         <div className={`${styles.table}`}>
            {slots.map((slot, index) => (
               <Slot key={index} slot={slot} defenderId={state.defenderId} playerId={user.id} />
            ))}
         </div>
      </div>
   );
};

export default Table;