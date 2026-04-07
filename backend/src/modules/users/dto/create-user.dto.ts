import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/common/enums/role.enum";
import { UserStatusEnum } from "src/common/enums/status.enum";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ enum: UserStatusEnum, required: false })
  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;
}
