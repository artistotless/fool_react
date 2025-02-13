import { useState } from "react";
import styles from "./connPanel.module.scss";
import * as env from "../../../environments/environment";
import { motion } from "framer-motion";
import { useUser } from "src/contexts/UserContext";
import { IUserToken } from "src/types";

const ConnPanel = ({ startConnection }: { startConnection: (endpoint: string, token: IUserToken, subs: string[]) => void }) => {

  const [matchId, setMatchId] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const { token, setToken } = useUser();

  // Обработчик для выбора игрока
  const handlePlayerSelect = (event: any) => {
    const playerIndex = event.target.value;
    console.log(`selected player : ${env.tokens[playerIndex].nickName}`)
    setSelectedPlayer(playerIndex);
    setToken(env.tokens[playerIndex]);
  };

  // Обработчик клика на кнопку "Connect to match"
  const handleConnect = () => {
    if (token && matchId) {
      startConnection(`${env.gsEndpoint}/matches/${matchId}`, token, ["onGameUpdated", "onGameFinished"]);
    } else {
      alert("Please select a player and enter a match ID.");
    }
  };
  return (
    <motion.div
      className={styles.connPanel}
      initial={{ opacity: 0, y: -1000 }} // Начальное состояние (появление)
      animate={{ opacity: 1, y: 50 }} // Анимация появления
      transition={{ duration: 0.5 }} // Параметры анимации
    >
      <h2>Select a Player</h2>

      {/* Анимация для каждого элемента формы */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.formGroup}>
          <label>
            <input
              value="0"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "0"}
            />{" "}
            Player 1
          </label>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className={styles.formGroup}>
          <label>
            <input
              value="1"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "1"}
            />{" "}
            Player 2
          </label>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className={styles.formGroup}>
          <label>
            <input
              value="2"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "2"}
            />{" "}
            Player 3
          </label>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className={styles.formGroup}>
          <label>
            <input
              value="3"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "3"}
            />{" "}
            Player 4
          </label>
        </div>
      </motion.div>

      {/* Анимация для нижней части формы */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className={styles.formGroup}>
          <h1>Durak Game</h1>
          <input
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            type="text"
            placeholder="matchId (Example: 60b59ce0-e2c0-4777-9c94-6b7d7c9b17df)"
            name="matchId"
            id="matchIdInput"
          />
          <button onClick={handleConnect} id="connectButton">
            Connect to match
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConnPanel;
