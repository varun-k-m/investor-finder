import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InvestorProfile } from './investor-profile.entity';

/** [Source: docs/architecture.md#Section 4.1 — saved_investors table] */
@Entity('saved_investors')
@Index('idx_saved_investors_user_id', ['user_id'])
export class SavedInvestor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  investor_id: string;

  @ManyToOne(() => InvestorProfile)
  @JoinColumn({ name: 'investor_id' })
  investor: InvestorProfile;

  @Column({ type: 'text', default: 'saved' })
  status: 'saved' | 'contacted' | 'replied' | 'passed';

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
