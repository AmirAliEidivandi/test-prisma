import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@services/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsOptionalAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: any = context.switchToWs().getClient();

    const token = this.extractToken(client);
    if (!token) {
      // Anonymous path allowed
      client.data = client.data || {};
      client.data.isAnonymous = true;
      return true;
    }

    const publicKey = this.configService.get<string>('KEYCLOAK_PUBLIC_KEY');
    if (!publicKey) throw new UnauthorizedException('Missing public key');

    let decoded: any;
    try {
      decoded = jwt.verify(token, this.toPem(publicKey), {
        algorithms: ['RS256'],
      });
    } catch (e) {
      // If invalid token, treat as anonymous
      client.data = client.data || {};
      client.data.isAnonymous = true;
      return true;
    }

    // Authenticated user
    const user = await this.prisma.user.findFirst({
      where: { kid: decoded.sub, deleted_at: null } as any,
    });
    if (!user) {
      client.data = client.data || {};
      client.data.isAnonymous = true;
      return true;
    }

    client.data = client.data || {};
    client.data.authUser = user;
    client.data.token = decoded;
    client.data.isAnonymous = false;
    return true;
  }

  private extractToken(client: any): string | null {
    const fromAuth = client.handshake?.auth?.token as string | undefined;
    if (fromAuth) return this.stripBearer(fromAuth);
    const header = client.handshake?.headers?.authorization as
      | string
      | undefined;
    if (header) return this.stripBearer(header);
    return null;
  }

  private stripBearer(value: string): string {
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }

  private toPem(key: string): string {
    if (key.includes('BEGIN PUBLIC KEY')) return key;
    const formatted = key.match(/.{1,64}/g)?.join('\n');
    return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
  }
}

