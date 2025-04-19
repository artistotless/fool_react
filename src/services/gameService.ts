import { DragEndEvent } from "@dnd-kit/core";
import animationService from "../contexts/animationService";
import {
  ICard,
  IGameState,
  IPersonalState,
  IWinnersInfo,
  ICardActionResult,
  ICardsMoveEvent,
  IRoundEndedEvent,
  IPlayerCardAction,
  ICardsDealtEvent,
  IGameFinishedEvent
} from "../types";
import { animateCardToSlot, clearTableAnimated, moveCardFromDeck, moveElementTo, Sounds } from "../utils";
import { testMode } from "../environments/environment";

// Максимальное количество карт на столе (как на бэкенде)
const MAX_TABLE_CARDS = 6;

class GameService {
  private static instance: GameService;
  isReloaded: boolean | null = null;
  leftCardsCount: number = 0;

  // Приватный конструктор для предотвращения создания экземпляров извне
  private constructor() { }

  // Статический метод для получения единственного экземпляра
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  // Метод для анимации перемещения карты в слот
  animateCardToSlot(
    card: ICard,
    slotId: number,
    dropPosition: any,
    play: Function
  ) {
    const cardId = `${card.suit.name}-${card.rank.name}`;
    // Создаем копию карты в той же позиции, где было отпущено перетаскивание
    const cardClone = this.createCardClone(cardId, dropPosition);

    // Скрываем оригинальную карту, чтобы она не появлялась в руке
    const originalCard = document.getElementById(`playercard-${cardId}`);
    if (originalCard) {
      originalCard.style.visibility = 'hidden';
    }

    // Добавляем клон в DOM
    document.body.appendChild(cardClone!);

    // Проигрываем звук
    play(Sounds.CardAddedToTable);

    // Анимируем перемещение карты
    animateCardToSlot(`playercard-clone-${cardId}`, `slot-${slotId}`, 300, () => {
      // После завершения анимации удаляем клонированную карту
      const cardClone = document.getElementById(`playercard-clone-${cardId}`);
      if (cardClone) {
        if (originalCard) {
          originalCard.style.visibility = 'visible';
        }
        cardClone.remove();
      }
    });
  }

  // Метод для обработки успешного действия с картой
  handleCardActionAccepted(action: ICardActionResult) {
    console.log(`Действие ${action.actionType} с картой ${action.cardId} успешно принято`);
    // Здесь может быть код для обновления UI или воспроизведения звука
  }

  // Метод для обработки отклоненного действия с картой
  handleCardActionRejected(action: ICardActionResult, addCardToHand: Function) {
    console.log(`Действие ${action.actionType} с картой ${action.cardId} отклонено: ${action.errorMessage}`);

    // Находим оригинальную карту
    const originalCard = document.getElementById(`playercard-${action.cardId}`);
    if (originalCard) {
      originalCard.style.visibility = 'visible';
    }

    // Возвращаем карту в руку игрока
    // Для этого нам нужно получить данные карты
    // В реальном приложении эти данные должны приходить от сервера
    const [suitName, rankName] = action.cardId.split('-');
    // Заглушка, в реальном приложении данные должны приходить от сервера
    const cardData = {
      suit: { name: suitName, iconChar: '' },
      rank: { name: rankName, value: 0 }
    };

    addCardToHand(cardData);
  }

  // Метод для обработки перемещения карт
  handleCardsMoved(
    moves: ICardsMoveEvent,
    play: Function,
    removeCardFromHand: Function,
    addCardToHand: Function,
    addCardToSlot: Function
  ) {
    moves.cards.forEach(move => {
      const [suitName, rankName] = move.cardId.split('-');
      const cardData = {
        suit: { name: suitName, iconChar: '' },
        rank: { name: rankName, value: 0 }
      };

      // Обрабатываем различные типы перемещений
      if (move.fromLocation.type === 'hand' && move.toLocation.type === 'table') {
        // Карта из руки на стол
        if (move.fromLocation.playerId === 'currentPlayer') {
          removeCardFromHand(move.cardId);

          // Анимируем перемещение карты в слот
          if (move.toLocation.slotId !== undefined) {
            // Здесь должна быть анимация
            play(Sounds.CardAddedToTable);

            // Добавляем карту в слот
            addCardToSlot(cardData, move.toLocation.slotId);
          }
        }
      } else if (move.fromLocation.type === 'deck' && move.toLocation.type === 'hand') {
        // Карта из колоды в руку
        play(Sounds.CardFromDeck);
        moveCardFromDeck("playercards", "deck", 400, () => {
          addCardToHand(cardData);
        });
      } else if (move.fromLocation.type === 'table' && move.toLocation.type === 'discard') {
        // Карта из слота в сброс
        // Здесь должна быть анимация отбоя карты
        play(Sounds.CardSlideLeft);
      }
    });
  }

