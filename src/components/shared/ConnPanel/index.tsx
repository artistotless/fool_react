import { useState } from "react";
import styles from "./connPanel.module.scss";
import * as env from "../../../environments/environment";

const ConnPanel = ({ startConnection }: any) => {

    const [matchId, setMatchId] = useState<string>('');
    const [selectedToken, setSelectedToken] = useState({});

    // Обработчик для выбора игрока
    const handlePlayerSelect = (event: any) => {
        const playerIndex = event.target.value;
        console.log(`selected player : ${env.tokens[playerIndex].nickName}`)
        setSelectedToken(env.tokens[playerIndex]);
    };

    // Обработчик клика на кнопку "Connect to match"
    const handleConnect = () => {
        if (selectedToken && matchId) {
            startConnection(`${env.gsEndpoint}/matches/${matchId}`, selectedToken);
        } else {
            alert("Please select a player and enter a match ID.");
        }
    };

    return (<div className={styles.connPanel}>
        <h2>Select a Player</h2>
        <div className={styles.formGroup}>
            <label><input value="0" onChange={handlePlayerSelect} type="radio"/> Player 1</label>
        </div>
        <div className={styles.formGroup}>
            <label><input value="1" onChange={handlePlayerSelect} type="radio"/> Player 2</label>
        </div>
        <div className={styles.formGroup}>
            <label><input value="2" onChange={handlePlayerSelect} type="radio"/> Player 3</label>
        </div>
        <div className={styles.formGroup}>
            <label><input value="3" onChange={handlePlayerSelect} type="radio"/> Player 4</label>
        </div>

        <div className={styles.formGroup}>
            <h1>Durak Game</h1>
            <input value={matchId} onChange={(e) => setMatchId(e.target.value)} type="text" placeholder="matchId (Example: 60b59ce0-e2c0-4777-9c94-6b7d7c9b17df)" name="matchId" id="matchIdInput" />
            <button onClick={handleConnect} id="connectButton">Connect to match</button>
        </div></div>);
};

export default ConnPanel;
