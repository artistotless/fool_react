import React, { useState, useRef } from 'react';
import { useSignalR } from '../../../contexts/SignalRContext';
import { 
  IActionResultEvent,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  Ranks,
  Suits,
} from '../../../types';
import animationService from "../../../contexts/animationService";
import { useAudio } from "../../../contexts/AudioContext";
import useGameStore from "../../../store/gameStore";
import { clearTableAnimated, moveElementTo, Sounds } from "../../../utils";
import { testMode } from 'src/environments/environment';
import styles from './TestEventSimulator.module.css';

// Дополним enum GameUpdateTypes, так как его не хватает в файле types.ts
enum ExtendedGameUpdateTypes {
  GameState = "GameStateDto",
  GameStateSync = "GameStateSyncDto",
  CardsDealt = "CardsDealtDto",
  PlayerAction = "PlayerActionDto",
  ActionResult = "ActionResultDto",
  RoundEnded = "RoundEndedDto",
  GameFinished = "GameFinishedDto"
}

const TestEventSimulator: React.FC = () => {
  const { simulateReceiveEvent } = useSignalR();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>(ExtendedGameUpdateTypes.GameState);
  
  // Получаем необходимые функции и ссылки для кнопок из Test.tsx
  const { clearTable, slots, addCardToHand } = useGameStore();
  const { play } = useAudio();
  const { tableCardsRef } = animationService;
  const elementRef = useRef<HTMLDivElement>(null);

  // Состояние для настройки параметров событий
  const [playerActionParams, setPlayerActionParams] = useState({
    playerId: testMode().testPlayers[1].id,
    actionType: 'attack',
    targetSlotId: 0,
    cardIndex: 0
  });

  // Состояние для настройки параметров RoundEnded
  const [roundEndedParams, setRoundEndedParams] = useState({
    reason: 'defenderTookCards',
    defenderId: testMode().testPlayers[1].id,
    attackerId: testMode().testPlayers[0].id,
    nextAttackerId: testMode().testPlayers[1].id
  });

  // Состояние для настройки параметров ActionResultError
  const [actionResultErrorParams, setActionResultErrorParams] = useState({
    slotId: 0,
    actionType: 'attack',
    errorCode: 'INVALID_CARD',
    errorMessage: 'Невозможно атаковать этой картой',
    cardId: ''
  });

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
    simulateEvent(ExtendedGameUpdateTypes.ActionResult, {
      result: {
        success: true,
        actionType: 'attack',
        cardId: `${Suits.Heart}-${Ranks.Ace}`
      } as IActionResultEvent
    });
  };
  
  const generateActionResultError = () => {
    // Получаем актуальный список карт из выбранного слота
    const slotId = Number(actionResultErrorParams.slotId);
    const cardsInSlot = getCardsFromSlot(slotId);
    
    // Используем сохраненный cardId, только если он соответствует одной из карт в слоте
    let cardIdToUse = actionResultErrorParams.cardId;
    const cardExists = cardsInSlot.some(card => 
      `${card.suit.name}-${card.rank.name}` === cardIdToUse
    );
    
    // Если выбранной карты больше нет в слоте или cardId пустой, берем первую карту из слота
    if (!cardExists || !cardIdToUse) {
      if (cardsInSlot.length > 0) {
        cardIdToUse = `${cardsInSlot[0].suit.name}-${cardsInSlot[0].rank.name}`;
        console.log(`Используем первую карту из слота: ${cardIdToUse}`);
      } else {
        console.warn('В слоте нет карт для отправки ошибки');
        return; // Выходим, если нет карт в слоте
      }
    }
    
    simulateEvent(ExtendedGameUpdateTypes.ActionResult, {
      result: {
        success: false,
        actionType: actionResultErrorParams.actionType,
        cardId: cardIdToUse,
        slotId: slotId,
        errorCode: actionResultErrorParams.errorCode,
        errorMessage: actionResultErrorParams.errorMessage
      } as IActionResultEvent
    });
  };
  
  const generateRoundEnded = () => {
    simulateEvent(ExtendedGameUpdateTypes.RoundEnded, {
      event: {
        reason: roundEndedParams.reason,
        defenderId: roundEndedParams.defenderId,
        attackerId: roundEndedParams.attackerId,
        nextAttackerId: roundEndedParams.nextAttackerId
      } as IRoundEndedEvent
    });
  };
  
  const generatePlayerAction = () => {
    simulateEvent(ExtendedGameUpdateTypes.PlayerAction, {
      event: {
        playerId: playerActionParams.playerId,
        actionType: playerActionParams.actionType,
        targetSlotId: Number(playerActionParams.targetSlotId),
        cardInfo: {
          isHidden: false,
          card: testMode().testCards[Number(playerActionParams.cardIndex)]
        }
      } as IPlayerActionEvent
    });
  };
  
  const generatePlayerPass = () => {
    simulateEvent(ExtendedGameUpdateTypes.PlayerAction, {
      event: {
        playerId:  testMode().testPlayers[1].id,
        actionType: 'pass'
      } as IPlayerActionEvent
    });
  };
  
  const generateCardsDealt = () => {
    simulateEvent(ExtendedGameUpdateTypes.CardsDealt, {
      event: {
        playerId:  testMode().testPlayers[2].id,
        count: 3,
        isInitialDeal: false,
        cardsInfo: {
          isHidden: false,
          cards: testMode().testCards.slice(0, 3)
        }
      } as ICardsDealtEvent
    });
  };
  
  const generateGameFinished = () => {
    simulateEvent(ExtendedGameUpdateTypes.GameFinished, {
      event: {
        winners: [ testMode().testPlayers[0].id],
        statistics: [
          {
            playerId:  testMode().testPlayers[0].id,
            cardsPlayed: 12,
            roundsWon: 3
          }
        ]
      } as IGameFinishedEvent
    });
  };

  const generateGameState = () => {
    simulateEvent(ExtendedGameUpdateTypes.GameState, {
      state: {
        attackerId: testMode().testPlayers[0].id,
        defenderId: testMode().testPlayers[1].id,
        tableCards: [],
        trumpCard: testMode().testTrumpCard,
        personalState: {
          cardsInHand: testMode().testCards
        },
        deckCardsCount: 24,
        rounds: 1,
        status: 'InProgress',
        players: testMode().testPlayers,
        movedAt: testMode().testMovedAt,
        moveTime: testMode().testMoveTime
      }
    });
  };

  // Карта событий и их обработчиков
  const eventHandlers: Record<string, () => void> = {
    [ExtendedGameUpdateTypes.GameState]: generateGameState,
    [ExtendedGameUpdateTypes.ActionResult + '_success']: generateActionResult,
    [ExtendedGameUpdateTypes.ActionResult + '_error']: generateActionResultError,
    [ExtendedGameUpdateTypes.RoundEnded]: generateRoundEnded,
    [ExtendedGameUpdateTypes.PlayerAction + '_play']: generatePlayerAction,
    [ExtendedGameUpdateTypes.PlayerAction + '_pass']: generatePlayerPass,
    [ExtendedGameUpdateTypes.CardsDealt]: generateCardsDealt,
    [ExtendedGameUpdateTypes.GameFinished]: generateGameFinished,
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
      () => play(Sounds.CardSlideLeft,false),
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

  // Получение карт из выбранного слота
  const getCardsFromSlot = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    return slot ? slot.cards : [];
  };

  // Обработчик изменения выбранного слота для ошибки ActionResult
  const handleSlotChange = (slotId: number) => {
    const cards = getCardsFromSlot(slotId);
    setActionResultErrorParams({
      ...actionResultErrorParams,
      slotId,
      cardId: cards.length > 0 ? `${cards[0].suit.name}-${cards[0].rank.name}` : ''
    });
  };

  // Обработчик изменения выбранной карты
  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('Выбрана карта:', e.target.value);
    setActionResultErrorParams({
      ...actionResultErrorParams,
      cardId: e.target.value
    });
  };

  // Рендеринг формы для настройки параметров
  const renderEventForm = () => {
    if (selectedEvent === ExtendedGameUpdateTypes.PlayerAction + '_play') {
      return (
        <div className={styles.form}>
          <h4 className={styles.formTitle}>Настройки атаки</h4>
          
          <label className={styles.label}>
            ID игрока:
            <select 
              className={styles.select}
              value={playerActionParams.playerId}
              onChange={(e) => setPlayerActionParams({...playerActionParams, playerId: e.target.value})}
            >
              {testMode().testPlayers.map((player, index) => (
                <option key={player.id} value={player.id}>
                  Игрок {index + 1}: {player.name}
                </option>
              ))}
            </select>
          </label>
          
          <label className={styles.label}>
            Тип действия:
            <select 
              className={styles.select}
              value={playerActionParams.actionType}
              onChange={(e) => setPlayerActionParams({...playerActionParams, actionType: e.target.value})}
            >
              <option value="attack">Атака</option>
              <option value="defend">Защита</option>
            </select>
          </label>
          
          <label className={styles.label}>
            ID слота (0-5):
            <input 
              type="number" 
              min="0" 
              max="5" 
              className={styles.input}
              value={playerActionParams.targetSlotId}
              onChange={(e) => setPlayerActionParams({...playerActionParams, targetSlotId: Number(e.target.value)})}
            />
          </label>
          
          <label className={styles.label}>
            Индекс карты в тестовых картах:
            <input 
              type="number" 
              min="0" 
              className={styles.input}
              value={playerActionParams.cardIndex}
              onChange={(e) => setPlayerActionParams({...playerActionParams, cardIndex: Number(e.target.value)})}
            />
          </label>
        </div>
      );
    } 
    
    if (selectedEvent === ExtendedGameUpdateTypes.RoundEnded) {
      return (
        <div className={styles.form}>
          <h4 className={styles.formTitle}>Настройки завершения раунда</h4>
          
          <label className={styles.label}>
            Причина:
            <select 
              className={styles.select}
              value={roundEndedParams.reason}
              onChange={(e) => setRoundEndedParams({...roundEndedParams, reason: e.target.value})}
            >
              <option value="allCardsBeaten">Все карты отбиты</option>
              <option value="defenderTookCards">Защищающийся взял карты</option>
            </select>
          </label>
          
          <label className={styles.label}>
            ID защищающегося:
            <select 
              className={styles.select}
              value={roundEndedParams.defenderId}
              onChange={(e) => setRoundEndedParams({...roundEndedParams, defenderId: e.target.value})}
            >
              {testMode().testPlayers.map((player, index) => (
                <option key={player.id} value={player.id}>
                  Игрок {index + 1}: {player.name}
                </option>
              ))}
            </select>
          </label>
          
          <label className={styles.label}>
            ID атакующего:
            <select 
              className={styles.select}
              value={roundEndedParams.attackerId}
              onChange={(e) => setRoundEndedParams({...roundEndedParams, attackerId: e.target.value})}
            >
              {testMode().testPlayers.map((player, index) => (
                <option key={player.id} value={player.id}>
                  Игрок {index + 1}: {player.name}
                </option>
              ))}
            </select>
          </label>
          
          <label className={styles.label}>
            ID следующего атакующего:
            <select 
              className={styles.select}
              value={roundEndedParams.nextAttackerId}
              onChange={(e) => setRoundEndedParams({...roundEndedParams, nextAttackerId: e.target.value})}
            >
              {testMode().testPlayers.map((player, index) => (
                <option key={player.id} value={player.id}>
                  Игрок {index + 1}: {player.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    }
    
    if (selectedEvent === ExtendedGameUpdateTypes.ActionResult + '_error') {
      // Получаем карты из выбранного слота
      const selectedSlotId = Number(actionResultErrorParams.slotId);
      const cardsInSlot = getCardsFromSlot(selectedSlotId);
      
      return (
        <div className={styles.form}>
          <h4 className={styles.formTitle}>Настройки ошибки действия</h4>
          
          <label className={styles.label}>
            ID слота (0-5):
            <input 
              type="number" 
              min="0" 
              max="5" 
              className={styles.input}
              value={actionResultErrorParams.slotId}
              onChange={(e) => handleSlotChange(Number(e.target.value))}
            />
          </label>
          
          <label className={styles.label}>
            Тип действия:
            <select 
              className={styles.select}
              value={actionResultErrorParams.actionType}
              onChange={(e) => setActionResultErrorParams({...actionResultErrorParams, actionType: e.target.value})}
            >
              <option value="attack">Атака</option>
              <option value="defend">Защита</option>
            </select>
          </label>
          
          <label className={styles.label}>
            Карта:
            <select 
              className={styles.select}
              value={actionResultErrorParams.cardId}
              onChange={handleCardChange}
              disabled={cardsInSlot.length === 0}
            >
              {cardsInSlot.length === 0 ? (
                <option value="">Нет карт в слоте</option>
              ) : (
                cardsInSlot.map(card => {
                  const cardId = `${card.suit.name}-${card.rank.name}`;
                  return (
                    <option key={cardId} value={cardId}>
                      {card.suit.name}-{card.rank.name}
                    </option>
                  );
                })
              )}
            </select>
          </label>
          
          <label className={styles.label}>
            Код ошибки:
            <select 
              className={styles.select}
              value={actionResultErrorParams.errorCode}
              onChange={(e) => setActionResultErrorParams({...actionResultErrorParams, errorCode: e.target.value})}
            >
              <option value="INVALID_CARD">INVALID_CARD</option>
              <option value="INVALID_SLOT">INVALID_SLOT</option>
              <option value="NOT_YOUR_TURN">NOT_YOUR_TURN</option>
              <option value="GAME_ENDED">GAME_ENDED</option>
            </select>
          </label>
          
          <label className={styles.label}>
            Сообщение об ошибке:
            <input 
              type="text" 
              className={styles.input}
              value={actionResultErrorParams.errorMessage}
              onChange={(e) => setActionResultErrorParams({...actionResultErrorParams, errorMessage: e.target.value})}
            />
          </label>
        </div>
      );
    }
    
    return null;
  };

  if (!isOpen) {
    return (
      <button 
        className={`${styles.button} ${styles.floatingButton}`}
        onClick={() => setIsOpen(true)}
      >
        🛠 Тест
      </button>
    );
  }

  // Функция для отображения названия события
  const getDisplayName = (eventKey: string): string => {
    // Если ключ содержит суффикс (напр. ActionResult_success)
    if (eventKey.includes('_')) {
      const [baseType, suffix] = eventKey.split('_');
      const baseName = Object.entries(ExtendedGameUpdateTypes).find(([_, value]) => value === baseType)?.[0] || baseType;
      
      switch (suffix) {
        case 'success':
          return `${baseName} (успех)`;
        case 'error':
          return `${baseName} (ошибка)`;
        case 'slots':
          return `${baseName} (слоты)`;
        case 'patch':
          return `${baseName} (патч)`;
        case 'play':
          return `${baseName} (карта)`;
        case 'pass':
          return `${baseName} (пас)`;
        default:
          return `${baseName} (${suffix})`;
      }
    }
    
    // Иначе просто ищем имя в перечислении
    return Object.entries(ExtendedGameUpdateTypes).find(([_, value]) => value === eventKey)?.[0] || eventKey;
  };

  return (
    <div ref={elementRef} className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Симулятор событий сервера</h3>
        <button 
          className={`${styles.button} ${styles.closeButton}`}
          onClick={() => setIsOpen(false)}
        >
          X
        </button>
      </div>

      <select 
        className={styles.select}
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
      >
        {Object.keys(eventHandlers).map(event => (
          <option key={event} value={event}>
            {getDisplayName(event)}
          </option>
        ))}
      </select>

      {renderEventForm()}

      <button 
        className={`${styles.button} ${styles.generateButton}`}
        onClick={handleGenerateEvent}
      >
        Отправить событие
      </button>

      <div className={styles.eventInfo}>
        <p>Текущее событие: {getDisplayName(selectedEvent)}</p>
      </div>
      
      {/* Кнопки из Test.tsx */}
      <div className={styles.buttonGroup}>
        <h4 className={styles.actionTitle}>Быстрые действия</h4>
        <button 
          className={styles.button}
          onClick={handleClear}
        >
          Очистить стол
        </button>
        <button 
          className={styles.button}
          onClick={handleDown}
        >
          Взять карты
        </button>
        <button 
          className={styles.button}
          onClick={() => generateCardsDealt()}
        >
          Раздать карты
        </button>
        <button 
          className={styles.button}
          onClick={() => generateRoundEnded()}
        >
          Завершить раунд
        </button>
      </div>
    </div>
  );
};

export default TestEventSimulator; 