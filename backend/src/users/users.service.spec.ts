import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockUsersRepository = () => ({
  upsertFromClerk: jest.fn(),
  findByClerkId: jest.fn(),
  incrementSearchesUsed: jest.fn(),
  getMonthlySearchCount: jest.fn(),
  getSavedInvestors: jest.fn(),
  deleteByClerkId: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockUsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(UsersRepository);
  });

  describe('getMonthlySearchCount', () => {
    it('should delegate to usersRepository.getMonthlySearchCount', async () => {
      repo.getMonthlySearchCount.mockResolvedValue(2);
      const result = await service.getMonthlySearchCount('user-uuid');
      expect(repo.getMonthlySearchCount).toHaveBeenCalledWith('user-uuid');
      expect(result).toBe(2);
    });

    it('should return 0 when user has no searches this month', async () => {
      repo.getMonthlySearchCount.mockResolvedValue(0);
      const result = await service.getMonthlySearchCount('user-uuid');
      expect(result).toBe(0);
    });

    it('should return the exact count from the repository', async () => {
      repo.getMonthlySearchCount.mockResolvedValue(3);
      const result = await service.getMonthlySearchCount('user-uuid');
      expect(result).toBe(3);
    });
  });

  describe('deleteByClerkId', () => {
    it('should delegate to usersRepository.deleteByClerkId', async () => {
      repo.deleteByClerkId.mockResolvedValue(undefined);
      await service.deleteByClerkId('clerk_123');
      expect(repo.deleteByClerkId).toHaveBeenCalledWith('clerk_123');
    });

    it('should complete without error when user does not exist', async () => {
      repo.deleteByClerkId.mockResolvedValue(undefined);
      await expect(service.deleteByClerkId('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('findByClerkId', () => {
    it('should return user when found', async () => {
      const user = { id: 'uuid', clerk_id: 'clerk_123', plan: 'free' };
      repo.findByClerkId.mockResolvedValue(user);
      const result = await service.findByClerkId('clerk_123');
      expect(result).toEqual(user);
    });

    it('should return null when not found', async () => {
      repo.findByClerkId.mockResolvedValue(null);
      const result = await service.findByClerkId('nonexistent');
      expect(result).toBeNull();
    });
  });
});
