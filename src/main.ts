import { HttpExceptionFilter } from '@filter/http-exception.filter';
import {
  HttpException,
  HttpStatus,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import morgan from 'morgan';
import { I18nService } from 'nestjs-i18n';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       clientId: KafkaServiceConstants.COMPANY_CLIENT_ID,
  //       brokers: [
  //         `${configService.get('KAFKA_HOST')}:${configService.get<string>(
  //           'KAFKA_PORT',
  //         )}`,
  //       ],
  //       ...KafkaServiceConstants.CLIENT_OPTIONS,
  //       logLevel: logLevel.NOTHING,
  //     },
  //     consumer: {
  //       groupId: KafkaServiceConstants.COMPANY_GROUP_ID,
  //       allowAutoTopicCreation: true,
  //     },
  //   },
  // });
  // app.startAllMicroservices();

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
    origin: configService.get<string>('ORIGIN').split(' '),
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter(app.get(I18nService)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new HttpException(
          {
            message: 'Validation failed',
            errors: errors.map((error) => ({
              field: error.property,
              constraints: error.constraints,
            })),
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
