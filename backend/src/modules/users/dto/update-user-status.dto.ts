import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserStatusEnum } from "src/common/enums/status.enum";

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatusEnum })
  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}
