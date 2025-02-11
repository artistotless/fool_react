import { PlayerProps } from "src/components/ui/Player";
import { ICard, IGameState, IPersonalState } from "src/types";
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

export interface ISlot {
   id: number;
   cards: ICard[];
}

interface GameContext {
   slots: ISlot[];
   hand: ICard[];
   trumpCard: ICard | null;
   deckCardsCount: number;
   players: PlayerProps[];
   attackerId: string | null;
   defenderId: string | null;
   addCardToHand: (card: ICard | ICard[]) => void;
   addCardToSlot: (card: ICard, slotID: number) => void;
   removeCardFromHand: (card_id: number) => void;
   clearTable: () => void;
}

const getInitialValue = () => ({
   slots: Array(6)
      .fill(null)
      .map((_, index) => ({ id: index, cards: [] })),
   hand: testMode().useTestCards ? testMode().testCards :
      Array(6)
         .fill(null),
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
   const [players, setPlayers] = useState<PlayerProps[]>(getInitialValue().players);
   const [trumpCard, setTrumpCard] = useState<ICard | null>(null);
   const [attackerId, setAttackerId] = useState<string | null>(null);
   const [defenderId, setDefenderId] = useState<string | null>(null);
   const [deckCardsCount, setDeckCardsCount] = useState<number>(36);
   const [leftCardsCount, setLeftCardsCount] = useState<number>(0);
   const [rounds, setRounds] = useState<number>(0);
   const { isConnected, playerId, gameState, personalState, attack, defend } = useSignalR();
   const { play } = useAudio();
   const animate = useAnimateElement();

   // Синхронизация gameState с состоянием GameContext
   useEffect(() => {
      if (gameState && isConnected)
         handleGameState(gameState)
   }, [gameState]);

   useEffect(() => {
      if (personalState && isConnected) {
         handlePlayerState(personalState)
      }
   }, [personalState]);

   const handleGameState = (state: IGameState): void => {

      const playersCardsCount = state.players.reduce((total, player) => total + player.cardsCount, 0);
      const tableCardsCount = state.tableCards.reduce((total, slot) => !slot.defendingCard ? total + 1 : total + 2, 0);
      const currentLeftCardsCount = 36 - state.deckCardsCount - playersCardsCount - tableCardsCount;
      const { tableCardsRef } = animationService;

      // If the round ends with the defender beaten all cards
      if (currentLeftCardsCount > leftCardsCount) {

         clearTableAnimated(tableCardsRef, () => {
            clearTable();
         });
      }

      // If the round ends with the defender taking cards from the table
      else if (state.rounds > rounds && currentLeftCardsCount === leftCardsCount) {

         const toElement = defenderId === playerId ? "playercards" : `cards-${defenderId}`;

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
         const transformedSlots: ISlot[] = state.tableCards.map(tc => ({
            id: tc.slotIndex,
            cards: [tc.card, ...(tc.defendingCard ? [tc.defendingCard] : [])]
         }));
         setSlots(transformedSlots); // Обновляем слоты карт на столе
      }

      setRounds(state.rounds);
      setLeftCardsCount(currentLeftCardsCount);
      setAttackerId(state.attackerId);
      setDefenderId(state.defenderId);
      setDeckCardsCount(state.deckCardsCount);

      // Преобразуем игроков из gameState в формат PlayerProps
      const transformedPlayers: PlayerProps[] = state.players.filter(p => p.id !== playerId).map(player => ({
         name: player.name || "",   // Используем пустую строку, если имени нет
         cardsCount: player.cardsCount || 0, // Количество карт у игрока
         id: player.id,
         passed: player.passed
      }));

      setPlayers(transformedPlayers); // Обновляем состояние игроков

      if (state.trumpCard) {
         setTrumpCard(state.trumpCard); // Обновляем козырную карту
      }
   };

   const handlePlayerState = (state: IPersonalState): void => {
      setHand(state.cardsInHand.map((c, index) => ({
         rank: c.rank,
         suit: c.suit,
         id: index + 1
      })) || []); // Обновляем карты в руке текущего игрока
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

   const onDroppedToDropZone = (card: ICard, cardIndex: number) => {

      if (gameState.defenderId === playerId)
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

      if (gameState.defenderId != playerId)
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
      slots,
      hand,
      players,
      trumpCard,
      attackerId,
      defenderId,
      deckCardsCount,
      addCardToHand,
      addCardToSlot,
      removeCardFromHand,
      clearTable
   }), [slots, hand, players, trumpCard, attackerId, defenderId, deckCardsCount]);

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
