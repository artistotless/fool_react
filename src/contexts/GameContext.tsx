import { GameStatus, GameUpdateTypes, ICard, IGameState, IPersonalState, IWinnersInfo, IFoolPlayer } from "src/types";
import { clearTableAnimated, Sounds } from "src/utils";
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

   useEffect(() => {
      if (data && isConnected) {
         if (data.updateType === GameUpdateTypes.GameState) {
            handleGameState(data.state);
            setGameState(data.state)
         }
         else if (data.updateType === GameUpdateTypes.PersonalState) {
            setPersonalState(data.state)
         }
         else if (data.updateType === GameUpdateTypes.PassedState) {
            handlePassed(data.state)
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

   const handleGameState = (newState: IGameState): void => {
      const playersCardsCount = newState.players.reduce((total, player) => total + player.cardsCount, 0);
      const tableCardsCount = newState.tableCards.reduce((total, slot) => !slot.defendingCard ? total + 1 : total + 2, 0);
      const newLeftCardsCount = 36 - newState.deckCardsCount - playersCardsCount - tableCardsCount;
      const { tableCardsRef } = animationService;

      const isReloadedPage = isReloaded === null && state.tableCards.length === 0;
      setIsReloaded(isReloadedPage);


      if (isReloadedPage) {
         let newSlots = slots.map(slot => {
            const tableCard = newState.tableCards.find(tc => tc.slotIndex === slot.id);
            return {
               ...slot,
               cards: tableCard ? [tableCard.card, ...(tableCard.defendingCard ? [tableCard.defendingCard] : [])] : slot.cards
            }
         });

         setSlots(newSlots);
      }

      // If the round ends with the defender beaten all cards
      else if ((newLeftCardsCount > leftCardsCount)) {
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
      // Player puts a card on the table
      else {
         newState.tableCards.forEach(tc => {
            const existingSlot = slots.find(s => s.id === tc.slotIndex);

            if (existingSlot?.cards.length == 0) {
               addCardToSlot(tc.card, tc.slotIndex);
            }

            else if (existingSlot?.cards.length == 1 && tc.defendingCard) {
               addCardToSlot(tc.defendingCard, tc.slotIndex);
            }
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

   const onDroppedToDropZone = (card: ICard, cardIndex: number) => {
      if (state.defenderId === user.id)
         return;
      attack(cardIndex)
      console.log(
         `Карта "${card.rank.name} ${card.suit.iconChar}" дропнута в зоне и попала на слот 0`
      );
   };

   const onDroppedToTableSlot = (card: ICard, cardIndex: number, slotId: number) => {
      console.log(
         `Карта "${card.rank.name} ${card.suit.iconChar}" дропнута на слот ${slotId}`
      );

      if (state.defenderId === user.id) {
         defend(cardIndex, slotId);
      } else {
         attack(cardIndex);
      }
   };

   const handleDragEnd = (event: DragEndEvent) => {
      const card = event.active.data.current?.card;

      if (String(event.over?.id).startsWith("slot")) {
         const id = Number(String(event.over?.id).split("-")[1]);
         onDroppedToTableSlot(card as ICard, card?.index as number, id);
      }
      else if (card) {
         const offset = 50;
         const middleOfDropZone = (window.innerHeight / 2) + offset;
         const activeRect = event.active.rect.current.translated;

         if (!activeRect?.top)
            return;

         // Проверяем, находится ли точка дропа выше середины зоны
         const isAfterMiddle = middleOfDropZone >= activeRect?.top;
         if (isAfterMiddle) {
            onDroppedToDropZone(card as ICard, card.index as number);
         }
      }
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
      <GameContext.Provider value={contextValue}      >
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
