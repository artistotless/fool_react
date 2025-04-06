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
   id: string;
   rotation?: number;
   bottomOffset?: number;
}

const DraggableCard = forwardRef(
   (
      {
         elementId,
         suit,
         rank,
         draggable = true,
         id,
         rotation,
         bottomOffset = 0,
      }: CardProps,
      ref
   ) => {
      const { attributes, listeners, setNodeRef, transform, isDragging } =
         useDraggable({
            id: id,
            data: { elementId, card: { suit, rank, id } },
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
         bottomOffset,
      };

      return createCardElement(rank, suit, ref, false, draggableData)
   }
);

export default memo(DraggableCard);
