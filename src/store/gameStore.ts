import { create } from 'zustand';
import { devtools } from 'zustand/middleware'
import { IPersonalState, ICard, GameStatus, IFoolPlayer } from 'src/types';

export interface ISlot {
  id: number;
  cards: ICard[];
}

export interface IPendingAction {
  type: 'attack' | 'defend' | 'pass';
  cardId?: string;
  slotId?: number;
  card?: ICard;
  actionId: string;
}

export interface GameStoreState {
  // Состояние
  slots: ISlot[];
  attackerId: string,
  defenderId: string,
  trumpCard: ICard | null;
  deckCardsCount: number;
  rounds: number;
  status: GameStatus;
  players: IFoolPlayer[];
  movedAt: string | null;
  moveTime: string | null;
  personalState: IPersonalState;
  winnersIds: string[] | null;
  passedPlayers: string[];
  activePlayers: string[];
  pendingActions: IPendingAction[];

  // Методы для обновления состояния
  setSlots: (slots: ISlot[]) => void;
  setAttacker: (id: string) => void;
  setDefender: (id: string) => void;
  setRounds: (rounds: number) => void;
  setDeckCardsCount: (deckCardsCount: number) => void;
  setMoveAt: (moveAt: string) => void;
  setMoveTime: (moveTime: string) => void;
  setPlayers: (players: IFoolPlayer[]) => void;
  setStatus: (status: GameStatus) => void;
  setPersonalState: (personalState: IPersonalState) => void;
  setWinnersIds: (ids: string[] | null) => void;
  setPassedPlayers: (playerIds: string[]) => void;
  addPassedPlayer: (playerId: string) => void;
  setActivePlayers: (playerIds: string[]) => void;

  // Методы для работы с картами
  setTrumpCard: (trump: ICard) => void;
  addCardToHand: (card: ICard | ICard[]) => void;
  removeCardFromHand: (cardId: string) => void;
  addCardToSlot: (card: ICard, slotID: number) => void;
  removeFromSlot: (slotId: number, cardId: string) => void;
  clearTable: () => void;
  
  // Методы для работы с ожидающими действиями
  addPendingAction: (action: IPendingAction) => void;
  removePendingAction: (actionId: string) => IPendingAction | undefined;
  findPendingActionById: (actionId: string) => IPendingAction | undefined;
}

// Функция для получения начального состояния
const getInitialStateValues = () => ({
  slots: Array(6)
    .fill(null)
    .map((_, index) => ({ id: index, cards: [] })),
  attackerId: '',
  defenderId: '',
  trumpCard: null,
  deckCardsCount: 0,
  rounds: 0,
  status: 'ReadyToBegin' as GameStatus,
  players: [],
  movedAt: null,
  moveTime: null,
  personalState: {
    cardsInHand: [],
  },
  winnersIds: null,
  passedPlayers: [],
  activePlayers: [],
  pendingActions: [],
});

const useGameStore = create<GameStoreState>()(
  devtools(
    (set, get) => ({
      ...getInitialStateValues(),

      // Реализация методов обновления
      setPlayers: (players) => set({ players }, undefined, 'game/setPlayers'),
      setStatus: (status) => set({ status }, undefined, 'game/setStatus'),
      setSlots: (slots) => set({ slots }, undefined, 'game/setSlots'),
      setAttacker: (id) => set({ attackerId: id }, undefined, 'game/setAttacker'),
      setDefender: (id) => set({ defenderId: id }, undefined, 'game/setDefender'),
      setRounds: (rounds) => set({ rounds }, undefined, 'game/setRounds'),
      setDeckCardsCount: (deckCardsCount) => set({ deckCardsCount }, undefined, 'game/setDeckCardsCount'),
      setMoveAt: (moveAt) => set({ movedAt: moveAt }, undefined, 'game/setMoveAt'),
      setMoveTime: (moveTime) => set({ moveTime }, undefined, 'game/setMoveTime'),
      setTrumpCard: (trump) => set({ trumpCard: trump }, undefined, 'game/setTrumpCard'),
      setPersonalState: (personalState) => set({ personalState }, undefined, 'game/setPersonalState'),
      setWinnersIds: (ids) => set({ winnersIds: ids }, undefined, 'game/setWinnersIds'),
      setPassedPlayers: (playerIds) => set({ passedPlayers: playerIds }, undefined, 'game/setPassedPlayers'),
      addPassedPlayer: (playerId) => set((state) => ({ passedPlayers: [...state.passedPlayers, playerId] }), undefined, 'game/addPassedPlayer'),
      setActivePlayers: (playerIds) => set({ activePlayers: playerIds }, undefined, 'game/setActivePlayers'),

      // Реализация методов для работы с картами
      addCardToHand: (card) => set((state) => ({
        personalState: {
          ...state.personalState,
          cardsInHand: Array.isArray(card)
            ? [...state.personalState.cardsInHand, ...card]
            : [...state.personalState.cardsInHand, card]
        }
      }), undefined, 'game/addCardToHand'),

      removeCardFromHand: (cardId) => set((state) => ({
        personalState: {
          ...state.personalState,
          cardsInHand: state.personalState.cardsInHand.filter(
            (card) => `${card.suit.name}-${card.rank.name}` !== cardId
          )
        }
      }), undefined, 'game/removeCardFromHand'),

      addCardToSlot: (card, slotID) => set((state) => ({
        slots: state.slots.map((slot) => {
          if (slot.id === slotID) {
            return { ...slot, cards: [...slot.cards, card] };
          }
          return slot;
        })
      }), undefined, 'game/addCardToSlot'),

      removeFromSlot: (slotId, cardId) => set((state) => ({
        slots: state.slots.map((slot) => {
          if (slot.id === slotId) {
            return {
              ...slot,
              cards: slot.cards.filter((card) => `${card.suit.name}-${card.rank.name}` !== cardId)
            };
          }
          return slot;
        })
      }), undefined, 'game/removeFromSlot'),

      clearTable: () => set((state) => ({
        slots: state.slots.map((slot) => ({ ...slot, cards: [] }))
      }), undefined, 'game/clearTable'),
      
      // Методы для работы с ожидающими действиями
      addPendingAction: (action) => set((state) => ({
        pendingActions: [...state.pendingActions, action]
      }), undefined, 'game/addPendingAction'),
      
      removePendingAction: (actionId) => {
        const state = get();
        const actionIndex = state.pendingActions.findIndex(a => a.actionId === actionId);
        if (actionIndex === -1) return undefined;
        
        const action = state.pendingActions[actionIndex];
        set({
          pendingActions: state.pendingActions.filter((_, index) => index !== actionIndex)
        }, undefined, 'game/removePendingAction');
        
        return action;
      },
      
      findPendingActionById: (actionId) => {
        const state = get();
        return state.pendingActions.find(a => a.actionId === actionId);
      },
    }),
    { name: 'Game Store' }
  )
);

export default useGameStore; 