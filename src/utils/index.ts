export * from './animations';
export * from './card-utils';
export * from './dom-utils.tsx';
export * from './sounds'; 
export * from './guid-utils'; 

/**
 * Форматирует оставшееся время в миллисекундах в строку формата "м:сс"
 * 
 * @param {number} milliseconds - Время в миллисекундах
 * @returns {string} Отформатированная строка времени
 */
export function formatTimeLeft(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 