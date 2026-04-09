import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['saved', 'contacted', 'replied', 'passed'])
  status: 'saved' | 'contacted' | 'replied' | 'passed';
}
