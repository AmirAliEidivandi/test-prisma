import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { QueryUserDto } from '@users/dto/query-user.dto';
import { UsersService } from '@users/users.service';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'events',
})
export class EventsGateway {
  constructor(private readonly usersService: UsersService) {}
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('msgToServer')
  handleMessage(@MessageBody() message: string): void {
    console.log('Received:', message);
    this.server.emit('msgToClient', message); // broadcast back
  }
}
