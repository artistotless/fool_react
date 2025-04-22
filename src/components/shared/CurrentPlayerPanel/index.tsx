import { useState, useEffect, useRef } from 'react';
import styles from './currentplayerpanel.module.scss';
import { useUser } from 'src/contexts/UserContext';
import useGameStore from 'src/store/gameStore';
import { Sounds } from 'src/utils/sounds';
import { useAudio } from 'src/contexts/AudioContext';
import { testMode } from 'src/environments/environment';

const CurrentPlayerPanel = () => {
    const { user } = useUser();
    const { players, attackerId, defenderId, passedPlayers, moveTime, movedAt } = useGameStore();
    const [avatarSrc, setAvatarSrc] = useState<string>(user.avatar || '');
    const [progress, setProgress] = useState<number>(100);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { play, stop } = useAudio();
    const soundPlayedRef = useRef(false);
    
    // Находим текущего игрока из списка игроков
    const currentPlayer = players.find(player => player.id === user.id);

    useEffect(() => {
        // Если аватарка отсутствует, загружаем случайную с DiceBear API
        if (!user.avatar || user.avatar.trim() === '') {
            // Используем id игрока как seed для получения одинаковой аватарки
            const seed = user.id || user.name || Math.random().toString(36).substring(2, 8);
            const style = 'open-peeps';
            setAvatarSrc(`https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`);
        } else {
            setAvatarSrc(user.avatar);
        }
    }, [user.avatar, user.id, user.name]);

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
    
    // Если игрок не найден, возвращаем пустой компонент
    if (!currentPlayer) {
        return null;
    }

    // Статусы игрока
    const isAttacking = currentPlayer.id === attackerId;
    const isDefending = currentPlayer.id === defenderId;
    const isPassed = passedPlayers.includes(currentPlayer.id);
    
    // Определяем класс на основе статуса
    const statusClass = [
        styles.avatar_container,
        isAttacking && styles.attacking,
        isDefending && styles.defending,
        isPassed && styles.passed
    ].filter(Boolean).join(' ');

    // Определение стилей для таймера
    const timerStyle = {
        '--progress': `${progress}%`
    } as React.CSSProperties;

    // Определяем класс для состояния таймера
    const timerClass = [
        styles.timer_overlay,
        progress < 60 && styles.warning
    ].filter(Boolean).join(' ');

    const shouldShowTimer = (testMode().enabled || (moveTime && movedAt)) && 
                           (currentPlayer.id === attackerId || currentPlayer.id === defenderId);

    return (
        <div className={statusClass} title={user.name} style={shouldShowTimer ? timerStyle : undefined}>
            <img 
                src={avatarSrc} 
                alt={user.name} 
                onError={() => {
                    // Запасной вариант, если даже DiceBear не загрузился
                    const fallbackSeed = Math.random().toString(36).substring(2, 8);
                    setAvatarSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`);
                }} 
            />
            {shouldShowTimer && <div className={timerClass}></div>}
        </div>
    );
};

export default CurrentPlayerPanel; 