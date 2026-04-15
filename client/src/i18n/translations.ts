export const translations = {
  en: {
    // Home
    'home.title': 'Cockroach Poker',
    'home.subtitle': 'A bluffing card game',
    'home.createRoom': 'Create Room',
    'home.joinRoom': 'Join Room',
    'home.nickname': 'Your nickname',
    'home.back': 'Back',
    'home.create': 'Create',
    'home.roomCode': 'Room code (e.g. ABCD)',
    'home.join': 'Join',

    // Lobby
    'lobby.room': 'Room: {roomCode}',
    'lobby.players': 'Players ({count}/6)',
    'lobby.you': '(you)',
    'lobby.admin': '(admin)',
    'lobby.offline': '(offline)',
    'lobby.kick': 'Kick',
    'lobby.observers': 'Observers ({count})',
    'lobby.joinAsPlayer': 'Join as Player',
    'lobby.switchToObserver': 'Switch to Observer',
    'lobby.gameSettings': 'Game Settings',
    'lobby.base': 'Base',
    'lobby.royal': 'Royal',
    'lobby.royalMinPlayers': '(3+ players)',
    'lobby.royalRequires': 'Royal requires at least 3 players',
    'lobby.startGame': 'Start Game',
    'lobby.needPlayers': 'Need {min}+ players to start',
    'lobby.closeRoom': 'Close Room',
    'lobby.waiting': 'Waiting for the admin to start the game...',
    'lobby.leaveRoom': 'Leave Room',

    // Game Status
    'status.yourTurn': 'Your turn! Pick a card and pass it to someone.',
    'status.waitingPass': 'Waiting for {name} to pass a card...',
    'status.claimPrompt': '{name} says it\'s a {critter}. True or False?',
    'status.waitingRespond': 'Waiting for {name} to respond...',
    'status.youPeeked': 'You peeked! Now pass it to someone else.',
    'status.otherPeeked': '{name} peeked and is choosing who to pass to...',
    'status.revealing': 'Revealing the card...',
    'status.gameOver': 'Game Over!',
    'status.observing': 'Observing',
    'status.rules': 'Rules',
    'status.quit': 'Quit',

    // Table
    'table.you': '(you)',
    'table.cards': '{count} cards',
    'table.offline': 'offline',
    'table.sawCard': 'saw card',
    'table.noCards': 'No cards',

    // Hand
    'hand.label': 'Your Hand ({count})',

    // Action Panel
    'action.observing': 'You are observing this game.',
    'action.cardWas': 'The card was: {critter}',
    'action.royal': '(Royal)',

    // Pass Card Form
    'pass.title': 'Pass a Card',
    'pass.step1Selected': '1. Select a card from your hand (selected)',
    'pass.step1Click': 'Click a card in your hand below',
    'pass.step2': '2. Choose who to pass to:',
    'pass.step3': '3. Declare what it is (you may lie!):',
    'pass.submit': 'Pass Card',

    // Response Panel
    'response.claim': '{name} says: "This is a {critter}"',
    'response.true': 'TRUE',
    'response.trueHint': 'The claim is correct',
    'response.false': 'FALSE',
    'response.falseHint': 'The claim is a lie',
    'response.peek': 'PEEK & PASS',
    'response.peekHint': 'Look at the card, then pass it on',
    'response.noPlayers': 'No valid players to pass to — you must call True or False.',

    // Peek Pass Form
    'peek.youPeeked': 'You peeked: ',
    'peek.passTo': 'Pass to (players who haven\'t seen the card):',
    'peek.declare': 'Declare what it is (you may lie!):',
    'peek.submit': 'Pass Card',

    // Chain Info
    'chain.label': 'Card passed through: ',

    // Game Over
    'gameover.title': 'Game Over!',
    'gameover.youLost': 'You lost!',
    'gameover.otherLost': '{name} lost!',
    'gameover.playAgain': 'Play Again',
    'gameover.waitingAdmin': 'Waiting for admin to restart...',
    'gameover.leaveRoom': 'Leave Room',

    // Rules Modal
    'rules.title': 'How to Play',
    'rules.goalTitle': 'Goal',
    'rules.goalText': 'Don\'t be the first player to collect 4 of the same critter face-up in front of you — or to run out of cards in your hand.',
    'rules.turnTitle': 'On Your Turn',
    'rules.turn1': 'Pick a card from your hand.',
    'rules.turn2': 'Pass it face-down to another player.',
    'rules.turn3': 'Declare a critter type (truth or bluff — your choice!).',
    'rules.receiveTitle': 'Receiving a Card',
    'rules.receiveText': 'When someone passes you a card, you have three options:',
    'rules.receiveTrue': 'Call TRUE — You believe them. If you\'re right, they keep the card face-up. If wrong, you keep it.',
    'rules.receiveFalse': 'Call FALSE — You think they\'re bluffing. If you\'re right, they keep the card. If wrong, you keep it.',
    'rules.receivePeek': 'Peek & Pass — Secretly look at the card, then pass it to someone else with a new (or same) claim. You can\'t pass it back to someone who has already seen it.',
    'rules.royalTitle': 'Royal Cards',
    'rules.royalText': 'Royal cards have a gold border and crown badge. When a Royal card is placed face-up, all OTHER players who have a face-up card of the same critter type get to return one of those cards to their hand. This can save someone from losing! Royal cards still count toward the 4-of-a-kind and all-types limits like normal cards. Only available in Royal variant (3+ players).',
    'rules.overTitle': 'Game Over',
    'rules.overText': 'You lose if you collect 4 cards of the same critter face-up, collect one of every critter type, or if your hand is empty when it\'s your turn to pass.',

    // Card
    'card.royal': 'ROYAL',

    // Critter names
    'critter.cockroach': 'cockroach',
    'critter.rat': 'rat',
    'critter.stink_bug': 'stink bug',
    'critter.toad': 'toad',
    'critter.bat': 'bat',
    'critter.fly': 'fly',
    'critter.scorpion': 'scorpion',
    'critter.spider': 'spider',

    // Language
    'lang.toggle': 'CN',
  },
  zh: {
    // Home
    'home.title': '蟑螂扑克',
    'home.subtitle': '一款虚张声势的纸牌游戏',
    'home.createRoom': '创建房间',
    'home.joinRoom': '加入房间',
    'home.nickname': '你的昵称',
    'home.back': '返回',
    'home.create': '创建',
    'home.roomCode': '房间代码（如 ABCD）',
    'home.join': '加入',

    // Lobby
    'lobby.room': '房间：{roomCode}',
    'lobby.players': '玩家（{count}/6）',
    'lobby.you': '（你）',
    'lobby.admin': '（房主）',
    'lobby.offline': '（离线）',
    'lobby.kick': '踢出',
    'lobby.observers': '观战者（{count}）',
    'lobby.joinAsPlayer': '加入游戏',
    'lobby.switchToObserver': '切换为观战',
    'lobby.gameSettings': '游戏设置',
    'lobby.base': '基础',
    'lobby.royal': '皇家',
    'lobby.royalMinPlayers': '（需3人以上）',
    'lobby.royalRequires': '皇家模式至少需要3名玩家',
    'lobby.startGame': '开始游戏',
    'lobby.needPlayers': '需要 {min}+ 名玩家才能开始',
    'lobby.closeRoom': '关闭房间',
    'lobby.waiting': '等待房主开始游戏...',
    'lobby.leaveRoom': '离开房间',

    // Game Status
    'status.yourTurn': '轮到你了！选一张牌传给别人。',
    'status.waitingPass': '等待 {name} 出牌...',
    'status.claimPrompt': '{name} 说这是 {critter}。真的还是假的？',
    'status.waitingRespond': '等待 {name} 回应...',
    'status.youPeeked': '你偷看了！现在把牌传给别人。',
    'status.otherPeeked': '{name} 偷看了牌，正在选择传给谁...',
    'status.revealing': '揭牌中...',
    'status.gameOver': '游戏结束！',
    'status.observing': '观战中',
    'status.rules': '规则',
    'status.quit': '退出',

    // Table
    'table.you': '（你）',
    'table.cards': '{count} 张牌',
    'table.offline': '离线',
    'table.sawCard': '已看牌',
    'table.noCards': '没有牌',

    // Hand
    'hand.label': '你的手牌（{count}）',

    // Action Panel
    'action.observing': '你正在观战。',
    'action.cardWas': '这张牌是：{critter}',
    'action.royal': '（皇家）',

    // Pass Card Form
    'pass.title': '传牌',
    'pass.step1Selected': '1. 从手牌中选一张（已选择）',
    'pass.step1Click': '点击下方手牌选择',
    'pass.step2': '2. 选择传给谁：',
    'pass.step3': '3. 声明这是什么（可以说谎！）：',
    'pass.submit': '传牌',

    // Response Panel
    'response.claim': '{name} 说："这是 {critter}"',
    'response.true': '真的',
    'response.trueHint': '我相信这个声明',
    'response.false': '假的',
    'response.falseHint': '我觉得在说谎',
    'response.peek': '偷看并传牌',
    'response.peekHint': '先看牌，再传给别人',
    'response.noPlayers': '没有可以传牌的玩家——你必须选择真或假。',

    // Peek Pass Form
    'peek.youPeeked': '你偷看了：',
    'peek.passTo': '传给（还没看过牌的玩家）：',
    'peek.declare': '声明这是什么（可以说谎！）：',
    'peek.submit': '传牌',

    // Chain Info
    'chain.label': '传牌路径：',

    // Game Over
    'gameover.title': '游戏结束！',
    'gameover.youLost': '你输了！',
    'gameover.otherLost': '{name} 输了！',
    'gameover.playAgain': '再来一局',
    'gameover.waitingAdmin': '等待房主重新开始...',
    'gameover.leaveRoom': '离开房间',

    // Rules Modal
    'rules.title': '游戏规则',
    'rules.goalTitle': '目标',
    'rules.goalText': '不要成为第一个在面前集齐 4 张相同害虫牌的玩家——或者手牌用完的玩家。',
    'rules.turnTitle': '你的回合',
    'rules.turn1': '从手牌中选一张牌。',
    'rules.turn2': '把它面朝下传给另一个玩家。',
    'rules.turn3': '声明一种害虫类型（可以说真话也可以说谎！）。',
    'rules.receiveTitle': '收到牌时',
    'rules.receiveText': '当有人传牌给你时，你有三个选择：',
    'rules.receiveTrue': '喊"真的" — 你相信对方。如果猜对了，对方留下牌；猜错了，你留下牌。',
    'rules.receiveFalse': '喊"假的" — 你觉得对方在说谎。如果猜对了，对方留下牌；猜错了，你留下牌。',
    'rules.receivePeek': '偷看并传牌 — 偷偷看一下牌，然后传给其他人并做出新的（或相同的）声明。你不能传给已经看过这张牌的人。',
    'rules.royalTitle': '皇家牌',
    'rules.royalText': '皇家牌有金色边框和皇冠标志。当一张皇家牌被翻开放在面前时，其他所有拥有该害虫类型面朝上牌的玩家可以将其中一张收回手牌。这可能救人一命！皇家牌同样计入 4 张同类和集齐所有种类的输牌条件。仅在皇家模式中可用（需3人以上）。',
    'rules.overTitle': '游戏结束',
    'rules.overText': '如果你面前集齐了 4 张相同的害虫牌、集齐了所有 8 种害虫各一张，或者轮到你出牌时手牌为空，你就输了。',

    // Card
    'card.royal': '皇家',

    // Critter names
    'critter.cockroach': '蟑螂',
    'critter.rat': '老鼠',
    'critter.stink_bug': '臭虫',
    'critter.toad': '蟾蜍',
    'critter.bat': '蝙蝠',
    'critter.fly': '苍蝇',
    'critter.scorpion': '蝎子',
    'critter.spider': '蜘蛛',

    // Language
    'lang.toggle': 'EN',
  },
} as const;

export type Lang = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];
