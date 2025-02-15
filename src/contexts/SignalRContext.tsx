import { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { signalRLoggingEnabled } from "src/environments/environment";

interface SignalRContext {
   data: any | null,
   isConnected: boolean,
   sendData: (action: string, ...args: any[]) => void,
   startConnection: (url: string, token: any, subs: string[]) => void,
   stopConnection: () => void,
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
   const [data, setData] = useState<any | null>(null);
   const [dataQueue, setDataQueue] = useState<any[]>([]);

   const stopConnection = useCallback(() => {
      connection?.stop();
   }, []);

   // Функция для создания подключения к хабу SignalR
   const startConnection = useCallback(async (url: string, token: any, subs: string[]) => {
      const conn = new signalR.HubConnectionBuilder()
         .withUrl(url, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            accessTokenFactory: () => btoa(JSON.stringify(token)),
         })
         .withAutomaticReconnect()
         .configureLogging(signalR.LogLevel.Error)
         .build();
         subs.forEach(sub => {
            conn.on(sub, (state) => {
               setData(state);
               log(state);
            });
         });
      try {
         await conn.start();
         log("SignalR connected");
         setConnection(conn);
         setIsConnected(true);
      } catch (err) {
         error("Error connecting to SignalR:", err);
         setIsConnected(false);
      }
   }, []);  // Мемоизация функции

   const sendData = useCallback(async (action: string, ...args: any[]) => {
      if (isConnected) {
         try {
            await connection?.invoke(action, ...args);
         } catch (err) {
            error(`Error invoking ${action}:`, err);
         }
      }
   }, [connection])

   // Очистка при размонтировании компонента
   useEffect(() => {
      return () => {
         if (connection) {
            connection.stop();
            log("SignalR connection stopped");
         }
      };
   }, [connection]);

   useEffect(() => {
      if (dataQueue.length > 0) {
         const currentData = dataQueue[0];
         setData(currentData);
         setDataQueue(prev => prev.slice(1));
      }
   }, [dataQueue]);

   const contextValue = useMemo(() => ({
      startConnection,
      stopConnection,
      sendData,
      data,
      isConnected,
   }), [isConnected, data]);

   return (
      <SignalRContext.Provider value={contextValue}>
         {children}
      </SignalRContext.Provider>
   );
};