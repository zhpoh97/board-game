import { ROOM_CLEANUP_DELAY_MS, GameType } from '@cockroach-poker/shared';
import { Room } from './Room.js';
import { generateRoomCode } from '../utils/idGenerator.js';
import { log } from '../utils/logger.js';

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private sessionToRoom: Map<string, string> = new Map(); // sessionId -> roomCode

  createRoom(adminSessionId: string, gameType: GameType = GameType.COCKROACH_POKER): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const room = new Room(code, adminSessionId, gameType);
    this.rooms.set(code, room);
    log('RoomManager', `Room created: ${code} by ${adminSessionId}`);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomBySession(sessionId: string): Room | undefined {
    const code = this.sessionToRoom.get(sessionId);
    return code ? this.rooms.get(code) : undefined;
  }

  mapSessionToRoom(sessionId: string, roomCode: string): void {
    this.sessionToRoom.set(sessionId, roomCode);
  }

  unmapSession(sessionId: string): void {
    this.sessionToRoom.delete(sessionId);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.clearCleanupTimer();
      for (const sid of room.getAllSessionIds()) {
        this.sessionToRoom.delete(sid);
      }
      this.rooms.delete(code);
      log('RoomManager', `Room deleted: ${code}`);
    }
  }

  scheduleCleanup(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.setCleanupTimer(() => {
      if (room.getConnectedCount() === 0) {
        this.deleteRoom(code);
      }
    }, ROOM_CLEANUP_DELAY_MS);
  }

  cancelCleanup(code: string): void {
    const room = this.rooms.get(code);
    if (room) room.clearCleanupTimer();
  }
}

export const roomManager = new RoomManager();
