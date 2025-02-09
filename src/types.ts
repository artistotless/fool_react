export enum GameUpdateTypes {
   GameState = "GameStateDto",
   PersonalState = "PlayerHandStateDto"
}

export enum Suits {
   Diamond = "Diamonds",
   Club = "Clubs",
   Heart = "Hearts",
   Spade = "Spades",
}

export enum SuitsSymbols {
   Diamond = '♦',
   Club = '♣',
   Heart = '♥',
   Spade = '♠',
}

export enum Ranks {
   Ace = "Ace",
   Queen = "Queen",
   King = "King",
   Jack = "Jack",
   Two = "2",
   Three = "3",
   Four = "4",
   Five = "5",
   Six = "6",
   Seven = "7",
   Eight = "8",
   Nine = "9",
   Ten = "10",
}

export enum RankValues {
   Ace = 14,
   Queen = 13,
   King = 12,
   Jack = 11,
   Two = 2,
   Three = 3,
   Four = 4,
   Five = 5,
   Six = 6,
   Seven = 7,
   Eight = 8,
   Nine = 9,
   Ten = 10,
}

export interface IRank {
   value: number;
   name: Ranks;
   shortName?: string;
}

export interface ISuit {
   iconChar: string;
   name: Suits;
}

export interface ICard {
   suit: ISuit;
   rank: IRank;
   id: number;
}

export interface IFoolPlayer {
   id: string;
   name:string;
   passed: boolean;
   cardsCount: number;
}

export type GameStatus = 'ReadyToBegin' | 'InProgress' | 'Finished' | 'Canceled';

export interface ITableCard {
   defendingCard?: ICard;
   card: ICard;
   slotIndex: number;
}

export interface IGameState {
   /**
    * The unique identifier of the attacking player.
    */
   attackerId: string | null;

   /**
    * The unique identifier of the defending player.
    */
   defenderId: string | null;

   /**
    * A collection of cards currently on the table.
    */
   tableCards: ITableCard[];

   /**
    * The trump card of the current match.
    */
   trumpCard: ICard | null;

   /**
    * The number of cards remaining in the deck.
    */
   deckCardsCount: number;

   /**
    * The number of rounds played.
    */
   rounds:number;

   /**
    * The current status of the game. Possible values include InProgress, Finished, or Canceled.
    */
   status: GameStatus;

   /**
    * A collection of players participating in the current game,
    * represented by FoolPlayerDto objects containing player-specific information.
    */
   players: IFoolPlayer[];
}

export interface IPersonalState {
   cardsInHand: ICard[];
}