import useGameStore from "src/store/gameStore";
import styles from "./gameOver.module.scss";
import useConnectionStore from "src/store/connectionStore";

const GameOverPanel = () => {
   const { players, winnersIds, status, setStatus } = useGameStore();
   const { setHubDetails } = useConnectionStore();

   const winners = players && winnersIds && Array.isArray(winnersIds)
      ? players.filter(player => winnersIds.includes(player.id))
      : [];

   const handleClose = () => {
      setStatus('ReadyToBegin');
      setHubDetails(null);
   }

   return (
      <div>
         {status === 'Finished' && (
            <div className={`${styles.game_over_panel} `}>
               <div>
                  {winners.length === 1
                     ? `Победитель - ${winners[0].name}`
                     : `Победители - ${winners.map(w => w.name).join(', ')}`
                  }
               </div>
               <button onClick={handleClose}>Закрыть</button>
            </div>
         )}
      </div>
   );
}

export default GameOverPanel;
