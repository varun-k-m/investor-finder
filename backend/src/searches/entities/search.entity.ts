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

/** [Source: docs/architecture.md#Section 4.1 — searches table] */
@Entity('searches')
@Index('idx_searches_user_id', ['user_id'])
@Index('idx_searches_status', ['status'])
export class Search {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  raw_input: string;

  @Column({ type: 'simple-array', nullable: true })
  sectors: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  stages: string[] | null;

  @Column({ type: 'simple-array', nullable: true })
  geo_focus: string[] | null;

  @Column({ type: 'int', nullable: true })
  budget_min: number | null;

  @Column({ type: 'int', nullable: true })
  budget_max: number | null;

  @Column({ type: 'jsonb', nullable: true })
  parsed_idea: Record<string, unknown> | null;

  @Column({ type: 'text', default: 'pending' })
  status: 'pending' | 'running' | 'complete' | 'failed';

  @Column({ type: 'int', default: 0 })
  result_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;
}
