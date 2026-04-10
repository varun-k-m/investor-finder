import { Controller, Delete, Get, HttpCode, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';

/** [Source: docs/architecture.md#Section 5.4] */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/v1/users/me — current user profile + monthly search count */
  @Get('me')
  async getMe(@CurrentUser() user: { sub: string }) {
    const found = await this.usersService.findByClerkId(user.sub);
    if (!found) throw new NotFoundException('User not found');
    const searches_this_month = await this.usersService.getMonthlySearchCount(found.id);
    return { ...found, searches_this_month };
  }

  /** DELETE /api/v1/users/me — GDPR: delete user + all cascaded data */
  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: { sub: string }) {
    await this.usersService.deleteByClerkId(user.sub);
  }

  /** GET /api/v1/users/me/saved — list saved investors with joined profile */
  @Get('me/saved')
  async getSaved(@CurrentUser() user: { sub: string }) {
    return this.usersService.getSavedInvestors(user.sub);
  }
}
