import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsRangeDto } from "./dto/analytics-range.dto";
import { AdminAndDoctors } from "src/auth/decorators/get-user.decorator";

@ApiTags("Analytics")
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  @ApiResponse({ status: 200, description: "Aggregated dashboard analytics for the last N days" })
  getOverview(@AdminAndDoctors() user: string, @Query() analyticsRangeDto: AnalyticsRangeDto) {
    return this.analyticsService.getOverview(analyticsRangeDto.days);
  }

  @Get("insights")
  @ApiResponse({ status: 200, description: "Operational insights: KPI deltas, peak hours, doctor performance, no-show risk" })
  getInsights(@AdminAndDoctors() user: string, @Query() analyticsRangeDto: AnalyticsRangeDto) {
    return this.analyticsService.getInsights(analyticsRangeDto.days);
  }

  @Get("no-show-risk")
  @ApiResponse({ status: 200, description: "No-show risk levels for upcoming appointments (next 7 days)" })
  getNoShowRisk(@AdminAndDoctors() user: string) {
    return this.analyticsService.getNoShowRisk();
  }
}
