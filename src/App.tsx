import ConnPanel from "./components/shared/ConnPanel";
import GameField from "./components/shared/GameField";
import GameOverPanel from "./components/shared/GameOverPanel";
import Navbar from "./components/shared/Navbar";
import Test from "./components/shared/Test";
import TestEventSimulator from "./components/TestEventSimulator";
import { useSignalR } from "./contexts/SignalRContext";
import * as env from "./environments/environment";

function App() {
   const { startConnection, isConnected } = useSignalR();

   return (
      <div>
         {isConnected || !env.connPanelEnabled
            ? (
               <div className="root">  
                  <Test />
                  <GameOverPanel />
                  <GameField />
                  <Navbar />
                  {env.testMode().enabled && <TestEventSimulator />}
               </div>
            )
            : (<ConnPanel startConnection={startConnection} />)}
      </div>
   );
}

export default App;
