import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

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
   Ace = "A",
   King = "K",
   Queen = "Q",
   Jack = "J",
   Ten = "10",
   Nine = "9",
   Eight = "8",
   Seven = "7",
   Six = "6",
}

export enum RankValues {
   Ace = 14,
   King = 13,
   Queen = 12,
   Jack = 11,
   Ten = 10,
   Nine = 9,
   Eight = 8,
   Seven = 7,
   Six = 6,
}

export interface IDraggableData {
   elementId: any,
   transform: any,
   isDragging: boolean,
   isDraggable: boolean,
   listeners: SyntheticListenerMap | undefined,
   attributes: DraggableAttributes,
   setNodeRef: (element: HTMLElement | null) => void
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
}

export interface IFoolPlayer {
   id: string;
   name: string;
   avatar: string;
   passed: boolean;
   cardsCount: number;
}

export interface IUser {
   id: string;
   name: string;
   avatar: string;
}

export interface IUserToken {
   userId: string;
   nickName: string;
   scopes: string[];
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
   rounds: number;

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

export interface IWinnersInfo {
   winners: string[];
}