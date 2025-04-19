import React, { useState } from 'react';
import { useSignalR } from '../contexts/SignalRContext';
import { 
  GameUpdateTypes, 
  ICardActionResult, 
  ICardsMoveEvent, 
  IRoundEndedEvent,
  IPlayerCardAction,
  ICardsDealtEvent,
  IGameFinishedEvent,
  IActionErrorEvent,
  IStatePatchEvent,
  Ranks,
  Suits
} from '../types';
import { useUser } from '../contexts/UserContext';

// Стили для компонента
const styles = {
  container: {
    zIndex: 3000,
    position: 'fixed' as const,
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    width: '300px'
  },
  button: {
    zIndex: 3000,
    backgroundColor: '#4a5568',
    color: 'white',
    padding: '5px 10px',
    margin: '2px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  select: {
    backgroundColor: '#2d3748',
    color: 'white',
    padding: '5px',
    margin: '5px 0',
    width: '100%',
    border: 'none',
    borderRadius: '3px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  title: {
    margin: 0,
    fontSize: '16px'
  }
};

const TestEventSimulator: React.FC = () => {
  const { user } = useUser();
  const { simulateReceiveEvent } = useSignalR();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>(GameUpdateTypes.CardActionAccepted);

  // Создаем базовую карту для тестирования
  const testCard = {
    suit: { name: Suits.Heart, iconChar: '♥' },
    rank: { name: Ranks.Ace, value: 14 }
  };

  // Функция для имитации получения события от сервера
  const simulateEvent = (eventType: string, payload: any) => {
    console.log(`Симуляция события ${eventType}`, payload);
    
    // Вместо отправки на сервер напрямую используем метод simulateReceiveEvent
    simulateReceiveEvent({ 
      updateType: eventType, 
      ...payload 
    });
  };
  
  // Генераторы различных событий
  const generateCardActionAccepted = () => {
    simulateEvent(GameUpdateTypes.CardActionAccepted, {
      action: {
        cardId: `${Suits.Heart}-${Ranks.Ace}`,
        success: true,
        actionType: 'attack'
      } as ICardActionResult
    });
  };
  
  const generateCardActionRejected = () => {
    simulateEvent(GameUpdateTypes.CardActionRejected, {
      action: {
        cardId: `${Suits.Heart}-${Ranks.Ace}`,
        success: false,
        actionType: 'attack',
        errorMessage: 'Невозможно атаковать этой картой'
      } as ICardActionResult
    });
  };
  
  const generateCardsMoved = () => {
    simulateEvent(GameUpdateTypes.CardsMoved, {
      moves: {
        cards: [
          {
            cardId: `${Suits.Heart}-${Ranks.Ace}`,
            fromLocation: { type: 'hand', playerId: user.id },
            toLocation: { type: 'table', slotId: 0 }
          }
        ]
      } as ICardsMoveEvent
    });
  };
  
  const generateRoundEnded = () => {
    simulateEvent(GameUpdateTypes.RoundEnded, {
      event: {
        reason: 'allCardsBeaten',
        defenderId: user.id 
      } as IRoundEndedEvent
    });
  };
  
  const generateTableSlotsUpdated = () => {
    simulateEvent(GameUpdateTypes.TableSlotsUpdated, {
      slots: Array(6).fill(null).map((_, index) => ({
        id: index,
        cards: index === 0 ? [testCard] : []
      }))
    });
  };
  
  const generatePlayerDrewCards = () => {
    simulateEvent(GameUpdateTypes.PlayerDrewCards, {
      event: {
        playerId: 'bot-1', // ID другого игрока
        cardInfo: {
          isHidden: true
        }
      } as IPlayerCardAction
    });
  };
  
  const generatePlayerPlayedCard = () => {
    simulateEvent(GameUpdateTypes.PlayerPlayedCard, {
      event: {
        playerId: 'bot-1', // ID другого игрока
        cardInfo: {
          isHidden: false,
          card: testCard
        }
      } as IPlayerCardAction
    });
  };
  
  const generateCardsDealt = () => {
    simulateEvent(GameUpdateTypes.CardsDealt, {
      event: {
        playerId: 'currentPlayer',
        count: 3,
        isInitialDeal: true
      } as ICardsDealtEvent
    });
  };
  
  const generateGameFinished = () => {
    simulateEvent(GameUpdateTypes.GameFinished, {
      event: {
        winners: [user.id],
        statistics: [
          {
            playerId: user.id,
            cardsPlayed: 12,
            roundsWon: 3
          }
        ]
      } as IGameFinishedEvent
    });
  };
  
  const generateActionError = () => {
    simulateEvent(GameUpdateTypes.ActionError, {
      event: {
        actionType: 'attack',
        errorCode: 'E001',
        errorMessage: 'Недопустимое действие',
        originalRequest: { cardId: `${Suits.Heart}-${Ranks.Ace}` }
      } as IActionErrorEvent
    });
  };
  
  const generateStatePatched = () => {
    simulateEvent(GameUpdateTypes.StatePatched, {
      event: {
        path: 'state.deckCardsCount',
        value: 10,
        operation: 'set'
      } as IStatePatchEvent
    });
  };

  // Карта событий и их обработчиков
  const eventHandlers: Record<string, () => void> = {
    [GameUpdateTypes.CardActionAccepted]: generateCardActionAccepted,
    [GameUpdateTypes.CardActionRejected]: generateCardActionRejected,
    [GameUpdateTypes.CardsMoved]: generateCardsMoved,
    [GameUpdateTypes.RoundEnded]: generateRoundEnded,
    [GameUpdateTypes.TableSlotsUpdated]: generateTableSlotsUpdated,
    [GameUpdateTypes.PlayerDrewCards]: generatePlayerDrewCards,
    [GameUpdateTypes.PlayerPlayedCard]: generatePlayerPlayedCard,
    [GameUpdateTypes.CardsDealt]: generateCardsDealt,
    [GameUpdateTypes.GameFinished]: generateGameFinished,
    [GameUpdateTypes.ActionError]: generateActionError,
    [GameUpdateTypes.StatePatched]: generateStatePatched
  };

  // Функция для обработки выбранного события
  const handleGenerateEvent = () => {
    const handler = eventHandlers[selectedEvent];
    if (handler) {
      handler();
    } else {
      console.error(`Обработчик для события ${selectedEvent} не найден`);
    }
  };

  if (!isOpen) {
    return (
      <button 
        style={{ ...styles.button, position: 'fixed', bottom: '10px', right: '10px' }}
        onClick={() => setIsOpen(true)}
      >
        🛠 Тест
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Симулятор событий сервера</h3>
        <button 
          style={{ ...styles.button, backgroundColor: '#e53e3e' }}
          onClick={() => setIsOpen(false)}
        >
          X
        </button>
      </div>

      <select 
        style={styles.select}
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
      >
        {Object.keys(eventHandlers).map(event => (
          <option key={event} value={event}>
            {event}
          </option>
        ))}
      </select>

      <button 
        style={styles.button}
        onClick={handleGenerateEvent}
      >
        Отправить событие
      </button>

      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        <p>Текущее событие: {selectedEvent}</p>
      </div>
    </div>
  );
};

export default TestEventSimulator; 