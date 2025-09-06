import { ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    if (exception instanceof WsException) {
      this.logger.error(
        `WebSocket error for client ${client.id}: ${exception.message}`,
      );
      client.emit('error', {
        status: 'error',
        message: exception.message || 'Internal server error',
      });
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unexpected WebSocket error for client ${client.id}: ${exception.message}`,
        exception.stack,
      );
      client.emit('error', {
        status: 'error',
        message: 'Internal server error',
      });
    } else {
      this.logger.error(
        `Unknown WebSocket error for client ${client.id}`,
        exception,
      );
      client.emit('error', {
        status: 'error',
        message: 'Internal server error',
      });
    }

    // Close the connection if it's still open
    if (client.connected) {
      client.disconnect(true);
    }
  }
}
