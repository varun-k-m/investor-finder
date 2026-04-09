import { IsString, MinLength } from 'class-validator';

export class CreateSearchDto {
  @IsString()
  @MinLength(20)
  raw_input: string;
}
