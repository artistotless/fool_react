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
   index: number;
   rotation?: number;
}

const DraggableCard = forwardRef(
   (
      {
         elementId,
         suit,
         rank,
         draggable = true,
         index,
         rotation,
      }: CardProps,
      ref
   ) => {
      const { attributes, listeners, setNodeRef, transform, isDragging } =
         useDraggable({
            id: index,
            data: { elementId, card: { suit, rank, id: index, index } },
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
         rotation,
      };

      return createCardElement(rank, suit, ref,false, draggableData)
   }
);

export default memo(DraggableCard);
