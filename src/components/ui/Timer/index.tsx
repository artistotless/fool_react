import { memo, useEffect, useState } from "react";

interface TimerProps {
    moveTime: string; // Формат "HH:mm:ss"
    movedAt: string; // ISO 8601 дата и время
}

const Timer = ({ moveTime, movedAt }: TimerProps) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        // Преобразуем moveTime в секунды
        const [hours, minutes, seconds] = moveTime.split(":").map(Number);
        const totalMoveTimeInSeconds = hours * 3600 + minutes * 60 + seconds;

        // Преобразуем movedAt в объект Date
        const movedAtDate = new Date(movedAt);

        // Вычисляем время окончания хода
        const endTime = movedAtDate.getTime() + totalMoveTimeInSeconds * 1000;

        let intervalId: NodeJS.Timeout; // Объявляем переменную здесь

        // Функция для обновления таймера
        const updateTimer = () => {
            const currentTime = Date.now();
            const remainingTime = Math.max(0, endTime - currentTime); // Оставшееся время в миллисекундах
            setTimeLeft(Math.floor(remainingTime / 1000)); // Переводим в секунды

            if (remainingTime === 0) {
                clearInterval(intervalId); // Останавливаем таймер, если время истекло
            }
        };

        // Запускаем таймер
        updateTimer(); // Первый вызов для немедленного обновления
        intervalId = setInterval(updateTimer, 1000);

        // Очистка интервала при размонтировании компонента
        return () => clearInterval(intervalId);
    }, [moveTime, movedAt]);

    // Форматируем оставшееся время в формат "mm:ss"
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return (
        <div>
            <h3>{formatTime(timeLeft)}</h3>
        </div>
    );
};

export default memo(Timer);