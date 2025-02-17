import { useUser } from "src/contexts/UserContext";
import styles from "./navbar.module.scss";
import { useGame } from "src/contexts/GameContext";

const Navbar = ({ }) => {

   const { user } = useUser();
   const { pass, state } = useGame();

   const allBeaten = state.tableCards.every(slot => slot.defendingCard);
   const defender = state.players.find(player => player.id == state.defenderId);

   let passBtnTitle = '';

   if (state.tableCards.length == 0)
      passBtnTitle = ''
   else if (user.id == state.defenderId && !allBeaten)
      passBtnTitle = 'Беру'
   else if (user.id != state.defenderId && allBeaten)
      passBtnTitle = 'Бито'
   else if (user.id != state.defenderId && !allBeaten && defender?.passed)
      passBtnTitle = 'Пасс'

   const passBtnActive = passBtnTitle == '' ? 'none' : 'block';

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
