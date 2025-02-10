import animationService from "src/contexts/animationService";
import { useTransition, animated } from "react-spring";
import { useCallback } from "react";
import styles from "./deck.module.scss";

import { ICard } from "src/types";
import back from "src/assets/cards/backs/blue.png";
import Card from "src/components/ui/Card";

export interface DeckProps {
   trumpCard?: ICard | null;
   isVisible?: boolean;
}

export const Deck = (props: DeckProps) => {
   const transitions = useTransition(props.isVisible, {
      from: { opacity: 0, transform: "translateX(-30px)" },
      enter: { opacity: 1, transform: "translateX(0)" },
      leave: { opacity: 0, transform: "translateX(-30px)" },
      config: { tension: 300 },
   });

   const setDeckRef = useCallback((node: HTMLImageElement | null) => {
      if (node) {
         animationService.deckRef.current = node;
      }
   }, []);

   return transitions(
      (style, item) =>
         item && (
            <animated.div className={styles.deck_wrapper} style={style}>
               <img
                  id="deck"
                  className={styles.stack}
                  src={back}
                  ref={setDeckRef}
               ></img>
               {props.trumpCard && <Card {...props.trumpCard} className={styles.trump} />}
            </animated.div>
         )
   );
};