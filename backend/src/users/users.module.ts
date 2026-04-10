import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { SavedInvestor } from '../investors/entities/saved-investor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SavedInvestor])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
