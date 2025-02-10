import animationService from "src/contexts/animationService";
import { useCallback, useTransition } from "react";
import styles from "./deck.module.scss";

import { ICard } from "src/types";
import back from "src/assets/cards/backs/blue.svg";
import Card from "src/components/ui/Card";
import { AnimatePresence, motion } from "framer-motion";

export interface DeckProps {
   trumpCard?: ICard | null;
   isVisible?: boolean;
}

export const Deck = (props: DeckProps) => {
   const setDeckRef = useCallback((node: HTMLImageElement | null) => {
      if (node) {
         animationService.deckRef.current = node;
      }
   }, []);

   return (
      <AnimatePresence>
        {props.isVisible && (
          <motion.div
            className={styles.deck_wrapper}
            initial={{ opacity: 0, x: -30 }} // Начальное состояние (появление)
            animate={{ opacity: 1, x: 0 }} // Анимация появления
            exit={{ opacity: 0, x: -30 }} // Анимация исчезновения
            transition={{ type: "spring", stiffness: 300 }} // Параметры анимации
          >
            <img
              id="deck"
              className={styles.stack}
              src={back}
              ref={setDeckRef}
              alt="Deck"
            />
            {props.trumpCard && (
              <Card {...props.trumpCard} className={styles.trump} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
};