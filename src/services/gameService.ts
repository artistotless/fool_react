import { S } from "node_modules/framer-motion/dist/types.d-6pKw1mTI";
import animationService from "../contexts/animationService";
import {
  ICard,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  ICardsMovedEvent,
  IActionResultEvent
} from "../types";
import { animateCardToSlot, clearTableAnimated, createCardElement, createCardHtmlElement, moveCardFromDeck, moveElementTo, Sounds } from "../utils";

class GameService {
  private static instance: GameService;
  private pendingActions: { type: 'attack' | 'defend', cardId: string, slotId?: number, card: ICard }[] = [];
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
  MoveCloneCardToSlot(
    card: ICard,
    cardPrefix: string,
    slotId: number,
    startPosition: any,
    size: { width?: number, height?: number },
    play: Function,
    before: Function,
    after: Function
  ) {

    const cardClone = this.createCardCloneNew(card, cardPrefix, startPosition, size);
    if (!cardClone) throw new Error("Card clone not found");

    before && before();
    document.body.appendChild(cardClone!);

    // Проигрываем звук
    play(Sounds.CardAddedToTable);

    // Анимируем перемещение карты
    animateCardToSlot(cardClone, `slot-${slotId}`, 300, () => {
      // После завершения анимации удаляем клонированную карту
      cardClone.remove();
      after && after();
    });
  }

  // Метод для оптимистичного перемещения карты на слот
  onDroppedToTableSlot(
    card: ICard,
    slotId: number,
    removeCardFromHand: Function,
    addCardToSlot: Function,
    defend: Function,
    attack: Function,
    play: Function,
    type: 'attack' | 'defend',
    dropPosition?: { top: number, left: number, width?: number, height?: number } | null
  ) {

    const cardId = `${card.suit.name}-${card.rank.name}`;
    const originalCard = document.getElementById(`playercard-${cardId}`);
    if (!originalCard) throw new Error("Original card not found");

    const size = {
      width: originalCard.offsetWidth,
      height: originalCard.offsetHeight
    };

    this.MoveCloneCardToSlot(card, "playercard", slotId, dropPosition, size, play,
      () => { originalCard!.style.visibility = 'hidden'; },
      () => {
        originalCard!.style.visibility = 'visible';
        // Сначала добавляем карту в слот, чтобы пользователь сразу видел результат
        card.playPlaceAnim = false;
        removeCardFromHand(cardId);
        addCardToSlot(card, slotId);

        // Добавляем действие в список ожидающих подтверждения
        this.pendingActions.push({
          type,
          cardId,
          slotId,
          card
        });

        // Отправляем действие на сервер
        if (type === 'defend')
          defend(cardId, slotId);
        else
          attack(cardId);
      });
  }

  // Метод для обработки успешного действия с картой
  handleSuccessfulCardAction(action: IActionResultEvent) {
    console.log(`Действие ${action.actionType} с картой ${action.cardId} успешно принято`);
    // Здесь может быть код для обновления UI или воспроизведения звука
  }

