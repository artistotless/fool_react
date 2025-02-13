import { CSSProperties, memo } from "react";
import styles from "./player.module.scss";
import Avatar from "../Avatar";
import { varibleGap } from "src/utils";
import { IFoolPlayer } from "src/types";

export const Player = memo(({ name, avatar, cardsCount, id }: IFoolPlayer) => {
   const gap = varibleGap(
      [5, 7, 10, 15, 19],
      [18, 20, 26, 27, 29, 34],
      cardsCount
   );

   return (
      <div
         className={styles.player}
         style={
            {
               "--gap": -gap + "px",
            } as CSSProperties
         }
      >
         <Avatar src={avatar} name={name} playerId={id} />
      </div>
   );
});