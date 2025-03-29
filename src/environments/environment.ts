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

    const cards = Array(6).fill(null).map((_, index) => {

        let randomSuit = Math.floor(Math.random() * 4)
        let randomRank = Math.floor(Math.random() * 9)

        const numericRankValues = Object.values(RankValues).filter(value => typeof value === 'number') as number[];
        const suit = { iconChar: Object.values(SuitsSymbols)[randomSuit], name: Object.values(Suits)[randomSuit] };
        const rank = { name: Object.values(Ranks)[randomRank], value: numericRankValues[randomRank] as number, shortName: Object.values(Ranks)[randomRank] };

        return {
            id: index + 1, // Уникальный ID для каждой карточки
            suit,
            rank
        };
    })

    return {
        useTestCards: false,
        testButtons: false,
        testCards: cards
    };
}

export const connPanelEnabled = true;
export const signalRLoggingEnabled = true;
// export const gsEndpoint = null;
export const cardServerUrl = '../src/assets';
export const gsEndpoint = 'http://192.168.0.50:52001';
// export const cardServerUrl = 'http://192.168.0.50:5500/durak_cards';