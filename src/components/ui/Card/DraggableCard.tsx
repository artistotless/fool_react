import { forwardRef, memo } from "react";
import { ICard, IDraggableData } from "src/types";
import { useDraggable } from "@dnd-kit/core";
import { createCardElement } from "src/utils";
// import { create } from "framer-motion/client";

interface CardProps extends ICard {
   randomRotate?: boolean;
   draggable?: boolean;
   className?: string;
   elementId?: string;
   index: number
}

const DraggableCard = forwardRef(
   (
      {
         elementId,
         suit,
         rank,
         draggable = true,
         id,
         index,
      }: CardProps,
      ref
   ) => {

      if (!id) id = Math.floor(Math.random() * 360);

      const { attributes, listeners, setNodeRef, transform, isDragging } =
         useDraggable({
            id,
            data: { suit, rank, id, index },
            disabled: !draggable,
         });

      const draggableData: IDraggableData = {
         attributes,
         elementId,
         isDragging,
         listeners,
         transform,
         setNodeRef,
         isDraggable: draggable,
      };

      return createCardElement(rank, suit, ref, draggableData)
      // return (
      //    <div
      //       id={elementId}
      //       ref={(node) => {
      //          setNodeRef(node);
      //          if (ref) {
      //             typeof ref === "function" ? ref(node) : (ref.current = node);
      //          }
      //       }}
      //       className={`${styles.card} ${isDragging && styles.dragging} ${draggable && styles.draggable
      //          } ${className} ${isLoading && styles.loading}`}
      //       {...listeners}
      //       {...attributes}
      //       style={{
      //          transform: transform
      //             ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      //             : undefined,
      //          rotate: `${rotate}deg`,
      //       }}
      //    >
      //       <img onLoad={() => setIsLoading(false)} src={src} />
      //    </div>
      // );
   }
);

export default memo(DraggableCard);
