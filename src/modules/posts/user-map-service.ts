import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

type RoomId = string;
type UserId = string;

@Injectable()
export class UserSocketMapService {
  private readonly logger = new Logger(UserSocketMapService.name);
  private readonly postRoomUserMap: Map<RoomId, Map<UserId, Socket>> = new Map();
  private readonly socketToUserMap: WeakMap<Socket, { userId: UserId; roomId: RoomId }> = new WeakMap();

  addUserToRoom(userId: UserId, roomId: RoomId, socket: Socket): void {
    if (!userId || !roomId || !socket) {
      this.logger.warn(`Invalid parameters for addUserToRoom: userId=${userId}, roomId=${roomId}`);
      return;
    }

    try {
      // Initialize room if it doesn't exist
      if (!this.postRoomUserMap.has(roomId)) {
        this.postRoomUserMap.set(roomId, new Map());
      }

      const roomMap = this.postRoomUserMap.get(roomId);
      if (!roomMap) return;

      // Clean up any existing socket for this user in this room
      const existingSocket = roomMap.get(userId);
      if (existingSocket && existingSocket !== socket && existingSocket.connected) {
        this.cleanupSocket(existingSocket);
      }

      // Add new mapping
      roomMap.set(userId, socket);
      this.socketToUserMap.set(socket, { userId, roomId });

      // Set up cleanup on socket disconnect
      socket.once('disconnect', () => {
        this.removeUserFromRoom(userId, roomId);
      });

      this.logger.debug(`User ${userId} added to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error adding user to room: ${error.message}`, error.stack);
    }
  }

  removeUserFromRoom(userId: UserId, roomId: RoomId): void {
    if (!userId || !roomId) {
      this.logger.warn(`Invalid parameters for removeUserFromRoom: userId=${userId}, roomId=${roomId}`);
      return;
    }

    try {
      const roomMap = this.postRoomUserMap.get(roomId);
      if (!roomMap) return;

      const socket = roomMap.get(userId);
      if (socket) {
        this.cleanupSocket(socket);
        roomMap.delete(userId);
        this.socketToUserMap.delete(socket);
        this.logger.debug(`User ${userId} removed from room ${roomId}`);
      }

      // Clean up empty rooms
      if (roomMap.size === 0) {
        this.postRoomUserMap.delete(roomId);
        this.logger.debug(`Room ${roomId} removed (no more users)`);
      }
    } catch (error) {
      this.logger.error(`Error removing user from room: ${error.message}`, error.stack);
    }
  }

  getSocketByUserId(userId: UserId, roomId: RoomId): Socket | undefined {
    if (!userId || !roomId) {
      return undefined;
    }
    return this.postRoomUserMap.get(roomId)?.get(userId);
  }

  getUserIdBySocket(socket: Socket): UserId | undefined {
    if (!socket) return undefined;
    return this.socketToUserMap.get(socket)?.userId;
  }

  private cleanupSocket(socket: Socket): void {
    if (!socket) return;

    try {
      // Remove all listeners to prevent memory leaks
      socket.removeAllListeners();
      
      // Disconnect the socket if it's still connected
      if (socket.connected) {
        socket.disconnect(true);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up socket: ${error.message}`, error.stack);
    }
  }

  /**
   * Get all active rooms and their user counts
   */
  getRoomStats(): { [roomId: string]: number } {
    const stats: { [roomId: string]: number } = {};
    for (const [roomId, userMap] of this.postRoomUserMap.entries()) {
      stats[roomId] = userMap.size;
    }
    return stats;
  }
}