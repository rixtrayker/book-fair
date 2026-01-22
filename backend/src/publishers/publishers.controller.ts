import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PublishersService } from './publishers.service';
import { CreatePublisherDto, UpdatePublisherDto } from './publishers.dto';
import { AuthGuard, AdminGuard } from '../auth/guards';

@Controller('publishers')
export class PublishersController {
  constructor(private publishersService: PublishersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePublisherDto) {
    return this.publishersService.create(dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.publishersService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.publishersService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePublisherDto) {
    return this.publishersService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.publishersService.remove(+id);
  }
}
