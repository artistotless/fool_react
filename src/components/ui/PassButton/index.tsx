import { useUser } from "src/contexts/UserContext";
import useGameStore from "src/store/gameStore";
import { useGameService } from "src/contexts/GameServiceContext";
import styles from "./passButton.module.scss";
import { memo } from "react";

const PassButton = () => {
   const { user } = useUser();
   const { state } = useGameStore();
   const { pass } = useGameService();

   const allBeaten = state.tableCards.every(slot => slot.defendingCard);
   const defender = state.players.find(player => player.id == state.defenderId);

   let passBtnTitle = '';
   let className = '';

   if (state.tableCards.length == 0)
      passBtnTitle = ''
   else if (user.id == state.defenderId && !allBeaten){
      passBtnTitle = 'Беру'
      className = styles.take
   }
   else if (user.id != state.defenderId && allBeaten){
      passBtnTitle = 'Бито'
   }
   else if (user.id != state.defenderId && !allBeaten && defender?.passed){
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