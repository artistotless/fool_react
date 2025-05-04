import { ICard, IRank, ISuit, Ranks, RankValues, Suits, SuitsSymbols } from "../types";

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
 * getCardDataFromCardId function
 * 
 * Получает данные карты из её идентификатора в формате "suit-rank"
 * 
 * @param {string} cardId - Идентификатор карты в формате "suit-rank"
 * @returns {ICard} Объект карты
 */
export const getCardDataFromCardId = (cardId: string): ICard => {
  const [suitName, rankName] = cardId.split('-');

  // Получаем символ масти
  let iconChar = '';
  switch (suitName) {
    case Suits.Diamond:
      iconChar = '♦';
      break;
    case Suits.Club:
      iconChar = '♣';
      break;
    case Suits.Heart:
      iconChar = '♥';
      break;
    case Suits.Spade:
      iconChar = '♠';
      break;
  }

  // Получаем значение ранга
  let rankValue = 0;
  switch (rankName) {
    case Ranks.Ace:
      rankValue = RankValues.Ace;
      break;
    case Ranks.King:
      rankValue = RankValues.King;
      break;
    case Ranks.Queen:
      rankValue = RankValues.Queen;
      break;
    case Ranks.Jack:
      rankValue = RankValues.Jack;
      break;
    case Ranks.Ten:
      rankValue = RankValues.Ten;
      break;
    case Ranks.Nine:
      rankValue = RankValues.Nine;
      break;
    case Ranks.Eight:
      rankValue = RankValues.Eight;
      break;
    case Ranks.Seven:
      rankValue = RankValues.Seven;
      break;
    case Ranks.Six:
      rankValue = RankValues.Six;
      break;
  }

  const suit: ISuit = {
    name: suitName as Suits,
    iconChar
  };

  const rank: IRank = {
    name: rankName as Ranks,
    shortName: rankName as Ranks,
    value: rankValue
  };

  return { suit, rank };
}