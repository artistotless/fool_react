import { CSSProperties, memo, useState, useEffect } from "react";
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

   const [avatarSrc, setAvatarSrc] = useState<string>(avatar);
   
   useEffect(() => {
      // Если аватарка отсутствует, загружаем случайную с DiceBear API
      if (!avatar || avatar.trim() === '') {
         // Используем id игрока как seed для получения одинаковой аватарки для одного и того же игрока
         const seed = id || name || Math.random().toString(36).substring(2, 8);
         // Можно выбрать другие стили: fun-emoji, bottts, identicon, avataaars, human, big-smile, lorelei, pixel-art
         const style = 'avataaars'; 
         setAvatarSrc(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
      } else {
         setAvatarSrc(avatar);
      }
   }, [avatar, id, name]);

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
         <Avatar src={avatarSrc} name={isCurrentUser ? "Вы" : name} playerId={id}/>
      </div>
   );
});