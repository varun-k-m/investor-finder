import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SavedInvestor } from '../investors/entities/saved-investor.entity';
import { Search } from '../searches/entities/search.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SavedInvestor, Search])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
