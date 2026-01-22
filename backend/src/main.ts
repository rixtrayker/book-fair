import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { initDatabase } from './database';

async function bootstrap() {
  await initDatabase();
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
