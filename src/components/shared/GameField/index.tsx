import { useGame } from "src/contexts/GameContext";
import { Player, PlayerProps } from "../../ui/Player";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import Test from "../Test";

const GameField = () => {
   const { players} = useGame();
   return (
      <div className={styles.field}>
         <div className={styles.players}>
            <Test />
            {players.map((value: PlayerProps, index) =>
               <Player {...value} key={index} />)}
         </div>

         <Table />
         <PlayerCards />
      </div>
   );
};

export default GameField;
