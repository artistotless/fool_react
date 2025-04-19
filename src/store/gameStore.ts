import { create } from 'zustand';
import { IGameState, IPersonalState, ICard, GameStatus, IStatePatchEvent } from 'src/types';
import { testMode } from 'src/environments/environment'; // Используем testMode для инициализации

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
  passData: { playerId: string; defenderId: string; allCardsBeaten: boolean } | null;
  
  // Методы для обновления состояния
  setSlots: (slots: ISlot[]) => void;
  setGameState: (state: IGameState) => void;
  setPersonalState: (personalState: IPersonalState) => void;
  setLeftCardsCount: (count: number) => void;
  setWinnersIds: (ids: string[] | null) => void;
  setPassedPlayers: (playerIds: string[]) => void;
  addPassedPlayer: (playerId: string) => void;
  setPassData: (data: { playerId: string; defenderId: string; allCardsBeaten: boolean } | null) => void;
  applyStatePatch: (patch: IStatePatchEvent) => void;
 
  // Методы для работы с картами
  addCardToHand: (card: ICard | ICard[]) => void;
  removeCardFromHand: (cardId: string) => void;
  addCardToSlot: (card: ICard, slotID: number) => void;
  removeFromSlot: (slotId: number, cardId: string) => void;
  clearTable: () => void;
  pass: () => Promise<void>;
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
    trumpCard: testMode().enabled ? testMode().testTrumpCard : null,
    deckCardsCount: 0,
    status: 'ReadyToBegin' as GameStatus,
    players: testMode().enabled ? testMode().testPlayers : [],
  },
  personalState: {
    cardsInHand: testMode().enabled ? testMode().testCards : [],
  },
  leftCardsCount: 0,
  winnersIds: null,
  passedPlayers: [],
  passData: null,
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
  setPassData: (data) => set({ passData: data }),
  
  // Новый метод для инкрементного обновления состояния
  applyStatePatch: (patch) => set((state) => {
    // Функция для получения значения по пути
    const getValueByPath = (obj: any, path: string) => {
      const parts = path.split('.');
      let current = obj;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Обработка индексов массивов, например "players[0].name"
        const match = part.match(/^([^\[]+)\[(\d+)\]$/);
        if (match) {
          const [, arrayName, indexStr] = match;
          const index = parseInt(indexStr, 10);
          
          if (!current[arrayName] || !Array.isArray(current[arrayName])) {
            return undefined;
          }
          
          current = current[arrayName][index];
        } else {
          if (current[part] === undefined) {
            return undefined;
          }
          current = current[part];
        }
      }
      
      return current;
    };
    
    // Функция для установки значения по пути
    const setValueByPath = (obj: any, path: string, value: any, operation: string) => {
      const parts = path.split('.');
      const lastPart = parts.pop()!;
      let current = obj;
      
      // Доходим до предпоследнего уровня
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Обработка индексов массивов
        const match = part.match(/^([^\[]+)\[(\d+)\]$/);
        if (match) {
          const [, arrayName, indexStr] = match;
          const index = parseInt(indexStr, 10);
          
          if (!current[arrayName]) {
            current[arrayName] = [];
          }
          
          if (!current[arrayName][index]) {
            current[arrayName][index] = {};
          }
          
          current = current[arrayName][index];
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
      
      // Проверяем, содержит ли последняя часть пути индекс массива
      const match = lastPart.match(/^([^\[]+)\[(\d+)\]$/);
      if (match) {
        const [, arrayName, indexStr] = match;
        const index = parseInt(indexStr, 10);
        
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        
        if (operation === 'set') {
          current[arrayName][index] = value;
        } else if (operation === 'remove') {
          current[arrayName].splice(index, 1);
        } else if (operation === 'add') {
          current[arrayName].splice(index, 0, value);
        }
      } else {
        if (operation === 'set') {
          current[lastPart] = value;
        } else if (operation === 'remove') {
          delete current[lastPart];
        } else if (operation === 'add' && Array.isArray(current[lastPart])) {
          current[lastPart].push(value);
        }
      }
    };
    
    // Создаем копию состояния для безопасного обновления
    const newState = { ...state };
    
    // Применяем патч
    setValueByPath(newState, patch.path, patch.value, patch.operation);
    
    return newState;
  }),

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

  // Заглушка для метода pass - будет реализован в gameService
  pass: async () => {
    console.log("pass method called - will be implemented in gameService");
  }
}));

export default useGameStore; 