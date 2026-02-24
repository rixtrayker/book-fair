import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PublishersController } from './publishers.controller';
import { PublishersService } from './publishers.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PublishersController],
  providers: [PublishersService],
})
export class PublishersModule {}
