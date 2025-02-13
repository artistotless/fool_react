import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { GameProvider } from "./contexts/GameContext.tsx";
import { SignalRProvider } from "./contexts/SignalRContext.tsx";
import { AudioProvider } from "./contexts/AudioContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <UserProvider initialToken={null}>
         <SignalRProvider>
            <AudioProvider>
               <GameProvider>
                  <App />
               </GameProvider>
            </AudioProvider>
         </SignalRProvider>
      </UserProvider>
   </StrictMode>
);
