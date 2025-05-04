import ConnPanel from "./components/shared/ConnPanel";
import GameField from "./components/shared/GameField";
import GameOverPanel from "./components/shared/GameOverPanel";
import Navbar from "./components/shared/Navbar";
import TestEventSimulator from "./components/shared/TestEventSimulator/TestEventSimulator";
import { useSignalR } from "./contexts/SignalRContext";
import * as env from "./environments/environment";

function App() {
   const { isConnected } = useSignalR();

   return (
      <div>
         {isConnected || !env.connPanelEnabled
            ? (
               <div className="root">  
                  <GameOverPanel />
                  <GameField />
                  <Navbar />
                  {env.testMode().enabled && <TestEventSimulator />}
               </div>
            )
            : (<ConnPanel/>)}
      </div>
   );
}

export default App;
