import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

export enum GameUpdateTypes {
   GameState = "GameStateDto",
   PersonalState = "PlayerHandStateDto",
   PassedState = "PlayerPassNotificationDto",
   CardActionAccepted = "CardActionAcceptedDto",
   CardActionRejected = "CardActionRejectedDto",
   CardMoved = "CardMovedDto",
   RoundEnded = "RoundEndedDto",
   TableSlotsUpdated = "TableSlotsUpdatedDto",
   PlayerDrewCards = "PlayerDrewCardsDto",
   PlayerPlayedCard = "PlayerPlayedCardDto",
   CardsDealt = "CardsDealtDto",
   GameFinished = "GameFinishedDto",
   ActionError = "ActionErrorDto",
   CardsMoved = "CardsMovedDto",
   StatePatched = "StatePatchedDto"
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
   setNodeRef: (element: HTMLElement | null) => void,
   rotation?: number,
   bottomOffset?: number
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
   playPlaceAnim?: boolean;
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
   photoURL?: string;
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

   /**
    * The date and time when the move was made.
    */
   movedAt: string | null;

   /**
    * The time allowed for the move.
    */
   moveTime: string | null;
}

export interface IPersonalState {
   cardsInHand: ICard[];
}

export interface IWinnersInfo {
   winners: string[];
}

export interface ICardActionResult {
   cardId: string;
   success: boolean;
   actionType: 'attack' | 'defend';
   slotId?: number;
   errorMessage?: string;
}

export interface ICardMovedEvent {
   cardId: string;
   source: 'hand' | 'table' | 'deck';
   destination: 'hand' | 'table' | 'discard';
   playerId: string;
}

export interface IRoundEndedEvent {
   reason: 'allCardsBeaten' | 'defenderTookCards';
   defenderId: string;
}

export interface IPlayerCardAction {
   playerId: string;
   cardInfo: {
      isHidden: boolean;
      card?: ICard;
   };
}

export interface ICardsDealtEvent {
   playerId: string;
   count: number;
   isInitialDeal: boolean;
}

export interface IGameFinishedEvent {
   winners: string[];
   statistics: {
      playerId: string;
      cardsPlayed: number;
      roundsWon: number;
   }[];
}

export interface IActionErrorEvent {
   actionType: 'attack' | 'defend' | 'pass';
   errorCode: string;
   errorMessage: string;
   originalRequest: any;
}

export interface ICardsMoveEvent {
   cards: {
      cardId: string;
      fromLocation: { type: 'hand' | 'table' | 'deck'; playerId?: string; slotId?: number };
      toLocation: { type: 'hand' | 'table' | 'discard'; playerId?: string; slotId?: number };
   }[];
}

export interface IStatePatchEvent {
   path: string;
   value: any;
   operation: 'set' | 'remove' | 'add';
}