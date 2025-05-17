import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

export enum GameUpdateTypes {
   // Cобытия состояния игры
   GameStateSync = "GameStateSyncEvent",
   CardsDealt = "CardsDealtEvent", // Получение карт игроком
   PlayerAction = "PlayerActionEvent", // Действия других игроков
   ActionResult = "ActionResultEvent", // Результат действия
   RoundEnded = "RoundEndedEvent", // Информация о завершении раунда
   PlayerHandChanged = "PlayerHandChangedEvent", // Изменение кол-ва карт в руке игрока
   GameFinished = "GameFinishedDto", // Завершение игры
   GameCanceled = "GameCanceledDto", // Отмена игры
   ActivePlayersUpdated = "ActivePlayersUpdatedEvent", // Обновление списка активных игроков
   WinnersUpdated = "WinnersUpdatedEvent", // Обновление списка победителей
   PlayerConnected = "PlayerConnectedEvent", // Игрок подключился
   PlayerDisconnected = "PlayerDisconnectedEvent", // Игрок отключился
   GameStatusUpdated = "GameStatusUpdatedEvent", // Обновление статуса игры
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

export type GameStatus = 'Preparing' | 'InProgress' | 'Finished' | 'Canceled' | 'WaitingForPlayers';

export interface ITableCard {
   defendingCard?: ICard;
   card: ICard;
   slotIndex: number;
}

export interface IGameSyncState {
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
    * The date and time when the game was created.
    */
   created: string | null;

   /**
    * The date and time when the move was made.
    */
   movedAt: string | null;

   /**
    * The time allowed for the move.
    */
   moveTime: string | null;

   /**
    * The time when the game will be canceled.
    */
   cancellationTime: string | null;

   /**
    * The personal state of the current player.
    */
   personalState: IPersonalState;

   /** List of active players who can walk*/
   activePlayers: string[];

   /** Идентификатор игрока*/
   playerId: string;

   /** Winners' identifiers */
   winners: string[];

   /** Connected players' identifiers */
   connectedPlayers: string[];
}

export interface IPersonalState {
   cardsInHand: ICard[];
}

/**
 * Действия с картами, которые возможны в игре
 */
export enum CardActionType {
   Pass = 0,
   Attack = 1,
   Defend = 2,
}

/**
 * Событие раздачи карт
 */
export interface ICardsDealtEvent {
   playerId: string;
   count?: number;
   cards?: ICard[];
}

/**
 * Действие другого игрока
 */
export interface IPlayerActionEvent {
   playerId: string;
   actionType: CardActionType;
   cardInfo?: {
      slotIndex: number;
      card: ICard;
   };
}

/**
 * Результат действия игрока
 */
export interface IActionResultEvent {
   success: boolean;
   actionId: string;
   errorMessage?: string;
}

/**
 * Событие окончания раунда
 */
export interface IRoundEndedEvent {
   reason: 'allCardsBeaten' | 'defenderTookCards';
   attackerId: string;
   defenderId: string;
   deckCardsCount: number;
   cards?: ICard[];
   playersCardsCount: Record<string, number>;
}

/**
 * Событие изменения кол-ва карт в руке игрока
 */
export interface IPlayerHandChangedEvent {
   playerId: string;
   cardsCount: number;
}

/**
 * Событие обновления списка активных игроков
 */
export interface IActivePlayersUpdatedEvent {
   activePlayers: string[];
}

/**
 * Событие окончания игры
 */
export interface IGameFinishedEvent {
   winners: { winners: string[] };
}

/**
 * Событие отмены игры
 */
export interface IGameCanceledEvent {
   reason: string;
}

/**
 * Событие обновления списка победителей
 */
export interface IWinnersUpdatedEvent {
   winners: string[];
}

/**
 * Событие подключения игрока
 */
export interface IPlayerConnectedEvent {
   playerId: string;
}

/**
 * Событие отключения игрока
 */
export interface IPlayerDisconnectedEvent {
   playerId: string;
}

/**
 * Событие обновления статуса игры
 */
export interface IGameStatusUpdatedEvent {
   status: GameStatus;
}