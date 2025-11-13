import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PostsService } from './posts.service';
import { UserSocketMapService } from './user-map-service';
import { Logger, UseFilters } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { WsExceptionFilter } from '../../filters';

@WebSocketGateway({
  namespace: 'ws/posts',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 10000, // Close broken connections after 10s of inactivity
  pingInterval: 30000, // Send pings every 30s
  maxHttpBufferSize: 1e8, // 100MB max payload
})
@UseFilters(new WsExceptionFilter())
export class PostsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PostsGateway.name);
  private readonly connectionTimeout = 5000; // 5 seconds for auth

  constructor(
    private readonly postService: PostsService,
    private readonly authService: AuthService,
    private readonly userSocketMapService: UserSocketMapService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket PostsGateway initialized');

    // Set up global error handler
    server.on('connection_error', (error) => {
      this.logger.error('WebSocket connection error:', error);
    });
  }

  private extractToken(authorization: string | undefined): string | undefined {
    if (!authorization) return undefined;
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private stringifyBigInts(obj: any): any {
    if (typeof obj === 'bigint') {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.stringifyBigInts(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.stringifyBigInts(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }

  async handleConnection(client: Socket) {
    const connectionStart = Date.now();
    this.logger.log(`Client connected: ${client.id}`);

    try {
      // Get required connection parameters
      const token = String(client.handshake.query.token || '');
      const postId = String(client.handshake.query.post_id || '');

      // Validate required parameters
      if (!postId) {
        throw new WsException('Missing required connection parameters');
      }

      // Validate token
      if (!token) {
        throw new WsException('Missing authorization token');
      }

      // Verify token with timeout
      const authResult = (await Promise.race([
        this.authService.verifyToken(token),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Authentication timeout')),
            this.connectionTimeout,
          ),
        ),
      ])) as { user_id: string };

      if (!authResult?.user_id) {
        throw new WsException('Invalid authentication');
      }

      const { user_id } = authResult;

      // Add user to room and set up socket
      this.userSocketMapService.addUserToRoom(user_id, postId, client);
      await client.join(postId);

      // Load initial data
      const comments = await this.postService.getAllComments(postId);
      client.emit('newComment', this.stringifyBigInts(comments));

      this.logger.log(
        `Socket connected: ${client.id} for user ${user_id} in room ${postId} ` +
          `(${Date.now() - connectionStart}ms)`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error for ${client.id}: ${error.message}`,
        error.stack,
      );

      // Send error to client before disconnecting
      client.emit('error', {
        status: 'error',
        message: error.message || 'Connection error',
      });

      // Delay slightly to ensure error is sent before disconnecting
      setTimeout(() => {
        if (client.connected) {
          client.disconnect(true);
        }
      }, 100);
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = this.userSocketMapService.getUserIdBySocket(client);
      const postId = String(client.handshake.query.post_id || '');

      if (userId && postId) {
        this.userSocketMapService.removeUserFromRoom(userId, postId);
        this.logger.log(
          `Socket disconnected: ${client.id} (user: ${userId}, room: ${postId})`,
        );
      } else {
        this.logger.log(`Anonymous socket disconnected: ${client.id}`);
      }

      // Clean up any remaining listeners
      client.removeAllListeners();
    } catch (error) {
      this.logger.error(
        `Error during socket disconnection: ${error.message}`,
        error.stack,
      );
    }
  }

  @SubscribeMessage('sendComment')
  async handleComment(client: Socket, payload: any) {
    this.logger.log(
      `Received comment from ${client.id}: ${JSON.stringify(payload)}`,
    );
    try {
      const userId = this.userSocketMapService.getUserIdBySocket(client);
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const postId = client.handshake.query.post_id + '';
      const commentData = {
        ...payload,
        post_id: postId,
        created_by: userId,
      };
      await this.postService.createComment(commentData);
      const comments = await this.postService.getAllComments(postId);

      this.server.to(postId).emit('newComment', this.stringifyBigInts(comments));
      return { status: 'success', data: this.stringifyBigInts(comments) };
    } catch (error) {
      this.logger.error(
        `Error handling comment: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Error sending comment');
    }
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: { postId: string; isTyping: boolean }) {
    this.logger.log(
      `User ${this.userSocketMapService.getUserIdBySocket(client)} is typing...`,
    );
    try {
      const userId = this.userSocketMapService.getUserIdBySocket(client);
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      client.to(payload.postId).emit('userTyping', {
        userId,
        isTyping: payload.isTyping,
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error handling typing event: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Error handling typing event');
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, payload: { commentId: string }) {
    this.logger.log(
      `User ${this.userSocketMapService.getUserIdBySocket(client)} marked comment as read.`,
    );
    try {
      const userId = this.userSocketMapService.getUserIdBySocket(client);
      if (!userId) {
        throw new WsException('Unauthorized');
      }

      // Get the post ID from the handshake
      const postId = client.handshake.query.post_id + '';
      if (!postId) {
        throw new WsException('Post ID is required');
      }

      // In a real implementation, you would update the comment in the database
      // to mark it as read by this user. Since we don't have the actual implementation
      // of the PostsService, we'll just log the action and return success.

      this.logger.log(
        `User ${userId} marked comment ${payload.commentId} as read`,
      );

      // Refresh the comments to get the latest state
      const comments = await this.postService.getAllComments(postId);

      // Broadcast the updated comments to all clients
      this.server.to(postId).emit('newComment', this.stringifyBigInts(comments));

      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error marking comment as read: ${error.message}`,
        error.stack,
      );
      throw new WsException(error.message || 'Error marking comment as read');
    }
  }

  @SubscribeMessage('getAllComments')
  async fetchComments(client: Socket) {
    const postId = client.handshake.query.post_id + '';
    this.logger.log(`Fetching all comments for post ${postId}`);
    const comments = await this.postService.getAllComments(postId);
    client.emit('newComment', this.stringifyBigInts(comments));
  }
}
