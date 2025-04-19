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
  ICardsMovedEvent,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  IGameStateSyncEvent,
  CardActionType
} from '../types';
import { testMode } from 'src/environments/environment';

interface GameServiceContextType {
  handleDragEnd: (event: DragEndEvent) => void;
  pass: () => Promise<void>;
  validateAttack: (cardId: string) => Promise<boolean>;
  validateDefend: (cardId: string, slotId: number) => Promise<boolean>;
}

// Создаем контекст
const GameServiceContext = createContext<GameServiceContextType | null>(null);

// Провайдер для GameService
export const GameServiceProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, data, sendData } = useSignalR();
  const { play } = useAudio();
  const { user } = useUser();

  // Методы и состояние из gameStore
  const {
    state,
    personalState,
    slots,
    passedPlayers,
    setGameState,
    setPersonalState,
    setSlots,
    addCardToHand,
    removeCardFromHand,
    clearTable,
    addCardToSlot,
    setWinnersIds,
    setPassData,
    setPassedPlayers,
    addPassedPlayer,
    applyStatePatch
  } = useGameStore();

  // Обработка событий от SignalR
  useEffect(() => {
    if (!data || !isConnected) return;

    switch (data.updateType) {
      // Базовые события
      case GameUpdateTypes.GameState:
        setGameState(data.state);

        // Обновляем список пасовавших игроков
        const passedPlayers = data.state.players
          .filter((player: any) => player.passed)
          .map((player: any) => player.id);
        setPassedPlayers(passedPlayers);
        break;

      case GameUpdateTypes.PersonalState:
        setPersonalState(data.state);
        break;

      case GameUpdateTypes.PassedState:
        setPassData(data.state);

        // Добавляем игрока в список пасовавших
        addPassedPlayer(data.state.playerId);

        // Очищаем состояние через 2 секунды
        setTimeout(() => {
          setPassData(null);
        }, 2000);
        break;

      // Оптимизированные события
      case GameUpdateTypes.ActionResult:
        // Обработка результата действия текущего игрока
        const actionResult = data.result as IActionResultEvent;

        if (actionResult.success) {
          // Успешное действие
          console.log(`Действие ${actionResult.actionType} успешно выполнено`);

          // Если это было атакой или защитой с указанной картой, возможно нужны дополнительные действия
          if (actionResult.cardId && (actionResult.actionType === 'attack' || actionResult.actionType === 'defend')) {
            gameService.handleSuccessfulCardAction(actionResult);
          }
        } else {
          // Действие отклонено
          console.error(`Действие ${actionResult.actionType} отклонено: ${actionResult.errorMessage}`);

          // Если произошла ошибка с картой, возвращаем её в руку
          if (actionResult.cardId) {
            gameService.handleFailedCardAction(actionResult, addCardToHand);
          }

          // Можно показать сообщение об ошибке
        }
        break;

      case GameUpdateTypes.CardsMoved:
        // Обработка перемещения карт
        gameService.handleCardsMoved(data.moves as ICardsMovedEvent, play, removeCardFromHand, addCardToHand, addCardToSlot);
        break;

      case GameUpdateTypes.RoundEnded:
        // Обработка окончания раунда
        gameService.handleRoundEnded(data.event as IRoundEndedEvent, user.id, clearTable, play);
        break;

      case GameUpdateTypes.GameStateSync:
        // Обработка синхронизации состояния
        const syncEvent = data.event as IGameStateSyncEvent;

        // Если пришли обновленные слоты
        if (syncEvent.slots) {
          setSlots(syncEvent.slots);
        }

        // Если пришел патч для конкретного поля
        if (syncEvent.patch) {
          applyStatePatch(syncEvent.patch);
        }
        break;

      case GameUpdateTypes.PlayerAction:
        // Обработка действий других игроков
        gameService.handlePlayerAction(data.event as IPlayerActionEvent, play);
        break;

      case GameUpdateTypes.CardsDealt:
        // Обработка раздачи карт
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
  const validateAttack = useCallback(async (cardId: string) => {
    if (!isConnected) return false;

    try {
      // Получаем данные карты из ID
      const [suitName, rankName] = cardId.split('-');

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
    } catch (error) {
      console.error("Ошибка при валидации атаки:", error);
      return false;
    }
  }, [state, user.id, slots, passedPlayers, isConnected]);

  // Функция для локальной проверки возможности защиты
  const validateDefend = useCallback(async (cardId: string, slotId: number) => {
    if (!isConnected) return false;

    try {
      // Получаем данные карты из ID
      const [suitName, rankName] = cardId.split('-');

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
    } catch (error) {
      console.error("Ошибка при валидации защиты:", error);
      return false;
    }
  }, [state, user.id, slots, personalState.cardsInHand, isConnected]);

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

    console.log(event.over);
    
    // Проверяем, куда перетащили карту
    if (String(event.over?.id).startsWith("slot")) {
      const slotId = Number(String(event.over?.id).split("-")[1]);

      // Защита
      if (state.defenderId === user.id) {
        // Проверяем возможность защиты локально
        const isValid = await validateDefend(
          `${card.suit.name}-${card.rank.name}`,
          slotId
        );

        if (isValid) {
          // Оптимистично выполняем действие
          removeCardFromHand(`${card.suit.name}-${card.rank.name}`);

          // Анимируем перемещение карты
          gameService.animateCardToSlot(
            card,
            slotId,
            event.active.rect.current.translated,
            play
          );

          // Отправляем команду серверу
          defend(`${card.suit.name}-${card.rank.name}`, slotId);
        }
      }
       
      // Атака
      else {
        // Проверяем положение карты относительно середины экрана
        const offset = 50;
        const middleOfDropZone = (window.innerHeight / 2) + offset;
        const activeRect = event.active.rect.current.translated;
        
        if (!activeRect?.top) {
          return;
        }
        
        // Проверяем, что карта находится выше середины экрана
        if (activeRect.top > middleOfDropZone) {
          return;
        }
        
        // Проверяем возможность атаки локально
        const isValid = await validateAttack(`${card.suit.name}-${card.rank.name}`);

        if (isValid) {
          // Оптимистично выполняем действие
          removeCardFromHand(`${card.suit.name}-${card.rank.name}`);

          // Анимируем перемещение карты
          gameService.animateCardToSlot(
            card,
            slotId,
            event.active.rect.current.translated,
            play
          );

          // Отправляем команду серверу
          attack(`${card.suit.name}-${card.rank.name}`);
        }
      }
    }
  }, [state, user.id, validateDefend, validateAttack, removeCardFromHand, defend, attack, play]);

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