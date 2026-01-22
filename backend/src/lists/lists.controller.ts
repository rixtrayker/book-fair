import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto, AddBookToListDto, UpdateListBookDto, MergeListsDto } from './lists.dto';
import { AuthGuard, AdminGuard } from '../auth/guards';

@Controller('lists')
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Request() req, @Body() dto: CreateListDto) {
    return this.listsService.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@Request() req) {
    return this.listsService.findAll(req.user.userId);
  }

  @Get('public')
  @UseGuards(AdminGuard)
  findPublicLists() {
    return this.listsService.findPublicLists();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Request() req, @Param('id') id: string) {
    return this.listsService.findOne(+id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateListDto) {
    return this.listsService.update(+id, req.user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Request() req, @Param('id') id: string) {
    return this.listsService.remove(+id, req.user.userId);
  }

  @Post(':id/books')
  @UseGuards(AuthGuard)
  addBook(@Request() req, @Param('id') id: string, @Body() dto: AddBookToListDto) {
    return this.listsService.addBook(+id, req.user.userId, dto);
  }

  @Get(':id/books')
  @UseGuards(AuthGuard)
  getListBooks(@Request() req, @Param('id') id: string) {
    return this.listsService.getListBooks(+id, req.user.userId);
  }

  @Put('books/:bookId')
  @UseGuards(AuthGuard)
  updateListBook(@Request() req, @Param('bookId') bookId: string, @Body() dto: UpdateListBookDto) {
    return this.listsService.updateListBook(+bookId, req.user.userId, dto);
  }

  @Delete('books/:bookId')
  @UseGuards(AuthGuard)
  removeListBook(@Request() req, @Param('bookId') bookId: string) {
    return this.listsService.removeListBook(+bookId, req.user.userId);
  }

  @Post('merge')
  @UseGuards(AuthGuard)
  mergeLists(@Request() req, @Body() dto: MergeListsDto) {
    return this.listsService.mergeLists(req.user.userId, dto);
  }
}
