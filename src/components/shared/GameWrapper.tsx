import { DndContext } from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { ReactNode, } from "react";
import { useGameService } from "../../contexts/GameServiceContext";

interface GameWrapperProps {
  children: ReactNode;
}

const GameWrapper = ({ children }: GameWrapperProps) => {
  // Мемоизируем использование хука
  const { handleDragEnd } = useGameService();

  return (
    <DndContext modifiers={[snapCenterToCursor]} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
};

export default GameWrapper; 