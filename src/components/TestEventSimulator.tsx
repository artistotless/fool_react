import React, { useState, useRef } from 'react';
import { useSignalR } from '../contexts/SignalRContext';
import { 
  GameUpdateTypes, 
  IActionResultEvent,
  ICardsMovedEvent, 
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  IGameStateSyncEvent,
  Ranks,
  Suits,
  CardLocation
} from '../types';
import { useUser } from '../contexts/UserContext';
import animationService from "../contexts/animationService";
import { useAudio } from "../contexts/AudioContext";
import useGameStore from "../store/gameStore";
import { clearTableAnimated, moveElementTo, Sounds } from "../utils";

// Стили для компонента
const styles = {
  container: {
    position: 'fixed' as const,
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    zIndex: 3000,
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    width: '300px'
  },
  button: {
    backgroundColor: '#4a5568',
    color: 'white',
    padding: '5px 10px',
    margin: '2px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    zIndex: 3000
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
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '5px',
    marginTop: '10px',
    borderTop: '1px solid #4a5568',
    paddingTop: '10px'
  }
};

const TestEventSimulator: React.FC = () => {
  const { user } = useUser();
  const { simulateReceiveEvent } = useSignalR();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>(GameUpdateTypes.ActionResult);
  
  // Получаем необходимые функции и ссылки для кнопок из Test.tsx
  const { clearTable, slots, addCardToHand } = useGameStore();
  const { play } = useAudio();
  const { tableCardsRef } = animationService;
  const elementRef = useRef<HTMLDivElement>(null);

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
  const generateActionResult = () => {
    simulateEvent(GameUpdateTypes.ActionResult, {
      result: {
        success: true,
        actionType: 'attack',
        cardId: `${Suits.Heart}-${Ranks.Ace}`
      } as IActionResultEvent
    });
  };
  
  const generateActionResultError = () => {
    simulateEvent(GameUpdateTypes.ActionResult, {
      result: {
        success: false,
        actionType: 'attack',
        cardId: `${Suits.Heart}-${Ranks.Ace}`,
        errorCode: 'INVALID_CARD',
        errorMessage: 'Невозможно атаковать этой картой'
      } as IActionResultEvent
    });
  };
  
  const generateCardsMoved = () => {
    const fromLocation: CardLocation = { type: 'hand', playerId: user.id };
    const toLocation: CardLocation = { type: 'table', slotId: 0 };
    
    simulateEvent(GameUpdateTypes.CardsMoved, {
      moves: {
        cards: [
          {
            cardId: `${Suits.Heart}-${Ranks.Ace}`,
            fromLocation,
            toLocation,
            isRevealed: true
          }
        ]
      } as ICardsMovedEvent
    });
  };
  
  const generateRoundEnded = () => {
    simulateEvent(GameUpdateTypes.RoundEnded, {
      event: {
        reason: 'allCardsBeaten',
        defenderId: user.id,
        attackerId: 'player-2',
        nextAttackerId: user.id
      } as IRoundEndedEvent
    });
  };
  
  const generateGameStateSync = () => {
    simulateEvent(GameUpdateTypes.GameStateSync, {
      event: {
        slots: Array(6).fill(null).map((_, index) => ({
          id: index,
          cards: index === 0 ? [testCard] : []
        }))
      } as IGameStateSyncEvent
    });
  };
  
  const generateStatePatch = () => {
    simulateEvent(GameUpdateTypes.GameStateSync, {
      event: {
        patch: {
          path: 'state.deckCardsCount',
          value: 10,
          operation: 'set'
        }
      } as IGameStateSyncEvent
    });
  };
  
  const generatePlayerAction = () => {
    simulateEvent(GameUpdateTypes.PlayerAction, {
      event: {
        playerId: 'bot-1',
        actionType: 'attack',
        targetSlotId: 0,
        cardInfo: {
          isHidden: false,
          card: testCard
        }
      } as IPlayerActionEvent
    });
  };
  
  const generatePlayerPass = () => {
    simulateEvent(GameUpdateTypes.PlayerAction, {
      event: {
        playerId: 'bot-1',
        actionType: 'pass'
      } as IPlayerActionEvent
    });
  };
  
  const generateCardsDealt = () => {
    simulateEvent(GameUpdateTypes.CardsDealt, {
      event: {
        playerId: 'currentPlayer',
        count: 3,
        isInitialDeal: true,
        cardsInfo: {
          isHidden: false,
          cards: [testCard]
        }
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

  // Карта событий и их обработчиков
  const eventHandlers: Record<string, () => void> = {
    [GameUpdateTypes.ActionResult + '_success']: generateActionResult,
    [GameUpdateTypes.ActionResult + '_error']: generateActionResultError,
    [GameUpdateTypes.CardsMoved]: generateCardsMoved,
    [GameUpdateTypes.RoundEnded]: generateRoundEnded,
    [GameUpdateTypes.GameStateSync + '_slots']: generateGameStateSync,
    [GameUpdateTypes.GameStateSync + '_patch']: generateStatePatch,
    [GameUpdateTypes.PlayerAction + '_play']: generatePlayerAction,
    [GameUpdateTypes.PlayerAction + '_pass']: generatePlayerPass,
    [GameUpdateTypes.CardsDealt]: generateCardsDealt,
    [GameUpdateTypes.GameFinished]: generateGameFinished
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
  
  // Функции для кнопок из Test.tsx
  const handleClear = () => {
    clearTableAnimated(
      tableCardsRef,
      () => play(Sounds.CardSlideLeft),
      () => clearTable()
    );
  };
  
  const handleDown = () => {
    slots.filter((slot) => slot.cards.length > 0).forEach((slot) => {
      const slotElement = document.getElementById(`slot-${slot.id}`);
      if (!slotElement) return;
      
      moveElementTo(Array.from(slotElement.children) as HTMLElement[], 
        "playercards", 200, undefined, { x: 0, y: 800 }, () => {
          slot.cards.forEach((card) => {
            addCardToHand(card);
            clearTable();
            tableCardsRef.current = {};
          });
      });
    });
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

  // Получаем красивые имена событий для отображения
  const getDisplayName = (eventKey: string): string => {
    // Если это базовый тип с суффиксом
    if (eventKey.includes('_')) {
      const [baseType, suffix] = eventKey.split('_');
      const baseName = Object.entries(GameUpdateTypes).find(([_, value]) => value === baseType)?.[0] || baseType;
      
      switch (suffix) {
        case 'success': return `${baseName} (успех)`;
        case 'error': return `${baseName} (ошибка)`;
        case 'slots': return `${baseName} (обновление слотов)`;
        case 'patch': return `${baseName} (патч состояния)`;
        case 'play': return `${baseName} (сыграть карту)`;
        case 'pass': return `${baseName} (пас)`;
        default: return `${baseName} (${suffix})`;
      }
    }
    
    // Иначе просто ищем имя в перечислении
    return Object.entries(GameUpdateTypes).find(([_, value]) => value === eventKey)?.[0] || eventKey;
  };

  return (
    <div ref={elementRef} style={styles.container}>
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
            {getDisplayName(event)}
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
        <p>Текущее событие: {getDisplayName(selectedEvent)}</p>
      </div>
      
      {/* Кнопки из Test.tsx */}
      <div style={styles.buttonGroup}>
        <h4 style={{ width: '100%', margin: '0 0 5px 0', fontSize: '14px' }}>Быстрые действия</h4>
        <button 
          style={styles.button}
          onClick={handleClear}
        >
          Очистить стол
        </button>
        <button 
          style={styles.button}
          onClick={handleDown}
        >
          Взять карты
        </button>
        <button 
          style={styles.button}
          onClick={() => generateCardsDealt()}
        >
          Раздать карты
        </button>
        <button 
          style={styles.button}
          onClick={() => generateRoundEnded()}
        >
          Завершить раунд
        </button>
      </div>
    </div>
  );
};

export default TestEventSimulator; 