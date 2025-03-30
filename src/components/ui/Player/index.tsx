import { CSSProperties, memo } from "react";
import styles from "./player.module.scss";
import Avatar from "../Avatar";
import { varibleGap } from "src/utils";
import { IFoolPlayer } from "src/types";
import { useUser } from "src/contexts/UserContext";

export const Player = memo(({ name, avatar, cardsCount, id }: IFoolPlayer) => {
   const { user } = useUser();
   const gap = varibleGap(
      [5, 7, 10, 15, 19],
      [18, 20, 26, 27, 29, 34],
      cardsCount
   );
   
   // Определяем, текущий ли это пользователь
   const isCurrentUser = id === user.id;

   return (
      <div
         id={`player-${id}`}
         className={`${styles.player} ${isCurrentUser ? styles.current_user : ''}`}
         style={
            {
               "--gap": -gap + "px",
            } as CSSProperties
         }
      >
         <Avatar src={avatar} name={isCurrentUser ? "Вы" : name} playerId={id}/>
      </div>
   );
});