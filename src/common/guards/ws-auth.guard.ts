import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@services/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: any = context.switchToWs().getClient();

    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException(this.i18n.t('exception.errors.auth.MISSING_AUTH_TOKEN'));

    const publicKey = this.configService.get<string>('KEYCLOAK_PUBLIC_KEY');
    if (!publicKey) throw new UnauthorizedException(this.i18n.t('exception.errors.auth.MISSING_PUBLIC_KEY'));

    let decoded: any;
    try {
      decoded = jwt.verify(token, this.toPem(publicKey), {
        algorithms: ['RS256'],
      });
    } catch (e) {
      throw new UnauthorizedException(this.i18n.t('exception.errors.auth.INVALID_TOKEN'));
    }

    // Find user by Keycloak subject (sub) mapped to our User.kid
    const user = await this.prisma.user.findFirst({
      where: { kid: decoded.sub, deletedAt: null } as any,
    });
    if (!user) throw new UnauthorizedException(this.i18n.t('exception.errors.auth.USER_NOT_REGISTERED'));

    client.data = client.data || {};
    client.data.authUser = user;
    client.data.token = decoded;
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
    // Accept both PEM and raw base64 (Keycloak UI often gives raw without header/footer)
    if (key.includes('BEGIN PUBLIC KEY')) return key;
    const formatted = key.match(/.{1,64}/g)?.join('\n');
    return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
  }
}
