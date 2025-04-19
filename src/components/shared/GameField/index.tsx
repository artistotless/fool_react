import PlayerCards from "../PlayerCards";
import Table from "../Table";
import styles from "./gamefield.module.scss";
import PassButton from "src/components/ui/PassButton";
import TopPanel from "../TopPanel";

const GameField = () => {

   return (
      <div className={styles.field}>
         <div className={styles.invisible_panel_left}></div>
         <div className={styles.invisible_panel_right}></div>
         <TopPanel />
         <Table />
         <PlayerCards/>
         <PassButton />
      </div>
   );
};

export default GameField;
