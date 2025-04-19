import { create } from 'zustand';
import { IGameState, IPersonalState, ICard, GameStatus } from 'src/types';

export interface ISlot {
  id: number;
  cards: ICard[];
}

export interface GameStoreState {
  // Состояния
  slots: ISlot[];
  state: IGameState;
  personalState: IPersonalState;
  leftCardsCount: number;
  winnersIds: string[] | null;
  passedPlayers: string[];
  
  // Методы для обновления состояния
  setSlots: (slots: ISlot[]) => void;
  setGameState: (state: IGameState) => void;
  setPersonalState: (personalState: IPersonalState) => void;
  setLeftCardsCount: (count: number) => void;
  setWinnersIds: (ids: string[] | null) => void;
  setPassedPlayers: (playerIds: string[]) => void;
  addPassedPlayer: (playerId: string) => void;
 
  // Методы для работы с картами
  addCardToHand: (card: ICard | ICard[]) => void;
  removeCardFromHand: (cardId: string) => void;
  addCardToSlot: (card: ICard, slotID: number) => void;
  removeFromSlot: (slotId: number, cardId: string) => void;
  clearTable: () => void;
}

// Функция для получения начального состояния
const getInitialStateValues = () => ({
  slots: Array(6)
    .fill(null)
    .map((_, index) => ({ id: index, cards: [] })),
  state: {
    movedAt: null,
    moveTime: null,
    attackerId: null,
    defenderId: null,
    tableCards: [],
    rounds: 0,
    trumpCard: null,
    deckCardsCount: 0,
    status: 'ReadyToBegin' as GameStatus,
    players: [],
  },
  personalState: {
    cardsInHand: [],
  },
  leftCardsCount: 0,
  winnersIds: null,
  passedPlayers: [],
});

const useGameStore = create<GameStoreState>((set) => ({
  ...getInitialStateValues(),

  // Реализация методов обновления
  setSlots: (slots) => set({ slots }),
  setGameState: (state) => set({ state }),
  setPersonalState: (personalState) => set({ personalState }),
  setLeftCardsCount: (count) => set({ leftCardsCount: count }),
  setWinnersIds: (ids) => set({ winnersIds: ids }),
  setPassedPlayers: (playerIds) => set({ passedPlayers: playerIds }),
  addPassedPlayer: (playerId) => set((state) => ({ passedPlayers: [...state.passedPlayers, playerId] })),
  
  // Реализация методов для работы с картами
  addCardToHand: (card) => set((state) => ({
    personalState: {
      ...state.personalState,
      cardsInHand: Array.isArray(card)
        ? [...state.personalState.cardsInHand, ...card]
        : [...state.personalState.cardsInHand, card]
    }
  })),

  removeCardFromHand: (cardId) => set((state) => ({
    personalState: {
      ...state.personalState,
      cardsInHand: state.personalState.cardsInHand.filter(
        (card) => `${card.suit.name}-${card.rank.name}` !== cardId
      )
    }
  })),

  addCardToSlot: (card, slotID) => set((state) => ({
    slots: state.slots.map((slot) => {
      if (slot.id === slotID) {
        return { ...slot, cards: [...slot.cards, card] };
      }
      return slot;
    })
  })),

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
  })),

  clearTable: () => set((state) => ({
    slots: state.slots.map((slot) => ({ ...slot, cards: [] }))
  })),
}));

export default useGameStore; 