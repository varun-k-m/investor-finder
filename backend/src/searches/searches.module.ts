import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Search } from './entities/search.entity';
import { SearchProcessor } from './search.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Search]),
    BullModule.registerQueue({ name: 'search' }),
  ],
  providers: [SearchProcessor],
  exports: [TypeOrmModule, BullModule],
})
export class SearchesModule {}
