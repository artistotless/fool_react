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