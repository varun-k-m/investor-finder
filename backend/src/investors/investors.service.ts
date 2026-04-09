import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestorProfile } from './entities/investor-profile.entity';
import { SavedInvestor } from './entities/saved-investor.entity';
import { PitchDraft } from './entities/pitch-draft.entity';
import { UsersService } from '../users/users.service';
import { PitchService } from '../agents/pitch.service';

/** [Source: docs/architecture.md#Section 5.3] */
@Injectable()
export class InvestorsService {
  constructor(
    @InjectRepository(InvestorProfile)
    private readonly investorRepo: Repository<InvestorProfile>,
    @InjectRepository(SavedInvestor)
    private readonly savedRepo: Repository<SavedInvestor>,
    @InjectRepository(PitchDraft)
    private readonly pitchDraftRepo: Repository<PitchDraft>,
    private readonly usersService: UsersService,
    private readonly pitchService: PitchService,
  ) {}

  /** AC: S3-004 1–4 */
  async saveInvestor(investorId: string, clerkSub: string): Promise<SavedInvestor> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    const investor = await this.investorRepo.findOne({ where: { id: investorId } });
    if (!investor) throw new NotFoundException('Investor not found');

    const existing = await this.savedRepo.findOne({
      where: { user_id: user.id, investor_id: investorId },
    });
    if (existing) return existing;

    return this.savedRepo.save(
      this.savedRepo.create({ user_id: user.id, investor_id: investorId, status: 'saved' }),
    );
  }

  /** AC: S3-005 1–4 */
  async updateStatus(
    investorId: string,
    clerkSub: string,
    status: 'saved' | 'contacted' | 'replied' | 'passed',
  ): Promise<SavedInvestor> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    const saved = await this.savedRepo.findOne({
      where: { user_id: user.id, investor_id: investorId },
    });
    if (!saved) throw new NotFoundException('Investor not saved by this user');

    saved.status = status;
    return this.savedRepo.save(saved);
  }

  /** AC: S3-006 1–5 */
  async generatePitch(investorId: string, clerkSub: string): Promise<PitchDraft> {
    const user = await this.usersService.findByClerkId(clerkSub);
    if (!user) throw new UnauthorizedException();

    const investor = await this.investorRepo.findOne({ where: { id: investorId } });
    if (!investor) throw new NotFoundException('Investor not found');

    const content = await this.pitchService.generate(investor, user.id);

    const lastDraft = await this.pitchDraftRepo.findOne({
      where: { user_id: user.id, investor_id: investorId },
      order: { version: 'DESC' },
    });
    const version = (lastDraft?.version ?? 0) + 1;

    return this.pitchDraftRepo.save(
      this.pitchDraftRepo.create({ user_id: user.id, investor_id: investorId, content, version }),
    );
  }
}
