import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SignalRProvider } from "./contexts/SignalRContext.tsx";
import { AudioProvider } from "./contexts/AudioContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import GameWrapper from "./components/shared/GameWrapper.tsx";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <UserProvider initialToken={null}>
            <AudioProvider>
         <SignalRProvider>
               <GameWrapper>
                  <App />
               </GameWrapper>
         </SignalRProvider>
            </AudioProvider>
      </UserProvider>
   </StrictMode>
);
