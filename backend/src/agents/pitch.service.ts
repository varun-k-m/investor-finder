import { Injectable, Logger } from '@nestjs/common';

/** Stub — implemented in S3-006 */
@Injectable()
export class PitchService {
  private readonly logger = new Logger(PitchService.name);

  async generate(_investorId: string, _userId: string): Promise<string> {
    this.logger.log('PitchService.generate stub — implemented in S3-006');
    return '';
  }
}