  // Метод для обработки окончания раунда
  handleRoundEnded(event: IRoundEndedEvent, userId: string, clearTable: Function, play: Function) {
    const { tableCardsRef } = animationService;

    if (event.reason === 'allCardsBeaten') {
      // Все карты отбиты
      clearTableAnimated(tableCardsRef,
        () => play(Sounds.CardSlideLeft), clearTable as () => void);
    } else if (event.reason === 'defenderTookCards') {
      // Защищающийся взял карты
      const toElement = event.defenderId === userId ? "playercards" : `player-${event.defenderId}`;
      const offsetY = event.defenderId === userId ? 800 : -400;

      moveElementTo(Object.values(tableCardsRef.current), toElement, 300, undefined, { x: 0, y: offsetY }, () => {
        clearTable();
        tableCardsRef.current = {};
      });
    }
  }

  // Метод для обработки действий других игроков
  handlePlayerAction(event: IPlayerCardAction, play: Function) {
    // Анимируем действия других игроков
    if (event.cardInfo.isHidden) {
      // Другой игрок взял карту из колоды
      play(Sounds.CardFromDeck);
      moveCardFromDeck(`player-${event.playerId}`, "deck", 400);
    } else {
      // Другой игрок сыграл карту
      play(Sounds.CardAddedToTable);
      // Здесь можно добавить анимацию
    }
  }

  // Метод для обработки раздачи карт
  handleCardsDealt(event: ICardsDealtEvent, play: Function) {
    const isCurrentPlayer = event.playerId === 'currentPlayer';

    // Проигрываем звук раздачи карт
    if (event.isInitialDeal) {
      if (event.count > 3) {
        play(Sounds.CardsShuffle);
      } else {
        play(Sounds.CardFromDeck);
      }
    } else {
      play(Sounds.CardFromDeck);
    }

    // Анимируем раздачу карт
    if (isCurrentPlayer) {
      for (let i = 0; i < event.count; i++) {
        setTimeout(() => {
          moveCardFromDeck("playercards", "deck", 400);
        }, i * 200);
      }
    } else {
      for (let i = 0; i < event.count; i++) {
        setTimeout(() => {
          moveCardFromDeck(`player-${event.playerId}`, "deck", 400);
        }, i * 200);
      }
    }
  }

  // Метод для обработки окончания игры
  handleGameFinished(event: IGameFinishedEvent, setWinnersIds: Function) {
    setWinnersIds(event.winners);
    console.log('Статистика игры:', event.statistics);
  }

  // Создание клона карты (сохраняем как есть, так как это UI-функция)
  createCardClone(cardId: string, dropPosition?: { top: number, left: number, width?: number, height?: number } | null): HTMLElement | null {
    // Создаем копию карты в той же позиции, где было отпущено перетаскивание
    const originalCardElement = document.getElementById(`playercard-${cardId}`);
    if (originalCardElement && dropPosition) {
      // Создаем клон карты
      const cardClone = originalCardElement.cloneNode(true) as HTMLElement;
      cardClone.id = `playercard-clone-${cardId}`;
      cardClone.style.position = 'absolute';

      // Используем позицию, где было завершено перетаскивание
      cardClone.style.left = `${dropPosition.left}px`;
      cardClone.style.top = `${dropPosition.top}px`;
      cardClone.style.width = `${originalCardElement.offsetWidth}px`;
      cardClone.style.height = `${originalCardElement.offsetHeight}px`;
      cardClone.style.transform = '';
      cardClone.style.zIndex = '1999';
      cardClone.style.transition = 'none'; // Отключаем анимацию, чтобы клон не "прыгал" в позицию

      return cardClone;
    }

    return null;
  }
}

// Экспортируем синглтон
export const gameService = GameService.getInstance();