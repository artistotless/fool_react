import { memo, useEffect, useMemo, useState } from "react";
import styles from "./avatar.module.scss";
import { useGame } from "src/contexts/GameContext";
import { useAudio } from "src/contexts/AudioContext";
import { Sounds } from "src/utils";
import { AnimatePresence, motion } from "framer-motion";
import ProgressTimer from "../ProgressTimer";

interface AvatarProps {
   src: string;
   name: string;
   playerId: string;
}

const Avatar = ({ src, name, playerId }: AvatarProps) => {
   const { state, passData } = useGame();
   const { play } = useAudio();
   const [imageSrc, setImageSrc] = useState<string>(src);
   
   // Обновляем источник изображения при изменении props
   useEffect(() => {
      setImageSrc(src);
   }, [src]);
   
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

   const isActivePlayer = state.defenderId === playerId || state.attackerId === playerId;
   
   // Определяем цвет рамки для аватара
   const borderColor = useMemo(() => {
      // Если это защищающийся игрок
      if (state.defenderId === playerId) {
         return "#4caf50"; // Красный для текущего игрока, оранжевый для противников
      }
      // Если это атакующий игрок
      else if (state.attackerId === playerId) {
         return  "#f44336"; // Красный для текущего игрока, зеленый для противников
      }
      return "transparent"; // Прозрачный для неактивных игроков
   }, [state.defenderId, state.attackerId, playerId]);

   // Обработчик ошибки загрузки изображения
   const handleImageError = () => {
      const seed = playerId || name || Math.random().toString(36).substring(2, 8);
      setImageSrc(`https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}`);
   };

   // Тестовые значения для проверки таймера
   const TEST_MODE = false;
   const testMoveTime = "00:00:30"; // Изменено с числа на строку в формате HH:mm:ss
   const testMovedAt = new Date().toISOString();

   return (
      <div className={styles.avatar_container}>
         <div className={styles.avatar} style={{ 'borderColor': borderColor }}>
            {imageSrc && (
               <img 
                  src={imageSrc} 
                  className={styles.image} 
                  alt={name}
                  onError={handleImageError}
               />
            )}
            {isActivePlayer && (TEST_MODE || (state.moveTime && state.movedAt)) && (
               <ProgressTimer 
                  moveTime={TEST_MODE ? testMoveTime : (state.moveTime ?? "00:00:30")} 
                  movedAt={TEST_MODE ? testMovedAt : (state.movedAt ?? new Date().toISOString())}
                  className={styles.progress}
               />
            )}
         </div>
         {name && <span className={styles.name}>{name}</span>}
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
