import { useGame } from "src/contexts/GameContext";
import { Player } from "../../ui/Player";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import { IFoolPlayer } from "src/types";
import { useUser } from "src/contexts/UserContext";
import userImg from "src/assets/img/user.svg";
import PassButton from "src/components/ui/PassButton";

const GameField = () => {
   const { state, personalState } = useGame();
   const { user } = useUser();
   
   return (
      <div className={styles.field}>
         <div className={styles.players}>
            {state.players.map((value: IFoolPlayer, index) => (
               <Player 
                  {...value} 
                  key={index} 
                  avatar={value.avatar ?? userImg}
                  name={value.id === user.id ? "Вы" : value.name}
               />
            ))}
         </div>
         <Table />
         <PlayerCards cards={personalState.cardsInHand} />
         <PassButton />
      </div>
   );
};

export default GameField;
