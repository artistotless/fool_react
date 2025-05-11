import ConnPanel from "./components/shared/ConnPanel";
import GameField from "./components/shared/GameField";
import Navbar from "./components/shared/Navbar";
import TestEventSimulator from "./components/shared/TestEventSimulator/TestEventSimulator";
import { useSignalR } from "./contexts/SignalRContext";
import * as env from "./environments/environment";
import WinnersList from './components/shared/WinnersList';
import CancellationTimer from './components/shared/CancellationTimer';

function App() {
   const { isConnected } = useSignalR();

   return (
      <div>
         {isConnected || !env.connPanelEnabled
            ? (
               <div className="root">
                  <GameField />
                  <Navbar />
                  {env.testMode().enabled && <TestEventSimulator />}
                  <WinnersList />
                  <CancellationTimer />
               </div>
            )
            : (<ConnPanel />)}
      </div>
   );
}

export default App;
