import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GameProvider } from "./contexts/GameContext.tsx";
import { SignalRProvider } from "./contexts/SignalRContext.tsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <SignalRProvider>
         <GameProvider>
            <App />
         </GameProvider>
      </SignalRProvider>
   </StrictMode>
);
