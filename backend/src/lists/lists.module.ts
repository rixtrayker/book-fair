import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ListsController],
  providers: [ListsService],
})
export class ListsModule {}
