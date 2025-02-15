import ConnPanel from "./components/shared/ConnPanel";
import GameField from "./components/shared/GameField";
import Navbar from "./components/shared/Navbar";
import Test from "./components/shared/Test";
import { useSignalR } from "./contexts/SignalRContext";
import * as env from "./environments/environment";

function App() {
   const { startConnection, isConnected } = useSignalR();

   return (
      <div>
         {isConnected || !env.connPanelEnabled
            ? (<div className="root">  <Test /><GameField /><Navbar /></div>)
            : (<ConnPanel startConnection={startConnection} />)}
      </div>
   );
}

export default App;
