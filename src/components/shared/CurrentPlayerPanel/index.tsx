import { useState, useEffect } from 'react';
import styles from './currentplayerpanel.module.scss';
import { useUser } from 'src/contexts/UserContext';
import useGameStore from 'src/store/gameStore';

const CurrentPlayerPanel = () => {
    const { user } = useUser();
    const { players, attackerId, defenderId, passedPlayers } = useGameStore();
    const [avatarSrc, setAvatarSrc] = useState<string>(user.avatar || '');
    
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

    return (
        <div className={statusClass} title={user.name}>
            <img 
                src={avatarSrc} 
                alt={user.name} 
                onError={() => {
                    // Запасной вариант, если даже DiceBear не загрузился
                    const fallbackSeed = Math.random().toString(36).substring(2, 8);
                    setAvatarSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${fallbackSeed}`);
                }} 
            />
        </div>
    );
};

export default CurrentPlayerPanel; 