import { useGame } from "src/contexts/GameContext";
import { Player } from "../../ui/Player";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import Test from "../Test";
import { IFoolPlayer } from "src/types";

const GameField = () => {
   const { state, hand } = useGame();
   return (
      <div className={styles.field}>
         <div className={styles.players}>
            <Test />
            {state.players.map((value: IFoolPlayer, index) =>
               <Player {...value} key={index} />)}
         </div>

         <Table />
         <PlayerCards cards={hand} />
      </div>
   );
};

export default GameField;
