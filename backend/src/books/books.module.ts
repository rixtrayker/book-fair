import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
