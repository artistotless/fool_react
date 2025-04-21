import { ISlot } from "src/store/gameStore";
import animationService from "../contexts/animationService";
import {
  ICard,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  IActionResultEvent,
  IGameState,
  Suits,
  Ranks,
  RankValues,
  ISuit,
  IRank
} from "../types";
import { animateCardToSlot, clearTableAnimated, createCardHtmlElement, moveCardFromDeck, moveElementTo, Sounds } from "../utils";

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

  handleGameState(state: IGameState, setGameState: Function, setPersonalState: Function, setSlots: Function, setPassedPlayers: Function) {
    setGameState(state);
    setPersonalState(state.personalState);

    let slots: ISlot[] = [];

    Array.from(Array(6).keys()).forEach(slotIndex => {
      const card = state.tableCards.find(card => card.slotIndex === slotIndex);
      slots.push({
        id: slotIndex,
        cards: card ? card.defendingCard ? [card.card, card.defendingCard] : [card.card] : []
      });
    });

    setSlots(slots);
    // Обновляем список пасовавших игроков
    const passedPlayers = state.players
      .filter((player: any) => player.passed)
      .map((player: any) => player.id);
    setPassedPlayers(passedPlayers);
  }

  // Метод для обработки успешного действия безы карты
  handleSuccessfulAction(action: IActionResultEvent, playerId: string, addPassedPlayer: Function) {
    // Пока что используется только для обработки пасса
    if (action.actionType !== 'pass')
      return;

    console.log(`Действие ${action.actionType} успешно выполнено`);
    addPassedPlayer(playerId);
  }

  // Метод для обработки отклоненного действия с картой
  handleFailedCardAction(action: IActionResultEvent, addCardToHand: Function, removeFromSlot: Function, showToast: Function) {
    console.log(`Действие ${action.actionType} с картой ${action.cardId} отклонено: ${action.errorMessage}`);
    const { tableCardsRef } = animationService;

    if (!action.cardId)
      return;

    const cardData = this.getCardDataFromCardId(action.cardId);
    const cardElement = tableCardsRef.current[action.cardId];

    showToast(action.errorMessage!, 'error');

    moveElementTo(cardElement!, "playercards", 300, undefined, undefined, () => {
      delete tableCardsRef.current[action.cardId!];
      addCardToHand(cardData);
      removeFromSlot(action.slotId!, action.cardId);
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

      moveElementTo(Object.values(tableCardsRef.current), toElement, 300, undefined, { x: 0, y: 0 }, () => {
        clearTable();
        tableCardsRef.current = {};
      });
    }
  }

  // Метод для обработки действий других игроков
  handlePlayerAction(event: IPlayerActionEvent, play: Function, addCardToSlot: Function, addPassedPlayer: Function) {

    if (event.actionType === "pass") {
      console.log(`Игрок ${event.playerId} выполнил действие ${event.actionType}`);
      addPassedPlayer(event.playerId);
      return;
    }

    // Другой игрок сыграл карту
    if (event.actionType === 'attack' || event.actionType === 'defend') {
      const cardPrefix = `othercard-${event.playerId}`;
      const cardData = event.cardInfo?.card as ICard;
      // Получаем координаты отображения карты другого игрока
      const playerElement = document.getElementById(`player-${event.playerId}`);
      let position;

      if (playerElement) {
        const playerRect = playerElement.getBoundingClientRect();
        position = { top: playerRect.top, left: playerRect.left };
      } else {
        position = { top: -100, left: window.innerWidth / 2 };
      }

      const fakeCard = this.createFakeCard(cardData, cardPrefix, position);
      if (!fakeCard) throw new Error("Fake card not found");

      // Анимация перемещения карты от игрока на стол в конкретный слот
      this.moveFakeCardToSlot(fakeCard, event.targetSlotId!, play, undefined,
        () => {
          fakeCard.remove();
          event.cardInfo!.card!.playPlaceAnim = event.actionType === 'attack';
          addCardToSlot(event.cardInfo!.card!, event.targetSlotId!);
        }
      );
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

  // Метод для перемещения фейковой карты в слот
  moveFakeCardToSlot(
    fakeCard: HTMLElement,
    slotId: number,
    play: Function,
    before?: Function,
    after?: Function
  ) {

    if (!fakeCard) throw new Error("Fake Card not found");

    before && before();
    document.body.appendChild(fakeCard);

    // Проигрываем звук
    play(Sounds.CardAddedToTable);

    // Анимируем перемещение карты
    animateCardToSlot(fakeCard, `slot-${slotId}`, 300, () => {
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

    const fakeCard = this.createFakeCard(card, "playercard", dropPosition, size);
    if (!fakeCard) throw new Error("Fake card not found");

    this.moveFakeCardToSlot(fakeCard, slotId, play,
      () => { originalCard!.style.visibility = 'hidden'; },
      () => {
        // После завершения анимации удаляем клонированную карту
        fakeCard.remove();
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

  // Создание фейковой карты
  createFakeCard(card: ICard, cardPrefix: string, startPosition?: { top: number, left: number, width?: number, height?: number } | null, size?: { width: number, height: number }): HTMLElement | null {
    const cardId = `${card.suit.name}-${card.rank.name}`;

    // Создаем HTML элемент карты
    const cardClone = createCardHtmlElement(card.rank, card.suit, false, `${cardPrefix}-fake-${cardId}`);

    // Настраиваем позицию и размеры карты
    cardClone.id = `${cardPrefix}-fake-${cardId}`;
    cardClone.style.position = 'absolute';

    // Используем позицию, где было завершено перетаскивание
    cardClone.style.left = `${startPosition?.left}px`;
    cardClone.style.top = `${startPosition?.top}px`;

    if (size) {
      cardClone.style.width = `${size?.width}px`;
      cardClone.style.height = `${size?.height}px`;
    }

    cardClone.style.transform = '';
    cardClone.style.zIndex = '1999';
    cardClone.style.transition = 'none'; // Отключаем анимацию, чтобы клон не "прыгал" в позицию

    return cardClone;
  }

  // Метод для получения данных карты из её идентификатора
  getCardDataFromCardId(cardId: string): ICard {
    const [suitName, rankName] = cardId.split('-');

    // Получаем символ масти
    let iconChar = '';
    switch (suitName) {
      case Suits.Diamond:
        iconChar = '♦';
        break;
      case Suits.Club:
        iconChar = '♣';
        break;
      case Suits.Heart:
        iconChar = '♥';
        break;
      case Suits.Spade:
        iconChar = '♠';
        break;
    }

    // Получаем значение ранга
    let rankValue = 0;
    switch (rankName) {
      case Ranks.Ace:
        rankValue = RankValues.Ace;
        break;
      case Ranks.King:
        rankValue = RankValues.King;
        break;
      case Ranks.Queen:
        rankValue = RankValues.Queen;
        break;
      case Ranks.Jack:
        rankValue = RankValues.Jack;
        break;
      case Ranks.Ten:
        rankValue = RankValues.Ten;
        break;
      case Ranks.Nine:
        rankValue = RankValues.Nine;
        break;
      case Ranks.Eight:
        rankValue = RankValues.Eight;
        break;
      case Ranks.Seven:
        rankValue = RankValues.Seven;
        break;
      case Ranks.Six:
        rankValue = RankValues.Six;
        break;
    }

    const suit: ISuit = {
      name: suitName as Suits,
      iconChar
    };

    const rank: IRank = {
      name: rankName as Ranks,
      shortName: rankName as Ranks,
      value: rankValue
    };

    return { suit, rank };
  }
}

// Экспортируем синглтон
export const gameService = GameService.getInstance();