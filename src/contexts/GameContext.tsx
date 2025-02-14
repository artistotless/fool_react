import { GameStatus, GameUpdateTypes, ICard, IGameState, IPersonalState, IWinnersInfo } from "src/types";
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
   hand: ICard[];
   winnersIds: string[] | null;
   state: IGameState;
   personalState: IPersonalState;
   pass: () => void,
   addCardToHand: (card: ICard | ICard[]) => void;
   addCardToSlot: (card: ICard, slotID: number) => void;
   removeCardFromHand: (card_id: number) => void;
   clearTable: () => void;
}

const getInitialValue = () => ({
   slots: Array(6)
      .fill(null)
      .map((_, index) => ({ id: index, cards: [] })),
   hand: testMode().useTestCards ? testMode().testCards : [],
   gameState: {
      attackerId: null,
      defenderId: null,
      tableCards: [],
      rounds: 0,
      trumpCard: null,
      deckCardsCount: 0,
      status: 'ReadyToBegin' as GameStatus,
      players: [],
   },
   personalState: {
      cardsInHand: [],
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
   const [hand, setHand] = useState<ICard[]>(getInitialValue().hand);
   const [leftCardsCount, setLeftCardsCount] = useState<number>(0);
   const [winnersIds, setWinnersIds] = useState<string[] | null>(null);
   const [state, setGameState] = useState<IGameState>(getInitialValue().gameState);
   const [personalState, setPersonalState] = useState<IPersonalState>(getInitialValue().personalState);
   const { isConnected, data, sendData } = useSignalR();
   const { play } = useAudio();
   const { user } = useUser();
   const animate = useAnimateElement();

   useEffect(() => {
      if (data && isConnected) {
         if (data.updateType === GameUpdateTypes.GameState) {
            handleGameState(data.state);
            setGameState(data.state)
         }
         else if (data.updateType === GameUpdateTypes.PersonalState) {
            handlePlayerState(data.state);
            setPersonalState(data.state)
         }
         else if (data.winners) {
            handleWinners(data.winners)
         }
      }
   }, [data]);

   useEffect(() => {
      if (isConnected)
         sendData("GetUpdate");
   }, [isConnected]);

   const handleGameState = (newState: IGameState): void => {
      const playersCardsCount = newState.players.reduce((total, player) => total + player.cardsCount, 0);
      const tableCardsCount = newState.tableCards.reduce((total, slot) => !slot.defendingCard ? total + 1 : total + 2, 0);
      const currentLeftCardsCount = 36 - newState.deckCardsCount - playersCardsCount - tableCardsCount;
      const { tableCardsRef } = animationService;

      // If the round ends with the defender beaten all cards
      if (leftCardsCount && (currentLeftCardsCount > leftCardsCount)) {

         clearTableAnimated(tableCardsRef, () => {
            clearTable();
         });
      }

      // If the round ends with the defender taking cards from the table
      else if (state.rounds && (newState.rounds > state.rounds) && (currentLeftCardsCount === leftCardsCount)) {

         const toElement = state.defenderId === user.id ? "playercards" : `cards-${state.defenderId}`;

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
      else {
         // Преобразуем tableCards из gameState в формат Slots[]
         const transformedSlots: ISlot[] = newState.tableCards.map(tc => ({
            id: tc.slotIndex,
            cards: [tc.card, ...(tc.defendingCard ? [tc.defendingCard] : [])]
         }));
         setSlots(transformedSlots); // Обновляем слоты карт на столе
      }

      setLeftCardsCount(currentLeftCardsCount);
   };

   const handlePlayerState = (state: IPersonalState): void => {
      setHand(state.cardsInHand.map((c, index) => ({
         rank: c.rank,
         suit: c.suit,
         id: index + 1
      })) || []); // Обновляем карты в руке текущего игрока
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
      [setSlots]
   );

   const addCardToHand = useCallback(
      (card: ICard | ICard[]) => {
         if (Array.isArray(card)) {
            setHand((prevHand) => [...prevHand, ...card]);
         } else {
            setHand((prevHand) => [...prevHand, card]);
         }
      },
      [setHand]
   );

   const removeCardFromHand = useCallback(
      (card_id: number) => {
         setHand((prev) => prev.filter(({ id }) => card_id !== id));
      },
      [setHand]
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

      if (state.defenderId != user.id)
         return;

      defend(cardIndex, slotId);
   };

   const handleDragEnd = (event: DragEndEvent) => {
      const { current } = event.active.data;

      if (event.over?.id === "table" && current) {
         onDroppedToDropZone(current as ICard, current.index as number);
      }

      if (String(event.over?.id).startsWith("slot")) {
         const id = Number(String(event.over?.id).split("-")[1]);
         onDroppedToTableSlot(current as ICard, current?.index as number, id);
      }
   };

   const contextValue = useMemo(() => ({
      state,
      personalState,
      slots,
      hand,
      winnersIds,
      pass,
      addCardToHand,
      addCardToSlot,
      removeCardFromHand,
      clearTable
   }), [slots, personalState, hand]);

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
