import styles from "./playercards.module.scss";
import DraggableCard from "src/components/ui/Card/DraggableCard";
import { CSSProperties, useEffect } from "react";
import { useGame } from "src/contexts/GameContext";
const PlayerCards = () => {
   
   const { personalState } = useGame();
   const cards = personalState.cardsInHand;

   let gap = getAdaptiveGap(cards.length);

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
      // Вычисляем базовый максимальный угол с учетом количества карт
      // Чем больше карт, тем меньше угол наклона
      let maxAngle;
      if (totalCards <= 5) {
         maxAngle = 40; // Максимальный угол для малого количества карт
      } else if (totalCards <= 10) {
         maxAngle = 35; // Уменьшаем для среднего количества
      } else if (totalCards <= 15) {
         maxAngle = 30; // Еще уменьшаем
      } else if (totalCards <= 20) {
         maxAngle = 25; // Продолжаем уменьшать
      } else if (totalCards <= 25) {
         maxAngle = 20;
      } else {
         maxAngle = 15; // Минимальный угол для большого количества карт
      }
      
      // Вычисляем базовый общий угол веера с ограничением по максимуму
      let baseTotalAngle = Math.min(maxAngle, totalCards * 1.8);
      
      // Уменьшаем угол для маленьких экранов
      if (window.innerWidth <= 375) {
         baseTotalAngle = Math.min(baseTotalAngle * 0.75, totalCards * 1.5);
      } else if (window.innerWidth <= 500) {
         baseTotalAngle = Math.min(baseTotalAngle * 0.85, totalCards * 1.6);
      }
      
      // Для четного количества карт используем виртуальную центральную карту
      if (totalCards % 2 === 0) {
         // Количество карт с виртуальной центральной
         const virtualTotalCards = totalCards + 1;
         
         // Шаг между картами с учетом виртуальной карты
         const step = baseTotalAngle / (virtualTotalCards - 1);
         
         // Начальный угол с учетом виртуальной карты
         const startAngle = -baseTotalAngle / 2;
         
         // Реальный индекс с учетом смещения (центр - виртуальная карта)
         const virtualIndex = index + (index >= totalCards / 2 ? 1 : 0);
         
         // Возвращаем угол для карты с учетом виртуального центра
         return startAngle + virtualIndex * step;
      } else {
         // Для нечетного числа карт оставляем старую логику
         // Вычисляем угол от -totalAngle/2 до +totalAngle/2
         const startAngle = -baseTotalAngle / 2;
         
         // Равномерное распределение углов между всеми картами
         let step = totalCards > 1 ? baseTotalAngle / (totalCards - 1) : 0;
         
         // Результирующий угол для данной карты
         return startAngle + index * step;
      }
   };

   // Функция для расчета вертикального смещения (bottom) в зависимости от положения карты
   const calculateBottom = (index: number, totalCards: number) => {
      if (totalCards <= 1) return 0;

      // Базовый множитель смещения
      let multiplier = 0.8;
      
      // Адаптация для маленьких экранов
      if (window.innerWidth <= 375) {
         multiplier = 0.5;
      } else if (window.innerWidth <= 500) {
         multiplier = 0.6;
      } else if (window.innerWidth <= 768) {
         multiplier = 0.7;
      }
      
      // Для четного количества карт используем виртуальную центральную карту
      if (totalCards % 2 === 0) {
         // Виртуальная центральная карта находится между двумя центральными картами
         const virtualCenter = totalCards / 2 - 0.5;
         
         // Расстояние от виртуального центра
         const distanceFromCenter = Math.abs(index - virtualCenter);
         
         // Квадратичная зависимость - смещение растет быстрее с удалением от центра
         return distanceFromCenter * distanceFromCenter * multiplier;
      } else {
         // Для нечетного числа карт оставляем старую логику
         // Находим центральный индекс
         const centerIndex = Math.floor(totalCards / 2);
         
         // Находим расстояние от центра (0 для центральной карты)
         const distanceFromCenter = Math.abs(index - centerIndex);
         
         // Квадратичная зависимость - смещение растет быстрее с удалением от центра
         return distanceFromCenter * distanceFromCenter * multiplier;
      }
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
                  draggable={true}
                  rotation={calculateRotation(index, cards.length)}
                  bottomOffset={calculateBottom(index, cards.length)}
                  {...card}
                  key={index}
               />
            ))}
         </div>
      </div>
   );
};

export default PlayerCards;
