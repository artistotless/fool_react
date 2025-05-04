import { useState, useEffect, useRef } from 'react';
import styles from './circleprogresstimer.module.scss';
import { Sounds } from 'src/utils/sounds';
import { useAudio } from 'src/contexts/AudioContext';

interface CircleProgressTimerProps {
    moveTime: string | null;
    movedAt: string | null;
    className?: string;
}

const CircleProgressTimer = ({ moveTime, movedAt, className }: CircleProgressTimerProps) => {
    const [progress, setProgress] = useState<number>(100);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { play, stop } = useAudio();
    const soundPlayedRef = useRef(false);

    // Эффект для управления таймером
    useEffect(() => {
        if (moveTime && movedAt) {
            // Сбрасываем флаг воспроизведения при новых значениях времени
            soundPlayedRef.current = false;
            
            const updateProgress = () => {
                const movedAtTime = new Date(movedAt).getTime();
                const [hours, minutes, seconds] = moveTime.split(":").map(Number);
                const totalMoveTimeMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
                
                const elapsed = Date.now() - movedAtTime;
                const remainingPercent = Math.max(0, 100 - (elapsed / totalMoveTimeMs * 100));
                setProgress(remainingPercent);
                
                // Управление звуком тикания часов
                if (remainingPercent <= 60 && !soundPlayedRef.current) {
                    play(Sounds.Timer, true);
                    soundPlayedRef.current = true;
                }
                
                if(remainingPercent > 60 && soundPlayedRef.current) {
                    stop(Sounds.Timer.id);
                    soundPlayedRef.current = false;
                }
                
                // Остановка таймера при достижении 0
                if (remainingPercent === 0 && intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    stop(Sounds.Timer.id);
                }
            };

            updateProgress();
            intervalRef.current = setInterval(updateProgress, 100);
            
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                stop(Sounds.Timer.id);
                soundPlayedRef.current = false;
            };
        }
    }, [moveTime, movedAt, play, stop]);

    // Определяем класс для состояния таймера
    const timerClass = [
        styles.overlay,
        progress < 60 && styles.warning,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={timerClass} style={{ '--progress': `${progress}%` } as React.CSSProperties}></div>
    );
};

export default CircleProgressTimer; 