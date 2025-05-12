import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';

interface AudioContext {
  play: (props: PlayAudioProps, loop?: boolean, volume?: number) => void;
  pause: (id: number) => void;
  stop: (id: number) => void;
}

interface PlayAudioProps {
  id: number;
  src: string;
}
// Создаем контекст для звука
const AudioContext = createContext<AudioContext | null>(null);

// Провайдер для звука
export const AudioProvider = ({ children }: { children: ReactNode }) => {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({}); // Храним ссылки на аудиоэлементы

  // Функция для воспроизведения звука
  const play = (props: PlayAudioProps, loop: boolean = false, volume: number = 1) => {
    const { id, src } = props;
    if (!audioRefs.current[id]) {
      // Создаем новый аудиоэлемент, если его нет
      audioRefs.current[id] = new Audio(src);
      audioRefs.current[id].load();
    }

    const audio = audioRefs.current[id];
    audio.loop = loop;
    audio.volume = volume;
    if (audio.paused) {
      audio.play();
    } else {
      audio.currentTime = 0; // Перезапускаем звук, если он уже играет
      audio.play();
    }
  };

  // Функция для паузы
  const pause = (id: number) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
    }
  };

  // Функция для остановки звука
  const stop = (id: number) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      audioRefs.current[id].currentTime = 0; // Сбрасываем время воспроизведения
    }
  };

  const contextValue = useMemo(() => ({
    play,
    pause,
    stop
  }), [play, pause, stop]);

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Хук для использования контекста
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};