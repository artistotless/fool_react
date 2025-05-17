import { useState, useEffect } from "react";
import styles from "./connPanel.module.scss";
import * as env from "../../../environments/environment";
import { motion } from "framer-motion";
import { useUser } from "src/contexts/UserContext";
import { useToast } from "src/services/ToastService";
import useConnectionStore from "src/store/connectionStore";

const ConnPanel = () => {

  const { showToast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    return localStorage.getItem('lastSelectedPlayer') || '';
  });
  const { token, setToken } = useUser();
  const { setHubDetails } = useConnectionStore();

  // Загрузка сохраненных данных при монтировании компонента
  useEffect(() => {
    const savedPlayer = localStorage.getItem('lastSelectedPlayer');
    if (savedPlayer) {
      setSelectedPlayer(savedPlayer);
      setToken(env.tokens[parseInt(savedPlayer)]);
    }
  }, []);

  // Обработчик для выбора игрока
  const handlePlayerSelect = (event: any) => {
    const playerIndex = event.target.value;
    console.log(`selected player : ${env.tokens[playerIndex].nickName}`)
    setSelectedPlayer(playerIndex);
    setToken(env.tokens[playerIndex]);
    localStorage.setItem('lastSelectedPlayer', playerIndex);
  };

  // Обработчик клика на кнопку "Connect to match"
  const handleConnect = () => {
    if (token) {
      let endpoint;
      const matchId = "e7f138e9-43ab-4210-8f93-72f001b45208";
      if (env.gsEndpoint == null) {
        endpoint = `http://${window.location.hostname}:52001/matches/${matchId}`;
      } else {
        endpoint = `${env.gsEndpoint}/matches/${matchId}`;
      }
      
      // Сохраняем URL подключения и токен в store
      setHubDetails({ url: endpoint, token });

    } else {
      showToast("Выберите игрока и введите идентификатор матча.", "error");
    }
  };

  // Варианты анимации
  const containerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, delay: 0.5 }
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.4)"
    },
    tap: { 
      scale: 0.98,
      boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)"
    }
  };

  return (
    <motion.div
      className={styles.connPanel}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 variants={itemVariants}>Выберите игрока</motion.h2>

      <motion.div variants={itemVariants}>
        <div className={styles.formGroup}>
          <label>
            <input
              value="0"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "0"}
            />{" "}
           artistotless
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className={styles.formGroup}>
          <label>
            <input
              value="1"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "1"}
            />{" "}
            DARKSIDE
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className={styles.formGroup}>
          <label>
            <input
              value="2"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "2"}
            />{" "}
            хьэнтхъупс
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className={styles.formGroup}>
          <label>
            <input
              value="3"
              onChange={handlePlayerSelect}
              type="radio"
              checked={selectedPlayer === "3"}
            />{" "}
            Игрок 4
          </label>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className={styles.formGroup}>
          <motion.button 
            onClick={handleConnect} 
            id="connectButton"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Подключиться к игре
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConnPanel;
