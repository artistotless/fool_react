import { CSSProperties, RefObject } from "react";
import back_ic from "src/assets/cards/backs/red.png";

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
   element: string | HTMLElement | HTMLElement[],
   destinationId: string,
   animationDuration: number = 300,
   targetSize?: { width: number, height: number },
   destinationOffset?: { x: number, y: number },
   onComplete?: () => void,
) => {
   let elements: HTMLElement[] = [];

   if (typeof element === 'string') {
      elements[0] = document.getElementById(element) as HTMLElement;
   } else if (Array.isArray(element)) {
      elements = element;
   } else {
      elements[0] = element;
   }

   const destination = document.getElementById(destinationId);

   if (!elements || !destination) {
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

   elements.forEach((element) => {
      const elementRect = getAbsolutePosition(element);
      const destinationRect = getAbsolutePosition(destination);

      const translateX = (destinationRect.x + destinationRect.width / 2 - elementRect.x - elementRect.width / 2) + (destinationOffset ? destinationOffset.x : 0);
      const translateY = (destinationRect.y + destinationRect.height / 2 - elementRect.y - elementRect.height / 2) + (destinationOffset ? destinationOffset.y : 0);

      element.style.willChange = `transform${targetSize ? ', width, height' : ''}`;
      element.style.transition = `transform ${animationDuration}ms linear ${targetSize ? `, width ${animationDuration}ms ease , height ${animationDuration}ms ease ` : ''}`;
      element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px)`;

      if (targetSize) {
         element.style.width = `${targetSize.width}px`;
         element.style.height = `${targetSize.height}px`;
      }
   });

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
   animationDuration: number = 300,
   onComplete?: () => void
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

   moveElementTo(cardElement, targetElement.id, animationDuration, { width: targetWidth, height: targetHeight }, { x: 0, y: -100 }, () => {
      cardElement.remove();
      onComplete && onComplete();
   });
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

   const cardRect = getAbsolutePosition(cardElement);
   
   // Проверяем, есть ли у слота дочерние элементы (карты)
   const isEmptySlot = slotElement.querySelector('.card') === null;
   
   // Если слот пустой, сначала изменяем его размер до размера карты,
   // но делаем невидимым и только потом запускаем анимацию
   if (isEmptySlot) {
      // Добавляем класс has_cards для инициирования плавного изменения размера
      slotElement.classList.add('has_cards');
      
      // Создаём временную карту, которая займёт место в слоте для правильной анимации
      const tempCard = document.createElement('div');
      tempCard.className = 'card temp-card';
      tempCard.style.width = `${cardRect.width}px`;
      tempCard.style.height = `${cardRect.height}px`;
      tempCard.style.visibility = 'hidden';
      tempCard.style.position = 'relative';
      
      // Добавляем временную карту в слот перед началом анимации
      slotElement.appendChild(tempCard);
      slotElement.setAttribute('data-has-cards', 'true'); // устанавливаем data-атрибут
      
      // Функция для удаления временной карты после завершения анимации
      const cleanupTempCard = () => {
         if (tempCard.parentNode === slotElement) {
            slotElement.removeChild(tempCard);
         }
      };
      
      // Задержка перед получением новых координат, чтобы DOM успел обновиться с новыми размерами
      setTimeout(() => {
         // Теперь слот имеет размер карты, получаем его актуальные координаты
         const slotRect = getAbsolutePosition(slotElement);
         
         // Рассчитываем перемещение относительно актуальных координат слота
         const translateX = slotRect.x - cardRect.x;
         const translateY = slotRect.y - cardRect.y;
         
         // Запускаем анимацию перемещения карты
         cardElement.style.transition = `transform ${animationDuration}ms ease-out`;
         cardElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
         
         // Запускаем красивый эффект появления "призрака" карты
         const cardGhost = document.createElement('div');
         cardGhost.className = 'card-ghost';
         cardGhost.style.position = 'absolute';
         cardGhost.style.width = `${cardRect.width}px`;
         cardGhost.style.height = `${cardRect.height}px`;
         cardGhost.style.backgroundColor = 'rgba(234, 234, 234, 0.3)';
         cardGhost.style.transition = `all ${animationDuration}ms ease-out`;
         cardGhost.style.borderRadius = '10px';
         cardGhost.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
         cardGhost.style.border = '1px dashed rgba(42, 171, 238, 0.5)';
         cardGhost.style.left = '50%';
         cardGhost.style.top = '50%';
         cardGhost.style.transform = 'translate(-50%, -50%)';
         cardGhost.style.zIndex = '1';
         cardGhost.style.opacity = '0';
         
         slotElement.appendChild(cardGhost);
         
         setTimeout(() => {
            cardGhost.style.opacity = '1';
         }, 10);
         
         // Удаляем "призрака" перед завершением анимации
         setTimeout(() => {
            if (cardGhost.parentNode === slotElement) {
               cardGhost.style.opacity = '0';
               setTimeout(() => {
                  if (cardGhost.parentNode === slotElement) {
                     slotElement.removeChild(cardGhost);
                  }
               }, 100);
            }
         }, animationDuration - 150);
         
         // Вызываем функцию завершения анимации с небольшой задержкой,
         // чтобы дать время соседним слотам плавно переместиться
         setTimeout(() => {
            cleanupTempCard();
            onComplete && onComplete();
         }, animationDuration);
      }, 50); // Небольшая задержка для обновления DOM
   } else {
      // Для непустого слота просто выполняем стандартную анимацию
      const slotRect = getAbsolutePosition(slotElement);
      
      const translateX = slotRect.x - cardRect.x;
      const translateY = slotRect.y - cardRect.y;
      
      cardElement.style.transition = `transform ${animationDuration}ms ease-out`;
      cardElement.style.transform = `translate(${translateX}px, ${translateY}px)`;
      
      setTimeout(() => {
         onComplete && onComplete();
      }, animationDuration);
   }
};

// Вспомогательная функция для создания DOM элементов
const element = (
   type: string,
   props?: {
      style?: CSSProperties;
      src?: string;
   }
) => {
   const el = document.createElement(type);
   if (props?.style) {
      Object.assign(el.style, props.style);
   }
   if (props?.src) {
      (el as HTMLImageElement).src = props.src;
   }
   return el;
}; 