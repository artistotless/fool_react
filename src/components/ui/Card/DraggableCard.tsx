import { forwardRef, memo, useEffect, useState } from "react";
import { ICard } from "src/types";
import styles from "./card.module.scss";
import { useDraggable } from "@dnd-kit/core";

import { loadCardImage } from "src/utils";

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
         randomRotate,
         draggable = true,
         id,
         index,
         className = "",
      }: CardProps,
      ref
   ) => {
      const [rotate, setRotate] = useState(0);
      const [src, setSrc] = useState("");
      const [isLoading, setIsLoading] = useState(true);

      if (!id) id = Math.floor(Math.random() * 360);

      useEffect(() => {
         loadCardImage(rank, suit, setSrc);
      }, [rank, suit]);

      const { attributes, listeners, setNodeRef, transform, isDragging } =
         useDraggable({
            id,
            data: { suit, rank, id, index },
            disabled: !draggable,
         });

      useEffect(() => {
         if (randomRotate) {
            const randomDeg = Math.floor(Math.random() * 12) - 6;
            setRotate(randomDeg);
         }
      }, [randomRotate]);

      return (
         <div
            id={elementId}
            ref={(node) => {
               setNodeRef(node);
               if (ref) {
                  typeof ref === "function" ? ref(node) : (ref.current = node);
               }
            }}
            className={`${styles.card} ${isDragging && styles.dragging} ${draggable && styles.draggable
               } ${className} ${isLoading && styles.loading}`}
            {...listeners}
            {...attributes}
            style={{
               transform: transform
                  ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
                  : undefined,
               rotate: `${rotate}deg`,
            }}
         >
            <img onLoad={() => setIsLoading(false)} src={src} />
         </div>
      );
   }
);

export default memo(DraggableCard);