  // Метод для обработки отклоненного действия с картой
  handleFailedCardAction(action: IActionResultEvent, addCardToHand: Function) {
    console.log(`Действие ${action.actionType} с картой ${action.cardId} отклонено: ${action.errorMessage}`);

    // Находим оригинальную карту
    if (action.cardId) {
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
  }

  // Метод для обработки перемещения карт
  handleCardsMoved(
    moveEvent: ICardsMovedEvent,
    play: Function,
    removeCardFromHand: Function,
    addCardToHand: Function,
    addCardToSlot: Function
  ) {
    moveEvent.cards.forEach(move => {
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
  handlePlayerAction(event: IPlayerActionEvent, play: Function) {
    // Если карта не указана (например, игрок пасовал)
    if (!event.cardInfo) {
      console.log(`Игрок ${event.playerId} выполнил действие ${event.actionType} без карты`);
      return;
    }

    // Другой игрок сыграл карту
    if (event.actionType === 'attack') {
      // Если у нас есть информация о карте и о целевом слоте,
      // мы можем анимировать перемещение карты на стол
      // Анимация перемещения карты от игрока на стол в конкретный слот

    }
  }

  // Метод для обработки раздачи карт
  handleCardsDealt(event: ICardsDealtEvent, play: Function, addCardToHand: Function) {
    const isCurrentPlayer = event.playerId === 'currentPlayer';

    // Проигрываем звук раздачи карт
    if (event.isInitialDeal && isCurrentPlayer)
      play(Sounds.CardsShuffle);

    // Если это текущий игрок и есть информация о картах, добавляем карты в руку
    if (isCurrentPlayer && event.cardsInfo && event.cardsInfo.cards) {
      // Добавляем карты в руку игрока
      event.cardsInfo.cards.forEach((card, index) => {
        setTimeout(() => {
          // if (!event.isInitialDeal)
          play(Sounds.CardFromDeck);
          moveCardFromDeck("playercards", "deck", 400, () => {
            addCardToHand(card);
          });
        }, index * 200);
      });
    }
    // Если это другой игрок просто анимируем
    else {
      // Анимируем раздачу карт
      for (let i = 0; i < event.count; i++) {
        setTimeout(() => {
          const target = `player-${event.playerId}`;
          moveCardFromDeck(target, "deck", 400, undefined,
            { x: 0, y: 0 },
            { width: 20, height: 20 },
            { width: 24, height: 24 });
        }, i * 50);
      }
    }
  }

  // Метод для обработки окончания игры
  handleGameFinished(event: IGameFinishedEvent, setWinnersIds: Function) {
    setWinnersIds(event.winners);
    console.log('Статистика игры:', event.statistics);
  }

  // Создание клона карты (сохраняем как есть, так как это UI-функция)
  createCardCloneNew(card: ICard, cardPrefix: string, startPosition?: { top: number, left: number, width?: number, height?: number } | null, size?: { width?: number, height?: number }): HTMLElement | null {
    const cardId = `${card.suit.name}-${card.rank.name}`;
    // Создаем HTML элемент карты
    const cardClone = createCardHtmlElement(card.rank, card.suit, false, `${cardPrefix}-clone-${cardId}`);

    // Создаем клон карты
    // const cardClone = originalCardElement.cloneNode(true) as HTMLElement;
    cardClone.id = `${cardPrefix}-clone-${cardId}`;
    cardClone.style.position = 'absolute';

    // Используем позицию, где было завершено перетаскивание
    cardClone.style.left = `${startPosition?.left}px`;
    cardClone.style.top = `${startPosition?.top}px`;
    cardClone.style.width = `${size?.width}px`;
    cardClone.style.height = `${size?.height}px`;
    cardClone.style.transform = '';
    cardClone.style.zIndex = '1999';
    cardClone.style.transition = 'none'; // Отключаем анимацию, чтобы клон не "прыгал" в позицию

    return cardClone;
  }

  // Создание клона карты (сохраняем как есть, так как это UI-функция)
  createCardClone(cardId: string, startPosition?: { top: number, left: number, width?: number, height?: number } | null): HTMLElement | null {
    // Создаем копию карты в той же позиции, где было отпущено перетаскивание
    const originalCardElement = document.getElementById(`playercard-${cardId}`);

    if (!originalCardElement || !startPosition)
      return null;

    // Создаем клон карты
    const cardClone = originalCardElement.cloneNode(true) as HTMLElement;
    cardClone.id = `playercard-clone-${cardId}`;
    cardClone.style.position = 'absolute';

    // Используем позицию, где было завершено перетаскивание
    cardClone.style.left = `${startPosition.left}px`;
    cardClone.style.top = `${startPosition.top}px`;
    cardClone.style.width = `${originalCardElement.offsetWidth}px`;
    cardClone.style.height = `${originalCardElement.offsetHeight}px`;
    cardClone.style.transform = '';
    cardClone.style.zIndex = '1999';
    cardClone.style.transition = 'none'; // Отключаем анимацию, чтобы клон не "прыгал" в позицию

    return cardClone;
  }
}

// Экспортируем синглтон
export const gameService = GameService.getInstance();