import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "src/common/dto/pagination-query.dto";
import { RecordTypeEnum } from "src/common/enums/record-type.enum";

export class QueryRecordsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: RecordTypeEnum })
  @IsOptional()
  @IsEnum(RecordTypeEnum)
  type?: RecordTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
