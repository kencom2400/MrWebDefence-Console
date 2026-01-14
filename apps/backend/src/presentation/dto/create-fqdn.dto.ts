/**
 * CreateFqdnDto
 *
 * FQDN作成リクエストのDTO
 */

import { IsString, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateFqdnDto {
  @IsString()
  @MinLength(1)
  @MaxLength(253)
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/, {
    message: 'FQDN must be a valid domain name format (RFC 1123)',
  })
  fqdn: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
