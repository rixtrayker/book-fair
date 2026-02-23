import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PublishersService } from './publishers.service';
import { CreatePublisherDto, UpdatePublisherDto } from './publishers.dto';
import { AuthGuard, CollectorGuard } from '../common/guards';

@Controller('publishers')
@UseGuards(AuthGuard)
export class PublishersController {
  constructor(private publishersService: PublishersService) {}

  @Post()
  @UseGuards(CollectorGuard)
  create(@Body() dto: CreatePublisherDto) {
    return this.publishersService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.publishersService.findAll(page ? +page : 1, limit ? +limit : 20);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(CollectorGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePublisherDto) {
    return this.publishersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(CollectorGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publishersService.remove(id);
  }
}
