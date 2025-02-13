import { useGame } from "src/contexts/GameContext";
import { useSignalR } from "src/contexts/SignalRContext";
import styles from "./gameOver.module.scss";

const GameOverPanel = () => {
   const { state, winnersIds } = useGame();
   const { stopConnection } = useSignalR();
   
   const winnersSet = new Set(winnersIds);
   const winner = state.players.find(p => winnersSet.has(p.id));

   return (
      <div className={styles.game_over_panel}>
         <div>Winner - {winner ? winner.name : 'не определен'}</div>
         <button onClick={() => { stopConnection() }}>Вернуться на главную</button>
      </div>
   );
};

export default GameOverPanel;
