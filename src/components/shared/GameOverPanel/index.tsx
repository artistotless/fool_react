import useGameStore from "src/store/gameStore";
import { useSignalR } from "src/contexts/SignalRContext";
import styles from "./gameOver.module.scss";
import { useEffect, useState } from "react";

const GameOverPanel = () => {
   const { state, winnersIds } = useGameStore();
   const { stopConnection } = useSignalR();
   const [isActive, setIsActive] = useState<boolean>(false);

   useEffect(() => {
      if (!winnersIds)
         return;
      setIsActive(true);
      console.log('winnersIds', winnersIds);
   }, [winnersIds]);

   const winnersSet = new Set(winnersIds);
   const winner = state.players.find(p => winnersSet.has(p.id));

   return (
      <div className={`${styles.game_over_panel} ${isActive ? styles.active : ''}`}>
         <div>Победитель - {winner ? winner.name : 'не определен'}</div>
         <button onClick={() => { stopConnection(); setIsActive(false) }}>Закрыть</button>
      </div>
   );
}

export default GameOverPanel;
