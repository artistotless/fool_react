import { ICard, Ranks, RankValues, Suits, SuitsSymbols } from "src/types";

export const tokens = [
    {
        userId: "94f0c2ae-f4c4-4673-8c75-474f961952d2",
        nickName: "player1",
        scopes: ["openid", "profile", "email", "realtime", "offline_access"]
    },
    {
        userId: "94f0c2ae-f4c4-4673-8c75-474f961952d4",
        nickName: "player2",
        scopes: ["openid", "profile", "email", "realtime", "offline_access"]
    },
    {
        userId: "94f0c2ae-f4c4-4673-8c75-474f961952d5",
        nickName: "player3",
        scopes: ["openid", "profile", "email", "realtime", "offline_access"]
    },
    {
        userId: "94f0c2ae-f4c4-4673-8c75-474f961952d6",
        nickName: "player4",
        scopes: ["openid", "profile", "email", "realtime", "offline_access"]
    }
];

export const testMode = (): {
    testButtons: boolean;
    useTestCards: boolean
    testCards: ICard[]
} => {

    let randomSuit = () => Math.floor(Math.random() * 4)
    let randomRank = () => Math.floor(Math.random() * 13)

    return {
        useTestCards: true,
        testButtons: true,
        testCards: Array(6).fill(null).map((_, index) => ({
            id: index + 1, // Уникальный ID для каждой карточки
            suit: { iconChar: Object.values(SuitsSymbols)[randomSuit()], name: Object.values(Suits)[randomSuit()] },
            rank: { name: Object.values(Ranks)[randomRank()], value: Object.values(RankValues)[randomRank()] as number, shortName: Object.values(Ranks)[randomRank()] },
        }))
    };
}

export const signalRLoggingEnabled = true;
export const connPanelEnabled = false;
// export const gsEndpoint = 'https://localhost:22001';
export const gsEndpoint = 'http://artistotless:52001';
export const cardServerUrl = 'http://artistotless:5500/durak_cards';
