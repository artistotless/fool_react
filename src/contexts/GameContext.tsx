import { GameStatus, GameUpdateTypes, ICard, IGameState, IPersonalState, IWinnersInfo, IFoolPlayer } from "src/types";
import { animateCardToSlot, clearTableAnimated, Sounds } from "src/utils";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import useAnimateElement, {
   animateElements,
} from "src/hooks/useAnimateElement";
import animationService from "./animationService";
import { useSignalR } from "./SignalRContext";
import {
   useState,
   ReactNode,
   useContext,
   createContext,
   useCallback,
   useEffect,
   useMemo,
   useRef,
} from "react";
import { testMode } from "src/environments/environment";
import { useAudio } from "./AudioContext";
import { useUser } from "./UserContext";

export interface ISlot {
   id: number;
   cards: ICard[];
}

interface GameContext {
   slots: ISlot[];
   winnersIds: string[] | null;
   state: IGameState;
   personalState: IPersonalState;
   pass: () => void,
   addCardToHand: (card: ICard | ICard[]) => void;
   addCardToSlot: (card: ICard, slotID: number) => void;
   removeCardFromHand: (card_id: number) => void;
   clearTable: () => void;
   passData: { playerId: string, defenderId: string, allCardsBeaten: boolean } | null;
}

// Максимальное количество карт на столе (как на бэкенде)
const MAX_TABLE_CARDS = 6;

const getInitialValue = () => ({
   slots: Array(6)
      .fill(null)
      .map((_, index) => ({ id: index, cards: [] })),
   gameState: {
      movedAt: null,
      moveTime: null,
      attackerId: null,
      defenderId: null,
      tableCards: [],
      rounds: 0,
      trumpCard: null,
      deckCardsCount: 0,
      status: 'ReadyToBegin' as GameStatus,
      players: [
         {
            name: "Player 1",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
            id: "player1",
            passed: false,
            cardsCount: 6
         },
         {
            name: "Player 2",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
            id: "player2",
            passed: false,
            cardsCount: 6
         },
         {
            name: "Player 3",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
            id: "player3",
            passed: false,
            cardsCount: 6
         }
      ],
   },
   personalState: {
      cardsInHand: testMode().useTestCards ? testMode().testCards : [],
   },
   players: Array(3)
      .fill(null)
      .map((_, index) => ({
         name: `Player ${index}`,
         avatar: undefined,
         id: "",
         passed: false,
         cardsCount: 6
      })),
});

const GameContext = createContext<GameContext | null>(null);

