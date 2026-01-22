import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PublishersModule } from './publishers/publishers.module';
import { BooksModule } from './books/books.module';
import { ListsModule } from './lists/lists.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    UsersModule,
    PublishersModule,
    BooksModule,
    ListsModule,
    OrdersModule,
  ],
})
export class AppModule {}
