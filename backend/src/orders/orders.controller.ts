import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateTrackingDto, CreateOrderDto, UpdateOrderDto } from './orders.dto';
import { AuthGuard, AdminGuard } from '../auth/guards';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('tracking')
  @UseGuards(AdminGuard)
  updateTracking(@Request() req, @Body() dto: UpdateTrackingDto) {
    return this.ordersService.updateTracking(req.user.userId, dto);
  }

  @Get('admin-view')
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
  createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, dto);
  }

  @Get('my-orders')
  @UseGuards(AuthGuard)
  getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  @Get()
  @UseGuards(AdminGuard)
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(+id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(+id, dto);
  }
}
