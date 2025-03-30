import { useUser } from "src/contexts/UserContext";
import styles from "./navbar.module.scss";
import { useGame } from "src/contexts/GameContext";
import Timer from "src/components/ui/Timer";
import userImg from "src/assets/img/user_sample.png";
import { useEffect } from "react";

const Navbar = ({ }) => {

   const { user } = useUser();
   const { pass, state } = useGame();

   // Добавляем тестовые значения для таймера
   const testState = {
      ...state,
      moveTime: "00:00:20", // 10 секунд
      movedAt: new Date().toISOString() // текущее время
   };

   const allBeaten = testState.tableCards.every(slot => slot.defendingCard);
   const defender = testState.players.find(player => player.id == testState.defenderId);

   let passBtnTitle = '';

   if (testState.tableCards.length == 0)
      passBtnTitle = ''
   else if (user.id == testState.defenderId && !allBeaten)
      passBtnTitle = 'Беру'
   else if (user.id != testState.defenderId && allBeaten)
      passBtnTitle = 'Бито'
   else if (user.id != testState.defenderId && !allBeaten && defender?.passed)
      passBtnTitle = 'Пасс'

   const passBtnActive = passBtnTitle == '' ? 'none' : 'block';

   // Используем testState вместо state
   useEffect(() => {
      if (testState.moveTime && testState.movedAt) {
         const navbarEl = document.querySelector(`.${styles.navbar}`) as HTMLElement;
         const updateProgress = () => {
            if (!testState.movedAt) return;
            const movedAtTime = new Date(testState.movedAt).getTime();
            const [hours, minutes, seconds] = (testState.moveTime as string).split(":").map(Number);
            const totalMoveTimeMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
            
            const elapsed = Date.now() - movedAtTime;
            const progress = (elapsed / totalMoveTimeMs * 100);
            
            if (navbarEl) {
               navbarEl.style.setProperty('--progress', `${Math.min(100, progress)}%`);
            }
         };

         const interval = setInterval(updateProgress, 10);
         return () => clearInterval(interval);
      }
   }, [testState.moveTime, testState.movedAt]);

   return <div className={styles.navbar}>
      {/* <div className={styles.trump}>
         {state.trumpCard?.suit.iconChar || '♣'}
      </div> */}
      <div className={styles.user_info}>
         <div className={styles.avatar}>
            <img 
               src={user.photoURL || userImg} 
               alt={user.name} 
            />
         </div>
      </div>
      <div style={{ display: passBtnActive }} className={styles.pass_btn}>
         <button onClick={() => pass()} >{passBtnTitle}Бито</button>
      </div>
      {/* {state.moveTime && state.movedAt && state.rounds > 0 && <Timer moveTime={state.moveTime} movedAt={state.movedAt} />} */}
   </div>;
};

export default Navbar;
