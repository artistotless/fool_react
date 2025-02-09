import { useGame } from "src/contexts/GameContext";
import { Player, PlayerProps } from "../../ui/Player";
import { Deck } from "../Deck";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";

const GameField = () => {
   const { players, trumpCard, deckCardsCount } = useGame();
   return (
      <div className={styles.field}>
         <div className={styles.players}>
            {players.map((value: PlayerProps, index) =>
               <Player {...value} key={index} />)}
         </div>

         <Table />
         <Deck trumpCard={trumpCard} isVisible={deckCardsCount > 0} />
         <PlayerCards />
      </div>
   );
};

export default GameField;
