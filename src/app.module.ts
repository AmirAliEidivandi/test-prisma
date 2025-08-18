import { ChatsModule } from '@chats/chats.module';
import { KeycloakConfigModule } from '@config/keycloak/keycloak-config.module';
import { KeycloakConfigService } from '@config/keycloak/keycloak-config.service';
import { EnhancedExceptionFilter } from '@filter/enhanced-exception.filter';
import { RolesGuard } from '@guards/roles.guard';
import { HealthController } from '@health/health.controller';
import { KafkaLoggingInterceptor } from '@interceptors/kafka-logging.interceptor';
import { LanguageInterceptor } from '@interceptors/language.interceptor';
import { MessagesModule } from '@messages/messages.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UserRolesService } from '@services/auth/user-roles.service';
import { KafkaModule } from '@services/kafka/kafka.module';
import { PrismaModule } from '@services/prisma/prisma.module';
import { RedisModule } from '@services/redis/redis.module';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { randomUUID } from 'crypto';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { LoggerModule } from 'nestjs-pino';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL'),
            limit: configService.get<number>('THROTTLE_LIMIT'),
          },
        ],
      }),
    }),
    I18nModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('FALLBACK_LANGUAGE'),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
        typesOutputPath: path.join(
          __dirname,
          '../src/generated/i18n.generated.ts',
        ),
        useTypesOutputPath: true,
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
    KeycloakConnectModule.registerAsync({
      useExisting: KeycloakConfigService,
      inject: [ConfigService],
      imports: [KeycloakConfigModule, ConfigModule],
    }),
    PrismaModule,
    TerminusModule,
    HttpModule,
    SharedModule,
    UsersModule,
    RedisModule,
    ChatsModule,
    MessagesModule,
    KafkaModule,
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: any, res: any) => {
          const headerId = (req.headers['x-request-id'] ||
            req.headers['x-requestid']) as string | undefined;
          const id =
            headerId && typeof headerId === 'string' ? headerId : randomUUID();
          try {
            res.setHeader('x-request-id', id);
          } catch (_) {}
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'HH:MM:ss.l',
                  ignore: 'pid,hostname,context',
                },
              }
            : undefined,
        serializers: {
          req(req: any) {
            return { method: req.method, url: req.url, id: req.id };
          },
          res(res: any) {
            return { statusCode: res.statusCode };
          },
        },
      },
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: EnhancedExceptionFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    UserRolesService,
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: KafkaLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
  ],
})
export class AppModule {}
