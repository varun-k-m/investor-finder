import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';

/** [Source: docs/architecture.md#Section 5.4] */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/v1/users/me/saved — list saved investors with joined profile */
  @Get('me/saved')
  async getSaved(@CurrentUser() user: { sub: string }) {
    return this.usersService.getSavedInvestors(user.sub);
  }
}
