// Client → Server events
export var ClientEvent;
(function (ClientEvent) {
    ClientEvent["ROOM_CREATE"] = "room:create";
    ClientEvent["ROOM_JOIN"] = "room:join";
    ClientEvent["ROOM_LEAVE"] = "room:leave";
    ClientEvent["ROOM_KICK"] = "room:kick";
    ClientEvent["ROOM_CLOSE"] = "room:close";
    ClientEvent["ROOM_RECONNECT"] = "room:reconnect";
    ClientEvent["LOBBY_TOGGLE_ROLE"] = "lobby:toggleRole";
    ClientEvent["LOBBY_SET_VARIANT"] = "lobby:setVariant";
    ClientEvent["LOBBY_START_GAME"] = "lobby:startGame";
    ClientEvent["GAME_PASS_CARD"] = "game:passCard";
    ClientEvent["GAME_CALL_TRUE_FALSE"] = "game:callTrueFalse";
    ClientEvent["GAME_PEEK_AND_PASS"] = "game:peekAndPass";
    ClientEvent["GAME_PASS_AFTER_PEEK"] = "game:passAfterPeek";
    ClientEvent["GAME_RESTART"] = "game:restart";
    // Saboteur-specific (also exported from saboteur/types)
    ClientEvent["SAB_PLAY_PATH"] = "sab:playPath";
    ClientEvent["SAB_PLAY_BREAK"] = "sab:playBreak";
    ClientEvent["SAB_PLAY_REPAIR"] = "sab:playRepair";
    ClientEvent["SAB_PLAY_ROCKFALL"] = "sab:playRockfall";
    ClientEvent["SAB_PLAY_MAP"] = "sab:playMap";
    ClientEvent["SAB_MAP_PEEK_DONE"] = "sab:mapPeekDone";
    ClientEvent["SAB_DISCARD"] = "sab:discard";
    ClientEvent["SAB_NEXT_ROUND"] = "sab:nextRound";
})(ClientEvent || (ClientEvent = {}));
// Server → Client events
export var ServerEvent;
(function (ServerEvent) {
    ServerEvent["ROOM_CREATED"] = "room:created";
    ServerEvent["ROOM_JOINED"] = "room:joined";
    ServerEvent["ROOM_PLAYER_JOINED"] = "room:playerJoined";
    ServerEvent["ROOM_PLAYER_LEFT"] = "room:playerLeft";
    ServerEvent["ROOM_CLOSED"] = "room:closed";
    ServerEvent["ROOM_KICKED"] = "room:kicked";
    ServerEvent["ROOM_ERROR"] = "room:error";
    ServerEvent["LOBBY_UPDATED"] = "lobby:updated";
    ServerEvent["GAME_STARTED"] = "game:started";
    ServerEvent["GAME_CARD_PASSED"] = "game:cardPassed";
    ServerEvent["GAME_AWAITING_RESPONSE"] = "game:awaitingResponse";
    ServerEvent["GAME_CARD_PEEKED"] = "game:cardPeeked";
    ServerEvent["GAME_CHAIN_UPDATE"] = "game:chainUpdate";
    ServerEvent["GAME_CARD_REVEALED"] = "game:cardRevealed";
    ServerEvent["GAME_ROYAL_EFFECT"] = "game:royalEffect";
    ServerEvent["GAME_ROUND_START"] = "game:roundStart";
    ServerEvent["GAME_STATE_SYNC"] = "game:stateSync";
    ServerEvent["GAME_OVER"] = "game:over";
    // Saboteur-specific
    ServerEvent["SAB_STATE_SYNC"] = "sab:stateSync";
    ServerEvent["SAB_GOAL_PEEKED"] = "sab:goalPeeked";
    ServerEvent["SAB_ROUND_END"] = "sab:roundEnd";
    ServerEvent["SAB_GAME_OVER"] = "sab:gameOver";
})(ServerEvent || (ServerEvent = {}));
//# sourceMappingURL=events.js.map