import { useGame } from "src/contexts/GameContext";
import { Player } from "../../ui/Player";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import { IFoolPlayer } from "src/types";
import { useUser } from "src/contexts/UserContext";

const GameField = () => {
   const { state, personalState } = useGame();
   const { user } = useUser();
   
   return (
      <div className={styles.field}>
         <div className={styles.players}>
            {state.players.map((value: IFoolPlayer, index) =>
               value.id !== user.id && <Player {...value} key={index} />)}
         </div>
         <Table />
         <PlayerCards cards={personalState.cardsInHand} />
      </div>
   );
};

export default GameField;
