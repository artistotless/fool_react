import styles from "./playercards.module.scss";
import DraggableCard from "src/components/ui/Card/DraggableCard";
import { CSSProperties, useEffect } from "react";
import { ICard } from "src/types";

interface PlayerCardsProps {
   isDraggingEnabled?: boolean;
   cards: ICard[]
}

const PlayerCards = (props: PlayerCardsProps) => {
   let gap = getAdaptiveGap(props.cards.length);
   const cards = props.cards && props.cards.length ? props.cards : []

   // Функция для определения адаптивного gap на основе количества карт и размера экрана
   function getAdaptiveGap(length: number) {
      // Базовое значение gap
      let baseGap = 154;
      
      // Стандартные значения для десктопа
      if (length >= 30) baseGap = 154;
      else if (length >= 20) baseGap = 152;
      else if (length >= 15) baseGap = 148;
      else if (length >= 10) baseGap = 141;
      else if (length >= 8) baseGap = 135;
      else if (length >= 5) baseGap = 122;
      else if (length >= 3) baseGap = 90;
      else if (length >= 2) baseGap = 40;
      
      // Адаптируем gap для маленьких экранов
      const windowWidth = window.innerWidth;
      
      if (windowWidth <= 375) {
         // Для очень маленьких экранов
         return baseGap * 0.6;
      } else if (windowWidth <= 500) {
         // Для мобильных
         return baseGap * 0.75;
      } else if (windowWidth <= 768) {
         // Для планшетов
         return baseGap * 0.85;
      }
      
      return baseGap;
   }

   // Функция для расчета угла наклона карты с адаптацией к экрану
   const calculateRotation = (index: number, totalCards: number) => {
      // Адаптируем общий угол веера для разных размеров экрана
      let baseTotalAngle = Math.min(40, totalCards * 2.5);
      
      // Уменьшаем угол для маленьких экранов
      if (window.innerWidth <= 375) {
         baseTotalAngle = Math.min(30, totalCards * 1.8);
      } else if (window.innerWidth <= 500) {
         baseTotalAngle = Math.min(35, totalCards * 2.2);
      }
      
      // Вычисляем угол от -totalAngle/2 до +totalAngle/2
      const startAngle = -baseTotalAngle / 2;
      
      // Равномерное распределение углов между всеми картами
      let step = totalCards > 1 ? baseTotalAngle / (totalCards - 1) : 0;
      
      // Результирующий угол для данной карты
      return startAngle + index * step;
   };

   // Обновляем значение gap при изменении размера окна
   useEffect(() => {
      const handleResize = () => {
         gap = getAdaptiveGap(cards.length);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
   }, [cards.length]);

   return (
      <div className={styles.cards_wrapper}>
         <div
            className={styles.root}
            id="playercards"
            style={
               {
                  "--gap": -gap + "px",
               } as CSSProperties
            }
         >
            {cards.map((card, index) => (
               <DraggableCard
                  index={index}
                  elementId={`playercard-${index}`}
                  draggable={props.isDraggingEnabled}
                  rotation={calculateRotation(index, cards.length)}
                  {...card}
                  key={index}
               />
            ))}
         </div>
      </div>
   );
};

export default PlayerCards;
