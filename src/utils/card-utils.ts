import { ICard, IRank, ISuit, Ranks, RankValues, Suits, SuitsSymbols } from "../types";
import queenImg from '../assets/cards/queen.png';
import kingImg from '../assets/cards/king.png';
import jackImg from '../assets/cards/jack.png';

/**
 * createRandomCard function
 * 
 * Создает случайную карту с случайной мастью и значением
 * 
 * @returns {ICard} Объект карты
 */
export const createRandomCard = (): ICard => {
   let randomSuit = Math.floor(Math.random() * 4)
   let randomRank = Math.floor(Math.random() * 9)

   const numericRankValues = Object.values(RankValues).filter(value => typeof value === 'number') as number[];
   const suit = { iconChar: Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit] };
   const rank = { name: Object.values(Ranks)[randomRank], value: numericRankValues[randomRank] as number, shortName: Object.values(Ranks)[randomRank] };

   return { suit, rank };
}

/**
 * loadCardImage function
 * 
 * Загружает изображение карты по её масти и значению
 * 
 * @param {IRank} rank - Значение карты
 * @param {ISuit} suit - Масть карты
 * @param {Function} setSrc - Функция для установки источника изображения
 */
export const loadCardImage = async (rank: IRank, suit: ISuit, setSrc: any) => {
   let imagePath = '';

   if (rank.name === Ranks.Queen) {
      imagePath = queenImg;
   } else if (rank.name === Ranks.King) {
      imagePath = kingImg;
   } else if (rank.name === Ranks.Jack) {
      imagePath = jackImg;
   } else {
      imagePath = `src/assets/cards/${rank.value}_of_${suit.name.toLowerCase()}.png`;
   }

   setSrc(imagePath);
}; 

