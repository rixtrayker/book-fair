import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateTrackingDto, CreateOrderDto, UpdateOrderDto, AssignCollectorDto } from './orders.dto';
import { AuthGuard, CollectorGuard, RolesGuard } from '../common/guards';
import { User, Roles, Language } from '../common/decorators';
import { IUser } from '../common/interfaces';
import { UserRole } from '../common/constants';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('tracking')
  @UseGuards(CollectorGuard)
  updateTracking(
    @User('userId') userId: number,
    @Body() dto: UpdateTrackingDto,
    @Language() lang: string
  ) {
    return this.ordersService.updateTracking(userId, dto, lang);
  }

  @Get('admin-view')
  @UseGuards(CollectorGuard)
  getAdminView(
    @Query('hall') hall?: string,
    @Query('booth') booth?: string,
    @Query('priority') priority?: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getAdminView({
      hall,
      booth,
      priority: priority ? +priority : undefined,
      status,
    });
  }

  @Post()
  @UseGuards(CollectorGuard)
  createOrder(
    @User('userId') userId: number,
    @Body() dto: CreateOrderDto,
    @Language() lang: string
  ) {
    return this.ordersService.createOrder(userId, dto, lang);
  }

  @Get('my-orders')
  getUserOrders(@User('userId') userId: number) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get()
  @UseGuards(CollectorGuard)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  getOrder(
    @Param('id', ParseIntPipe) id: number,
    @User() user: IUser,
    @Language() lang: string
  ) {
    return this.ordersService.getOrderWithAccessCheck(id, user, lang);
  }

  @Put(':id')
  @UseGuards(CollectorGuard)
  updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @Language() lang: string
  ) {
    return this.ordersService.updateOrder(id, dto, lang);
  }

  @Post(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COLLECTOR)
  @UseGuards(RolesGuard)
  assignCollector(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignCollectorDto,
    @Language() lang: string
  ) {
    return this.ordersService.assignCollector(id, dto.collectorId, lang);
  }

  @Delete(':id/assign')
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  unassignCollector(
    @Param('id', ParseIntPipe) id: number,
    @Language() lang: string
  ) {
    return this.ordersService.unassignCollector(id, lang);
  }
}
