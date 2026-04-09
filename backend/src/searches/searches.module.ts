import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Search } from './entities/search.entity';
import { InvestorProfile } from '../investors/entities/investor-profile.entity';
import { SearchProcessor } from './search.processor';
import { SearchesController } from './searches.controller';
import { SearchesService } from './searches.service';
import { AgentProgressStore } from './agent-progress.store';
import { AgentsModule } from '../agents/agents.module';
import { UsersModule } from '../users/users.module';
import { QuotaGuard } from '../common/guards/quota.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Search, InvestorProfile]),
    BullModule.registerQueue({ name: 'search' }),
    AgentsModule,
    UsersModule,
  ],
  controllers: [SearchesController],
  providers: [SearchProcessor, SearchesService, AgentProgressStore, QuotaGuard],
  exports: [TypeOrmModule, BullModule, SearchesService],
})
export class SearchesModule {}
