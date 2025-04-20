import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SignalRProvider } from "./contexts/SignalRContext.tsx";
import { AudioProvider } from "./contexts/AudioContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import GameWrapper from "./components/shared/GameWrapper.tsx";
import { GameServiceProvider } from "./contexts/GameServiceContext.tsx";
import { ToastProvider } from "./services/ToastService.tsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <UserProvider initialToken={null}>
         <AudioProvider>
            <ToastProvider>
               <SignalRProvider>
                  <GameServiceProvider>
                     <GameWrapper>
                        <App />
                     </GameWrapper>
                  </GameServiceProvider>
               </SignalRProvider>
            </ToastProvider>
         </AudioProvider>
      </UserProvider>
   </StrictMode>
);
