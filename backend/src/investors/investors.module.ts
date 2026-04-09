import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestorProfile } from './entities/investor-profile.entity';
import { SavedInvestor } from './entities/saved-investor.entity';
import { PitchDraft } from './entities/pitch-draft.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InvestorProfile, SavedInvestor, PitchDraft])],
  exports: [TypeOrmModule],
})
export class InvestorsModule {}
