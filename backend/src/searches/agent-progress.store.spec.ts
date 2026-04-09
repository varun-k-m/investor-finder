import { AgentProgressStore } from './agent-progress.store';

describe('AgentProgressStore', () => {
  let store: AgentProgressStore;

  beforeEach(() => { store = new AgentProgressStore(); });

  it('emits agent_update then complete event (AC: 3, 4)', (done) => {
    const subject = store.getOrCreate('search-1');
    const events: unknown[] = [];
    subject.subscribe({
      next: (e) => events.push(e),
      complete: () => {
        expect(events).toHaveLength(2);
        expect((events[0] as any).type).toBe('agent_update');
        expect((events[0] as any).stage).toBe('searching');
        expect((events[1] as any).type).toBe('complete');
        done();
      },
    });
    store.emit('search-1', 'searching', 20);
    store.complete('search-1');
  });

  it('returns same subject on second getOrCreate (AC: 3)', () => {
    const a = store.getOrCreate('search-2');
    const b = store.getOrCreate('search-2');
    expect(a).toBe(b);
  });

  it('complete closes subject (AC: 5)', (done) => {
    store.getOrCreate('search-3').subscribe({ complete: () => done() });
    store.complete('search-3');
  });

  it('emit is a no-op for unknown searchId (AC: 4)', () => {
    expect(() => store.emit('unknown', 'searching', 10)).not.toThrow();
  });
});
