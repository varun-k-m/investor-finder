import { Controller, Param, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SearchesService, SseMessageEvent } from './searches.service';
import { Public } from '../auth/public.decorator';

/** [Source: docs/architecture.md#Section 7.4] */
@Controller('searches')
export class SearchesController {
  constructor(private readonly searchesService: SearchesService) {}

  @Sse(':id/stream')
  @Public()
  stream(@Param('id') id: string): Observable<SseMessageEvent> {
    return this.searchesService.getProgressStream(id);
  }
}
