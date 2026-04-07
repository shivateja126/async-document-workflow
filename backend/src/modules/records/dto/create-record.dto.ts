import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { RecordTypeEnum } from "src/common/enums/record-type.enum";

export class CreateRecordDto {
  @ApiProperty({ example: 4500.25 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: RecordTypeEnum })
  @IsEnum(RecordTypeEnum)
  type!: RecordTypeEnum;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty({ example: "2026-04-01T00:00:00.000Z" })
  @IsDateString()
  date!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
