import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface UpsertFromClerkDto {
  clerkId: string;
  email: string;
  name: string | null;
}

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async upsertFromClerk(dto: UpsertFromClerkDto): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        clerk_id: dto.clerkId,
        email: dto.email,
        name: dto.name,
      })
      .orUpdate(['email', 'name'], ['clerk_id'])
      .execute();
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.repo.findOne({ where: { clerk_id: clerkId } });
  }
}
