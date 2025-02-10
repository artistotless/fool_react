import Card from "src/components/ui/Card";
import styles from "./table.module.scss";
import { ISlot as ISlot, useGame } from "src/contexts/GameContext";
import { useDroppable } from "@dnd-kit/core";

import Test from "../Test";
import animationService from "src/contexts/animationService";

interface SlotProps {
   slot: ISlot;
}

const Slot = ({ slot }: SlotProps, key: number) => {
   const { isOver, setNodeRef } = useDroppable({
      id: `slot-${slot.id}`,
      disabled: !slot.cards.length,
   });
   const isDropping = isOver && slot.cards.length;

   return (
      <div
         className={`${styles.slot} ${isDropping ? styles.drop : ""}`}
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
   const { slots } = useGame();
   const { isOver, setNodeRef } = useDroppable({ id: "table" });

   return (
      <div className={`${styles.wrapper} ${isOver ? styles.drop : ""}`} ref={setNodeRef}
      >
         <Test />
         {slots.map((slot, index) => (
            <Slot key={index} slot={slot} />
         ))}
      </div>
   );
};

export default Table;
