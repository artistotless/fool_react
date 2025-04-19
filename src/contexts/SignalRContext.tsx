import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';
import { signalRLoggingEnabled } from "src/environments/environment";

// Тип контекста SignalR
export interface SignalRContextType {
   connection: HubConnection | null;
   isConnected: boolean;
   data: any;
   sendData: (methodName: string, ...args: any[]) => Promise<any>;
   simulateReceiveEvent: (eventData: any) => void;
   startConnection: () => void;
   stopConnection: () => void;
}

// Создаем контекст
const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

// Пропсы для провайдера
interface SignalRProviderProps {
   children: ReactNode;
   hubUrl?: string;
}

// Функция для логирования ошибок
function error(value: string, err: any) {
   if (!signalRLoggingEnabled)
      return;

   console.error(value, err);
}

// Компонент провайдера контекста
export const SignalRProvider = ({ children, hubUrl = 'https://localhost:7110/hubs/fool' }: SignalRProviderProps) => {
   const [connection, setConnection] = useState<HubConnection | null>(null);
   const [isConnected, setIsConnected] = useState(false);
   const [data, setData] = useState<any>(null);

   // Создание соединения
   useEffect(() => {
      const newConnection = new signalR.HubConnectionBuilder()
         .withUrl(hubUrl)
         .withAutomaticReconnect()
         .build();

      setConnection(newConnection);

      return () => {
         if (newConnection) {
            newConnection.stop().catch(err => error('Error stopping connection:', err));
         }
      };
   }, [hubUrl]);

   // Функция для запуска соединения
   const startConnection = useCallback(async () => {
      if (connection) {
         try {
            await connection.start();
            console.log('SignalR connection started');
            setIsConnected(true);

            // Обработчик входящих сообщений от сервера
            connection.on('ReceiveMessage', (message: any) => {
               console.log('Received message from server:', message);
               setData(message);
            });

            // Обработчик для симулированных событий
            connection.on('SimulateServerEvent', (message: any) => {
               console.log('Simulate server event:', message);
               setData(message);
            });

         } catch (err) {
            error('Error starting connection:', err);
            setTimeout(startConnection, 5000);
         }
      }
   }, [connection]);

   // Функция для остановки соединения
   const stopConnection = useCallback(async () => {
      if (connection) {
         try {
            await connection.stop();
            console.log('SignalR connection stopped');
            setIsConnected(false);
         } catch (err) {
            error('Error stopping connection:', err);
         }
      }
   }, [connection]);

   // Метод для отправки данных на сервер
   const sendData = useCallback(async (methodName: string, ...args: any[]) => {
      if (connection && isConnected) {
         try {
            return await connection.invoke(methodName, ...args);
         } catch (err) {
            console.error(`Ошибка вызова метода ${methodName}:`, err);
            throw err;
         }
      } else {
         console.error('Нет соединения с сервером');
         throw new Error('Нет соединения с сервером');
      }
   }, [connection, isConnected]);

   // Метод для симуляции получения события от сервера
   const simulateReceiveEvent = useCallback((eventData: any) => {
      console.log('Simulating server event:', eventData);
      setData(eventData);
   }, []);

   // Мемоизация значения контекста
   const contextValue = useMemo(() => ({
      connection,
      isConnected,
      data,
      sendData,
      simulateReceiveEvent,
      startConnection,
      stopConnection
   }), [connection, isConnected, data, sendData, simulateReceiveEvent, startConnection, stopConnection]);

   return (
      <SignalRContext.Provider value={contextValue}>
         {children}
      </SignalRContext.Provider>
   );
};

// Хук для использования контекста
export const useSignalR = () => {
   const context = useContext(SignalRContext);
   if (context === undefined) {
      throw new Error('useSignalR must be used within a SignalRProvider');
   }
   return context;
};

const log = (value: string): void => {
   if (!signalRLoggingEnabled)
      return;

   console.log(value);
}