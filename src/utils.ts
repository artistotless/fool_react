import { CSSProperties, RefObject } from "react";
import back_ic from "src/assets/cards/backs/red.svg";
import { IRank, ISuit } from "./types";
import * as env from "./environments/environment";

export const varibleGap = (
   gapSizes: number[],
   gapValues: number[],
   cardsCount: number
) => {
   let gap = gapValues[0];

   for (let i = 0; i < gapSizes.length; i++) {
      if (cardsCount > gapSizes[i]) {
         gap = gapValues[i + 1];
      }
   }

   return gap;
};

/**
 * moveCardFromDeck function
 *
 * Проигрывает анимацию перелета карты из колоды к указанной цели `targetRef`
 *
 * @param {RefObject<any> | string} targetRef - Ссылка на DOM элемент цели (или его `id`)
 * @param {RefObject<any> | string} deckRef - Ссылка на DOM элемент колоды (или его `id`)
 * @param {number} animationDuration - (опционально) Длительность анимации (мс)
 *
 * @returns {void}
 */
export const moveCardFromDeck = (
   targetRef: RefObject<any> | string,
   deckRef: RefObject<any> | string,
   animationDuration: number = 1000
) => {
   const getDOMElement = (ref: RefObject<any> | string) => {
      return typeof ref === "string"
         ? document.getElementById(ref)
         : ref.current;
   };

   const getAbsolutePosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
         x: rect.left + window.scrollX,
         y: rect.top + window.scrollY,
         width: rect.width,
         height: rect.height,
      };
   };

   const deckElement = getDOMElement(deckRef);
   if (!deckElement) throw new Error("Deck element not found");
   const deckRect = getAbsolutePosition(deckElement);

   const targetElement = getDOMElement(targetRef);
   if (!targetElement) throw new Error("Target element not found");
   const targetRect = getAbsolutePosition(targetElement);

   const cardWidth = deckElement.offsetWidth;
   const cardHeight = deckElement.offsetHeight;

   const targetWidth = targetElement.offsetWidth;
   const targetHeight = targetElement.offsetHeight;

   const startX = deckRect.x + deckRect.width / 2 - cardWidth / 2;
   const startY = deckRect.y + deckRect.height / 2 - cardHeight / 2;
   const endX = targetRect.x + targetRect.width / 2 - targetWidth / 2;
   const endY = targetRect.y + targetRect.height / 2 - targetHeight / 2;

   const cardElement = element("img", {
      style: {
         position: "absolute",
         width: `${cardWidth}px`,
         height: `${cardHeight}px`,
         transition: `opacity .3s ease-out`,
         zIndex: "1000",
      },
      src: back_ic,
   });
   document.body.appendChild(cardElement);

   let startTime = 0;

   const animate = (timestamp: number) => {
      if (!startTime) {
         startTime = timestamp;
      }

      let progress = (timestamp - startTime) / animationDuration;

      if (progress > 1) {
         progress = 1;
      }

      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      // const width = cardWidth + (targetWidth - cardWidth) * progress;
      const height = cardHeight + (targetHeight - cardHeight) * progress;

      cardElement.style.left = `${x}px`;
      cardElement.style.top = `${y}px`;
      // cardElement.style.width = `${width}px`;
      cardElement.style.height = `${height}px`;

      if (progress > 0.8) {
         cardElement.style.opacity = "0";
      }

      if (progress < 1) {
         requestAnimationFrame(animate);
      } else {
         setTimeout(() => {
            cardElement.remove();
         }, 500);
      }
   };

   requestAnimationFrame(animate);
};

/**
 * clearTableAnimated function
 *
 * Смахивает DOM элементы карт со стола, а затем вызывает `callback` функцию.
 *
 * @param {React.MutableRefObject} cardRefs - Ссылки на DOM элементы карт, лежащих на столе
 * @param callback - Callback функция, вызываемая после анимации
 */
export const clearTableAnimated = (
   cardRefs: React.MutableRefObject<{
      [id: string]: HTMLElement;
   }>,
   callback?: () => void
) => {
   Object.values(cardRefs.current).forEach((element) => {
      const cardElement = element;
      const x = window.innerWidth + 100;
      if (!cardElement) throw new Error("Card element doesn't exist");

      cardElement.style.transform = `translateX(${x}px)`;

      setTimeout(() => {
         callback && callback();
      }, 500);
   });
   cardRefs.current = {};
};

export const loadCardImage = async (rank: IRank, suit: ISuit, setSrc: any) => {
   try {
      // Получаем адрес сервера из localStorage
      const serverUrl = localStorage.getItem('cardServerUrl') ?? env.cardServerUrl;
      if (!serverUrl)
         throw new Error('Адрес сервера с картами не найден в localStorage');

      const cardPath = `cards/${suit.name.toLowerCase()}/${rank.name.toLowerCase()}.svg`;
      const imageUrl = env.loadCardsLocally ? `../src/assets/${cardPath}` : `${serverUrl}/${cardPath}`;

      // Устанавливаем карту как источник изображения
      setSrc(imageUrl);
   } catch (error) {
      console.error('Ошибка загрузки карты:', error);
   }
};

// export const moveFromTable = (
//    cardRefs: React.MutableRefObject<{
//       [id: string]: HTMLElement;
//    }>,
//    callback?: () => void
// ) => {
//    Object.values(cardRefs.current).forEach((element) => {
//       const animate = useAnimateElement();
//       animate(element, {
//          from: {
//             x: 0,
//             y: 0,
//             width: 100,
//             height: 100,
//          },
//          to: {
//             x: 200,
//             y: 200,
//             width: 200,
//             height: 200,
//          },
//          animationOptions: {
//             animationDuration: 1000,
//             onFinish: () => {
//                if (callback) callback();
//             },
//          },
//       });
//    });
//    cardRefs.current = {};
// };

export const element = (
   type: string,
   props?: {
      style?: CSSProperties;
      src?: string;
   }
) => {
   const element = document.createElement(type);

   if (props) {
      Object.assign(element.style, props.style);
      if (element instanceof HTMLImageElement && props.src) {
         element.src = props.src;
      }
   }

   return element;
};
