import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestorProfile } from './entities/investor-profile.entity';
import { SavedInvestor } from './entities/saved-investor.entity';
import { PitchDraft } from './entities/pitch-draft.entity';
import { InvestorsController } from './investors.controller';
import { InvestorsService } from './investors.service';
import { UsersModule } from '../users/users.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvestorProfile, SavedInvestor, PitchDraft]),
    UsersModule,
    AgentsModule,
  ],
  controllers: [InvestorsController],
  providers: [InvestorsService],
  exports: [TypeOrmModule, InvestorsService],
})
export class InvestorsModule {}
