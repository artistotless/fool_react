import { createContext, ReactNode, useContext, useEffect, useMemo, useCallback } from 'react';
import { gameService } from '../services/gameService';
import { useAudio } from './AudioContext';
import { useSignalR } from './SignalRContext';
import { useUser } from './UserContext';
import useGameStore from '../store/gameStore';
import { DragEndEvent } from '@dnd-kit/core';
import { 
  GameUpdateTypes, 
  ICardActionResult, 
  ICardsMoveEvent, 
  IGameFinishedEvent,
  IRoundEndedEvent,
  IPlayerCardAction,
  ICardsDealtEvent,
  IStatePatchEvent
} from '../types';

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

    switch(data.updateType) {
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
        
      case GameUpdateTypes.CardActionAccepted:
        // Обработка успешного действия с картой
        gameService.handleCardActionAccepted(data.action as ICardActionResult);
        break;
        
      case GameUpdateTypes.CardActionRejected:
        // Обработка отклоненного действия с картой
        gameService.handleCardActionRejected(data.action as ICardActionResult, addCardToHand);
        break;
        
      case GameUpdateTypes.CardsMoved:
        // Обработка перемещения карт
        gameService.handleCardsMoved(data.moves as ICardsMoveEvent, play, removeCardFromHand, addCardToHand, addCardToSlot);
        break;
        
      case GameUpdateTypes.RoundEnded:
        // Обработка окончания раунда
        gameService.handleRoundEnded(data.event as IRoundEndedEvent, user.id, clearTable, play);
        break;
        
      case GameUpdateTypes.TableSlotsUpdated:
        // Прямое обновление слотов стола
        setSlots(data.slots);
        break;
        
      case GameUpdateTypes.PlayerDrewCards:
      case GameUpdateTypes.PlayerPlayedCard:
        // Анимации для действий других игроков
        gameService.handlePlayerAction(data.event as IPlayerCardAction, play);
        break;
        
      case GameUpdateTypes.CardsDealt:
        // Анимация раздачи карт
        gameService.handleCardsDealt(data.event as ICardsDealtEvent, play);
        break;
        
      case GameUpdateTypes.GameFinished:
        // Обработка окончания игры
        gameService.handleGameFinished(data.event as IGameFinishedEvent, setWinnersIds);
        break;
        
      case GameUpdateTypes.StatePatched:
        // Инкрементное обновление состояния
        applyStatePatch(data.event as IStatePatchEvent);
        break;
        
      default:
        if (data.winners) {
          setWinnersIds(data.winners);
        }
        break;
    }
  }, [data, isConnected]);

  // Запрос обновления данных при подключении
  useEffect(() => {
    if (!isConnected) return;
    sendData("GetUpdate");
    console.log('GetUpdate');
  }, [isConnected, sendData]);

  // Функция для проверки возможности атаки
  const validateAttack = useCallback(async (cardId: string) => {
    if (!isConnected) return false;
    try {
      const result = await sendData("ValidateAttack", cardId);
      return result && typeof result === 'object' && 'isValid' in result ? !!result.isValid : false;
    } catch (error) {
      console.error("Ошибка при валидации атаки:", error);
      return false;
    }
  }, [sendData, isConnected]);

  // Функция для проверки возможности защиты
  const validateDefend = useCallback(async (cardId: string, slotId: number) => {
    if (!isConnected) return false;
    try {
      const result = await sendData("ValidateDefend", cardId, slotId);
      return result && typeof result === 'object' && 'isValid' in result ? !!result.isValid : false;
    } catch (error) {
      console.error("Ошибка при валидации защиты:", error);
      return false;
    }
  }, [sendData, isConnected]);

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
    
    // Проверяем, куда перетащили карту
    if (String(event.over?.id).startsWith("slot")) {
      const slotId = Number(String(event.over?.id).split("-")[1]);
      
      // Защита
      if (state.defenderId === user.id) {
        // Проверяем возможность защиты у сервера
        const isValid = await validateDefend(
          `${card.suit.name}-${card.rank.name}`, 
          slotId
        );
        
        if (isValid) {
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
        // Проверяем возможность атаки у сервера
        const isValid = await validateAttack(`${card.suit.name}-${card.rank.name}`);
        
        if (isValid) {
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

// Хук для использования контекста
export const useGameService = () => {
  const context = useContext(GameServiceContext);
  if (!context) {
    throw new Error('useGameService must be used within a GameServiceProvider');
  }
  return context;
}; 