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

const avaStyle = "open-peeps";

const testTrumpCard = {
    rank: {
        name: '7',
        value: 7,
        suit: 'hearts'
    },
    suit: {
        name: 'hearts',
        iconChar: '♥'
    }
}

const testPlayers = [
    {
        name: "Player 1",
        avatar: `https://api.dicebear.com/9.x/${avaStyle}/svg?seed=1`,
        id: "player1",
        passed: false,
        cardsCount: 6
    }
    //, {
    //     name: "Player 2",
    //     avatar: `https://api.dicebear.com/9.x/${avaStyle}/svg?seed=2`,
    //     id: "player2",
    //     passed: false,
    //     cardsCount: 6
    // },
    // {
    //     name: "Player 3",
    //     avatar: `https://api.dicebear.com/9.x/${avaStyle}/svg?seed=3`,
    //     id: "player3",
    //     passed: false,
    //     cardsCount: 6
    // }
];

export const testMode = (): {
    testButtons: boolean;
    testCards: ICard[]
    testTrumpCard: ICard
    testMoveTime: string
    testMovedAt: string
    enabled: boolean
    testPlayers: { name: string, avatar: string, id: string, passed: boolean, cardsCount: number }[]
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
        testButtons: false || testModeEnabled,
        testCards: cards,
        enabled: testModeEnabled,
        testTrumpCard: testTrumpCard as ICard,
        testPlayers: testPlayers,
        testMoveTime: "00:00:10",
        testMovedAt: new Date().toISOString()
    };
}

const testModeEnabled = true;

export const connPanelEnabled = !testModeEnabled;
export const signalRLoggingEnabled = true;
export const gsEndpoint = null;
export const cardServerUrl = '../src/assets';
// export const gsEndpoint = 'http://85.173.114.118:52001';
// export const cardServerUrl = 'http://85.173.114.118:5500/durak_cards';