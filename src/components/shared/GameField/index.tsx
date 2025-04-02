import { useGame } from "src/contexts/GameContext";
import { Player } from "../../ui/Player";
import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import { IFoolPlayer } from "src/types";
import { useUser } from "src/contexts/UserContext";
import userImg from "src/assets/img/user.svg";
import PassButton from "src/components/ui/PassButton";
import TopPanel from "../TopPanel";

const GameField = () => {
   const { state, personalState } = useGame();
   const { user } = useUser();
   
   return (
      <div className={styles.field}>
         <TopPanel />
         <Table />
         <PlayerCards cards={personalState.cardsInHand} />
         <PassButton />
      </div>
   );
};

export default GameField;
