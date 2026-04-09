import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

/** [Source: docs/architecture.md#Section 4.1 — users table] */
@Entity('users')
@Unique(['clerk_id'])
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  clerk_id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', default: 'free' })
  plan: 'free' | 'pro' | 'enterprise';

  @Column({ type: 'int', default: 0 })
  searches_used: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
