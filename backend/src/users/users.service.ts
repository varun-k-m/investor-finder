import { Injectable } from '@nestjs/common';
import { UsersRepository, UpsertFromClerkDto } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async upsertFromClerk(dto: UpsertFromClerkDto): Promise<void> {
    return this.usersRepository.upsertFromClerk(dto);
  }

  async findByClerkId(clerkId: string) {
    return this.usersRepository.findByClerkId(clerkId);
  }

  async incrementSearchesUsed(userId: string): Promise<void> {
    return this.usersRepository.incrementSearchesUsed(userId);
  }

  async deleteByClerkId(clerkId: string): Promise<void> {
    return this.usersRepository.deleteByClerkId(clerkId);
  }

  async getMonthlySearchCount(userId: string): Promise<number> {
    return this.usersRepository.getMonthlySearchCount(userId);
  }

  async getSavedInvestors(clerkId: string) {
    return this.usersRepository.getSavedInvestors(clerkId);
  }
}
