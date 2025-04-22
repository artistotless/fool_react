import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import PassButton from "src/components/ui/PassButton";
import TopPanel from "../TopPanel";
import CurrentPlayerPanel from "../CurrentPlayerPanel";

const GameField = () => {
   return (
      <div className={styles.field}>
         <TopPanel />
         <Table />
         <div className={styles.player_area}>
            <PlayerCards/>
            {/* <CurrentPlayerPanel /> */}
         </div>
         <PassButton />
      </div>
   );
};

export default GameField;
