import { CSSProperties, RefObject } from "react";
import back_ic from "src/assets/cards/backs/red.png";
import { IDraggableData, IRank, ISuit, RankValues, SuitsSymbols } from "./types";
import * as env from "./environments/environment";
import playerCardStyles from "../src/components/ui/Card/playerCard.module.scss";
import tableCardStyles from "../src/components/ui/Card/tableCard.module.scss";
import queenImg from '../src/assets/cards/queen.png';
import kingImg from '../src/assets/cards/king.png';
import jackImg from '../src/assets/cards/jack.png';

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
 * moveElementTo function
 *
 * Проигрывает анимацию перемещения элемента к указанной цели
 *
 * @param {string} element - ID DOM элемента
 * @param {string} destinationId - ID DOM элемента цели
 * @param {number} animationDuration - (опционально) Длительность анимации (мс)
 * @param {Function} onComplete - Функция, вызываемая после завершения анимации
 * @returns {void}
 */
export const moveElementTo = (
   element: string | HTMLElement,
   destinationId: string,
   animationDuration: number = 300,
   onComplete?: () => void
) => {

   let elementElement: HTMLElement | null = null;
   
   if (typeof element === 'string') {
      elementElement = document.getElementById(element);
   } else {
      elementElement = element;
   }

   const destination = document.getElementById(destinationId);

   if (!elementElement || !destination) {
      console.error("Element or destination element not found");
      onComplete && onComplete();
      return;
   }

   const getAbsolutePosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
         x: rect.left + window.scrollX,
         y: rect.top + window.scrollY,
         width: rect.width,
         height: rect.height,
      };
   };

   // Получаем координаты элемента и цели
   const elementRect = getAbsolutePosition(elementElement);
   const destinationRect = getAbsolutePosition(destination);

   // Вычисляем смещение для центра цели
   const translateX = destinationRect.x + destinationRect.width / 2 - elementRect.x - elementRect.width / 2;
   const translateY = destinationRect.y + destinationRect.height / 2 - elementRect.y - elementRect.height / 2;

   // Устанавливаем стили для анимации
   elementElement.style.willChange = `transform`;
   elementElement.style.transition = `transform ${animationDuration}ms ease-out`;
   elementElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px)`;

   // По завершении анимации вызываем callback
   setTimeout(() => {
      onComplete && onComplete();
   }, animationDuration);
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

   const targetWidth = 122;
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
         zIndex: "10",
      },
      src: back_ic,
   });

   const x = startX + (endX - startX) * 0;
   const y = startY + (endY - startY) * 0;
   const width = cardWidth + (targetWidth - cardWidth) * 0;
   const height = cardHeight + (targetHeight - cardHeight) * 0;

   cardElement.style.left = `${x}px`;
   cardElement.style.top = `${y}px`;
   cardElement.style.width = `${width}px`;
   cardElement.style.height = `${height}px`;
   document.body.appendChild(cardElement);

   moveElementTo(cardElement, targetElement.id, animationDuration, ()=>{
      cardElement.remove();
   });
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
export const moveCardFromDeckOld = (
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

   const targetWidth = 122;
   const targetHeight = targetElement.offsetHeight;

   console.log(cardWidth, cardHeight, targetWidth, targetHeight);

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
         zIndex: "1",
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
      const width = cardWidth + (targetWidth - cardWidth) * progress;
      const height = cardHeight + (targetHeight - cardHeight) * progress;

      cardElement.style.left = `${x}px`;
      cardElement.style.top = `${y}px`;
      cardElement.style.width = `${width}px`;
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
 * @param before - Callback функция, вызываемая до анимации
 * @param after - Callback функция, вызываемая после анимации
 */
export const clearTableAnimated = (
   cardRefs: React.MutableRefObject<{
      [id: string]: HTMLElement;
   }>,
   before?: () => void,
   after?: () => void
) => {

   before && before();
   Object.values(cardRefs.current).forEach((element) => {
      const cardElement = element;
      const x = window.innerWidth + 100;
      if (!cardElement) throw new Error("Card element doesn't exist");
      cardElement.style.transform = `translateX(${x}px)`;
      setTimeout(() => {
         after && after();
      }, 1000);
   });
   cardRefs.current = {};
};

/**
 * animateCardToSlot function
 * 
 * Анимирует плавное перемещение карты в слот после её перетаскивания
 * 
 * @param {string} cardId - ID DOM элемента карты
 * @param {string} slotId - ID DOM элемента слота
 * @param {number} animationDuration - Длительность анимации в миллисекундах
 * @param {Function} onComplete - Функция, вызываемая после завершения анимации
 * 
 * @returns {void}
 */
export const animateCardToSlot = (
   cardId: string,
   slotId: string,
   animationDuration: number = 300,
   onComplete?: () => void
) => {
   const cardElement = document.getElementById(cardId);
   const slotElement = document.getElementById(slotId);

   if (!cardElement || !slotElement) {
      console.error("Card or slot element not found");
      onComplete && onComplete();
      return;
   }

   const getAbsolutePosition = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
         x: rect.left + window.scrollX,
         y: rect.top + window.scrollY,
         width: rect.width,
         height: rect.height,
      };
   };

   // Получаем координаты карты и слота
   const cardRect = getAbsolutePosition(cardElement);
   const slotRect = getAbsolutePosition(slotElement);

   // Вычисляем смещение для центра слота
   const translateX = slotRect.x + slotRect.width / 2 - cardRect.x - cardRect.width / 2;
   const translateY = slotRect.y + slotRect.height / 2 - cardRect.y - cardRect.height / 2;

   // Устанавливаем стили для анимации
   cardElement.style.transition = `transform ${animationDuration}ms ease-out`;
   cardElement.style.zIndex = "1000";
   cardElement.style.transform = `translate(${translateX}px, ${translateY}px)`;

   // По завершении анимации вызываем callback
   setTimeout(() => {
      onComplete && onComplete();
   }, animationDuration);
};

export const loadCardImage = async (rank: IRank, suit: ISuit, setSrc: any) => {
   try {
      // Получаем адрес сервера из localStorage
      const serverUrl = localStorage.getItem('cardServerUrl') ?? env.cardServerUrl;
      if (!serverUrl)
         throw new Error('Адрес сервера с картами не найден в localStorage');

      let extension = '.svg';

      // if ([Ranks.Jack, Ranks.King, Ranks.Queen].indexOf(rank.name) != -1) {
      //    extension = '.png'
      // }

      // Формируем URL для загрузки карты с удалённого сервера
      const imageUrl = `${serverUrl}/cards/${suit.name.toLowerCase()}/${rank.name.toLowerCase()}${extension}`;

      // Устанавливаем карту как источник изображения
      setSrc(imageUrl);
   } catch (error) {
      console.error('Ошибка загрузки карты:', error);
   }
};

export const createCardElement = (rank: IRank, suit: ISuit, ref: React.ForwardedRef<unknown>, tableCard: boolean, draggableData?: IDraggableData | undefined, playPlaceAnim: boolean = true) => {

   const cardStyles = tableCard ? tableCardStyles : playerCardStyles;

   const ranksConf = [
      [3, 0, 3], // 6
      [3, 1, 3], // 7
      [3, 2, 3], // 8
      [4, 1, 4], // 9
      [4, 2, 4], // 10
      [0, 1, 0], // A
   ];

   const getSuitsRows = (column: number) => {
      const RANK_OFFSET = 6;
      let count = ranksConf[(rank.value == RankValues.Ace ? 11 : rank.value) - RANK_OFFSET][column - 1];

      if (count === 0) {
         return (
            <div className={`${cardStyles.suit_regular} ${cardStyles.hidden}`}>
               {suit.iconChar}
            </div>
         );
      }

      let rows = Array.from({ length: count }, (_, index) => (
         <div key={index} className={`${cardStyles.suit_regular} ${rank.value == RankValues.Seven && column == 2 ? cardStyles.mt_42 : ''}`}>
            {suit.iconChar}
         </div>
      ));

      return rows;
   }

   let isRed = suit.iconChar == SuitsSymbols.Diamond || suit.iconChar == SuitsSymbols.Heart;
   
   let highRankImg =
      rank.value == RankValues.Queen ? queenImg :
         rank.value == RankValues.King ? kingImg :
            rank.value == RankValues.Jack ? jackImg : null

   return (
      <div
         {...(draggableData?.elementId && { id: draggableData.elementId })}
         {...draggableData?.listeners}
         {...draggableData?.attributes}

         className={`${cardStyles.card} ${isRed ? cardStyles.red : ''} ${draggableData?.isDragging ? cardStyles.dragging : ''} ${draggableData?.isDraggable ? cardStyles.draggable : ''}`}
         ref={(node) => {
            draggableData?.setNodeRef && draggableData.setNodeRef(node);
            if (ref)
               typeof ref === "function" ? ref(node) : (ref.current = node);
         }}

         style={{
            visibility: 'visible',
            animation: tableCard ? (playPlaceAnim ? cardStyles.animation : 'none') : 'none',
            transform: draggableData?.isDraggable ? (draggableData?.transform
               ? `translate3d(${draggableData?.transform.x}px, ${draggableData?.transform.y}px, 0)`
               : draggableData?.rotation !== undefined
                  ? `rotate(${draggableData.rotation}deg) ${draggableData.bottomOffset ? `translateY(${draggableData.bottomOffset}px)` : ''}`
                  : undefined)
               : undefined,
         }}
      >
         {/* Верхний левый угол */}
         <div className={cardStyles.card_top_left}>
            <div className={cardStyles.rank}>{rank.shortName}</div>
            <div className={cardStyles.suit_small} >{suit.iconChar}</div>
         </div>
         {/* Центральная часть с мастями */}
         {rank.value <= RankValues.Ten || rank.value == RankValues.Ace ? (
            <div className={cardStyles.card_suits_container}>
               <div className={cardStyles.card_suits}>
                  {getSuitsRows(1)}
               </div>
               <div className={`${cardStyles.card_suits}`}>
                  {getSuitsRows(2)}
               </div>
               <div className={cardStyles.card_suits}>
                  {getSuitsRows(3)}
               </div>
            </div>
         ) : (
            <div className={`${cardStyles.card_suits_container} ${cardStyles.high_cards_container}`}>
               <span className={`${cardStyles.suit_regular_left_top} ${isRed ? cardStyles.red : ''}`}>{suit.iconChar}</span>
               <div style={{ backgroundImage: `url(${highRankImg})` }}></div>
               <span className={`${cardStyles.suit_regular_right_bottom} ${cardStyles.reversed} ${isRed ? cardStyles.red : ''}`}>{suit.iconChar}</span>
            </div>
         )}
         {/* Нижний правый угол */}
         <div className={cardStyles.card_bottom_right} >
            <div className={cardStyles.rank}> {rank.shortName} </div>
            <div className={cardStyles.suit_small} >{suit.iconChar}</div>
         </div>
      </div>
   );
}

export const Sounds = {
   CardSlideLeft: { id: 1, src: '../src/assets/sounds/card-slideaway.wav' },
   CardAddedToTable: { id: 2, src: '../src/assets/sounds/card-taking.wav' },
   Toast: { id: 3, src: '../src/assets/sounds/toast_sound.mp3' }
}

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
