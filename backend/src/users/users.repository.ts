import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SavedInvestor } from '../investors/entities/saved-investor.entity';

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
    @InjectRepository(SavedInvestor)
    private readonly savedInvestorRepo: Repository<SavedInvestor>,
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

  async incrementSearchesUsed(userId: string): Promise<void> {
    await this.repo.increment({ id: userId }, 'searches_used', 1);
  }

  async getSavedInvestors(clerkId: string): Promise<SavedInvestor[]> {
    const user = await this.findByClerkId(clerkId);
    if (!user) return [];
    return this.savedInvestorRepo.find({
      where: { user_id: user.id },
      relations: ['investor'],
      order: { created_at: 'DESC' },
    });
  }
}
