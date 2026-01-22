import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto } from './books.dto';
import { AuthGuard, AdminGuard } from '../auth/guards';

@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Query('search') search?: string) {
    if (search) {
      return this.booksService.search(search);
    }
    return this.booksService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.booksService.remove(+id);
  }
}
