import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InvestorProfile } from './investor-profile.entity';

/** [Source: docs/architecture.md#Section 4.1 — pitch_drafts table] */
@Entity('pitch_drafts')
export class PitchDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  investor_id: string;

  @ManyToOne(() => InvestorProfile)
  @JoinColumn({ name: 'investor_id' })
  investor: InvestorProfile;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
