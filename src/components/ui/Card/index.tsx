import { forwardRef, memo } from "react";
import { ICard } from "src/types";
import { createCardElement } from "src/utils";

interface CardProps extends ICard {
   randomRotate?: boolean;
   className?: string;
}

const Card = forwardRef(({ suit, rank }: CardProps, ref) => {
   return createCardElement(rank, suit, ref);;
}
);

export default memo(Card);
