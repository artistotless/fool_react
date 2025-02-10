import { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { GameStatus, GameUpdateTypes, IGameState, IPersonalState } from "src/types";
import { signalRLoggingEnabled } from "src/environments/environment";

interface SignalRContext {
   gameState: IGameState,
   personalState: IPersonalState,
   playerId: string | null,
   isConnected: boolean,
   startConnection: (url: string, token: any) => void,
   attack: (cardIndex: number) => void,
   defend: (cardDefendingIndex: number, cardAttackingIndex: number) => void,
   pass: () => void,
}

// Создаем контекст
const SignalRContext = createContext<SignalRContext | null>(null);

// Экспортируем хук для использования контекста
export const useSignalR = () => {
   const context = useContext(SignalRContext);

   if (!context) {
      throw new Error("useSignalR must be used with SignalRProvider");
   }

   return context;
};

const getInitialValue = () => ({
   gameState: {
      attackerId: null,
      defenderId: null,
      tableCards: [],
      rounds:0,
      trumpCard: null,
      deckCardsCount: 0,
      status: 'ReadyToBegin' as GameStatus,
      players: [],
   },
   personalState: {
      cardsInHand: [],
   },
});

const log = (value: string): void => {
   if (!signalRLoggingEnabled)
      return;

   console.log(value);
}

const error = (value: string, err: any): void => {
   if (!signalRLoggingEnabled)
      return;

   console.error(value, err);
}

// Компонент провайдера контекста
export const SignalRProvider = ({ children }: { children: ReactNode }) => {
   const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
   const [isConnected, setIsConnected] = useState(false);
   const [gameState, setGameState] = useState<IGameState>(getInitialValue().gameState);
   const [playerId, setPlayerId] = useState<string | null>(null);
   const [personalState, setPersonalState] = useState<IPersonalState>(getInitialValue().personalState);

   // Функция для создания подключения к хабу SignalR
   const startConnection = useCallback(async (url: string, token: any) => {
      const conn = new signalR.HubConnectionBuilder()
         .withUrl(url, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            accessTokenFactory: () => btoa(JSON.stringify(token)),
         })
         .withAutomaticReconnect()
         .configureLogging(signalR.LogLevel.Error)
         .build();

      setPlayerId(token.userId)

      conn.on("onGameUpdated", (state) => {

         if (state.updateType === GameUpdateTypes.GameState)
            setGameState(state.state);

         else if (state.updateType === GameUpdateTypes.PersonalState)
            setPersonalState(state.state);

         log(state);
      });

      try {
         await conn.start();
         log("SignalR connected");
         setConnection(conn);
         setIsConnected(true);
         conn.invoke("GetUpdate")
      } catch (err) {
         error("Error connecting to SignalR:", err);
         setIsConnected(false);
      }
   }, []);  // Мемоизация функции

   // Функция для отправки атаки
   const attack = useCallback(async (cardIndex: number) => {
      if (connection) {
         try {
            await connection.invoke("Attack", cardIndex);
            log(`Attacked with card index ${cardIndex}`);
         } catch (err) {
            error("Error invoking Attack:", err);
         }
      }
   }, [connection]);  // Мемоизация с зависимостью от connection

   // Функция для отправки защиты
   const defend = useCallback(async (cardDefendingIndex: number, cardAttackingIndex: number) => {
      if (connection) {
         try {
            await connection.invoke("Defend", cardDefendingIndex, cardAttackingIndex);
            log(`Defended with card ${cardDefendingIndex} against card ${cardAttackingIndex}`);
         } catch (err) {
            error("Error invoking Defend:", err);
         }
      }
   }, [connection]);  // Мемоизация с зависимостью от connection

   // Функция для передачи хода 
   const pass = useCallback(async () => {
      if (connection) {
         try {
            await connection.invoke("Pass");
            log("Passed the turn");
         } catch (err) {
            error("Error invoking Pass:", err);
         }
      }
   }, [connection]);  // Мемоизация с зависимостью от connection

   // Очистка при размонтировании компонента
   useEffect(() => {
      return () => {
         if (connection) {
            connection.stop();
            log("SignalR connection stopped");
         }
      };
   }, [connection]);

   const contextValue = useMemo(() => ({
      startConnection,
      attack,
      defend,
      pass,
      playerId,
      gameState,
      personalState,
      isConnected,
   }), [startConnection, attack, defend, pass, gameState, isConnected, personalState, playerId]);

   return (
      <SignalRContext.Provider value={contextValue}>
         {children}
      </SignalRContext.Provider>
   );
};