export const GameProvider = ({ children }: { children: ReactNode }) => {
   const [slots, setSlots] = useState<ISlot[]>(getInitialValue().slots);
   const [leftCardsCount, setLeftCardsCount] = useState<number>(0);
   const [winnersIds, setWinnersIds] = useState<string[] | null>(null);
   const [isReloaded, setIsReloaded] = useState<boolean | null>(null);
   const [state, setGameState] = useState<IGameState>(getInitialValue().gameState);
   const [personalState, setPersonalState] = useState<IPersonalState>(getInitialValue().personalState);
   const { isConnected, data, sendData } = useSignalR();
   const { play } = useAudio();
   const { user } = useUser();
   const animate = useAnimateElement();
   const [passData, setPassData] = useState<{ playerId: string, defenderId: string, allCardsBeaten: boolean } | null>(null);
   // Используем ref для хранения очереди действий, ожидающих подтверждения
   const pendingActions = useRef<{ type: 'attack' | 'defend', cardIndex: number, slotId?: number, card: ICard }[]>([]);
   // Состояние для отслеживания игроков, которые пасовали
   const [passedPlayers, setPassedPlayers] = useState<string[]>([]);

   useEffect(() => {
      if (data && isConnected) {
         if (data.updateType === GameUpdateTypes.GameState) {
            handleGameState(data.state);
            setGameState(data.state);

            // Обновляем список пасовавших игроков
            const passedPlayers = data.state.players
               .filter((player: IFoolPlayer) => player.passed)
               .map((player: IFoolPlayer) => player.id);
            setPassedPlayers(passedPlayers);

            // Проверка подтверждений для действий
            validatePendingActions(data.state);
         }
         else if (data.updateType === GameUpdateTypes.PersonalState) {
            setPersonalState(data.state)
         }
         else if (data.updateType === GameUpdateTypes.PassedState) {
            handlePassed(data.state);

            // Добавляем игрока в список пасовавших
            setPassedPlayers(prev => [...prev, data.state.playerId]);
         }
         else if (data.winners) {
            handleWinners(data.winners)
         }
      }
   }, [data, isConnected]);

   useEffect(() => {
      if (isConnected)
         sendData("GetUpdate");
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

               setSlots(prev => {
                  const newSlots = [...prev];
                  for (let i = 0; i < newSlots.length; i++) {
                     const isCardInSlot = newSlots[i].cards.some(c =>
                        c.rank.name === action.card.rank.name &&
                        c.suit.name === action.card.suit.name
                     );

                     if (isCardInSlot) {
                        currentSlotId = newSlots[i].id;
                        break;
                     }
                  }
                  return newSlots;
               });

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
                  setSlots(prev => prev.map(slot => {
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
                  }));
               } else if (action.type === 'attack') {
                  // Находим слот, в который была добавлена атакующая карта
                  setSlots(prev => prev.map(slot => {
                     return {
                        ...slot,
                        cards: slot.cards.filter(c =>
                           c.rank.name !== action.card.rank.name ||
                           c.suit.name !== action.card.suit.name
                        )
                     };
                  }));
               }
            });
         }

         // Перемещаем карты в правильные слоты
         if (cardsToMove.length > 0) {
            setSlots(prev => {
               const newSlots = [...prev];

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

               return newSlots;
            });
         }

         // Очищаем очередь ожидающих действий
         pendingActions.current = [];
      }
      else {

         if (isReloadedPage) {
            let newSlots = slots.map(slot => {
               const tableCard = newState.tableCards.find(tc => tc.slotIndex === slot.id);
               return {
                  ...slot,
                  cards: tableCard ? [tableCard.card, ...(tableCard.defendingCard ? [tableCard.defendingCard] : [])] : slot.cards
               }
            });

            setSlots(newSlots);
         } else {
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

         animateElements(
            tableCardsRef.current,
            {
               toElement: toElement,
               animationOptions: {
                  animationDuration: 300,
               },
            },
            animate
         ).then(() => {
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

   const addCardToSlot = useCallback(
      (card: ICard, slotID: number) => {
         play(Sounds.CardAddedToTable);
         setSlots((prev) => {
            return prev.map((slot) => {
               if (slot.id === slotID) {
                  return { ...slot, cards: [...slot.cards, card] };
               }
               return slot;
            });
         });
      },
      [setSlots, play]
   );

   const addCardToHand = useCallback(
      (card: ICard | ICard[]) => {
         if (Array.isArray(card)) {
            setPersonalState((prevPersonalState) => ({
               ...prevPersonalState,
               cardsInHand: [...prevPersonalState.cardsInHand, ...card]
            }));
         } else {
            setPersonalState((prevPersonalState) => ({
               ...prevPersonalState,
               cardsInHand: [...prevPersonalState.cardsInHand, card]
            }));
         }
      },
      [setPersonalState]
   );

   const removeCardFromHand = useCallback(
      (idx: number) => {
         setPersonalState((prevPersonalState) => ({
            ...prevPersonalState,
            cardsInHand: prevPersonalState.cardsInHand.filter((_, index) => index !== idx)
         }));
      },
      [setPersonalState]
   );

   const clearTable = useCallback(() => {
      setSlots((prev) => prev.map((slot) => ({ ...slot, cards: [] })));
   }, [setSlots]);

   // Функция для отправки атаки
   const attack = useCallback(async (cardIndex: number) => {
      if (isConnected)
         await sendData("Attack", cardIndex);
   }, [isConnected]);  // Мемоизация с зависимостью от connection

   // Функция для отправки защиты
   const defend = useCallback(async (cardDefendingIndex: number, cardAttackingIndex: number) => {
      if (isConnected)
         await sendData("Defend", cardDefendingIndex, cardAttackingIndex);
   }, [isConnected]);  // Мемоизация с зависимостью от connection

   // Функция для передачи хода 
   const pass = useCallback(async () => {
      if (isConnected)
         await sendData("Pass");
   }, [isConnected]);  // Мемоизация с зависимостью от connection

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

   const handleDragEnd = (event: DragEndEvent) => {
      const card = event.active.data.current?.card;

      if (String(event.over?.id).startsWith("slot")) {
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

         onDroppedToTableSlot(card as ICard, card?.index as number, id, position);
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

         onDroppedToTableSlot(card as ICard, card.index as number, availableSlot, position);
      }
   };

   const onDroppedToTableSlot = (card: ICard, cardIndex: number, slotId: number, dropPosition?: { top: number, left: number, width?: number, height?: number } | null) => {
      const type = state.defenderId === user.id ? 'defend' : 'attack';

      if (type === 'defend') {
         // Если игрок защищается
         // Проверяем возможность защиты данной картой
         if (!canDefend(card, slotId)) {
            console.log("Защита невозможна по правилам игры");
            return;
         }
      } else {
         // Если игрок атакует
         // Проверяем возможность атаки
         if (!canAttack(card) && false) {
            console.log("Атака невозможна по правилам игры");
            return;
         }
      }

      // Создаем копию карты в той же позиции, где было отпущено перетаскивание
      const cardClone = createCardClone(cardIndex, dropPosition);
      // Добавляем клон в DOM
      document.body.appendChild(cardClone!);
      // Удаляем карту из руки
      removeCardFromHand(cardIndex);

      // Анимируем перемещение карты и затем удаляем её
      animateCardToSlot(`playercard-clone-${cardIndex}`, `slot-${slotId}`, 300, () => {
         // После завершения анимации удаляем клонированную карту
         const cardClone = document.getElementById(`playercard-clone-${cardIndex}`);
         if (cardClone) {
            // Сначала добавляем карту в слот, чтобы пользователь сразу видел результат
            card.playPlaceAnim = false;
            addCardToSlot(card, slotId);
            cardClone.remove();
         }

         // Добавляем действие в список ожидающих подтверждения
         pendingActions.current.push({
            type: type,
            cardIndex,
            slotId,
            card
         });

         if (type === 'defend')
            defend(cardIndex, slotId);
         else
            attack(cardIndex);
      });

      console.log(
         `Карта "${card.rank.name} ${card.suit.iconChar}" попала в слот ${slotId}`
      );
   }

   const createCardClone = (cardIndex: number, dropPosition?: { top: number, left: number, width?: number, height?: number } | null): HTMLElement | null => {
      // Создаем копию карты в той же позиции, где было отпущено перетаскивание
      const originalCardElement = document.getElementById(`playercard-${cardIndex}`);
      if (originalCardElement && dropPosition) {
         // Создаем клон карты
         const cardClone = originalCardElement.cloneNode(true) as HTMLElement;
         cardClone.id = `playercard-clone-${cardIndex}`;
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

   const contextValue = useMemo(() => ({
      state,
      personalState,
      winnersIds,
      slots,
      pass,
      addCardToHand,
      addCardToSlot,
      removeCardFromHand,
      clearTable,
      passData
   }), [slots, personalState, state, winnersIds, passData]);

   return (
      <GameContext.Provider value={contextValue}>
         <DndContext modifiers={[snapCenterToCursor]} onDragEnd={handleDragEnd}>{children}</DndContext>
      </GameContext.Provider>
   );
};

export const useGame = () => {
   const context = useContext(GameContext);

   if (!context) {
      throw new Error("useGame must be used with GameProvider");
   }

   return context;
};