import { Body, Controller, HttpCode, Param, Post, Put } from '@nestjs/common';
import { InvestorsService } from './investors.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';

/** [Source: docs/architecture.md#Section 5.3] */
@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  /** S3-004: AC 1–4 */
  @Post(':id/save')
  @HttpCode(201)
  async save(
    @Param('id') investorId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.investorsService.saveInvestor(investorId, user.sub);
  }

  /** S3-005: AC 1–4 */
  @Put(':id/status')
  async updateStatus(
    @Param('id') investorId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.investorsService.updateStatus(investorId, user.sub, dto.status);
  }

  /** S3-006: AC 1–5 */
  @Post(':id/pitch')
  @HttpCode(201)
  async generatePitch(
    @Param('id') investorId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.investorsService.generatePitch(investorId, user.sub);
  }
}
