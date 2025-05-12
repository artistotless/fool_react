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
  IGameCanceledEvent,
  IGameSyncState,
  IActivePlayersUpdatedEvent,
  IWinnersUpdatedEvent,
  IPlayerConnectedEvent,
  IPlayerDisconnectedEvent,
  IGameStatusUpdatedEvent,
} from '../types';
import { testMode } from 'src/environments/environment';
import { useToast } from '../services/ToastService';

interface GameServiceContextType {
  handleDragEnd: (event: DragEndEvent) => void;
  pass: () => void;
  validateAttack: (cardId: string) => boolean;
  validateDefend: (cardId: string, slotId: number) => boolean;
}

// Создаем контекст
const GameServiceContext = createContext<GameServiceContextType | null>(null);

// Провайдер для GameService
export const GameServiceProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, events, sendData, clearProcessedEvent } = useSignalR();
  const { play } = useAudio();
  const { user } = useUser();
  const { showToast } = useToast();

  // Методы и состояние из gameStore
  const store = useGameStore();

  // Обработка событий из очереди SignalR
  useEffect(() => {
    if ((!isConnected && !testMode().enabled) || events.length === 0) return;

    // Обрабатываем первое событие в очереди
    const currentEvent = events[0];
    const eventIndex = 0;

    switch (currentEvent.updateType) {
      // Базовые события
      case GameUpdateTypes.GameStateSync:
        gameService.handleSyncGameState(currentEvent.event as IGameSyncState, play, store);
        break;

      case GameUpdateTypes.PlayerConnected:
        gameService.handlePlayerConnected(currentEvent.event as IPlayerConnectedEvent, store);
        break;

      case GameUpdateTypes.PlayerDisconnected:
        gameService.handlePlayerDisconnected(currentEvent.event as IPlayerDisconnectedEvent, store);
        break;

      case GameUpdateTypes.GameStatusUpdated:
        gameService.handleGameStatusUpdated(currentEvent.event as IGameStatusUpdatedEvent, store);
        break;

      // Оптимизированные события
      case GameUpdateTypes.ActionResult:
        // Обработка результата действия текущего игрока
        const actionResult = currentEvent.event as IActionResultEvent;

        if (actionResult.success)
          gameService.handleSuccessfulAction(actionResult, play, store);
        else
          gameService.handleFailedCardAction(actionResult, user.id, showToast, store);
        break;

      case GameUpdateTypes.ActivePlayersUpdated:
        // Обработка обновления списка активных игроков
        gameService.handleActivePlayersUpdated(currentEvent.event as IActivePlayersUpdatedEvent, store);
        break;

      case GameUpdateTypes.RoundEnded:
        // Обработка окончания раунда
        gameService.handleRoundEnded(currentEvent.event as IRoundEndedEvent, user.id, play, store);
        break;

      case GameUpdateTypes.PlayerAction:
        // Обработка действий других игроков
        store.setMoveAt(new Date().toISOString());
        if (currentEvent.event.playerId !== user.id)
          gameService.handlePlayerAction(currentEvent.event as IPlayerActionEvent, play, store);
        else
          gameService.handleServerAction(currentEvent.event as IPlayerActionEvent, play, store);
        break;

      case GameUpdateTypes.CardsDealt:
        // Обработка раздачи карт
        gameService.handleCardsDealt(currentEvent.event as ICardsDealtEvent, user.id, play, store);
        break;

      case GameUpdateTypes.GameFinished:
        // Обработка окончания игры
        gameService.handleGameFinished(currentEvent.event as IGameFinishedEvent, store);
        break;

      case GameUpdateTypes.GameCanceled:
        // Обработка отмены игры
        gameService.handleGameCanceled(currentEvent.event as IGameCanceledEvent, store, showToast);
        break;

      case GameUpdateTypes.WinnersUpdated:
        // Обработка обновления списка победителей
        gameService.handleWinnersUpdated(currentEvent.event as IWinnersUpdatedEvent, store);
        break;

      default:
        console.log("Неизвестный тип события:", currentEvent.updateType);
        break;
    }

    // Удаляем обработанное событие из очереди
    clearProcessedEvent(eventIndex);
  }, [events, isConnected, clearProcessedEvent]);

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
    // if (store.attackerId !== user.id && !store.passedPlayers.includes(store.attackerId || '') && !testMode().enabled) {
    //   return false;
    // }

    // Проверка пустого стола - можно ходить любой картой
    const hasCardsOnTable = store.slots.some(slot => slot.cards.length > 0);
    if (!hasCardsOnTable) {
      return true;
    }

    // Если стол не пустой, проверяем, что на столе есть карта с таким же достоинством
    const existingRanks = new Set();

    store.slots.forEach(slot => {
      slot.cards.forEach(card => {
        existingRanks.add(card.rank.name);
      });
    });

    // Если на столе уже есть карта такого же достоинства, то ход разрешен
    if (existingRanks.has(rankName)) {
      return true;
    }

    return false;
  }, [user.id, store.slots, store.passedPlayers, isConnected]);

  // Функция для локальной проверки возможности защиты
  const validateDefend = useCallback((cardId: string, slotId: number) => {
    // Получаем данные карты из ID
    const [suitName, _] = cardId.split('-');

    // Проверяем, может ли игрок защищаться
    if (store.defenderId !== user.id && !testMode().enabled) {
      return false;
    }

    // Проверяем существование слота и наличие атакующей карты
    const slot = store.slots[slotId];
    if (!slot || slot.cards.length === 0 || slot.cards.length >= 2) {
      return false;
    }

    // Атакующая карта
    const attackingCard = slot.cards[0];

    // Проверка козыря
    const isTrump = suitName === store.trumpCard?.suit.name;
    const isAttackingTrump = attackingCard.suit.name === store.trumpCard?.suit.name;

    // Проверяем правила защиты:
    // 1. Карта той же масти и старше
    // 2. Козырь, если атакующая карта не козырь
    // 3. Козырь, если атакующая карта тоже козырь, но козырь защищающегося старше

    const defendingRankValue = store.personalState.cardsInHand.find(
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
  }, [user.id, store.slots, store.personalState.cardsInHand]);

  // Функция для отправки атаки
  const attack = useCallback(async (cardId: string, actionId: string) => {
    if (isConnected) {
      try {
        await sendData("Attack", cardId, actionId);
      } catch (error) {
        console.error(error);
      }
    }
  }, [sendData, isConnected]);

  // Функция для отправки защиты
  const defend = useCallback(async (cardDefendingId: string, cardAttackingIndex: number, actionId: string) => {
    if (isConnected)
      try {
        await sendData("Defend", cardDefendingId, cardAttackingIndex, actionId);
      } catch (error) {
        console.error(error);
      }
  }, [sendData, isConnected]);

  const pass = useCallback(() => {
    if (isConnected) {
      gameService.executePass(async (actionId: string) => {
        try {
          await sendData("Pass", actionId);
        } catch (error) {
          console.error(error);
        }
      }, store, user.id);
    }
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
      if (store.defenderId === user.id && !testMode().enabled) {
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
            defend,
            attack,
            play,
            'defend',
            store,
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
    if (store.defenderId === user.id || testMode().enabled) {
      // Ищем слот с картой, которую можно побить
      for (let i = 0; i < store.slots.length; i++) {
        const slot = store.slots[i];
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

      targetSlotId = store.slots.findIndex(slot => slot.cards.length === 0);
      type = 'attack';
    }

    if (targetSlotId === -1)
      return;

    // Используем новый метод для оптимистичного обновления UI
    gameService.onDroppedToTableSlot(
      card,
      targetSlotId,
      defend,
      attack,
      play,
      type,
      store,
      event.active.rect.current.translated
    );
  }, [user.id, validateDefend, validateAttack, store.removeCardFromHand, store.addCardToSlot, defend, attack, play]);

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