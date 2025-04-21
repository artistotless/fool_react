import { ICard, Ranks, RankValues, Suits, SuitsSymbols } from "../types";

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