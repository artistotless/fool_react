import { useUser } from "src/contexts/UserContext";
import styles from "./navbar.module.scss";
import { useGame } from "src/contexts/GameContext";

const Navbar = ({ }) => {

   const { user } = useUser();
   const { pass, state } = useGame();

   const defender = state.players.find(player => player.id == state.defenderId);
   const passBtnTitle = state.defenderId == user.id ? 'Беру' : (state.attackerId == user.id && !defender?.passed) ? 'Бито' : 'Пасс';
   const passBtnActive =
      (state.attackerId == user.id && state.tableCards?.length > 0 || state.defenderId != user.id && defender?.passed)
         || (state.tableCards.length > 0 && state.defenderId == user.id)
         ? 'block' : 'none';

   return <div className={styles.navbar}>
      <div className={styles.trump}>
         {state.trumpCard?.suit.iconChar}
      </div>
      <div className={styles.user_info}>
         {user.name}#{user.id.slice(-4)}
      </div>
      <div className={styles.pass_btn}>
         <button onClick={() => pass()} style={{ display: passBtnActive }}>{passBtnTitle}</button>
      </div>
   </div>;
};

export default Navbar;
