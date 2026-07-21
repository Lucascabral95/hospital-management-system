import { Controller, Get, Patch, Param, Query, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { PayloadJwtDto } from "src/auth/dto";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiResponse({ status: 200, description: "Paginated notifications for the current user" })
  findAll(@Req() req: { user: PayloadJwtDto }, @Query() paginationDto: PaginationDto) {
    return this.notificationsService.findAllForUser(req.user.id, paginationDto);
  }

  @Patch(":id/read")
  @ApiResponse({ status: 200, description: "Marks a single notification as read" })
  markRead(@Req() req: { user: PayloadJwtDto }, @Param("id") id: string) {
    return this.notificationsService.markRead(+id, req.user.id);
  }

  @Patch("read-all")
  @ApiResponse({ status: 200, description: "Marks every unread notification for the user as read" })
  markAllRead(@Req() req: { user: PayloadJwtDto }) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
