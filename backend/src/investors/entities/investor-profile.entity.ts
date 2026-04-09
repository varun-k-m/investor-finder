import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Search } from '../../searches/entities/search.entity';

/** [Source: docs/architecture.md#Section 4.1 — investor_profiles table] */
@Entity('investor_profiles')
@Index('idx_investor_profiles_search_id', ['search_id'])
@Index('idx_investor_profiles_fit_score', ['fit_score'])
export class InvestorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  search_id: string;

  @ManyToOne(() => Search, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'search_id' })
  search: Search;

  @Column({ type: 'text' })
  canonical_name: string;

  @Column({ type: 'text', nullable: true })
  fund_name: string | null;

  @Column({ type: 'text', nullable: true })
  website: string | null;

  @Column('text', { array: true, nullable: true })
  sectors: string[] | null;

  @Column('text', { array: true, nullable: true })
  stages: string[] | null;

  @Column('text', { array: true, nullable: true })
  geo_focus: string[] | null;

  @Column({ type: 'bigint', nullable: true })
  check_min: number | null;

  @Column({ type: 'bigint', nullable: true })
  check_max: number | null;

  @Column({ type: 'text', nullable: true })
  contact_email: string | null;

  @Column({ type: 'text', nullable: true })
  linkedin_url: string | null;

  @Column({ type: 'text', nullable: true })
  twitter_url: string | null;

  @Column('text', { array: true, nullable: true })
  sources: string[] | null;

  @Column('text', { array: true, nullable: true })
  source_urls: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  raw_data: Record<string, unknown> | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  fit_score: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  sector_fit: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  stage_fit: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  budget_fit: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  geo_fit: number | null;

  @Column({ type: 'text', nullable: true })
  fit_reasoning: string | null;

  @Column({ type: 'int', nullable: true })
  rank_position: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
