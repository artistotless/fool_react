import useGameStore from "src/store/gameStore";
import { useSignalR } from "src/contexts/SignalRContext";
import styles from "./gameOver.module.scss";
import { useEffect, useState } from "react";

const GameOverPanel = () => {
   const { players, winnersIds } = useGameStore();
   const { stopConnection } = useSignalR();
   const [isActive, setIsActive] = useState<boolean>(false);
   
   useEffect(() => {
      if (winnersIds && players && Array.isArray(winnersIds) && winnersIds.length === players.length - 1) {
         setIsActive(true);
      }
   }, [winnersIds, players]);

   const winners = players && winnersIds && Array.isArray(winnersIds)
      ? players.filter(player => winnersIds.includes(player.id))
      : [];

   return (
      <div>
         {isActive && (
            <div className={`${styles.game_over_panel}`}>
               <div>
                  {winners.length === 1 
                     ? `Победитель - ${winners[0].name}` 
                     : `Победители - ${winners.map(w => w.name).join(', ')}`
                  }
               </div>
               <button onClick={() => { stopConnection(); setIsActive(false) }}>Закрыть</button>
            </div>
         )}
      </div>
   );
}

export default GameOverPanel;
