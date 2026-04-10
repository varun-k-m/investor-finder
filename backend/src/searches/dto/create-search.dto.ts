import { IsString, IsOptional, IsArray, IsNumber, MinLength, Min } from 'class-validator';

export class CreateSearchDto {
  @IsString()
  @MinLength(20)
  raw_input: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  geo_focus?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_max?: number;
}
