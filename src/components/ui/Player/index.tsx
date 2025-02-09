import { CSSProperties, memo } from "react";
import styles from "./player.module.scss";

export interface PlayerProps {
   name?: string;
   avatar?: string;
   id: string;
   cardsCount: number;
   passed: boolean;
}

import red_back from "src/assets/cards/backs/red.svg";
import Avatar from "../Avatar";
import { varibleGap } from "src/utils";

export const Player = memo(({ name, avatar, cardsCount, id }: PlayerProps) => {
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

         <div className={styles.cards} id={`cards-${id}`}>
            {<img src={red_back} className={styles.card} />}
            {<b>x {cardsCount}</b>}
         </div>
      </div>
   );
});