import { SearchProcessor } from './search.processor';
import { Job } from 'bull';

describe('SearchProcessor', () => {
  let processor: SearchProcessor;
  let discoveryService: { run: jest.Mock };

  beforeEach(() => {
    discoveryService = { run: jest.fn().mockResolvedValue(undefined) };
    processor = new SearchProcessor(discoveryService as any);
  });

  it('handles a job and calls discoveryService.run (AC: 4)', async () => {
    const job = { id: 'job-123', data: { searchId: 'search-1', parsedIdea: {} } } as unknown as Job;
    await expect(processor.handleSearch(job)).resolves.toBeUndefined();
    expect(discoveryService.run).toHaveBeenCalledWith('search-1', {});
  });

  it('logs the job id (AC: 4)', async () => {
    const spy = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const job = { id: 'job-456', data: { searchId: 'search-2', parsedIdea: {} } } as unknown as Job;
    await processor.handleSearch(job);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('job-456'));
  });
});
