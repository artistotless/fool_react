import { createContext, ReactNode, useContext, useEffect, useMemo, useCallback } from 'react';
import { gameService } from '../services/gameService';
import { useAudio } from './AudioContext';
import { useSignalR } from './SignalRContext';
import { useUser } from './UserContext';
import useGameStore from '../store/gameStore';
import { DragEndEvent } from '@dnd-kit/core';
import {
  GameUpdateTypes,
  IActionResultEvent,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
} from '../types';
import { testMode } from 'src/environments/environment';
import { useToast } from '../services/ToastService';

interface GameServiceContextType {
  handleDragEnd: (event: DragEndEvent) => void;
  pass: () => Promise<void>;
  validateAttack: (cardId: string) => boolean;
  validateDefend: (cardId: string, slotId: number) => boolean;
}

// Создаем контекст
const GameServiceContext = createContext<GameServiceContextType | null>(null);

// Провайдер для GameService
export const GameServiceProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, data, sendData } = useSignalR();
  const { play } = useAudio();
  const { user } = useUser();
  const { showToast } = useToast();

  // Методы и состояние из gameStore
  const {
    state,
    personalState,
    slots,
    passedPlayers,
    setGameState,
    setPersonalState,
    addCardToHand,
    removeCardFromHand,
    clearTable,
    addCardToSlot,
    setWinnersIds,
    setPassedPlayers,
    setSlots,
    removeFromSlot,
    addPassedPlayer,
  } = useGameStore();

  // Обработка событий от SignalR
  useEffect(() => {
    if (!data || !isConnected && !testMode().enabled) return;

    console.log(data);

    switch (data.updateType) {
      // Базовые события
      case GameUpdateTypes.GameState:
        gameService.handleGameState(data.state, setGameState, setPersonalState, setSlots, setPassedPlayers);
        break;

      // Оптимизированные события
      case GameUpdateTypes.ActionResult:
        // Обработка результата действия текущего игрока
        const actionResult = data.result as IActionResultEvent;

        if (actionResult.success)
          gameService.handleSuccessfulAction(actionResult, user.id, setPassedPlayers);
        else
          gameService.handleFailedCardAction(actionResult, addCardToHand, removeFromSlot, showToast);

        break;

      case GameUpdateTypes.RoundEnded:
        // Обработка окончания раунда
        gameService.handleRoundEnded(data.event as IRoundEndedEvent, user.id, clearTable, play);
        break;

      case GameUpdateTypes.PlayerAction:
        // Обработка действий других игроков
        gameService.handlePlayerAction(data.event as IPlayerActionEvent, play, addCardToSlot, addPassedPlayer);
        break;

      case GameUpdateTypes.CardsDealt:
        // Обработка раздачи карт
        data.event.playerId = user.id === data.event.playerId ? "currentPlayer" : data.event.playerId;
        gameService.handleCardsDealt(data.event as ICardsDealtEvent, play, addCardToHand);
        break;

      case GameUpdateTypes.GameFinished:
        // Обработка окончания игры
        gameService.handleGameFinished(data.event as IGameFinishedEvent, setWinnersIds);
        break;

      default:
        console.log("Неизвестный тип события:", data.updateType);
        break;
    }
  }, [data, isConnected]);

  // Запрос обновления данных при подключении
  useEffect(() => {
    if (!isConnected) return;
    sendData("GetUpdate");
    console.log('GetUpdate');
  }, [isConnected, sendData]);

  // Функция для локальной проверки возможности атаки
  const validateAttack = useCallback((cardId: string) => {
    // Получаем данные карты из ID
    const [_, rankName] = cardId.split('-');

    // Проверяем, может ли игрок атаковать
    if (state.attackerId !== user.id && !passedPlayers.includes(state.attackerId || '') && !testMode().enabled) {
      return false;
    }

    // Проверка пустого стола - можно ходить любой картой
    const hasCardsOnTable = slots.some(slot => slot.cards.length > 0);
    if (!hasCardsOnTable) {
      return true;
    }

    // Если стол не пустой, проверяем, что на столе есть карта с таким же достоинством
    const existingRanks = new Set();

    slots.forEach(slot => {
      slot.cards.forEach(card => {
        existingRanks.add(card.rank.name);
      });
    });

    // Если на столе уже есть карта такого же достоинства, то ход разрешен
    if (existingRanks.has(rankName)) {
      return true;
    }

    return false;
  }, [state, user.id, slots, passedPlayers, isConnected]);

  // Функция для локальной проверки возможности защиты
  const validateDefend = useCallback((cardId: string, slotId: number) => {
    // Получаем данные карты из ID
    const [suitName, _] = cardId.split('-');

    // Проверяем, может ли игрок защищаться
    if (state.defenderId !== user.id && !testMode().enabled) {
      return false;
    }

    // Проверяем существование слота и наличие атакующей карты
    const slot = slots[slotId];
    if (!slot || slot.cards.length === 0 || slot.cards.length >= 2) {
      return false;
    }

    // Атакующая карта
    const attackingCard = slot.cards[0];

    // Проверка козыря
    const isTrump = suitName === state.trumpCard?.suit.name;
    const isAttackingTrump = attackingCard.suit.name === state.trumpCard?.suit.name;

    // Проверяем правила защиты:
    // 1. Карта той же масти и старше
    // 2. Козырь, если атакующая карта не козырь
    // 3. Козырь, если атакующая карта тоже козырь, но козырь защищающегося старше

    const defendingRankValue = personalState.cardsInHand.find(
      card => `${card.suit.name}-${card.rank.name}` === cardId
    )?.rank.value || 0;

    if (suitName === attackingCard.suit.name && defendingRankValue > attackingCard.rank.value) {
      return true;
    }

    if (isTrump && !isAttackingTrump) {
      return true;
    }

    if (isTrump && isAttackingTrump && defendingRankValue > attackingCard.rank.value) {
      return true;
    }

    return false;
  }, [state, user.id, slots, personalState.cardsInHand]);

  // Функция для отправки атаки
  const attack = useCallback(async (cardId: string) => {
    if (isConnected)
      await sendData("Attack", cardId);
  }, [sendData, isConnected]);

  // Функция для отправки защиты
  const defend = useCallback(async (cardDefendingId: string, cardAttackingIndex: number) => {
    if (isConnected)
      await sendData("Defend", cardDefendingId, cardAttackingIndex);
  }, [sendData, isConnected]);

  // Функция для передачи хода
  const pass = useCallback(async () => {
    if (isConnected)
      await sendData("Pass");
  }, [sendData, isConnected]);

  // Обработчик завершения перетаскивания
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const card = event.active.data.current?.card;
    if (!card) return;

    let handled = false;

    // Отпустили карту над слотом
    if (event.over && String(event.over?.id).startsWith("slot")) {
      const slotId = Number(String(event.over?.id).split("-")[1]);

      // Защита
      if (state.defenderId === user.id && !testMode().enabled) {
        // Проверяем возможность защиты локально
        const isValid = validateDefend(
          `${card.suit.name}-${card.rank.name}`,
          slotId
        );

        if (isValid) {
          // Используем новый метод для оптимистичного обновления UI
          handled = true;
          gameService.onDroppedToTableSlot(
            card,
            slotId,
            removeCardFromHand,
            addCardToSlot,
            defend,
            attack,
            play,
            'defend',
            event.active.rect.current.translated
          );
        }
      }
    }

    if (handled)
      return;

    // Отпустили карту над столом
    const offset = 120;
    const activeRect = event.active.rect.current.translated;
    let type: 'attack' | 'defend' = 'attack';

    if (!activeRect?.top || !activeRect?.height)
      return;

    const cardHeight = activeRect.height;
    const bottomOfScreen = window.innerHeight;
    if (activeRect.top > ((bottomOfScreen - cardHeight) - offset))
      return;

    let targetSlotId = -1;

    // Если игрок защищается и на столе есть карта, которую можно побить
    if (state.defenderId === user.id || testMode().enabled) {
      // Ищем слот с картой, которую можно побить
      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        // Проверяем, что в слоте есть атакующая карта и нет защищающей
        if (slot.cards.length !== 1)
          continue;

        // Проверяем, можно ли эту карту побить
        if (!validateDefend(`${card.suit.name}-${card.rank.name}`, slot.id))
          continue;

        targetSlotId = slot.id;
        type = 'defend';
        break;
      }
    }

    // Если не нашли карту для защиты или игрок атакует, ищем пустой слот
    if (targetSlotId === -1) {
      // Проверяем возможность атаки локально
      if (!validateAttack(`${card.suit.name}-${card.rank.name}`))
        return;

      targetSlotId = slots.findIndex(slot => slot.cards.length === 0);
      type = 'attack';
    }

    if (targetSlotId === -1)
      return;

    // Используем новый метод для оптимистичного обновления UI
    gameService.onDroppedToTableSlot(
      card,
      targetSlotId,
      removeCardFromHand,
      addCardToSlot,
      defend,
      attack,
      play,
      type,
      event.active.rect.current.translated
    );
  }, [state, user.id, validateDefend, validateAttack, removeCardFromHand, defend, attack, play, addCardToSlot]);

  // Мемоизация контекстного значения
  const contextValue = useMemo(() => ({
    handleDragEnd,
    pass,
    validateAttack,
    validateDefend
  }), [handleDragEnd, pass, validateAttack, validateDefend]);

  return (
    <GameServiceContext.Provider value={contextValue}>
      {children}
    </GameServiceContext.Provider>
  );
};

// Hook для доступа к контексту
export const useGameService = () => {
  const context = useContext(GameServiceContext);
  if (!context) {
    throw new Error("useGameService must be used within a GameServiceProvider");
  }
  return context;
}; 