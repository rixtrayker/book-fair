import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, BookSearchDto } from './books.dto';
import { AuthGuard, CollectorGuard, SuperAdminGuard } from '../common/guards';

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
@UseGuards(AuthGuard)
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Post()
  @UseGuards(CollectorGuard)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search books with relevance ranking' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 1 char)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 20, max 50)', example: 20 })
  @ApiResponse({ status: 200, description: 'Search results with relevance scores' })
  search(
    @Query() query: BookSearchDto
  ) {
    const limit = Math.min(query.limit || 20, 50);
    return this.booksService.search(query.q, limit);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.booksService.findAll(page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book found' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @UseGuards(CollectorGuard)
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(CollectorGuard)
  @ApiOperation({ summary: 'Soft delete a book' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }

  @Post(':id/restore')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Restore a soft-deleted book (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'Book ID' })
  @ApiResponse({ status: 200, description: 'Book restored successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.restore(id);
  }
}
