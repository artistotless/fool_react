import { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import { HubConnection } from '@microsoft/signalr';
import { signalRLoggingEnabled } from "src/environments/environment";
import { useToast } from 'src/services/ToastService';
import useConnectionStore from 'src/store/connectionStore';
import { GameUpdateTypes } from 'src/types';

// Тип контекста SignalR
export interface SignalRContextType {
   connection: HubConnection | null;
   isConnected: boolean;
   events: any[];
   sendData: (methodName: string, ...args: any[]) => Promise<any>;
   simulateReceiveEvent: (eventData: any) => void;
   startConnection: () => void;
   stopConnection: () => void;
   clearProcessedEvent: (eventIndex: number) => void;
}

// Создаем контекст
const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

// Пропсы для провайдера
interface SignalRProviderProps {
   children: ReactNode;
}

// Функция для логирования ошибок
function error(value: string, err: any) {
   if (!signalRLoggingEnabled)
      return;

   console.error(value, err);
}

// Компонент провайдера контекста
export const SignalRProvider = ({ children }: SignalRProviderProps) => {
   const [connection, setConnection] = useState<HubConnection | null>(null);
   const [isConnected, setIsConnected] = useState(false);
   const [events, setEvents] = useState<any[]>([]);
   const { showToast } = useToast();
   const { hubDetails } = useConnectionStore();

   // Создание соединения
   useEffect(() => {
      if (!hubDetails.url) return;

      const newConnection = new signalR.HubConnectionBuilder()
         .withUrl(hubDetails.url, {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets,
            accessTokenFactory: () => btoa(JSON.stringify(hubDetails.token)),
         })
         .withAutomaticReconnect()
         .configureLogging(signalR.LogLevel.Error)
         .build();

      setConnection(newConnection);

      return () => {
         if (newConnection) {
            newConnection.stop().catch(err => error('Error stopping connection:', err));
         }
      };
   }, [hubDetails]);

   // Создание соединения
   useEffect(() => {
      if (connection && !isConnected) {
         startConnection();
      }
   }, [connection, isConnected]);

   // Метод для добавления нового события в очередь
   const addEvent = useCallback((event: any) => {
      setEvents(prev => [...prev, event]);
   }, []);

   // Функция для запуска соединения
   const startConnection = useCallback(async () => {
      if (connection) {
         try {
            await connection.start();
            setIsConnected(true);
            showToast('Подключение к серверу установлено', 'success');
            
            // Обработчик входящих сообщений от сервера
            connection.on('onGameUpdated', (message: any) => {
               console.log(message.updateType, message.event);
               addEvent(message);
            });

            connection.on('onGameFinished', (message: any) => {
               addEvent({event: message, updateType: GameUpdateTypes.GameFinished});
            });
            
            connection.on('onGameCanceled', (message: any) => {
               addEvent({event: message, updateType: GameUpdateTypes.GameCanceled});
            });
            
         } catch (err) {
            setIsConnected(false);
            showToast('Ошибка при подключении к серверу', 'error');
            error('Error starting connection:', err);
         }
      }
   }, [connection, addEvent, showToast]);

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
      addEvent(eventData);
   }, [addEvent]);

   // Метод для удаления обработанного события из очереди
   const clearProcessedEvent = useCallback((eventIndex: number) => {
      setEvents(prev => prev.filter((_, index) => index !== eventIndex));
   }, []);

   // Мемоизация значения контекста
   const contextValue = useMemo(() => ({
      connection,
      isConnected,
      events,
      sendData,
      simulateReceiveEvent,
      startConnection,
      stopConnection,
      clearProcessedEvent
   }), [connection, isConnected, events, sendData, simulateReceiveEvent, startConnection, stopConnection, clearProcessedEvent]);

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