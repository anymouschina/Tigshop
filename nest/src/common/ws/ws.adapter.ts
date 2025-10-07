// @ts-nocheck
import { INestApplicationContext, Logger } from '@nestjs/common';
import { WebSocketAdapter, MessageMappingProperties } from '@nestjs/websockets';
import { EMPTY, fromEvent, Observable } from 'rxjs';
import { filter, first, mergeMap } from 'rxjs/operators';
import { Server } from 'ws';

export class WsAdapter implements WebSocketAdapter {
  private readonly logger = new Logger(WsAdapter.name);
  constructor(private app: INestApplicationContext) {}

  create(port: number, options: any = {}): any {
    const server = new Server({ port, ...options });
    this.logger.log(`WS Server started on port ${port}`);
    return server;
  }

  bindClientConnect(server: Server, callback: Function) {
    server.on('connection', (socket, request) => callback(socket, request));
  }

  bindMessageHandlers(client: any, handlers: MessageMappingProperties[], transform: (data: any) => Observable<any>) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap((raw: any) => {
          let message: any = raw?.data ?? raw;
          if (Buffer.isBuffer(message)) message = message.toString('utf8');
          try { message = JSON.parse(message); } catch {}
          const event = message?.event || message?.type;
          const payload = message?.data ?? message?.payload ?? message;
          const mapping = handlers.find(h => h.message === event);
          if (!mapping) return EMPTY;
          return transform(payload).pipe(filter((res: any) => res !== undefined));
        }),
      )
      .subscribe(response => {
        if (!response) return;
        try { client.send(JSON.stringify(response)); } catch {}
      });
  }

  close(server: Server) {
    try { server.close(); } catch {}
  }

  // Optional for compatibility
  dispose() {}
}