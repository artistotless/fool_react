import { useRef, useEffect, memo } from "react";
import Card from "src/components/ui/Card";
import styles from "./table.module.scss";
import useGameStore from "src/store/gameStore";
import { ISlot } from "src/store/gameStore";
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

// Оборачиваем Slot в memo для предотвращения ненужных ререндеров
const Slot = memo(({ slot, playerId, defenderId, trumpCard }: SlotProps) => {
   const { isOver, setNodeRef, active } = useDroppable({
      id: `slot-${slot.id}`,
   });

   const isDropping = isOver && slot.cards.length;
   const draggingCard = active?.data?.current?.card as ICard;
   const isSameSuit = draggingCard?.suit.name == slot.cards[0]?.suit.name;
   const isHigherRank = draggingCard?.rank.value > slot.cards[0]?.rank.value;
   const isDefender = playerId == defenderId;
   const isTrumpCard = draggingCard?.suit.name == trumpCard?.suit.name;

   // Оптимизация: применяем стиль для слотов с картой, который обеспечит плавный переход
   const hasCards = slot.cards.length > 0;

   return (
      <div
         id={`slot-${slot.id}`}
         className={`${styles.slot} ${hasCards ? styles.has_cards : ''} ${isDropping && isDefender && slot.cards.length < 2 && ((isSameSuit && isHigherRank) || isTrumpCard) ? styles.drop : ""}`}
         ref={setNodeRef}
         // Добавляем data-атрибуты для контроля размеров и дальнейшей анимации
         data-has-cards={hasCards ? "true" : "false"}
      >
         {slot.cards.map((card, index) => (
            <Card
               key={`${card.suit.name}-${card.rank.name}-${index}`}
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
});

// Оборачиваем Table в memo для предотвращения ненужных ререндеров
const Table = memo(() => {
   const { slots, state } = useGameStore();
   const { user } = useUser();
   const tableRef = useRef<HTMLDivElement>(null);

   // Когда изменяются слоты, плавно адаптируем grid-контейнер
   useEffect(() => {
      // Убедимся, что DOM полностью обновлен перед применением стилей
      if (tableRef.current) {
         // Ничего не делаем активно, CSS transition будет работать автоматически
         // Просто убеждаемся, что у всех элементов правильные классы
         const slotElements = tableRef.current.querySelectorAll(`.${styles.slot}`);
         slotElements.forEach(slot => {
            // Если нужно, можно добавить дополнительную логику для smooth-анимации
         });
      }
   }, [slots]);

   return (
      <div className={`${styles.table_container} ${user.id != state.defenderId ? styles.drop : ""}`} >
         <div className={`${styles.table}`} ref={tableRef}>
            {slots.map((slot, index) => (
               <Slot 
                  key={`slot-${slot.id}`} 
                  slot={slot} 
                  trumpCard={state.trumpCard} 
                  defenderId={state.defenderId} 
                  playerId={user.id} 
               />
            ))}
         </div>
      </div>
   );
});

export default Table;