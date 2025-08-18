import { KafkaServiceConstants } from '@constants/kafka.constants';
import { EnhancedExceptionFilter } from '@filter/enhanced-exception.filter';
import { LanguageInterceptor } from '@interceptors/language.interceptor';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnhancedValidationPipe } from '@pipes/enhanced-validation.pipe';
import { registerValidationEnums } from '@utils/validation-enums';
import helmet from 'helmet';
import { logLevel } from 'kafkajs';
import morgan from 'morgan';
import { I18nService } from 'nestjs-i18n';
import { AppModule } from './app.module';

async function bootstrap() {
  // Register enum values for validation messages
  registerValidationEnums();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const i18nService = app.get(I18nService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KafkaServiceConstants.TEST_PRISMA_CLIENT_ID,
        brokers: [
          `${configService.get('KAFKA_HOST')}:${configService.get<string>(
            'KAFKA_PORT',
          )}`,
        ],
        ...KafkaServiceConstants.CLIENT_OPTIONS,
        logLevel: logLevel.NOTHING,
      },
      consumer: {
        groupId: KafkaServiceConstants.TEST_PRISMA_GROUP_ID,
        allowAutoTopicCreation: true,
      },
    },
  });
  app.startAllMicroservices();

  app.use(morgan('dev'));
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  app.use(helmet());
  if (['local', 'dev'].includes(process.env.NODE_ENV)) {
    const config = new DocumentBuilder()
      .setTitle('Company API')
      .setDescription('API for company system - Version 1')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          in: 'header',
          scheme: 'bearer',
          bearerFormat: 'jwt',
        },
        'Token',
      )
      .addGlobalParameters({
        in: 'header',
        name: 'x-custom-lang',
        required: true,
        schema: {
          example: 'en',
        },
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  app.enableCors({
    origin: '*',
    // origin: configService.get<string>('ORIGIN').split(' '),
    // credentials: true,
  });
  app.useGlobalInterceptors(new LanguageInterceptor());
  app.useGlobalFilters(new EnhancedExceptionFilter(app.get(I18nService)));

  // Create enhanced validation pipe with i18n support
  app.useGlobalPipes(new EnhancedValidationPipe(i18nService as any));
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
