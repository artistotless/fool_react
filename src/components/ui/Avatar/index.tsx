import { memo } from "react";
import styles from "./avatar.module.scss";
import { useGame } from "src/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";

interface AvatarProps {
   src?: string;
   name?: string;
   playerId?: string
}

const Avatar = ({ src, name, playerId }: AvatarProps) => {
   const { state, passedPlayerId } = useGame();
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
         {name && <span className={styles.name} style={{ 'color': borderColor }}>{name} </span>}
         <AnimatePresence>
            {passedPlayerId === playerId && (
               <motion.div 
                  className={styles.passed_badge}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
               >
                  Беру
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default memo(Avatar);
