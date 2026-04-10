import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { Search } from '../../searches/entities/search.entity';

/** [Source: docs/architecture.md#Section 12] */
@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly FREE_LIMIT = 3;

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Search) private readonly searchRepo: Repository<Search>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clerkSub = request.user?.sub;
    if (!clerkSub) throw new UnauthorizedException();

    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    if (user.plan !== 'free') return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.searchRepo.count({
      where: {
        user_id: user.id,
        created_at: MoreThanOrEqual(startOfMonth),
      },
    });

    if (count >= this.FREE_LIMIT) {
      throw new HttpException(
        { message: 'Monthly search limit reached. Upgrade to Pro for unlimited searches.' },
        429,
      );
    }

    return true;
  }
}
