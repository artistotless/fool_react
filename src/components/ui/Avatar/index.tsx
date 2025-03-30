import { memo, useEffect } from "react";
import styles from "./avatar.module.scss";
import { useGame } from "src/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "src/contexts/AudioContext";
import { Sounds } from "src/utils";

interface AvatarProps {
   src?: string;
   name?: string;
   playerId?: string
}

const Avatar = ({ src, name, playerId }: AvatarProps) => {
   const { state, passData } = useGame();
   const { play } = useAudio();
   
   // Проигрываем звук только для "Беру" и "Пасс"
   useEffect(() => {
      if (passData?.playerId === playerId) {
         const isDefender = passData?.playerId === passData?.defenderId;
         const isTaking = isDefender; // "Беру"
         const isPassing = !isDefender && !passData?.allCardsBeaten; // "Пасс"
         
         if (isTaking || isPassing) {
            play(Sounds.Toast);
         }
      }
   }, [passData, playerId, play]);

   // Определяем, какой класс добавить в зависимости от playerId
   const borderColor =
      playerId === state.attackerId ? "#931616" :
         playerId === state.defenderId ? "#169363"
            : '';

   return (
      <div className={styles.avatar_container}>
         <div className={styles.avatar} style={{ 'borderColor': borderColor }}>
            {src && <img src={src} className={styles.image} />}
         </div>
         {name && <span className={styles.name}>{name} </span>}
         {/* <div
                  className={styles.passed_badge}
               >
                  Беру
               </div> */}
         <AnimatePresence>
            {passData?.playerId === playerId && (
               <motion.div 
                  className={styles.passed_badge}
                  initial={{ opacity: 0, top:50}}
                  animate={{ opacity: 1,  top:100}}
                  exit={{ opacity: 0, top:100 }}
                  transition={{ duration: 0.3 }}
               >
                  {passData?.playerId === passData?.defenderId ? 'Беру' : (passData?.allCardsBeaten ? 'Бито' : 'Пасс')}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default memo(Avatar);
