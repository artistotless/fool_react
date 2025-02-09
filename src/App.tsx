import ConnPanel from "./components/shared/ConnPanel";
import GameField from "./components/shared/GameField";
import Navbar from "./components/shared/Navbar";
import { useSignalR } from "./contexts/SignalRContext";

function App() {
   const { startConnection, isConnected } = useSignalR();

   return (
      <div>
         {isConnected
            ? (<div className="root"><GameField /><Navbar /></div>)
            : (<ConnPanel startConnection={startConnection} />)}
      </div>
   );
}

export default App;
