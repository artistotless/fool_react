import { useUser } from "src/contexts/UserContext";
import useGameStore from "src/store/gameStore";
import { useGameService } from "src/contexts/GameServiceContext";
import styles from "./passButton.module.scss";
import { memo } from "react";

const PassButton = () => {
   const { user } = useUser();
   const { slots, defenderId, players } = useGameStore();
   const { pass } = useGameService();

   const allBeaten = slots.every(slot => slot.cards.length === 2);
   const defender = players.find(player => player.id == defenderId);
   const isDefender = user.id == defenderId;

   let passBtnTitle = '';
   let className = '';

   if (slots.every(slot => slot.cards.length == 0))
      passBtnTitle = ''
   else if (isDefender && !allBeaten) {
      passBtnTitle = 'Беру'
      className = styles.take
   }
   else if (!isDefender && allBeaten) {
      passBtnTitle = 'Бито'
   }
   else if (!isDefender && !allBeaten && defender?.passed) {
      passBtnTitle = 'Пасс'
   }

   if (!passBtnTitle) return null;

   return (
      <div className={styles.pass_button}>
         <button className={`${styles.action_button} ${className}`} onClick={() => pass()}>{passBtnTitle}</button>
      </div>
   );
};

export default memo(PassButton); 