import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto, AddBookToListDto, UpdateListBookDto, MergeListsDto, InviteCollectorDto, AssignCollectorDto, RespondInvitationDto } from './lists.dto';
import { AuthGuard, CollectorGuard, RolesGuard } from '../common/guards';
import { User, Roles, Language } from '../common/decorators';
import { IUser } from '../common/interfaces';
import { UserRole } from '../common/constants';

@Controller('lists')
@UseGuards(AuthGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post()
  create(@User('userId') userId: number, @Body() dto: CreateListDto) {
    return this.listsService.create(userId, dto);
  }

  @Get()
  findAll(@User('userId') userId: number) {
    return this.listsService.findAll(userId);
  }

  @Get('public')
  @UseGuards(CollectorGuard)
  findPublicLists(@User() user: IUser) {
    return this.listsService.findPublicLists(user);
  }

  @Get('shared/:token')
  findByShareToken(@Param('token') token: string, @User() user: IUser) {
    return this.listsService.findByShareToken(token, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @User() user: IUser) {
    return this.listsService.findOneWithAccess(id, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @Body() dto: UpdateListDto
  ) {
    return this.listsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @User('userId') userId: number) {
    return this.listsService.remove(id, userId);
  }

  @Post(':id/books')
  addBook(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @Body() dto: AddBookToListDto
  ) {
    return this.listsService.addBook(id, userId, dto);
  }

  @Get(':id/books')
  getListBooks(@Param('id', ParseIntPipe) id: number, @User() user: IUser) {
    return this.listsService.getListBooks(id, user);
  }

  @Put('books/:bookId')
  updateListBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @User() user: IUser,
    @Body() dto: UpdateListBookDto
  ) {
    return this.listsService.updateListBook(bookId, user, dto);
  }

  @Delete('books/:bookId')
  removeListBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @User('userId') userId: number
  ) {
    return this.listsService.removeListBook(bookId, userId);
  }

  @Post('merge')
  mergeLists(@User('userId') userId: number, @Body() dto: MergeListsDto) {
    return this.listsService.mergeLists(userId, dto);
  }

  @Post(':id/invite')
  inviteCollector(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @Body() dto: InviteCollectorDto
  ) {
    return this.listsService.inviteCollector(id, userId, dto);
  }

  @Post(':id/invitation/respond')
  respondToInvitation(
    @Param('id', ParseIntPipe) id: number,
    @User() user: IUser,
    @Body() dto: RespondInvitationDto
  ) {
    return this.listsService.respondToInvitation(id, user, dto.accept);
  }

  @Post(':id/assign')
  assignCollectorToList(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number,
    @Body() dto: AssignCollectorDto
  ) {
    return this.listsService.assignCollectorToList(id, userId, dto);
  }

  @Delete(':id/assign')
  unassignCollectorFromList(
    @Param('id', ParseIntPipe) id: number,
    @User('userId') userId: number
  ) {
    return this.listsService.unassignCollectorFromList(id, userId);
  }

  @Post(':id/books/:bookId/assign')
  assignCollectorToBook(
    @Param('id', ParseIntPipe) listId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
    @User('userId') userId: number,
    @Body() dto: AssignCollectorDto
  ) {
    return this.listsService.assignCollectorToBook(listId, bookId, userId, dto);
  }

  @Delete(':id/books/:bookId/assign')
  unassignCollectorFromBook(
    @Param('id', ParseIntPipe) listId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
    @User('userId') userId: number
  ) {
    return this.listsService.unassignCollectorFromBook(listId, bookId, userId);
  }

  @Post(':id/books/:bookId/claim')
  @UseGuards(CollectorGuard)
  claimBook(
    @Param('id', ParseIntPipe) listId: number,
    @Param('bookId', ParseIntPipe) bookId: number,
    @User() user: IUser
  ) {
    return this.listsService.claimBook(listId, bookId, user);
  }
}
