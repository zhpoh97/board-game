// Client → Server events
export enum ClientEvent {
  ROOM_CREATE = 'room:create',
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',
  ROOM_KICK = 'room:kick',
  ROOM_CLOSE = 'room:close',
  ROOM_RECONNECT = 'room:reconnect',

  LOBBY_TOGGLE_ROLE = 'lobby:toggleRole',
  LOBBY_SET_VARIANT = 'lobby:setVariant',
  LOBBY_START_GAME = 'lobby:startGame',

  GAME_PASS_CARD = 'game:passCard',
  GAME_CALL_TRUE_FALSE = 'game:callTrueFalse',
  GAME_PEEK_AND_PASS = 'game:peekAndPass',
  GAME_PASS_AFTER_PEEK = 'game:passAfterPeek',
  GAME_RESTART = 'game:restart',

  // Saboteur-specific (also exported from saboteur/types)
  SAB_PLAY_PATH = 'sab:playPath',
  SAB_PLAY_BREAK = 'sab:playBreak',
  SAB_PLAY_REPAIR = 'sab:playRepair',
  SAB_PLAY_ROCKFALL = 'sab:playRockfall',
  SAB_PLAY_MAP = 'sab:playMap',
  SAB_MAP_PEEK_DONE = 'sab:mapPeekDone',
  SAB_DISCARD = 'sab:discard',
  SAB_NEXT_ROUND = 'sab:nextRound',
}

// Server → Client events
export enum ServerEvent {
  ROOM_CREATED = 'room:created',
  ROOM_JOINED = 'room:joined',
  ROOM_PLAYER_JOINED = 'room:playerJoined',
  ROOM_PLAYER_LEFT = 'room:playerLeft',
  ROOM_CLOSED = 'room:closed',
  ROOM_KICKED = 'room:kicked',
  ROOM_ERROR = 'room:error',

  LOBBY_UPDATED = 'lobby:updated',

  GAME_STARTED = 'game:started',
  GAME_CARD_PASSED = 'game:cardPassed',
  GAME_AWAITING_RESPONSE = 'game:awaitingResponse',
  GAME_CARD_PEEKED = 'game:cardPeeked',
  GAME_CHAIN_UPDATE = 'game:chainUpdate',
  GAME_CARD_REVEALED = 'game:cardRevealed',
  GAME_ROYAL_EFFECT = 'game:royalEffect',
  GAME_ROUND_START = 'game:roundStart',
  GAME_STATE_SYNC = 'game:stateSync',
  GAME_OVER = 'game:over',

  // Saboteur-specific
  SAB_STATE_SYNC = 'sab:stateSync',
  SAB_GOAL_PEEKED = 'sab:goalPeeked',
  SAB_ROUND_END = 'sab:roundEnd',
  SAB_GAME_OVER = 'sab:gameOver',
}
