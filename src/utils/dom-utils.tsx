import { CSSProperties } from "react";
import { IDraggableData, IRank, ISuit, RankValues, SuitsSymbols } from "../types";
import playerCardStyles from "../components/ui/Card/playerCard.module.scss";
import tableCardStyles from "../components/ui/Card/tableCard.module.scss";

import queenImg from '../assets/cards/queen.png';
import kingImg from '../assets/cards/king.png';
import jackImg from '../assets/cards/jack.png';

/**
 * element function
 * 
 * Создает DOM элемент с указанными свойствами
 * 
 * @param {string} type - Тип элемента
 * @param {Object} props - Свойства элемента
 * @returns {HTMLElement} Созданный DOM элемент
 */
export const element = (
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

/**
 * Создает HTML элемент карты (DOM элемент)
 * Аналог createCardElement, но возвращает HTMLElement вместо React элемента
 */
export const createCardHtmlElement = (rank: IRank, suit: ISuit, tableCard: boolean, elementId?: string, playPlaceAnim: boolean = false): HTMLElement => {
    const cardStyles = tableCard ? tableCardStyles : playerCardStyles;
    
    const ranksConf = [
       [3, 0, 3], // 6
       [3, 1, 3], // 7
       [3, 2, 3], // 8
       [4, 1, 4], // 9
       [4, 2, 4], // 10
       [0, 1, 0], // A
    ];
    
    let isRed = suit.iconChar == SuitsSymbols.Diamond || suit.iconChar == SuitsSymbols.Heart;
    
    let highRankImg =
       rank.value == RankValues.Queen ? queenImg :
          rank.value == RankValues.King ? kingImg :
             rank.value == RankValues.Jack ? jackImg : null;
    
    // Создаем основной элемент карты
    const cardElement = document.createElement('div');
    // Преобразуем CSS модули в строки
    const cardClass = cardStyles.card || 'card';
    const redClass = isRed ? (cardStyles.red || 'red') : '';
    cardElement.className = `${cardClass} ${redClass}`;
    if (elementId) cardElement.id = elementId;
    
    // Стили
    cardElement.style.visibility = 'visible';
    // Используем строку вместо объекта анимации из CSS модуля
    const animationClass = playPlaceAnim && tableCard ? 'card-animation' : 'none';
    cardElement.style.animation = animationClass !== 'none' ? animationClass : 'none';
    
    // Верхний левый угол
    const topLeft = document.createElement('div');
    topLeft.className = cardStyles.card_top_left || 'card_top_left';
    
    const rankElem = document.createElement('div');
    rankElem.className = cardStyles.rank || 'rank';
    rankElem.textContent = rank.shortName || '';
    
    const suitSmall = document.createElement('div');
    suitSmall.className = cardStyles.suit_small || 'suit_small';
    suitSmall.textContent = suit.iconChar;
    
    topLeft.appendChild(rankElem);
    topLeft.appendChild(suitSmall);
    cardElement.appendChild(topLeft);
    
    // Центральная часть с мастями
    const createSuitRegular = (text: string, additionalClass: string = '') => {
        const div = document.createElement('div');
        div.className = `${cardStyles.suit_regular || 'suit_regular'} ${additionalClass}`;
        div.textContent = text;
        return div;
    };
    
    const suitContainer = document.createElement('div');
    
    if (rank.value <= RankValues.Ten || rank.value == RankValues.Ace) {
        suitContainer.className = cardStyles.card_suits_container || 'card_suits_container';
        
        // Создаем ряды мастей
        const createSuitRows = (column: number) => {
            const RANK_OFFSET = 6;
            let count = ranksConf[(rank.value == RankValues.Ace ? 11 : rank.value) - RANK_OFFSET][column - 1];
            
            const suitsCol = document.createElement('div');
            suitsCol.className = cardStyles.card_suits || 'card_suits';
            
            if (count === 0) {
                const hiddenClass = cardStyles.hidden || 'hidden';
                const hiddenSuit = createSuitRegular(suit.iconChar, hiddenClass);
                suitsCol.appendChild(hiddenSuit);
            } else {
                for (let i = 0; i < count; i++) {
                    const additionalClass = rank.value == RankValues.Seven && column == 2 ? (cardStyles.mt_42 || 'mt_42') : '';
                    const suitElem = createSuitRegular(suit.iconChar, additionalClass);
                    suitsCol.appendChild(suitElem);
                }
            }
            
            return suitsCol;
        };
        
        // Добавляем три колонки мастей
        suitContainer.appendChild(createSuitRows(1));
        suitContainer.appendChild(createSuitRows(2));
        suitContainer.appendChild(createSuitRows(3));
    } else {
        // Фигурные карты (валет, дама, король)
        const highCardsClass = cardStyles.high_cards_container || 'high_cards_container';
        suitContainer.className = `${cardStyles.card_suits_container || 'card_suits_container'} ${highCardsClass}`;
        
        const leftTopSuit = document.createElement('span');
        const leftTopClass = cardStyles.suit_regular_left_top || 'suit_regular_left_top';
        leftTopSuit.className = `${leftTopClass} ${isRed ? (cardStyles.red || 'red') : ''}`;
        leftTopSuit.textContent = suit.iconChar;
        
        const imageContainer = document.createElement('div');
        if (highRankImg) {
            imageContainer.style.backgroundImage = `url(${highRankImg})`;
        }
        
        const rightBottomSuit = document.createElement('span');
        const rightBottomClass = cardStyles.suit_regular_right_bottom || 'suit_regular_right_bottom';
        const reversedClass = cardStyles.reversed || 'reversed';
        rightBottomSuit.className = `${rightBottomClass} ${reversedClass} ${isRed ? (cardStyles.red || 'red') : ''}`;
        rightBottomSuit.textContent = suit.iconChar;
        
        suitContainer.appendChild(leftTopSuit);
        suitContainer.appendChild(imageContainer);
        suitContainer.appendChild(rightBottomSuit);
    }
    
    cardElement.appendChild(suitContainer);
    
    // Нижний правый угол
    const bottomRight = document.createElement('div');
    bottomRight.className = cardStyles.card_bottom_right || 'card_bottom_right';
    
    const rankBottomElem = document.createElement('div');
    rankBottomElem.className = cardStyles.rank || 'rank';
    rankBottomElem.textContent = rank.shortName || '';
    
    const suitBottomSmall = document.createElement('div');
    suitBottomSmall.className = cardStyles.suit_small || 'suit_small';
    suitBottomSmall.textContent = suit.iconChar;
    
    bottomRight.appendChild(rankBottomElem);
    bottomRight.appendChild(suitBottomSmall);
    cardElement.appendChild(bottomRight);
    
    return cardElement;
};