import { DragEndEvent } from "@dnd-kit/core";
import { useRef, useEffect, useCallback } from "react";
import animationService from "../contexts/animationService";
import { useAudio } from "../contexts/AudioContext";
import { useSignalR } from "../contexts/SignalRContext";
import { useUser } from "../contexts/UserContext";
import useGameStore from "../store/gameStore";
import { GameUpdateTypes, ICard, IGameState, IPersonalState, IWinnersInfo } from "../types";
import { animateCardToSlot, clearTableAnimated, moveCardFromDeck, moveElementTo, Sounds } from "../utils";
import { testMode } from "../environments/environment";

// Максимальное количество карт на столе (как на бэкенде)
const MAX_TABLE_CARDS = 6;

export const useGameService = () => {
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

  // Используем ref для хранения очереди действий, ожидающих подтверждения
  const pendingActions = useRef<{ type: 'attack' | 'defend', cardId: string, slotId?: number, card: ICard }[]>([]);
  // Для отслеживания состояния перезагрузки страницы
  const [isReloaded, setIsReloaded] = useState<boolean | null>(null);
  // Для отслеживания количества карт вне рук игроков и стола
  const [leftCardsCount, setLeftCardsCount] = useState<number>(0);

  // Обработка событий от SignalR
  useEffect(() => {
    if (data && isConnected) {
      if (data.updateType === GameUpdateTypes.GameState) {
        handleGameState(data.state);
        setGameState(data.state);

        // Обновляем список пасовавших игроков
        const passedPlayers = data.state.players
          .filter((player: any) => player.passed)
          .map((player: any) => player.id);
        setPassedPlayers(passedPlayers);

        // Проверка подтверждений для действий
        validatePendingActions(data.state);
      }
      else if (data.updateType === GameUpdateTypes.PersonalState) {
        const isReloadedPage = isReloaded === null && state.tableCards.length === 0;
        if ((isReloaded || isReloadedPage) && state.rounds != 0)
          setPersonalState(data.state);
        else
          handlePersonalState(data.state);
      }
      else if (data.updateType === GameUpdateTypes.PassedState) {
        handlePassed(data.state);
        // Добавляем игрока в список пасовавших
        addPassedPlayer(data.state.playerId);
      }
      else if (data.winners) {
        handleWinners(data.winners);
      }
    }
  }, [data, isConnected]);

  // Запрос обновления данных при подключении
  useEffect(() => {
    if (!isConnected) return;
    sendData("GetUpdate");
    console.log('GetUpdate');
  }, [isConnected]);

  // Функция для проверки подтверждения действий
  const validatePendingActions = (newState: IGameState) => {
    const isReloadedPage = isReloaded === null && state.tableCards.length === 0;
    setIsReloaded(isReloadedPage);

    // Если есть ожидающие действия
    if (pendingActions.current.length > 0) {
      // Создаем новый массив для действий, которые не были подтверждены
      const unconfirmedActions: typeof pendingActions.current = [];
      // Создаем массив для карт, которые нужно переместить в другой слот
      const cardsToMove: { card: ICard, fromSlotId?: number, toSlotId: number }[] = [];

      pendingActions.current.forEach(action => {
        // Проверяем, есть ли карта в новом состоянии игры на столе
        let isCardOnTable = false;
        let correctSlotId: number | undefined = undefined;

        newState.tableCards.forEach(tc => {
          if (action.type === 'attack') {
            // Проверяем, есть ли атакующая карта на столе
            if (tc.card.rank.name === action.card.rank.name &&
              tc.card.suit.name === action.card.suit.name) {
              isCardOnTable = true;
              correctSlotId = tc.slotIndex;
            }
          } else if (action.type === 'defend' && action.slotId !== undefined) {
            // Проверяем, есть ли защищающая карта на столе
            if (tc.defendingCard &&
              tc.defendingCard.rank.name === action.card.rank.name &&
              tc.defendingCard.suit.name === action.card.suit.name) {
              isCardOnTable = true;
              correctSlotId = tc.slotIndex;
            }
          }
        });

        // Если карты нет на столе, добавляем в список для возврата в руку
        if (!isCardOnTable) {
          unconfirmedActions.push(action);
        }
        // Если карта на столе, но в другом слоте, добавляем в список для перемещения
        else if (action.type === 'attack' && correctSlotId !== undefined) {
          // Находим текущий слот с картой
          let currentSlotId: number | undefined = undefined;

          for (let i = 0; i < slots.length; i++) {
            const isCardInSlot = slots[i].cards.some(c =>
              c.rank.name === action.card.rank.name &&
              c.suit.name === action.card.suit.name
            );

            if (isCardInSlot) {
              currentSlotId = slots[i].id;
              break;
            }
          }

          if (currentSlotId !== correctSlotId) {
            cardsToMove.push({
              card: action.card,
              fromSlotId: currentSlotId,
              toSlotId: correctSlotId
            });
          }
        } else if (action.type === 'defend' && action.slotId !== undefined && correctSlotId !== undefined && action.slotId !== correctSlotId) {
          cardsToMove.push({
            card: action.card,
            fromSlotId: action.slotId,
            toSlotId: correctSlotId
          });
        }
      });

      // Возвращаем неподтвержденные карты в руку
      if (unconfirmedActions.length > 0) {
        unconfirmedActions.forEach(action => {
          // Добавляем карту обратно в руку
          addCardToHand(action.card);

          // Удаляем карту из слота, если она была добавлена туда
          if (action.type === 'defend' && action.slotId !== undefined) {
            const newSlots = slots.map(slot => {
              if (slot.id === action.slotId) {
                return {
                  ...slot,
                  cards: slot.cards.filter(c =>
                    c.rank.name !== action.card.rank.name ||
                    c.suit.name !== action.card.suit.name
                  )
                };
              }
              return slot;
            });
            setSlots(newSlots);
          } else if (action.type === 'attack') {
            // Находим слот, в который была добавлена атакующая карта и удаляем её оттуда
            const newSlots = slots.map(slot => {
              return {
                ...slot,
                cards: slot.cards.filter(c =>
                  c.rank.name !== action.card.rank.name ||
                  c.suit.name !== action.card.suit.name
                )
              };
            });
            setSlots(newSlots);
          }
        });
      }

      // Перемещаем карты в правильные слоты
      if (cardsToMove.length > 0) {
        const newSlots = [...slots];

        cardsToMove.forEach(moveInfo => {
          // Удаляем карту из текущего слота
          if (moveInfo.fromSlotId !== undefined) {
            const fromSlot = newSlots.find(s => s.id === moveInfo.fromSlotId);
            if (fromSlot) {
              fromSlot.cards = fromSlot.cards.filter(c =>
                c.rank.name !== moveInfo.card.rank.name ||
                c.suit.name !== moveInfo.card.suit.name
              );
            }
          } else {
            // Если fromSlotId не указан, ищем карту во всех слотах
            for (let i = 0; i < newSlots.length; i++) {
              newSlots[i].cards = newSlots[i].cards.filter(c =>
                c.rank.name !== moveInfo.card.rank.name ||
                c.suit.name !== moveInfo.card.suit.name
              );
            }
          }

          // Добавляем карту в правильный слот
          const toSlot = newSlots.find(s => s.id === moveInfo.toSlotId);
          if (toSlot) {
            toSlot.cards.push(moveInfo.card);
          }
        });

        setSlots(newSlots);
      }

      // Очищаем очередь ожидающих действий
      pendingActions.current = [];
    }
    else {
      if (isReloadedPage) {
        // Если страница была перезагружена, восстанавливаем состояние слотов из состояния игры
        let newSlots = slots.map(slot => {
          const tableCard = newState.tableCards.find(tc => tc.slotIndex === slot.id);
          return {
            ...slot,
            cards: tableCard
              ? [tableCard.card, ...(tableCard.defendingCard ? [tableCard.defendingCard] : [])]
              : []
          }
        });

        setSlots(newSlots);
      } else {
        // Обновляем слоты на основе tableCards из состояния игры
        newState.tableCards.forEach(tc => {
          const existingSlot = slots.find(s => s.id === tc.slotIndex);

          if (existingSlot?.cards.length == 0) {
            addCardToSlot(tc.card, tc.slotIndex);
            if (tc.defendingCard)
              addCardToSlot(tc.defendingCard, tc.slotIndex);
          }
          else if (existingSlot?.cards.length == 1 && tc.defendingCard) {
            addCardToSlot(tc.defendingCard, tc.slotIndex);
          }
        });
      }
    }
  };

  const handlePersonalState = (newState: IPersonalState): void => {
    const newCardsInHand = newState.cardsInHand.filter(c =>
      !personalState.cardsInHand.some(c2 =>
        c2.rank.name === c.rank.name && c2.suit.name === c.suit.name
      )
    );
    const animationDuration = newCardsInHand.length > 3 ? 100 : 400;
    const sound = newCardsInHand.length > 3 ? Sounds.CardsShuffle : Sounds.CardFromDeck;

    // Функция для анимации одной карты с индексом
    const animateCard = (index: number, playSound: boolean = true) => {
      // Если достигли конца массива, завершаем
      if (index >= newCardsInHand.length) return;

      const card = newCardsInHand[index];

      if (playSound)
        play(sound);

      moveCardFromDeck("playercards", "deck", animationDuration, () => {
        addCardToHand(card);
        animateCard(index + 1, playSound);
      });
    };

    // Начинаем с первой карты, если они есть
    if (newCardsInHand.length > 0) {
      if (sound === Sounds.CardsShuffle)
        play(sound);
      animateCard(0, sound === Sounds.CardFromDeck);
    }
  };

  const handleGameState = (newState: IGameState): void => {
    const playersCardsCount = newState.players.reduce((total, player) => total + player.cardsCount, 0);
    const tableCardsCount = newState.tableCards.reduce((total, slot) => !slot.defendingCard ? total + 1 : total + 2, 0);
    const newLeftCardsCount = 36 - newState.deckCardsCount - playersCardsCount - tableCardsCount;
    const { tableCardsRef } = animationService;

    // If the round ends with the defender beaten all cards
    if ((newLeftCardsCount > leftCardsCount)) {
      clearTableAnimated(tableCardsRef,
        () => play(Sounds.CardSlideLeft), clearTable);
    }

    // If the round ends with the defender taking cards from the table
    else if ((newState.rounds > state.rounds) && (newLeftCardsCount === leftCardsCount)) {
      const toElement = state.defenderId === user.id ? "playercards" : `player-${state.defenderId}`;

      const offsetY = state.defenderId === user.id ? 800 : -400;

      moveElementTo(Object.values(tableCardsRef.current), toElement, 300, undefined, { x: 0, y: offsetY }, () => {
        clearTable();
        tableCardsRef.current = {};
      });
    }

    setLeftCardsCount(newLeftCardsCount);
  };

  const handleWinners = (info: IWinnersInfo): void => {
    setWinnersIds(info.winners);
    console.log('winnersInfo', info);
  };

  // Функция для отправки атаки
  const attack = useCallback(async (cardId: string) => {
    if (isConnected)
      await sendData("Attack", cardId);
  }, [isConnected, sendData]);

  // Функция для отправки защиты
  const defend = useCallback(async (cardDefendingId: string, cardAttackingIndex: number) => {
    if (isConnected)
      await sendData("Defend", cardDefendingId, cardAttackingIndex);
  }, [isConnected, sendData]);

  // Функция для передачи хода
  const pass = useCallback(async () => {
    if (isConnected)
      await sendData("Pass");
  }, [isConnected, sendData]);

  // Получение всех рангов карт на столе
  const getTableCardRanks = useCallback(() => {
    const ranks = new Set<string>();

    slots.forEach(slot => {
      slot.cards.forEach(card => {
        ranks.add(card.rank.name);
      });
    });

    return Array.from(ranks);
  }, [slots]);

  // Проверка возможности атаки
  const canAttack = useCallback((card: ICard) => {
    // Если на столе максимальное количество карт
    const tableCardCount = slots.reduce((count, slot) => count + (slot.cards.length > 0 ? 1 : 0), 0);
    if (tableCardCount >= MAX_TABLE_CARDS) {
      console.log("Стол полон, атака невозможна");
      return false;
    }

    // Если игрок защищающийся
    if (state.defenderId === user.id) {
      console.log("Вы не можете атаковать, так как защищаетесь");
      return false;
    }

    // Если игрок уже пасовал
    if (passedPlayers.includes(user.id)) {
      console.log("Вы уже пасовали, атака невозможна");
      return false;
    }

    // Если на столе есть карты
    if (tableCardCount > 0) {
      // Если игрок не атакующий и атакующий не пасовал
      if (state.attackerId !== user.id && !passedPlayers.includes(state.attackerId!)) {
        console.log("Вы не можете атаковать, атакующий игрок еще не пасовал");
        return false;
      }

      // Проверка ранга карты - должен соответствовать рангам карт на столе
      const tableRanks = getTableCardRanks();
      if (!tableRanks.includes(card.rank.name)) {
        console.log("Карта должна иметь такой же ранг, как карты на столе");
        return false;
      }
    } else {
      // Если на столе нет карт, и игрок не является атакующим
      if (state.attackerId !== user.id) {
        console.log("Вы не можете атаковать первым, так как не являетесь атакующим");
        return false;
      }
    }

    return true;
  }, [state, slots, user.id, passedPlayers, getTableCardRanks]);

  // Проверка возможности защиты
  const canDefend = useCallback((defendingCard: ICard, slotId: number) => {
    // Если игрок не является защищающимся
    if (state.defenderId !== user.id) {
      console.log("Вы не можете защищаться, так как не являетесь защищающимся");
      return false;
    }

    // Проверка слота
    const slot = slots.find(s => s.id === slotId);
    if (!slot) {
      console.log("Неверный индекс слота");
      return false;
    }

    // Проверка, что в слоте есть атакующая карта и нет защищающей
    if (slot.cards.length !== 1) {
      console.log("В слоте должна быть только атакующая карта");
      return false;
    }

    const attackingCard = slot.cards[0];

    // Проверка валидности защиты (по правилам игры "Дурак")
    // 1. Если карты одной масти, то защищающая должна быть старше
    if (attackingCard.suit.name === defendingCard.suit.name) {
      if (defendingCard.rank.value <= attackingCard.rank.value) {
        console.log("Защищающая карта должна быть старше атакующей карты той же масти");
        return false;
      }
    }
    // 2. Если масти разные, то защищающая карта должна быть козырем
    else if (state.trumpCard && defendingCard.suit.name !== state.trumpCard.suit.name) {
      console.log("Если масти разные, то защищающая карта должна быть козырем");
      return false;
    }

    return true;
  }, [state, slots, user.id]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const card = event.active.data.current?.card;

    if (String(event.over?.id).startsWith("slot") && state.defenderId === user.id) {
      const slotId = String(event.over?.id);
      const id = Number(slotId.split("-")[1]);

      // Получаем координаты, где карта была отпущена
      const dropPosition = event.active.rect.current.translated;

      // Преобразуем ClientRect в нужный формат
      const position = dropPosition ? {
        top: dropPosition.top,
        left: dropPosition.left,
        width: dropPosition.width,
        height: dropPosition.height
      } : null;

      onDroppedToTableSlot(card as ICard, id, position);
    }
    else if (card) {
      const offset = 50;
      const middleOfDropZone = (window.innerHeight / 2) + offset;
      const activeRect = event.active.rect.current.translated;

      if (!activeRect?.top)
        return;

      // Проверяем, находится ли точка дропа выше середины зоны
      const isAfterMiddle = middleOfDropZone >= activeRect?.top;
      if (!isAfterMiddle)
        return;

      const availableSlot = slots.findIndex(slot => slot.cards.length === 0);
      if (availableSlot == -1)
        return;

      // Преобразуем ClientRect в нужный формат
      const position = {
        top: activeRect.top,
        left: activeRect.left,
        width: activeRect.width,
        height: activeRect.height
      };

      onDroppedToTableSlot(card as ICard, availableSlot, position);
    }
  }, []);

  const onDroppedToTableSlot = (card: ICard, slotId: number, dropPosition?: { top: number, left: number, width?: number, height?: number } | null) => {
    const type = state.defenderId === user.id ? 'defend' : 'attack';

    if (type === 'defend') {
      // Если игрок защищается
      // Проверяем возможность защиты данной картой
      if (!canDefend(card, slotId) && !testMode().canDefend) {
        console.log("Защита невозможна по правилам игры");
        return;
      }
    } else {
      // Если игрок атакует
      // Проверяем возможность атаки
      if (!canAttack(card) && !testMode().canAttack) {
        console.log("Атака невозможна по правилам игры");
        return;
      }
    }

    const cardId = `${card.suit.name}-${card.rank.name}`;
    // Создаем копию карты в той же позиции, где было отпущено перетаскивание
    const cardClone = createCardClone(cardId, dropPosition);

    // Скрываем оригинальную карту, чтобы она не появлялась в руке
    const originalCard = document.getElementById(`playercard-${cardId}`);
    if (originalCard) {
      originalCard.style.visibility = 'hidden';
    }

    // Добавляем клон в DOM
    document.body.appendChild(cardClone!);

    // Удаляем карту из руки
    play(Sounds.CardAddedToTable);

    // Анимируем перемещение карты и затем удаляем её
    animateCardToSlot(`playercard-clone-${cardId}`, `slot-${slotId}`, 300, () => {
      // После завершения анимации удаляем клонированную карту
      const cardClone = document.getElementById(`playercard-clone-${cardId}`);
      if (cardClone) {
        // Сначала добавляем карту в слот, чтобы пользователь сразу видел результат
        card.playPlaceAnim = false;
        removeCardFromHand(cardId);
        addCardToSlot(card, slotId);

        if (originalCard) {
          originalCard.style.visibility = 'visible';
        }
        cardClone.remove();
      }

      // Добавляем действие в список ожидающих подтверждения
      pendingActions.current.push({
        type,
        cardId,
        slotId,
        card
      });

      if (type === 'defend')
        defend(cardId, slotId);
      else
        attack(cardId);
    });
  }

  const createCardClone = (cardId: string, dropPosition?: { top: number, left: number, width?: number, height?: number } | null): HTMLElement | null => {
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
  };

  const handlePassed = (passedState: { playerId: string, defenderId: string, allCardsBeaten: boolean }): void => {
    setPassData(passedState);
    // Очищаем состояние через 2 секунды
    setTimeout(() => {
      setPassData(null);
    }, 2000);
  };

  return {
    handleDragEnd,
    pass
  };
};

// Импорт useState, который был пропущен
import { useState } from "react"; 