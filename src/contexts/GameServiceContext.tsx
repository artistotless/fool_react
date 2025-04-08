import { createContext, ReactNode, useContext, useEffect, useMemo, useCallback } from 'react';
import { gameService } from '../services/gameService';
import { useAudio } from './AudioContext';
import { useSignalR } from './SignalRContext';
import { useUser } from './UserContext';
import useGameStore from '../store/gameStore';
import { DragEndEvent } from '@dnd-kit/core';
import { GameUpdateTypes } from '../types';

interface GameServiceContextType {
  handleDragEnd: (event: DragEndEvent) => void;
  pass: () => Promise<void>;
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
    addPassedPlayer
  } = useGameStore();

  // Обработка событий от SignalR
  useEffect(() => {
    if (data && isConnected) {
      if (data.updateType === GameUpdateTypes.GameState) {
        gameService.handleGameState(data.state, state, user, clearTable, play);
        setGameState(data.state);

        // Обновляем список пасовавших игроков
        const passedPlayers = data.state.players
          .filter((player: any) => player.passed)
          .map((player: any) => player.id);
        setPassedPlayers(passedPlayers);

        // Проверка подтверждений для действий
        gameService.validatePendingActions(data.state, state, slots, setSlots, addCardToHand, addCardToSlot);
      }
      else if (data.updateType === GameUpdateTypes.PersonalState) {
        const isReloadedPage = gameService.isReloaded === null && state.tableCards.length === 0;
        if ((gameService.isReloaded || isReloadedPage) && state.rounds != 0)
          setPersonalState(data.state);
        else
          gameService.handlePersonalState(data.state, personalState, addCardToHand, play);
      }
      else if (data.updateType === GameUpdateTypes.PassedState) {
        gameService.handlePassed(data.state, setPassData);
        // Добавляем игрока в список пасовавших
        addPassedPlayer(data.state.playerId);
      }
      else if (data.winners) {
        gameService.handleWinners(data.winners, setWinnersIds);
      }
    }
  }, [data, isConnected]);

  // Запрос обновления данных при подключении
  useEffect(() => {
    if (!isConnected) return;
    sendData("GetUpdate");
    console.log('GetUpdate');
  }, [isConnected, sendData]);

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
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    gameService.handleDragEnd(
      event,
      state,
      slots,
      user.id,
      passedPlayers,
      removeCardFromHand,
      addCardToSlot,
      defend,
      attack,
      play
    );
  }, [state, slots, user.id, passedPlayers, removeCardFromHand, addCardToSlot, defend, attack, play]);

  // Мемоизация контекстного значения
  const contextValue = useMemo(() => ({
    handleDragEnd,
    pass
  }), [handleDragEnd, pass]);

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