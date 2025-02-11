import { forwardRef, memo, useEffect, useState } from "react";
import { ICard, RankValues, SuitsSymbols } from "src/types";
import styles from "./card_new.module.scss";
// import styles from "./card.module.scss";
import { createCardElement, loadCardImage } from "src/utils";

interface CardProps extends ICard {
   randomRotate?: boolean;
   className?: string;
}

const Card = forwardRef(
   ({ suit, rank, randomRotate, className = "" }: CardProps, ref) => {
      const [rotate, setRotate] = useState(0);
      const [src, setSrc] = useState("");
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
         loadCardImage(rank, suit, setSrc);
      }, [rank, suit]);

      useEffect(() => {
         if (randomRotate) {
            const randomDeg = Math.floor(Math.random() * 12) - 6;
            setRotate(randomDeg);
         }
      }, [randomRotate]);

      // return (
      //    <div ref={(node) => {
      //          if (ref) {
      //             typeof ref === "function" ? ref(node) : (ref.current = node);
      //          }
      //       }}
      //       style={{
      //          rotate: `${rotate}deg`,
      //       }}
      //       className={`${styles.card} ${className} ${isLoading && styles.loading
      //          }`}
      //    >
      //       <img
      //          onLoad={() => setIsLoading(false)}
      //          src={src}
      //          alt={`${rank.name} of ${suit.name}`}
      //       />
      //    </div>
      // );

      return createCardElement(rank, suit, ref, rotate);;
   }
);

export default memo(Card);
