import { ProjectStatus, ProjectVisibility } from '@rekode/types/server/proto/project';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  fileSystemPath?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  containerUrl?: string;
}
