import { memo } from "react";
import styles from "./avatar.module.scss";
import { useGame } from "src/contexts/GameContext";

interface AvatarProps {
   src?: string;
   name?: string;
   playerId?: string
}

const Avatar = ({ src, name, playerId }: AvatarProps) => {
   const { attackerId, defenderId } = useGame();
   // Определяем, какой класс добавить в зависимости от playerId
   const borderColor =
      playerId === attackerId ? "#ff0000bf" :
         playerId === defenderId ? "#0000ffb0"
            : '';
            
   return (
      <div className={styles.avatar} style={{ 'borderColor': borderColor }}>
         {src && <img src={src} className={styles.image} />}
         {name && <span className={styles.name}>{name}</span>}
      </div>
   );
};

export default memo(Avatar);
