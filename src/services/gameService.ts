import { GameStoreState, ISlot, IPendingAction } from "src/store/gameStore";
import animationService from "../contexts/animationService";
import {
  ICard,
  IRoundEndedEvent,
  IPlayerActionEvent,
  ICardsDealtEvent,
  IGameFinishedEvent,
  IActionResultEvent,
  IGameSyncState,
  IGameCanceledEvent,
  CardActionType,
  IActivePlayersUpdatedEvent,
  IWinnersUpdatedEvent,
} from "../types";
import {
  animateCardToSlot,
  clearTableAnimated,
  moveCardFromDeck,
  moveElementTo,
  Sounds,
  generateGuid,
  createFakeCard
} from "../utils";

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

  handleSyncGameState(state: IGameSyncState, store: GameStoreState) {
    let slots: ISlot[] = [];

    Array.from(Array(6).keys()).forEach(slotIndex => {
      const card = state.tableCards.find((card: any) => card.slotIndex === slotIndex);
      slots.push({
        id: slotIndex,
        cards: card ? card.defendingCard ? [card.card, card.defendingCard] : [card.card] : []
      });
    });

    store.setPersonalState(state.personalState);
    store.setDefender(state.defenderId!);
    store.setAttacker(state.attackerId!);
    store.setTrumpCard(state.trumpCard!);
    store.setSlots(slots);
    store.setRounds(state.rounds);
    store.setDeckCardsCount(state.deckCardsCount);
    store.setStatus(state.status);
    store.setPlayers(state.players);
    store.setMoveAt(state.movedAt!);
    store.setMoveTime(state.moveTime!);

    // Обновляем список пасовавших игроков
    const passedPlayers = state.players
      .filter((player: any) => player.passed)
      .map((player: any) => player.id);

    store.setPassedPlayers(passedPlayers);
    store.setActivePlayers(state.activePlayers || []);
  }

  // Метод для обработки успешного действия безы карты
  handleSuccessfulAction(action: IActionResultEvent, playerId: string, store: GameStoreState) {
    // Находим соответствующее действие в pendingActions
    const pendingAction = store.findPendingActionById(action.actionId);

    if (!pendingAction) {
      console.warn(`Действие с actionId ${action.actionId} не найдено в pendingActions`);
      return;
    }

    // Удаляем обработанное действие из списка ожидающих
    store.removePendingAction(action.actionId);

    if (pendingAction.type === 'pass') {
      console.log(`Действие pass успешно выполнено`);
      store.addPassedPlayer(playerId);
    }
    else {
      console.log(`Действие ${pendingAction.type} успешно выполнено`);
    }
  }

  /**
   * Обрабатывает событие обновления списка активных игроков
   */
  handleActivePlayersUpdated(event: IActivePlayersUpdatedEvent, store: GameStoreState) {
    store.setActivePlayers(event.activePlayers);
  }

  // Метод для обработки отклоненного действия с картой
  handleFailedCardAction(action: IActionResultEvent, showToast: Function, store: GameStoreState) {
    // Находим соответствующее действие в pendingActions
    const pendingAction = store.findPendingActionById(action.actionId);

    if (!pendingAction) {
      console.warn(`Действие с actionId ${action.actionId} не найдено в pendingActions`);
      return;
    }

    console.log(`Действие ${pendingAction.type} с картой ${pendingAction.cardId} отклонено: ${action.errorMessage}`);
    const { tableCardsRef } = animationService;

    // Удаляем обработанное действие из списка ожидающих
    store.removePendingAction(action.actionId);

    if (!pendingAction.cardId || !pendingAction.card)
      return;

    const cardData = pendingAction.card;
    const cardElement = tableCardsRef.current[pendingAction.cardId];

    showToast(action.errorMessage!, 'error');

    moveElementTo(cardElement!, "playercards", 300, undefined, undefined, () => {
      delete tableCardsRef.current[pendingAction.cardId!];
      store.addCardToHand(cardData);
      store.removeFromSlot(pendingAction.slotId!, pendingAction.cardId!);
    });
  }

  // Метод для обработки окончания раунда
  handleRoundEnded(event: IRoundEndedEvent, userId: string, play: Function, store: GameStoreState,) {
    const { tableCardsRef } = animationService;
    const clearTable = store.clearTable;

    play(Sounds.CardSlideLeft);

    if (event.reason === 'allCardsBeaten') {
      // Все карты отбиты
      clearTableAnimated(tableCardsRef, undefined, clearTable as () => void);
    } else if (event.reason === 'defenderTookCards') {
      // Защищающийся взял карты
      const toElement = event.defenderId === userId ? "playercards" : `player-${event.defenderId}`;
      moveElementTo(Object.values(tableCardsRef.current), toElement, 300, undefined, { x: 0, y: 0 }, () => {
        clearTable();
        store.addCardToHand(event.cards!);
        tableCardsRef.current = {};
      });
    }

    store.setAttacker(event.newAttackerId);
    store.setDefender(event.newDefenderId);
    store.setRounds(store.rounds + 1);
  }

  // Метод для обработки действий других игроков
  handlePlayerAction(event: IPlayerActionEvent, play: Function, store: GameStoreState) {
    if (event.actionType == CardActionType.Pass) {
      console.log(`Игрок ${event.playerId} выполнил действие ${event.actionType}`);
      store.addPassedPlayer(event.playerId);
      return;
    }

    // Другой игрок сыграл карту
    if (event.actionType === CardActionType.Attack || event.actionType === CardActionType.Defend) {
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

      const fakeCard = createFakeCard(cardData, cardPrefix, position);
      if (!fakeCard) throw new Error("Fake card not found");

      // Анимация перемещения карты от игрока на стол в конкретный слот
      this.moveFakeCardToSlot(fakeCard, event.cardInfo?.slotIndex!, play, undefined,
        () => {
          fakeCard.remove();
          event.cardInfo!.card!.playPlaceAnim = event.actionType === CardActionType.Attack;
          store.addCardToSlot(event.cardInfo!.card!, event.cardInfo?.slotIndex!);
        }
      );
    }
  }

  // Метод для обработки раздачи карт
  handleCardsDealt(event: ICardsDealtEvent, play: Function, store: GameStoreState) {
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
            store.addCardToHand(card);
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
  handleGameFinished(event: IGameFinishedEvent, store: GameStoreState) {
    store.setWinnersIds(event.winners);
    store.setStatus('Finished');
  }

  // Метод для обработки отмены игры
  handleGameCanceled(event: IGameCanceledEvent, store: GameStoreState, showToast: Function) {
    store.setStatus('Canceled');
    showToast(`Игра отменена: ${event.reason}`, 'error');
  }

  // Метод для обработки обновления списка победителей
  handleWinnersUpdated(event: IWinnersUpdatedEvent, store: GameStoreState) {
    store.setWinnersIds(event.winners);
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
    defend: (cardDefendingId: string, cardAttackingIndex: number, actionId: string) => Promise<void>,
    attack: (cardAttackingId: string, actionId: string) => Promise<void>,
    play: ({ id, src }: { id: number, src: string }, loop: boolean) => void,
    type: 'attack' | 'defend',
    store: GameStoreState,
    dropPosition?: { top: number, left: number, width?: number, height?: number } | null
  ) {
    const cardId = `${card.suit.name}-${card.rank.name}`;
    const originalCard = document.getElementById(`playercard-${cardId}`);
    if (!originalCard) throw new Error("Original card not found");

    const size = {
      width: originalCard.offsetWidth,
      height: originalCard.offsetHeight
    };

    const fakeCard = createFakeCard(card, "playercard", dropPosition, size);
    if (!fakeCard) throw new Error("Fake card not found");

    // Генерируем actionId для действия
    const actionId = generateGuid();

    this.moveFakeCardToSlot(fakeCard, slotId, play,
      () => { originalCard!.style.visibility = 'hidden'; },
      () => {
        // После завершения анимации удаляем клонированную карту
        fakeCard.remove();
        originalCard!.style.visibility = 'visible';
        // Сначала добавляем карту в слот, чтобы пользователь сразу видел результат
        card.playPlaceAnim = false;
        store.removeCardFromHand(cardId);
        store.addCardToSlot(card, slotId);

        // Добавляем действие в список ожидающих подтверждения
        const pendingAction: IPendingAction = {
          type,
          cardId,
          slotId,
          card,
          actionId
        };

        store.addPendingAction(pendingAction);

        // Отправляем действие на сервер
        if (type === 'defend')
          defend(cardId, slotId, actionId);
        else
          attack(cardId, actionId);
      });
  }

  // Метод для выполнения действия "пасс"
  executePass(pass: Function, store: GameStoreState) {
    // Генерируем actionId для действия
    const actionId = generateGuid();

    // Добавляем действие в список ожидающих подтверждения
    const pendingAction: IPendingAction = {
      type: 'pass',
      actionId
    };

    store.addPendingAction(pendingAction);

    // Отправляем действие на сервер
    pass(actionId);
  }
}

// Экспортируем синглтон
export const gameService = GameService.getInstance();