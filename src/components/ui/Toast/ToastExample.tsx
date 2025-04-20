import { useState } from 'react';
import { MessageToast } from './index';
import { MessageType } from './MessageToast';

const ToastExample = () => {
  const [showToast, setShowToast] = useState(false);
  const [messageType, setMessageType] = useState<MessageType>('neutral');
  const [message, setMessage] = useState('');

  const displayMessage = (type: MessageType, text: string) => {
    // Закрыть предыдущий тост, если он открыт
    if (showToast) {
      setShowToast(false);
      setTimeout(() => {
        setMessageType(type);
        setMessage(text);
        setShowToast(true);
      }, 300);
    } else {
      setMessageType(type);
      setMessage(text);
      setShowToast(true);
    }
  };

  const handleClose = () => {
    setShowToast(false);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3>Тестирование MessageToast</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => displayMessage('error', 'Ошибка! Что-то пошло не так.')}
          style={{ padding: '8px 12px' }}
        >
          Показать ошибку
        </button>
        
        <button 
          onClick={() => displayMessage('success', 'Успех! Операция выполнена.')}
          style={{ padding: '8px 12px' }}
        >
          Показать успех
        </button>
        
        <button 
          onClick={() => displayMessage('neutral', 'Информация: Игра началась.')}
          style={{ padding: '8px 12px' }}
        >
          Показать инфо
        </button>
      </div>

      {showToast && (
        <MessageToast
          message={message}
          type={messageType}
          duration={3000}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default ToastExample; 