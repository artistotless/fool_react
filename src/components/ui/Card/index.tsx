import { forwardRef, memo } from "react";
import { ICard } from "src/types";
import { createCardElement } from "src/utils";

interface CardProps extends ICard {
   randomRotate?: boolean;
   className?: string;
}

const Card = forwardRef(({ suit, rank, playPlaceAnim = true }: CardProps, ref) => {
   return createCardElement(rank, suit, ref, true, undefined, playPlaceAnim);
}
);

export default memo(Card);
