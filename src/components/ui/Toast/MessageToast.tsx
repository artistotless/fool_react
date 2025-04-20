import { useEffect, useState } from 'react';
import styles from './MessageToast.module.css';

export type MessageType = 'error' | 'success' | 'neutral';

interface MessageToastProps {
  message: string;
  type?: MessageType;
  duration?: number;
  onClose?: () => void;
}

const MessageToast: React.FC<MessageToastProps> = ({ 
  message, 
  type = 'neutral',
  duration = 3000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Показываем сообщение сразу после монтирования
    const showTimer = setTimeout(() => {
      setVisible(true);
    }, 10);
    
    // Устанавливаем таймер для скрытия сообщения
    const hideTimer = setTimeout(() => {
      setVisible(false);
      
      // Даем время для анимации исчезновения, затем вызываем onClose
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);
    
    // Очищаем таймеры при размонтировании
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  return (
    <div 
      className={`${styles.messageToast} ${styles[type]} ${visible ? styles.show : ''}`}
      data-testid="message-toast"
    >
      <div className={styles.messageIcon}>
        {type === 'error' && '✖'}
        {type === 'success' && '✓'}
        {type === 'neutral' && 'ⓘ'}
      </div>
      <p className={styles.messageText}>{message}</p>
    </div>
  );
};

export default MessageToast; 