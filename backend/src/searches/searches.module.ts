import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Search } from './entities/search.entity';
import { SearchProcessor } from './search.processor';
import { SearchesController } from './searches.controller';
import { SearchesService } from './searches.service';
import { AgentProgressStore } from './agent-progress.store';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Search]),
    BullModule.registerQueue({ name: 'search' }),
    AgentsModule,
  ],
  controllers: [SearchesController],
  providers: [SearchProcessor, SearchesService, AgentProgressStore],
  exports: [TypeOrmModule, BullModule, SearchesService],
})
export class SearchesModule {}
