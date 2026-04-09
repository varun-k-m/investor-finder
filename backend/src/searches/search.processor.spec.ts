import { SearchProcessor } from './search.processor';
import { Job } from 'bull';

describe('SearchProcessor', () => {
  let processor: SearchProcessor;

  beforeEach(() => {
    processor = new SearchProcessor();
  });

  it('handles a job and resolves without error (AC: 4)', async () => {
    const job = { id: 'job-123' } as unknown as Job;
    await expect(processor.handleSearch(job)).resolves.toBeUndefined();
  });

  it('logs the job id (AC: 4)', async () => {
    const spy = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const job = { id: 'job-456' } as unknown as Job;
    await processor.handleSearch(job);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('job-456'));
  });
});
