import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerLobbyHandlers } from './handlers/lobbyHandlers.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import { registerSaboteurHandlers } from './handlers/saboteurHandlers.js';
import { registerConnectionHandlers } from './handlers/connectionHandlers.js';
import { log } from '../utils/logger.js';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    log('Socket', `Client connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerSaboteurHandlers(io, socket);
    registerConnectionHandlers(io, socket);
  });

  return io;
}
