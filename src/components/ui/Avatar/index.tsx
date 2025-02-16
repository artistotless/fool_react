import { memo } from "react";
import styles from "./avatar.module.scss";
import { useGame } from "src/contexts/GameContext";

interface AvatarProps {
   src?: string;
   name?: string;
   playerId?: string
}

const Avatar = ({ src, name, playerId }: AvatarProps) => {
   const { state } = useGame();
   // Определяем, какой класс добавить в зависимости от playerId
   const borderColor =
      playerId === state.attackerId ? "#ff0000bf" :
         playerId === state.defenderId ? "#0000ffb0"
            : '';

   return (
      <div className={styles.avatar_container}>
         <div className={styles.avatar} style={{ 'borderColor': borderColor }}>
            {src && <img src={src} className={styles.image} />}
         </div>
         {name && <span className={styles.name} style={{ 'color': borderColor }}>{name} </span>}
      </div>
   );
};

export default memo(Avatar);
