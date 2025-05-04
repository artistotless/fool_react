import { useUser } from "src/contexts/UserContext";
import useGameStore from "src/store/gameStore";
import { useGameService } from "src/contexts/GameServiceContext";
import styles from "./passButton.module.scss";
import { memo } from "react";

const PassButton = () => {
   const { user } = useUser();
   const { slots, defenderId, activePlayers } = useGameStore();
   const { pass } = useGameService();

   // Проверяем активен ли текущий игрок
   const isActive = activePlayers.includes(user.id);
   
   // Проверяем является ли игрок defender
   const isDefender = user.id === defenderId;
   
   // Проверяем, все ли карты биты (в каждом слоте либо 2 карты, либо 0)
   const allBeaten = slots.every(slot => slot.cards.length === 2);
   
   // Проверяем, есть ли на столе хотя бы одна небитая карта
   const hasUnbeatenCards = slots.some(slot => slot.cards.length === 1);

   let passBtnTitle = '';
   let className = '';

   // Кнопка "Беру" - игрок в составе activePlayers и игрок является defender
   if (isActive && isDefender) {
      passBtnTitle = 'Беру';
      className = styles.take;
   }
   // Кнопка "Бито" - игрок в составе activePlayers и все карты на столе биты и игрок не является defender
   else if (isActive && allBeaten && !isDefender) {
      passBtnTitle = 'Бито';
   }
   // Кнопка "Пас" - игрок в составе activePlayers и на столе есть хотя бы одна небитая карта и игрок не является defender
   else if (isActive && hasUnbeatenCards && !isDefender) {
      passBtnTitle = 'Пасс';
   }

   // Не отображаем кнопку, если нет подходящего действия
   if (!passBtnTitle) return null;

   return (
      <div className={styles.pass_button}>
         <button className={`${styles.action_button} ${className}`} onClick={() => pass()}>{passBtnTitle}</button>
      </div>
   );
};

export default memo(PassButton); 