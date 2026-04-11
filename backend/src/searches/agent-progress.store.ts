import { Injectable, Logger } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';
import { AgentStage, AgentUpdateEvent } from '../common/types';

interface ProgressEvent {
  type: 'agent_update' | 'complete';
  stage: AgentStage;
  progress: number;
}

/** In-memory singleton store for SSE agent progress subjects. [Source: docs/architecture.md#Section 5.3] */
@Injectable()
export class AgentProgressStore {
  private readonly logger = new Logger(AgentProgressStore.name);
  // ReplaySubject(1) buffers the latest event so late SSE subscribers
  // immediately receive the current stage instead of seeing nothing.
  private readonly subjects = new Map<string, ReplaySubject<ProgressEvent>>();

  getOrCreate(searchId: string): ReplaySubject<ProgressEvent> {
    if (!this.subjects.has(searchId)) {
      this.subjects.set(searchId, new ReplaySubject<ProgressEvent>(1));
    }
    return this.subjects.get(searchId)!;
  }

  emit(searchId: string, stage: AgentStage, progress: number): void {
    // Use getOrCreate so the subject exists even before an SSE client connects;
    // the ReplaySubject will buffer this event and deliver it on subscription.
    const subject = this.getOrCreate(searchId);
    if (!subject.closed) {
      subject.next({ type: 'agent_update', stage, progress });
    }
  }

  complete(searchId: string): void {
    const subject = this.subjects.get(searchId);
    if (subject && !subject.closed) {
      subject.next({ type: 'complete', stage: 'complete', progress: 100 });
      subject.complete();
    }
    // Cleanup after 2 minutes
    setTimeout(() => this.cleanup(searchId), 120_000);
  }

  cleanup(searchId: string): void {
    this.subjects.delete(searchId);
  }
}

// Re-export for convenience
export type { ProgressEvent, AgentUpdateEvent };
