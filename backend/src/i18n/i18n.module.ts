import { I18nModule as NestI18nModule, I18nJsonLoader, QueryResolver } from 'nestjs-i18n';
import { Module } from '@nestjs/common';
import { join } from 'path';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path: join(__dirname, '..', 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
      ],
    }),
  ],
  exports: [NestI18nModule],
})
export class I18nModule {}
