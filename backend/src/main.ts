import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initDatabase } from './database';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';
import { I18nService } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  await initDatabase(configService);
  
  app.enableCors();
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const i18nService = app.get<I18nService>(I18nService);
  app.useGlobalFilters(new I18nExceptionFilter(i18nService));
  
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const config = new DocumentBuilder()
    .setTitle('Kotobgy API')
    .setDescription('Book Sourcing & Fair Management Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('books', 'Book pool management')
    .addTag('lists', 'User book lists')
    .addTag('orders', 'Order management')
    .addTag('publishers', 'Publisher management')
    .addTag('notifications', 'User notifications')
    .addTag('users', 'User management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  app.use(express.static(join(__dirname, '..', 'public')));
  
  app.use((req, res, next) => {
    if (!req.path.startsWith('/' + apiPrefix.split('/')[0])) {
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    } else {
      next();
    }
  });
  
  const port = configService.get<number>('port') || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on http://0.0.0.0:${port}`);
  console.log(`API Documentation: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
