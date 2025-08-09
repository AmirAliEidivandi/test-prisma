import { ChatsModule } from '@chats/chats.module';
import { KeycloakConfigModule } from '@config/keycloak/keycloak-config.module';
import { KeycloakConfigService } from '@config/keycloak/keycloak-config.service';
import { setModuleRef } from '@decorators/user.decorator';
import { EnhancedExceptionFilter } from '@filter/enhanced-exception.filter';
import { HealthController } from '@health/health.controller';
import { MessagesModule } from '@messages/messages.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, ModuleRef } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@services/prisma/prisma.module';
import { SharedModule } from '@shared/shared.module';
import { UsersModule } from '@users/users.module';
import { AuthGuard, KeycloakConnectModule } from 'nest-keycloak-connect';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesGuard } from '@guards/roles.guard';
import { RedisModule } from '@services/redis/redis.module';

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
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: EnhancedExceptionFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  constructor(private readonly moduleRef: ModuleRef) {}
  onModuleInit() {
    setModuleRef(this.moduleRef);
  }
}
