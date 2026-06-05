// ─── Game Type (shared across all games) ───
export var GameType;
(function (GameType) {
    GameType["COCKROACH_POKER"] = "cockroach_poker";
    GameType["SABOTEUR"] = "saboteur";
})(GameType || (GameType = {}));
// ─── Saboteur Enums ───
export var SaboteurRole;
(function (SaboteurRole) {
    SaboteurRole["MINER"] = "miner";
    SaboteurRole["SABOTEUR"] = "saboteur";
})(SaboteurRole || (SaboteurRole = {}));
export var SaboteurPhase;
(function (SaboteurPhase) {
    SaboteurPhase["WAITING"] = "waiting";
    SaboteurPhase["PLAYING"] = "playing";
    SaboteurPhase["MAP_PEEK"] = "map_peek";
    SaboteurPhase["ROUND_END"] = "round_end";
    SaboteurPhase["GAME_OVER"] = "game_over";
})(SaboteurPhase || (SaboteurPhase = {}));
export var Direction;
(function (Direction) {
    Direction["TOP"] = "top";
    Direction["RIGHT"] = "right";
    Direction["BOTTOM"] = "bottom";
    Direction["LEFT"] = "left";
})(Direction || (Direction = {}));
export var Tool;
(function (Tool) {
    Tool["PICKAXE"] = "pickaxe";
    Tool["LANTERN"] = "lantern";
    Tool["CART"] = "cart";
})(Tool || (Tool = {}));
export var SaboteurCardKind;
(function (SaboteurCardKind) {
    SaboteurCardKind["PATH"] = "path";
    SaboteurCardKind["BREAK"] = "break";
    SaboteurCardKind["REPAIR"] = "repair";
    SaboteurCardKind["ROCKFALL"] = "rockfall";
    SaboteurCardKind["MAP"] = "map";
})(SaboteurCardKind || (SaboteurCardKind = {}));
// ─── Events (Saboteur-specific) ───
export var SaboteurClientEvent;
(function (SaboteurClientEvent) {
    SaboteurClientEvent["PLAY_PATH"] = "sab:playPath";
    SaboteurClientEvent["PLAY_BREAK"] = "sab:playBreak";
    SaboteurClientEvent["PLAY_REPAIR"] = "sab:playRepair";
    SaboteurClientEvent["PLAY_ROCKFALL"] = "sab:playRockfall";
    SaboteurClientEvent["PLAY_MAP"] = "sab:playMap";
    SaboteurClientEvent["MAP_PEEK_DONE"] = "sab:mapPeekDone";
    SaboteurClientEvent["DISCARD"] = "sab:discard";
    SaboteurClientEvent["NEXT_ROUND"] = "sab:nextRound";
})(SaboteurClientEvent || (SaboteurClientEvent = {}));
export var SaboteurServerEvent;
(function (SaboteurServerEvent) {
    SaboteurServerEvent["STATE_SYNC"] = "sab:stateSync";
    SaboteurServerEvent["GOAL_PEEKED"] = "sab:goalPeeked";
    SaboteurServerEvent["ROUND_END"] = "sab:roundEnd";
    SaboteurServerEvent["GAME_OVER"] = "sab:gameOver";
})(SaboteurServerEvent || (SaboteurServerEvent = {}));
//# sourceMappingURL=types.js.map